"use client";
import React, { useState } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Search, Map as MapIcon, Layers, Maximize2, ZoomIn, ZoomOut, AlertTriangle, ShieldCheck, Truck, ChevronRight, Zap } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function MapViewPage() {
  const { showToast } = useToast();
  const [zoom, setZoom] = useState(10);
  const [layers, setLayers] = useState({
    traffic: true,
    shelters: true,
    incidents: true,
    towers: false
  });

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
        {/* Mock Map Background Layer */}
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

        {/* Heatmap Overlays (Visible if incidents layer active) */}
        {layers.incidents && (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 blur-[100px] rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-orange-500/10 blur-[80px] rounded-full"></div>
          </>
        )}

        {/* Top Floating Controls */}
        <div className="absolute top-6 left-6 flex gap-3">
           <div className="bg-[#0f172a] text-white p-6 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-md w-80">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                 <Globe className="w-3 h-3" /> GIS COMMAND
              </div>
              <h3 className="text-xl font-bold tracking-tight">National Situation Map</h3>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-xs text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Live Feed Active • Sri Lanka Region</span>
              </div>
           </div>
        </div>

        {/* Report Sidebar Overlay */}
        <div className="absolute top-36 left-6 w-80 bg-[#0f172a]/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[calc(100%-180px)]">
           <div className="p-6 border-b border-white/10 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Citizen Reports</span>
                 </div>
                 <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-widest">Live</span>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input 
                   type="text" 
                   placeholder="Filter by keyword..." 
                   className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-slate-600"
                 />
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
              <ReportCard type="SOS" title="Trapped in flooded building" sub="Water level rising rapidly on 2nd floor, 3 people including elderly." time="Just now" location="Galle, Ward 4" color="bg-red-500/20 text-red-400 border-red-500/30" />
              <ReportCard type="Hazard" title="Bridge Collapse" sub="Main access bridge to Matara is heavily damaged. Unsafe for vehicles." time="2m ago" location="Matara Main Rd" color="bg-orange-500/20 text-orange-400 border-orange-500/30" />
              <ReportCard type="Info" title="Clear Path Verified" sub="Route A2 is clear of debris. Safe for emergency convoys." time="15m ago" location="Route A2, South" color="bg-blue-500/20 text-blue-400 border-blue-500/30" />
              <ReportCard type="Power" title="Grid Failure" sub="Entire sector 7 without power. Hospital running on backup generators." time="23m ago" location="Kandy District" color="bg-yellow-500/20 text-yellow-400 border-yellow-500/30" />
           </div>

           <div className="p-4 border-t border-white/10 text-center">
              <button 
                onClick={() => showToast("Opening Full Citizen Report Feed", "info")}
                className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                 View All Reports <ChevronRight className="w-3 h-3" />
              </button>
           </div>
        </div>

        {/* Layer Controls (Top Right) */}
        <div className="absolute top-6 right-6 flex flex-col gap-3">
           <div className="flex gap-2">
              <MapButton onClick={() => showToast("Layer Inspector Protocols Initiated", "info")} icon={<Layers className="w-5 h-5" />} />
              <MapButton onClick={() => handleZoom(1)} icon={<ZoomIn className="w-5 h-5" />} />
              <MapButton onClick={() => handleZoom(-1)} icon={<ZoomOut className="w-5 h-5" />} />
              <MapButton onClick={() => showToast("Exiting Immersive GIS Mode", "info")} icon={<Maximize2 className="w-5 h-5" />} active={true} />
           </div>
        </div>

        {/* Map Layers Panel (Bottom Right) */}
        <div className="absolute bottom-32 right-6 w-64 bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6">
           <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Map Layers</h4>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{Object.values(layers).filter(Boolean).length} Active</span>
           </div>
           
           <div className="space-y-4">
              <LayerToggle 
                onClick={() => toggleLayer('traffic')}
                icon={<Truck className="w-4 h-4 text-blue-400" />} 
                label="Traffic Density" 
                active={layers.traffic} 
              />
              <LayerToggle 
                onClick={() => toggleLayer('shelters')}
                icon={<ShieldCheck className="w-4 h-4 text-green-400" />} 
                label="Shelters" 
                active={layers.shelters} 
              />
              <LayerToggle 
                onClick={() => toggleLayer('incidents')}
                icon={<AlertTriangle className="w-4 h-4 text-red-400" />} 
                label="Live Incidents" 
                active={layers.incidents} 
              />
              <LayerToggle 
                onClick={() => toggleLayer('towers')}
                icon={<Zap className="w-4 h-4 text-purple-400" />} 
                label="Comm. Towers" 
                active={layers.towers} 
              />
           </div>
        </div>

        {/* Coordinates Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0f172a]/95 backdrop-blur-xl px-10 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-12">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-500 uppercase">Lat:</span>
               <span className="text-sm font-mono text-white">6.9271° N</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-500 uppercase">Long:</span>
               <span className="text-sm font-mono text-white">79.8612° E</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-12">
               <span className="text-[10px] font-bold text-slate-500 uppercase">Scale:</span>
               <span className="text-xs font-bold text-white uppercase tracking-wider">1:{50000 / (1 + (zoom-10)*0.1)}</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-12">
               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Data Sync: Stable (12ms)</span>
            </div>
        </div>
      </div>
    </AuthorityLayout>
  );
}

function ReportCard({ type, title, sub, time, location, color }: any) {
  const { showToast } = useToast();
  return (
    <div 
      onClick={() => showToast(`Locating Report: ${title}`, "info")}
      className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group"
    >
       <div className="flex justify-between items-start mb-2">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${color}`}>
             {type}
          </span>
          <span className="text-[9px] text-slate-500 font-bold uppercase">{time}</span>
       </div>
       <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors leading-tight">{title}</h4>
       <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">{sub}</p>
       <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
          <MapIcon className="w-3 h-3" /> {location}
       </div>
    </div>
  );
}

function MapButton({ icon, active = false, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all shadow-xl active:scale-90 ${
      active 
        ? "bg-red-600 border-red-500 text-white shadow-red-600/20" 
        : "bg-[#0f172a]/95 backdrop-blur-xl border-white/10 text-slate-400 hover:text-white hover:border-white/20"
    }`}>
       {icon}
    </button>
  );
}

function LayerToggle({ icon, label, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform"
    >
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-colors">
             {icon}
          </div>
          <span className={`text-xs font-medium transition-all ${active ? "text-slate-100 font-bold" : "text-slate-500"}`}>{label}</span>
       </div>
       <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${active ? "bg-red-500" : "bg-slate-700"}`}>
          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-md ${active ? "translate-x-6" : "translate-x-1"}`}></div>
       </div>
    </div>
  );
}

function Globe(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  );
}

function Radio(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/></svg>
  );
}
