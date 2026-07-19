import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

CONDITION_CATEGORIES = [
    "Diabetes & Hypertension",
    "Viral Pharyngitis",
    "Asthma & COPD",
    "Contact Dermatitis",
    "Gastroenteritis"
]

SEED_HEATMAP_DATA = [
    {"state": "Gujarat", "district": "Ahmedabad", "disease": "Diabetes & Hypertension", "cases_count": 24},
    {"state": "Gujarat", "district": "Ahmedabad", "disease": "Viral Pharyngitis", "cases_count": 18},
    {"state": "Gujarat", "district": "Gandhinagar", "disease": "Asthma & COPD", "cases_count": 15},
    {"state": "Gujarat", "district": "Gandhinagar", "disease": "Contact Dermatitis", "cases_count": 9},
    {"state": "Gujarat", "district": "Surat", "disease": "Viral Pharyngitis", "cases_count": 32},
    {"state": "Gujarat", "district": "Surat", "disease": "Gastroenteritis", "cases_count": 22},
    {"state": "Gujarat", "district": "Rajkot", "disease": "Diabetes & Hypertension", "cases_count": 14},
    {"state": "Gujarat", "district": "Rajkot", "disease": "Asthma & COPD", "cases_count": 11},
]

def classify_condition_category(primary_diagnosis: str, api_key: str | None) -> str:
    """Classifies a free-text diagnosis into one of the predefined CONDITION_CATEGORIES using gemini-3.1-flash-lite."""
    if not api_key:
        logger.warning("Gemini API key not configured. Skipping classification.")
        return "Other"
        
    client = genai.Client(api_key=api_key)
    prompt = f"""
    You are a medical categorization system.
    Given the following primary diagnosis, classify it into exactly one of these categories:
    {", ".join(f"'{c}'" for c in CONDITION_CATEGORIES)} or 'Other'.
    
    Primary Diagnosis: "{primary_diagnosis}"
    
    Choose the category that is most clinically relevant. Respond with only the name of the category, nothing else.
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
            )
        )
        if response and response.text:
            category = response.text.strip().replace('"', '').replace("'", "")
            # Ensure it is one of the valid categories
            if category in CONDITION_CATEGORIES or category == "Other":
                return category
            # Do a fallback case-insensitive comparison
            for c in CONDITION_CATEGORIES:
                if c.lower() == category.lower():
                    return c
            if category.lower() == "other":
                return "Other"
        return "Other"
    except Exception as e:
        logger.error(f"Error classifying condition category: {e}")
        return "Other"


def get_disease_heatmap_data(disease: str | None, records_repo, users_repo) -> list[dict]:
    """Retrieve disease heatmap data aggregated by state and district from Firestore, combined with baseline seed data."""
    if disease is not None:
        disease = disease.strip()
        if not disease:
            disease = None

    tokens = []
    if disease:
        q = disease.lower()
        tokens = [t.strip() for t in q.replace("&", " ").replace("and", " ").split() if t.strip()]

    # 1. Fetch all records from Firestore
    all_records = []
    if records_repo and hasattr(records_repo, "collection") and records_repo.collection is not None:
        try:
            for doc in records_repo.collection.stream():
                payload = doc.to_dict() or {}
                payload["id"] = doc.id
                all_records.append(payload)
        except Exception as e:
            logger.error(f"Error fetching triage records: {e}")

    # 2. Fetch all users to map phone_number -> (state, district)
    user_locations = {}
    if users_repo and hasattr(users_repo, "collection") and users_repo.collection is not None:
        try:
            for doc in users_repo.collection.stream():
                payload = doc.to_dict() or {}
                user_locations[doc.id] = {
                    "state": payload.get("state", "Unknown"),
                    "district": payload.get("district", "Unknown")
                }
        except Exception as e:
            logger.error(f"Error fetching user locations: {e}")

    # 3. Aggregate dynamic Firestore records
    dynamic_counts = {}
    for rec in all_records:
        phone = rec.get("phone_number")
        loc = user_locations.get(phone, {"state": "Gujarat", "district": "Ahmedabad"})
        state = loc.get("state") or "Gujarat"
        district = loc.get("district") or "Ahmedabad"
        
        report = rec.get("report") or {}
        rec_disease = report.get("primary_diagnosis") or "Unknown disease"
        
        if disease is not None:
            r_lower = rec_disease.lower()
            if q not in r_lower and r_lower not in q and not any(tok in r_lower for tok in tokens):
                continue
            
        key = (state, district, rec_disease)
        dynamic_counts[key] = dynamic_counts.get(key, 0) + 1

    # 4. Merge seed baseline data with dynamic counts
    merged_data = {}
    for item in SEED_HEATMAP_DATA:
        seed_disease = item["disease"]
        if disease is not None:
            s_lower = seed_disease.lower()
            if q not in s_lower and s_lower not in q and not any(tok in s_lower for tok in tokens):
                continue
        key = (item["state"], item["district"], seed_disease)
        merged_data[key] = item["cases_count"]

    for key, count in dynamic_counts.items():
        merged_data[key] = merged_data.get(key, 0) + count

    # Convert to response list structure
    result = []
    for (state, district, disease_name), count in merged_data.items():
        result.append({
            "state": state,
            "district": district,
            "disease": disease_name,
            "cases_count": count
        })
        
    return result


def enrich_diagnosis(
    primary_diagnosis: str,
    schemes_repo,
    hospitals_repo,
    records_repo,
    users_repo,
    api_key: str | None
) -> dict:
    """Given a free-text diagnosis, classify it into a condition_category and
    return matched schemes, matched hospitals (split-ready via is_govt), and
    disease-filtered heatmap data."""
    # 1. Classify the condition category
    category = classify_condition_category(primary_diagnosis, api_key)
    
    # 2. Match schemes and hospitals
    matched_schemes = []
    nearest_hospitals = []
    
    if schemes_repo:
        matched_schemes = schemes_repo.search(primary_diagnosis)
        if not matched_schemes and category != "Other":
            matched_schemes = schemes_repo.search(category)
            
        # Fallback mappings for specific categories that don't directly match
        if not matched_schemes:
            if category == "Viral Pharyngitis":
                matched_schemes = schemes_repo.search("Covid-19")
            elif category == "Contact Dermatitis":
                matched_schemes = schemes_repo.search("General")
                
        # Global fallback if still empty
        if not matched_schemes:
            matched_schemes = schemes_repo.get_all()[:3]
            
    if hospitals_repo:
        nearest_hospitals = hospitals_repo.search(primary_diagnosis)
        if not nearest_hospitals and category != "Other":
            nearest_hospitals = hospitals_repo.search(category)
            
        # Fallback mappings for specific categories that don't directly match
        if not nearest_hospitals:
            if category == "Viral Pharyngitis":
                nearest_hospitals = hospitals_repo.search("Pneumonia")
            elif category == "Contact Dermatitis":
                nearest_hospitals = hospitals_repo.search("General")
                
        # Global fallback if still empty
        if not nearest_hospitals:
            nearest_hospitals = hospitals_repo.get_all()[:6]

    # 3. Match heatmap
    disease_heatmap = get_disease_heatmap_data(primary_diagnosis, records_repo, users_repo)
    
    return {
        "condition_category": category,
        "matched_schemes": [s.model_dump() for s in matched_schemes],
        "nearest_hospitals": [h.model_dump() for h in nearest_hospitals],
        "disease_heatmap": disease_heatmap
    }
