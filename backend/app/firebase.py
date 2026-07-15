import logging
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

from app.config import get_settings

logger = logging.getLogger(__name__)


def get_firestore_client():
    settings = get_settings()

    if not settings.google_application_credentials or not settings.firebase_project_id:
        logger.warning(
            "Firebase credentials are not configured. Starting without Firestore backend. "
            "Set GOOGLE_APPLICATION_CREDENTIALS to the absolute path of your Firebase service "
            "account JSON file and FIREBASE_PROJECT_ID in backend/.env to enable persistence."
        )
        return None

    creds_path = Path(settings.google_application_credentials)
    if not creds_path.is_file():
        logger.warning(
            "Firebase credentials file was not found at %s. Starting without Firestore backend.",
            creds_path,
        )
        return None

    if "path/to/service-account.json" in settings.google_application_credentials or "your-firebase-project-id" in settings.firebase_project_id:
        logger.warning(
            "Firebase credentials appear to use placeholder values. Starting without Firestore backend."
        )
        return None

    if not firebase_admin._apps:
        options = {"projectId": settings.firebase_project_id}
        certificate = credentials.Certificate(str(creds_path))
        firebase_admin.initialize_app(certificate, options=options)

    return firestore.client()

