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

# Search for a common condition to match some hospitals
results = hospitals_repo.search("Diabetes")

print(f"Total matched hospitals: {len(results)}")

govt_hospitals = [h for h in results if h.is_govt]
private_hospitals = [h for h in results if not h.is_govt]

print(f"Government Hospitals count: {len(govt_hospitals)}")
for h in govt_hospitals:
    print(f"  - Govt Hosp: {h.name} (Type: {h.type})")

print(f"Private Hospitals count: {len(private_hospitals)}")
for h in private_hospitals:
    print(f"  - Private Hosp: {h.name} (Type: {h.type})")
