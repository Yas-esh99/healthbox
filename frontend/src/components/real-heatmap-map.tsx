import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";

// Gujarat coordinates lookup
const GUJARAT_DISTRICT_COORDS: Record<string, [number, number]> = {
  Ahmedabad: [23.0225, 72.5714],
  Gandhinagar: [23.2156, 72.6369],
  Surat: [21.1702, 72.8311],
  Rajkot: [22.3039, 70.8022],
};

const GUJARAT_FALLBACK_CENTER: [number, number] = [22.2587, 71.1924];

interface HeatmapData {
  name: string;
  value: number;
  topDisease: string;
}

interface RealHeatmapMapProps {
  data: HeatmapData[];
}

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const heatLayerInstance = L.heatLayer(points, {
      radius: 40,
      blur: 25,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.2: "rgba(59, 130, 246, 0.5)", // Tailwind blue-500
        0.4: "rgba(34, 197, 94, 0.7)", // Tailwind green-500
        0.7: "rgba(249, 115, 22, 0.85)", // Tailwind orange-500
        1.0: "rgba(239, 68, 68, 0.95)", // Tailwind red-500
      },
    });

    heatLayerInstance.addTo(map);

    return () => {
      map.removeLayer(heatLayerInstance);
    };
  }, [map, points]);

  return null;
}

export function RealHeatmapMap({ data }: RealHeatmapMapProps) {
  const center = GUJARAT_FALLBACK_CENTER;
  const zoom = 7.5;

  // Prepare heatmap points: [lat, lng, intensity]
  const heatPoints = data.map((d) => {
    const coords = GUJARAT_DISTRICT_COORDS[d.name] || GUJARAT_FALLBACK_CENTER;
    // Normalize intensity based on value.
    const intensity = Math.min(Math.max(d.value / 40, 0.3), 1.0);
    return [coords[0], coords[1], intensity] as [number, number, number];
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
        <HeatLayer points={heatPoints} />
        {data.map((d) => {
          const coords = GUJARAT_DISTRICT_COORDS[d.name] || GUJARAT_FALLBACK_CENTER;
          const isHigh = d.value >= 25;
          const color = isHigh ? "#ef4444" : "#f97316"; // Hex codes to guarantee SVG path renders correctly if CSS parsing is skipped

          return (
            <CircleMarker
              key={d.name}
              center={coords}
              radius={8 + Math.min(d.value / 3, 12)}
              fillColor={color}
              color={color}
              fillOpacity={0.65}
              weight={2}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-extrabold text-sm border-b border-border pb-1 mb-1.5 text-foreground">
                    {d.name} District
                  </h4>
                  <div className="space-y-1 text-xs">
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground font-semibold">Top Disease:</span>
                      <span className="font-bold text-right text-foreground">{d.topDisease}</span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground font-semibold">Cases Count:</span>
                      <span
                        className={`font-black ${isHigh ? "text-destructive" : "text-warning"}`}
                      >
                        {d.value}
                      </span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground font-semibold">Risk Level:</span>
                      <span
                        className={`font-extrabold ${isHigh ? "text-destructive" : "text-warning"}`}
                      >
                        {isHigh ? "High Outbreak" : "Moderate Risk"}
                      </span>
                    </p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
