import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Set environment variable to make sure get_firestore_client can find the file if needed
from dotenv import load_dotenv
load_dotenv()

from app.firebase import get_firestore_client

db = get_firestore_client()
if not db:
    print("Failed to initialize Firestore client.")
    sys.exit(1)

collections = ["hospitals", "schemes", "pharmacies"]
for col_name in collections:
    print(f"\n=== Collection: {col_name} ===")
    col_ref = db.collection(col_name)
    docs = list(col_ref.limit(3).stream())
    if not docs:
        print("No documents found in this collection.")
    for doc in docs:
        print(f"Doc ID: {doc.id}")
        data = doc.to_dict()
        for k, v in data.items():
            print(f"  {k}: {type(v).__name__} = {v}")
