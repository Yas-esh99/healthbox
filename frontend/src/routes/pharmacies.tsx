import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Pill as PillIcon,
  MapPin,
  Phone,
  Navigation,
  BadgeCheck,
  Loader2,
  X,
  Mail,
  Star,
  MessageCircle,
  Clock,
  Percent,
  ShieldCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { SosButton } from "@/components/sos-button";
import { fetchPharmacies, Pharmacy } from "@/lib/api";
import { useTranslation } from "@/lib/language";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pharmacies")({
  head: () => ({ meta: [{ title: "Nearby Pharmacies" }] }),
  component: PharmaciesPage,
});

function PharmaciesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const {
    data: pharmacies = [],
    isLoading,
    error,
  } = useQuery<Pharmacy[]>({
    queryKey: ["pharmacies"],
    queryFn: fetchPharmacies,
  });

  if (authLoading) {
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
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/home" })}
            className="-ml-1 flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-bold text-foreground active:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            {t("back")}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-5 pt-5">
        <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs font-extrabold text-secondary">
          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.75} />
          {isLoading ? t("loading") : `${pharmacies.length} ${t("pharmacies_tile")}`}
        </div>

        <header className="mt-3">
          <h1 className="text-2xl font-black text-foreground">{t("find_pharmacy_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("pharmacy_subtitle")}</p>
        </header>

        <div className="mt-5 space-y-3">
          {isLoading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
              <p className="text-sm font-medium">{t("loading")}</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border-2 border-border bg-card p-6 text-center text-muted-foreground">
              <p className="text-sm font-medium text-destructive">Failed to load pharmacies.</p>
            </div>
          ) : pharmacies.length === 0 ? (
            <div className="rounded-2xl border-2 border-border bg-card p-6 text-center text-muted-foreground">
              <p className="text-sm font-medium">No pharmacies found in database.</p>
            </div>
          ) : (
            pharmacies.map((p) => <PharmacyCard key={p.id} pharmacy={p} />)
          )}
        </div>
      </div>

      <SosButton />
      <BottomNav />
    </div>
  );
}

function PharmacyCard({ pharmacy }: { pharmacy: Pharmacy }) {
  const { t } = useTranslation();
  const handleDirections = () => {
    toast.success("Opening directions", { description: pharmacy.name });
    const coords = pharmacy.coordinates;
    if (coords && coords.latitude && coords.longitude) {
      window.open(`https://maps.google.com/?q=${coords.latitude},${coords.longitude}`, "_blank");
    } else {
      window.open(
        `https://maps.google.com/?q=${encodeURIComponent(pharmacy.name + " " + pharmacy.address)}`,
        "_blank",
      );
    }
  };

  const handleCall = () => {
    toast.success("Calling pharmacy", { description: pharmacy.contact });
    window.open(`tel:${pharmacy.contact}`, "_self");
  };

  const handleWhatsApp = () => {
    if (pharmacy.whatsapp_number) {
      toast.success("Opening WhatsApp chat", { description: pharmacy.whatsapp_number });
      window.open(`https://wa.me/${pharmacy.whatsapp_number.replace(/[^0-9]/g, "")}`, "_blank");
    }
  };

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      {/* Premium Discount Ribbon / Badge */}
      {pharmacy.description?.billing_discount_percentage && (
        <div className="-mx-4 -mt-4 mb-4 flex items-center justify-between bg-secondary/10 px-4 py-2 text-xs font-black text-secondary border-b border-secondary/10 rounded-t-2xl">
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <Percent className="h-3.5 w-3.5" />
            Billing Discount
          </span>
          <span className="rounded bg-secondary/20 px-2 py-0.5 text-xs text-secondary-foreground font-black">
            {pharmacy.description.billing_discount_percentage}% OFF
          </span>
        </div>
      )}

      {/* Main Row */}
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
          <PillIcon className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-base font-black leading-snug text-foreground">{pharmacy.name}</h3>
            {pharmacy.isPremium && (
              <span className="rounded bg-secondary/10 px-1.5 py-0.5 text-[10px] font-bold text-secondary uppercase">
                Premium
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-success inline" />
            Verified Partner
          </p>
        </div>
        {pharmacy.google_review_ratings !== undefined && (
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-xs font-black text-success">
            <Star className="h-3.5 w-3.5 fill-current" />
            {pharmacy.google_review_ratings.toFixed(1)}
          </span>
        )}
      </div>

      {/* Contact & Pharmacist details */}
      <div className="mt-4 space-y-2">
        <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="leading-snug">
            {pharmacy.address}{" "}
            {pharmacy.address_details?.pincode && `(Pincode: ${pharmacy.address_details.pincode})`}
          </span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            <span>{pharmacy.contact}</span>
          </p>
          {pharmacy.open_and_close_time && (
            <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <span>{pharmacy.open_and_close_time}</span>
            </p>
          )}
          {pharmacy.email && (
            <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate max-w-[200px]">{pharmacy.email}</span>
            </p>
          )}
        </div>

        {/* Pharmacist Details */}
        {pharmacy.pharmacist_name && (
          <div className="mt-3 rounded-xl bg-muted/30 p-2.5 text-xs text-muted-foreground border border-border/40">
            <span className="font-extrabold text-foreground block">In-Charge Pharmacist:</span>
            <span className="font-bold text-foreground">{pharmacy.pharmacist_name}</span>
            {pharmacy.description?.pharmacist_details && (
              <span>
                {" "}
                ({pharmacy.description.pharmacist_details.qualification} •{" "}
                {pharmacy.description.pharmacist_details.experience_in_years} yrs exp)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Service Badges */}
      {pharmacy.services && (
        <div className="mt-3.5 flex flex-wrap gap-1">
          {pharmacy.services.medical_and_general_store && (
            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
              General Store
            </span>
          )}
          {pharmacy.services.pharmacist_consultation && (
            <span className="rounded bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
              Pharmacist Consultation
            </span>
          )}
          {pharmacy.services.delivery && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Home Delivery
            </span>
          )}
        </div>
      )}

      {/* Delivery terms if home delivery is available */}
      {pharmacy.services?.delivery && pharmacy.description?.delivery_service?.is_available && (
        <p className="mt-2 text-xs font-bold text-success flex items-center gap-1">
          <Check className="h-3.5 w-3.5" />
          <span>
            Delivery Available:{" "}
            <span className="font-black">{pharmacy.description.delivery_service.terms}</span>
          </span>
        </p>
      )}

      {/* Medicine inventory available */}
      {pharmacy.description?.types_of_medicine_available &&
        pharmacy.description.types_of_medicine_available.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">Stocked Types:</span>{" "}
            {pharmacy.description.types_of_medicine_available.join(", ")}
          </div>
        )}

      {/* Medicines Pricing section */}
      {pharmacy.medicines && pharmacy.medicines.length > 0 && (
        <div className="mt-4 border-t border-dashed border-border pt-3">
          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider mb-2">
            {t("medicines_prices")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {pharmacy.medicines.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-2.5 py-1.5"
              >
                <span className="text-xs font-semibold truncate max-w-[100px] text-foreground">
                  {m.name}
                </span>
                <span className="flex items-center gap-1 shrink-0 text-xs font-black text-secondary">
                  {m.inStock ? (
                    <span className="text-success text-[10px] font-bold">₹{m.price}</span>
                  ) : (
                    <span className="text-destructive text-[10px] font-bold flex items-center gap-0.5">
                      <X className="h-3 w-3" /> Out
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleDirections}
          className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-xs font-bold text-secondary-foreground shadow active:scale-[0.99] col-span-1"
        >
          <Navigation className="h-4 w-4 shrink-0" />
          Maps
        </button>
        <button
          type="button"
          onClick={handleCall}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-card py-3 text-xs font-bold text-foreground active:bg-muted col-span-1"
        >
          <Phone className="h-4 w-4 shrink-0" />
          Call
        </button>
        <button
          type="button"
          disabled={!pharmacy.whatsapp_number}
          onClick={handleWhatsApp}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-bold col-span-1 transition-all ${
            pharmacy.whatsapp_number
              ? "border-success/30 bg-success/10 text-success active:scale-[0.99]"
              : "border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
          }`}
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          WhatsApp
        </button>
      </div>
    </div>
  );
}
