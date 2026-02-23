"use client";

import { 
  ArrowLeft, 
  Share2, 
  Download, 
  ChevronRight, 
  Waves, 
  AlertTriangle, 
  Zap, 
  Activity, 
  Building2, 
  MapPin, 
  Info,
  Clock,
  TrendingUp,
  ShieldCheck,
  Flame,
  Droplets
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function PredictionReportPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 sticky top-0 z-50">
          <Link href="/ai" className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors">
             <ArrowLeft className="w-4 h-4" />
             {t("back_to_dashboard")}
          </Link>
          <div className="flex items-center gap-4 text-xs font-black text-gray-600">
             <span>Colombo, LK</span>
             <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200" />
          </div>
       </header>

       <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
          {/* Action Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
             <div className="space-y-1">
                <h1 className="text-2xl font-black text-zinc-900 italic tracking-tight uppercase leading-none">Detailed AI Prediction Report</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Generated on: Oct 24, 2024 • 14:32:05</p>
             </div>
             
             <div className="flex items-center gap-3">
                <button className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-900 shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-all">
                   <Share2 className="w-4 h-4 text-gray-400" />
                   Share with DMC
                </button>
                <button className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/10 flex items-center gap-2 transition-all active:scale-95">
                   <Download className="w-4 h-4" />
                   Download PDF
                </button>
             </div>
          </div>

          {/* Report Paper */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
             <div className="p-8 md:p-14 space-y-12">
                {/* Official Branding */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-10">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                         <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xl font-black tracking-tight uppercase text-zinc-900 leading-none">OUTBREAK</span>
                         <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 italic">NATIONAL DISASTER MANAGEMENT CENTER</span>
                      </div>
                   </div>
                   <div className="flex flex-col items-end text-right">
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 text-[8px] font-black rounded uppercase tracking-widest">RESTRICTED DISTRIBUTION</span>
                      <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Ref: AI-PRED-2024-1024-X9</span>
                   </div>
                </div>

                {/* Executive Summary Section */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-4 py-1">
                      <h2 className="text-sm font-black text-zinc-900 italic uppercase">EXECUTIVE SUMMARY</h2>
                   </div>
                   
                   <div className="bg-gray-50/50 rounded-2xl p-8 border border-gray-100">
                      <p className="text-sm font-medium text-gray-500 leading-relaxed mb-6 italic">
                         The AI predictive models indicate a <span className="font-black text-zinc-900 uppercase">High Probability (92%)</span> of flash flooding in the Western Province within the next 6 hours due to sustained rainfall in the catchment areas. While seismic activity remains within normal baseline parameters, four critical hotspots have been identified requiring immediate resource allocation.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1 px-1">
                         {[
                           { label: "RISK LEVEL", val: "Critical", color: "text-red-500" },
                           { label: "AFFECTED POPULATION (EST.)", val: "12,450", color: "text-zinc-900" },
                           { label: "RESPONSE STATUS", val: "Mobilizing", color: "text-orange-500" }
                         ].map((m, i) => (
                           <div key={i} className="bg-white p-5 border border-gray-50 rounded-xl space-y-1 shadow-sm">
                              <span className="text-[10px] font-black text-gray-300 uppercase leading-none">{m.label}</span>
                              <div className={cn("text-xl font-black italic tracking-tighter", m.color)}>{m.val}</div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Hydrological Analysis */}
                <div className="space-y-8">
                   <div className="flex justify-between items-end border-l-4 border-blue-500 pl-4 py-1">
                      <h2 className="text-sm font-black text-zinc-900 italic uppercase">KELANI RIVER HYDRO-ANALYSIS</h2>
                      <span className="text-[8px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded tracking-widest border border-blue-100">Sensor Array: K-River-04</span>
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                      <div className="lg:col-span-7 aspect-[4/3] bg-white border border-gray-50 rounded-2xl relative p-6">
                         {/* Legend / Info */}
                         <div className="absolute top-4 left-6 space-y-2">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500" />
                             <span className="text-[8px] font-bold text-gray-400 uppercase italic">Current Water Level</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-0.5 bg-orange-500 border-2 border-orange-500 border-dashed" />
                             <span className="text-[8px] font-bold text-gray-400 uppercase italic">Predicted Trend (+4h)</span>
                           </div>
                         </div>
                         
                         {/* Simple Chart SVG */}
                         <svg className="w-full h-full" viewBox="0 0 400 240">
                            {/* Horizontal grid lines */}
                            {[40, 80, 120, 160, 200].map(y => (
                              <line key={y} x1="20" y1={y} x2="380" y2={y} stroke="#f8fafc" strokeWidth="1" />
                            ))}
                            {/* Threshold line */}
                            <line x1="20" y1="100" x2="380" y2="100" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
                            <text x="25" y="95" className="text-[8px] font-black fill-red-500 opacity-80 uppercase tracking-widest">Flood Threshold</text>
                            
                            {/* Main Curve */}
                            <path 
                              d="M20,160 Q100,150 180,120 T300,70" 
                              fill="none" 
                              stroke="#3b82f6" 
                              strokeWidth="4" 
                              strokeLinecap="round" 
                            />
                            {/* Prediction tail */}
                            <path 
                              d="M300,70 Q340,50 380,40" 
                              fill="none" 
                              stroke="#f97316" 
                              strokeWidth="4" 
                              strokeDasharray="6 4"
                              strokeLinecap="round" 
                            />
                            {/* Current point */}
                            <circle cx="280" cy="80" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                         </svg>
                         
                         <div className="flex justify-between px-2 text-[8px] font-black text-gray-300 italic uppercase">
                            <span>-24h</span>
                            <span>-18h</span>
                            <span>-12h</span>
                            <span>-6h</span>
                            <span className="text-blue-500 bg-blue-50 px-1 rounded">Now</span>
                            <span className="text-orange-500">+8h (Pred)</span>
                         </div>
                      </div>
                      
                      <div className="lg:col-span-5 space-y-4">
                         <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Current Level</span>
                            <div className="text-3xl font-black text-zinc-900 italic tracking-tighter">5.8m</div>
                            <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase">Rising fast (+0.4m/hr)</p>
                         </div>
                         <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Predicted Peak</span>
                            <div className="text-3xl font-black text-zinc-900 italic tracking-tighter">7.2m</div>
                            <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase">Expected at 18:00 today</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Grid-based Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 border-l-4 border-green-500 pl-4 py-1">
                         <h2 className="text-sm font-black text-zinc-900 italic uppercase">SEISMIC CLUSTERS</h2>
                      </div>
                      <div className="bg-gray-50 rounded-2xl aspect-square relative overflow-hidden p-8 border border-gray-100">
                         {/* Mock Radar Chart UI */}
                         <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            {[1, 2, 3].map(i => <div key={i} className="rounded-full border border-gray-400" style={{ width: `${i*33}%`, height: `${i*33}%` }} />)}
                         </div>
                         <div className="relative w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 blur-xl animate-pulse" />
                            <div className="w-32 h-32 rounded-full bg-green-500/5 blur-3xl absolute" />
                            <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg border-2 border-white absolute top-[40%] left-[35%]" />
                            <div className="w-2 h-2 bg-green-600 rounded-full shadow-lg border border-white absolute top-[60%] left-[60%]" />
                         </div>
                         <div className="absolute bottom-4 left-4 space-y-1.5 backdrop-blur-sm bg-white/20 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                               <span className="text-[8px] font-bold text-gray-600 uppercase">Normal Activity</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                               <span className="text-[8px] font-bold text-gray-600 uppercase">High Activity</span>
                            </div>
                         </div>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase">Sensor clusters A & B showing nominal micro-tremors consistent with seasonal shifts.</p>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 border-l-4 border-slate-900 pl-4 py-1">
                         <h2 className="text-sm font-black text-zinc-900 italic uppercase">IDENTIFIED CRITICAL HOTSPOTS</h2>
                      </div>
                      <div className="space-y-3">
                         {[
                           { name: "Galle Face Green Area", risk: "Critical", icon: Building2, color: "text-red-500", bg: "bg-red-50", desc: "High water accumulation. Drainage blocked." },
                           { name: "Ratnapura Pass", risk: "High", icon: Droplets, color: "text-orange-500", bg: "bg-orange-50", desc: "Soil saturation at 88%. Risk of slip." },
                           { name: "Substation 4 (Kandy)", risk: "Medium", icon: Zap, color: "text-slate-400", bg: "bg-slate-50", desc: "Preventative shutdown scheduled." }
                         ].map((h, i) => (
                           <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 items-start group hover:border-zinc-900 transition-all">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", h.bg)}>
                                 <h.icon className={cn("w-5 h-5", h.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-xs font-black text-zinc-900 italic truncate uppercase">{h.name}</h4>
                                    <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded", h.bg, h.color)}>{h.risk}</span>
                                 </div>
                                 <p className="text-[10px] font-medium text-gray-400 line-clamp-1 italic">{h.desc}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Final Footer Marks */}
                <div className="pt-12 border-t border-gray-50 flex items-center justify-between">
                   <span className="text-[8px] font-bold text-gray-300 uppercase italic">Generated by Outbreak AI Engine v2.4</span>
                   <span className="text-[8px] font-bold text-gray-300 uppercase italic">Page 1 of 1</span>
                </div>
             </div>
          </div>
       </main>
       
       <Footer />
       
       <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
             display: none;
          }
       `}</style>
    </div>
  );
}
