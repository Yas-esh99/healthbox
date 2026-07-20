import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  MapPin,
  Map as MapIcon,
  List,
  CalendarDays,
  Navigation,
  Clock,
  Stethoscope,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
  FileText,
  Activity,
  Building2,
  Phone,
  BadgeCheck,
  Tent,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { SosButton } from "@/components/sos-button";
import { apiFetch, HeatmapDataPoint } from "@/lib/api";
import { DiseaseHeatmapView } from "@/components/disease-heatmap";

const RealCampsMap = lazy(() =>
  import("@/components/real-camps-map").then((mod) => ({ default: mod.RealCampsMap }))
);

export const Route = createFileRoute("/camps")({
  head: () => ({ meta: [{ title: "Government Hospitals & Camps" }] }),
  component: CampsPage,
});

type Tab = "camps" | "schemes" | "analytics";
type View = "map" | "list";

const CAMPS = [
  {
    name: "Free Eye & Vision Camp",
    org: "Lions Club",
    date: "Sat, 14 Jun · 9 AM",
    distance: "1.2 km away",
    lat: 23.03,
    lng: 72.58,
  },
  {
    name: "Diabetes & BP Screening",
    org: "City Health Dept.",
    date: "Sun, 15 Jun · 10 AM",
    distance: "3.6 km away",
    lat: 23.01,
    lng: 72.55,
  },
  {
    name: "Child Vaccination Drive",
    org: "Govt. Primary Center",
    date: "Wed, 18 Jun · 8 AM",
    distance: "4.1 km away",
    lat: 23.05,
    lng: 72.6,
  },
];

const SCHEMES = [
  {
    name: "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
    eligibility: "SECC D1–D7 Category / Valid Ayushman Cardholders",
    documents: ["Aadhaar Card", "Ration Card", "Active ABHA ID"],
    diseases:
      "Major infectious diseases, acute secondary/tertiary surgeries, severe respiratory complications, cardiac & oncology care up to ₹5 lakh/family/year.",
    coverage: "All empaneled public and private tertiary hospitals nationwide.",
    brief:
      "Cashless secondary and tertiary hospitalization for eligible families across the PM-JAY network.",
    link: "https://pmjay.gov.in",
    linkLabel: "View Scheme Guidelines & Portal",
  },
  {
    name: "Central Government Health Scheme (CGHS)",
    eligibility: "Serving / Retired Central Govt. employees and dependents",
    documents: ["CGHS Beneficiary Card", "Aadhaar Card", "Pension Payment Order (if retired)"],
    diseases:
      "OPD consultations, chronic disease management (diabetes, hypertension), inpatient surgical care, diagnostics & medicines.",
    coverage: "CGHS Wellness Centres and empaneled private hospitals in covered cities.",
    brief:
      "Comprehensive healthcare for Central Government beneficiaries via CGHS Wellness Centres.",
    link: "https://cghs.gov.in",
    linkLabel: "Open CGHS Beneficiary Portal",
  },
];

const HOSPITALS = [
  {
    name: "Sardar Patel Tertiary Care Hospital",
    tier: "Private — Empaneled",
    specialty: "Internal Medicine & Advanced Intensive Care",
    status: "24/7 Emergency Wing Active | Beds Available",
    address: "Plot 14, Ring Road, Sector 9, Ahmedabad — 380015",
    desk: "Registration Desk: Block A, Ground Floor · +91 79 4000 1200",
    lat: 23.04,
    lng: 72.53,
  },
  {
    name: "District Government General Hospital",
    tier: "Public — PM-JAY Empaneled",
    specialty: "General Surgery, Pulmonology & Maternal Care",
    status: "24/7 Casualty Active | Limited ICU Beds",
    address: "Civil Lines, Main Road, District Health Complex — 380001",
    desk: "Registration Desk: OPD Counter 3 · +91 79 2550 8800",
    lat: 23.02,
    lng: 72.59,
  },
];

function CampsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("camps");
  const [view, setView] = useState<View>("list");

  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (tab === "analytics") {
      setLoadingAnalytics(true);
      apiFetch<HeatmapDataPoint[]>("/records/heatmap")
        .then((data) => {
          setHeatmapData(data);
        })
        .catch((err) => {
          console.error("Failed to fetch disease heatmap data:", err);
          setHeatmapData([
            {
              state: "Gujarat",
              district: "Ahmedabad",
              disease: "Diabetes & Hypertension",
              cases_count: 24,
            },
            {
              state: "Gujarat",
              district: "Ahmedabad",
              disease: "Viral Pharyngitis",
              cases_count: 18,
            },
            {
              state: "Gujarat",
              district: "Gandhinagar",
              disease: "Asthma & COPD",
              cases_count: 15,
            },
            {
              state: "Gujarat",
              district: "Gandhinagar",
              disease: "Contact Dermatitis",
              cases_count: 9,
            },
            { state: "Gujarat", district: "Surat", disease: "Viral Pharyngitis", cases_count: 32 },
            { state: "Gujarat", district: "Surat", disease: "Gastroenteritis", cases_count: 22 },
            {
              state: "Gujarat",
              district: "Rajkot",
              disease: "Diabetes & Hypertension",
              cases_count: 14,
            },
            { state: "Gujarat", district: "Rajkot", disease: "Asthma & COPD", cases_count: 11 },
          ]);
        })
        .finally(() => {
          setLoadingAnalytics(false);
        });
    }
  }, [tab]);

  return (
    <div className="min-h-dvh bg-background pb-28">
      {/* Sticky top utility bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/triage-results" })}
            className="-ml-1 flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-bold text-foreground active:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            Return to Report Overview
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-5 pt-5">
        {/* Summary counter badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs font-extrabold text-secondary">
          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.75} />
          {SCHEMES.length} Government Welfare Schemes Matched
        </div>

        <header className="mt-3">
          <h1 className="text-2xl font-black text-foreground">Government Hospitals & Camps</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Switch between free medical camps and welfare schemes mapped to your report.
          </p>
        </header>

        {/* Tab switcher */}
        <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-2xl border-2 border-border bg-card p-1">
          <TabButton
            active={tab === "camps"}
            onClick={() => setTab("camps")}
            icon={Tent}
            label="Camps"
          />
          <TabButton
            active={tab === "schemes"}
            onClick={() => setTab("schemes")}
            icon={Landmark}
            label="Schemes"
          />
          <TabButton
            active={tab === "analytics"}
            onClick={() => setTab("analytics")}
            icon={Activity}
            label="Heatmap"
          />
        </div>

        {tab === "camps" && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border-2 border-border bg-card p-1.5">
              <ToggleButton
                active={view === "map"}
                onClick={() => setView("map")}
                icon={MapIcon}
                label="Map View"
              />
              <ToggleButton
                active={view === "list"}
                onClick={() => setView("list")}
                icon={List}
                label="List View"
              />
            </div>
            {view === "map" ? (
              <MapView />
            ) : (
              <div className="mt-6 space-y-4">
                {CAMPS.map((c) => (
                  <CampCard key={c.name} camp={c} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "schemes" && <SchemesAndHospitals />}

        {tab === "analytics" && (
          <DiseaseHeatmapView data={heatmapData} loading={loadingAnalytics} />
        )}
      </div>

      <SosButton />
      <BottomNav />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof MapIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition " +
        (active
          ? "bg-secondary text-secondary-foreground shadow"
          : "text-muted-foreground active:bg-muted")
      }
    >
      <Icon className="h-5 w-5" strokeWidth={2.5} />
      {label}
    </button>
  );
}

function ToggleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof MapIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition " +
        (active
          ? "bg-primary text-primary-foreground shadow"
          : "text-muted-foreground active:bg-muted")
      }
    >
      <Icon className="h-5 w-5" strokeWidth={2.5} />
      {label}
    </button>
  );
}

function MapView() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative mt-6 h-[420px] w-full overflow-hidden rounded-3xl border-2 border-border bg-muted">
      {mounted ? (
        <Suspense
          fallback={
            <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
              Loading map components...
            </div>
          }
        >
          <RealCampsMap camps={CAMPS} hospitals={HOSPITALS} />
        </Suspense>
      ) : (
        <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
          Loading map...
        </div>
      )}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-bold text-foreground shadow backdrop-blur border border-border">
        <Navigation className="h-3.5 w-3.5 text-secondary" />
        {CAMPS.length} camps near you
      </div>
    </div>
  );
}

function CampCard({ camp }: { camp: (typeof CAMPS)[number] }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
          <Stethoscope className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold leading-snug text-foreground">{camp.name}</h3>
          <p className="text-xs font-semibold text-muted-foreground">{camp.org}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          {camp.date}
        </p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {camp.distance}
        </p>
      </div>
      <button
        type="button"
        onClick={() => toast.success("You're registered!", { description: camp.name })}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-4 text-base font-bold text-secondary-foreground shadow active:scale-[0.99]"
      >
        <Clock className="h-5 w-5" />
        Register for Free
      </button>
    </div>
  );
}

function SchemesAndHospitals() {
  return (
    <div className="mt-6 space-y-8">
      {/* SECTION A — Schemes */}
      <section>
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-secondary" strokeWidth={2.5} />
          <h2 className="text-lg font-black text-foreground">
            Section A · Government Healthcare Schemes
          </h2>
        </div>
        <div className="mt-3 space-y-4">
          {SCHEMES.map((s) => (
            <SchemeCard key={s.name} scheme={s} />
          ))}
        </div>
      </section>

      {/* SECTION B — Hospitals */}
      <section>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" strokeWidth={2.5} />
          <h2 className="text-lg font-black text-foreground">
            Section B · Recommended Hospitals Directory
          </h2>
        </div>
        <div className="mt-3 space-y-4">
          {HOSPITALS.map((h) => (
            <HospitalCard key={h.name} hospital={h} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SchemeCard({ scheme }: { scheme: (typeof SCHEMES)[number] }) {
  return (
    <article className="rounded-2xl border-2 border-border bg-card p-5">
      <h3 className="text-base font-black leading-snug text-foreground">{scheme.name}</h3>

      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[11px] font-extrabold text-secondary">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.75} />
        Eligibility: {scheme.eligibility}
      </div>

      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Required Documents
        </p>
        <ul className="mt-1.5 space-y-1 text-sm text-foreground">
          {scheme.documents.map((d) => (
            <li key={d} className="flex gap-2">
              <span className="text-primary">•</span>
              {d}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          <Activity className="h-3.5 w-3.5" /> Treated Diseases
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">{scheme.diseases}</p>
      </div>

      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Applicable At
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">{scheme.coverage}</p>
      </div>

      <p className="mt-4 text-sm italic leading-relaxed text-muted-foreground">{scheme.brief}</p>

      <a
        href={scheme.link}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-primary underline-offset-4 hover:underline"
      >
        {scheme.linkLabel}
        <ExternalLink className="h-4 w-4" strokeWidth={2.5} />
      </a>
    </article>
  );
}

function HospitalCard({ hospital }: { hospital: (typeof HOSPITALS)[number] }) {
  return (
    <article className="rounded-2xl border-2 border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-black leading-snug text-foreground">{hospital.name}</h3>
          <p className="mt-0.5 text-[11px] font-extrabold uppercase tracking-wider text-secondary">
            {hospital.tier}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          Specialization
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">{hospital.specialty}</p>
      </div>

      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
        <Activity className="h-3.5 w-3.5" strokeWidth={2.75} />
        Status: {hospital.status}
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-foreground">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{hospital.address}</span>
        </p>
        <p className="flex items-start gap-2 text-muted-foreground">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{hospital.desk}</span>
        </p>
      </div>
    </article>
  );
}
