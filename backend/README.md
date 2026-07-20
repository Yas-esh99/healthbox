# Healthbox Backend

A **FastAPI** powered REST API backend for the Healthbox healthcare platform. It handles authentication (phone OTP), user profiles, hospital/pharmacy directories, government health schemes, AI-powered chat, and medical report analysis — all backed by **Firestore** and **Google Gemini AI**.

---

## ⚙️ Tech Stack

| Layer          | Technology                                    |
|----------------|-----------------------------------------------|
| Web Framework  | FastAPI 0.115                                 |
| ASGI Server    | Uvicorn (with `standard` extras)              |
| Database       | Firebase Firestore (via `firebase-admin`)     |
| AI Integration | Google GenAI SDK (`google-genai`) — Gemini    |
| Auth           | PyJWT — HTTPOnly cookie-based sessions        |
| Validation     | Pydantic v2 (`pydantic-settings`)             |
| Python         | 3.10+                                         |

---

## 📂 Directory Structure

```
backend/
├── app/
│   ├── main.py               # FastAPI app factory, CORS, router registration, lifespan
│   ├── config.py             # Settings loaded from .env via pydantic-settings
│   ├── firebase.py           # Firebase Admin SDK initialization
│   ├── models.py             # All Pydantic request/response schemas
│   ├── states_and_districts.json  # Static location data (states → districts)
│   ├── routers/
│   │   ├── auth.py           # OTP authentication and user session management
│   │   ├── chat.py           # Gemini-powered AI health chat with function calling
│   │   ├── hospitals.py      # Hospital directory endpoints
│   │   ├── pharmacies.py     # Pharmacy directory endpoints
│   │   ├── schemes.py        # Government health scheme endpoints
│   │   ├── records.py        # Triage records storage + disease heatmap
│   │   ├── reports.py        # Gemini-powered medical report analysis (image/PDF)
│   │   └── location.py       # States and districts location data API
│   ├── repositories/
│   │   ├── users.py          # Firestore user CRUD operations
│   │   ├── hospitals.py      # Firestore hospital queries
│   │   ├── pharmacies.py     # Firestore pharmacy queries
│   │   ├── schemes.py        # Firestore scheme queries
│   │   ├── records.py        # Firestore triage record operations
│   │   └── location.py       # Location data repository
│   └── services/
│       └── auth.py           # JWT token creation and decoding
├── .env                      # Runtime configuration (DO NOT COMMIT)
├── .env.example              # Environment variable template
└── requirements.txt          # Python dependencies
```

---

## 🚀 Setup & Running

### 1. Create a Virtual Environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # On Linux/macOS
# Or on Windows:
# .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
APP_NAME=Healthbox Backend
API_V1_PREFIX=/api/v1

# Comma-separated list of allowed frontend origins
FRONTEND_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]

# JWT secret for signing session tokens
JWT_SECRET=change-this-to-a-long-random-string-in-production

# OTP code used for demo/testing (all phone numbers use this code)
OTP_CODE=123456

SESSION_EXPIRE_HOURS=24
COOKIE_SECURE=false

# Path to your Firebase service account JSON file
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/firebase-adminsdk.json

# Firebase project ID (from Firebase console)
FIREBASE_PROJECT_ID=your-firebase-project-id

# Google AI Studio API key for Gemini
GEMINI_API_KEY=your-gemini-api-key-here
```

### 4. Run the Server

**Locally** (only accessible from this machine):

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**LAN Mode** (accessible from devices on the same network):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be live at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

## 🔌 API Reference

All routes are prefixed with `/api/v1`.

### 🔐 Auth — `/api/v1/auth`

| Method | Path                     | Description                                                    |
|--------|--------------------------|----------------------------------------------------------------|
| POST   | `/auth/request-otp`      | Send a 6-digit OTP to a phone number                          |
| POST   | `/auth/verify-otp`       | Verify OTP; sets session or registration cookie               |
| POST   | `/auth/register`         | Complete registration with profile info                       |
| GET    | `/auth/session`          | Check current session status and return user profile          |
| POST   | `/auth/logout`           | Clear session cookie                                          |
| PUT    | `/auth/profile`          | Update the authenticated user's profile details               |

> **Auth Model**: Uses **HTTPOnly cookies**. After `verify-otp` or `register`, the server sets a `healthbox_session` cookie that is automatically sent with all subsequent requests.

---

### 💬 Chat — `/api/v1/chat`

| Method | Path    | Description                                                                 |
|--------|---------|-----------------------------------------------------------------------------|
| POST   | `/chat` | Send a message to the Gemini-powered health assistant. Supports multi-turn chat with conversation history. Includes tool-calling to search hospitals, pharmacies, and schemes in Firestore. |

**Request body:**
```json
{
  "messages": [
    {"role": "user", "text": "Which hospitals near me accept Ayushman card?"},
    {"role": "bot", "text": "...previous reply..."},
    {"role": "user", "text": "Which one has emergency?"}
  ]
}
```

---

### 🏥 Hospitals — `/api/v1/hospitals`

| Method | Path          | Description                     |
|--------|---------------|---------------------------------|
| GET    | `/hospitals`  | Retrieve all hospitals from Firestore |

---

### 💊 Pharmacies — `/api/v1/pharmacies`

| Method | Path           | Description                       |
|--------|----------------|-----------------------------------|
| GET    | `/pharmacies`  | Retrieve all pharmacies from Firestore |

---

### 📋 Schemes — `/api/v1/schemes`

| Method | Path        | Description                                   |
|--------|-------------|-----------------------------------------------|
| GET    | `/schemes`  | Retrieve all government health schemes from Firestore |

---

### 📁 Records — `/api/v1/records`

Requires authentication (session cookie).

| Method | Path               | Description                                                           |
|--------|--------------------|-----------------------------------------------------------------------|
| POST   | `/records`         | Save a new AI triage diagnostic record for the authenticated user    |
| GET    | `/records`         | Retrieve all triage records for the authenticated user               |
| GET    | `/records/heatmap` | Get aggregated disease case counts by state/district (for heatmap)  |

---

### 📊 Reports — `/api/v1/reports`

| Method | Path              | Description                                                                          |
|--------|-------------------|--------------------------------------------------------------------------------------|
| POST   | `/reports/analyze` | Upload a medical report image (JPEG/PNG) or PDF. Gemini AI analyzes it and returns structured diagnosis, emergency level, matched schemes, and nearest hospitals. Max file size: 10 MB. |

---

### 📍 Location — `/api/v1/location`

| Method | Path                    | Description                       |
|--------|-------------------------|-----------------------------------|
| GET    | `/location/states`      | List all available states         |
| GET    | `/location/cities`      | List cities/districts for a state (`?state=Gujarat`) |

---

## 🔒 Security Notes

- JWT tokens are signed with `JWT_SECRET`. Change this to a long random value in production.
- Set `COOKIE_SECURE=true` when deploying over HTTPS.
- The demo OTP (`OTP_CODE=123456`) is used for all phone numbers — this is intentional for hackathon/demo purposes and must be replaced with a real SMS gateway in production.
- Firebase Admin credentials should **never** be committed to version control. Use environment variables or secure secret stores.

---

## 🧪 Testing

```bash
# Run all tests
cd backend
python -m pytest tests/

# Interactive API exploration
# Open in browser after starting the server:
http://localhost:8000/docs
```
