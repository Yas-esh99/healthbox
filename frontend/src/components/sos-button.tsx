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
      className="fixed bottom-24 left-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-[0_10px_30px_-5px_rgba(239,68,68,0.6)] ring-4 ring-destructive/20 transition active:scale-95"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" />
      <span className="relative flex flex-col items-center leading-none">
        <Siren className="h-6 w-6" />
        <span className="mt-0.5 text-[10px] font-black tracking-wider">SOS</span>
      </span>
    </button>
  );
}
