import { useState, useMemo, useEffect } from "react";
import { Map as MapIcon, Loader2, Activity, Stethoscope, MapPin } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { HeatmapDataPoint } from "@/lib/api";

interface DiseaseHeatmapViewProps {
  data: HeatmapDataPoint[];
  loading: boolean;
  initialDisease?: string;
}

// Hotspots representing coordinates for Gujarat districts to render glowing hotspots
const DISTRICT_COORDS: Record<string, { top: string; left: string }> = {
  Ahmedabad: { top: "45%", left: "48%" },
  Gandhinagar: { top: "35%", left: "55%" },
  Surat: { top: "72%", left: "62%" },
  Rajkot: { top: "52%", left: "28%" },
};

export function DiseaseHeatmapView({ data, loading, initialDisease }: DiseaseHeatmapViewProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [selectedDisease, setSelectedDisease] = useState<string>(initialDisease || "All");

  useEffect(() => {
    setSelectedDisease(initialDisease || "All");
  }, [initialDisease]);

  // Get unique districts and diseases for filters
  const districts = useMemo(() => {
    const d = new Set<string>();
    data.forEach((x) => d.add(x.district));
    return ["All", ...Array.from(d)];
  }, [data]);

  const diseases = useMemo(() => {
    const d = new Set<string>();
    data.forEach((x) => d.add(x.disease));
    return ["All", ...Array.from(d)];
  }, [data]);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter((x) => {
      const matchDistrict = selectedDistrict === "All" || x.district === selectedDistrict;
      const matchDisease = selectedDisease === "All" || x.disease === selectedDisease;
      return matchDistrict && matchDisease;
    });
  }, [data, selectedDistrict, selectedDisease]);

  // Aggregated data by district for bar chart
  const districtChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((x) => {
      map[x.district] = (map[x.district] || 0) + x.cases_count;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Aggregated data by disease for ranking list
  const diseaseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((x) => {
      map[x.disease] = (map[x.disease] || 0) + x.cases_count;
    });
    return Object.entries(map)
      .map(([disease, cases]) => ({ disease, cases }))
      .sort((a, b) => b.cases - a.cases);
  }, [filteredData]);

  // Automated health camp placement recommendation suggestions
  const placementRecommendations = useMemo(() => {
    const districtDiseaseCases: Record<string, Record<string, number>> = {};
    filteredData.forEach((x) => {
      if (!districtDiseaseCases[x.district]) districtDiseaseCases[x.district] = {};
      districtDiseaseCases[x.district][x.disease] =
        (districtDiseaseCases[x.district][x.disease] || 0) + x.cases_count;
    });

    const recommendations = [];
    for (const [dist, diseasesMap] of Object.entries(districtDiseaseCases)) {
      const sortedDiseases = Object.entries(diseasesMap).sort((a, b) => b[1] - a[1]);
      if (sortedDiseases.length > 0) {
        const [topDisease, count] = sortedDiseases[0];
        if (count >= 5) {
          let campType = "General Health Checkup";
          let actionLabel = "Schedule Screening Camp";

          const lowerDisease = topDisease.toLowerCase();
          if (
            lowerDisease.includes("diabetes") ||
            lowerDisease.includes("hypertension") ||
            lowerDisease.includes("bp")
          ) {
            campType = "NCD (Diabetes & BP) Screening Camp";
            actionLabel = "Schedule NCD Camp";
          } else if (
            lowerDisease.includes("viral") ||
            lowerDisease.includes("pharyngitis") ||
            lowerDisease.includes("fever")
          ) {
            campType = "Infectious & Viral Disease Camp";
            actionLabel = "Schedule Outbreak Camp";
          } else if (
            lowerDisease.includes("asthma") ||
            lowerDisease.includes("copd") ||
            lowerDisease.includes("respiratory")
          ) {
            campType = "Pulmonology & Asthma Treatment Camp";
            actionLabel = "Schedule Respiratory Camp";
          } else if (
            lowerDisease.includes("dermatitis") ||
            lowerDisease.includes("rash") ||
            lowerDisease.includes("skin")
          ) {
            campType = "Dermatology Specialist Camp";
            actionLabel = "Schedule Skin Care Camp";
          } else if (
            lowerDisease.includes("gastroenteritis") ||
            lowerDisease.includes("water") ||
            lowerDisease.includes("diarrhea")
          ) {
            campType = "Pediatric & Gastroenteritis Awareness Camp";
            actionLabel = "Schedule Sanitation Camp";
          }

          recommendations.push({
            district: dist,
            disease: topDisease,
            cases: count,
            campType,
            actionLabel,
          });
        }
      }
    }
    return recommendations.sort((a, b) => b.cases - a.cases);
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Visual Density Map */}
      <section className="rounded-3xl border-2 border-border bg-card p-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-secondary" /> Dynamic Disease Hotspots Map
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Visualizing active disease clusters based on AI diagnostic results to place new camps.
        </p>

        <div className="relative mt-4 h-[240px] w-full overflow-hidden rounded-2xl border border-border bg-muted/30">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Render real-time active spots */}
          {districtChartData.map((d) => {
            const coords = DISTRICT_COORDS[d.name] || { top: "50%", left: "50%" };
            const isHigh = d.value >= 25;
            const glowColor = isHigh ? "bg-destructive/30" : "bg-warning/30";
            const pointColor = isHigh ? "bg-destructive" : "bg-warning";

            return (
              <div
                key={d.name}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-fade-in"
                style={{ top: coords.top, left: coords.left }}
              >
                <span className={`absolute -inset-4 animate-ping rounded-full ${glowColor}`} />
                <span
                  className={`relative grid h-8 w-8 place-items-center rounded-full text-[10px] font-black text-white shadow-md ${pointColor}`}
                >
                  {d.value}
                </span>
                <span className="mt-1 block rounded bg-card/95 border border-border px-1.5 py-0.5 text-[9px] font-bold text-foreground shadow-sm whitespace-nowrap">
                  {d.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Filters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-background p-3">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Filter District
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-foreground focus:outline-none"
          >
            {districts.map((d) => (
              <option key={d} value={d} className="bg-card text-foreground">
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-border bg-background p-3">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Filter Disease
          </label>
          <select
            value={selectedDisease}
            onChange={(e) => setSelectedDisease(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-foreground focus:outline-none"
          >
            {diseases.map((d) => (
              <option key={d} value={d} className="bg-card text-foreground">
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      {districtChartData.length > 0 && (
        <section className="rounded-3xl border-2 border-border bg-card p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Cases Count by District</h2>
          <div className="h-44 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={districtChartData}
                layout="vertical"
                margin={{ left: -10, right: 10, top: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {districtChartData.map((entry, index) => {
                    const fill =
                      entry.value >= 25 ? "var(--color-destructive)" : "var(--color-primary)";
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Active Disease Breakdown */}
      <section className="rounded-3xl border-2 border-border bg-card p-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" /> Active Disease Clusters
        </h2>
        <div className="mt-3 divide-y divide-border">
          {diseaseBreakdown.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-sm font-semibold text-foreground">{item.disease}</span>
              <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-bold text-secondary">
                {item.cases} cases
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Camp Placement Recommendations */}
      <section className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-5">
        <h2 className="text-base font-black text-primary flex items-center gap-2">
          <Stethoscope className="h-5 w-5" /> AI Health Camp Recommendations
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Optimized locations based on localized patient diagnostic intake data.
        </p>

        <div className="mt-4 space-y-3">
          {placementRecommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No current high-density clusters to recommend camp placement.
            </p>
          ) : (
            placementRecommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {rec.district}
                  </span>
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
                    Cluster size: {rec.cases}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{rec.campType}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Target disease: {rec.disease}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toast.success("Camp request sent to health officers", {
                      description: `${rec.campType} in ${rec.district}`,
                    })
                  }
                  className="w-full rounded-xl bg-secondary py-2 text-xs font-black text-secondary-foreground shadow active:scale-[0.98]"
                >
                  {rec.actionLabel}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
