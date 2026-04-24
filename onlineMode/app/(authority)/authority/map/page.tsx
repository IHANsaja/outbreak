"use client";
import React, { useState, useEffect } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Search, Map as MapIcon, Layers, Maximize2, ZoomIn, ZoomOut, AlertTriangle, ShieldCheck, Truck, ChevronRight, Zap, Radio, Globe, MapPin } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getAllIncidents, getActiveSosRequests, getActiveHazards } from "@/app/actions/data";
import { cn } from "@/lib/utils";
import SituationMap from "@/components/SituationMap";

export default function MapViewPage() {
  const { showToast } = useToast();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [sosRequests, setSosRequests] = useState<any[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [inc, sos, haz] = await Promise.all([
          getAllIncidents(), 
          getActiveSosRequests(),
          getActiveHazards()
        ]);
        setIncidents(inc);
        setSosRequests(sos);
        setHazards(haz);
      } catch (err) {
        showToast("Error syncing map data", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <AuthorityLayout>
      <div className="h-[calc(100vh-120px)] relative overflow-hidden rounded-[40px] border border-auth-border auth-card-shadow bg-slate-200">
        
        {/* Real Dynamic Map */}
        <div className="absolute inset-0">
          <SituationMap 
            hazards={hazards} 
            incidents={incidents} 
            needs={sosRequests} 
            userLocation={[6.9271, 79.8612]} 
          />
        </div>

        <div className="absolute top-6 left-6 flex gap-3 z-[1001]">
           <div className="bg-[#0f172a] text-white p-6 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-md w-80">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                 <Globe className="w-3 h-3" /> GIS COMMAND
              </div>
              <h3 className="text-xl font-bold tracking-tight">National Situation Map</h3>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-xs text-slate-400 font-medium truncate">Live Feed Active • {incidents.length + sosRequests.length + hazards.length} Events</span>
              </div>
           </div>
        </div>

        <div className="absolute top-36 left-6 w-80 bg-[#0f172a]/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[calc(100%-180px)] z-[1001]">
           <div className="p-6 border-b border-white/10 flex flex-col gap-4">
              <div className="flex justify-between items-center text-white">
                 <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">Active Alerts</span>
                 </div>
                 <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-widest">Real-time</span>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)
               ) : sosRequests.length > 0 ? (
                 sosRequests.map(sos => (
                   <ReportCard 
                     key={sos.id}
                     type="SOS" 
                     title={sos.stype} 
                     sub={sos.additional_info || "Urgent assistance requested."} 
                     time={new Date(sos.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                     location={`${parseFloat(sos.latitude).toFixed(2)}, ${parseFloat(sos.longitude).toFixed(2)}`} 
                     color="bg-red-500/20 text-red-400 border-red-500/30" 
                   />
                 ))
               ) : (
                <div className="text-center py-10 text-slate-500 text-[10px] font-bold uppercase tracking-widest">No active SOS reports</div>
              )}
           </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0f172a]/95 backdrop-blur-xl px-10 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-12 text-white z-[1001]">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-500 uppercase">Center:</span>
               <span className="text-xs font-mono">6.9271°N, 79.8612°E</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-12">
               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PostgreSQL Realtime Sync</span>
            </div>
        </div>
      </div>
    </AuthorityLayout>
  );
}

function ReportCard({ type, title, sub, time, location, color }: any) {
  const { showToast } = useToast();
  return (
    <div onClick={() => showToast(`Locating Report: ${title}`, "info")} className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group">
       <div className="flex justify-between items-start mb-2">
          <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest", color)}>
             {type}
          </span>
          <span className="text-[9px] text-slate-500 font-bold uppercase">{time}</span>
       </div>
       <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors leading-tight uppercase">{title}</h4>
       <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-1">{sub}</p>
       <div className="mt-2 flex items-center gap-2 text-[9px] text-slate-500 font-medium">
          <MapPin className="w-3 h-3" /> {location}
       </div>
    </div>
  );
}
