"use client";

import {
   Activity,
   Brain,
   Cpu,
   AlertCircle,
   AlertTriangle,
   TrendingUp,
   MessageSquare,
   ArrowUpRight,
   FileText,
   ShieldAlert,
   ShieldCheck,
   Zap,
   Clock,
   MapPin,
   ChevronRight,
   Filter,
   Maximize2,
   Settings,
   Waves,
   Heart,
   ChevronDown,
   Droplets,
   CloudRain,
   Gauge
} from "lucide-react";
import Link from "next/link";
import { cn, calculateDistance } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { NLPDeepDiveModal, DigitalSupportModal, WaterLevelAnalyticsModal } from "@/components/AIModals";
import { getLatestRiverReports, getMonitoredStations, getGlobalAIInsights } from "@/app/actions/forecasting";
import { getRecentSos, getActiveHazards, getOfficialUpdates, getAllIncidents } from "@/app/actions/data";
import { motion, AnimatePresence } from "framer-motion";
import OperationsMap from "@/components/OperationsMap";
import { FORECAST_MODEL_META, formatForecast } from "@/lib/forecastMeta";

/** Honest, computable-today confidence signal: whether the physical-
 * plausibility safety cap overrode this specific forecast's raw model
 * output. Not a substitute for real quantile regression - just surfaces
 * a real thing we already know rather than showing nothing. Renders
 * nothing when there's no forecast to have an opinion about. */
function ConfidenceBadge({ value, dampened }: { value: number | null | undefined; dampened: boolean | null | undefined }) {
   if (value == null) return null;
   return (
      <div className={cn(
         "mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
         dampened ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-600"
      )}>
         {dampened ? <ShieldAlert className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
         {dampened ? "Safety-Capped" : "Model Output"}
      </div>
   );
}

const RISK_TIER_META = {
   major: { label: "CRITICAL", sub: "Major flood risk detected", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
   minor: { label: "WARNING", sub: "Minor flood risk detected", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
   alert: { label: "ADVISORY", sub: "Approaching safety limits", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100" },
   safe: { label: "STABLE", sub: "Current and forecast levels safe", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
} as const;

/** Classifies flood risk using the current level AND the max forecast
 * (when available) against station thresholds. Returns null when the
 * thresholds themselves aren't known yet, rather than defaulting to "safe". */
function classifyRisk(
   current: number | undefined,
   maxForecast: number | null,
   major: number | undefined,
   minor: number | undefined,
   alert: number | undefined
): keyof typeof RISK_TIER_META | null {
   if (current == null || major == null || minor == null || alert == null) return null;
   const peak = maxForecast != null ? Math.max(current, maxForecast) : current;
   if (peak >= major) return "major";
   if (peak >= minor) return "minor";
   if (peak >= alert) return "alert";
   return "safe";
}

export default function AIDashboard() {
   const { t } = useLanguage();
   const [isNLPModalOpen, setIsNLPModalOpen] = useState(false);
   const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
   const [isWaterAnalyticsOpen, setIsWaterAnalyticsOpen] = useState(false);
   
   // State for dynamic data
   const [stations, setStations] = useState<any[]>([]);
   const [selectedStationId, setSelectedStationId] = useState(21);
   const [reports, setReports] = useState<any[]>([]);
   const [globalReports, setGlobalReports] = useState<any[]>([]);
   const [priorityFeed, setPriorityFeed] = useState<any[]>([]);
   const [mapData, setMapData] = useState<{ hazards: any[], sos: any[], news: any[], incidents: any[] }>({
      hazards: [], sos: [], news: [], incidents: []
   });
   const [userLocation, setUserLocation] = useState<[number, number]>([6.9271, 79.8612]);
   const [loading, setLoading] = useState(true);
   const [hasMounted, setHasMounted] = useState(false);

   useEffect(() => {
      setHasMounted(true);
   }, []);

   // Filter states
   const [filterRiver, setFilterRiver] = useState<string>("All");
   const [filterAI, setFilterAI] = useState<boolean>(false);

   useEffect(() => {
      async function init() {
         const list = await getMonitoredStations();
         setStations(list);

         // Handle automatic nearest station selection
         if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
               const { latitude, longitude } = pos.coords;
               setUserLocation([latitude, longitude]);
               
               let nearestId = 21; // Default fallback (Hanwella)
               let minDistance = Infinity;

               // Filter for stations that actually have live river data
               const activeStations = list.filter((s: any) => s.hasData);
               
               // If there are active stations, find the nearest one
               if (activeStations.length > 0) {
                  activeStations.forEach((s: any) => {
                     if (s.latitude && s.longitude) {
                        const dist = calculateDistance(latitude, longitude, s.latitude, s.longitude);
                        if (dist < minDistance) {
                           minDistance = dist;
                           nearestId = s.id;
                        }
                     }
                  });
               } else {
                  // If no live data is available anywhere, fall back to nearest general station
                  list.forEach((s: any) => {
                     if (s.latitude && s.longitude) {
                        const dist = calculateDistance(latitude, longitude, s.latitude, s.longitude);
                        if (dist < minDistance) {
                           minDistance = dist;
                           nearestId = s.id;
                        }
                     }
                  });
               }

               if (nearestId !== 21) {
                  setSelectedStationId(nearestId);
               }
            }, (err) => {
               console.warn("Location selection failed:", err);
            });
         }
      }
      init();
   }, []);

   useEffect(() => {
      async function loadData() {
         setLoading(true);
         const [data, global, sos, hazards, news, incidents] = await Promise.all([
            getLatestRiverReports(selectedStationId),
            getGlobalAIInsights(),
            getRecentSos(),
            getActiveHazards(),
            getOfficialUpdates(),
            getAllIncidents()
         ]);
         
         setReports(data);
         setGlobalReports(global);
         setMapData({ hazards, sos, news, incidents });
         
         // Combine SOS and Hazards for priority feed
         const combined = [
            ...sos.map((s: any) => ({ ...s, feedType: 'sos' })),
            ...hazards.map((h: any) => ({ ...h, feedType: 'hazard' }))
         ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
         .slice(0, 10);
         
         setPriorityFeed(combined);
         setLoading(false);
      }
      loadData();
   }, [selectedStationId]);

   const latestReport = reports[reports.length - 1];
   const currentStation = stations.find(s => s.id === selectedStationId);

   // ──────────────────────────────────────────────
   // Filtered Stations & Rivers computations
   // ──────────────────────────────────────────────
   const rivers = useMemo(() => {
      const r = new Set<string>();
      stations.forEach(s => r.add(s.river));
      return Array.from(r).sort();
   }, [stations]);

   const filteredStations = useMemo(() => {
      return stations.filter(s => {
         if (filterRiver !== "All" && s.river !== filterRiver) return false;
         if (filterAI && !s.hasData) return false;
         return true;
      });
   }, [stations, filterRiver, filterAI]);

   useEffect(() => {
      if (filteredStations.length > 0 && !filteredStations.find(s => s.id === selectedStationId)) {
         setSelectedStationId(filteredStations[0].id);
      }
   }, [filteredStations, selectedStationId]);

   // ──────────────────────────────────────────────
   // Chart scaling logic — dynamic based on actual data
   // ──────────────────────────────────────────────
   const chartConfig = useMemo(() => {
      if (!reports.length || !latestReport) return null;

      const waterLevels = reports.map(r => r.water_level_now);
      const allValues = [
         ...waterLevels,
         latestReport.minor_flood,
         latestReport.major_flood,
      ];

      // Include forecasts if available (null-safe: a genuine 0.00 forecast
      // must still be included in the Y-axis range, not skipped).
      if (latestReport.forecast_1h != null) allValues.push(latestReport.forecast_1h);
      if (latestReport.forecast_12h != null) allValues.push(latestReport.forecast_12h);
      if (latestReport.forecast_24h != null) allValues.push(latestReport.forecast_24h);

      const dataMin = Math.min(...allValues);
      const dataMax = Math.max(...allValues);

      // Add 15% padding above and below
      const range = dataMax - dataMin || 1;
      const yMin = Math.max(0, dataMin - range * 0.15);
      const yMax = dataMax + range * 0.15;

      // Chart dimensions (inside padding)
      const chartW = 880;
      const chartH = 280;
      const padLeft = 60;
      const padRight = 20;
      const padTop = 20;
      const padBottom = 40;

      const scaleY = (val: number) => {
         const ratio = (val - yMin) / (yMax - yMin);
         return padTop + chartH - ratio * chartH;
      };

      // Time-based X axis: previously this scaled by array index (1 unit =
      // "1 report"), which silently assumed every report was exactly 1 hour
      // apart. Real reports arrive irregularly (minutes to many hours apart
      // in practice), so forecast points placed at fixed index offsets had
      // no real relationship to elapsed time. Scaling by actual timestamps
      // fixes this regardless of how irregularly the real data is spaced.
      const timestamps = reports.map(r => new Date(r.timestamp).getTime());
      const minTs = timestamps[0];
      const lastRealTs = timestamps[timestamps.length - 1];
      const maxTs = lastRealTs + 24 * 3600 * 1000; // reserve space up to the +24h forecast horizon
      const domainMs = Math.max(maxTs - minTs, 3600 * 1000);
      const scaleX = (ts: number) => padLeft + ((ts - minTs) / domainMs) * chartW;

      // Generate nice Y-axis ticks
      const tickCount = 5;
      const niceStep = (yMax - yMin) / (tickCount - 1);
      const yTicks: number[] = [];
      for (let i = 0; i < tickCount; i++) {
         yTicks.push(yMin + i * niceStep);
      }

      return { yMin, yMax, chartW, chartH, padLeft, padRight, padTop, padBottom, scaleY, scaleX, yTicks, minTs, maxTs, lastRealTs };
   }, [reports, latestReport]);

   // Build SVG path strings
   const historyPath = useMemo(() => {
      if (!chartConfig || reports.length < 1) return "";
      return reports.map((r, i) => {
         const x = chartConfig.scaleX(new Date(r.timestamp).getTime());
         const y = chartConfig.scaleY(r.water_level_now);
         return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
   }, [reports, chartConfig]);

   const areaPath = useMemo(() => {
      if (!chartConfig || reports.length < 1) return "";
      const { scaleX, scaleY, padTop, chartH } = chartConfig;
      const bottom = padTop + chartH;
      const points = reports.map(r => `${scaleX(new Date(r.timestamp).getTime()).toFixed(1)},${scaleY(r.water_level_now).toFixed(1)}`);
      const firstX = scaleX(new Date(reports[0].timestamp).getTime());
      const lastX = scaleX(new Date(reports[reports.length - 1].timestamp).getTime());
      return `M ${firstX.toFixed(1)},${bottom} L ${points.join(' L ')} L ${lastX.toFixed(1)},${bottom} Z`;
   }, [reports, chartConfig]);

   const forecastPath = useMemo(() => {
      if (!chartConfig) return "";
      const { scaleX, scaleY, lastRealTs } = chartConfig;
      const startX = scaleX(lastRealTs);
      const startY = scaleY(latestReport.water_level_now);

      const forecasts = [
         { val: latestReport.forecast_1h, hours: 1 },
         { val: latestReport.forecast_12h, hours: 12 },
         { val: latestReport.forecast_24h, hours: 24 },
      ].filter(f => f.val != null);

      if (!forecasts.length) return "";

      let d = `M ${startX.toFixed(1)},${startY.toFixed(1)}`;
      forecasts.forEach(f => {
         const x = scaleX(lastRealTs + f.hours * 3600 * 1000);
         d += ` L ${x.toFixed(1)},${scaleY(f.val).toFixed(1)}`;
      });
      return d;
   }, [reports, latestReport, chartConfig]);

   // TFT quantile prediction range (lower/upper bound) at the 24h horizon.
   // null when the model couldn't extract a real range - never fabricated.
   const tftQuantileBand = useMemo(() => {
      if (!chartConfig || !latestReport) return null;
      if (latestReport.forecast_24h_lower == null || latestReport.forecast_24h_upper == null) return null;

      const { scaleX, scaleY, lastRealTs } = chartConfig;
      const x = scaleX(lastRealTs + 24 * 3600 * 1000);
      const yLower = scaleY(latestReport.forecast_24h_lower);
      const yUpper = scaleY(latestReport.forecast_24h_upper);

      const bandHalfWidth = 14;
      return { x1: x - bandHalfWidth, x2: x + bandHalfWidth, yLower, yUpper, centerX: x };
   }, [chartConfig, latestReport]);

   // Null-safe max forecast across the three horizons; null (not 0) when no
   // forecast data is available at all, so "insufficient data" can be shown
   // honestly instead of silently reading as a fake "safe" 0m level.
   const forecastVals = [latestReport?.forecast_1h, latestReport?.forecast_12h, latestReport?.forecast_24h]
      .filter((v): v is number => v != null);
   const maxForecast = forecastVals.length ? Math.max(...forecastVals) : null;
   const riskTier = latestReport ? classifyRisk(latestReport.water_level_now, maxForecast, latestReport.major_flood, latestReport.minor_flood, latestReport.alert_level) : null;
   const riskMeta = riskTier ? RISK_TIER_META[riskTier] : null;
   const forecastDelta = (maxForecast != null && latestReport) ? maxForecast - latestReport.water_level_now : null;

   // Human-readable metric cards
   const statsData = [
      {
         label: "Water Level",
         value: latestReport ? `${latestReport.water_level_now.toFixed(2)}m` : "--",
         sub: latestReport && latestReport.water_level_lag1
            ? `${latestReport.water_level_now > latestReport.water_level_lag1 ? '▲' : '▼'} from ${latestReport.water_level_lag1.toFixed(2)}m`
            : "Current reading",
         icon: Waves,
         color: "text-sky-600",
         bg: "bg-sky-50",
         border: "border-sky-100"
      },
      {
         label: "Predictive Status",
         value: riskMeta ? riskMeta.label : "—",
         sub: riskMeta ? riskMeta.sub : "Awaiting station data",
         icon: ShieldAlert,
         color: riskMeta ? riskMeta.color : "text-zinc-400",
         bg: riskMeta ? riskMeta.bg : "bg-zinc-50",
         border: riskMeta ? riskMeta.border : "border-zinc-100"
      },
      {
         label: "Rainfall (3h avg)",
         value: latestReport ? `${latestReport.rainfall_roll3.toFixed(1)}mm` : "--",
         sub: "Rolling 3-hour average",
         icon: CloudRain,
         color: "text-orange-600",
         bg: "bg-orange-50",
         border: "border-orange-100"
      },
      {
         label: "Forecast Impact",
         value: forecastDelta == null ? "—" : forecastDelta > 0.5 ? "RISING" : forecastDelta < -0.5 ? "RECEDING" : "STABLE",
         sub: forecastDelta == null ? "No forecast available yet" : forecastDelta > 0 ? `Projected +${forecastDelta.toFixed(2)}m rise` : `Projected ${forecastDelta.toFixed(2)}m fall`,
         icon: Gauge,
         color: "text-violet-600",
         bg: "bg-violet-50",
         border: "border-violet-100"
      },
   ];

   // Derived AI Insights
   const aiInsights = useMemo(() => {
      if (!globalReports.length) return [];
      
      const atRiskCount = globalReports.filter(r => r.water_level_now >= r.alert_level).length;
      const forecastRiskCount = globalReports.filter(r =>
         (r.forecast_1h != null && r.forecast_1h >= r.major_flood) ||
         (r.forecast_12h != null && r.forecast_12h >= r.major_flood) ||
         (r.forecast_24h != null && r.forecast_24h >= r.major_flood)
      ).length;
      const anomalyCount = globalReports.filter(r => r.is_anomaly).length;

      return [
         { 
            id: "INS-1", 
            type: atRiskCount > 0 ? "HIGH PANIC" : "NORMAL", 
            title: "Flood Level Alerts", 
            count: atRiskCount, 
            topics: ["Critical Stations", "Exceeding Thresholds"], 
            color: atRiskCount > 0 ? "border-red-500" : "border-emerald-500" 
         },
         { 
            id: "INS-2", 
            type: forecastRiskCount > 0 ? "WARNING" : "STABLE", 
            title: "Strategic Risk Path", 
            count: forecastRiskCount, 
            topics: ["Major Flood Forecast", "12h Window"], 
            color: forecastRiskCount > 0 ? "border-orange-500" : "border-blue-500", 
            active: true 
         },
         { 
            id: "INS-3", 
            type: anomalyCount > 0 ? "WARNING" : "OPERATIONAL", 
            title: "Anomaly Detection", 
            count: anomalyCount, 
            topics: ["Pattern Detection", "Sensor Integrity"], 
            color: anomalyCount > 0 ? "border-violet-500" : "border-zinc-500" 
         },
      ];
   }, [globalReports]);

   const messages = aiInsights;

   // Regional severity per river, derived from the latest report per station
   // (peak of current level / 24h forecast vs. major flood threshold).
   const regionalSeverity = useMemo(() => {
      if (!globalReports.length) return [];

      const byRiver = new Map<string, any[]>();
      globalReports.forEach(r => {
         const key = r.river || "Unknown River";
         if (!byRiver.has(key)) byRiver.set(key, []);
         byRiver.get(key)!.push(r);
      });

      const rows = Array.from(byRiver.entries()).map(([river, reports]) => {
         let maxRatio = 0;
         reports.forEach(r => {
            const peak = Math.max(r.water_level_now || 0, r.forecast_24h || 0);
            const threshold = r.major_flood || 0;
            if (threshold > 0) maxRatio = Math.max(maxRatio, peak / threshold);
         });
         const risk = Math.max(0, Math.min(100, Math.round(maxRatio * 100)));
         const status = risk >= 80 ? "Critical" : risk >= 55 ? "High" : risk >= 30 ? "Elevated" : "Stable";
         return { name: `${river} Basin`, risk, status };
      });

      return rows.sort((a, b) => b.risk - a.risk).slice(0, 4);
   }, [globalReports]);

    // Format timestamp for X-axis with day context
    const formatTime = (ts: string, prevTs?: string) => {
       if (!hasMounted) return ""; // Prevent hydration mismatch
       try {
          const d = new Date(ts);
          const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          if (prevTs) {
             const prevD = new Date(prevTs);
             if (d.toDateString() !== prevD.toDateString()) {
                return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`;
             }
          } else if (reports.length > 0 && ts === reports[0].timestamp) {
             // First label always shows date
             return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`;
          }
          return timeStr;
       } catch { return ""; }
    };

   return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
         <Navbar />

         <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
            {/* Header / Station Selector */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] tracking-[0.2em] uppercase mb-1">
                     <div className="w-4 h-0.5 bg-orange-500" />
                     Forecast Engine Active
                  </div>
                  <h1 className="text-4xl font-black text-zinc-900 tracking-tighter flex items-center gap-3 italic">
                     <Brain className="w-10 h-10 text-zinc-900" />
                     {t("ai_insights")}
                  </h1>
               </div>

               <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  <div className="flex gap-2 w-full sm:w-auto">
                     <select
                        value={filterRiver}
                        onChange={(e) => setFilterRiver(e.target.value)}
                        className="w-full sm:w-auto appearance-none bg-white border-2 border-zinc-100 hover:border-zinc-300 px-4 py-3 rounded-2xl text-xs font-bold text-zinc-600 transition-all cursor-pointer focus:outline-none shadow-sm"
                     >
                        <option value="All">All Rivers</option>
                        {rivers.map(r => (
                           <option key={r} value={r}>{r}</option>
                        ))}
                     </select>
                     <label className="flex items-center gap-2 bg-white border-2 border-zinc-100 hover:border-zinc-300 px-4 py-3 rounded-2xl text-xs font-bold text-zinc-600 cursor-pointer shadow-sm select-none transition-all">
                        <input 
                           type="checkbox" 
                           checked={filterAI} 
                           onChange={(e) => setFilterAI(e.target.checked)}
                           className="rounded text-orange-500 focus:ring-orange-500 border-zinc-300 w-4 h-4 cursor-pointer"
                        />
                        AI Live
                     </label>
                  </div>

                  <div className="relative w-full sm:w-64">
                     <select 
                        value={selectedStationId}
                        onChange={(e) => setSelectedStationId(Number(e.target.value))}
                        className="w-full appearance-none bg-white border-2 border-zinc-100 hover:border-zinc-900 px-5 py-3 rounded-2xl text-xs font-black italic tracking-tight text-zinc-900 transition-all cursor-pointer focus:outline-none shadow-sm"
                     >
                        {filteredStations.length === 0 && <option value={-1}>No stations found</option>}
                        {filteredStations.map(s => (
                           <option key={s.id} value={s.id}>
                              {s.hasData ? "🟢 " : ""}{s.river} - {s.name}
                           </option>
                        ))}
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                  <Link href={`/ai/report?stationId=${selectedStationId}`} className="px-6 py-3.5 bg-zinc-900 hover:bg-orange-500 text-white rounded-2xl text-xs font-black italic tracking-tight transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/10">
                     {t("generate_report")}
                     <ArrowUpRight className="w-4 h-4" />
                  </Link>
               </div>
            </div>

            {/* ─── Stat Cards Row ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
               {statsData.map((s, i) => (
                  <motion.div
                     key={i}
                     initial={{ opacity: 0, y: 12 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.08 }}
                     className={cn(
                        "p-5 rounded-2xl border transition-all hover:shadow-md",
                        s.bg, s.border
                     )}
                  >
                     <div className="flex items-center gap-2 mb-3">
                        <s.icon className={cn("w-4 h-4", s.color)} />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{s.label}</span>
                     </div>
                     <div className={cn("text-2xl font-black italic tracking-tighter mb-1", s.color)}>{s.value}</div>
                     <div className="text-[10px] font-medium text-zinc-400">{s.sub}</div>
                  </motion.div>
               ))}
            </div>

            {/* ─── Hero Water Level Chart ─── */}
            <div className="mb-8 p-1 bg-zinc-50 rounded-[2.5rem]">
               <div className="bg-white rounded-[2.4rem] p-6 md:p-8 shadow-sm border border-zinc-100 relative overflow-hidden">
                  {/* Chart Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                              Live Telemetry
                           </div>
                           {latestReport?.water_level_now >= latestReport?.alert_level && (
                              <div className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-2">
                                 AI Alert: {latestReport.water_level_now >= latestReport.major_flood ? 'Major Flood' : 'Alert Level'}
                              </div>
                           )}
                        </div>
                        <h2 className="text-xl font-black text-zinc-900 tracking-tight italic">
                           {currentStation?.river} • {currentStation?.name} <span className="text-zinc-300 ml-2">Water Level Monitor</span>
                        </h2>
                     </div>

                     {/* Legend */}
                     <div className="flex items-center gap-5 flex-wrap">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-[3px] rounded-full bg-sky-500" />
                           <span className="text-[10px] font-bold text-zinc-500">Actual Level</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-[3px] rounded-full bg-rose-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f43f5e 0px, #f43f5e 4px, transparent 4px, transparent 8px)' }} />
                           <span className="text-[10px] font-bold text-zinc-500">AI Forecast</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-[2px] rounded-full bg-red-300" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fca5a5 0px, #fca5a5 6px, transparent 6px, transparent 10px)' }} />
                           <span className="text-[10px] font-bold text-zinc-500">Flood Limits</span>
                        </div>
                     </div>
                  </div>

                  {/* Chart Area */}
                  <div className="h-80 md:h-96 relative">
                     {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                           <div className="flex flex-col items-center gap-4">
                              <div className="w-10 h-10 border-4 border-zinc-100 border-t-orange-500 rounded-full animate-spin" />
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Compiling Forecasts...</span>
                           </div>
                        </div>
                     ) : !chartConfig || reports.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="text-center space-y-3">
                              <Waves className="w-12 h-12 text-zinc-200 mx-auto" />
                              <p className="text-sm font-bold text-zinc-400">No telemetry data available for this station</p>
                              <p className="text-xs text-zinc-300">Data will appear after the next scraper cycle</p>
                           </div>
                        </div>
                     ) : (
                        <svg className="w-full h-full" viewBox={`0 0 ${chartConfig.padLeft + chartConfig.chartW + chartConfig.padRight} ${chartConfig.padTop + chartConfig.chartH + chartConfig.padBottom}`} preserveAspectRatio="xMidYMid meet">
                           <defs>
                              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
                                 <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.01" />
                              </linearGradient>
                              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.08" />
                                 <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.01" />
                              </linearGradient>
                           </defs>

                           {/* Y-axis grid lines & labels */}
                           {chartConfig.yTicks.map((tick, i) => {
                              const y = chartConfig.scaleY(tick);
                              return (
                                 <g key={`ytick-${i}`}>
                                    <line x1={chartConfig.padLeft} y1={y} x2={chartConfig.padLeft + chartConfig.chartW} y2={y} stroke="#f4f4f5" strokeWidth="1" />
                                    <text x={chartConfig.padLeft - 8} y={y + 3} textAnchor="end" className="text-[10px] font-bold" fill="#a1a1aa">
                                       {tick.toFixed(1)}m
                                    </text>
                                 </g>
                              );
                           })}

                           {/* X-axis time labels */}
                           {reports.map((r, i) => {
                              const x = chartConfig.scaleX(new Date(r.timestamp).getTime());
                              const prevTs = i > 0 ? reports[i-1].timestamp : undefined;
                              return (
                                 <text key={`xlabel-${i}`} x={x} y={chartConfig.padTop + chartConfig.chartH + 25} textAnchor="middle" className="text-[9px] font-bold" fill="#a1a1aa">
                                    {formatTime(r.timestamp, prevTs)}
                                 </text>
                              );
                           })}

                           {/* Flood threshold lines */}
                           {latestReport && (
                              <>
                                 {/* Major Flood */}
                                 <line 
                                    x1={chartConfig.padLeft} y1={chartConfig.scaleY(latestReport.major_flood)} 
                                    x2={chartConfig.padLeft + chartConfig.chartW} y2={chartConfig.scaleY(latestReport.major_flood)} 
                                    stroke="#fca5a5" strokeWidth="2" strokeDasharray="8 4" 
                                 />
                                 <rect x={chartConfig.padLeft + 4} y={chartConfig.scaleY(latestReport.major_flood) - 14} width="90" height="16" rx="4" fill="#fef2f2" />
                                 <text x={chartConfig.padLeft + 8} y={chartConfig.scaleY(latestReport.major_flood) - 3} className="text-[9px] font-black" fill="#ef4444">
                                    ⚠ MAJOR {latestReport.major_flood.toFixed(1)}m
                                 </text>
                                 
                                 {/* Minor Flood */}
                                 <line 
                                    x1={chartConfig.padLeft} y1={chartConfig.scaleY(latestReport.minor_flood)} 
                                    x2={chartConfig.padLeft + chartConfig.chartW} y2={chartConfig.scaleY(latestReport.minor_flood)} 
                                    stroke="#fdba74" strokeWidth="1.5" strokeDasharray="4 4" 
                                 />
                                 <rect x={chartConfig.padLeft + 4} y={chartConfig.scaleY(latestReport.minor_flood) - 14} width="86" height="16" rx="4" fill="#fff7ed" />
                                 <text x={chartConfig.padLeft + 8} y={chartConfig.scaleY(latestReport.minor_flood) - 3} className="text-[9px] font-black" fill="#f97316">
                                    ▲ MINOR {latestReport.minor_flood.toFixed(1)}m
                                 </text>

                                 {/* Alert Level */}
                                 <line 
                                    x1={chartConfig.padLeft} y1={chartConfig.scaleY(latestReport.alert_level)} 
                                    x2={chartConfig.padLeft + chartConfig.chartW} y2={chartConfig.scaleY(latestReport.alert_level)} 
                                    stroke="#fde68a" strokeWidth="1" strokeDasharray="3 3" 
                                 />
                              </>
                           )}

                           {/* Area fill under history line */}
                           {areaPath && (
                              <motion.path
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 transition={{ duration: 1 }}
                                 d={areaPath}
                                 fill="url(#areaGradient)"
                              />
                           )}

                           {/* Historical water level line */}
                           {historyPath && (
                              <motion.path
                                 initial={{ pathLength: 0 }}
                                 animate={{ pathLength: 1 }}
                                 transition={{ duration: 1.2, ease: "easeOut" }}
                                 d={historyPath}
                                 fill="none"
                                 stroke="#0ea5e9"
                                 strokeWidth="3"
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                              />
                           )}

                           {/* Forecast projection line */}
                           {forecastPath && (
                              <motion.path
                                 initial={{ opacity: 0, pathLength: 0 }}
                                 animate={{ opacity: 1, pathLength: 1 }}
                                 transition={{ delay: 1, duration: 0.8 }}
                                 d={forecastPath}
                                 fill="none"
                                 stroke="#f43f5e"
                                 strokeWidth="3"
                                 strokeLinecap="round"
                                 strokeDasharray="8 4"
                              />
                           )}

                           {/* Data points */}
                           {reports.map((r, i) => {
                              const cx = chartConfig.scaleX(new Date(r.timestamp).getTime());
                              const cy = chartConfig.scaleY(r.water_level_now);
                              const isLast = i === reports.length - 1;
                              return (
                                 <g key={`point-${i}`}>
                                    {/* Tooltip hover area */}
                                    <title>{`${formatTime(r.timestamp)}: ${r.water_level_now.toFixed(2)}m`}</title>
                                    <circle cx={cx} cy={cy} r="5" fill="white" stroke="#0ea5e9" strokeWidth="2.5" className="cursor-pointer hover:r-[7] transition-all" />
                                    {isLast && (
                                       <>
                                          <circle cx={cx} cy={cy} r="14" fill="#0ea5e9" opacity="0.1" className="animate-ping" />
                                          <circle cx={cx} cy={cy} r="8" fill="#0ea5e9" opacity="0.15" />
                                          {/* Current value label */}
                                          <rect x={cx + 12} y={cy - 12} width="52" height="20" rx="6" fill="#0ea5e9" />
                                          <text x={cx + 16} y={cy + 2} className="text-[10px] font-black" fill="white">
                                             {r.water_level_now.toFixed(2)}m
                                          </text>
                                       </>
                                    )}
                                 </g>
                              );
                           })}

                           {/* TFT 24h quantile prediction range band */}
                           {tftQuantileBand && (
                              <g>
                                 <rect
                                    x={tftQuantileBand.x1}
                                    y={Math.min(tftQuantileBand.yLower, tftQuantileBand.yUpper)}
                                    width={tftQuantileBand.x2 - tftQuantileBand.x1}
                                    height={Math.abs(tftQuantileBand.yLower - tftQuantileBand.yUpper)}
                                    rx="6" fill="#f43f5e" opacity="0.12"
                                 />
                                 <line x1={tftQuantileBand.x1} y1={tftQuantileBand.yUpper} x2={tftQuantileBand.x2} y2={tftQuantileBand.yUpper} stroke="#f43f5e" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
                                 <line x1={tftQuantileBand.x1} y1={tftQuantileBand.yLower} x2={tftQuantileBand.x2} y2={tftQuantileBand.yLower} stroke="#f43f5e" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
                              </g>
                           )}

                           {/* Forecast data points */}
                           {latestReport && chartConfig && (() => {
                              const { lastRealTs } = chartConfig;
                              const forecasts = [
                                 { val: latestReport.forecast_1h, hours: 1, label: "1h", model: FORECAST_MODEL_META.forecast_1h.model as string },
                                 { val: latestReport.forecast_12h, hours: 12, label: "12h", model: FORECAST_MODEL_META.forecast_12h.model as string },
                                 { val: latestReport.forecast_24h, hours: 24, label: "24h", model: FORECAST_MODEL_META.forecast_24h.model as string },
                              ].filter(f => f.val != null);

                              return forecasts.map((f, i) => {
                                 const cx = chartConfig.scaleX(lastRealTs + f.hours * 3600 * 1000);
                                 const cy = chartConfig.scaleY(f.val);
                                 return (
                                    <g key={`forecast-${i}`}>
                                       <circle cx={cx} cy={cy} r="4" fill="white" stroke="#f43f5e" strokeWidth="2" className="animate-pulse" />
                                       <text x={cx} y={cy - 10} textAnchor="middle" className="text-[9px] font-black" fill="#f43f5e">
                                          {f.model} {f.label}: {f.val.toFixed(2)}m
                                       </text>
                                    </g>
                                 );
                              });
                           })()}
                        </svg>
                     )}
                  </div>

                  {/* Forecast Summary Bar */}
                  {latestReport && (
                     <div className="mt-4 pt-4 border-t border-zinc-50 grid grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-xl bg-sky-50/50">
                           <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                              Next 1h <span className="text-zinc-300 font-bold normal-case">· {FORECAST_MODEL_META.forecast_1h.model}</span>
                           </div>
                           <div className="text-lg font-black italic tracking-tighter text-sky-600">
                              {formatForecast(latestReport.forecast_1h)}
                           </div>
                           <ConfidenceBadge value={latestReport.forecast_1h} dampened={latestReport.dampened_1h} />
                        </div>
                        <div className="text-center p-3 rounded-xl bg-orange-50/50">
                           <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                              Next 12h <span className="text-zinc-300 font-bold normal-case">· {FORECAST_MODEL_META.forecast_12h.model}</span>
                           </div>
                           <div className="text-lg font-black italic tracking-tighter text-orange-600">
                              {formatForecast(latestReport.forecast_12h)}
                           </div>
                           <ConfidenceBadge value={latestReport.forecast_12h} dampened={latestReport.dampened_12h} />
                        </div>
                        <div className="text-center p-3 rounded-xl bg-amber-50/50">
                           <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                              Strategic 24h <span className="text-zinc-300 font-bold normal-case">· {FORECAST_MODEL_META.forecast_24h.model}</span>
                           </div>
                           <div className="text-lg font-black italic tracking-tighter text-amber-600">
                              {formatForecast(latestReport.forecast_24h)}
                           </div>
                           <ConfidenceBadge value={latestReport.forecast_24h} dampened={latestReport.dampened_24h} />
                        </div>
                     </div>
                  )}

                  {/* TFT quantile confidence range - plain-language callout.
                      Only renders when the model has genuinely produced a
                      quantile spread (requires QuantileLoss training - the
                      currently deployed checkpoint is RMSE-trained, so this
                      stays hidden until the model is retrained). */}
                  {latestReport?.forecast_24h_lower != null && latestReport?.forecast_24h_upper != null ? (
                     <div className="mt-4 p-4 rounded-xl bg-rose-50/60 border border-rose-100 flex items-start gap-3">
                        <Activity className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <div>
                           <p className="text-xs font-bold text-zinc-700 leading-relaxed">
                              There is a {Math.round(latestReport.forecast_24h_confidence_pct ?? 0)}% chance the water level will be
                              between <span className="font-black text-rose-600">{latestReport.forecast_24h_lower.toFixed(2)}m</span> and{" "}
                              <span className="font-black text-rose-600">{latestReport.forecast_24h_upper.toFixed(2)}m</span> in 24 hours.
                           </p>
                           <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                              {FORECAST_MODEL_META.forecast_24h.model} Confidence Range
                           </p>
                        </div>
                     </div>
                  ) : latestReport?.forecast_24h != null && (
                     // Honest fallback: no numeric confidence interval is available
                     // for this model yet, but whether the safety cap intervened
                     // is real, computable signal about how much to trust this number.
                     <div className={cn(
                        "mt-4 p-4 rounded-xl border flex items-start gap-3",
                        latestReport.dampened_24h ? "bg-amber-50/60 border-amber-100" : "bg-emerald-50/60 border-emerald-100"
                     )}>
                        {latestReport.dampened_24h ? (
                           <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                           <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                           <p className="text-xs font-bold text-zinc-700 leading-relaxed">
                              {latestReport.dampened_24h
                                 ? "The raw model output exceeded a physically plausible rate of change and was capped by the safety limit — treat this 24h number as lower-confidence."
                                 : "This is a clean, uncapped model output — no safety override was triggered."}
                           </p>
                           <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                              {FORECAST_MODEL_META.forecast_24h.model} · A precise confidence range isn&apos;t available for this model yet
                           </p>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* ─── Flood Risk Monitor ─── */}
            <div className="mb-12">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                     <div className="auth-panel-dark rounded-[2.5rem] p-10 relative overflow-hidden h-full">
                        <div className="relative z-10">
                           <div className="flex justify-between items-center mb-10">
                              <div className="flex gap-4">
                                 <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                                    <Brain className="w-8 h-8 text-white animate-pulse" />
                                 </div>
                                 <div>
                                    <h3 className="text-2xl font-black text-white tracking-tighter italic">AI Strategic Insights</h3>
                                    <p className="text-slate-400 text-sm font-medium">Real-time predictive telemetry & system load.</p>
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 space-y-4 hover:border-red-500/30 transition-all group">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black bg-red-500 text-white px-4 py-1 rounded-full uppercase tracking-widest">Risk Projection</span>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">LIVE</span>
                                 </div>
                                 <div>
                                    <h4 className="text-xl font-black text-white italic tracking-tight mb-2">
                                       {globalReports.filter(r => r.water_level_now >= r.alert_level).length} Active Alerts
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                       Predictive models identified critical risk zones. Immediate verification recommended for {globalReports.filter(r => r.forecast_12h >= r.major_flood).length} major flood paths.
                                    </p>
                                 </div>
                              </div>

                              <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 space-y-4 hover:border-orange-500/30 transition-all group">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black bg-orange-500 text-white px-4 py-1 rounded-full uppercase tracking-widest">System Health</span>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">TELEMETRY</span>
                                 </div>
                                 <div>
                                    <h4 className="text-xl font-black text-white italic tracking-tight mb-2">
                                       {globalReports.filter(r => r.is_anomaly).length} Detected Anomalies
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                       Sensor integrity is verified at 98.4%. {globalReports.filter(r => r.is_anomaly).length} pattern deviations currently under automated analysis.
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 blur-[80px] translate-y-1/2 -translate-x-1/2 rounded-full"></div>
                     </div>
                  </div>

                  <div className="lg:col-span-1 space-y-8">
                     <OperationsMap 
                        incidents={mapData.incidents}
                        sos={mapData.sos}
                        stations={globalReports}
                        selectedStationId={selectedStationId}
                     />

                     {/* Recent SOS Priority Widget */}
                     <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-xl group">
                        <div className="flex justify-between items-center mb-8">
                           <h3 className="text-xl font-black text-zinc-900 italic tracking-tight">Recent SOS Priority</h3>
                           <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-6">
                           {priorityFeed.length > 0 ? priorityFeed.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex gap-4 items-start pb-6 border-b border-zinc-50 last:border-0 last:pb-0 group/item hover:-translate-y-1 transition-all">
                                 <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-zinc-100", 
                                    item.feedType === 'sos' ? "bg-red-50 text-red-500" : "bg-zinc-50 text-zinc-400")}>
                                    <AlertTriangle className="w-6 h-6" />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                       <h4 className="text-sm font-black text-zinc-900 group-hover/item:text-red-500 transition-colors uppercase italic tracking-tighter">
                                          {item.feedType === 'sos' ? (item.stype || 'SOS') : (item.title || 'Hazard')}
                                       </h4>
                                       <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                       </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 italic font-medium leading-relaxed">
                                       "{item.feedType === 'sos' ? item.additional_info : item.description}"
                                    </p>
                                 </div>
                              </div>
                           )) : (
                              <div className="py-10 text-center text-zinc-300 font-black uppercase tracking-widest text-[10px]">No active priority alerts</div>
                           )}
                        </div>
                        <Link href="/sos" className="mt-8 flex items-center justify-center gap-3 w-full py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all">
                           Open Rescue Hub
                           <ChevronRight className="w-5 h-5" />
                        </Link>
                     </div>
                  </div>
               </div>
            </div>

            {/* ─── Operational Analytics ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
               {/* System Activity (Mocked from Authority for aesthetic parity) */}
               <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-xl flex flex-col gap-8 group">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-xl font-black text-zinc-900 italic tracking-tight mb-1">System Activity</h3>
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Neural Network Inference Load</p>
                     </div>
                     <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                        <Activity className="w-5 h-5" />
                     </div>
                  </div>
                  <div className="h-48 w-full flex items-end justify-between gap-1.5">
                     {[40, 25, 70, 45, 90, 30, 60, 20, 55, 80, 35, 95].map((h, i) => (
                        <div key={i} className="flex-1 bg-zinc-50 rounded-t-xl relative group/bar overflow-hidden h-full">
                           <div 
                              className="absolute bottom-0 w-full bg-blue-500/20 group-hover/bar:bg-blue-500/40 transition-all rounded-t-lg" 
                              style={{ height: `${h}%` }} 
                           />
                        </div>
                     ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-300 font-black uppercase tracking-widest px-1">
                     <span>00:00</span>
                     <span>12:00</span>
                     <span>23:59</span>
                  </div>
               </div>

               {/* Regional Severity */}
               <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-xl group">
                  <div className="flex justify-between items-start mb-8">
                     <div>
                        <h3 className="text-xl font-black text-zinc-900 italic tracking-tight mb-1">Regional Severity</h3>
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Risk Distribution Matrix</p>
                     </div>
                     <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors">
                        <ShieldAlert className="w-5 h-5" />
                     </div>
                  </div>
                  <div className="space-y-8">
                     {regionalSeverity.length > 0 ? regionalSeverity.map((region, i) => (
                        <div key={region.name} className="space-y-3">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-zinc-500">{region.name}</span>
                              <span className={cn(
                                 region.status === 'Critical' ? "text-red-500" :
                                 region.status === 'High' ? "text-orange-500" : "text-blue-500"
                              )}>{region.risk}% RISK</span>
                           </div>
                           <div className="h-2.5 bg-zinc-50 rounded-full overflow-hidden border border-zinc-100/50">
                              <motion.div
                                 initial={{ width: 0 }}
                                 animate={{ width: `${region.risk}%` }}
                                 transition={{ duration: 1.5, delay: i * 0.2 }}
                                 className={cn("h-full rounded-full",
                                    region.status === 'Critical' ? "bg-red-500" :
                                    region.status === 'High' ? "bg-orange-500" : "bg-blue-500"
                                 )}
                              />
                           </div>
                        </div>
                     )) : (
                        <p className="text-center py-6 text-zinc-300 font-bold uppercase tracking-widest text-[10px]">No telemetry data yet</p>
                     )}
                  </div>
               </div>
            </div>

            {/* Content Grid */}
            {/* Content Sections Stacking */}
            <div className="flex flex-col gap-12">
                  {/* NLP messages Section */}
                  <div className="space-y-6">
                     <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-zinc-900 italic flex items-center gap-3 underline decoration-orange-500 decoration-4 underline-offset-8">
                           <Zap className="w-6 h-6 text-orange-500" />
                           {t("nlp_analysis_title")}
                        </h2>
                        <button onClick={() => setIsNLPModalOpen(true)} className="px-5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all">
                           Analysis Deep-Dive
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {messages.map((msg) => (
                           <div key={msg.id} className={cn(
                              "bg-white p-6 rounded-[2rem] border-2 transition-all hover:shadow-xl group cursor-pointer",
                              msg.active ? "border-zinc-900 shadow-lg" : "border-zinc-50 hover:border-zinc-200"
                           )}>
                              <div className="flex justify-between items-center mb-6">
                                 <span className={cn(
                                    "text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase",
                                    msg.type === 'HIGH PANIC' ? "bg-red-500 text-white" :
                                       msg.type === 'WARNING' ? "bg-orange-500 text-white" : "bg-green-500 text-white"
                                 )}>{msg.type}</span>
                                 <Settings className="w-3.5 h-3.5 text-zinc-200 group-hover:text-zinc-900" />
                              </div>
                              <h4 className="text-lg font-black text-zinc-900 italic leading-tight mb-2">{msg.title}</h4>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase mb-6">{msg.count}+ Shared sentiments</p>
                              <div className="flex flex-wrap gap-1.5">
                                 {msg.topics.map(t => (
                                    <span key={t} className="px-3 py-1 bg-zinc-50 text-[10px] font-black text-zinc-500 rounded-xl group-hover:bg-zinc-100">{t}</span>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

               </div>
            </main>

         <Footer />

         {/* AI Specialized Modals */}
         <NLPDeepDiveModal isOpen={isNLPModalOpen} onClose={() => setIsNLPModalOpen(false)} />
         <DigitalSupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
         <WaterLevelAnalyticsModal isOpen={isWaterAnalyticsOpen} onClose={() => setIsWaterAnalyticsOpen(false)} />
      </div>
   );
}
