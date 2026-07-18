import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Hospital as HospitalIcon,
  Star,
  MapPin,
  Phone,
  Navigation,
  BadgeCheck,
  Loader2,
  Mail,
  Stethoscope,
  DollarSign,
  Coffee,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Clock,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { SosButton } from "@/components/sos-button";
import { fetchHospitals, Hospital } from "@/lib/api";
import { useTranslation } from "@/lib/language";

export const Route = createFileRoute("/hospitals")({
  head: () => ({ meta: [{ title: "Nearby Hospitals" }] }),
  component: HospitalsPage,
});

function HospitalsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    data: hospitals = [],
    isLoading,
    error,
  } = useQuery<Hospital[]>({
    queryKey: ["hospitals"],
    queryFn: fetchHospitals,
  });

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
        <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">
          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.75} />
          {isLoading ? t("loading") : `${hospitals.length} ${t("find_hospital")}`}
        </div>

        <header className="mt-3">
          <h1 className="text-2xl font-black text-foreground">{t("find_hospital_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("hospital_subtitle")}</p>
        </header>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-bold text-muted-foreground">Sorted by rating</p>
          <span className="text-xs font-semibold text-muted-foreground">Empanelled List</span>
        </div>

        <div className="mt-3 space-y-3">
          {isLoading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">{t("loading")}</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border-2 border-border bg-card p-6 text-center text-muted-foreground">
              <p className="text-sm font-medium text-destructive">Failed to load hospitals.</p>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="rounded-2xl border-2 border-border bg-card p-6 text-center text-muted-foreground">
              <p className="text-sm font-medium">No hospitals found in database.</p>
            </div>
          ) : (
            hospitals.map((h) => <HospitalCard key={h.id} hospital={h} />)
          )}
        </div>
      </div>

      <SosButton />
      <BottomNav />
    </div>
  );
}

function HospitalCard({ hospital }: { hospital: Hospital }) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const handleDirections = () => {
    toast.success("Opening map directions", { description: hospital.name });
    const link =
      hospital.google_map_direction_link || hospital.address_details?.google_map_direction_link;
    if (link) {
      window.open(link, "_blank");
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

  const handleWhatsApp = () => {
    if (hospital.whatsapp_number) {
      toast.success("Opening WhatsApp chat", { description: hospital.whatsapp_number });
      window.open(`https://wa.me/${hospital.whatsapp_number.replace(/[^0-9]/g, "")}`, "_blank");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
      {/* Hospital Banner Image */}
      {hospital.hospital_image && (
        <div className="relative h-44 w-full bg-muted">
          <img
            src={hospital.hospital_image}
            alt={hospital.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {hospital.type && (
              <span className="rounded-lg bg-black/60 backdrop-blur px-2.5 py-1 text-[11px] font-black text-white uppercase tracking-wider">
                {hospital.type}
              </span>
            )}
            {hospital.years_of_care && (
              <span className="rounded-lg bg-primary backdrop-blur px-2.5 py-1 text-[11px] font-black text-primary-foreground tracking-wider">
                {hospital.years_of_care}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Main Details */}
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <HospitalIcon className="h-6 w-6" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-base font-black leading-snug text-foreground">{hospital.name}</h3>
              {hospital.is_govt && !hospital.hospital_image && (
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
            {hospital.years_of_care && !hospital.hospital_image && (
              <p className="text-[11px] font-bold text-primary mt-0.5">{hospital.years_of_care}</p>
            )}
            <p className="mt-1 text-xs font-semibold text-muted-foreground line-clamp-2">
              Cures: {hospital.all_disease_it_cures.join(", ")}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-xs font-black text-success">
            <Star className="h-3.5 w-3.5 fill-current" />
            {hospital.rating ? hospital.rating.toFixed(1) : "0.0"}
          </span>
        </div>

        {/* Basic Contact Info */}
        <div className="mt-4 space-y-2">
          <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="leading-snug">
              {hospital.address}{" "}
              {hospital.address_details?.pincode &&
                `(Pincode: ${hospital.address_details.pincode})`}
            </span>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {hospital.number && (
              <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{hospital.number}</span>
              </p>
            )}
            {hospital.email && (
              <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate max-w-[200px]">{hospital.email}</span>
              </p>
            )}
          </div>
          {hospital.file_charges_for_primary_checkup !== undefined && (
            <p className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground">
              <DollarSign className="h-4 w-4 shrink-0 text-success" />
              <span>
                OPD Registration Charge:{" "}
                <span className="text-foreground font-black">
                  ₹{hospital.file_charges_for_primary_checkup}
                </span>
              </span>
            </p>
          )}
          <div className="flex gap-4 text-xs font-bold text-muted-foreground pt-2 border-t border-dashed border-border mt-2">
            <span>
              {t("beds_available")}:{" "}
              <span className="text-foreground font-black">{hospital.beds_available || 0}</span>
            </span>
            <span>
              {t("emergency")}:{" "}
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

        {/* Expandable Section */}
        {showDetails && (
          <div className="mt-4 space-y-4 border-t border-dashed border-border pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* About Hospital Facilities */}
            {hospital.about_hospital?.facility && hospital.about_hospital.facility.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-foreground uppercase tracking-wider mb-1.5">
                  <Coffee className="h-3.5 w-3.5 text-primary" />
                  Facilities
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {hospital.about_hospital.facility.map((fac, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Room Quality & Rates */}
            {hospital.about_hospital?.room_quality &&
              hospital.about_hospital.room_quality.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-foreground uppercase tracking-wider mb-2">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Room Quality & Rates (Per Day)
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground">
                          <th className="p-2">Room Type</th>
                          <th className="p-2">Amenities</th>
                          <th className="p-2 text-right">Bed Charges</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hospital.about_hospital.room_quality.map((rm, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-border last:border-0 hover:bg-muted/10"
                          >
                            <td className="p-2 font-bold text-foreground">{rm.room_type}</td>
                            <td className="p-2 text-muted-foreground">
                              {rm.amenities?.join(", ")}
                            </td>
                            <td className="p-2 text-right font-black text-primary">
                              ₹{rm.bed_charges_per_day}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Main Doctors */}
            {((hospital.main_doctors && hospital.main_doctors.length > 0) ||
              (hospital.descriptions?.doctors_details &&
                hospital.descriptions.doctors_details.length > 0)) && (
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-foreground uppercase tracking-wider mb-2">
                  <Stethoscope className="h-3.5 w-3.5 text-primary" />
                  Doctors List
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {hospital.main_doctors?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-2.5"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-foreground">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.qualifications}</p>
                      </div>
                      <span className="rounded bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success font-black">
                        {doc.years_of_experience} yrs exp
                      </span>
                    </div>
                  ))}
                  {hospital.descriptions?.doctors_details?.map((doc, idx) => (
                    <div
                      key={`desc-${idx}`}
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-2.5"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-foreground">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {doc.specialization} • {doc.qualification}
                        </p>
                      </div>
                      <span className="rounded bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success font-black">
                        {doc.experience}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Treatment Costs */}
            {hospital.services?.disease_names && hospital.services.disease_names.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-foreground uppercase tracking-wider mb-2">
                  <DollarSign className="h-3.5 w-3.5 text-success" />
                  Treatment Estimation
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {hospital.services.disease_names.map((dis, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col rounded-xl border border-border bg-muted/20 p-2 text-center"
                    >
                      <span className="text-[10px] font-bold text-muted-foreground truncate">
                        {dis.disease_name}
                      </span>
                      <span className="text-xs font-black text-foreground mt-0.5">
                        ₹{dis.treatment_price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show/Hide Details Button */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="mt-3 flex w-full items-center justify-center gap-1 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-[0.99]"
        >
          {showDetails ? (
            <>
              Hide Details <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              View Medical Services & Rates <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleDirections}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow active:scale-[0.99] col-span-1"
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
            disabled={!hospital.whatsapp_number}
            onClick={handleWhatsApp}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-bold col-span-1 transition-all ${
              hospital.whatsapp_number
                ? "border-success/30 bg-success/10 text-success active:scale-[0.99]"
                : "border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
