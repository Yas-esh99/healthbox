import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ShieldCheck, Delete } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/language";

import { useAuth } from "@/lib/auth";

type OtpSearch = { phone?: string };

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>): OtpSearch => ({
    phone: typeof search.phone === "string" ? search.phone : undefined,
  }),
  head: () => ({
    meta: [{ title: "Verify OTP" }],
  }),
  component: VerifyOtpPage,
});

const OTP_LENGTH = 6;

function VerifyOtpPage() {
  const { phone } = Route.useSearch();
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const { verifyOtp } = useAuth();
  const { t } = useTranslation();
  const submitted = useRef(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const value = digits.join("");
  const isComplete = value.length === OTP_LENGTH;

  // Auto-focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const performVerification = async () => {
      if (isComplete && !submitted.current) {
        submitted.current = true;
        setVerifying(true);
        try {
          const res = await verifyOtp(phone || "", value);
          toast.success("Verified successfully!");

          if (res.registered) {
            navigate({ to: "/home" });
          } else {
            navigate({ to: "/register", search: { phone } });
          }
        } catch (err) {
          const error = err as { detail?: string; message?: string };
          toast.error(error.detail || error.message || "Invalid OTP. Please try again.");
          // Reset pin code state on error
          setDigits(Array(OTP_LENGTH).fill(""));
          submitted.current = false;
          setVerifying(false);
          // Focus the first input after resetting
          inputRefs.current[0]?.focus();
        }
      }
    };

    performVerification();
  }, [isComplete, navigate, phone, value, verifyOtp]);

  // Handle typing from keyboard
  const handleChange = (val: string, index: number) => {
    if (submitted.current) return;

    // Extract only digits
    const digit = val.replace(/\D/g, "").slice(-1);

    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);

    // Auto-focus next input if a digit was entered
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  // Handle Backspace, Left/Right arrow keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (submitted.current) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      const nextDigits = [...digits];
      if (digits[index]) {
        nextDigits[index] = "";
        setDigits(nextDigits);
      } else if (index > 0) {
        nextDigits[index - 1] = "";
        setDigits(nextDigits);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
    }
  };

  // Handle Paste events
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number) => {
    if (submitted.current) return;
    e.preventDefault();

    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pastedText) return;

    const nextDigits = [...digits];
    let lastFilledIndex = startIndex;

    for (let i = 0; i < pastedText.length; i++) {
      const targetIndex = startIndex + i;
      if (targetIndex < OTP_LENGTH) {
        nextDigits[targetIndex] = pastedText[i];
        lastFilledIndex = targetIndex;
      }
    }

    setDigits(nextDigits);
    const nextFocus = Math.min(lastFilledIndex + 1, OTP_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();
    setFocusedIndex(nextFocus);
  };

  // Handle virtual keypad click
  const press = (d: string) => {
    if (submitted.current) return;

    let targetIndex = focusedIndex !== null ? focusedIndex : digits.findIndex((x) => x === "");
    if (targetIndex === -1) {
      targetIndex = OTP_LENGTH - 1; // Fallback to last digit if all are full
    }

    const nextDigits = [...digits];
    nextDigits[targetIndex] = d;
    setDigits(nextDigits);

    // Move focus to next input
    const nextIndex = Math.min(targetIndex + 1, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
    setFocusedIndex(nextIndex);
  };

  // Handle virtual keypad backspace
  const backspace = () => {
    if (submitted.current) return;

    let targetIndex = focusedIndex !== null ? focusedIndex : -1;
    if (targetIndex === -1) {
      for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i] !== "") {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex === -1) return;

    const nextDigits = [...digits];
    if (nextDigits[targetIndex]) {
      nextDigits[targetIndex] = "";
      setDigits(nextDigits);
    } else if (targetIndex > 0) {
      nextDigits[targetIndex - 1] = "";
      setDigits(nextDigits);
      inputRefs.current[targetIndex - 1]?.focus();
      setFocusedIndex(targetIndex - 1);
    }
  };

  const keys: (string | "back")[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

  return (
    <main className="flex min-h-dvh flex-col bg-background px-5 pt-4 pb-6">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <Link
          to="/login"
          className="-ml-2 inline-flex h-12 w-12 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label={t("back")}
        >
          <ChevronLeft className="h-7 w-7" />
        </Link>

        <div className="mt-4 flex flex-col items-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-foreground">{t("enter_otp")}</h1>
          <p className="mt-2 text-base text-muted-foreground">
            {t("sent_to")}{" "}
            <span className="font-semibold text-foreground">+91 {phone ?? "----- -----"}</span>
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {digits.map((d, i) => {
            const active =
              focusedIndex === i ||
              (focusedIndex === null && i === digits.findIndex((x) => x === ""));
            return (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={(e) => handlePaste(e, i)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => {
                  if (focusedIndex === i) setFocusedIndex(null);
                }}
                aria-label={`OTP Digit ${i + 1}`}
                autoComplete={i === 0 ? "one-time-code" : "off"}
                className={cn(
                  "h-14 w-12 text-center rounded-xl border-2 text-2xl font-bold text-foreground bg-card focus:outline-none focus:border-primary transition-all",
                  d
                    ? "border-primary bg-primary/5"
                    : active
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border",
                )}
              />
            );
          })}
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {verifying ? t("loading") : ""}
        </p>

        <div className="mt-auto pt-6">
          <div className="grid grid-cols-3 gap-3">
            {keys.map((k, i) => {
              if (k === "") return <div key={i} />;
              if (k === "back") {
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={backspace}
                    className="grid h-16 place-items-center rounded-2xl border-2 border-border bg-card text-foreground active:scale-[0.97] active:bg-muted cursor-pointer"
                    aria-label="Backspace"
                  >
                    <Delete className="h-6 w-6" />
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => press(k)}
                  className="grid h-16 place-items-center rounded-2xl border-2 border-border bg-card text-2xl font-bold text-foreground active:scale-[0.97] active:bg-muted cursor-pointer"
                >
                  {k}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
