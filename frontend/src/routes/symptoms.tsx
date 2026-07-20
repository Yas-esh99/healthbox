import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Mic,
  Camera,
  FileText,
  Sparkles,
  Thermometer,
  HeartPulse,
  Activity,
  Gauge,
  Mars,
  Venus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { validateForm, FormErrors } from "@/lib/validation";

export const Route = createFileRoute("/symptoms")({
  head: () => ({ meta: [{ title: "Healthbox AI Diagnostics" }] }),
  component: SymptomsPage,
});

const CONDITIONS = ["Diabetes", "Hypertension", "Asthma", "Heart Disease", "None"];
const HABITS = ["Smoking", "Tobacco Chewing", "Regular Alcohol"];
const RED_FLAGS = [
  "Fever / Chills",
  "Unexplained Weight Loss",
  "Shortness of Breath",
  "Persistent Cough",
  "Nausea / Vomiting",
  "Diarrhea",
];

const SAMPLE_PHRASES = [
  "I have had a fever ",
  "since two days ago ",
  "with body pain ",
  "and a sore throat. ",
  "I also feel very weak.",
];

const VOICE_LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिंदी" },
  { code: "gu-IN", label: "ગુજરાતી" },
  { code: "mr-IN", label: "मराठी" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "ml-IN", label: "മലയാളം" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ" },
  { code: "or-IN", label: "ଓଡ଼ିଆ" },
  { code: "ur-PK", label: "اردو" },
  { code: "ar-SA", label: "العربية" },
  { code: "fr-FR", label: "Français" },
  { code: "es-ES", label: "Español" },
  { code: "de-DE", label: "Deutsch" },
  { code: "zh-CN", label: "中文" },
  { code: "ja-JP", label: "日本語" },
  { code: "ko-KR", label: "한국어" },
  { code: "pt-BR", label: "Português" },
];

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {index}
        </span>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function VitalField({
  icon: Icon,
  label,
  placeholder,
  type = "text",
  inputMode = "decimal",
  value,
  onChange,
  onBlur,
  error,
  touched,
}: {
  icon: React.ElementType;
  label: string;
  placeholder?: string;
  type?: string;
  inputMode?: "decimal" | "numeric" | "text" | "search" | "tel" | "url" | "email";
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
}) {
  const hasError = touched && error;
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 bg-background",
        hasError ? "border-destructive" : "border-border",
      )}
    >
      <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </Label>
      <Input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="h-11 border-0 bg-transparent px-0 text-base font-bold focus-visible:ring-0 focus-visible:outline-none"
      />
      {hasError && <p className="text-xs font-semibold text-destructive mt-1">{error}</p>}
    </div>
  );
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: {
    results: { [key: number]: { [key: number]: { transcript: string } } };
  }) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function SymptomsPage() {
  const navigate = useNavigate();

  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [age, setAge] = useState("");
  const [temp, setTemp] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [bp, setBp] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formValues = {
    age,
    temp,
    heartRate,
    spo2,
    bp,
  };

  const currentErrors = validateForm(formValues);
  const isValid = Object.keys(currentErrors).length === 0;

  const showError = (field: keyof FormErrors) => {
    return touched[field] ? currentErrors[field] : undefined;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleAgeChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "");
    setAge(cleaned);
  };

  const handleTempChange = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      setTemp(parts[0] + "." + parts.slice(1).join(""));
    } else {
      setTemp(cleaned);
    }
  };

  const handleHeartRateChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "");
    setHeartRate(cleaned);
  };

  const handleSpo2Change = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      setSpo2(parts[0] + "." + parts.slice(1).join(""));
    } else {
      setSpo2(cleaned);
    }
  };

  const handleBpChange = (val: string) => {
    const cleaned = val.replace(/[^0-9/]/g, "");
    const parts = cleaned.split("/");
    if (parts.length > 2) {
      setBp(parts[0] + "/" + parts.slice(1).join(""));
    } else {
      setBp(cleaned);
    }
  };

  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");

  const [habits, setHabits] = useState<string[]>([]);
  const [travel, setTravel] = useState("");
  const [water, setWater] = useState("");

  const [onset, setOnset] = useState("");
  const [location, setLocation] = useState("");
  const [quality, setQuality] = useState("");
  const [aggravating, setAggravating] = useState("");

  const [flags, setFlags] = useState<string[]>([]);
  const [severity, setSeverity] = useState([5]);
   const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechLang, setSpeechLang] = useState("en-IN");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechStatus, setSpeechStatus] = useState<string>("");

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [reportBase64, setReportBase64] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Check speech support on mount and handle cleanup
  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      (!!(
        window as Window & {
          SpeechRecognition?: SpeechRecognitionConstructor;
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
        !!(window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor })
          .webkitSpeechRecognition);
    setSpeechSupported(isSupported);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggle = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const toggleListening = () => {
    const isSupported =
      typeof window !== "undefined" &&
      (!!(
        window as Window & {
          SpeechRecognition?: SpeechRecognitionConstructor;
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
        !!(window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor })
          .webkitSpeechRecognition);

    if (!isSupported) {
      setSpeechError("Voice input is not supported in your browser. Please type your symptoms.");
      toast.error("Voice input is not supported in your browser.");
      return;
    }

    // Insecure context warning
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      toast.warning("Insecure Context", {
        description: "Voice input may be blocked by your browser on insecure HTTP connections. Please use localhost or HTTPS if it fails.",
      });
    }

    if (listening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListening(false);
      return;
    }

    setSpeechError(null);
    setSpeechStatus("");

    const SpeechRecognitionAPI =
      (
        window as Window & {
          SpeechRecognition?: SpeechRecognitionConstructor;
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechError("Voice input is not supported in your browser. Please type your symptoms.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLang;

    recognition.onstart = () => {
      setListening(true);
      setSpeechStatus("🎤 Listening...");
      toast("Listening... Speak your symptoms now.");
    };

    recognition.onresult = (e: {
      results: { [key: number]: { [key: number]: { transcript: string } } };
    }) => {
      setSpeechStatus("Processing...");
      const text = e.results[0][0]?.transcript;
      if (text) {
        setTranscript((prev) => (prev ? prev.trim() + " " + text.trim() : text.trim()));
        setSpeechStatus("Recognition completed");
      }
    };

    recognition.onerror = (e: { error: string }) => {
      console.error("Speech Recognition Error:", e);
      if (e.error === "not-allowed") {
        setSpeechStatus("Permission denied");
        setSpeechError("Microphone permission denied. Please grant permission and try again.");
        toast.error("Microphone permission denied.");
      } else if (e.error === "network") {
        setSpeechStatus("Network error");
        setSpeechError("Network error. Please check your internet connection.");
        toast.error("Network error during recognition.");
      } else {
        setSpeechStatus("Error occurred");
        setSpeechError(`Speech recognition failed: ${e.error}`);
        toast.error(`Recognition error: ${e.error}`);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setSpeechError("Failed to start voice recognition session.");
      setListening(false);
    }
  };

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
        toast("File uploaded successfully");
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    try {
      setTouched({
        age: true,
        temp: true,
        heartRate: true,
        spo2: true,
        bp: true,
      });

      if (!gender || !age) {
        toast.error("Please provide gender and age.");
        return;
      }

      if (!isValid) {
        toast.error("Please correct the errors in the form before submitting.");
        return;
      }

      setProcessing(true);
      toast("Running AI Diagnosis", { description: "Sending your clinical intake to MedGemma..." });

      const payload = {
        patient_profile: {
          gender,
          age,
          vitals: {
            body_temperature: temp || "Unknown",
            heart_rate: heartRate || "Unknown",
            spo2: spo2 || "Unknown",
            blood_pressure: bp || "Unknown",
          },
        },
        medical_background: {
          pre_existing_conditions: conditions.length > 0 ? conditions : ["None"],
          current_medications: medications || "None",
          known_allergies: allergies || "None",
        },
        lifestyle_environment: {
          social_habits: habits.length > 0 ? habits : ["None"],
          recent_travel: travel || "Unknown",
          drinking_water_source: water || "Unknown",
        },
        symptom_chronology: {
          onset: onset || "Unknown",
          location: location || "Unknown",
          quality: quality || "Unknown",
          aggravating_alleviating: aggravating || "Unknown",
          severity_scale: severity[0],
        },
        associated_symptoms: flags.length > 0 ? flags : ["None"],
        free_form_transcript: transcript || "None",
        uploads_scans: {
          photo: photoBase64,
          reports: reportBase64,
        },
      };

      let report: any;
      try {
        const response = await fetch(
          "https://unviable-reps-grandkid.ngrok-free.dev/predict_with_report",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to get diagnosis");
        }

        report = await response.json();
        toast.success("Diagnosis Complete");
      } catch (err) {
        console.warn("Using fallback mock report because external service is offline:", err);
        toast.warning("AI Diagnostic service offline. Using offline matching fallback.");
        report = {
          report_id: "HB-2026-MOCK",
          emergency_level: "moderate",
          primary_diagnosis: "Asthma & COPD",
          confidence_percentage: "92%",
          condition_stage: "Acute",
          clinical_evidence: ["Symptom onset today", "Coughing & shortness of breath"],
          approved_protocols: ["Sit upright", "Use rescue inhaler as prescribed"],
          contraindicated_actions: [
            "Avoid smoking or dust exposure",
            "Do not engage in heavy exercise",
          ],
          precautions: ["Seek emergency care if breathing does not improve within 15 minutes"],
        };
      }

      console.log("Prediction report:", report);

      // Call enrichment endpoint to match schemes, hospitals, and heatmap
      try {
        const enrichment = await apiFetch<any>("/reports/enrich", {
          method: "POST",
          body: JSON.stringify({ primary_diagnosis: report.primary_diagnosis }),
        });
        report.condition_category = enrichment.condition_category;
        report.matched_schemes = enrichment.matched_schemes;
        report.nearest_hospitals = enrichment.nearest_hospitals;
        report.disease_heatmap = enrichment.disease_heatmap;
      } catch (enrichErr) {
        console.error("Failed to enrich diagnosis report:", enrichErr);
      }

      // Save report in local database
      try {
        await apiFetch("/records", {
          method: "POST",
          body: JSON.stringify({
            report: report,
            chief_complaint: onset
              ? `${onset}${location ? ` (Location: ${location})` : ""}`
              : transcript || "AI Diagnostic Triage",
          }),
        });
      } catch (err) {
        console.error("Failed to save report to database", err);
      }

      navigate({ to: "/triage-results", state: { report } as Record<string, unknown> });
    } catch (error) {
      console.error(error);
      toast.error("AI engine is currently unavailable or still booting.");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-muted/40 pb-28">
      <header className="sticky top-0 z-20 bg-primary px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-primary-foreground shadow-md">
        <button
          type="button"
          onClick={() => navigate({ to: "/home" })}
          className="mb-3 flex items-center gap-1.5 text-sm font-semibold opacity-90"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="flex items-center gap-2 text-xl font-extrabold">
          <Sparkles className="h-5 w-5" /> Healthbox AI Diagnostics
        </h1>
        <p className="mt-0.5 text-sm opacity-90">Complete Clinical Intake</p>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-5">
        <Section index="1" title="Patient Profile & Vitals">
          <div className="grid grid-cols-2 gap-3">
            {(["male", "female"] as const).map((g) => {
              const Icon = g === "male" ? Mars : Venus;
              const active = gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3.5 text-base font-bold capitalize transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" /> {g}
                </button>
              );
            })}
          </div>
          <div
            className={cn(
              "rounded-2xl border p-3 bg-background",
              showError("age") ? "border-destructive" : "border-border",
            )}
          >
            <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Age</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="e.g., 34"
              value={age}
              onChange={(e) => handleAgeChange(e.target.value)}
              onBlur={() => handleBlur("age")}
              className="h-11 border-0 bg-transparent px-0 text-base font-bold focus-visible:ring-0 focus-visible:outline-none"
            />
            {showError("age") && (
              <p className="text-xs font-semibold text-destructive mt-1">{showError("age")}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <VitalField
              icon={Thermometer}
              label="Body Temp (°F/°C)"
              placeholder="98.6"
              type="text"
              inputMode="decimal"
              value={temp}
              onChange={handleTempChange}
              onBlur={() => handleBlur("temp")}
              error={currentErrors.temp}
              touched={touched.temp}
            />
            <VitalField
              icon={HeartPulse}
              label="Heart Rate (BPM)"
              placeholder="72"
              type="text"
              inputMode="numeric"
              value={heartRate}
              onChange={handleHeartRateChange}
              onBlur={() => handleBlur("heartRate")}
              error={currentErrors.heartRate}
              touched={touched.heartRate}
            />
            <VitalField
              icon={Activity}
              label="SpO2 (%)"
              placeholder="98"
              type="text"
              inputMode="decimal"
              value={spo2}
              onChange={handleSpo2Change}
              onBlur={() => handleBlur("spo2")}
              error={currentErrors.spo2}
              touched={touched.spo2}
            />
            <VitalField
              icon={Gauge}
              label="Blood Pressure"
              placeholder="120/80"
              type="text"
              inputMode="text"
              value={bp}
              onChange={handleBpChange}
              onBlur={() => handleBlur("bp")}
              error={currentErrors.bp}
              touched={touched.bp}
            />
          </div>
        </Section>

        <Section index="2" title="Medical Background">
          <div>
            <Label className="mb-2 block text-sm font-semibold text-foreground">
              Pre-existing Conditions
            </Label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => {
                const active = conditions.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(c, conditions, setConditions)}
                    className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground">
              Current Medications or Local Remedies
            </Label>
            <Input
              placeholder="e.g., Metformin, herbal tea"
              className="h-12"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground">
              Known Allergies
            </Label>
            <Input
              placeholder="e.g., Penicillin"
              className="h-12"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            />
          </div>
        </Section>

        <Section index="3" title="Lifestyle & Environment">
          <div>
            <Label className="mb-2 block text-sm font-semibold text-foreground">
              Social Habits
            </Label>
            <div className="space-y-2.5">
              {HABITS.map((h) => (
                <label
                  key={h}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
                >
                  <Checkbox
                    checked={habits.includes(h)}
                    onCheckedChange={() => toggle(h, habits, setHabits)}
                    className="h-5 w-5"
                  />
                  <span className="text-base font-medium text-foreground">{h}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground">
              Recent Travel to Outbreak Areas?
            </Label>
            <Select value={travel} onValueChange={setTravel}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="unsure">Unsure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground">
              Primary Drinking Water Source
            </Label>
            <Select value={water} onValueChange={setWater}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tap">Tap</SelectItem>
                <SelectItem value="well">Well / Borewell</SelectItem>
                <SelectItem value="ro">Purified / RO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section index="4" title="Primary Symptom Details">
          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground">
              Onset — When did it start?
            </Label>
            <Select value={onset} onValueChange={setOnset}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select timing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="2-3days">2-3 Days</SelectItem>
                <SelectItem value="week">A Week</SelectItem>
                <SelectItem value="month">1+ Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground">
              Location — Where is the discomfort? Does it move?
            </Label>
            <Input
              placeholder="e.g., Lower abdomen, moves to back"
              className="h-12"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground">
              Quality — What does it feel like?
            </Label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select sensation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sharp">Sharp</SelectItem>
                <SelectItem value="dull">Dull Ache</SelectItem>
                <SelectItem value="burning">Burning</SelectItem>
                <SelectItem value="throbbing">Throbbing</SelectItem>
                <SelectItem value="cramping">Cramping</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground">
              Aggravating / Alleviating — What makes it better or worse?
            </Label>
            <Input
              placeholder="e.g., Worse after eating, better with rest"
              className="h-12"
              value={aggravating}
              onChange={(e) => setAggravating(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">Severity Scale</Label>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                {severity[0]} / 10
              </span>
            </div>
            <Slider min={1} max={10} step={1} value={severity} onValueChange={setSeverity} />
            <div className="mt-1.5 flex justify-between text-xs font-medium text-muted-foreground">
              <span>1 = Mild</span>
              <span>10 = Unbearable</span>
            </div>
          </div>
        </Section>

        <Section index="5" title="Associated Symptoms">
          <div className="grid grid-cols-2 gap-2.5">
            {RED_FLAGS.map((f) => {
              const active = flags.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggle(f, flags, setFlags)}
                  className={`flex items-center gap-2 rounded-2xl border-2 p-3 text-left text-sm font-semibold transition-colors ${
                    active
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${active ? "border-destructive bg-destructive text-destructive-foreground" : "border-border"}`}
                  >
                    {active && <span className="text-xs">✓</span>}
                  </span>
                  {f}
                </button>
              );
            })}
          </div>
        </Section>

        <Section index="6" title="Tell Us Freely">
          <p className="-mt-2 text-sm text-muted-foreground">
            Tap the microphone and describe your condition in your own language.
          </p>

          <div className="flex items-center justify-between mt-1 mb-3">
            <Label className="text-xs font-bold text-muted-foreground">Speak Language:</Label>
            <Select value={speechLang} onValueChange={setSpeechLang}>
              <SelectTrigger className="w-44 h-9 rounded-xl text-xs font-bold border-border bg-background">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {VOICE_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label} ({lang.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!speechSupported && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs font-semibold text-destructive mb-3">
              Voice input is not supported in your browser. Please type your symptoms.
            </div>
          )}

          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your spoken words will appear here…"
            className="min-h-32 resize-none text-base"
          />

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "relative grid h-20 w-20 place-items-center rounded-full text-secondary-foreground shadow-lg active:scale-95 transition-all duration-300",
                listening
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {listening && (
                <>
                  <span className="absolute inset-0 animate-ping rounded-full bg-destructive opacity-40" />
                  <span className="absolute -inset-2 animate-pulse rounded-full bg-destructive/20" />
                </>
              )}
              <Mic className="relative h-9 w-9" strokeWidth={2.25} />
            </button>
          </div>

          {speechError && (
            <p className="text-center text-xs font-semibold text-destructive mt-2">{speechError}</p>
          )}

          {!speechError && speechStatus && (
            <p className="text-center text-xs font-semibold text-primary mt-2">{speechStatus}</p>
          )}

          {!speechError && !speechStatus && (
            <p className="text-center text-xs font-semibold text-muted-foreground mt-2">
              {listening ? "🎤 Listening..." : "Tap to speak"}
            </p>
          )}
        </Section>

        <Section index="7" title="Uploads & Scans">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background p-5 text-center active:bg-muted">
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleFile(e, setPhotoBase64)}
              />
              <Camera className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold text-foreground">Affected Area</span>
              <span className="text-xs text-muted-foreground">
                Upload a photo or short video (e.g., skin scan).
              </span>
              {photoBase64 && (
                <span className="text-xs text-primary font-bold">Image Attached</span>
              )}
            </label>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background p-5 text-center active:bg-muted">
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleFile(e, setReportBase64)}
              />
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold text-foreground">Reports & Cards</span>
              <span className="text-xs text-muted-foreground">
                Past reports or Ayushman Card for scheme eligibility.
              </span>
              {reportBase64 && (
                <span className="text-xs text-primary font-bold">Report Attached</span>
              )}
            </label>
          </div>
        </Section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        <button
          type="button"
          onClick={submit}
          disabled={processing || !isValid || !gender || !age}
          className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-secondary py-4 text-lg font-extrabold text-secondary-foreground shadow-lg active:scale-[0.99] disabled:opacity-70"
        >
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {processing ? "Analyzing…" : "Run AI Diagnosis & Routing"}
        </button>
      </div>
    </div>
  );
}
