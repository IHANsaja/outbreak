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
  Heart
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { NLPDeepDiveModal, DispatchModal, WaterLevelAnalyticsModal } from "@/components/AIModals";

const stats = [
  { label: "Total Reports Processed", value: "12,405", change: "+12%", icon: Cpu, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "Active Anomalies", value: "3", sub: "Requires immediate attention", status: "CRITICAL", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  { label: "Critical SOS Alerts", value: "142", change: "+5%", icon: Heart, color: "text-orange-500", bg: "bg-orange-50" },
  { label: "AI Confidence Score", value: "92%", status: "Stable", icon: Brain, color: "text-green-500", bg: "bg-green-50" },
];

const messages = [
  { id: "NLP-992", type: "HIGH PANIC", title: "Flooding in Kalutara", count: 450, topics: ["Water entering homes", "Road blocked"], color: "border-red-500" },
  { id: "NLP-841", type: "WARNING", title: "Landslide Risk - Ratnapura", count: 128, topics: ["Mud flow", "Cracked walls"], color: "border-orange-500", active: true },
  { id: "NLP-772", type: "RECOVERING", title: "Power Restoration - Galle", count: 210, topics: ["Electricity back", "Thank you"], color: "border-green-500" },
];

export default function AIDashboard() {
  const [sosFilter, setSosFilter] = useState("All");
  const [isNLPModalOpen, setIsNLPModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isWaterAnalyticsOpen, setIsWaterAnalyticsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
           <div className="space-y-1">
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight italic flex items-center gap-3">
                 <Brain className="w-8 h-8 text-orange-500" />
                 AI Insights & Predictions
              </h1>
              <p className="text-sm font-medium text-gray-500 max-w-2xl">
                Real-time anomaly detection and predictive analysis for disaster management authorities using Deep Learning models.
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black tracking-widest uppercase border border-green-100">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                 Live Prediction Model V2.4
              </div>
              <Link href="/ai/report" className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black italic shadow-lg shadow-orange-900/10 transition-all flex items-center gap-2">
                 <FileText className="w-4 h-4" />
                 Generate Full Report
              </Link>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                 {stats.map((s, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", s.bg, s.color)}>
                             <s.icon className="w-5 h-5" />
                          </div>
                          {s.change && (
                            <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded tracking-tighter">
                               {s.change}
                            </span>
                          )}
                          {s.status && (
                            <span className={cn(
                              "text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest",
                              s.status === 'CRITICAL' ? "bg-red-500 text-white animate-pulse" : "bg-green-500 text-white"
                            )}>
                               {s.status}
                            </span>
                          )}
                       </div>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
                       <div className="text-2xl font-black text-zinc-900 italic tracking-tight mt-1">{s.value}</div>
                       {s.sub && <p className="text-[9px] font-bold text-red-500 mt-1 uppercase tracking-tighter">{s.sub}</p>}
                    </div>
                 ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Water Levels Card */}
                 <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative group">
                    <div className="flex justify-between items-center mb-10">
                       <div className="space-y-1">
                          <h3 className="font-black text-zinc-900 italic">Kelani River Water Levels</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Predicted vs Actual (Last 24h + Next 4h)</p>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 tracking-widest">CRITICAL LEVEL DETECTED</span>
                          <Maximize2 
                            className="w-4 h-4 text-gray-300 hover:text-zinc-900 cursor-pointer" 
                            onClick={() => setIsWaterAnalyticsOpen(true)}
                          />
                       </div>
                    </div>
                    
                    <div className="h-48 relative flex items-end">
                       <svg className="w-full h-full" viewBox="0 0 400 200">
                          {/* Grid Lines */}
                          <line x1="0" y1="180" x2="400" y2="180" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="0" y1="60" x2="400" y2="60" stroke="#fecaca" strokeWidth="1" strokeDasharray="4 4" />
                          
                          {/* Actual Path */}
                          <path 
                            d="M0,150 L50,140 L100,120 L150,110 L200,80" 
                            fill="none" 
                            stroke="#3b82f6" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                          />
                          {/* Predicted Path */}
                          <path 
                            d="M200,80 L250,70 L300,50 L350,45" 
                            fill="none" 
                            stroke="#f97316" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeDasharray="6 4"
                          />
                          {/* Current Point */}
                          <circle cx="200" cy="80" r="4" fill="#3b82f6" />
                          <circle cx="200" cy="80" r="8" fill="#3b82f6" opacity="0.2" className="animate-ping" />
                       </svg>
                       
                       <div className="absolute inset-0 flex justify-between items-end pb-2 opacity-50">
                          {["00:00", "06:00", "12:00", "18:00"].map(t => (
                            <span key={t} className="text-[8px] font-black text-gray-400 italic">{t}</span>
                          ))}
                       </div>
                       
                       <div className="absolute top-[80px] left-[200px] flex gap-4">
                          <div className="flex items-center gap-1.5">
                             <div className="w-2 h-2 rounded-full bg-blue-500" />
                             <span className="text-[9px] font-black text-zinc-900 uppercase">Now</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <div className="w-2 h-0.5 bg-orange-500 border-2 border-orange-500 border-dashed" />
                             <span className="text-[9px] font-black text-orange-500 uppercase">Prediction +4h</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Seismic Activity Card */}
                 <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 group">
                    <div className="flex justify-between items-center mb-10">
                       <div className="space-y-1">
                          <h3 className="font-black text-zinc-900 italic">Seismic Activity Monitor</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Central Province • Sensor Cluster A4</p>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded border border-green-100 tracking-widest">NORMAL ACTIVITY</span>
                          <Settings className="w-4 h-4 text-gray-300 hover:text-zinc-900 cursor-pointer" />
                       </div>
                    </div>
                    
                    <div className="h-40 bg-gray-50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                       <div className="absolute inset-0 opacity-10">
                          {[1,2,3,4,5,6].map(i => <div key={i} className="h-1px w-full bg-zinc-900" style={{ top: `${i*16}%` }} />)}
                       </div>
                       <svg className="w-full h-full" viewBox="0 0 400 100">
                          <path 
                            d="M0,50 L20,50 L30,48 L40,52 L60,50 L80,50 L90,40 L100,60 L110,50 L140,50 L160,50 L170,30 L180,70 L190,50 L220,50 L240,40 L260,60 L280,50 L310,35 L320,65 L330,50 L400,50" 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="2" 
                            className="animate-[dash_5s_linear_infinite]"
                          />
                          <line x1="330" y1="0" x2="330" y2="100" stroke="#10b981" opacity="0.2" />
                       </svg>
                       
                       <div className="absolute bottom-4 left-0 right-0 px-6 flex justify-between">
                          {["Cluster A", "Cluster B", "Cluster C", "Cluster D"].map(c => (
                            <span key={c} className="text-[8px] font-black text-gray-400 uppercase italic tracking-widest">{c}</span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Message Summary */}
              <div className="space-y-8">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-zinc-900 italic flex items-center gap-3 underline decoration-orange-500 decoration-4 underline-offset-8">
                       <Zap className="w-6 h-6 text-orange-500" />
                       AI Message Summary (NLP Analysis)
                    </h2>
                    <button 
                      onClick={() => setIsNLPModalOpen(true)}
                      className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform border border-orange-100 bg-orange-50/50 px-4 py-2 rounded-xl"
                    >
                       Deep Dive Analysis <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {messages.map((msg) => (
                      <div key={msg.id} className={cn(
                        "bg-white p-8 rounded-[2rem] border-2 transition-all hover:shadow-xl",
                        msg.active ? "border-orange-500 ring-4 ring-orange-500/5 shadow-lg" : "border-gray-100"
                      )}>
                         <div className="flex justify-between items-center mb-6">
                            <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase",
                              msg.type === 'HIGH PANIC' ? "bg-red-500 text-white" : 
                              msg.type === 'WARNING' ? "bg-orange-500 text-white" : "bg-green-500 text-white"
                            )}>{msg.type}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter italic">ID: {msg.id}</span>
                         </div>
                         
                         <h4 className="text-lg font-black text-zinc-900 italic tracking-tight mb-2 leading-tight">{msg.title}</h4>
                         <p className="text-[10px] font-bold text-gray-500 tracking-tighter uppercase mb-6">Aggregated from <span className="text-zinc-900">{msg.count}+ reports</span> in the last hour.</p>
                         
                         <div className="space-y-4 mb-8">
                            <span className="text-[9px] font-black text-gray-300 uppercase italic tracking-widest block">Key Topics</span>
                            <div className="flex flex-wrap gap-2">
                               {msg.topics.map(t => (
                                 <span key={t} className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-600 rounded-lg group-hover:bg-white transition-colors">{t}</span>
                               ))}
                            </div>
                         </div>
                         
                         <Link href="/ai/briefing" className="w-full py-4 rounded-xl bg-gray-50 hover:bg-zinc-900 border border-gray-100 hover:border-zinc-900 text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2 tracking-widest italic group">
                            Generate Briefing
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                         </Link>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Sidebar - SOS Feed */}
           <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full sticky top-8">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-zinc-900 italic flex items-center gap-2">
                       <Activity className="w-5 h-5 text-red-500" />
                       Priority SOS Feed
                    </h3>
                 </div>

                 <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                    {["All (14)", "Critical (5)", "High (9)"].map((f) => (
                      <button 
                        key={f}
                        onClick={() => setSosFilter(f.split(' ')[0])}
                        className={cn(
                          "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                          sosFilter === f.split(' ')[0] ? "bg-orange-500 text-white shadow-lg" : "text-gray-400 hover:text-zinc-900"
                        )}
                      >
                         {f}
                      </button>
                    ))}
                 </div>

                 <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                    {[
                      { match: "98%", time: "2m ago", title: "Medical Emergency - Galle Face", desc: '"Urgent help needed. Elderly person with breathing difficulty. Water rising fast on ground floor."', priority: "CRITICAL" },
                      { match: "92%", time: "15m ago", title: "Trapped Family - Kandy", desc: '"Landslide blocked our exit. 4 people inside including children. Please hurry."', priority: "CRITICAL" },
                      { priority: "HIGH", title: "Stranded Group - Matara", desc: '"Bus stuck in flood water. Engine dead. ~20 passengers. Water level stable for now."', time: "32m ago" },
                      { priority: "MEDIUM", title: "Supply Request - Shelter 4", desc: '"Running low on clean water bottles. Need restock by tomorrow morning."', time: "1h ago" }
                    ].map((sos, i) => (
                      <div key={i} className={cn(
                        "relative p-5 rounded-2xl border transition-all hover:shadow-md group",
                        sos.priority === 'CRITICAL' ? "bg-white border-l-4 border-l-red-500 shadow-sm" : 
                        sos.priority === 'HIGH' ? "bg-white border-l-4 border-l-orange-500" : "bg-gray-50 border-gray-100"
                      )}>
                         <div className="flex justify-between items-center mb-3">
                            {sos.match ? (
                               <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded tracking-widest">{sos.priority} - {sos.match} MATCH</span>
                            ) : (
                               <span className={cn(
                                 "text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase",
                                 sos.priority === 'HIGH' ? "bg-orange-500 text-white" : "bg-gray-400 text-white"
                               )}>{sos.priority}</span>
                            )}
                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-400 italic">
                               <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                               {sos.time}
                            </div>
                         </div>
                         <h4 className="text-[12px] font-black text-zinc-900 italic mb-2 tracking-tight group-hover:text-red-500 transition-colors">{sos.title}</h4>
                         <p className="text-[11px] font-medium text-gray-500 leading-relaxed italic line-clamp-2 md:line-clamp-none">{sos.desc}</p>
                         
                         <div className="mt-4 flex gap-2">
                           {sos.priority === 'CRITICAL' ? (
                              <>
                                <button 
                                  onClick={() => setIsDispatchModalOpen(true)}
                                  className="flex-1 bg-red-500 hover:bg-black text-white text-[10px] font-black uppercase italic py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                   <Zap className="w-3.5 h-3.5 fill-white" />
                                   Dispatch
                                </button>
                                <button className="p-2 border border-gray-100 hover:bg-gray-50 rounded-lg transition-colors">
                                   <MapPin className="w-4 h-4 text-gray-400" />
                                </button>
                              </>
                           ) : (
                              <button className="w-full bg-slate-100 hover:bg-white border border-transparent hover:border-gray-200 text-gray-600 hover:text-zinc-900 text-[9px] font-black uppercase italic py-2 rounded-lg transition-all flex items-center justify-center gap-2">
                                 {sos.priority === 'MEDIUM' ? 'Log Request' : 'Verify'}
                                 {sos.priority === 'MEDIUM' ? <FileText className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                              </button>
                           )}
                         </div>
                      </div>
                    ))}
                 </div>
                 
                 <div className="pt-8 border-t border-gray-50 mt-8 space-y-4">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest italic">
                       <span className="text-gray-300">System Status:</span>
                       <span className="text-green-500">Operational • Latency: 24ms</span>
                    </div>
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

      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -400;
          }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
