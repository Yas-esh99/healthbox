from google.cloud.firestore import Client
from app.models import Hospital

class FirestoreHospitalsRepository:
    def __init__(self, client: Client):
        self.collection = client.collection("hospitals")

    def get_all(self) -> list[Hospital]:
        hospitals = []
        for doc in self.collection.stream():
            payload = doc.to_dict() or {}
            payload["id"] = doc.id
            hospitals.append(Hospital.model_validate(payload))
        return hospitals

    def search(self, query: str) -> list[Hospital]:
        hospitals = self.get_all()
        if not query:
            return hospitals
        q = query.lower().strip()
        results = []
        for h in hospitals:
            match = (q in h.name.lower() or 
                     q in h.address.lower() or 
                     any(q in d.lower() for d in h.all_disease_it_cures))
            if match:
                results.append(h)
        return results

