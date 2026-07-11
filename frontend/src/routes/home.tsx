import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Stethoscope,
  Upload,
  Hospital,
  Pill,
  FileText,
  FolderHeart,
  User,
  Languages,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { SosButton } from "@/components/sos-button";
import { LANGUAGES, useLanguage, useTranslation } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home" }] }),
  component: HomePage,
});

function HomePage() {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const cycleLanguage = () => {
    const idx = LANGUAGES.findIndex((l) => l.code === current.code);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLanguage(next.code);
    toast(`Language: ${next.native}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tiles = [
    {
      label: "Find Hospital",
      translationKey: "find_hospital" as const,
      icon: Hospital,
      tone: "primary" as const,
      to: "/hospitals" as const,
    },
    {
      label: "Pharmacies",
      translationKey: "pharmacies_tile" as const,
      icon: Pill,
      tone: "secondary" as const,
      to: "/pharmacies" as const,
    },
    {
      label: "Govt Schemes",
      translationKey: "govt_schemes" as const,
      icon: FileText,
      tone: "primary" as const,
      to: "/schemes" as const,
    },
    {
      label: "My Records",
      translationKey: "my_records" as const,
      icon: FolderHeart,
      tone: "secondary" as const,
      to: "/records" as const,
    },
  ];

  return (
    <div className="min-h-dvh bg-background pb-28">
      <div className="mx-auto w-full max-w-md px-5 pt-4">
        {/* Sticky header */}
        <header className="flex items-center justify-between">
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-2xl p-1 pr-3 active:bg-muted"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground">
              <User className="h-5 w-5" />
            </span>
            <span className="text-left">
              <span className="block text-xs text-muted-foreground">{t("welcome")}</span>
              <span className="block text-sm font-bold text-foreground">
                {user?.name || user?.full_name || "My Profile"}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cycleLanguage}
              className="flex items-center gap-2 rounded-full border-2 border-border bg-card px-3 py-2 text-sm font-semibold text-foreground active:bg-muted"
              aria-label="Switch language"
            >
              <Languages className="h-4 w-4 text-primary" />
              <span>{current.native}</span>
            </button>
          </div>
        </header>

        {/* Greeting */}
        <div className="mt-6">
          <h1 className="text-2xl font-bold text-foreground">{t("namaste")} 🙏</h1>
          <p className="text-base text-muted-foreground">{t("help_today")}</p>
        </div>

        {/* Check Symptoms hero card */}
        <section className="mt-5 overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
                {t("ai_triage")}
              </p>
              <h2 className="mt-1 text-2xl font-black leading-tight">{t("check_symptoms")}</h2>
              <p className="mt-1 text-sm text-primary-foreground/80">{t("speak_or_scan")}</p>
            </div>
            <ChevronRight className="h-6 w-6 text-primary-foreground/60" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: "/symptoms" })}
              className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl bg-primary-foreground/10 py-6 backdrop-blur transition active:scale-[0.97] active:bg-primary-foreground/20"
            >
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary-foreground/20" />
              <span className="relative grid h-16 w-16 place-items-center rounded-full bg-primary-foreground text-primary shadow-lg">
                <Stethoscope className="relative h-8 w-8" strokeWidth={2.5} />
              </span>
              <span className="relative text-center text-base font-bold leading-tight px-1">
                Healthbox AI Diagnostics
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/upload-report" })}
              className="relative flex flex-col items-center justify-center gap-2 rounded-2xl bg-primary-foreground/10 py-6 backdrop-blur transition active:scale-[0.97] active:bg-primary-foreground/20"
            >
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary-foreground/20" />
              <span className="relative grid h-16 w-16 place-items-center rounded-full bg-primary-foreground text-primary shadow-lg">
                <Upload className="h-8 w-8" strokeWidth={2.5} />
              </span>
              <span className="relative text-center text-base font-bold leading-tight px-1">
                Upload Report Only
              </span>
            </button>
          </div>
        </section>

        {/* Quick access tiles */}
        <section className="mt-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Quick Access
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {tiles.map(({ label, translationKey, icon: Icon, tone, to }) => {
              const onClick = () => {
                if (to) navigate({ to });
                else toast(t(translationKey), { description: "Coming soon" });
              };
              return (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="flex flex-col items-start gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition active:scale-[0.98] active:bg-muted"
                >
                  <span
                    className={
                      "grid h-12 w-12 place-items-center rounded-xl " +
                      (tone === "primary"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/15 text-secondary")
                    }
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.25} />
                  </span>
                  <span className="text-base font-bold text-foreground leading-tight">
                    {t(translationKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <SosButton />
      <BottomNav />
    </div>
  );
}
