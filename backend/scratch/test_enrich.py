import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from app.firebase import get_firestore_client
from app.repositories.hospitals import FirestoreHospitalsRepository
from app.repositories.schemes import FirestoreSchemesRepository
from app.services.care_matching import enrich_diagnosis
from app.config import get_settings

db = get_firestore_client()
if not db:
    print("No DB")
    sys.exit(1)

hospitals_repo = FirestoreHospitalsRepository(db)
schemes_repo = FirestoreSchemesRepository(db)

res = enrich_diagnosis(
    primary_diagnosis="Viral Pharyngitis",
    schemes_repo=schemes_repo,
    hospitals_repo=hospitals_repo,
    records_repo=None,
    users_repo=None,
    api_key=get_settings().gemini_api_key
)

print(f"Condition Category: {res.get('condition_category')}")
print(f"Matched Schemes: {[s.get('name') for s in res.get('matched_schemes')]}")
print(f"Nearest Hospitals: {[h.get('name') for h in res.get('nearest_hospitals')]}")
