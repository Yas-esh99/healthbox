import { createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Volume2,
  Pause,
  Download,
  Check,
  X,
  Activity,
  Thermometer,
  ScanLine,
  ClipboardList,
  Hospital,
  Landmark,
  Star,
  MapPin,
  Phone,
  Navigation,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { DiseaseHeatmapView } from "@/components/disease-heatmap";
import { apiFetch, HeatmapDataPoint, Hospital as HospitalData, Scheme } from "@/lib/api";

export const Route = createFileRoute("/triage-results")({
  head: () => ({ meta: [{ title: "Clinical Summary Report" }] }),
  component: TriageResultsPage,
});

type RiskTier = "low" | "moderate" | "high" | "critical";

const RISK_CONFIG: Record<RiskTier, { label: string; block: string }> = {
  low: { label: "Low Risk", block: "bg-success text-success-foreground" },
  moderate: { label: "Moderate Risk", block: "bg-warning text-warning-foreground" },
  high: { label: "High Risk", block: "bg-destructive text-destructive-foreground" },
  critical: { label: "Critical Emergency", block: "bg-destructive text-destructive-foreground" },
};

function TriageResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);

  // @ts-expect-error location.state is typed as unknown
  const report = location.state?.report || {
    report_id: "HB-2026-9941",
    emergency_level: "moderate",
    primary_diagnosis: "Viral Pharyngitis",
    confidence_percentage: "89%",
    condition_stage: "Acute",
    clinical_evidence: [
      "Fever persisting > 48 hours",
      "Body Temperature 101.2°F",
      "Heart Rate 96 BPM · SpO₂ 97%",
      "Dermal boundary irritation detected",
    ],
    approved_protocols: [
      "Maintain adequate hydration with boiled water",
      "Rest completely and avoid exertion",
      "Take paracetamol as per label for fever",
      "Eat light, easily digestible meals",
    ],
    contraindicated_actions: [
      "Do not self-prescribe unverified antibiotics",
      "Do not engage in heavy physical strain",
      "Avoid cold exposure and unfiltered water",
      "Do not ignore worsening symptoms",
    ],
    precautions: [
      "Record body temperature at 6-hour intervals and note any spikes.",
      "Continue home care with rest and fluids; monitor appetite.",
      "Consult a physical physician if symptoms fail to resolve within 48 hours.",
    ],
  };

  const [nearestHospitals, setNearestHospitals] = useState<HospitalData[]>(
    report.nearest_hospitals || [],
  );
  const [matchedSchemes, setMatchedSchemes] = useState<Scheme[]>(report.matched_schemes || []);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[] | null>(
    report.disease_heatmap || null,
  );
  const [loadingHeatmap, setLoadingHeatmap] = useState(!report.disease_heatmap);
  const [loadingEnrichment, setLoadingEnrichment] = useState(
    !report.nearest_hospitals || !report.matched_schemes,
  );

  useEffect(() => {
    // If we have full report data from navigation state, use it
    if (report.nearest_hospitals && report.matched_schemes && report.disease_heatmap) {
      setNearestHospitals(report.nearest_hospitals);
      setMatchedSchemes(report.matched_schemes);
      setHeatmapData(report.disease_heatmap);
      setLoadingHeatmap(false);
      setLoadingEnrichment(false);
      return;
    }

    // Otherwise, fetch dynamically from backend
    if (report.primary_diagnosis) {
      setLoadingHeatmap(true);
      setLoadingEnrichment(true);

      apiFetch<any>("/reports/enrich", {
        method: "POST",
        body: JSON.stringify({ primary_diagnosis: report.primary_diagnosis }),
      })
        .then((data) => {
          setNearestHospitals(data.nearest_hospitals || []);
          setMatchedSchemes(data.matched_schemes || []);
          setHeatmapData(data.disease_heatmap || []);
        })
        .catch((err) => {
          console.error("Failed to fetch enrichment details:", err);
          setNearestHospitals([]);
          setMatchedSchemes([]);
          setHeatmapData([]);
        })
        .finally(() => {
          setLoadingHeatmap(false);
          setLoadingEnrichment(false);
        });
    } else {
      setNearestHospitals([]);
      setMatchedSchemes([]);
      setHeatmapData([]);
      setLoadingHeatmap(false);
      setLoadingEnrichment(false);
    }
  }, [
    report.nearest_hospitals,
    report.matched_schemes,
    report.disease_heatmap,
    report.primary_diagnosis,
  ]);

  const govtHospitals = nearestHospitals.filter((h: HospitalData) => h.is_govt);
  const privateHospitals = nearestHospitals.filter((h: HospitalData) => !h.is_govt);

  const risk = (report.emergency_level?.toLowerCase() || "moderate") as RiskTier;
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.moderate;

  const timestamp = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Generating report PDF...");
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
      doc.text(`Report ID: ${report.report_id || "HB-2026-9941"}`, 15, 26);
      doc.text(`Generated: ${timestamp}`, 15, 31);

      y = 50;

      // Emergency Level
      const risk = (report.emergency_level?.toLowerCase() || "moderate") as RiskTier;
      const cfg = RISK_CONFIG[risk] || RISK_CONFIG.moderate;

      // Draw risk colored banner
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
      doc.text(`EMERGENCY LEVEL: ${cfg.label.toUpperCase()}`, 20, y + 6.5);

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

      const diagLines = doc.splitTextToSize(report.primary_diagnosis || "Unknown", 180);
      diagLines.forEach((line: string) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 15, y);
        y += 8;
      });

      doc.setTextColor(15, 118, 110);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Clinical Correlation Confidence: ${report.confidence_percentage || "N/A"}`, 15, y);
      y += 5;

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text(`Condition Stage: ${report.condition_stage || "N/A"}`, 15, y);

      y += 15;

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
              // Draw bullet indicator
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
      const evidence = report.clinical_evidence || [];
      if (evidence.length > 0) {
        printSectionHeader("CLINICAL EVIDENCE BASE");
        printBulletList(evidence, "-", [100, 116, 139]);
      }

      // 2. Approved Protocols
      const approved = report.approved_protocols || [];
      if (approved.length > 0) {
        printSectionHeader("APPROVED PROTOCOLS");
        printBulletList(approved, "+", [22, 163, 74]);
      }

      // 3. Contraindicated Actions
      const contraindicated = report.contraindicated_actions || [];
      if (contraindicated.length > 0) {
        printSectionHeader("CONTRAINDICATED ACTIONS");
        printBulletList(contraindicated, "x", [220, 38, 38]);
      }

      // 4. Precautions
      const precautions = report.precautions || [];
      if (precautions.length > 0) {
        printSectionHeader("PRECAUTIONS & SYMPTOM TRACKING");
        printBulletList(precautions, "!", [15, 118, 110]);
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
        "certified healthcare professional.";

      const disclaimerLines = doc.splitTextToSize(disclaimerText, 180);
      disclaimerLines.forEach((line: string) => {
        if (y > 285) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 15, y);
        y += 4;
      });

      doc.save(`Healthbox_Clinical_Report_${report.report_id || "HB-2026-9941"}.pdf`);
      toast.success("Report PDF downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Failed to generate and download PDF.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-12">
      <div className="mx-auto w-full max-w-md px-5 pt-4">
        {/* 1. INSTITUTIONAL IDENTIFICATION & TOOLS */}
        <header className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/symptoms" })}
            aria-label="Go back"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-foreground active:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black leading-tight text-primary">
              Healthbox Clinical Summary Report
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-semibold text-muted-foreground">
              <span>Report ID: {report.report_id}</span>
              <span>Timestamp: {timestamp}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <AudioToggle />
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              aria-label="Download report"
              className="grid h-10 w-10 place-items-center rounded-full border-2 border-border bg-card text-foreground active:bg-muted disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </button>
          </div>
        </header>

        {/* 2. PRIMARY DIAGNOSIS & STATUS FIELDS */}
        <section className="mt-6">
          <div
            className={
              "flex items-center justify-between rounded-xl px-4 py-3 text-base font-black shadow-sm " +
              cfg.block
            }
          >
            <span>Emergency Level</span>
            <span>{cfg.label}</span>
          </div>

          <div className="mt-4 rounded-3xl border-2 border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Primary Diagnosis
            </p>
            <h2 className="mt-1 text-3xl font-black leading-tight text-foreground">
              {report.primary_diagnosis}
            </h2>
            <p className="mt-2 text-sm font-bold text-primary">
              Clinical Correlation Confidence: {report.confidence_percentage}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm font-bold text-foreground">
              Condition Stage: {report.condition_stage}
            </div>
            <p className="mt-4 text-xs font-bold text-destructive flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive shrink-0 animate-pulse" />
              This AI-generated analysis is not a substitute for professional medical advice.
            </p>
          </div>
        </section>

        {/* 3. CLINICAL EVIDENCE BASE */}
        <section className="mt-7">
          <h3 className="text-lg font-black text-foreground">Clinical Evidence Base</h3>
          <div className="mt-3 divide-y-2 divide-border rounded-2xl border-2 border-border bg-card">
            {report.clinical_evidence.map((evidence: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ClipboardList className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Evidence {(idx + 1).toString().padStart(2, "0")}
                  </p>
                  <p className="text-[15px] font-semibold text-foreground">{evidence}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. ACTIONABLE PROTOCOLS */}
        <section className="mt-7">
          <h3 className="text-lg font-black text-foreground">Actionable Protocols</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Column A — Do */}
            <div className="rounded-2xl border-2 border-success/40 bg-success/5 p-4">
              <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-success">
                Approved Protocols
              </h4>
              <ul className="space-y-2.5">
                {report.approved_protocols.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column B — Don't */}
            <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4">
              <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-destructive">
                Contraindicated Actions
              </h4>
              <ul className="space-y-2.5">
                {report.contraindicated_actions.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-destructive text-destructive-foreground">
                      <X className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 5. CONDITIONAL PRECAUTIONS */}
        <section className="mt-7">
          <h3 className="text-lg font-black text-foreground">Precautions &amp; Symptom Tracking</h3>
          <div className="mt-3 rounded-2xl border-2 border-border bg-card p-5">
            <ul className="space-y-3 text-[15px] leading-relaxed text-foreground">
              {report.precautions.map((precaution: string, idx: number) => (
                <li key={idx} className="flex gap-2.5">
                  <span
                    className={`font-black ${risk === "high" || risk === "critical" ? "text-destructive" : "text-primary"}`}
                  >
                    {idx + 1}.
                  </span>
                  {precaution}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. REGULATORY & MEDICAL LEGAL DISCLAIMER */}
        <p className="mt-8 text-[11px] italic leading-relaxed text-muted-foreground">
          Disclaimer: This output constitutes an automated digital triage summary generated from
          preliminary user input data. It is not an active substitute for formal, in-person
          diagnostic evaluation or clinical treatment from a certified healthcare professional.
        </p>

        {/* 7. CARE NAVIGATION ACTIONS */}
        <section className="mt-7 space-y-8">
          <div>
            <h3 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
              <Hospital className="h-5 w-5 text-primary" strokeWidth={2.5} /> Government Hospitals
            </h3>
            {govtHospitals.length > 0 ? (
              <div className="space-y-3">
                {govtHospitals.map((h: HospitalData, idx: number) => (
                  <HospitalCardDynamic key={idx} hospital={h} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-border bg-card p-5 text-center mt-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  No government hospitals found nearby for this condition.
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
              <Hospital className="h-5 w-5 text-primary" strokeWidth={2.5} /> Private Hospitals
            </h3>
            {privateHospitals.length > 0 ? (
              <div className="space-y-3">
                {privateHospitals.map((h: HospitalData, idx: number) => (
                  <HospitalCardDynamic key={idx} hospital={h} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-border bg-card p-5 text-center mt-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  No private hospitals found nearby for this condition.
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-secondary" strokeWidth={2.5} /> Government Welfare
              Schemes
            </h3>
            {matchedSchemes && matchedSchemes.length > 0 ? (
              <div className="space-y-3">
                {matchedSchemes.map((s: Scheme, idx: number) => (
                  <SchemeCard key={idx} scheme={s} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-border bg-card p-5 text-center mt-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  No government welfare schemes matched for this condition.
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" strokeWidth={2.5} /> Disease Heatmap
            </h3>
            {loadingHeatmap ? (
              <div className="flex min-h-[150px] items-center justify-center rounded-2xl border-2 border-border bg-card p-5 mt-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : heatmapData && heatmapData.length > 0 ? (
              <DiseaseHeatmapView
                data={heatmapData}
                loading={false}
                initialDisease={report.primary_diagnosis}
                hideCampRecommendations={true}
              />
            ) : (
              <div className="rounded-2xl border-2 border-border bg-card p-5 text-center mt-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  No outbreak data available for this condition yet
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SchemeCard({ scheme }: { scheme: Scheme }) {
  return (
    <article className="rounded-2xl border-2 border-border bg-card p-5 mt-3 text-left">
      <h4 className="text-base font-black leading-snug text-foreground">{scheme.name}</h4>

      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[11px] font-extrabold text-secondary leading-snug">
        <Landmark className="h-3.5 w-3.5 shrink-0" strokeWidth={2.75} />
        <span>Eligibility: {scheme.targetDemographic}</span>
      </div>

      {scheme.requiredDocuments && scheme.requiredDocuments.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" /> Required Documents
          </p>
          <ul className="mt-1.5 space-y-1 text-sm text-foreground">
            {scheme.requiredDocuments.map((d: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span className="text-primary">•</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {scheme.benefits && scheme.benefits.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> Benefits
          </p>
          <ul className="mt-1.5 space-y-1 text-sm text-foreground">
            {scheme.benefits.map((b: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span className="text-secondary">•</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Coverage Limit
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground font-semibold">
          {scheme.coverageLimit}
        </p>
      </div>

      <p className="mt-4 text-sm italic leading-relaxed text-muted-foreground">
        {scheme.description}
      </p>
    </article>
  );
}

function HospitalCardDynamic({ hospital }: { hospital: HospitalData }) {
  const handleDirections = () => {
    toast.success("Opening map directions", { description: hospital.name });
    if (hospital.google_map_direction_link) {
      window.open(hospital.google_map_direction_link, "_blank");
    } else {
      window.open(
        `https://maps.google.com/?q=${encodeURIComponent(hospital.name + " " + hospital.address)}`,
        "_blank",
      );
    }
  };

  const handleCall = () => {
    toast.success("Calling hospital", { description: hospital.number });
    window.open(`tel:${hospital.number}`, "_self");
  };

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 mt-3 text-left">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Hospital className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-base font-extrabold leading-snug text-foreground">
              {hospital.name}
            </h3>
            {hospital.is_govt && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                Govt
              </span>
            )}
            {hospital.ayushman_active && (
              <span className="rounded bg-secondary/15 px-1.5 py-0.5 text-[10px] font-bold text-secondary uppercase">
                PM-JAY
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground line-clamp-2">
            Cures: {hospital.all_disease_it_cures?.slice(0, 3).join(", ")}
            {hospital.all_disease_it_cures?.length > 3 && "..."}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-xs font-black text-success">
          <Star className="h-3.5 w-3.5 fill-current" />
          {(hospital.rating || 0.0).toFixed(1)}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="leading-snug">{hospital.address}</span>
        </p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0 text-primary" />
          <span>{hospital.number}</span>
        </p>
        <div className="flex gap-4 text-xs font-bold text-muted-foreground pt-1.5 border-t border-dashed border-border mt-2">
          <span>
            Beds Available:{" "}
            <span className="text-foreground font-black">{hospital.beds_available}</span>
          </span>
          <span>
            Emergency:{" "}
            <span
              className={
                hospital.emergency_24x7
                  ? "text-success font-black"
                  : "text-muted-foreground font-black"
              }
            >
              {hospital.emergency_24x7 ? "24x7" : "No"}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleDirections}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow active:scale-[0.99]"
        >
          <Navigation className="h-4 w-4" />
          Directions
        </button>
        <button
          type="button"
          onClick={handleCall}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-card py-3 text-sm font-bold text-foreground active:bg-muted"
        >
          <Phone className="h-4 w-4" />
          Call Now
        </button>
      </div>
    </div>
  );
}

function AudioToggle() {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      if (timer.current) clearTimeout(timer.current);
      return;
    }
    setPlaying(true);
    toast("Playing audio summary", { description: "Reading the report aloud" });
    timer.current = setTimeout(() => setPlaying(false), 4000);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? "Pause audio" : "Play audio summary"}
      className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow active:scale-95"
    >
      {playing ? <Pause className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
}
