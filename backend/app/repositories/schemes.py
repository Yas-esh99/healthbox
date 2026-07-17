from google.cloud.firestore import Client
from app.models import Scheme

class FirestoreSchemesRepository:
    def __init__(self, client: Client):
        self.collection = client.collection("schemes")

    def get_all(self) -> list[Scheme]:
        schemes = []
        for doc in self.collection.stream():
            payload = doc.to_dict() or {}
            payload["id"] = doc.id
            schemes.append(Scheme.model_validate(payload))
        return schemes

    def search(self, query: str) -> list[Scheme]:
        schemes = self.get_all()
        if not query:
            return schemes
        q = query.lower().strip()
        results = []
        for s in schemes:
            match = (q in s.name.lower() or 
                     q in s.description.lower() or 
                     any(q in b.lower() for b in s.benefits) or
                     any(q in c.lower() for c in s.eligibleCategories))
            if match:
                results.append(s)
        return results

