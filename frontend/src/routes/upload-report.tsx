import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Upload, FileCheck, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/upload-report")({
  head: () => ({ meta: [{ title: "Upload Report" }] }),
  component: UploadReportPage,
});

function UploadReportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      // Client-side file size check (10MB limit)
      if (selected.size > 10 * 1024 * 1024) {
        toast.error("File is too large", { description: "Maximum file size is 10 MB." });
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      
      // Client-side file type check
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(selected.type)) {
        toast.error("Unsupported file type", { description: "Please upload a JPEG, PNG, or PDF report." });
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      setFile(selected);
      toast("Report selected", { description: selected.name });
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a report first");
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading("Analyzing medical report with Gemini...", {
      description: "Extracting diagnosis, evidence, and care protocols...",
    });

    let report: any = null;
    const maxAttempts = 3;
    const backoffTimes = [1000, 2000, 4000];

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          if (attempt > 1) {
            const delay = backoffTimes[attempt - 2];
            toast.loading("Analyzing... retrying...", {
              description: `AI service busy. Retrying in ${delay / 1000}s (Attempt ${attempt}/${maxAttempts})...`,
              id: toastId,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          const formData = new FormData();
          formData.append("file", file);

          // 1. Upload and analyze report via backend endpoint
          report = await apiFetch<any>("/reports/analyze", {
            method: "POST",
            body: formData,
          });
          break; // Success! Exit the retry loop.
        } catch (err: any) {
          const isUnavailable = err.status === 503 || 
                                (err.message && err.message.includes("503")) || 
                                (err.detail && err.detail.includes("UNAVAILABLE"));

          if (isUnavailable && attempt < maxAttempts) {
            console.warn(`Attempt ${attempt} failed with 503/UNAVAILABLE. Retrying...`, err);
            continue;
          }
          // If it's not a 503 error, or we ran out of attempts, throw it.
          throw err;
        }
      }

      toast.loading("Saving analysis report to records...", { id: toastId });

      // 2. Save result to My Records
      await apiFetch("/records", {
        method: "POST",
        body: JSON.stringify({
          report: report,
          chief_complaint: `Uploaded Medical Report: ${file.name}`,
        }),
      });

      toast.success("Analysis complete and saved!", { id: toastId });
      
      // 3. Navigate to triage-results with report state
      navigate({ to: "/triage-results", state: { report } as Record<string, unknown> });
    } catch (err: any) {
      console.error("Analysis failed:", err);
      let errMsg = err.detail || err.message || "Unknown error during report analysis.";
      const isUnavailable = err.status === 503 || 
                            (err.message && err.message.includes("503")) || 
                            (err.detail && err.detail.includes("UNAVAILABLE"));
      if (isUnavailable) {
        errMsg = "The AI service is busy right now — please try again in a moment.";
      }
      toast.error("Report Analysis Failed", {
        description: errMsg,
        id: toastId,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md px-5 pt-4">
        {/* Header */}
        <button
          type="button"
          onClick={() => navigate({ to: "/home" })}
          disabled={isAnalyzing}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground active:text-foreground disabled:opacity-50"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Upload Only
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground">Upload Report</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Select a medical report or ID to upload.
          </p>
        </div>

        {/* File selection area */}
        <div className="mt-8">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isAnalyzing}
            aria-label="Select report file"
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border bg-card p-10 text-center transition active:scale-[0.98] active:bg-muted disabled:opacity-50"
          >
            <span className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
              {file ? (
                <FileCheck className="h-9 w-9 text-success" />
              ) : (
                <Upload className="h-9 w-9" />
              )}
            </span>
            <span className="text-lg font-bold text-foreground max-w-full truncate px-4">
              {file ? file.name : "Tap to select a file"}
            </span>
            <span className="text-sm text-muted-foreground">
              Images or PDFs up to 10 MB
            </span>
          </button>
        </div>

        {/* Submit button */}
        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            disabled={isAnalyzing || !file}
            className="h-16 w-full rounded-2xl bg-secondary text-lg font-bold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing && <Loader2 className="h-5 w-5 animate-spin" />}
            {isAnalyzing ? "Analyzing Report..." : "Submit Report"}
          </Button>
        </div>
      </div>
    </div>
  );
}
