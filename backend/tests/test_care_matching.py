import unittest
from unittest.mock import MagicMock
from app.services.care_matching import enrich_diagnosis, classify_condition_category, get_disease_heatmap_data

class CareMatchingTests(unittest.TestCase):
    def test_classify_condition_category_empty_key(self):
        category = classify_condition_category("Diabetes and high blood pressure", api_key=None)
        self.assertEqual(category, "Other")

    def test_enrich_diagnosis_with_mocks(self):
        schemes_repo = MagicMock()
        hospitals_repo = MagicMock()
        records_repo = MagicMock()
        users_repo = MagicMock()
        
        # Mock searches
        scheme_mock = MagicMock()
        scheme_mock.model_dump.return_value = {"id": "sch1", "name": "Scheme A"}
        schemes_repo.search.return_value = [scheme_mock]
        
        hospital_mock = MagicMock()
        hospital_mock.model_dump.return_value = {"id": "hosp1", "name": "Hospital B", "is_govt": True}
        hospitals_repo.search.return_value = [hospital_mock]
        
        # Mock Firestore stream
        records_repo.collection = None
        users_repo.collection = None
        
        enrichment = enrich_diagnosis(
            primary_diagnosis="Diabetes",
            schemes_repo=schemes_repo,
            hospitals_repo=hospitals_repo,
            records_repo=records_repo,
            users_repo=users_repo,
            api_key=None
        )
        
        self.assertEqual(enrichment["condition_category"], "Other")
        self.assertEqual(len(enrichment["matched_schemes"]), 1)
        self.assertEqual(enrichment["matched_schemes"][0]["name"], "Scheme A")
        self.assertEqual(len(enrichment["nearest_hospitals"]), 1)
        self.assertEqual(enrichment["nearest_hospitals"][0]["name"], "Hospital B")
        self.assertTrue(len(enrichment["disease_heatmap"]) > 0) # Should have seed data

if __name__ == "__main__":
    unittest.main()
