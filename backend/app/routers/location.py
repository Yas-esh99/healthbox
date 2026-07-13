from fastapi import APIRouter, Depends, HTTPException, Query, Request
import json
import os

router = APIRouter(prefix="/location", tags=["location"])

@router.get("/states", response_model=list[str])
def get_states(request: Request) -> list[str]:
    repo = getattr(request.app.state, "location_repository", None)
    if repo is None:
        from app.repositories.location import LocationRepository
        repo = LocationRepository()
    return repo.get_states()

@router.get("/cities", response_model=list[str])
def get_cities(request: Request, state: str = Query(..., min_length=1)) -> list[str]:
    repo = getattr(request.app.state, "location_repository", None)
    if repo is None:
        from app.repositories.location import LocationRepository
        repo = LocationRepository()
    
    cities = repo.get_cities(state)
    if not cities:
        # Check if the state is valid
        states = repo.get_states()
        if state not in states:
            raise HTTPException(status_code=404, detail=f"State '{state}' not found.")
    return cities

def seed_locations_if_empty(db_client):
    try:
        collection_ref = db_client.collection("locations")
        docs = list(collection_ref.limit(1).stream())
        if not docs:
            print("Seeding locations database in Firestore...")
            json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "states_and_districts.json")
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            batch = db_client.batch()
            for state, cities in data.items():
                doc_ref = collection_ref.document(state)
                batch.set(doc_ref, {
                    "state": state,
                    "cities": cities
                })
            batch.commit()
            print("Successfully seeded locations database in Firestore!")
        else:
            print("Locations database already seeded in Firestore.")
    except Exception as e:
        print(f"Error seeding locations database in Firestore: {e}")
