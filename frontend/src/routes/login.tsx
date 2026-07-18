import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/language";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login" }, { name: "description", content: "Sign in with your mobile number" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { requestOtp } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isValid = phone.length === 10;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  };

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await requestOtp(phone);
      toast.success("OTP sent", {
        description: `We sent a 6-digit code to +91 ${phone}`,
      });
      navigate({ to: "/verify-otp", search: { phone } });
    } catch (err: any) {
      toast.error(err.detail || err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col bg-background px-5 pt-4 pb-6">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <Link
          to="/language"
          className="inline-flex h-12 w-12 items-center justify-center -ml-2 rounded-full text-foreground hover:bg-muted"
          aria-label={t("back")}
        >
          <ChevronLeft className="h-7 w-7" />
        </Link>

        <div className="mt-6 flex flex-col items-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary">
            <Smartphone className="h-10 w-10" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-foreground">{t("login_title")}</h1>
          <p className="mt-2 text-base text-muted-foreground">{t("login_subtitle")}</p>
        </div>

        <div className="mt-8">
          <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-foreground">
            {t("login_label")}
          </label>
          <div className="flex h-16 w-full items-center overflow-hidden rounded-2xl border-2 border-border bg-card focus-within:border-primary">
            <span className="flex h-full items-center justify-center border-r-2 border-border bg-muted px-4 text-xl font-semibold text-foreground">
              +91
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              placeholder="00000 00000"
              value={phone}
              onChange={handleChange}
              className="h-full flex-1 bg-transparent px-4 text-2xl font-semibold tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
          <p className="mt-2 text-right text-sm text-muted-foreground">{phone.length} / 10</p>
        </div>

        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className={cn(
              "flex h-16 w-full items-center justify-center rounded-2xl text-xl font-semibold transition-all active:scale-[0.99]",
              isValid && !loading
                ? "bg-primary text-primary-foreground shadow-md"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
            ) : (
              t("get_otp")
            )}
          </button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </main>
  );
}
