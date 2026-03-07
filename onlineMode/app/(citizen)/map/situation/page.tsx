"use client";

import { 
  ArrowLeft, 
  Map as MapIcon, 
  Layers, 
  Search, 
  Plus, 
  Minus, 
  Navigation2, 
  Shield, 
  PlusSquare, 
  AlertTriangle, 
  Droplets,
  Wifi,
  Maximize2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

const alerts = [
  { id: 1, severity: "critical", title: "Flash Flood Warning", subtext: "River Kalu water levels exceeding safe threshold. Evacuate low-lying areas.", time: "10m ago" },
  { id: 2, severity: "moderate", title: "Road Blockage", subtext: "Main street obstructed by fallen tree. Crews dispatched.", time: "45m ago" },
];

export default function SituationMapPage() {
  const [layers, setLayers] = useState({
    shelters: true,
    medical: true,
    hazards: true,
    water: false
  });

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
             <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
                <MapIcon className="w-5 h-5 text-white fill-white" />
             </div>
             <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-zinc-900 leading-none">OUTBREAK</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Live Situation Map</span>
             </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-brand-red rounded-full text-[10px] font-black tracking-widest uppercase ring-1 ring-red-100">
              <span className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
              Live Updates Active
           </div>
           
           <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-zinc-900 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 transition-all active:scale-95">
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
           </Link>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[300px] border-r border-gray-100 flex flex-col bg-white overflow-hidden">
           <div className="p-6 flex flex-col gap-8 flex-1 overflow-y-auto scrollbar-hide">
              {/* Layer Controls */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2 text-zinc-900 italic font-black text-sm uppercase">
                    <Layers className="w-4 h-4 text-gray-400" />
                    Map Layers
                 </div>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Toggle visibility of emergency resources.</p>
                 
                 <div className="space-y-4">
                    {[
                      { id: 'shelters', label: 'Shelters', sub: 'Safe zones & camps', icon: Shield, color: 'text-blue-500' },
                      { id: 'medical', label: 'Medical Points', sub: 'Hospitals & Clinics', icon: PlusSquare, color: 'text-green-500' },
                      { id: 'hazards', label: 'Hazard Zones', sub: 'Floods, Landslides', icon: AlertTriangle, color: 'text-red-500' },
                      { id: 'water', label: 'Water Levels', sub: 'River gauges', icon: Droplets, color: 'text-orange-500' },
                    ].map((layer) => (
                      <div key={layer.id} className="flex items-center justify-between group">
                         <div className="flex gap-3 items-center">
                            <div className={cn("w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-colors group-hover:bg-white border border-transparent group-hover:border-gray-100", layer.color)}>
                               <layer.icon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[11px] font-black text-zinc-900 italic uppercase leading-none">{layer.label}</span>
                               <span className="text-[9px] font-medium text-gray-400 mt-0.5">{layer.sub}</span>
                            </div>
                         </div>
                         <button 
                           onClick={() => setLayers(prev => ({ ...prev, [layer.id]: !prev[layer.id as keyof typeof prev] }))}
                           className={cn(
                             "w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none",
                             layers[layer.id as keyof typeof layers] ? "bg-brand-red" : "bg-gray-200"
                           )}
                         >
                            <div className={cn(
                              "absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 shadow-sm",
                              layers[layer.id as keyof typeof layers] ? "translate-x-5" : "translate-x-0"
                            )} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Nearby Alerts */}
              <div className="space-y-6">
                 <h3 className="text-zinc-900 font-black text-sm italic uppercase">Nearby Alerts</h3>
                 <div className="space-y-3">
                    {alerts.map(alert => (
                      <div key={alert.id} className={cn(
                        "p-4 rounded-xl border flex flex-col gap-2 transition-all hover:shadow-md cursor-default",
                        alert.severity === 'critical' ? "bg-red-50/30 border-red-100" : "bg-orange-50/30 border-orange-100"
                      )}>
                         <div className="flex justify-between items-center">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                              alert.severity === 'critical' ? "bg-red-100 text-brand-red" : "bg-orange-100 text-brand-orange"
                            )}>{alert.severity}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">{alert.time}</span>
                         </div>
                         <h4 className="text-[11px] font-black text-zinc-900 italic uppercase leading-tight">{alert.title}</h4>
                         <p className="text-[9px] font-medium text-gray-500 leading-relaxed">{alert.subtext}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
           
           {/* Bottom Bar */}
           <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Wifi className="w-3 h-3 text-gray-400" />
                 <span className="text-[9px] font-black text-zinc-900 italic uppercase">Network Status</span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Just now</span>
           </div>
        </aside>
        
        {/* Main Map View */}
        <main className="flex-1 relative bg-blue-50">
           {/* Mock Map Image */}
           <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/79.95,6.65,11,0/1200x800?access_token=pk.eyJ1IjoiYm9vdGciLCJhIjoiY2toZ3p4Z3p4MDZ6eDJ4bzR4Z3p4Z3p4ZSJ9.0')] bg-cover bg-center" />
           
           {/* Overlay Markers */}
           <div className="absolute inset-0 pointer-events-none">
              {/* User Location */}
              <div className="absolute top-[60%] left-[60%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto group">
                 <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-2xl relative border-2 border-blue-500 ring-4 ring-blue-500/10">
                       <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white px-2 py-1 rounded shadow-lg border border-gray-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[9px] font-black text-zinc-900 italic uppercase">You are here</span>
                    </div>
                 </div>
              </div>

              {/* Hazard Zone Circle */}
              <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2">
                 <div className="w-[180px] h-[180px] rounded-full bg-red-500/10 border-2 border-red-500/30 animate-pulse flex items-center justify-center p-2">
                    <div className="w-12 h-12 rounded-full border border-red-500/20 bg-white/20 blur-sm absolute" />
                    <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg relative">
                       <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 rounded shadow-lg border border-gray-100">
                       <span className="text-[9px] font-black text-zinc-900 italic uppercase">Waskaduwa Zone</span>
                    </div>
                 </div>
              </div>

              {/* Shelters */}
              <div className="absolute top-[35%] left-[70%] pointer-events-auto">
                 <div className="w-7 h-7 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer">
                    <Shield className="w-4 h-4" />
                 </div>
              </div>

              {/* Medical */}
              <div className="absolute top-[65%] left-[72%] pointer-events-auto">
                 <div className="w-7 h-7 bg-red-600 text-white rounded-lg flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer">
                    <PlusSquare className="w-4 h-4" />
                 </div>
              </div>

              {/* Warning Point */}
              <div className="absolute top-[65%] left-[52%] pointer-events-auto">
                 <div className="w-7 h-7 bg-green-500 text-white rounded-lg flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer">
                    <Plus className="w-4 h-4" />
                 </div>
              </div>
           </div>
           
           {/* Map UI Elements */}
           <div className="absolute top-6 right-6 space-y-3">
              <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100 space-y-3 min-w-[150px]">
                 <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block border-b border-gray-50 pb-2">Zone Status</span>
                 <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                       <span className="text-[10px] font-bold text-gray-600">Danger Zone</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                       <span className="text-[10px] font-bold text-gray-600">Warning Zone</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                       <span className="text-[10px] font-bold text-gray-600">Safe Zone</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="absolute bottom-6 right-6 flex flex-col gap-2">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col p-1 uppercase">
                 <button className="p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100"><Maximize2 className="w-4 h-4 text-gray-600" /></button>
                 <button className="p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100"><Plus className="w-4 h-4 text-gray-600" /></button>
                 <button className="p-3 hover:bg-gray-50 rounded-lg transition-colors"><Minus className="w-4 h-4 text-gray-600" /></button>
              </div>
              <button className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <Navigation2 className="w-5 h-5 text-zinc-900 fill-zinc-900" />
              </button>
           </div>
        </main>
      </div>
      
      <style jsx global>{`
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
