from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator

import json
import os

# Predefined State and District/City lists loaded from JSON
_json_path = os.path.join(os.path.dirname(__file__), "states_and_districts.json")
try:
    with open(_json_path, "r", encoding="utf-8") as f:
        STATES = json.load(f)
except Exception as e:
    print(f"Warning: Failed to load states_and_districts.json in models.py: {e}")
    STATES = {}



def normalize_phone_number(value: str) -> str:
    digits = "".join(ch for ch in value if ch.isdigit())
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    if len(digits) != 10:
        raise ValueError("Phone number must contain exactly 10 digits.")
    return digits


class SendOtpRequest(BaseModel):
    phone_number: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        return normalize_phone_number(value)


class SendOtpResponse(BaseModel):
    challenge_id: str
    phone_number: str
    demo_otp: str
    message: str


class VerifyOtpRequest(BaseModel):
    phone_number: str
    otp_code: str = Field(min_length=6, max_length=6)

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        return normalize_phone_number(value)


class UserProfile(BaseModel):
    id: str
    phone_number: str
    full_name: str
    state: str
    district: str
    age: int = Field(ge=0, le=120)
    gender: str | None = None
    has_ayushman: bool = False
    ayushman_card_number: str | None = None
    conditions: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    # New recommended user fields for strict Task 9 / Task 1 compliance
    name: str | None = None
    mobile_number: str | None = None
    city: str | None = None
    has_aayushman_card: bool | None = None
    aayushman_card_number: str | None = None
    profile_image: str | None = None
    email: str | None = None
    role: str | None = "Patient"

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: dict) -> dict:
        if isinstance(data, dict):
            # Backwards compatibility mapping
            # phone_number <-> mobile_number
            if "phone_number" in data and "mobile_number" not in data:
                data["mobile_number"] = data["phone_number"]
            elif "mobile_number" in data and "phone_number" not in data:
                data["phone_number"] = data["mobile_number"]

            # full_name <-> name
            if "full_name" in data and "name" not in data:
                data["name"] = data["full_name"]
            elif "name" in data and "full_name" not in data:
                data["full_name"] = data["name"]

            # district <-> city
            if "district" in data and "city" not in data:
                data["city"] = data["district"]
            elif "city" in data and "district" not in data:
                data["district"] = data["city"]

            # has_ayushman <-> has_aayushman_card
            if "has_ayushman" in data and "has_aayushman_card" not in data:
                data["has_aayushman_card"] = data["has_ayushman"]
            elif "has_aayushman_card" in data and "has_ayushman" not in data:
                data["has_ayushman"] = data["has_aayushman_card"]

            # ayushman_card_number <-> aayushman_card_number
            if "ayushman_card_number" in data and "aayushman_card_number" not in data:
                data["aayushman_card_number"] = data["ayushman_card_number"]
            elif "aayushman_card_number" in data and "ayushman_card_number" not in data:
                data["ayushman_card_number"] = data["aayushman_card_number"]
                
            if "role" not in data:
                data["role"] = "Patient"
        return data


class VerifyOtpResponse(BaseModel):
    registered: bool
    redirect_to: str
    phone_number: str
    user: UserProfile | None = None


class RegisterRequest(BaseModel):
    phone_number: str
    full_name: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=1, max_length=120)
    district: str = Field(min_length=1, max_length=120)
    age: int = Field(ge=0, le=120)
    gender: str | None = Field(default=None, max_length=30)
    has_ayushman: bool = False
    ayushman_card_number: str | None = Field(default=None, max_length=64)
    conditions: list[str] = Field(default_factory=list)

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        return normalize_phone_number(value)

    @field_validator("full_name", "state", "district", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("Must be a string.")
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required.")
        return cleaned

    @field_validator("gender", "ayushman_card_number", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_state_and_district_and_card(self) -> "RegisterRequest":
        if self.state not in STATES:
            raise ValueError(f"Invalid state: '{self.state}'. Must be one of {list(STATES.keys())}")
        valid_cities = STATES[self.state]
        if self.district not in valid_cities:
            raise ValueError(f"Invalid district/city '{self.district}' for state '{self.state}'. Must be one of {valid_cities}")
        if self.has_ayushman:
            if not self.ayushman_card_number or not self.ayushman_card_number.strip():
                raise ValueError("Ayushman Card Number is required when Ayushman Card is enabled.")
        return self


class RegisterResponse(BaseModel):
    redirect_to: str
    user: UserProfile


class UpdateProfileRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    mobile_number: str
    state: str = Field(min_length=1, max_length=120)
    city: str = Field(min_length=1, max_length=120)
    age: int = Field(ge=0, le=120)
    gender: str | None = Field(default=None, max_length=30)
    has_aayushman_card: bool = False
    aayushman_card_number: str | None = Field(default=None, max_length=64)
    profile_image: str | None = None
    email: str | None = Field(default=None, max_length=120)
    role: str | None = Field(default="Patient", max_length=50)

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile_number(cls, value: str) -> str:
        return normalize_phone_number(value)

    @field_validator("name", "state", "city", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("Must be a string.")
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required.")
        return cleaned

    @field_validator("gender", "aayushman_card_number", "email", "role", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_state_and_city_and_card(self) -> "UpdateProfileRequest":
        if self.state not in STATES:
            raise ValueError(f"Invalid state: '{self.state}'. Must be one of {list(STATES.keys())}")
        valid_cities = STATES[self.state]
        if self.city not in valid_cities:
            raise ValueError(f"Invalid city '{self.city}' for state '{self.state}'. Must be one of {valid_cities}")
        if self.has_aayushman_card:
            if not self.aayushman_card_number or not self.aayushman_card_number.strip():
                raise ValueError("Aayushman Card Number is required when Ayushman Card is enabled.")
        return self


class SessionResponse(BaseModel):
    authenticated: bool
    user: UserProfile | None = None


class LogoutResponse(BaseModel):
    message: str



# --- Directory Models ---

class Scheme(BaseModel):
    id: str
    name: str
    description: str
    coverageLimit: str
    targetDemographic: str
    benefits: list[str] = Field(default_factory=list)
    eligibleCategories: list[str] = Field(default_factory=list)
    requiredDocuments: list[str] = Field(default_factory=list)
    
    # New Firestore fields
    type: str | None = None
    diseases_covered: list[str] = Field(default_factory=list)
    scheme_logo: str | None = None
    documents_required: list[str] = Field(default_factory=list)
    website_link: str | None = None
    eligibility: list[str] = Field(default_factory=list)
    details: str | None = None

    @model_validator(mode="before")
    @classmethod
    def populate_scheme_fields(cls, data: dict) -> dict:
        if isinstance(data, dict):
            # Map diseases_covered -> benefits/eligibleCategories
            if "diseases_covered" in data:
                data["benefits"] = data.get("benefits") or data["diseases_covered"]
                data["eligibleCategories"] = data.get("eligibleCategories") or data["diseases_covered"]
            # Map documents_required -> requiredDocuments
            if "documents_required" in data:
                data["requiredDocuments"] = data.get("requiredDocuments") or data["documents_required"]
            # Map eligibility -> targetDemographic
            if "eligibility" in data:
                if isinstance(data["eligibility"], list):
                    data["targetDemographic"] = data.get("targetDemographic") or ", ".join(data["eligibility"])
                elif isinstance(data["eligibility"], str):
                    data["targetDemographic"] = data.get("targetDemographic") or data["eligibility"]
            # Map details -> description
            if "details" in data:
                data["description"] = data.get("description") or data["details"]
            # Set defaults for required fields if missing
            if "description" not in data:
                data["description"] = "No description available."
            if "coverageLimit" not in data:
                # Try to extract coverage limit from details
                details = data.get("details", "")
                import re
                match = re.search(r"INR\s*\d+", details, re.IGNORECASE)
                if match:
                    data["coverageLimit"] = f"Up to {match.group(0)}"
                else:
                    data["coverageLimit"] = "Check details"
            if "targetDemographic" not in data:
                data["targetDemographic"] = "All citizens"
        return data


class Hospital(BaseModel):
    id: str
    name: str
    address: str
    number: str
    rating: float
    beds_available: int
    emergency_24x7: bool
    is_govt: bool
    ayushman_active: bool
    google_map_direction_link: str
    all_disease_it_cures: list[str] = Field(default_factory=list)

    # New Firestore fields
    hospital_name: str | None = None
    type: str | None = None
    hospital_image: str | None = None
    years_of_care: str | None = None
    google_review_ratings: float | None = None
    file_charges_for_primary_checkup: int | None = None
    whatsapp_number: str | None = None
    open: str | None = None
    descriptions: dict | None = None
    main_doctors: list[dict] = Field(default_factory=list)
    mobile_number: str | None = None
    address_details: dict | None = None
    about_hospital: dict | None = None
    services: dict | None = None
    email: str | None = None

    @model_validator(mode="before")
    @classmethod
    def populate_hospital_fields(cls, data: dict) -> dict:
        if isinstance(data, dict):
            # name <-> hospital_name
            if "hospital_name" in data and "name" not in data:
                data["name"] = data["hospital_name"]
            elif "name" in data and "hospital_name" not in data:
                data["hospital_name"] = data["name"]

            # address: dict or str
            addr = data.get("address")
            if isinstance(addr, dict):
                data["address_details"] = addr
                data["address"] = addr.get("location", "")
                if "google_map_direction_link" not in data:
                    data["google_map_direction_link"] = addr.get("google_map_direction_link", "")
            
            # number <-> mobile_number / whatsapp_number
            if "mobile_number" in data:
                data["number"] = data.get("number") or data["mobile_number"]
            elif "whatsapp_number" in data:
                data["number"] = data.get("number") or data["whatsapp_number"]
            
            # rating <-> google_review_ratings
            if "google_review_ratings" in data:
                data["rating"] = data.get("rating") or data["google_review_ratings"]
            
            # open <-> emergency_24x7
            if "open" in data:
                data["emergency_24x7"] = "24" in str(data["open"])
            
            # type <-> is_govt
            if "type" in data:
                h_type = str(data["type"]).lower()
                data["is_govt"] = "govt" in h_type or "semi" in h_type
            
            # services -> disease names -> all_disease_it_cures
            servs = data.get("services")
            if isinstance(servs, dict):
                disease_names = servs.get("disease_names")
                if isinstance(disease_names, list):
                    cures = []
                    for d in disease_names:
                        if isinstance(d, dict) and "disease_name" in d:
                            cures.append(d["disease_name"])
                    data["all_disease_it_cures"] = data.get("all_disease_it_cures") or cures
            
            # Set sensible defaults
            if "name" not in data:
                data["name"] = "Unknown Hospital"
            if "address" not in data:
                data["address"] = "No address available"
            if "number" not in data:
                data["number"] = "N/A"
            if "rating" not in data:
                data["rating"] = 0.0
            if "beds_available" not in data:
                data["beds_available"] = 0
            if "emergency_24x7" not in data:
                data["emergency_24x7"] = False
            if "is_govt" not in data:
                data["is_govt"] = False
            if "ayushman_active" not in data:
                data["ayushman_active"] = True  # Default true since these are empanelled hospitals
            if "google_map_direction_link" not in data or not data["google_map_direction_link"]:
                data["google_map_direction_link"] = ""
        return data


class Medicine(BaseModel):
    name: str
    price: float
    inStock: bool


class Coordinates(BaseModel):
    latitude: float
    longitude: float


class Pharmacy(BaseModel):
    id: str
    name: str
    address: str
    contact: str
    isPremium: bool
    coordinates: Coordinates | None = None
    medicines: list[Medicine] = Field(default_factory=list)

    # New Firestore fields
    pharmacy_name: str | None = None
    pharmacist_name: str | None = None
    open_and_close_time: str | None = None
    mobile_number: str | None = None
    whatsapp_number: str | None = None
    email: str | None = None
    google_review_ratings: float | None = None
    address_details: dict | None = None
    description: dict | None = None
    services: dict | None = None

    @model_validator(mode="before")
    @classmethod
    def populate_pharmacy_fields(cls, data: dict) -> dict:
        if isinstance(data, dict):
            # name <-> pharmacy_name
            if "pharmacy_name" in data and "name" not in data:
                data["name"] = data["pharmacy_name"]
            elif "name" in data and "pharmacy_name" not in data:
                data["pharmacy_name"] = data["name"]

            # address: dict or str
            addr = data.get("address")
            if isinstance(addr, dict):
                data["address_details"] = addr
                data["address"] = addr.get("location", "")
            
            # contact <-> mobile_number / whatsapp_number
            if "mobile_number" in data:
                data["contact"] = data.get("contact") or data["mobile_number"]
            elif "whatsapp_number" in data:
                data["contact"] = data.get("contact") or data["whatsapp_number"]
            
            # medicines <-> description.inventory
            desc = data.get("description")
            if isinstance(desc, dict):
                inventory = desc.get("inventory")
                if isinstance(inventory, list):
                    meds = []
                    for m in inventory:
                        if isinstance(m, dict) and "medicine_name" in m:
                            meds.append({
                                "name": m["medicine_name"],
                                "price": float(m.get("price") or 0.0),
                                "inStock": m.get("stock_availability", False)
                            })
                    data["medicines"] = data.get("medicines") or meds
            
            # isPremium: if billing_discount_percentage > 15, or general store is active
            if isinstance(desc, dict):
                data["isPremium"] = desc.get("billing_discount_percentage", 0) > 15
            
            # Set sensible defaults
            if "name" not in data:
                data["name"] = "Unknown Pharmacy"
            if "address" not in data:
                data["address"] = "No address available"
            if "contact" not in data:
                data["contact"] = "N/A"
            if "isPremium" not in data:
                data["isPremium"] = False
            if "medicines" not in data:
                data["medicines"] = []
        return data



# --- Triage Records Models ---

class CreateRecordRequest(BaseModel):
    report: dict
    chief_complaint: str | None = None


class TriageRecordResponse(BaseModel):
    id: str
    phone_number: str
    created_at: datetime
    chief_complaint: str | None = None
    report: dict


class HeatmapPoint(BaseModel):
    state: str
    district: str
    disease: str
    cases_count: int



