"use client";

import {
   Activity,
   Brain,
   Cpu,
   AlertCircle,
   TrendingUp,
   MessageSquare,
   ArrowUpRight,
   FileText,
   ShieldAlert,
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
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { NLPDeepDiveModal, DispatchModal, WaterLevelAnalyticsModal } from "@/components/AIModals";
import { getLatestRiverReports, getMonitoredStations } from "@/app/actions/forecasting";
import { motion, AnimatePresence } from "framer-motion";

export default function AIDashboard() {
   const { t } = useLanguage();
   const [isNLPModalOpen, setIsNLPModalOpen] = useState(false);
   const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
   const [isWaterAnalyticsOpen, setIsWaterAnalyticsOpen] = useState(false);
   
   // State for dynamic data
   const [stations, setStations] = useState<any[]>([]);
   const [selectedStationId, setSelectedStationId] = useState(21);
   const [reports, setReports] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function init() {
         const list = await getMonitoredStations();
         setStations(list);
      }
      init();
   }, []);

   useEffect(() => {
      async function loadData() {
         setLoading(true);
         const data = await getLatestRiverReports(selectedStationId);
         setReports(data);
         setLoading(false);
      }
      loadData();
   }, [selectedStationId]);

   const latestReport = reports[reports.length - 1];
   const currentStation = stations.find(s => s.id === selectedStationId);

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

      // Include forecasts if available
      if (latestReport.forecast_1h) allValues.push(latestReport.forecast_1h);
      if (latestReport.forecast_12h) allValues.push(latestReport.forecast_12h);
      if (latestReport.forecast_24h) allValues.push(latestReport.forecast_24h);

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

      const totalPoints = reports.length;
      // Reserve horizontal space for future forecasts (up to +4 offset)
      const forecastReserve = 4.5; 
      const domainX = totalPoints > 1 ? (totalPoints - 1) + forecastReserve : Math.max(1, forecastReserve);
      const xStep = chartW / domainX;
      const scaleX = (i: number) => padLeft + i * xStep;

      // Generate nice Y-axis ticks
      const tickCount = 5;
      const niceStep = (yMax - yMin) / (tickCount - 1);
      const yTicks: number[] = [];
      for (let i = 0; i < tickCount; i++) {
         yTicks.push(yMin + i * niceStep);
      }

      return { yMin, yMax, chartW, chartH, padLeft, padRight, padTop, padBottom, scaleY, scaleX, yTicks, xStep, totalPoints };
   }, [reports, latestReport]);

   // Build SVG path strings
   const historyPath = useMemo(() => {
      if (!chartConfig || reports.length < 1) return "";
      return reports.map((r, i) => {
         const x = chartConfig.scaleX(i);
         const y = chartConfig.scaleY(r.water_level_now);
         return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
   }, [reports, chartConfig]);

   const areaPath = useMemo(() => {
      if (!chartConfig || reports.length < 1) return "";
      const { scaleX, scaleY, padTop, chartH } = chartConfig;
      const bottom = padTop + chartH;
      const points = reports.map((r, i) => `${scaleX(i).toFixed(1)},${scaleY(r.water_level_now).toFixed(1)}`);
      return `M ${scaleX(0).toFixed(1)},${bottom} L ${points.join(' L ')} L ${scaleX(reports.length - 1).toFixed(1)},${bottom} Z`;
   }, [reports, chartConfig]);

   const forecastPath = useMemo(() => {
      if (!chartConfig || !latestReport?.forecast_1h) return "";
      const { scaleX, scaleY } = chartConfig;
      const lastIdx = reports.length - 1;
      const startX = scaleX(lastIdx);
      const startY = scaleY(latestReport.water_level_now);
      
      const forecasts = [
         { val: latestReport.forecast_1h, offset: 1 },
         { val: latestReport.forecast_12h, offset: 2.5 },
         { val: latestReport.forecast_24h, offset: 4 },
      ].filter(f => f.val != null);

      if (!forecasts.length) return "";
      
      let d = `M ${startX.toFixed(1)},${startY.toFixed(1)}`;
      forecasts.forEach(f => {
         d += ` L ${scaleX(lastIdx + f.offset).toFixed(1)},${scaleY(f.val).toFixed(1)}`;
      });
      return d;
   }, [reports, latestReport, chartConfig]);

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
         label: "Alert Status", 
         value: latestReport?.water_level_now >= latestReport?.minor_flood ? "WARNING" : "NORMAL", 
         sub: latestReport?.water_level_now >= latestReport?.major_flood ? "Major flood level exceeded" : latestReport?.water_level_now >= latestReport?.minor_flood ? "Minor flood level reached" : "Below alert threshold",
         icon: ShieldAlert, 
         color: latestReport?.water_level_now >= latestReport?.minor_flood ? "text-red-600" : "text-emerald-600", 
         bg: latestReport?.water_level_now >= latestReport?.minor_flood ? "bg-red-50" : "bg-emerald-50",
         border: latestReport?.water_level_now >= latestReport?.minor_flood ? "border-red-100" : "border-emerald-100"
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
         label: "AI Confidence", 
         value: latestReport?.forecast_1h ? "94%" : "—", 
         sub: latestReport?.forecast_1h ? "Model ensemble active" : "Awaiting forecast data",
         icon: Brain, 
         color: "text-violet-600", 
         bg: "bg-violet-50",
         border: "border-violet-100"
      },
   ];

   const messages = [
      { id: "NLP-992", type: "HIGH PANIC", title: `Reports near ${currentStation?.name || 'Station'}`, count: latestReport?.water_level_now > 5 ? 450 : 22, topics: ["Rising water", "Inundation"], color: "border-red-500" },
      { id: "NLP-841", type: "WARNING", title: "Regional Risk Assessment", count: 128, topics: ["Mud flow", "Drainage block"], color: "border-orange-500", active: true },
      { id: "NLP-772", type: "RECOVERING", title: "Upstream Discharge", count: 210, topics: ["Gate opening", "Flow rate"], color: "border-green-500" },
   ];

   // Format timestamp for X-axis
   const formatTime = (ts: string) => {
      try {
         const d = new Date(ts);
         return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
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
                  <div className="relative w-full sm:w-64">
                     <select 
                        value={selectedStationId}
                        onChange={(e) => setSelectedStationId(Number(e.target.value))}
                        className="w-full appearance-none bg-white border-2 border-zinc-100 hover:border-zinc-900 px-5 py-3 rounded-2xl text-xs font-black italic tracking-tight text-zinc-900 transition-all cursor-pointer focus:outline-none shadow-sm"
                     >
                        {stations.map(s => (
                           <option key={s.id} value={s.id}>{s.river} - {s.name}</option>
                        ))}
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                  <Link href="/ai/report" className="px-6 py-3.5 bg-zinc-900 hover:bg-orange-500 text-white rounded-2xl text-xs font-black italic tracking-tight transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/10">
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
                              const x = chartConfig.scaleX(i);
                              return (
                                 <text key={`xlabel-${i}`} x={x} y={chartConfig.padTop + chartConfig.chartH + 25} textAnchor="middle" className="text-[9px] font-bold" fill="#a1a1aa">
                                    {formatTime(r.timestamp)}
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
                              const cx = chartConfig.scaleX(i);
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

                           {/* Forecast data points */}
                           {latestReport?.forecast_1h && chartConfig && (() => {
                              const lastIdx = reports.length - 1;
                              const forecasts = [
                                 { val: latestReport.forecast_1h, offset: 1, label: "1h" },
                                 { val: latestReport.forecast_12h, offset: 2.5, label: "12h" },
                                 { val: latestReport.forecast_24h, offset: 4, label: "24h" },
                              ].filter(f => f.val != null);

                              return forecasts.map((f, i) => {
                                 const cx = chartConfig.scaleX(lastIdx + f.offset);
                                 const cy = chartConfig.scaleY(f.val);
                                 return (
                                    <g key={`forecast-${i}`}>
                                       <circle cx={cx} cy={cy} r="4" fill="white" stroke="#f43f5e" strokeWidth="2" className="animate-pulse" />
                                       <text x={cx} y={cy - 10} textAnchor="middle" className="text-[9px] font-black" fill="#f43f5e">
                                          {f.label}: {f.val.toFixed(2)}m
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
                           <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Next 1h</div>
                           <div className="text-lg font-black italic tracking-tighter text-sky-600">
                              {latestReport.forecast_1h ? `${latestReport.forecast_1h.toFixed(2)}m` : '—'}
                           </div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-orange-50/50">
                           <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Next 12h</div>
                           <div className="text-lg font-black italic tracking-tighter text-orange-600">
                              {latestReport.forecast_12h ? `${latestReport.forecast_12h.toFixed(2)}m` : '—'}
                           </div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-amber-50/50">
                           <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Strategic 24h</div>
                           <div className="text-lg font-black italic tracking-tighter text-amber-600">
                              {latestReport.forecast_24h ? `${latestReport.forecast_24h.toFixed(2)}m` : '—'}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 flex flex-col gap-8">
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

               {/* Sidebar SOS */}
               <div className="lg:col-span-4">
                  <div className="bg-zinc-900 text-white rounded-[2.5rem] p-8 shadow-2xl h-full border border-white/5 relative overflow-hidden group">
                     {/* Background Glow */}
                     <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/10 blur-[100px] group-hover:bg-red-500/20 transition-all" />
                     
                     <div className="flex items-center justify-between mb-8 relative">
                        <h3 className="font-black italic flex items-center gap-3 tracking-tight text-xl">
                           <Activity className="w-6 h-6 text-red-500 animate-pulse" />
                           Priority Feed
                        </h3>
                     </div>

                     <div className="space-y-6 relative">
                        {[
                           { title: "Rescue Needed: Matara", time: "Just Now", status: "Critical", desc: "Elderly person stranded. Water level 1.2m and rising." },
                           { title: "Bridge Blocked: Kelanimulla", time: "12m ago", status: "High", desc: "Debris causing local backup. Heavy flow predicted." }
                        ].map((sos, i) => (
                           <div key={i} className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group/item">
                              <div className="flex justify-between items-start mb-2">
                                 <span className={cn(
                                    "text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase",
                                    sos.status === 'Critical' ? "bg-red-600" : "bg-orange-600"
                                 )}>{sos.status}</span>
                                 <span className="text-[9px] font-bold text-zinc-500 italic uppercase">{sos.time}</span>
                              </div>
                              <h4 className="text-sm font-black italic mb-2 tracking-tight">{sos.title}</h4>
                              <p className="text-xs text-zinc-400 font-medium leading-relaxed">{sos.desc}</p>
                              <button className="mt-4 w-full py-3 bg-white text-zinc-900 rounded-xl text-[10px] font-black uppercase italic tracking-widest hover:bg-orange-500 hover:text-white transition-all">
                                 Dispatch Team
                              </button>
                           </div>
                        ))}
                     </div>

                     <div className="mt-8 pt-8 border-t border-white/10">
                        <Link href="/sos" className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors">
                           View Global SOS Map
                           <ChevronRight className="w-5 h-5" />
                        </Link>
                     </div>
                  </div>
               </div>
            </div>
         </main>

         <Footer />

         {/* AI Specialized Modals */}
         <NLPDeepDiveModal isOpen={isNLPModalOpen} onClose={() => setIsNLPModalOpen(false)} />
         <DispatchModal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} />
         <WaterLevelAnalyticsModal isOpen={isWaterAnalyticsOpen} onClose={() => setIsWaterAnalyticsOpen(false)} />
      </div>
   );
}
