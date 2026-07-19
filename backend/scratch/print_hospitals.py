import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from app.firebase import get_firestore_client
from app.models import Hospital

db = get_firestore_client()
if not db:
    print("No DB")
    sys.exit(1)

for doc in db.collection("hospitals").stream():
    payload = doc.to_dict() or {}
    payload["id"] = doc.id
    h = Hospital.model_validate(payload)
    print(f"ID: {h.id} | Name: {h.name} | Type: {h.type} | is_govt: {h.is_govt}")
