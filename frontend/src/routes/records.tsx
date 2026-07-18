import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  FolderHeart,
  Activity,
  Thermometer,
  ScanLine,
  ClipboardList,
  Calendar,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Check,
  X,
  FileText,
  Loader2,
  Download,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/records")({
  head: () => ({ meta: [{ title: "My Records" }] }),
  component: RecordsPage,
});

type RiskTier = "low" | "moderate" | "high" | "critical";

type TriageRecord = {
  id: string;
  title: string;
  date: string; // ISO
  risk: RiskTier;
  chiefComplaint: string;
  summary: string;
  evidence: { label: string; value: string; icon: "log" | "temp" | "vitals" | "scan" }[];
  doList: string[];
  dontList: string[];
  recommendation: string;
  rawReport?: any;
};

const SAMPLE_RECORDS: TriageRecord[] = [
  {
    id: "rec-001",
    title: "Viral Fever Assessment",
    date: "2026-06-22T09:14:00+05:30",
    risk: "moderate",
    chiefComplaint: "Fever, body ache, mild cough",
    summary:
      "Symptoms consistent with a viral upper-respiratory infection. Monitor temperature every 6 hours and seek in-person care if fever persists beyond 72 hours or breathing worsens.",
    evidence: [
      { icon: "log", label: "Symptom Log", value: "Fever persisting > 48 hours" },
      { icon: "temp", label: "Vitals Input", value: "Body Temperature 101.2°F" },
      { icon: "vitals", label: "Vitals Input", value: "Heart Rate 96 BPM · SpO₂ 97%" },
      { icon: "scan", label: "Image Analysis", value: "Mild throat erythema noted" },
    ],
    doList: [
      "Maintain hydration with boiled water",
      "Rest completely and avoid exertion",
      "Take paracetamol as per label for fever",
      "Eat light, easily digestible meals",
    ],
    dontList: [
      "Do not self-prescribe antibiotics",
      "Avoid cold exposure and unfiltered water",
      "Do not ignore worsening symptoms",
    ],
    recommendation: "Visit a General Physician within 24 hours if fever continues.",
  },
  {
    id: "rec-002",
    title: "Skin Rash Triage",
    date: "2026-06-15T17:42:00+05:30",
    risk: "low",
    chiefComplaint: "Itchy red patches on forearm",
    summary:
      "Likely contact dermatitis. No systemic involvement detected. Topical care and allergen avoidance should resolve within 5–7 days.",
    evidence: [
      { icon: "log", label: "Symptom Log", value: "Onset 2 days ago, no fever" },
      { icon: "scan", label: "Image Analysis", value: "Localised erythema, no pus" },
    ],
    doList: [
      "Apply prescribed antihistamine cream twice daily",
      "Wear loose cotton clothing",
      "Keep area clean and dry",
    ],
    dontList: ["Do not scratch the affected area", "Avoid scented soaps and detergents"],
    recommendation: "Self-care for 5 days; consult dermatologist if it spreads.",
  },
  {
    id: "rec-003",
    title: "Chest Discomfort — Urgent Review",
    date: "2026-05-30T22:08:00+05:30",
    risk: "high",
    chiefComplaint: "Sharp chest pain radiating to left arm",
    summary:
      "Reported symptoms include cardiac warning signs. Immediate in-person evaluation strongly advised. Patient was directed to nearest tertiary care emergency wing.",
    evidence: [
      { icon: "log", label: "Symptom Log", value: "Pain duration 25 minutes" },
      { icon: "vitals", label: "Vitals Input", value: "HR 112 BPM · BP 148/96" },
      { icon: "temp", label: "Vitals Input", value: "Temp 98.6°F" },
    ],
    doList: [
      "Call emergency services or reach hospital immediately",
      "Sit upright and stay calm",
      "Chew aspirin 325mg if not allergic and advised",
    ],
    dontList: [
      "Do not drive yourself to the hospital",
      "Do not delay seeking emergency care",
      "Do not eat or drink anything",
    ],
    recommendation: "Emergency: head to nearest cardiac care unit now.",
  },
  {
    id: "rec-004",
    title: "Seasonal Allergy Check-in",
    date: "2026-05-12T08:25:00+05:30",
    risk: "low",
    chiefComplaint: "Sneezing, watery eyes, nasal congestion",
    summary:
      "Pattern matches allergic rhinitis triggered by pollen. Symptoms are non-progressive and respond well to OTC antihistamines.",
    evidence: [
      { icon: "log", label: "Symptom Log", value: "Recurring each morning" },
      { icon: "vitals", label: "Vitals Input", value: "SpO₂ 99% · HR 78 BPM" },
    ],
    doList: [
      "Take cetirizine 10mg once daily as needed",
      "Use saline nasal rinse morning and night",
      "Keep windows closed during high pollen hours",
    ],
    dontList: ["Avoid dusty / outdoor exercise mid-day", "Do not combine multiple antihistamines"],
    recommendation: "Continue OTC care; review with ENT if persists > 4 weeks.",
  },
];

const STORAGE_KEY = "healthbox.records.v1";

const RISK_META: Record<
  RiskTier,
  { label: string; chip: string; ring: string; Icon: typeof ShieldCheck }
> = {
  low: {
    label: "Low Risk",
    chip: "bg-success/15 text-success",
    ring: "ring-success/30",
    Icon: ShieldCheck,
  },
  moderate: {
    label: "Moderate Risk",
    chip: "bg-warning/15 text-warning",
    ring: "ring-warning/30",
    Icon: AlertTriangle,
  },
  high: {
    label: "High Risk",
    chip: "bg-destructive/15 text-destructive",
    ring: "ring-destructive/30",
    Icon: AlertOctagon,
  },
  critical: {
    label: "Critical Emergency",
    chip: "bg-destructive/15 text-destructive",
    ring: "ring-destructive/30",
    Icon: AlertOctagon,
  },
};

const EVIDENCE_ICON = {
  log: ClipboardList,
  temp: Thermometer,
  vitals: Activity,
  scan: ScanLine,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapBackendRecordToTriageRecord(r: any): TriageRecord {
  return {
    id: r.id,
    title: r.report.primary_diagnosis || "Diagnosis",
    date: r.created_at,
    risk: (r.report.emergency_level?.toLowerCase() || "moderate") as RiskTier,
    chiefComplaint: r.chief_complaint || r.report.primary_diagnosis || "AI Diagnostic Triage",
    summary: `${r.report.primary_diagnosis || "Diagnosis"} (Confidence: ${r.report.confidence_percentage || "N/A"}) · Stage: ${r.report.condition_stage || "N/A"}`,
    evidence: (r.report.clinical_evidence || []).map((item: string) => {
      const lower = item.toLowerCase();
      let icon: "log" | "temp" | "vitals" | "scan" = "log";
      if (lower.includes("temp") || lower.includes("temperature")) icon = "temp";
      else if (
        lower.includes("bpm") ||
        lower.includes("spo2") ||
        lower.includes("blood pressure") ||
        lower.includes("heart rate")
      )
        icon = "vitals";
      else if (
        lower.includes("dermal") ||
        lower.includes("irritation") ||
        lower.includes("scan") ||
        lower.includes("boundary")
      )
        icon = "scan";
      return {
        label: "Clinical Evidence",
        value: item,
        icon,
      };
    }),
    doList: r.report.approved_protocols || [],
    dontList: r.report.contraindicated_actions || [],
    recommendation: r.report.precautions?.[0] || "Consult a physician if symptoms fail to resolve.",
    rawReport: r.report,
  };
}

function RecordsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [records, setRecords] = useState<TriageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const handleSinglePDFDownload = async (record: TriageRecord) => {
    const toastId = toast.loading(`Generating PDF for ${record.title}...`);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let y = 20;

      // Draw header banner
      doc.setFillColor(15, 118, 110); // primary teal color
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("HEALTHBOX CLINICAL SUMMARY REPORT", 15, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Report ID: ${record.rawReport?.report_id || record.id || "N/A"}`, 15, 26);
      doc.text(`Saved Timestamp: ${formatDate(record.date)}`, 15, 31);

      y = 50;

      // Emergency Level
      const risk = (record.risk?.toLowerCase() || "moderate") as RiskTier;
      const meta = RISK_META[risk] || RISK_META.moderate;

      if (risk === "critical" || risk === "high") {
        doc.setFillColor(220, 38, 38); // destructive red
      } else if (risk === "moderate") {
        doc.setFillColor(245, 158, 11); // warning orange/yellow
      } else {
        doc.setFillColor(22, 163, 74); // success green
      }
      doc.rect(15, y, 180, 10, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`EMERGENCY LEVEL: ${meta.label.toUpperCase()}`, 20, y + 6.5);

      y += 18;

      // Primary Diagnosis
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("PRIMARY DIAGNOSIS", 15, y);
      y += 6;

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);

      const diagLines = doc.splitTextToSize(record.title || "Unknown", 180);
      diagLines.forEach((line: string) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 15, y);
        y += 8;
      });

      if (record.rawReport?.confidence_percentage) {
        doc.setTextColor(15, 118, 110);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(
          `Clinical Correlation Confidence: ${record.rawReport.confidence_percentage}`,
          15,
          y,
        );
        y += 5;
      }

      if (record.rawReport?.condition_stage) {
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.text(`Condition Stage: ${record.rawReport.condition_stage}`, 15, y);
        y += 10;
      }

      // Helper for printing sections
      const printSectionHeader = (title: string) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setTextColor(15, 118, 110);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title, 15, y);
        y += 2;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y, 195, y);
        y += 6;
      };

      const printBulletList = (
        items: string[],
        bulletChar: string,
        bulletColor: [number, number, number],
      ) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        items.forEach((item) => {
          const lines = doc.splitTextToSize(item, 170);
          lines.forEach((line: string, index: number) => {
            if (y > 275) {
              doc.addPage();
              y = 20;
            }
            if (index === 0) {
              doc.setTextColor(bulletColor[0], bulletColor[1], bulletColor[2]);
              doc.setFont("helvetica", "bold");
              doc.text(bulletChar, 15, y);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(51, 65, 85);
              doc.text(line, 22, y);
            } else {
              doc.setTextColor(51, 65, 85);
              doc.text(line, 22, y);
            }
            y += 6;
          });
        });
        y += 4;
      };

      // 1. Clinical Evidence
      const evidenceTexts = record.evidence.map((e) => e.value);
      if (evidenceTexts.length > 0) {
        printSectionHeader("CLINICAL EVIDENCE BASE");
        printBulletList(evidenceTexts, "-", [100, 116, 139]);
      }

      // 2. Approved Protocols
      if (record.doList.length > 0) {
        printSectionHeader("APPROVED PROTOCOLS");
        printBulletList(record.doList, "+", [22, 163, 74]);
      }

      // 3. Contraindicated Actions
      if (record.dontList.length > 0) {
        printSectionHeader("CONTRAINDICATED ACTIONS");
        printBulletList(record.dontList, "x", [220, 38, 38]);
      }

      // 4. Precautions
      if (record.recommendation) {
        printSectionHeader("PRECAUTIONS & RECOMMENDATIONS");
        printBulletList([record.recommendation], "!", [15, 118, 110]);
      }

      // 5. Matched Government Schemes
      const schemes = record.rawReport?.matched_schemes || [];
      if (schemes.length > 0) {
        printSectionHeader("ELIGIBLE GOVERNMENT SCHEMES");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        schemes.forEach((scheme: any) => {
          const schemeText = `${scheme.name}\n- Target: ${scheme.targetDemographic}\n- Coverage: ${scheme.coverageLimit}`;
          const lines = doc.splitTextToSize(schemeText, 175);
          lines.forEach((line: string) => {
            if (y > 275) {
              doc.addPage();
              y = 20;
            }
            doc.setTextColor(51, 65, 85);
            doc.text(line, 15, y);
            y += 5;
          });
          y += 3;
        });
        y += 4;
      }

      // 6. Nearest Hospitals
      const hospitals = record.rawReport?.nearest_hospitals || [];
      if (hospitals.length > 0) {
        printSectionHeader("RECOMMENDED NEAREST HOSPITALS");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        hospitals.forEach((h: any) => {
          const hospText = `${h.name} (${h.is_govt ? "Government" : "Private"}) - Rating: ${h.rating}\n- Address: ${h.address}\n- Contact: ${h.number}`;
          const lines = doc.splitTextToSize(hospText, 175);
          lines.forEach((line: string) => {
            if (y > 275) {
              doc.addPage();
              y = 20;
            }
            doc.setTextColor(51, 65, 85);
            doc.text(line, 15, y);
            y += 5;
          });
          y += 3;
        });
        y += 4;
      }

      // Disclaimer
      if (y > 255) {
        doc.addPage();
        y = 20;
      }
      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, 195, y);
      y += 6;

      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);

      const disclaimerText =
        "Disclaimer: This output constitutes an automated digital triage summary " +
        "generated from preliminary user input data. It is not an active substitute " +
        "for formal, in-person diagnostic evaluation or clinical treatment from a " +
        "certified healthcare professional. This AI-generated analysis is not a " +
        "substitute for professional medical advice.";

      const disclaimerLines = doc.splitTextToSize(disclaimerText, 180);
      disclaimerLines.forEach((line: string) => {
        if (y > 285) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 15, y);
        y += 4;
      });

      toast.dismiss(toastId);
      doc.save(`HealthBox_Report_${record.rawReport?.report_id || record.id}.pdf`);
      toast.success("Report PDF downloaded successfully!");
    } catch (err) {
      console.error("Single PDF download error:", err);
      toast.dismiss(toastId);
      toast.error("Failed to generate and download PDF.");
    }
  };

  const handleBulkPDFDownload = async () => {
    if (records.length === 0) return;
    setIsDownloadingAll(true);
    const toastId = toast.loading("Generating combined multi-page PDF report...");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      records.forEach((record, index) => {
        if (index > 0) {
          doc.addPage();
        }

        let y = 15;

        // Custom running page header
        doc.setFillColor(15, 118, 110); // primary teal color
        doc.rect(0, 0, 210, 22, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("HEALTHBOX MULTI-RECORD BUNDLED EXPORT", 15, 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(
          `Report Date: ${formatDate(record.date)} | ID: ${record.rawReport?.report_id || record.id}`,
          15,
          16,
        );

        y = 32;

        // Title and Risk level
        const risk = (record.risk?.toLowerCase() || "moderate") as RiskTier;
        const meta = RISK_META[risk] || RISK_META.moderate;

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(record.title || "Diagnosis", 15, y);
        y += 6;

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Emergency Level: ${meta.label} | Chief Complaint: ${record.chiefComplaint}`,
          15,
          y,
        );
        y += 10;

        // Separator
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y, 195, y);
        y += 8;

        const printSubHeader = (title: string) => {
          doc.setTextColor(15, 118, 110);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(title, 15, y);
          y += 4;
        };

        const printBodyTextList = (items: string[], bullet: string) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          items.forEach((item) => {
            const lines = doc.splitTextToSize(`${bullet} ${item}`, 175);
            lines.forEach((line: string) => {
              doc.text(line, 15, y);
              y += 5;
            });
          });
          y += 3;
        };

        // Evidence
        const evidenceTexts = record.evidence.map((e) => e.value);
        if (evidenceTexts.length > 0) {
          printSubHeader("Clinical Evidence");
          printBodyTextList(evidenceTexts, "-");
        }

        // Approved protocols
        if (record.doList.length > 0) {
          printSubHeader("Approved Protocols");
          printBodyTextList(record.doList, "+");
        }

        // Contraindicated
        if (record.dontList.length > 0) {
          printSubHeader("Contraindicated Actions");
          printBodyTextList(record.dontList, "x");
        }

        // Precautions
        if (record.recommendation) {
          printSubHeader("Precautions & Recommendations");
          printBodyTextList([record.recommendation], "!");
        }

        // Mapped Schemes
        const schemes = record.rawReport?.matched_schemes || [];
        if (schemes.length > 0) {
          printSubHeader("Eligible Welfare Schemes Mapped");
          const schemeNames = schemes.map((s: any) => `${s.name} (Coverage: ${s.coverageLimit})`);
          printBodyTextList(schemeNames, "•");
        }

        // Mapped Hospitals
        const hospitals = record.rawReport?.nearest_hospitals || [];
        if (hospitals.length > 0) {
          printSubHeader("Nearest Recommended Hospitals Mapped");
          const hospNames = hospitals.map((h: any) => `${h.name} (${h.address})`);
          printBodyTextList(hospNames, "•");
        }

        // Footer disclaimer on each page
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 276, 195, 276);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.text(
          "Disclaimer: Automated triage summary. Not a substitute for professional medical advice.",
          15,
          282,
        );
      });

      const today = new Date().toISOString().split("T")[0];
      toast.dismiss(toastId);
      doc.save(`HealthBox_AllReports_${today}.pdf`);
      toast.success("All reports downloaded in combined PDF!");
    } catch (err) {
      console.error("Bulk PDF download error:", err);
      toast.dismiss(toastId);
      toast.error("Failed to generate bulk PDF.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    if (isAuthenticated) {
      setLoading(true);
      apiFetch<any[]>("/records")
        .then((data) => {
          const mapped = data.map(mapBackendRecordToTriageRecord);
          setRecords(mapped);
        })
        .catch((err) => {
          console.error("Failed to load records from backend", err);
          setRecords([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const active = records.find((r) => r.id === openId) ?? null;

  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-dvh bg-background pb-28">
      <div className="mx-auto w-full max-w-md px-5 pt-4">
        <header className="sticky top-0 z-10 -mx-5 mb-3 flex items-center gap-3 bg-background/90 px-5 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => (active ? setOpenId(null) : navigate({ to: "/home" }))}
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-border bg-card text-foreground active:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {active ? "Report Detail" : "Saved Triage Reports"}
            </p>
            <h1 className="truncate text-lg font-bold text-foreground">
              {active ? active.title : "My Records"}
            </h1>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
            <FolderHeart className="h-5 w-5" />
          </span>
        </header>

        {!active && (
          <>
            <div className="mb-3 flex items-center justify-between rounded-2xl border-2 border-border bg-card px-4 py-3">
              <div className="flex flex-col text-left">
                <span className="text-sm text-muted-foreground">Total reports</span>
                <span className="text-base font-black text-primary mt-0.5">
                  {records.length} saved
                </span>
              </div>
              {records.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkPDFDownload}
                  disabled={isDownloadingAll}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 disabled:opacity-50 transition shadow"
                >
                  {isDownloadingAll ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {isDownloadingAll ? "Generating..." : "Download All"}
                </button>
              )}
            </div>

            {records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border-2 border-dashed border-border bg-card">
                <FolderHeart className="h-16 w-16 text-primary/40 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-foreground">No Records Found</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[280px] leading-relaxed">
                  You haven't run any AI Diagnostics checks yet. Your dynamic triage reports will
                  appear here.
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/symptoms" })}
                  className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition active:scale-[0.98]"
                >
                  Start AI Diagnosis
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {records.map((r) => {
                  const meta = RISK_META[r.risk] || RISK_META.moderate;
                  return (
                    <li
                      key={r.id}
                      className="relative flex items-center gap-2 rounded-2xl border-2 border-border bg-card p-4 transition hover:bg-muted/30 ring-1 hover:scale-[0.99]"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId(r.id)}
                        className="flex-1 flex items-start gap-3 text-left focus:outline-none"
                      >
                        <span
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${meta.chip}`}
                        >
                          <meta.Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-base font-bold text-foreground">
                              {r.title}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                            {r.chiefComplaint}
                          </span>
                          <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(r.date)}
                            <span
                              className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.chip}`}
                            >
                              {meta.label}
                            </span>
                          </span>
                        </span>
                      </button>
                      <div className="flex flex-col items-center gap-3 shrink-0 self-center border-l border-border pl-2.5">
                        <button
                          type="button"
                          onClick={() => handleSinglePDFDownload(r)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary active:scale-95 transition-all hover:bg-primary/20"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {active && (
          <article className="flex flex-col gap-4">
            <div
              className={`rounded-2xl border-2 border-border bg-card p-4 ring-1 ${RISK_META[active.risk].ring}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl ${RISK_META[active.risk].chip}`}
                >
                  {(() => {
                    const I = RISK_META[active.risk].Icon;
                    return <I className="h-6 w-6" />;
                  })()}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {RISK_META[active.risk].label}
                  </p>
                  <h2 className="truncate text-lg font-bold text-foreground">
                    {active.chiefComplaint}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{active.summary}</p>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(active.date)}
              </p>
            </div>

            <section className="rounded-2xl border-2 border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <FileText className="h-4 w-4" /> Evidence
              </h3>
              <ul className="flex flex-col gap-2">
                {active.evidence.map((e, i) => {
                  const I = EVIDENCE_ICON[e.icon];
                  return (
                    <li key={i} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <I className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {e.label}
                        </span>
                        <span className="block text-sm font-medium text-foreground">{e.value}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="grid grid-cols-1 gap-3">
              <section className="rounded-2xl border-2 border-success/30 bg-success/5 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-success">
                  <Check className="h-4 w-4" /> Recommended
                </h3>
                <ul className="flex flex-col gap-1.5 text-sm text-foreground">
                  {active.doList.map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-destructive">
                  <X className="h-4 w-4" /> Avoid
                </h3>
                <ul className="flex flex-col gap-1.5 text-sm text-foreground">
                  {active.dontList.map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-primary text-left">
                Next Step
              </h3>
              <p className="text-sm font-medium text-foreground text-left">
                {active.recommendation}
              </p>
            </section>

            {active.rawReport?.matched_schemes && active.rawReport.matched_schemes.length > 0 && (
              <section className="rounded-2xl border-2 border-secondary/30 bg-secondary/5 p-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Eligible Welfare Schemes
                </h3>
                <div className="flex flex-col gap-3 text-left">
                  {active.rawReport.matched_schemes.map((s: any, i: number) => (
                    <div
                      key={i}
                      className="border-b border-dashed border-border pb-2 last:border-b-0 last:pb-0"
                    >
                      <p className="text-sm font-bold text-foreground leading-snug">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Eligibility: {s.targetDemographic}
                      </p>
                      <p className="text-xs text-muted-foreground">Coverage: {s.coverageLimit}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {active.rawReport?.nearest_hospitals &&
              active.rawReport.nearest_hospitals.length > 0 && (
                <section className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <FolderHeart className="h-4 w-4" /> Recommended Hospitals
                  </h3>
                  <div className="flex flex-col gap-3 text-left">
                    {active.rawReport.nearest_hospitals.map((h: any, i: number) => (
                      <div
                        key={i}
                        className="border-b border-dashed border-border pb-2 last:border-b-0 last:pb-0"
                      >
                        <p className="text-sm font-bold text-foreground leading-snug">{h.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Cures: {h.all_disease_it_cures?.join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">Address: {h.address}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="mt-1 w-full rounded-2xl border-2 border-border bg-card py-3 text-sm font-bold text-foreground active:bg-muted"
            >
              Back to all reports
            </button>
          </article>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
