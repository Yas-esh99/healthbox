import os
import time
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import google.generativeai as genai

from app.config import get_settings
from app.services.auth import decode_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

class Message(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    reply: str

SYSTEM_PROMPT = """You are the Health Assistant for the Biothon application, a helpful and friendly chatbot designed for rural areas.

Your duties:
1. Provide basic healthcare advice, guidance, and symptom interpretations.
2. Guide users on using the Biothon app and find resources. You have search tools to find hospitals, pharmacies, medicines, and government schemes in our database. Always use these tools to answer specific queries!
3. Deep link users to app sections where they can take action by writing markdown links:
   - To find hospitals or get directions: [Find Hospital](/hospitals)
   - To find pharmacies or buy medicines: [Pharmacies](/pharmacies)
   - To see eligible government schemes or scan cards: [Govt Schemes](/schemes)
   - To view upcoming health camps or book camps: [Health Camps](/camps)
   - To scan symptoms and diagnose: [AI Diagnostics](/symptoms)
   - To view historical reports: [My Records](/records)
   - To edit their profile or upload a profile image: [My Profile](/profile)
4. Speak concisely and use simple language.
5. Disclaimer: You are an AI, not a doctor. Always recommend consulting a local doctor or emergency services for severe cases.
"""

@router.post("", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest, request: Request):
    start_time = time.time()
    settings = get_settings()
    api_key = settings.gemini_api_key
    if not api_key:
        raise HTTPException(status_code=500, detail="gemini_api_key is not set in Settings/.env file.")
    genai.configure(api_key=api_key)
    
    # 1. Fetch user details if logged in for personalization
    session_token = request.cookies.get(settings.auth_cookie_name)
    user_context = ""
    if session_token:
        try:
            phone_number = decode_token(session_token, expected_type="session")
            user_repo = request.app.state.user_repository
            user = user_repo.get_by_phone(phone_number)
            if user:
                user_context = (
                    f"\n\nCURRENT USER CONTEXT:\n"
                    f"- Name: {user.name or user.full_name or 'User'}\n"
                    f"- Location: {user.city or user.district or 'Unknown'}, {user.state or 'Unknown'}\n"
                    f"- Age: {user.age}\n"
                    f"- Gender: {user.gender or 'Unknown'}\n"
                    f"- Ayushman Card: {'Yes' if user.has_aayushman_card or user.has_ayushman else 'No'}"
                )
                if user.aayushman_card_number or user.ayushman_card_number:
                    user_context += f" (Card Number: {user.aayushman_card_number or user.ayushman_card_number})"
                if user.conditions:
                    user_context += f"\n- Chronic Conditions: {', '.join(user.conditions)}"
        except Exception as e:
            logger.error(f"Error fetching user profile context for chat: {e}")

    personalized_prompt = SYSTEM_PROMPT + user_context

    # 2. Define tools as closures to capture the request/database state
    def search_hospitals(
        query: str = "",
        state: str = "",
        city: str = "",
        ayushman_active: Optional[bool] = None,
        emergency_24x7: Optional[bool] = None,
        is_govt: Optional[bool] = None
    ) -> list:
        """Search local hospitals in the database.
        
        Args:
            query: search query (e.g. hospital name, disease, 'cardiac', or symptoms).
            state: State name to filter by (e.g. 'Bihar', 'Uttar Pradesh').
            city: City/District name to filter by.
            ayushman_active: True if the hospital accepts Ayushman PM-JAY card.
            emergency_24x7: True if the hospital has 24x7 emergency beds.
            is_govt: True if it is a government hospital.
        """
        try:
            hospitals_repo = request.app.state.hospitals_repository
            hospitals = hospitals_repo.get_all()
            results = []
            q = query.lower().strip() if query else ""
            st = state.lower().strip() if state else ""
            ct = city.lower().strip() if city else ""
            
            for h in hospitals:
                if q:
                    match = (q in h.name.lower() or 
                             q in h.address.lower() or 
                             any(q in d.lower() for d in h.all_disease_it_cures))
                    if not match:
                        continue
                if st and st not in h.address.lower():
                    continue
                if ct and ct not in h.address.lower():
                    continue
                if ayushman_active is not None and h.ayushman_active != ayushman_active:
                    continue
                if emergency_24x7 is not None and h.emergency_24x7 != emergency_24x7:
                    continue
                if is_govt is not None and h.is_govt != is_govt:
                    continue
                    
                results.append({
                    "name": h.name,
                    "address": h.address,
                    "number": h.number,
                    "rating": h.rating,
                    "beds_available": h.beds_available,
                    "emergency_24x7": h.emergency_24x7,
                    "is_govt": h.is_govt,
                    "ayushman_active": h.ayushman_active,
                    "google_map_direction_link": h.google_map_direction_link,
                    "all_disease_it_cures": h.all_disease_it_cures
                })
            return results[:5]
        except Exception as err:
            return [{"error": f"Failed to search hospitals: {str(err)}"}]

    def search_pharmacies_and_medicines(query: str = "", medicine_name: str = "") -> list:
        """Search local pharmacies and check medicine pricing/stock.
        
        Args:
            query: pharmacy name or address to filter by.
            medicine_name: name of the medicine to check stock and price for.
        """
        try:
            pharmacies_repo = request.app.state.pharmacies_repository
            pharmacies = pharmacies_repo.get_all()
            results = []
            q = query.lower().strip() if query else ""
            med = medicine_name.lower().strip() if medicine_name else ""
            
            for p in pharmacies:
                if q and q not in p.name.lower() and q not in p.address.lower():
                    continue
                    
                med_results = []
                if med:
                    for m in p.medicines:
                        if med in m.name.lower():
                            med_results.append({
                                "name": m.name,
                                "price": m.price,
                                "inStock": m.inStock
                            })
                    if not med_results:
                        continue
                else:
                    med_results = [{
                        "name": m.name,
                        "price": m.price,
                        "inStock": m.inStock
                    } for m in p.medicines]
                    
                results.append({
                    "name": p.name,
                    "address": p.address,
                    "contact": p.contact,
                    "isPremium": p.isPremium,
                    "matching_medicines": med_results[:5]
                })
            return results[:5]
        except Exception as err:
            return [{"error": f"Failed to search pharmacies: {str(err)}"}]

    def search_schemes(query: str = "") -> list:
        """Search government health schemes and welfare benefits.
        
        Args:
            query: search query (e.g. 'maternity', 'insurance', 'ayushman').
        """
        try:
            schemes_repo = request.app.state.schemes_repository
            schemes = schemes_repo.get_all()
            results = []
            q = query.lower().strip() if query else ""
            
            for s in schemes:
                if q:
                    match = (q in s.name.lower() or 
                             q in s.description.lower() or 
                             any(q in b.lower() for b in s.benefits) or
                             any(q in c.lower() for c in s.eligibleCategories))
                    if not match:
                        continue
                        
                results.append({
                    "name": s.name,
                    "description": s.description,
                    "coverageLimit": s.coverageLimit,
                    "targetDemographic": s.targetDemographic,
                    "benefits": s.benefits,
                    "eligibleCategories": s.eligibleCategories,
                    "requiredDocuments": s.requiredDocuments
                })
            return results[:5]
        except Exception as err:
            return [{"error": f"Failed to search schemes: {str(err)}"}]

    try:
        model_name = 'gemini-3.1-flash-lite'
        logger.info(f"Sending chat request to {model_name}...")
        model = genai.GenerativeModel(
            model_name,
            system_instruction=personalized_prompt,
            tools=[search_hospitals, search_pharmacies_and_medicines, search_schemes]
        )
        
        history = []
        for msg in payload.messages[:-1]:
            role = "model" if msg.role == "bot" else "user"
            history.append({"role": role, "parts": [msg.text]})
            
        chat_session = model.start_chat(history=history, enable_automatic_function_calling=True)
        
        last_msg = payload.messages[-1].text
        response = chat_session.send_message(last_msg)
        
        elapsed_time = time.time() - start_time
        logger.info(f"Chat request succeeded using {model_name} in {elapsed_time:.4f} seconds.")
        return ChatResponse(reply=response.text)
    except Exception as e:
        logger.warning(f"Chat endpoint error with gemini-3.1-flash-lite: {e}. Retrying with fallback model...")
        # Fallback to gemini-3.5-flash
        fallback_model_name = 'gemini-3.5-flash'
        try:
            model = genai.GenerativeModel(
                fallback_model_name,
                system_instruction=personalized_prompt,
                tools=[search_hospitals, search_pharmacies_and_medicines, search_schemes]
            )
            chat_session = model.start_chat(history=history, enable_automatic_function_calling=True)
            response = chat_session.send_message(last_msg)
            
            elapsed_time = time.time() - start_time
            logger.info(f"Chat request succeeded using fallback {fallback_model_name} in {elapsed_time:.4f} seconds.")
            return ChatResponse(reply=response.text)
        except Exception as inner_e:
            elapsed_time = time.time() - start_time
            logger.error(f"Fallback chat endpoint error with {fallback_model_name} after {elapsed_time:.4f} seconds: {inner_e}")
            raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(inner_e)}")

