import time
import logging
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Request, status
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from google.genai import errors

from app.config import get_settings
from app.services.care_matching import enrich_diagnosis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])

class GeminiAnalysisResult(BaseModel):
    report_id: str = Field(description="Unique ID for the report, e.g. HB-2026-XXXX")
    emergency_level: str = Field(description="One of: 'low', 'moderate', 'high', 'critical'")
    primary_diagnosis: str = Field(description="The primary condition diagnosed from the report")
    confidence_percentage: str = Field(description="Confidence percentage, e.g. '85%'")
    condition_stage: str = Field(description="Condition stage, e.g. 'Acute', 'Chronic', 'Mild', 'Stable'")
    clinical_evidence: list[str] = Field(description="List of clinical evidence or observations found in the report")
    approved_protocols: list[str] = Field(description="List of recommended/approved actions or protocols for the user")
    contraindicated_actions: list[str] = Field(description="List of actions the user should avoid or that are contraindicated")
    precautions: list[str] = Field(description="List of precautions or warning signs to track")

@router.post("/analyze")
async def analyze_report(
    request: Request,
    file: UploadFile = File(...)
):
    # 1. Client-side file checks (size and type)
    content = await file.read()
    file_size = len(content)
    
    # 10 MB limit
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10 MB limit."
        )
        
    if file.content_type not in ["image/jpeg", "image/png", "application/pdf"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a JPEG, PNG, or PDF report."
        )

    settings = get_settings()
    api_key = settings.gemini_api_key
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API Key is not configured on the server."
        )
        
    client = genai.Client(api_key=api_key)
    
    # 2. Call Gemini
    image_part = types.Part.from_bytes(
        data=content,
        mime_type=file.content_type
    )
    
    prompt = """
    You are a medical report analyzer. Read the provided medical report image or PDF.
    Extract the diagnosis details and fill in the structured response.
    
    CRITICAL QUALITY CONTROL:
    If the document is not a medical report, or if it is too blurry/unclear to read, or if the findings are inconsistent/unclear, set the primary_diagnosis to 'Inconsistent Report' and emergency_level to 'unknown'. Do not guess.
    
    Otherwise, return a strictly structured JSON matching the provided schema.
    """
    
    # Retry once with exponential backoff on 429 rate limit
    response = None
    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=[prompt, image_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiAnalysisResult
            )
        )
    except Exception as err:
        err_code = getattr(err, "code", None)
        err_msg = str(err).upper()
        
        is_429 = err_code == 429 or "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "RATE_LIMIT" in err_msg
        is_503 = err_code == 503 or "503" in err_msg or "UNAVAILABLE" in err_msg or "BUSY" in err_msg or "TEMPORARY" in err_msg

        if is_429:
            logger.warning("Gemini 429 rate limit hit. Retrying in 3 seconds...")
            time.sleep(3)
            try:
                response = client.models.generate_content(
                    model="gemini-3.5-flash",
                    contents=[prompt, image_part],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=GeminiAnalysisResult
                    )
                )
            except Exception as retry_err:
                logger.error(f"Gemini API rate limit retry failed: {retry_err}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Gemini API rate limit exceeded. Please try again in a minute."
                )
        elif is_503:
            logger.warning(f"Gemini API 503 Service Unavailable with gemini-3.5-flash: {err}. Retrying with fallback model gemini-3.1-flash-lite...")
            try:
                response = client.models.generate_content(
                    model="gemini-3.1-flash-lite",
                    contents=[prompt, image_part],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=GeminiAnalysisResult
                    )
                )
            except Exception as fallback_err:
                logger.error(f"Gemini API 503 fallback to gemini-3.1-flash-lite failed: {fallback_err}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="The AI service is busy right now — please try again in a moment"
                )
        else:
            logger.error(f"Gemini API error: {err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to analyze report: {str(err)}"
            )
        
    if not response or not response.text:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini returned an empty response."
        )
        
    try:
        analysis = GeminiAnalysisResult.model_validate_json(response.text)
    except Exception as parse_err:
        logger.error(f"Failed to parse Gemini output: {response.text}. Error: {parse_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse structured output from Gemini."
        )
        
    # Check for inconsistent / low confidence results
    if (
        analysis.primary_diagnosis.lower() in ["inconsistent report", "unknown", "inconsistent"] or
        analysis.emergency_level.lower() == "unknown" or
        "please consult a doctor" in analysis.primary_diagnosis.lower()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inconsistent report, please consult a doctor."
        )
        
    # 3. Enrich diagnosis
    enrichment = enrich_diagnosis(
        primary_diagnosis=analysis.primary_diagnosis,
        schemes_repo=request.app.state.schemes_repository,
        hospitals_repo=request.app.state.hospitals_repository,
        records_repo=request.app.state.records_repository,
        users_repo=request.app.state.user_repository,
        api_key=settings.gemini_api_key
    )
    
    # 4. Construct final payload
    report_data = analysis.model_dump()
    report_data.update(enrichment)
    
    return report_data


class EnrichRequest(BaseModel):
    primary_diagnosis: str


@router.post("/enrich")
async def enrich_report_diagnosis(
    payload: EnrichRequest,
    request: Request
):
    settings = get_settings()
    enrichment = enrich_diagnosis(
        primary_diagnosis=payload.primary_diagnosis,
        schemes_repo=request.app.state.schemes_repository,
        hospitals_repo=request.app.state.hospitals_repository,
        records_repo=request.app.state.records_repository,
        users_repo=request.app.state.user_repository,
        api_key=settings.gemini_api_key
    )
    return enrichment
