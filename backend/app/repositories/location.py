import json
import os
from google.cloud.firestore import Client

class LocationRepository:
    def __init__(self, db_client: Client = None):
        self.db_client = db_client
        self._local_data = {}
        self._load_local_data()

    def _load_local_data(self):
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "states_and_districts.json")
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                self._local_data = json.load(f)
        except Exception as e:
            print(f"Error loading local states and districts JSON: {e}")
            self._local_data = {}

    def get_states(self) -> list[str]:
        if self.db_client is not None:
            try:
                docs = self.db_client.collection("locations").stream()
                states = [doc.id for doc in docs]
                if states:
                    return sorted(states)
            except Exception as e:
                print(f"Firestore error fetching states, falling back to local JSON: {e}")
        return sorted(list(self._local_data.keys()))

    def get_cities(self, state: str) -> list[str]:
        if self.db_client is not None:
            try:
                doc = self.db_client.collection("locations").document(state).get()
                if doc.exists:
                    cities = doc.to_dict().get("cities", [])
                    return sorted(cities)
            except Exception as e:
                print(f"Firestore error fetching cities for state '{state}', falling back to local JSON: {e}")
        return sorted(self._local_data.get(state, []))
