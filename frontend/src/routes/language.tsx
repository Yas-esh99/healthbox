import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Languages } from "lucide-react";
import { LANGUAGES, useLanguage, type LanguageCode } from "@/lib/language";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/language")({
  head: () => ({
    meta: [
      { title: "Select Language" },
      { name: "description", content: "Choose your preferred language" },
    ],
  }),
  component: LanguagePage,
});

function LanguagePage() {
  const { language, setLanguage } = useLanguage();
  const [selected, setSelected] = useState<LanguageCode | null>(language);
  const navigate = useNavigate();

  const onContinue = () => {
    if (!selected) return;
    setLanguage(selected);
    navigate({ to: "/login" });
  };

  return (
    <main className="flex min-h-dvh flex-col bg-background px-5 pt-10 pb-6">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Languages className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Select Language</h1>
          <p className="mt-1 text-base text-muted-foreground">भाषा चुनें</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelected(lang.code)}
                className={cn(
                  "flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-[0.98]",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-lg"
                    : "border-border bg-card text-card-foreground hover:border-primary/40",
                )}
                aria-pressed={isSelected}
              >
                <span className="text-3xl font-bold leading-tight">{lang.native}</span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {lang.english}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={onContinue}
            disabled={!selected}
            className={cn(
              "flex h-16 w-full items-center justify-center gap-2 rounded-2xl text-xl font-semibold transition-all active:scale-[0.99]",
              selected
                ? "bg-primary text-primary-foreground shadow-md"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            Continue
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </main>
  );
}
