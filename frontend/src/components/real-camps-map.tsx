import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import { Clock, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface Camp {
  name: string;
  org: string;
  date: string;
  distance: string;
  lat: number;
  lng: number;
}

interface Hospital {
  name: string;
  tier: string;
  specialty: string;
  status: string;
  address: string;
  desk: string;
  lat: number;
  lng: number;
}

interface RealCampsMapProps {
  camps: Camp[];
  hospitals: Hospital[];
}

export function RealCampsMap({ camps, hospitals }: RealCampsMapProps) {
  const center: [number, number] = [23.0225, 72.5714];
  const zoom = 12;

  // Custom DivIcon for Camps (using secondary / green theme)
  const campIcon = L.divIcon({
    className: "custom-camp-icon-wrapper",
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute -inset-2 animate-ping rounded-full bg-secondary/30"></span>
        <div class="relative grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-lg border border-border">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-stethoscope"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

  // Custom DivIcon for Hospitals (using primary / purple theme)
  const hospitalIcon = L.divIcon({
    className: "custom-hospital-icon-wrapper",
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute -inset-2 animate-ping rounded-full bg-primary/30"></span>
        <div class="relative grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg border border-border">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 18H4a2 2 0 0 0-2 2v2h4Z"/><path d="M18 18h2a2 2 0 0 1 2 2v2h-4Z"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

  return (
    <div className="relative h-full w-full">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .leaflet-popup-content-wrapper {
          background: var(--card) !important;
          color: var(--card-foreground) !important;
          border-radius: var(--radius-2xl) !important;
          border: 2px solid var(--border) !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1) !important;
          padding: 4px !important;
        }
        .leaflet-popup-tip {
          background: var(--card) !important;
          border: 2px solid var(--border) !important;
        }
        .leaflet-popup-content {
          margin: 8px 12px !important;
        }
        .leaflet-container {
          background: var(--muted) !important;
          font-family: inherit !important;
        }
        .leaflet-bar {
          border: 2px solid var(--border) !important;
          border-radius: var(--radius-md) !important;
          box-shadow: none !important;
        }
        .leaflet-bar a {
          background-color: var(--card) !important;
          color: var(--foreground) !important;
          border-bottom: 1px solid var(--border) !important;
        }
        .leaflet-bar a:hover {
          background-color: var(--accent) !important;
        }
      `,
        }}
      />
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={true}
        style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Camp Pins */}
        {camps.map((camp) => (
          <Marker key={camp.name} position={[camp.lat, camp.lng]} icon={campIcon}>
            <Popup>
              <div className="w-[200px] text-foreground">
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                  {camp.org}
                </span>
                <h4 className="font-extrabold text-sm text-foreground mt-0.5 leading-snug">
                  {camp.name}
                </h4>
                <div className="mt-2.5 space-y-1 text-xs border-t border-border pt-2 text-muted-foreground">
                  <p className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{camp.date}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{camp.distance}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success("You're registered!", { description: camp.name })}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-secondary py-2 text-xs font-bold text-secondary-foreground shadow active:scale-[0.98] transition cursor-pointer"
                >
                  <Clock className="h-4 w-4" />
                  Register for Free
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hospital Pins */}
        {hospitals.map((hospital) => (
          <Marker key={hospital.name} position={[hospital.lat, hospital.lng]} icon={hospitalIcon}>
            <Popup>
              <div className="w-[220px] text-foreground">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  {hospital.tier}
                </span>
                <h4 className="font-extrabold text-sm text-foreground mt-0.5 leading-snug">
                  {hospital.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 font-semibold leading-tight">
                  {hospital.specialty}
                </p>

                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  <span>Status: Active</span>
                </div>

                <div className="mt-3 space-y-1.5 text-[11px] border-t border-border pt-2 text-muted-foreground">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{hospital.address}</span>
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
