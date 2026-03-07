"use client";

import { 
  X, 
  MessageSquare, 
  Zap, 
  Search, 
  TrendingUp, 
  ShieldAlert, 
  MapPin, 
  Users, 
  Navigation2, 
  Activity,
  AlertTriangle,
  Heart,
  Info,
  ChevronRight,
  Download,
  CheckCircle2,
  Flame,
  Clock,
  Waves,
  ArrowUpRight,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NLPDeepDiveModal({ isOpen, onClose }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
             <button 
               onClick={onClose}
               className="absolute top-6 right-8 text-gray-400 hover:text-zinc-900 transition-colors z-10"
             >
                <X className="w-5 h-5" />
             </button>

             <div className="p-10 md:p-14 space-y-10">
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                      <Search className="w-6 h-6 text-orange-500" />
                   </div>
                   <div className="space-y-1">
                      <h2 className="text-2xl font-black text-zinc-900 italic tracking-tight uppercase leading-none">NLP Deep Dive Analysis</h2>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">ID: NLP-992</span>
                         <div className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            Flooding in Kalutara
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                   {/* Left Col: Word Cloud & Samples */}
                   <div className="lg:col-span-7 space-y-10">
                      <div className="space-y-6">
                         <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-orange-500" />
                            <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">Cluster Word Cloud</h3>
                         </div>
                         <div className="bg-orange-50/30 rounded-[2rem] p-10 border border-orange-100/50 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 relative">
                            <span className="text-3xl font-black text-red-600 uppercase tracking-tighter">WATER LEVEL</span>
                            <span className="text-xl font-bold text-gray-400">trapped</span>
                            <span className="text-2xl font-black text-orange-500 uppercase italic">RISING</span>
                            <span className="text-lg font-bold text-gray-500">Road</span>
                            <span className="text-4xl font-black text-zinc-900 tracking-tighter">HELP</span>
                            <span className="text-sm font-medium text-gray-400">School</span>
                            <span className="text-lg font-bold text-orange-400">Children</span>
                            <span className="text-2xl font-black text-red-500 uppercase italic">URGENT</span>
                            <span className="text-sm font-bold text-gray-400">food</span>
                            <span className="text-xl font-black text-zinc-700 italic">first floor</span>
                            
                            <div className="absolute bottom-4 right-6 text-[8px] font-black text-gray-300 uppercase tracking-widest">FREQUENCY MAP</div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <MessageSquare className="w-4 h-4 text-orange-500" />
                               <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">Sample Raw Messages (Anonymized)</h3>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase italic">Recent 5 of 452</span>
                         </div>
                         <div className="space-y-3">
                            {[
                              { text: '"Water is entering the kitchen now. We have moved to the roof. Please send a boat."', time: "09:42 AM", tag: "Panic" },
                              { text: '"Galle road is completely blocked near the bridge. No vehicles can pass."', time: "09:38 AM", tag: "Warning" },
                              { text: '"Can anyone hear us? Power is out and phone battery is dying."', time: "09:35 AM", tag: "Panic" }
                            ].map((msg, i) => (
                              <div key={i} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col gap-2 group transition-all hover:bg-white hover:shadow-sm">
                                 <p className="text-xs font-semibold text-gray-600 italic tracking-tight">{msg.text}</p>
                                 <div className="flex items-center gap-3">
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{msg.time}</span>
                                    <span className={cn(
                                       "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                                       msg.tag === 'Panic' ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"
                                    )}>{msg.tag}</span>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* Right Col: Analysis Metrics */}
                   <div className="lg:col-span-5 space-y-10">
                      <div className="space-y-6">
                         <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-orange-500" />
                            <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">Sentiment Analysis</h3>
                         </div>
                         <div className="bg-white border border-gray-100 rounded-[2rem] p-10 flex flex-col items-center justify-center shadow-sm">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                               {/* Semi-circular gauge */}
                               <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f4f4f5" strokeWidth="12" />
                                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray="189" strokeDashoffset="251" strokeLinecap="round" />
                               </svg>
                               <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
                                  <span className="text-4xl font-black text-zinc-900 italic tracking-tighter leading-none">85%</span>
                                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">PANIC / FEAR</span>
                               </div>
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-tight mt-6 leading-relaxed">Based on keyword intensity and<br/>punctuation analysis.</p>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">Report Sources</h3>
                         </div>
                         <div className="space-y-4">
                            {[
                              { source: "Social Media (Public)", count: 312, color: "bg-orange-500" },
                              { source: "Emergency Hotline", count: 89, color: "bg-blue-500" },
                              { source: "SMS Gateway", count: 49, color: "bg-green-500" }
                            ].map((s, i) => (
                              <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                                    <span className="text-gray-400">{s.source}</span>
                                    <span className="text-zinc-900">{s.count}</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(s.count / 450) * 100}%` }}
                                      className={cn("h-full rounded-full", s.color)} 
                                    />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <button onClick={onClose} className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-zinc-900 transition-colors italic">Cancel</button>
                    <div className="flex gap-4 w-full md:w-auto">
                       <button className="flex-1 md:flex-none px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black italic shadow-xl shadow-orange-900/20 flex items-center justify-center gap-3 transition-all active:scale-95">
                          <Download className="w-4 h-4" />
                          Export to Insights
                       </button>
                    </div>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DispatchModal({ isOpen, onClose }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
             <button 
               onClick={onClose}
               className="absolute top-6 right-8 text-gray-400 hover:text-zinc-900 transition-colors z-10"
             >
                <X className="w-5 h-5" />
             </button>

             <div className="p-10 md:p-14 space-y-10">
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                      <Zap className="w-6 h-6 text-red-500" />
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black px-1.5 py-0.5 bg-red-500 text-white rounded uppercase tracking-widest leading-none">CRITICAL INCIDENT</span>
                         <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">ID: SOS-2294</span>
                      </div>
                      <h2 className="text-2xl font-black text-zinc-900 italic tracking-tight uppercase leading-none flex items-center gap-2">
                        <Flame className="w-6 h-6 text-red-500 fill-red-500" />
                        Dispatch Resource Unit
                      </h2>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">Deploy emergency services to the selected location.</p>
                   </div>
                </div>

                <div className="bg-red-50/30 rounded-3xl p-8 border border-red-100 flex gap-6">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-red-100 flex items-center justify-center shrink-0">
                      <Heart className="w-6 h-6 text-red-600 fill-red-600" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-lg font-black text-zinc-900 italic uppercase italic tracking-tight leading-none">Medical Emergency - Galle Face</h3>
                      <p className="text-xs font-medium text-gray-500 leading-relaxed italic">
                        "Urgent help needed. Elderly person with breathing difficulty. Water rising fast on ground floor."
                      </p>
                      <div className="flex items-center gap-6 pt-2">
                         <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase italic">
                            <MapPin className="w-3.5 h-3.5" />
                            6.9271° N, 79.8471° E
                         </div>
                         <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase italic">
                            <Clock className="w-3.5 h-3.5" />
                            Reported 2m ago
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {/* Nearby Units List */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">Nearby Units</h3>
                         <span className="text-[8px] font-black px-2 py-0.5 bg-green-500 text-white rounded uppercase">3 Available</span>
                      </div>
                      <div className="space-y-3">
                         {[
                           { name: "Ambulance Unit 04", dist: "0.8km", info: "Crew: 3 Paramedics • Est. Arrival: 4 min", selected: true },
                           { name: "Fire Rescue F-12", dist: "1.2km", info: "Equip: Flood Boat • Est. Arrival: 7 min" },
                           { name: "Police Patrol P-09", dist: "2.5km", info: "Traffic Control • Est. Arrival: 12 min" }
                         ].map((unit, i) => (
                           <div key={i} className={cn(
                             "p-4 rounded-2xl border transition-all cursor-pointer group",
                             unit.selected ? "border-orange-500 bg-orange-50/50" : "border-gray-100 hover:border-gray-300"
                           )}>
                              <div className="flex justify-between items-center mb-1">
                                 <div className="flex items-center gap-3">
                                    <div className={cn(
                                       "w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm",
                                       unit.selected ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-transparent"
                                    )}>
                                       <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-xs font-black text-zinc-900 italic uppercase italic leading-none">{unit.name}</h4>
                                 </div>
                                 <span className="text-[10px] font-black text-green-600">{unit.dist}</span>
                              </div>
                              <p className="text-[9px] font-bold text-gray-400 pl-9 uppercase tracking-tighter">{unit.info}</p>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Notes & Actions */}
                   <div className="space-y-6 flex flex-col">
                      <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">Notes for Responders</h3>
                      <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                         <p className="text-[11px] font-medium text-gray-400 leading-relaxed uppercase italic">Enter critical information regarding access routes, hazards, or patient condition...</p>
                         <div className="mt-20 flex flex-wrap gap-2">
                             {["Flooded Road", "Power Lines Down"].map(t => (
                               <span key={t} className="px-3 py-1 bg-white shadow-sm border border-gray-100 rounded-lg text-[8px] font-black text-zinc-900 uppercase italic">{t}</span>
                             ))}
                         </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                         <Info className="w-4 h-4 text-blue-500 shrink-0" />
                         <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter leading-relaxed italic">
                           AI Recommendation: Dispatch medical unit with oxygen supply. Ensure vehicle has high clearance due to water levels.
                         </p>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <button onClick={onClose} className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-zinc-900 transition-colors italic">Cancel</button>
                    <button className="w-full md:w-auto px-12 py-5 bg-orange-500 hover:bg-black text-white rounded-2xl text-xs font-black italic shadow-xl shadow-orange-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 group/btn">
                       <Navigation2 className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                       CONFIRM DISPATCH
                    </button>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function WaterLevelAnalyticsModal({ isOpen, onClose }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl bg-white rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
             {/* Header */}
             <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Waves className="w-6 h-6 text-blue-500" />
                   </div>
                   <div className="space-y-0.5">
                      <div className="flex items-center gap-3">
                         <h2 className="text-xl font-black text-zinc-900 tracking-tight italic">Kelani River Historical Analytics</h2>
                         <span className="text-[10px] font-black px-2 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded uppercase tracking-widest">CRITICAL ZONE</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase italic">
                         <Activity className="w-3.5 h-3.5" />
                         Comparing: Current Levels vs. 2016 Major Flood Event
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-6">
                   <div className="flex bg-gray-100 p-1 rounded-xl">
                      {["24H", "7D", "30D"].map((t) => (
                        <button key={t} className={cn(
                          "px-4 py-1.5 text-[10px] font-black rounded-lg transition-all",
                          t === "24H" ? "bg-white text-zinc-900 shadow-sm" : "text-gray-400 hover:text-zinc-900"
                        )}>{t}</button>
                      ))}
                   </div>
                   <div className="flex items-center gap-3">
                      <button className="p-2 text-gray-400 hover:text-zinc-900 transition-colors">
                         <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-zinc-900 transition-colors"
                      >
                         <X className="w-5 h-5" />
                      </button>
                   </div>
                </div>
             </div>

             <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Main Chart Area */}
                <div className="flex-1 p-8 md:p-12 relative flex flex-col">
                   {/* Legend */}
                   <div className="flex flex-wrap items-center gap-8 mb-12">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-blue-500" />
                         <span className="text-[10px] font-black text-zinc-900 uppercase italic tracking-tight">Current Water Level (ft)</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-0.5 border-t-2 border-dashed border-red-400" />
                         <span className="text-[10px] font-black text-gray-400 uppercase italic tracking-tight">2016 Flood Benchmark</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200" />
                         <span className="text-[10px] font-black text-gray-400 uppercase italic tracking-tight">Alert Threshold</span>
                      </div>
                      
                      <div className="ml-auto text-[10px] font-bold text-gray-300 uppercase italic">
                        Updated: <span className="text-green-500">LIVE (Latency: 24ms)</span>
                      </div>
                   </div>

                   <div className="flex-1 relative">
                      {/* Critical Threshold Zone */}
                      <div className="absolute top-[30%] left-0 right-0 h-[40%] bg-red-50/20 border-y border-red-100/50 flex items-center px-4">
                         <span className="text-[12px] font-black text-red-400 uppercase tracking-[0.3em] opacity-60">CRITICAL THRESHOLD (9.0ft)</span>
                      </div>

                      <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
                         {/* Vert Grid Lines */}
                         {[0, 200, 400, 600, 800].map(x => (
                           <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#f1f5f9" strokeWidth="1" />
                         ))}
                         
                         {/* Axis Baseline */}
                         <line x1="0" y1="400" x2="800" y2="400" stroke="#cbd5e1" strokeWidth="1" />
                         
                         {/* 2016 Benchmark Path */}
                         <path 
                           d="M0,350 Q150,320 300,180 T600,100 T800,120" 
                           fill="none" 
                           stroke="#f87171" 
                           strokeWidth="2" 
                           strokeDasharray="8 6"
                           opacity="0.6"
                         />
                         
                         {/* Current Level Path */}
                         <path 
                           d="M0,380 C100,370 200,340 300,260 S500,160 600,120" 
                           fill="none" 
                           stroke="#3b82f6" 
                           strokeWidth="4" 
                           strokeLinecap="round" 
                         />

                         {/* Vertical "Now" Line */}
                         <line x1="600" y1="0" x2="600" y2="400" stroke="#3b82f6" strokeWidth="1" opacity="0.4" />
                         
                         {/* Current Level Point */}
                         <circle cx="600" cy="120" r="5" fill="#3b82f6" stroke="white" strokeWidth="3" />
                         <circle cx="600" cy="120" r="10" fill="#3b82f6" opacity="0.1" className="animate-ping" />
                      </svg>

                      {/* Tooltip */}
                      <div className="absolute top-[80px] left-[615px] bg-white border border-gray-100 shadow-xl rounded-2xl p-5 min-w-[160px] z-20">
                         <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Level</div>
                         <div className="text-3xl font-black text-zinc-900 tracking-tighter leading-none mb-2">9.2 ft</div>
                         <div className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase italic">
                            <ArrowUpRight className="w-4 h-4" />
                            +1.2ft / hr
                         </div>
                      </div>

                      {/* X-Axis Labels */}
                      <div className="absolute -bottom-1 left-0 right-0 flex justify-between px-2 text-[9px] font-black text-gray-300 uppercase italic">
                         <span>00:00</span>
                         <span>04:00</span>
                         <span>08:00</span>
                         <span>12:00</span>
                         <span>16:00</span>
                         <span>20:00</span>
                         <span className="text-blue-500">Now</span>
                      </div>
                   </div>

                   <div className="mt-12 flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest italic border-t border-gray-50 pt-6">
                      <div className="flex items-center gap-2">
                        DATA SOURCE: <span className="text-zinc-900">IRRIGATION DEPT. REAL-TIME API</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <span>LAST SYNC: 12S AGO</span>
                         <div className="flex items-center gap-1.5 text-green-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            SYSTEM LATENCY: 24MS
                         </div>
                      </div>
                   </div>
                </div>

                {/* Sensor Matrix Sidebar */}
                <div className="w-full md:w-80 bg-gray-50/50 border-l border-gray-100 p-8 flex flex-col gap-8">
                   <div className="space-y-1">
                      <h3 className="text-xs font-black text-zinc-900 italic uppercase">SENSOR MATRIX</h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Kelani River Basin • Zone A</p>
                   </div>

                   <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                      {[
                        { name: "Nagalagam Street", val: "7.2 ft", status: "Alert", color: "text-red-500", dot: "bg-green-500" },
                        { name: "Hanwella Bridge", val: "4.1 ft", status: "Normal", color: "text-green-500", dot: "bg-green-500" },
                        { name: "Glencourse", val: "3.8 ft", status: "Normal", color: "text-green-500", dot: "bg-green-500" },
                        { name: "Kitulgala", val: "5.9 ft", status: "Rising", color: "text-orange-500", dot: "bg-green-500" },
                        { name: "Norwood Station", val: "Maintenance", status: "Offline", color: "text-gray-400", dot: "bg-yellow-400", icon: Settings }
                      ].map((item, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative group hover:border-blue-200 transition-all">
                           <div className="flex justify-between items-start mb-2">
                              <h4 className="text-[11px] font-black text-zinc-900 italic uppercase tracking-tight">{item.name}</h4>
                              <div className={cn("w-1.5 h-1.5 rounded-full", item.dot)} />
                           </div>
                           <span className="text-[9px] font-black text-gray-300 uppercase block mb-1">Water Level</span>
                           <div className="flex justify-between items-baseline">
                              <div className="text-xl font-black text-zinc-900 tracking-tighter italic">{item.val}</div>
                              <div className={cn("text-[9px] font-black uppercase tracking-widest", item.color)}>{item.status}</div>
                           </div>
                           {item.icon && <item.icon className="absolute bottom-4 right-4 w-4 h-4 text-gray-300" />}
                        </div>
                      ))}
                   </div>

                   <button className="w-full py-4 bg-zinc-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-zinc-900/10">
                      <Settings className="w-4 h-4" />
                      Configure Sensors
                   </button>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
