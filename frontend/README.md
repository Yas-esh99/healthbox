I explored the entire `frontend/` app (routes, shared libs, build/runtime config) and there are currently **no real API calls**—all “backend” behavior is mocked in UI state, timers, and localStorage.

**Tech Stack**

- Runtime/build: Vite + TypeScript ([package.json](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/package.json), [vite.config.ts](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/vite.config.ts))
- App framework: TanStack Start (SSR) + TanStack Router (file-based routes) + TanStack Query ([package.json](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/package.json), [start.ts](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/start.ts), [router.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/router.tsx))
- UI/styling: Tailwind CSS v4 + shadcn/ui + Radix primitives + lucide icons ([styles.css](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/styles.css), [components.json](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/components.json))
- Forms/validation: react-hook-form + zod (deps present; not heavily used in current pages) ([package.json](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/package.json))
- Toasts: sonner ([\_\_root.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/__root.tsx#L14-L16))
- Package manager hints: Bun lockfile + bunfig supply-chain guard ([bunfig.toml](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/bunfig.toml))

**Folder Structure**

- `frontend/src/routes/`: File-based pages (TanStack Router) ([routeTree.gen.ts](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routeTree.gen.ts))
- `frontend/src/components/`: App components like bottom nav + SOS button ([bottom-nav.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/components/bottom-nav.tsx), [sos-button.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/components/sos-button.tsx))
- `frontend/src/components/ui/`: shadcn/Radix-based UI primitives (many files under `ui/`)
- `frontend/src/lib/`: Utilities + language context + SSR error tooling ([language.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/lib/language.tsx), [utils.ts](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/lib/utils.ts), [error-capture.ts](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/lib/error-capture.ts))
- `frontend/src/hooks/`: Small hooks (e.g. mobile detection)
- Root/build config: `vite.config.ts`, `tsconfig.json` (with `@/*` alias) ([tsconfig.json](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/tsconfig.json))

**Key Routes / Pages**

- `/`
  - **Description**: Root path.
  - **Redirects to**: `/language` ([index.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/index.tsx))

- `/language`
  - **Description**: Initial language selection screen for localization.
  - **Features**: Multi-lingual selection (Hindi, English, etc.). Stores the chosen language configuration in `localStorage`.
  - **Next Route**: `/login` ([language.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/language.tsx), [lib/language.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/lib/language.tsx))

- `/login`
  - **Description**: Authentication initialization screen using a phone number.
  - **Inputs**: 10-digit mobile number (`phone`).
  - **Flow**: Simulates sending a 6-digit OTP code to the provided phone number via toast and navigates to the next page.
  - **Next Route**: `/verify-otp?phone={phone}` ([login.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/login.tsx))

- `/verify-otp`
  - **Description**: OTP validation page.
  - **Inputs**: 6-digit PIN code keypad UI.
  - **Search Params**: `phone` (passed from `/login`).
  - **Flow**: Validates the 6 digits (simulated delay), displays success toast, and redirects to `/home` (or registers if onboarding is needed).
  - **Next Route**: `/home` ([verify-otp.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/verify-otp.tsx))

- `/register`
  - **Description**: Multi-step user onboarding and registration screen to setup user profile.
  - **Step 1: Location & Profile**
    - Inputs: Full Name (`name`), State (`state`), District (`district`). District updates dynamically based on the selected state (Bihar, Uttar Pradesh, Rajasthan, Madhya Pradesh, Maharashtra).
  - **Step 2: Demographics**
    - Inputs: Age slider (`age`, default 30), Gender selection grid (`gender`: Male, Female, Other).
  - **Step 3: Medical Info & Ayushman Details**
    - Inputs: Ayushman PMJAY card status (`hasAyushman` toggle), Card Number (`cardNumber` text input), Chronic conditions selection checklist (`conditions`: Diabetes, Blood Pressure, None).
  - **Next Route**: Redirects to `/home` upon completion with a welcome toast ([register.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/register.tsx)).

- `/home`
  - **Description**: The primary patient dashboard and hub.
  - **Features**: Displays user status, shortcuts to main actions (Symptoms diagnostic intake, Upload report, Hospital directory, Pharmacy directory, Government Schemes, Medical History/Records). Contains a global persistent bottom navigation bar (`BottomNav`) and an emergency `SOS` button.
  - **Next Routes**: `/symptoms`, `/upload-report`, `/hospitals`, `/pharmacies`, `/schemes`, `/records`, `/chat` ([home.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/home.tsx))

- `/symptoms`
  - **Description**: Voice/text-enabled AI triage assistant interface.
  - **Inputs**: Transcribed speech input (simulated microphone voice activity recording or manual text entry), affected area selection, additional medical files/reports attachments.
  - **Flow**: Starts a conversational UI. Submit starts a mocked analyzer, then navigates to triage results page.
  - **Next Route**: `/triage-results` ([symptoms.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/symptoms.tsx))

- `/triage-results`
  - **Description**: Details page showing the AI-generated clinical triage summary.
  - **Data Displayed**: Mocked risk levels (Urgent, Moderate, Low), potential diagnosis, clinical evidence indicators, actionable "Do & Don't" tips, and recommended care settings (e.g. general physician, ER).
  - **Next Route**: Links to nearby camps/hospitals (`/camps` or `/hospitals`) ([triage-results.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/triage-results.tsx))

- `/camps`
  - **Description**: Directory of government healthcare camps, schemes, and hospitals.
  - **Data**: Static list of active health camps with location details, dates, and direct contact/directions controls.
  - **Navigation**: Part of the core bottom navigation menu ([camps.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/camps.tsx))

- `/schemes`
  - **Description**: Card scanning and eligibility checker.
  - **Inputs**: Scan document (camera/mock upload).
  - **Flow**: Simulates OCR card scanning with a loading spinner, matching the user with eligible welfare programs (e.g. Ayushman Bharat, PM-JAY, State health benefits).
  - **Navigation**: Part of the core bottom navigation menu ([schemes.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/schemes.tsx))

- `/hospitals`
  - **Description**: Directory of surrounding hospital facilities.
  - **Data**: Hardcoded list of healthcare facilities, specialized departments, and current bed/doctor availability statistics.
  - **Actions**: Trigger mock directions or phone calls (via toast notification) ([hospitals.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/hospitals.tsx))

- `/pharmacies`
  - **Description**: Directory of surrounding medicine shops.
  - **Data**: Hardcoded list of pharmacies, their operational hours, distances, and contact details.
  - **Actions**: Trigger mock directions or phone calls ([pharmacies.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/pharmacies.tsx))

- `/upload-report`
  - **Description**: Report storage submission portal.
  - **Inputs**: File selector (PDF/images), file type/category dropdown.
  - **Flow**: Mock uploads the file, triggers a successful upload toast notification, and redirects to home page ([upload-report.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/upload-report.tsx))

- `/records`
  - **Description**: Historical medical logs dashboard.
  - **Data**: Historical records list persisted in `localStorage` under `healthbox.records.v1`. Contains triage logs, uploaded cards, and prescriptions.
  - **Next Route**: View individual historical triage reports ([records.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/records.tsx))

- `/chat`
  - **Description**: Chatbot assistant interface.
  - **Flow**: Immediate interactive chat window with predetermined scripted replies matching common queries, running via mocked delays.
  - **Navigation**: Part of the core bottom navigation menu ([chat.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/chat.tsx))

**Navigation Components**

- **Bottom Tab Bar**: Fixed navigation between `/home`, `/schemes`, `/camps`, and `/chat` ([bottom-nav.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/components/bottom-nav.tsx)).
- **SOS Button**: Global floating button triggering emergency service actions (mock toast) ([sos-button.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/components/sos-button.tsx)).

**API Expectations / Mocks (What Backend Would Need To Provide)**

- Auth (currently mocked):
  - `POST /auth/otp/send` (phone) used by `/login` flow
  - `POST /auth/otp/verify` (phone + code) used by `/verify-otp`
  - Optional: session/JWT + `GET /me` for profile shown on `/home`
- Triage (currently mocked via `setTimeout` + static result):
  - `POST /triage` (demographics, vitals, symptom narrative, flags, uploads metadata) → returns `triageId`, `riskTier`, `diagnosis`, `evidence[]`, `do/dont`, `recommendations`
  - `GET /triage/:id` for viewing saved report (feeds `/triage-results` and `/records` detail)
- Uploads (currently not uploaded anywhere):
  - `POST /uploads` (multipart) for images/PDFs from `/upload-report` and `/symptoms` “Affected Area” / “Reports & Cards”
- Records (currently localStorage):
  - `GET /records`, `POST /records`, `GET /records/:id` (or make records a view over triage history)
- Directories (currently hardcoded Bangalore/Ahmedabad examples):
  - `GET /hospitals?lat&lng&sort=rating|distance`
  - `GET /pharmacies?lat&lng`
  - `GET /camps?lat&lng&dateRange=...`
- Schemes/eligibility (currently fake “scan”):
  - `POST /schemes/scan` (image upload or OCR text) → returns matched schemes + required docs + links
- Chat assistant (currently static reply table):
  - `POST /chat` (message, language, context like last triage) → returns assistant reply (and optional TTS link)

**Existing Backend References / Config You’d Need To Align With**

- This is a TanStack Start SSR app; the server entry is wrapped in [server.ts](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/server.ts) and Start instance is in [start.ts](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/start.ts).
- Vite/TanStack config is delegated to `@lovable.dev/vite-tanstack-config` and mentions Nitro (build) and Cloudflare as default target in comments ([vite.config.ts](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/vite.config.ts)).
- No `.env` files are present; no `VITE_*` variables are currently referenced in code (search only found the SSR `fetch` handler in [server.ts](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/server.ts)).
- Path alias `@/*` is configured in TS ([tsconfig.json](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/tsconfig.json#L23-L25)) and used throughout imports.

If you want, I can translate the above into a concrete backend contract (OpenAPI) matching the UI’s current data shapes (e.g., `TriageRecord` from [records.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/records.tsx#L26

**Analyzing backend structure**

I need to provide a summary analysis and ask the user what to do next. No specific skills are required for this part. I should highlight key details and offer backend suggestions. I noticed that there's no backend folder, which could be in the root directory instead. It might be good to quickly inspect the root structure, so I think I'll run the LS command at the app root to see what exists there.

**Considering backend development steps**

The user responded quickly, so I can move forward, but they mentioned they'd provide further instructions. Since they already shared preferences, I’ll summarize my analysis and propose a backend plan using FastAPI and Firestore. I also need to outline proposed endpoints that match the UI and confirm recorded preferences. I’d like to check if there’s an existing backend folder—if not, I’ll suggest creating one. Finally, I’ll ask, “Should I start scaffolding the backend now?”

**Finalizing the response strategy**

I’m realizing I shouldn't ask for confirmation using the AskUserQuestion method, specifically not to say, “Is my plan ready?” In agent mode, I can use plain text instead. It's more effective to simply ask if the user wants to start implementing the plan. So, I’ll proceed with crafting a final message to communicate that clearly. Keeping it straightforward will show respect for their preferences and get us moving forward!

**What’s in your current project**

- The repo at [app/](file:///c:/Users/User/OneDrive/Desktop/Biothon/app) contains only a TanStack Start (SSR) + Vite + TypeScript frontend in [frontend/](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend).
- All “backend-like” behaviors are currently mocked with `setTimeout`, static arrays, and `localStorage` (no real network calls yet).
- Notable client persistence: `/records` uses `localStorage` key `healthbox.records.v1` ([records.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/records.tsx#L41-L195)).

**Main user flows (routes) that will need backend support**

- Auth flow is UI-only right now:
  - `/login` → simulates sending OTP ([login.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/login.tsx))
  - `/verify-otp` → simulates verification ([verify-otp.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/verify-otp.tsx))
- Triage/diagnostics flow is mocked:
  - `/symptoms` → collects symptom narrative/media but doesn’t send it anywhere ([symptoms.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/symptoms.tsx))
  - `/triage-results` → shows a hardcoded “AI report” ([triage-results.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/triage-results.tsx))
- Uploads are not uploaded:
  - `/upload-report` is toast + timer only ([upload-report.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/upload-report.tsx))
- Directories are hardcoded:
  - `/hospitals`, `/pharmacies`, `/camps` are static lists today ([hospitals.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/hospitals.tsx), [pharmacies.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/pharmacies.tsx), [camps.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/camps.tsx))
- Schemes scan is mocked:
  - `/schemes` shows results after a timer (no OCR/doc parsing yet) ([schemes.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/schemes.tsx))
- Chatbot is local scripted replies:
  - `/chat` uses a static response map ([chat.tsx](file:///c:/Users/User/OneDrive/Desktop/Biothon/app/frontend/src/routes/chat.tsx))

**Backend surface area suggested by the UI**

- `POST /triage` + `GET /triage/{id}` (power `/symptoms` → `/triage-results` and later `/records`)
- `POST /uploads` (multipart for scan/photo/PDF)
- `POST /schemes/scan` (image/PDF → extracted fields + eligible schemes)
- `GET /hospitals`, `GET /pharmacies`, `GET /camps` (later location-based)
- `POST /chat` (LLM-backed later; can start stubbed)

**Your backend preferences (captured)**

- Framework: FastAPI (Python)
- Database: Firestore
- Upload storage: local disk
- Auth: none for now (demo)

Tell me what you want me to do next: should I start by scaffolding a new `backend/` service (FastAPI app + Firestore wiring + initial REST endpoints that match the routes above), or do you want to start with one feature first (triage, uploads, schemes scan, or directories)?
