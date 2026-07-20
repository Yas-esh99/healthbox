from datetime import datetime, timezone
import uuid
from google.cloud.firestore import Client, FieldFilter


class FirestoreRecordsRepository:
    def __init__(self, client: Client):
        self.collection = client.collection("triage_records")

    def get_by_user(self, phone_number: str) -> list[dict]:
        """Fetch all triage records for a user, sorted by created_at descending."""
        records = []
        query = self.collection.where(filter=FieldFilter("phone_number", "==", phone_number))
        
        for doc in query.stream():
            payload = doc.to_dict() or {}
            payload["id"] = doc.id
            records.append(payload)
            
        # Sort in memory by created_at descending to avoid requiring composite Firestore indexes
        records.sort(key=lambda x: x.get("created_at") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
        return records

    def create(self, phone_number: str, report: dict, chief_complaint: str | None = None) -> dict:
        """Create a new triage record document in Firestore."""
        now = datetime.now(timezone.utc)
        record_id = f"rec-{uuid.uuid4().hex[:8]}"
        payload = {
            "phone_number": phone_number,
            "created_at": now,
            "chief_complaint": chief_complaint,
            "report": report
        }
        self.collection.document(record_id).set(payload)
        payload["id"] = record_id
        return payload

    def migrate_user_phone(self, old_phone: str, new_phone: str) -> None:
        """Migrate all triage records from an old phone number to a new one."""
        query = self.collection.where(filter=FieldFilter("phone_number", "==", old_phone))
        for doc in query.stream():
            self.collection.document(doc.id).update({"phone_number": new_phone})

    def delete(self, record_id: str, phone_number: str) -> bool:
        """Delete a specific triage record for a user, confirming ownership."""
        doc_ref = self.collection.document(record_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False
        payload = doc.to_dict() or {}
        if payload.get("phone_number") != phone_number:
            return False
        doc_ref.delete()
        return True

    def delete_all(self, phone_number: str) -> int:
        """Delete all triage records for a user, returning the number of deleted records."""
        query = self.collection.where(filter=FieldFilter("phone_number", "==", phone_number))
        deleted_count = 0
        for doc in query.stream():
            doc.reference.delete()
            deleted_count += 1
        return deleted_count


