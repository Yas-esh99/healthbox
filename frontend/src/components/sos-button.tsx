import { toast } from "sonner";
import { Siren } from "lucide-react";
import { useTranslation } from "../lib/language";

export function SosButton() {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => {
        toast.error("Emergency SOS", {
          description: "Connecting to emergency services (112)...",
        });
        setTimeout(() => {
          window.location.href = "tel:112";
        }, 800);
      }}
      aria-label={t("sos")}
      className="fixed bottom-35 left-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-[0_8px_24px_-4px_rgba(239,68,68,0.55)] ring-4 ring-destructive/20 transition active:scale-95"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" />
      <span className="relative flex flex-col items-center leading-none">
        <Siren className="h-5 w-5" />
        <span className="mt-0.5 text-[9px] font-black tracking-wider">SOS</span>
      </span>
    </button>
  );
}
