"use client";

import { 
  ArrowLeft, 
  Navigation, 
  MapPin, 
  ChevronRight, 
  CornerUpRight, 
  ArrowUp, 
  CornerUpLeft, 
  Flag, 
  Wifi, 
  Share2,
  X,
  Plus,
  Minus,
  Navigation2,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

const directions = [
  { id: 1, type: "start", text: "Your Location", subtext: "Start moving North", icon: MapPin, color: "text-green-500" },
  { id: 2, type: "turn-right", text: "Turn Right", subtext: "Onto Galle Rd (Avoid low lands)", icon: CornerUpRight, color: "text-zinc-900", badge: "SAFE ZONE" },
  { id: 3, type: "straight", text: "Continue Straight", subtext: "2.5km towards Temple Rd", icon: ArrowUp, color: "text-gray-400" },
  { id: 4, type: "turn-left", text: "Turn Left", subtext: "Into School Lane", icon: CornerUpLeft, color: "text-gray-400" },
  { id: 5, type: "end", text: "Destination", subtext: "Panadura North Relief Center", icon: Flag, color: "text-blue-500" },
];

export default function NavigationPage() {
  const [activeStep, setActiveStep] = useState(2);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
                <Navigation className="w-4 h-4 text-white fill-white" />
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-zinc-900 leading-none">OUTBREAK</span>
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Safe Route Navigation</span>
             </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
             <button className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-white text-zinc-900 shadow-sm">Map View</button>
             <button className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md text-gray-400 hover:text-zinc-900">Satellite</button>
           </div>
           <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
           </Link>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Directions */}
        <aside className="w-full md:w-[350px] border-r border-gray-100 flex flex-col bg-white">
           <div className="p-6 border-b border-gray-50">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Safe Route Active</span>
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 uppercase">ETA: 18 min</span>
              </div>
              
              <h2 className="text-xl font-black text-zinc-900 italic tracking-tight mb-1">To: Panadura North Relief Center</h2>
              <p className="text-[10px] font-medium text-gray-400 mb-6">Via Kalutara-Matugama Rd (Flood-free zone)</p>
              
              <div className="flex gap-2">
                 <button className="flex-1 bg-brand-red hover:bg-red-600 text-white font-black py-3 rounded-xl shadow-lg shadow-red-900/10 transition-all flex items-center justify-center gap-2 italic text-sm">
                    <Navigation2 className="w-4 h-4 fill-white" />
                    Start Navigation
                 </button>
                 <button className="p-3 bg-gray-50 text-zinc-900 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                    <Share2 className="w-4 h-4" />
                 </button>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              {directions.map((step, idx) => (
                <div key={step.id} className={cn(
                  "relative flex gap-4 transition-opacity",
                  idx > activeStep - 1 ? "opacity-30" : "opacity-100"
                )}>
                  {idx !== directions.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-32px] w-0.5 bg-gray-50" />
                  )}
                  
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 border-white ring-1 ring-gray-100 flex items-center justify-center shrink-0 z-10",
                    idx === activeStep - 1 ? "bg-brand-red text-white" : "bg-gray-50 text-gray-300"
                  )}>
                    <step.icon className="w-3 h-3" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                       <h3 className={cn("text-xs font-black italic uppercase", step.color)}>{step.text}</h3>
                       {step.badge && (
                         <span className="px-1.5 py-0.5 bg-green-50 text-[8px] font-black text-green-600 rounded uppercase tracking-widest border border-green-100">
                           {step.badge}
                         </span>
                       )}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{step.subtext}</p>
                  </div>
                </div>
              ))}
           </div>
           
           {/* Alert Footer */}
           <div className="p-4 bg-red-50/30 border-t border-red-100 m-4 rounded-xl">
              <div className="flex gap-3">
                 <AlertTriangle className="w-4 h-4 text-brand-red shrink-0" />
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">Blocked Route Alert</span>
                    <p className="text-[9px] font-medium text-gray-500 leading-relaxed mt-1">
                      Main highway bridge is submerged. Route automatically rerouted to avoid sector 4.
                    </p>
                 </div>
              </div>
           </div>
        </aside>
        
        {/* Main Map View */}
        <main className="flex-1 relative bg-blue-50">
           {/* Mock Map Image */}
           <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/79.95,6.65,12.5,0/1200x800?access_token=pk.eyJ1IjoiYm9vdGciLCJhIjoiY2toZ3p4Z3p4MDZ6eDJ4bzR4Z3p4Z3p4ZSJ9.0')] bg-cover bg-center" />
           
           {/* Route Overlay SVG (Simulated) */}
           <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 1200 800">
                {/* Safe Route */}
                <path 
                  d="M1150,250 L1000,350 L850,450 L780,550 L650,650" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  strokeDasharray="12 8"
                  className="animate-[dash_20s_linear_infinite]"
                />
                {/* Blocked Route */}
                <path 
                  d="M780,550 L820,650 L840,750" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  opacity="0.8"
                />
              </svg>
           </div>
           
           {/* Map Controls */}
           <div className="absolute top-6 left-6 flex flex-col gap-2">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col p-1">
                <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50"><Plus className="w-4 h-4 text-gray-600" /></button>
                <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors"><Minus className="w-4 h-4 text-gray-600" /></button>
              </div>
              <button className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <Navigation2 className="w-4 h-4 text-zinc-900 fill-zinc-900" />
              </button>
           </div>
           
           {/* Map Tooltip */}
           <div className="absolute bottom-[35%] right-[25%] -translate-x-1/2">
              <div className="bg-[#1e293b] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2">
                 Turn Left <ChevronRight className="w-3 h-3 text-brand-red" />
              </div>
           </div>
           
           {/* Map Legend */}
           <div className="absolute bottom-6 right-6 flex flex-col gap-2">
              <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100 space-y-3 min-w-[150px]">
                 <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full" />
                       <span className="text-[10px] font-bold text-gray-600">Safe Route</span>
                    </div>
                 </div>
                 <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-red-500 rounded-full" />
                       <span className="text-[10px] font-bold text-gray-600">Blocked / Danger</span>
                    </div>
                 </div>
                 <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 bg-blue-50 rounded-md flex items-center justify-center">
                          <Flag className="w-3 h-3 text-blue-500" />
                       </div>
                       <span className="text-[10px] font-bold text-gray-600">Relief Center</span>
                    </div>
                 </div>
              </div>
           </div>
        </main>
      </div>
      
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
