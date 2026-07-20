from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.config import get_settings
from app.models import CreateRecordRequest, TriageRecordResponse, HeatmapPoint
from app.services.auth import decode_token
from app.services.care_matching import get_disease_heatmap_data

router = APIRouter(prefix="/records", tags=["records"])


def get_current_phone(request: Request) -> str:
    """Dependency to retrieve the authenticated user's phone number from session cookie."""
    settings = get_settings()
    session_token = request.cookies.get(settings.auth_cookie_name)
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in first.",
        )
    return decode_token(session_token, expected_type="session")


@router.post("", response_model=TriageRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    payload: CreateRecordRequest,
    request: Request,
    phone_number: str = Depends(get_current_phone),
) -> TriageRecordResponse:
    """Save a new diagnostic triage record for the authenticated user."""
    repository = request.app.state.records_repository
    record = repository.create(
        phone_number=phone_number,
        report=payload.report,
        chief_complaint=payload.chief_complaint,
    )
    return TriageRecordResponse(**record)


@router.get("", response_model=list[TriageRecordResponse])
def get_records(
    request: Request,
    phone_number: str = Depends(get_current_phone),
) -> list[TriageRecordResponse]:
    """Retrieve all diagnostic triage records for the authenticated user."""
    repository = request.app.state.records_repository
    records = repository.get_by_user(phone_number)
    return [TriageRecordResponse(**r) for r in records]


@router.get("/heatmap", response_model=list[HeatmapPoint])
def get_disease_heatmap(request: Request, disease: str | None = None) -> list[HeatmapPoint]:
    """Retrieve disease heatmap data aggregated by state and district from Firestore, combined with baseline seed data."""
    records_repo = request.app.state.records_repository
    users_repo = request.app.state.user_repository
    data = get_disease_heatmap_data(disease, records_repo, users_repo)
    return [HeatmapPoint(**p) for p in data]


@router.delete("/{record_id}", status_code=status.HTTP_200_OK)
def delete_record(
    record_id: str,
    request: Request,
    phone_number: str = Depends(get_current_phone),
):
    """Delete a specific diagnostic triage record for the authenticated user."""
    repository = request.app.state.records_repository
    success = repository.delete(record_id=record_id, phone_number=phone_number)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found or not owned by the current user.",
        )
    return {"status": "success", "message": "Record deleted successfully."}


@router.delete("", status_code=status.HTTP_200_OK)
def delete_all_records(
    request: Request,
    phone_number: str = Depends(get_current_phone),
):
    """Delete all diagnostic triage records for the authenticated user."""
    repository = request.app.state.records_repository
    count = repository.delete_all(phone_number=phone_number)
    return {"status": "success", "message": f"Successfully deleted {count} record(s)."}



