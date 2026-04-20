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
   ChevronDown
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
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

   // Stats derived from current station or global (as per user request: Global Selection)
   const statsData = [
      { key: "water_level", value: latestReport ? `${latestReport.water_level_now.toFixed(2)}m` : "--", change: latestReport && latestReport.water_level_now > latestReport.water_level_lag1 ? "+Rise" : "Stable", icon: Waves, color: "text-blue-500", bg: "bg-blue-50" },
      { key: "alert_status", value: latestReport?.water_level_now >= latestReport?.minor_flood ? "WARNING" : "NORMAL", status: latestReport?.water_level_now >= latestReport?.minor_flood ? "CRITICAL" : "OK", icon: AlertCircle, color: latestReport?.water_level_now >= latestReport?.minor_flood ? "text-red-500" : "text-green-500", bg: latestReport?.water_level_now >= latestReport?.minor_flood ? "bg-red-50" : "bg-green-50" },
      { key: "rainfall_24h", value: latestReport ? `${latestReport.rainfall_roll3.toFixed(1)}mm` : "--", change: "Current", icon: Zap, color: "text-orange-500", bg: "bg-orange-50" },
      { key: "ai_confidence", value: "94%", status: "stable", icon: Brain, color: "text-green-500", bg: "bg-green-50" },
   ];

   const messages = [
      { id: "NLP-992", type: "HIGH PANIC", title: `Reports near ${currentStation?.name || 'Station'}`, count: latestReport?.water_level_now > 5 ? 450 : 22, topics: ["Rising water", "Inundation"], color: "border-red-500" },
      { id: "NLP-841", type: "WARNING", title: "Regional Risk Assessment", count: 128, topics: ["Mud flow", "Drainage block"], color: "border-orange-500", active: true },
      { id: "NLP-772", type: "RECOVERING", title: "Upstream Discharge", count: 210, topics: ["Gate opening", "Flow rate"], color: "border-green-500" },
   ];

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

            {/* Immersive Hero Analytics */}
            <div className="mb-8 p-1 bg-zinc-50 rounded-[2.5rem]">
               <div className="bg-white rounded-[2.4rem] p-8 md:p-12 shadow-sm border border-zinc-100 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                     <div className="space-y-2">
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
                        <h2 className="text-2xl font-black text-zinc-900 tracking-tight italic">
                           {currentStation?.river} • {currentStation?.name} <span className="text-zinc-300 ml-2">Monitor</span>
                        </h2>
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                        {statsData.map((s, i) => (
                           <div key={i} className="flex flex-col">
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{t(s.key)}</span>
                              <span className={cn("text-lg font-black italic tracking-tighter", s.color)}>{s.value}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="h-64 md:h-80 relative flex items-end">
                     {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                           <div className="flex flex-col items-center gap-4">
                              <div className="w-10 h-10 border-4 border-zinc-100 border-t-orange-500 rounded-full animate-spin" />
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Compiling Forecasts...</span>
                           </div>
                        </div>
                     ) : (
                        <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                           {/* Threshold Bands */}
                           {latestReport && (
                              <>
                                 <line x1="0" y1={300 - (latestReport.major_flood * 30)} x2="1000" y2={300 - (latestReport.major_flood * 30)} stroke="#fee2e2" strokeWidth="2" strokeDasharray="8 4" />
                                 <text x="10" y={295 - (latestReport.major_flood * 30)} className="text-[10px] font-black fill-red-400 uppercase italic">Major Flood Limit</text>
                                 
                                 <line x1="0" y1={300 - (latestReport.minor_flood * 30)} x2="1000" y2={300 - (latestReport.minor_flood * 30)} stroke="#ffedd5" strokeWidth="1" strokeDasharray="4 4" />
                                 <text x="10" y={295 - (latestReport.minor_flood * 30)} className="text-[10px] font-black fill-orange-300 uppercase italic">Minor Flood Limit</text>
                              </>
                           )}

                           {/* Historical Path (Last 12) */}
                           <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.5 }}
                              d={`M ${reports.map((r, i) => `${i * 60},${300 - (r.water_level_now * 30)}`).join(' L ')}`}
                              fill="none"
                              stroke="#0ea5e9"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                           />

                           {/* Forecast Projection */}
                           {latestReport && latestReport.forecast_1h && (
                              <motion.path
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 transition={{ delay: 1 }}
                                 d={`M ${(reports.length - 1) * 60},${300 - (latestReport.water_level_now * 30)} 
                                     L ${reports.length * 60},${300 - (latestReport.forecast_1h * 30)} 
                                     L ${(reports.length + 2) * 60},${300 - (latestReport.forecast_12h * 30)} 
                                     L ${(reports.length + 4) * 60},${300 - (latestReport.forecast_24h * 30)}`}
                                 fill="none"
                                 stroke="#f43f5e"
                                 strokeWidth="4"
                                 strokeLinecap="round"
                                 strokeDasharray="10 5"
                                 className="animate-pulse"
                              />
                           )}

                           {/* Data Points */}
                           {reports.map((r, i) => (
                              <g key={i} className="group/point">
                                 <circle 
                                    cx={i * 60} 
                                    cy={300 - (r.water_level_now * 30)} 
                                    r="6" 
                                    fill="white" 
                                    stroke="#0ea5e9" 
                                    strokeWidth="3" 
                                    className="cursor-pointer hover:fill-blue-500 transition-colors"
                                 />
                                 {i === reports.length - 1 && (
                                    <circle cx={i * 60} cy={300 - (r.water_level_now * 30)} r="12" fill="#0ea5e9" opacity="0.2" className="animate-ping pointer-events-none" />
                                 )}
                              </g>
                           ))}
                        </svg>
                     )}

                     <div className="absolute top-0 right-0 flex flex-col gap-4">
                        <div className="bg-white/80 backdrop-blur-sm border border-zinc-100 p-4 rounded-3xl shadow-xl space-y-3">
                           <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span className="text-[10px] font-black text-zinc-900 uppercase italic">Actual level History</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse border-2 border-rose-100" />
                              <span className="text-[10px] font-black text-zinc-900 uppercase italic">AI Predicted Trajectory</span>
                           </div>
                           <div className="pt-2 border-t border-zinc-50 space-y-1">
                              <div className="flex justify-between gap-8">
                                 <span className="text-[9px] font-bold text-zinc-400 uppercase">Next 1h</span>
                                 <span className="text-[10px] font-black text-rose-500">{latestReport?.forecast_1h ? `${latestReport.forecast_1h.toFixed(2)}m` : '--'}</span>
                              </div>
                              <div className="flex justify-between gap-8">
                                 <span className="text-[9px] font-bold text-zinc-400 uppercase">Next 12h</span>
                                 <span className="text-[10px] font-black text-orange-500">{latestReport?.forecast_12h ? `${latestReport.forecast_12h.toFixed(2)}m` : '--'}</span>
                              </div>
                              <div className="flex justify-between gap-8">
                                 <span className="text-[9px] font-bold text-zinc-400 uppercase font-black italic">Strategic 24h</span>
                                 <span className="text-[10px] font-black text-amber-500">{latestReport?.forecast_24h ? `${latestReport.forecast_24h.toFixed(2)}m` : '--'}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
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
