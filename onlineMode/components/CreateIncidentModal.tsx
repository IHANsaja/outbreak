"use client";
import React, { useState } from "react";
import { 
  X, 
  AlertCircle, 
  MapPin, 
  ChevronDown, 
  PlusCircle, 
  Info,
  Shield,
  Zap,
  Activity,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateIncidentModal({ isOpen, onClose }: CreateIncidentModalProps) {
  const { showToast } = useToast();
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      showToast("Incident reported successfully. Digital relief channels active.", "success");
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 pb-4 flex justify-between items-start">
              <div className="flex gap-5">
                 <div className="w-14 h-14 bg-auth-accent-red/10 rounded-2xl flex items-center justify-center border border-auth-accent-red/20 shrink-0">
                    <PlusCircle className="w-7 h-7 text-auth-accent-red" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Report New Incident</h2>
                    <p className="text-slate-500 text-sm mt-1">Initiate emergency protocol and resource allocation.</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900 disabled:opacity-30"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  {/* Incident Type */}
                  <div className="space-y-3">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Incident Type</label>
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                           <Activity className="w-5 h-5" />
                        </div>
                        <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all cursor-pointer">
                           <option value="">Select Type</option>
                           <option>Flash Flood</option>
                           <option>Disease Outbreak</option>
                           <option>Earthquake</option>
                           <option>Industrial Hazard</option>
                           <option>Wildfire</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                     </div>
                  </div>

                  {/* Region */}
                  <div className="space-y-3">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Affected Region</label>
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                           <MapPin className="w-5 h-5" />
                        </div>
                        <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all cursor-pointer">
                           <option value="">Select Region</option>
                           <option>Western Province</option>
                           <option>Central Province</option>
                           <option>Southern Province</option>
                           <option>North Western Province</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                     </div>
                  </div>
               </div>

               {/* Severity Level */}
               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Severity Level</label>
                  <div className="grid grid-cols-4 gap-4">
                     <SeverityButton active={severity === "low"} onClick={() => setSeverity("low")} label="LOW" color="green" />
                     <SeverityButton active={severity === "medium"} onClick={() => setSeverity("medium")} label="MEDIUM" color="yellow" />
                     <SeverityButton active={severity === "high"} onClick={() => setSeverity("high")} label="HIGH" color="orange" />
                     <SeverityButton active={severity === "critical"} onClick={() => setSeverity("critical")} label="CRITICAL" color="red" />
                  </div>
               </div>

               {/* Description */}
               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Situation Description</label>
                  <textarea 
                     required
                     placeholder="Provide detailed information about the incident..."
                     className="w-full h-32 bg-slate-50 border border-slate-200 rounded-[24px] p-6 text-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all resize-none leading-relaxed"
                  ></textarea>
               </div>

               {/* Actions */}
               <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 py-5 rounded-[24px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest text-sm"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] bg-slate-900 border-b-4 border-slate-950 hover:bg-slate-800 text-white py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 transition-all active:translate-y-1 active:border-b-0 disabled:bg-slate-400 disabled:border-slate-500"
                  >
                     {isSubmitting ? (
                        <>
                           <Loader2 className="w-5 h-5 animate-spin" />
                           CREATING INCIDENT...
                        </>
                     ) : (
                        <>
                           <Zap className="w-5 h-5 fill-white" />
                           TRIGGER DIGITAL SUPPORT
                        </>
                     )}
                  </button>
               </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SeverityButton({ active, onClick, label, color }: any) {
   const colorMap = {
      green: active ? "bg-green-50 border-green-500 text-green-600" : "bg-slate-50/50 border-slate-100 text-slate-400 hover:border-green-200",
      yellow: active ? "bg-amber-50 border-amber-500 text-amber-600" : "bg-slate-50/50 border-slate-100 text-slate-400 hover:border-amber-200",
      orange: active ? "bg-orange-50 border-orange-500 text-orange-600" : "bg-slate-50/50 border-slate-100 text-slate-400 hover:border-orange-200",
      red: active ? "bg-red-50 border-red-500 text-red-600" : "bg-slate-50/50 border-slate-100 text-slate-400 hover:border-red-200",
   };

   return (
      <button 
         type="button"
         onClick={onClick}
         className={`py-4 rounded-2xl border-2 font-bold text-[10px] tracking-widest transition-all ${colorMap[color as keyof typeof colorMap]}`}
      >
         {label}
      </button>
   );
}
