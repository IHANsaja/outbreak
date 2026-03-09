"use client";
import React, { useState, useEffect } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Search, Map as MapIcon, Layers, Maximize2, ZoomIn, ZoomOut, AlertTriangle, ShieldCheck, Truck, ChevronRight, Zap, Radio, Globe, MapPin } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getAllIncidents, getRecentSos } from "@/app/actions/data";
import { cn } from "@/lib/utils";

export default function MapViewPage() {
  const { showToast } = showToastHook();
  const [zoom, setZoom] = useState(10);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [sosRequests, setSosRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState({
    traffic: true,
    shelters: true,
    incidents: true,
    towers: false
  });

  function showToastHook() {
      return useToast();
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [inc, sos] = await Promise.all([getAllIncidents(), getRecentSos()]);
        setIncidents(inc);
        setSosRequests(sos);
      } catch (err) {
        showToast("Error syncing map data", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    showToast(`${layers[layer] ? "Hidden" : "Showing"} ${layer} layer`, "info");
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(1, Math.min(20, zoom + delta));
    setZoom(newZoom);
    showToast(`Map Zoom: ${newZoom}z`, "info");
  };

  return (
    <AuthorityLayout>
      <div className="h-[calc(100vh-120px)] relative overflow-hidden rounded-[40px] border border-auth-border auth-card-shadow bg-slate-200">
        <div 
          className="absolute inset-0 bg-[#d1d5db] transition-all duration-700 ease-in-out" 
          style={{ 
            backgroundImage: 'url("https://www.google.com/maps/vt/pb=!1m5!1m4!1i10!2i768!3i448!2m3!1e0!2sm!3i624000000!3m8!2sen!3slk!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!5f2")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(0.5) contrast(0.8)',
            transform: `scale(${1 + (zoom - 10) * 0.05})`
          }}
        ></div>

        {layers.incidents && (
          <div className="absolute inset-0 pointer-events-none">
             {incidents.slice(0, 10).map((inc, i) => (
               <div key={inc.id} className="absolute" style={{ top: `${30 + i*12}%`, left: `${20 + i*15}%` }}>
                 <div className="w-4 h-4 bg-red-500 rounded-full animate-ping opacity-50" />
                 <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg pointer-events-auto cursor-pointer" 
                   onClick={() => showToast(`Incident: ${inc.itype}`, "info")} />
               </div>
             ))}
          </div>
        )}

        <div className="absolute top-6 left-6 flex gap-3">
           <div className="bg-[#0f172a] text-white p-6 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-md w-80">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                 <Globe className="w-3 h-3" /> GIS COMMAND
              </div>
              <h3 className="text-xl font-bold tracking-tight">National Situation Map</h3>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-xs text-slate-400 font-medium truncate">Live Feed Active • {incidents.length + sosRequests.length} Events</span>
              </div>
           </div>
        </div>

        <div className="absolute top-36 left-6 w-80 bg-[#0f172a]/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[calc(100%-180px)]">
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
                    location={`${sos.latitude.toFixed(2)}, ${sos.longitude.toFixed(2)}`} 
                    color="bg-red-500/20 text-red-400 border-red-500/30" 
                  />
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 text-[10px] font-bold uppercase tracking-widest">No active SOS reports</div>
              )}
           </div>
        </div>

        <div className="absolute top-6 right-6 flex flex-col gap-3">
           <div className="flex gap-2">
              <MapButton onClick={() => handleZoom(1)} icon={<ZoomIn className="w-5 h-5" />} />
              <MapButton onClick={() => handleZoom(-1)} icon={<ZoomOut className="w-5 h-5" />} />
              <MapButton onClick={() => showToast("Toggling Multi-spectrum Layer View", "info")} icon={<Layers className="w-5 h-5" />}  />
           </div>
        </div>

        <div className="absolute bottom-32 right-6 w-64 bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6">
           <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Map Layers</h4>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{Object.values(layers).filter(Boolean).length} Active</span>
           </div>
           
           <div className="space-y-4">
              <LayerToggle onClick={() => toggleLayer('traffic')} icon={<Truck className="w-4 h-4 text-blue-400" />} label="Traffic" active={layers.traffic} />
              <LayerToggle onClick={() => toggleLayer('shelters')} icon={<ShieldCheck className="w-4 h-4 text-green-400" />} label="Shelters" active={layers.shelters} />
              <LayerToggle onClick={() => toggleLayer('incidents')} icon={<AlertTriangle className="w-4 h-4 text-red-400" />} label="Incidents" active={layers.incidents} />
           </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0f172a]/95 backdrop-blur-xl px-10 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-12 text-white">
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

function MapButton({ icon, active = false, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-12 h-12 flex items-center justify-center rounded-xl border transition-all shadow-xl active:scale-90", 
      active ? "bg-red-600 border-red-500 text-white" : "bg-slate-900 border-white/10 text-slate-400 hover:text-white")}>
       {icon}
    </button>
  );
}

function LayerToggle({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className="flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-colors">{icon}</div>
          <span className={cn("text-xs font-medium transition-all", active ? "text-slate-100 font-bold" : "text-slate-500")}>{label}</span>
       </div>
       <div className={cn("w-10 h-5 rounded-full relative transition-all duration-300", active ? "bg-red-500" : "bg-slate-700")}>
          <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-md", active ? "translate-x-6" : "translate-x-1")}></div>
       </div>
    </div>
  );
}
