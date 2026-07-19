# Healthbox Frontend

A **React 19** + **TanStack Start** (SSR) + **Vite** web application for the Healthbox healthcare platform. Provides a mobile-first UI for OTP-based authentication, AI-powered symptoms triage, medical record tracking, hospital/pharmacy discovery, and government scheme recommendations.

---

## ⚙️ Tech Stack

| Layer              | Technology                                                  |
|--------------------|-------------------------------------------------------------|
| Framework          | React 19                                                    |
| Build Tool         | Vite 8                                                      |
| SSR Framework      | TanStack Start (with Nitro server adapter)                  |
| Routing            | TanStack Router (file-based)                                |
| Data Fetching      | TanStack Query v5                                           |
| Styling            | Tailwind CSS v4                                             |
| UI Components      | shadcn/ui + Radix UI primitives                             |
| Forms & Validation | react-hook-form + Zod                                       |
| Icons              | Lucide React                                                |
| Charts             | Recharts                                                    |
| PDF Export         | jsPDF + jsPDF-AutoTable                                     |
| Toasts             | Sonner                                                      |
| Language           | TypeScript 5.8                                              |
| Package Manager    | Bun (with npm fallback)                                     |

---

## 📂 Directory Structure

```
frontend/
├── src/
│   ├── routes/              # File-based pages (TanStack Router)
│   │   ├── __root.tsx       # Root layout — provides QueryClient, Toaster, and global structure
│   │   ├── index.tsx        # / → redirects to /language
│   │   ├── language.tsx     # Language selection screen
│   │   ├── login.tsx        # Phone number entry (OTP request)
│   │   ├── verify-otp.tsx   # OTP verification
│   │   ├── register.tsx     # Multi-step user registration/onboarding
│   │   ├── home.tsx         # Main dashboard
│   │   ├── symptoms.tsx     # AI triage symptom input
│   │   ├── triage-results.tsx # Triage analysis results
│   │   ├── records.tsx      # Historical medical records
│   │   ├── upload-report.tsx  # Medical report upload + AI analysis
│   │   ├── hospitals.tsx    # Hospital directory
│   │   ├── pharmacies.tsx   # Pharmacy directory
│   │   ├── schemes.tsx      # Government health schemes
│   │   ├── camps.tsx        # Health camps directory
│   │   ├── chat.tsx         # Gemini AI health chat
│   │   └── profile.tsx      # User profile management
│   ├── components/
│   │   ├── bottom-nav.tsx   # Fixed bottom navigation bar
│   │   ├── sos-button.tsx   # Global SOS floating button
│   │   └── ui/              # shadcn/Radix UI primitives (button, dialog, card, etc.)
│   ├── lib/
│   │   ├── api.ts           # Centralized API client (apiFetch) and data types
│   │   ├── auth.tsx         # Auth context and hooks
│   │   ├── language.tsx     # Language/i18n context
│   │   └── utils.ts         # clsx/tailwind-merge utilities
│   ├── hooks/
│   │   └── use-mobile.tsx   # Viewport width media query hook
│   ├── router.tsx           # TanStack Router root creation
│   ├── server.ts            # SSR server entry (Nitro/TanStack Start)
│   ├── start.ts             # TanStack Start client entry
│   └── styles.css           # Global CSS (Tailwind v4 base styles + custom tokens)
├── index.html               # HTML shell
├── vite.config.ts           # Vite configuration (via @lovable.dev/vite-tanstack-config)
├── tsconfig.json            # TypeScript config with @/* path alias
├── components.json          # shadcn/ui configuration
└── package.json             # Dependencies and scripts
```

---

## 🚀 Setup & Running

### 1. Install Dependencies

**With Bun** (recommended):
```bash
cd frontend
bun install
```

**With npm** (fallback):
```bash
cd frontend
npm install
```

### 2. Run the Dev Server

**Locally** (accessible only from this machine):
```bash
bun run dev
# or
npm run dev
```
App available at: `http://localhost:5173`

**LAN Mode** (accessible from any device on the same network):
```bash
bun run dev -- --host
# or
npm run dev -- --host
```
Vite will print the local network URL, e.g. `http://192.168.1.10:5173`.

> **Note**: The API client in `src/lib/api.ts` uses `window.location.hostname` to automatically target the backend, so no additional config is needed for LAN mode.

### 3. Build for Production

```bash
bun run build
# or
npm run build
```

### 4. Preview Production Build

```bash
bun run preview
# or
npm run preview
```

---

## 🔌 Backend API Client

The frontend communicates with the backend via a centralized fetch client in [`src/lib/api.ts`](file:///home/yashesh/biothon/healthbox_3.0/frontend/src/lib/api.ts).

**Base URL Logic:**
```typescript
const API_BASE_URL =
  typeof window !== "undefined"
    ? `http://${window.location.hostname}:8000/api/v1`
    : "http://localhost:8000/api/v1";
```

This means:
- When accessed from `localhost`, it calls `http://localhost:8000/api/v1`
- When accessed from a LAN IP (e.g. `192.168.1.10`), it automatically calls `http://192.168.1.10:8000/api/v1`

All requests include `credentials: "include"` to automatically send session cookies.

---

## 🗺️ Pages & Routes

| Route             | Description                                                              |
|-------------------|--------------------------------------------------------------------------|
| `/`               | Redirects to `/language`                                                 |
| `/language`       | Language selection (stored in localStorage)                              |
| `/login`          | Phone number entry → triggers OTP request to backend                     |
| `/verify-otp`     | 6-digit OTP entry; sets session cookie on success                        |
| `/register`       | 3-step profile onboarding (name, location → demographics → medical info)|
| `/home`           | Main dashboard with shortcuts to all app features                        |
| `/symptoms`       | Voice/text AI triage symptom intake form                                 |
| `/triage-results` | Displays AI-generated risk assessment and recommendations                |
| `/records`        | Historical triage records fetched from the backend                       |
| `/upload-report`  | Upload a medical report (image/PDF) for Gemini AI analysis               |
| `/hospitals`      | Hospital directory loaded from backend                                   |
| `/pharmacies`     | Pharmacy directory loaded from backend                                   |
| `/schemes`        | Government health scheme listings from backend                           |
| `/camps`          | Health camps directory                                                   |
| `/chat`           | Gemini AI-powered health assistant chat                                  |
| `/profile`        | View and edit user profile                                               |

---

## 🧭 Navigation

- **Bottom Tab Bar** (`bottom-nav.tsx`): Fixed navigation linking to `/home`, `/schemes`, `/camps`, and `/chat`.
- **SOS Button** (`sos-button.tsx`): Floating emergency button present on most pages.

---

## 🎨 Styling

- **Tailwind CSS v4**: Utility classes + `@theme` custom token definitions in `src/styles.css`.
- **shadcn/ui**: Pre-built, accessible components configured in `components.json`.
- **Google Fonts** and custom design tokens are applied globally.

---

## 🛠️ Available Scripts

| Command            | Description                                  |
|--------------------|----------------------------------------------|
| `bun run dev`      | Start Vite dev server on port 5173           |
| `bun run build`    | Build production bundle                      |
| `bun run build:dev`| Build in development mode                    |
| `bun run preview`  | Preview the production build                 |
| `bun run lint`     | Run ESLint checks                            |
| `bun run format`   | Format code with Prettier                    |