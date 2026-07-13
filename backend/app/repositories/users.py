from datetime import UTC, datetime
from google.cloud.firestore import Client

from app.config import get_settings
from app.models import RegisterRequest, UserProfile, UpdateProfileRequest


class InMemoryUserRepository:
    def __init__(self):
        self._users: dict[str, UserProfile] = {}

    def get_by_phone(self, phone_number: str) -> UserProfile | None:
        return self._users.get(phone_number)

    def create(self, payload: RegisterRequest) -> UserProfile:
        now = datetime.now(UTC)
        user_profile = UserProfile(
            id=payload.phone_number,
            phone_number=payload.phone_number,
            full_name=payload.full_name,
            state=payload.state,
            district=payload.district,
            age=payload.age,
            gender=payload.gender,
            has_ayushman=payload.has_ayushman,
            ayushman_card_number=payload.ayushman_card_number,
            conditions=payload.conditions,
            created_at=now,
            updated_at=now,
            name=payload.full_name,
            mobile_number=payload.phone_number,
            city=payload.district,
            has_aayushman_card=payload.has_ayushman,
            aayushman_card_number=payload.ayushman_card_number,
            profile_image=None,
            email=None,
            role="Patient",
        )
        self._users[payload.phone_number] = user_profile
        return user_profile

    def update(self, phone_number: str, payload: UpdateProfileRequest) -> UserProfile:
        now = datetime.now(UTC)
        existing = self._users.get(phone_number)
        created_at = existing.created_at if existing else now
        conditions = existing.conditions if existing else []

        user_profile = UserProfile(
            id=phone_number,
            phone_number=phone_number,
            full_name=payload.name,
            state=payload.state,
            district=payload.city,
            age=payload.age,
            gender=payload.gender,
            has_ayushman=payload.has_aayushman_card,
            ayushman_card_number=payload.aayushman_card_number,
            conditions=conditions,
            created_at=created_at,
            updated_at=now,
            name=payload.name,
            mobile_number=phone_number,
            city=payload.city,
            has_aayushman_card=payload.has_aayushman_card,
            aayushman_card_number=payload.aayushman_card_number,
            profile_image=payload.profile_image,
            email=payload.email,
            role=payload.role or "Patient",
        )
        self._users[phone_number] = user_profile
        return user_profile

    def migrate_phone(self, old_phone: str, payload: UpdateProfileRequest) -> UserProfile:
        updated = self.update(old_phone, payload)
        self._users.pop(old_phone, None)
        self._users[payload.mobile_number] = updated.model_copy(update={"id": payload.mobile_number, "phone_number": payload.mobile_number, "mobile_number": payload.mobile_number})
        return self._users[payload.mobile_number]


class FirestoreUserRepository:
    def __init__(self, client: Client):
        settings = get_settings()
        self.collection = client.collection(settings.users_collection)

    def get_by_phone(self, phone_number: str) -> UserProfile | None:
        document = self.collection.document(phone_number).get()
        if not document.exists:
            return None

        payload = document.to_dict() or {}
        payload["id"] = document.id
        return UserProfile.model_validate(payload)

    def create(self, payload: RegisterRequest) -> UserProfile:
        now = datetime.now(UTC)
        document_payload = {
            "phone_number": payload.phone_number,
            "mobile_number": payload.phone_number, # new
            "full_name": payload.full_name,
            "name": payload.full_name, # new
            "state": payload.state,
            "district": payload.district,
            "city": payload.district, # new
            "age": payload.age,
            "gender": payload.gender,
            "has_ayushman": payload.has_ayushman,
            "has_aayushman_card": payload.has_ayushman, # new
            "ayushman_card_number": payload.ayushman_card_number,
            "aayushman_card_number": payload.ayushman_card_number, # new
            "profile_image": None, # new
            "email": None, # new
            "role": "Patient", # new
            "conditions": payload.conditions,
            "created_at": now,
            "updated_at": now,
        }

        document_ref = self.collection.document(payload.phone_number)
        document_ref.set(document_payload)
        return UserProfile(id=document_ref.id, **document_payload)

    def update(self, phone_number: str, payload: UpdateProfileRequest) -> UserProfile:
        now = datetime.now(UTC)
        doc_ref = self.collection.document(phone_number)
        doc = doc_ref.get()
        if not doc.exists:
            created_at = now
            conditions = []
        else:
            old_data = doc.to_dict() or {}
            created_at = old_data.get("created_at", now)
            conditions = old_data.get("conditions", [])

        document_payload = {
            "phone_number": phone_number,
            "mobile_number": phone_number,
            "full_name": payload.name,
            "name": payload.name,
            "state": payload.state,
            "district": payload.city,
            "city": payload.city,
            "age": payload.age,
            "gender": payload.gender,
            "has_ayushman": payload.has_aayushman_card,
            "has_aayushman_card": payload.has_aayushman_card,
            "ayushman_card_number": payload.aayushman_card_number,
            "aayushman_card_number": payload.aayushman_card_number,
            "profile_image": payload.profile_image,
            "email": payload.email,
            "role": payload.role or "Patient",
            "conditions": conditions,
            "created_at": created_at,
            "updated_at": now,
        }

        doc_ref.set(document_payload)
        document_payload["id"] = phone_number
        return UserProfile.model_validate(document_payload)

    def migrate_phone(self, old_phone: str, payload: UpdateProfileRequest) -> UserProfile:
        now = datetime.now(UTC)
        old_doc_ref = self.collection.document(old_phone)
        old_doc = old_doc_ref.get()
        if not old_doc.exists:
            created_at = now
            conditions = []
        else:
            old_data = old_doc.to_dict() or {}
            created_at = old_data.get("created_at", now)
            conditions = old_data.get("conditions", [])

        document_payload = {
            "phone_number": payload.mobile_number,
            "mobile_number": payload.mobile_number,
            "full_name": payload.name,
            "name": payload.name,
            "state": payload.state,
            "district": payload.city,
            "city": payload.city,
            "age": payload.age,
            "gender": payload.gender,
            "has_ayushman": payload.has_aayushman_card,
            "has_aayushman_card": payload.has_aayushman_card,
            "ayushman_card_number": payload.aayushman_card_number,
            "aayushman_card_number": payload.aayushman_card_number,
            "profile_image": payload.profile_image,
            "email": payload.email,
            "role": payload.role or "Patient",
            "conditions": conditions,
            "created_at": created_at,
            "updated_at": now,
        }

        # Save to new document ID and delete the old document ID
        new_doc_ref = self.collection.document(payload.mobile_number)
        new_doc_ref.set(document_payload)
        old_doc_ref.delete()

        document_payload["id"] = payload.mobile_number
        return UserProfile.model_validate(document_payload)

