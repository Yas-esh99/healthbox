import unittest

from app.firebase import get_firestore_client


class FirebaseFallbackTests(unittest.TestCase):
    def test_returns_none_when_firebase_credentials_are_missing(self):
        with self.assertLogs("app.firebase", level="WARNING"):
            client = get_firestore_client()

        self.assertIsNone(client)


if __name__ == "__main__":
    unittest.main()
