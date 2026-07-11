from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator

# Predefined State and District/City lists
STATES = {
    "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
    "Uttar Pradesh": ["Lucknow", "Varanasi", "Gorakhpur", "Prayagraj"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
    "Maharashtra": ["Pune", "Nagpur", "Nashik", "Aurangabad"],
}


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
    coordinates: Coordinates
    medicines: list[Medicine] = Field(default_factory=list)


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



