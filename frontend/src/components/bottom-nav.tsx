import { Link } from "@tanstack/react-router";
import { Home, FileText, MapPin, MessageCircle } from "lucide-react";
import { useTranslation } from "../lib/language";

const items = [
  { to: "/home", translationKey: "home" as const, icon: Home },
  { to: "/schemes", translationKey: "schemes" as const, icon: FileText },
  { to: "/camps", translationKey: "camps" as const, icon: MapPin },
  { to: "/chat", translationKey: "chat" as const, icon: MessageCircle },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.08)]">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(({ to, translationKey, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex flex-col items-center justify-center gap-1 py-2.5 text-muted-foreground data-[status=active]:text-primary"
            >
              <span className="grid h-10 w-12 place-items-center rounded-xl transition-colors group-data-[status=active]:bg-primary/10">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-semibold">{t(translationKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
