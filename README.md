   # 🏥 Healthbox (v3.0)

   **Healthbox** is an intelligent, full-stack healthcare platform designed to streamline and democratize patients' medical journeys. Powered by **Google Gemini AI** and **Firebase Firestore**, Healthbox offers AI-driven symptom triage, medical report OCR & diagnostic analysis, disease outbreak heatmaps, hospital and pharmacy discovery, government scheme recommendations, and multi-lingual conversational AI support.

   ---

   ## ✨ Key Features

   - 🩺 **AI Symptoms Triage**: Guided intake (voice or text) powered by Gemini AI. Provides instant risk tier assessment (Urgent, Moderate, Low), clinical evidence indicators, actionable home care recommendations, and emergency warnings.
   - 💬 **Gemini Health Assistant (Chat)**: Multi-turn conversational chatbot with active function/tool calling that queries real-time Firestore data for nearby hospitals, pharmacies, and scheme eligibility.
   - 📑 **Medical Report Analysis**: Upload lab reports (JPEG, PNG, PDF) for AI OCR parsing. Gemini extracts key diagnostic indicators, identifies health anomalies, and matches relevant healthcare schemes.
   - 🗺️ **Disease Heatmap & Location Services**: Interactive map visualizing regional disease outbreak cases by state/district alongside real-time hospital and pharmacy directories.
   - 🏛️ **Government Health Schemes**: Automated matching with public welfare programs (e.g., Ayushman Bharat PM-JAY, State Health Schemes) based on profile demographics and health conditions.
   - 🔐 **OTP Authentication**: Phone number OTP verification backed by HTTPOnly cookie sessions for secure user access control.
   - 🌐 **Multi-Language Support**: Built-in localization support (English, Hindi, Gujarati, Marathi, etc.) for inclusive healthcare access.

   ---

   ## 🏗️ Architecture Overview

   Healthbox is designed as a decoupled monorepo featuring a React 19 / TanStack Start frontend and a FastAPI / Uvicorn backend:

   ```mermaid
   graph TD
      subgraph Frontend [React Frontend - Port 5173]
         Client[TanStack Start SSR Client]
         APIClient[apiFetch client - lib/api.ts]
      end

      subgraph Backend [FastAPI Backend - Port 8000]
         API[FastAPI Routers]
         LLM[Google Gemini AI SDK]
         DB[Firebase Firestore Repositories]
      end

      Client -->|User Interaction| APIClient
      APIClient -->|HTTP / CORS / Session Cookies| API
      API -->|GenAI Analysis & Function Calling| LLM
      API -->|Read/Write User Data & Directories| DB
   ```

   ### Stack Breakdown

   - **Frontend**: **React 19**, **Vite 8**, **TypeScript 5.8**, **TanStack Start** (SSR & file-based routing), **TanStack Query v5**, **Tailwind CSS v4** + **shadcn/ui**, **Leaflet** maps.
   - **Backend**: **FastAPI 0.115**, **Uvicorn**, **Pydantic v2**, **Firebase Admin SDK** (Firestore), **Google GenAI SDK** (`google-genai`).

   ---

   ## 📂 Directory Layout

   ```
   healthbox/
   ├── backend/                  # FastAPI Python REST API
   │   ├── app/                  # Application core
   │   │   ├── routers/          # API endpoints (auth, chat, hospitals, pharmacies, schemes, records, reports, location)
   │   │   ├── repositories/     # Firestore database access layer
   │   │   ├── services/         # JWT authentication & logic services
   │   │   ├── models.py         # Pydantic schemas
   │   │   ├── config.py         # Environment settings
   │   │   ├── firebase.py       # Firebase Admin SDK initialization
   │   │   └── states_and_districts.json  # Regional location data
   │   ├── tests/                # Pytest test suite
   │   ├── .env.example          # Environment variables template
   │   └── requirements.txt      # Python dependencies
   ├── frontend/                 # Vite + TanStack Start React frontend
   │   ├── src/
   │   │   ├── routes/           # File-based page routes (home, triage, symptoms, records, chat, etc.)
   │   │   ├── components/       # Shared UI components (bottom-nav, sos-button, shadcn UI primitives)
   │   │   ├── lib/              # API client (api.ts), auth context, language context, utils
   │   │   └── styles.css        # Global Tailwind CSS v4 design system
   │   └── package.json          # JavaScript dependencies and scripts
   ├── start.sh                  # Unified bash startup script (Local & LAN support)
   ├── LICENSE                   # Apache 2.0 License
   └── README.md                 # Project root documentation (this file)
   ```

   ---

   ## 🚀 Quick Start (Recommended)

   The easiest way to start both the frontend and backend concurrently is using the unified startup script `start.sh` in the root directory.

   ### Prerequisite Checklist

   1. **Python 3.10+**: Make sure Python is installed.
   2. **Node.js or Bun**: Install [Bun](https://bun.sh/) (preferred) or Node.js (v18+).
   3. **Environment setup**: Copy `backend/.env.example` to `backend/.env` and supply your Firebase service account key and Google Gemini API key:
      ```bash
      cp backend/.env.example backend/.env
      ```

   ### Running the Application

   1. Make the startup script executable:
      ```bash
      chmod +x start.sh
      ```

   2. **Localhost Mode** (Runs on `localhost` loopback interface):
      ```bash
      ./start.sh
      ```
      - *Frontend*: [http://localhost:5173](http://localhost:5173)
      - *Backend API*: [http://localhost:8000](http://localhost:8000)
      - *API Interactive Docs*: [http://localhost:8000/docs](http://localhost:8000/docs)

   3. **LAN Mode** (Runs on your network IP for mobile testing on same Wi-Fi/network):
      ```bash
      ./start.sh --lan
      ```
      *The terminal will output your local network IP (e.g. `http://192.168.1.10:5173`) for accessing the app on phones and tablets.*

   Press `Ctrl + C` in the terminal to cleanly shut down both servers.

   ---

   ## 🔧 Standalone Setup

   If you prefer running the frontend and backend independently in separate terminals:

   - 🛡️ **Backend Documentation & API Endpoints**: [backend/README.md](backend/README.md)
   - 🎨 **Frontend Routing & Components**: [frontend/README.md](frontend/README.md)

   ---

   ## 📄 License

   This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
