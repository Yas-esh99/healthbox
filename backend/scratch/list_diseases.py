import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from app.firebase import get_firestore_client
from app.repositories.hospitals import FirestoreHospitalsRepository

db = get_firestore_client()
if not db:
    print("Failed to initialize Firestore client.")
    sys.exit(1)

hospitals_repo = FirestoreHospitalsRepository(db)
all_hospitals = hospitals_repo.get_all()

diseases = set()
for h in all_hospitals:
    for d in h.all_disease_it_cures:
        diseases.add(d)

print("Unique diseases in database:")
for d in sorted(list(diseases)):
    print(f"  - {d}")
