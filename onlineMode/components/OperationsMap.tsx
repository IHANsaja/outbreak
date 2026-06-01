"use client";

import React from "react";
import { MapPin, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

interface OperationsMapProps {
  incidents: any[];
  sos: any[];
  stations: any[];
  selectedStationId?: number;
}

export default function OperationsMap({ incidents = [], sos = [], stations = [], selectedStationId }: OperationsMapProps) {
  // Simple mapping function to scale lat/lng to a 0-100 percentage
  // Sri Lanka bounds (approx): Lat 5.9 to 9.9, Lng 79.6 to 81.9
  const mapCoords = (lat: number, lng: number) => {
    const latMin = 5.9, latMax = 9.9;
    const lngMin = 79.6, lngMax = 81.9;
    
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100; // Flip Y for screen coords
    
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  return (
    <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden group">
      <div className="p-6 border-b border-zinc-50 flex justify-between items-center bg-white">
        <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2 italic tracking-tight">
          Operations Map
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </h3>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Incident</span>
           </div>
           <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Stations</span>
           </div>
        </div>
      </div>
      
      <div className="h-80 bg-zinc-50 relative flex items-center justify-center overflow-hidden">
        {/* Tactical Grid Background */}
        <div 
          className="absolute inset-0 grayscale opacity-40 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />
        
        {/* Subtle Map Outline (Optional, but let's keep it minimal like requested) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
           <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Sri_Lanka_location_map.svg" alt="" className="h-full object-contain grayscale" />
        </div>

        <div className="relative w-full h-full p-8">
           {/* Render River Stations */}
           {stations.map((s) => {
              if (!s.latitude || !s.longitude) return null;
              const { x, y } = mapCoords(s.latitude, s.longitude);
              const isSelected = s.id === selectedStationId;
              const status = s.water_level_now >= s.major_flood ? 'major' :
                             s.water_level_now >= s.minor_flood ? 'minor' :
                             s.water_level_now >= s.alert_level ? 'alert' : 'normal';

              return (
                 <div 
                    key={`station-${s.id}`} 
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 group/marker"
                    style={{ top: `${y}%`, left: `${x}%`, zIndex: isSelected ? 50 : 10 }}
                 >
                    {status !== 'normal' && (
                       <div className={cn(
                          "w-4 h-4 rounded-full animate-ping absolute -inset-0.5",
                          status === 'major' ? "bg-red-400" : "bg-orange-400"
                       )} />
                    )}
                    <div className={cn(
                       "w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm cursor-help transition-transform relative",
                       status === 'major' ? "bg-red-500" :
                       status === 'minor' ? "bg-orange-500" :
                       status === 'alert' ? "bg-yellow-500" : "bg-blue-500",
                       isSelected && "scale-150 ring-4 ring-blue-500/20"
                    )}>
                        {/* Permanent Water Level Label */}
                        <div className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
                           <div className={cn(
                              "px-1.5 py-0.5 rounded-md text-[8px] font-black shadow-sm border border-white/20 backdrop-blur-md flex items-center gap-1",
                              status === 'major' ? "bg-red-500 text-white" :
                              status === 'minor' ? "bg-orange-500 text-white" :
                              status === 'alert' ? "bg-yellow-500 text-white" : "bg-zinc-900/80 text-white"
                           )}>
                              {s.water_level_now.toFixed(1)}m
                              {s.forecast_12h > s.water_level_now ? (
                                 <span className="text-[6px]">▲</span>
                              ) : (
                                 <span className="text-[6px]">▼</span>
                              )}
                           </div>
                        </div>

                        {/* Hover Deep-Dive Tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover/marker:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] translate-y-2 group-hover/marker:translate-y-0">
                           <div className="bg-zinc-900 text-white p-3 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-2 min-w-[140px] backdrop-blur-md bg-zinc-900/90">
                              <div className="flex flex-col border-b border-white/5 pb-2 mb-1">
                                 <span className="text-[10px] font-black uppercase tracking-widest">{s.name}</span>
                                 <span className="text-[8px] font-bold text-zinc-500 italic">{s.river}</span>
                              </div>
                              
                              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter">
                                 <span className="text-zinc-400">Current</span>
                                 <span className="text-white bg-white/5 px-1.5 py-0.5 rounded">{s.water_level_now.toFixed(2)}m</span>
                              </div>
                              
                              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter">
                                 <span className="text-zinc-400">12H Pred</span>
                                 <span className={cn(
                                    "px-1.5 py-0.5 rounded",
                                    s.forecast_12h > s.water_level_now ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                                 )}>{s.forecast_12h.toFixed(2)}m</span>
                              </div>

                              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter">
                                 <span className="text-zinc-400">24H Pred</span>
                                 <span className={cn(
                                    "px-1.5 py-0.5 rounded",
                                    s.forecast_24h > s.water_level_now ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                                 )}>{s.forecast_24h.toFixed(2)}m</span>
                              </div>
                           </div>
                        </div>
                    </div>
                 </div>
              );
           })}

           {/* Render Real Incidents */}
           {incidents.map((inc) => {
              if (!inc.latitude || !inc.longitude) return null;
              const { x, y } = mapCoords(inc.latitude, inc.longitude);
              return (
                 <div 
                    key={`inc-${inc.id}`} 
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ top: `${y}%`, left: `${x}%`, zIndex: 30 }}
                 >
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                    <div className="w-2 h-2 bg-red-600 rounded-full border border-white" />
                 </div>
              );
           })}

           {/* Render SOS Requests */}
           {sos.map((s) => {
              if (!s.latitude || !s.longitude) return null;
              const { x, y } = mapCoords(s.latitude, s.longitude);
              return (
                 <div 
                    key={`sos-${s.id}`} 
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ top: `${y}%`, left: `${x}%`, zIndex: 40 }}
                 >
                    <MapPin className="w-3 h-3 text-orange-500 fill-orange-500/20" />
                 </div>
              );
           })}
        </div>

        <div className="absolute bottom-4 w-full text-[10px] font-black text-zinc-300 uppercase tracking-widest text-center pointer-events-none">
          Active Incident Simulation View
        </div>
      </div>
    </div>
  );
}
