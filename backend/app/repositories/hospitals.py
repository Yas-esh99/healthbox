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
        query_tokens = [t.strip() for t in q.replace("&", " ").replace("and", " ").split() if t.strip()]
        results = []
        for h in hospitals:
            name_lower = h.name.lower()
            addr_lower = h.address.lower()
            match = q in name_lower or name_lower in q or q in addr_lower or addr_lower in q
            if not match:
                for d in h.all_disease_it_cures:
                    d_lower = d.lower()
                    if q in d_lower or d_lower in q or any(tok in d_lower for tok in query_tokens):
                        match = True
                        break
            if match:
                results.append(h)
        return results

