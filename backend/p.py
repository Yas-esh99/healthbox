import random
import firebase_admin
from firebase_admin import credentials, firestore

# 1. Configuration & Firebase Init
CRED_PATH = "/home/yashesh/biothon/healthbox_3.0/backend/healthbox-83b67-firebase-adminsdk-fbsvc-9cde0c6b0c.json"
COLLECTION_NAME = "hospitals"

if not firebase_admin._apps:
    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# 2. Medical keyword variance to ensure different types of images are pulled
MEDICAL_KEYWORDS = ["hospital", "clinic", "medical", "doctor", "surgery"]

def generate_hospital_urls(count=100):
    urls = []
    for i in range(count):
        # We pick a random keyword from our array for variance
        keyword = random.choice(MEDICAL_KEYWORDS)
        
        # LoremFlickr format: https://loremflickr.com/width/height/keywords?lock=unique_seed
        # The 'lock' parameter guarantees a unique random image for each iteration i
        url = f"https://loremflickr.com/800/600/{keyword}?lock={i + 1}"
        urls.append(url)
    return urls

def update_firestore_images():
    try:
        print("🛠️ Generating 100 unique, live hospital image URLs...")
        image_urls = generate_hospital_urls(100)
        
        collection_ref = db.collection(COLLECTION_NAME)
        docs = list(collection_ref.stream())
        
        if not docs:
            print(f"❌ Error: No documents found in the '{COLLECTION_NAME}' collection to update.")
            return
            
        total_docs = len(docs)
        print(f"📦 Found {total_docs} existing hospital documents. Starting batch updates...")
        
        # Firestore supports batch writes up to 500 operations at once—highly optimized!
        batch = db.batch()
        
        for idx, doc in enumerate(docs):
            # Assign one of the 100 random image URLs generated
            assigned_url = image_urls[idx % 100]
            
            # Stage the field update in our batch
            batch.update(doc.reference, {
                "hospital_image": assigned_url
            })
            
            # Commit the batch every 100 operations to stay safe, or at the end
            if (idx + 1) % 100 == 0:
                print(f"🔄 Committing batch update for documents {idx - 98} to {idx + 1}...")
                batch.commit()
                batch = db.batch() # Reset batch for next chunk if collection is large
                
        # Commit any remaining updates left in the batch
        if total_docs % 100 != 0:
            batch.commit()
            
        print(f"✅ Success! Updated 'hospital_image' fields for {total_docs} documents without touching other schema keys.")
            
    except Exception as e:
        print(f"💥 An error occurred while updating Firestore: {e}")

if __name__ == "__main__":
    update_firestore_images()