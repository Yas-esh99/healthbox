import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/language";
import {
  User,
  MapPin,
  Calendar,
  Mars,
  Venus,
  Transgender,
  ShieldCheck,
  HeartPulse,
  Check,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  PartyPopper,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchStates, fetchCities } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";

type RegisterSearch = { phone?: string };

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    phone: typeof search.phone === "string" ? search.phone : undefined,
  }),
  head: () => ({ meta: [{ title: "Create Account — Healthbox" }] }),
  component: RegisterPage,
});


const GENDERS = [
  { value: "male", translationKey: "gender_male" as const, icon: Mars },
  { value: "female", translationKey: "gender_female" as const, icon: Venus },
  { value: "other", translationKey: "gender_other" as const, icon: Transgender },
] as const;

const CONDITIONS = [
  { value: "Diabetes", translationKey: "condition_diabetes" as const },
  { value: "Blood Pressure", translationKey: "condition_bp" as const },
  { value: "None", translationKey: "condition_none" as const },
] as const;

const TOTAL_STEPS = 3;

function RegisterPage() {
  const navigate = useNavigate();
  const { phone } = Route.useSearch();
  const { pendingPhone, register } = useAuth();
  const { t } = useTranslation();
  const activePhone = phone || pendingPhone || "";

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<"next" | "back">("next");

  // Step 1
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  // Step 2
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<string>("");
  // Step 3
  const [hasAyushman, setHasAyushman] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [registering, setRegistering] = useState(false);

  // Dynamic location queries
  const { data: statesList, error: statesError, isLoading: statesLoading, refetch: refetchStates } = useQuery({
    queryKey: ["states"],
    queryFn: fetchStates,
    staleTime: Infinity,
  });

  const { data: citiesList, error: citiesError, isLoading: citiesLoading, refetch: refetchCities } = useQuery({
    queryKey: ["cities", state],
    queryFn: () => fetchCities(state),
    enabled: !!state,
    staleTime: Infinity,
  });

  const statesOptions = (statesList || []).map((s) => ({ value: s, label: s }));
  const citiesOptions = (citiesList || []).map((c) => ({ value: c, label: c }));

  const goNext = () => {
    setDir("next");
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };
  const goBack = () => {
    setDir("back");
    setStep((s) => Math.max(1, s - 1));
  };

  const step1Valid = name.trim().length > 0 && state && district;

  const finish = async () => {
    if (registering) return;
    if (!activePhone) {
      toast.error("Missing phone verification session. Please log in again.");
      navigate({ to: "/login" });
      return;
    }
    setRegistering(true);
    try {
      await register({
        phone_number: activePhone,
        full_name: name,
        state,
        district,
        age,
        gender: gender || null,
        has_ayushman: hasAyushman,
        ayushman_card_number: hasAyushman ? cardNumber : null,
        conditions,
      });
      toast.success("Setup complete! Welcome to Healthbox 🎉");
      navigate({ to: "/home" });
    } catch (err: any) {
      toast.error(err.detail || err.message || "Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const toggleCondition = (c: string) => {
    setConditions((prev) => {
      if (c === "None") return prev.includes("None") ? [] : ["None"];
      const without = prev.filter((x) => x !== "None");
      return without.includes(c)
        ? without.filter((x) => x !== c)
        : [...without, c];
    });
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
        {/* Header + progress */}
        <header className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                aria-label={t("back")}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border bg-card active:bg-muted"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : (
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <User className="h-6 w-6" />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                {t("step_text")} {step} {t("of_text")} {TOTAL_STEPS}
              </p>
              <h1 className="truncate text-2xl font-extrabold text-foreground">
                {step === 1 && t("step_details")}
                {step === 2 && t("step_about")}
                {step === 3 && t("step_health")}
              </h1>
            </div>
          </div>

          {/* Segmented progress bar */}
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={cn(
                    "h-full rounded-full bg-secondary transition-all duration-500",
                    i < step ? "w-full" : "w-0",
                  )}
                />
              </div>
            ))}
          </div>
        </header>

        {/* Step content */}
        <div className="flex-1">
          <div
            key={step}
            className={cn(
              dir === "next" ? "animate-slide-in-right" : "animate-fade-in",
            )}
          >
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="flex items-center gap-2 text-base font-semibold"
                  >
                    <User className="h-5 w-5 text-primary" /> {t("name_label")}
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("placeholder_name")}
                    className="h-14 rounded-2xl border-2 px-4 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="h-5 w-5 text-primary" /> {t("state_label")}
                  </Label>
                  {statesLoading ? (
                    <div className="flex h-14 w-full items-center justify-between rounded-2xl border-2 px-4 bg-card text-muted-foreground">
                      <span className="text-base flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        Loading states...
                      </span>
                    </div>
                  ) : statesError ? (
                    <button
                      type="button"
                      onClick={() => refetchStates()}
                      className="flex h-14 w-full items-center justify-between rounded-2xl border-2 border-destructive px-4 bg-destructive/10 text-destructive text-base font-medium active:scale-[0.99] transition-all"
                    >
                      Error loading states. Tap to retry.
                    </button>
                  ) : (
                    <Combobox
                      options={statesOptions}
                      value={state}
                      onChange={(v) => {
                        setState(v);
                        setDistrict("");
                      }}
                      placeholder={t("placeholder_state") || "Select state"}
                      searchPlaceholder="Search state..."
                      emptyMessage="No state found."
                      className="!h-14 rounded-2xl border-2 px-4 text-base"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="h-5 w-5 text-secondary" /> {t("district_label")}
                  </Label>
                  {!state ? (
                    <div className="flex h-14 w-full items-center justify-between rounded-2xl border-2 px-4 bg-card text-muted-foreground opacity-60">
                      <span className="text-base">{t("placeholder_state_first") || "Choose state first"}</span>
                    </div>
                  ) : citiesLoading ? (
                    <div className="flex h-14 w-full items-center justify-between rounded-2xl border-2 px-4 bg-card text-muted-foreground">
                      <span className="text-base flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                        Loading cities...
                      </span>
                    </div>
                  ) : citiesError ? (
                    <button
                      type="button"
                      onClick={() => refetchCities()}
                      className="flex h-14 w-full items-center justify-between rounded-2xl border-2 border-destructive px-4 bg-destructive/10 text-destructive text-base font-medium active:scale-[0.99] transition-all"
                    >
                      Error loading cities. Tap to retry.
                    </button>
                  ) : (
                    <Combobox
                      options={citiesOptions}
                      value={district}
                      onChange={setDistrict}
                      placeholder={t("placeholder_district") || "Select city/district"}
                      searchPlaceholder="Search city..."
                      emptyMessage="No city found."
                      className="!h-14 rounded-2xl border-2 px-4 text-base"
                    />
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Calendar className="h-5 w-5 text-primary" /> {t("age_label")}
                  </Label>
                  <div className="rounded-3xl border-2 border-border bg-card p-6 text-center">
                    <span className="text-5xl font-extrabold text-primary">
                      {age}
                    </span>
                    <span className="ml-2 text-lg text-muted-foreground">{t("years_text")}</span>
                    <Slider
                      value={[age]}
                      min={1}
                      max={100}
                      step={1}
                      onValueChange={(v) => setAge(v[0])}
                      className="mt-6"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">{t("gender_label")}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {GENDERS.map((g) => {
                      const Icon = g.icon;
                      const active = gender === g.value;
                      return (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setGender(g.value)}
                          className={cn(
                            "flex flex-col items-center gap-3 rounded-3xl border-2 p-5 transition-all active:scale-95",
                            active
                              ? "border-secondary bg-secondary/10"
                              : "border-border bg-card",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-9 w-9",
                              active ? "text-secondary" : "text-muted-foreground",
                            )}
                          />
                          <span className="text-sm font-semibold">{t(g.translationKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setHasAyushman((v) => !v)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-3xl border-2 p-5 text-left transition-all active:scale-[0.98]",
                    hasAyushman
                      ? "border-secondary bg-secondary/10"
                      : "border-border bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                      hasAyushman
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <ShieldCheck className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold">
                      Ayushman Bharat Card
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {t("ayushman_sub")}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2",
                      hasAyushman
                        ? "border-secondary bg-secondary text-secondary-foreground"
                        : "border-border",
                    )}
                  >
                    {hasAyushman && <Check className="h-5 w-5" />}
                  </span>
                </button>

                {hasAyushman && (
                  <div className="animate-fade-in space-y-3 rounded-3xl border-2 border-border bg-card p-5">
                    <Label
                      htmlFor="card"
                      className="text-base font-semibold"
                    >
                      {t("ayushman_card_number")}
                    </Label>
                    <Input
                      id="card"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="0000 0000 0000"
                      inputMode="numeric"
                      className="h-14 rounded-2xl border-2 px-4 text-lg tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => toast("You can scan your card later 📷")}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 py-3 text-base font-semibold text-primary active:bg-primary/5"
                    >
                      <ScanLine className="h-5 w-5" /> {t("scan_later")}
                    </button>
                  </div>
                )}

                <div className="space-y-3 rounded-3xl border-2 border-border bg-card p-5">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <HeartPulse className="h-5 w-5 text-destructive" /> {t("conditions_label")}
                  </Label>
                  <div className="space-y-2">
                    {CONDITIONS.map((c) => {
                      const active = conditions.includes(c.value);
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => toggleCondition(c.value)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98]",
                            active
                              ? "border-secondary bg-secondary/10"
                              : "border-border",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2",
                              active
                                ? "border-secondary bg-secondary text-secondary-foreground"
                                : "border-border",
                            )}
                          >
                            {active && <Check className="h-5 w-5" />}
                          </span>
                          <span className="text-base font-semibold">{t(c.translationKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 space-y-3">
          {step === 1 && (
            <button
              type="button"
              disabled={!step1Valid}
              onClick={goNext}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {t("next")} <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={goNext}
                className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition-all active:scale-[0.98]"
              >
                {t("next")} <ChevronRight className="h-6 w-6" />
              </button>
              <div className="text-right">
                <button
                  type="button"
                  onClick={goNext}
                  className="px-2 py-1 text-base font-semibold text-muted-foreground underline underline-offset-4"
                >
                  {t("skip")}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={finish}
                disabled={registering}
                className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-lg font-bold text-secondary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {registering ? (
                  <Loader2 className="h-6 w-6 animate-spin text-secondary-foreground" />
                ) : (
                  <>
                    <PartyPopper className="h-6 w-6" /> {t("finish")}
                  </>
                )}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={finish}
                  disabled={registering}
                  className="px-2 py-1 text-base font-semibold text-muted-foreground underline underline-offset-4 disabled:opacity-50"
                >
                  {t("skip")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
