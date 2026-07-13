import unittest

from app.models import RegisterRequest
from app.repositories.users import InMemoryUserRepository


class InMemoryUserRepositoryTests(unittest.TestCase):
    def test_create_and_get_by_phone_round_trip(self):
        repo = InMemoryUserRepository()
        payload = RegisterRequest(
            phone_number="9876543210",
            full_name="Asha Singh",
            state="Bihar",
            district="Patna",
            age=28,
            gender="Female",
            has_ayushman=False,
            conditions=["Fever"],
        )

        created = repo.create(payload)
        loaded = repo.get_by_phone(payload.phone_number)

        self.assertIsNotNone(created)
        self.assertEqual(created.phone_number, payload.phone_number)
        self.assertEqual(loaded.phone_number, payload.phone_number)
        self.assertEqual(loaded.full_name, payload.full_name)


if __name__ == "__main__":
    unittest.main()
