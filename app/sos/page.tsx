"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  PlusSquare, 
  LifeBuoy, 
  Droplets, 
  Flame, 
  MapPin, 
  Send,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  { id: "medical", name: "MEDICAL", icon: PlusSquare },
  { id: "rescue", name: "RESCUE", icon: LifeBuoy },
  { id: "supplies", name: "SUPPLIES", icon: Droplets },
  { id: "fire", name: "FIRE", icon: Flame },
];

export default function SOSPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar type="sos" backHref="/" />
      
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-black text-zinc-900 text-center mb-4 tracking-tight">
          What kind of help do you need?
        </h1>
        <p className="text-gray-500 text-sm font-medium mb-12 text-center max-w-md">
          Select a category below to alert the nearest responders immediately.
        </p>
        
        <div className="grid grid-cols-2 gap-6 w-full mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={cn(
                "group aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all active:scale-95",
                selected === cat.id 
                  ? "bg-white border-brand-red shadow-xl ring-4 ring-brand-red/5" 
                  : "bg-white border-gray-100 hover:border-gray-200"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                selected === cat.id ? "bg-red-50 text-brand-red" : "bg-gray-50 text-slate-400 group-hover:bg-gray-100"
              )}>
                <cat.icon className="w-8 h-8" />
              </div>
              <span className={cn(
                "font-black tracking-widest text-xs italic",
                selected === cat.id ? "text-brand-red" : "text-slate-900"
              )}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
        
        <div className="w-full space-y-8">
           <div className="space-y-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Additional Information (Optional)</span>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="E.g., Number of people, specific injuries, blocked access..."
                className="w-full h-32 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none transition-all placeholder:text-gray-300 font-medium text-sm"
              />
           </div>
           
           <div className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                 <MapPin className="w-4 h-4 text-brand-red" />
              </div>
              <span className="text-[10px] font-bold text-slate-600">
                Pinning location: <span className="text-slate-900">6.9271° N, 79.8612° E</span> (Accurate to 5m)
              </span>
           </div>

           <button 
             disabled={!selected}
             className={cn(
               "w-full py-6 rounded-2xl shadow-2xl transition-all font-black text-2xl md:text-3xl italic tracking-tighter uppercase flex flex-col items-center justify-center gap-2",
               selected 
                ? "emergency-gradient text-white shadow-red-900/20 active:scale-95 hover:shadow-red-900/30" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
             )}
           >
             SEND SOS
             <span className="text-[10px] tracking-[0.2em] font-black opacity-60">ALERTS NEAREST RESPONSE TEAM</span>
           </button>
           
           <p className="text-[10px] text-gray-400 text-center font-medium max-w-sm mx-auto leading-relaxed italic">
             By tapping "Send SOS", you consent to sharing your live location and medical profile with emergency services. Misuse constitutes a punishable offense.
           </p>
        </div>
        
      </main>
      
      <Footer />
    </div>
  );
}
