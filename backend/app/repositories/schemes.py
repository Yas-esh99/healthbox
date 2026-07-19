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
        query_tokens = [t.strip() for t in q.replace("&", " ").replace("and", " ").split() if t.strip()]
        results = []
        for s in schemes:
            name_lower = s.name.lower()
            desc_lower = s.description.lower()
            match = q in name_lower or name_lower in q or q in desc_lower or desc_lower in q
            if not match:
                for b in s.benefits:
                    b_lower = b.lower()
                    if q in b_lower or b_lower in q or any(tok in b_lower for tok in query_tokens):
                        match = True
                        break
            if not match:
                for c in s.eligibleCategories:
                    c_lower = c.lower()
                    if q in c_lower or c_lower in q or any(tok in c_lower for tok in query_tokens):
                        match = True
                        break
            if match:
                results.append(s)
        return results

