"use client";

import { X, MapPin, Camera, ChevronRight, AlertTriangle, Info, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, subtitle, icon }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 {icon && <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-brand-red">{icon}</div>}
                 <div className="flex flex-col">
                    <h2 className="text-xl font-black text-zinc-900 italic uppercase tracking-tight leading-none">{title}</h2>
                    {subtitle && <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{subtitle}</p>}
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function HazardsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const hazards = [
    {
      severity: "high",
      title: "Rapid Water Level Rise",
      description: "Kalu Ganga water levels exceeding critical threshold at Kalutara bridge point. Immediate evacuation advised for low-lying areas.",
      meta: "12 mins ago",
      dist: "500m away",
    },
    {
      severity: "medium",
      title: "Road Obstruction",
      description: "Fallen tree blocking Galle Road near Sector 4 junction. Emergency crews dispatched. Use alternative routes.",
      meta: "45 mins ago",
      dist: "1.2km away",
    },
    {
      severity: "low",
      title: "Power Grid Maintenance",
      description: "Scheduled maintenance on local transformers. Intermittent outages possible.",
      meta: "2 hrs ago",
      dist: "2.5km away",
    }
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Nearby Active Hazards" 
      subtitle="Within 5km of your location"
      icon={<AlertTriangle className="w-6 h-6" />}
    >
      <div className="space-y-4">
        {hazards.map((hazard, idx) => (
          <div key={idx} className={cn(
            "p-5 rounded-2xl border transition-all hover:shadow-md",
            hazard.severity === "high" ? "border-red-200 bg-red-50/20" : 
            hazard.severity === "medium" ? "border-orange-200 bg-orange-50/20" : "border-yellow-200 bg-yellow-50/20"
          )}>
            <div className="flex justify-between items-start mb-3">
               <div className="flex items-center gap-2">
                 <span className={cn(
                   "text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase",
                   hazard.severity === "high" ? "bg-red-100 text-brand-red" : 
                   hazard.severity === "medium" ? "bg-orange-100 text-brand-orange" : "bg-yellow-100 text-brand-yellow"
                 )}>
                   {hazard.severity} severity
                 </span>
                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{hazard.meta}</span>
               </div>
               <div className="flex items-center gap-1 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                 <MapPin className="w-3 h-3" />
                 {hazard.dist}
               </div>
            </div>
            
            <h4 className="font-black text-zinc-900 mb-2 italic tracking-tight">{hazard.title}</h4>
            <p className="text-xs font-medium text-gray-500 leading-relaxed mb-4">{hazard.description}</p>
            
            <div className="flex gap-2">
              <button className="flex-1 bg-brand-red text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">
                Evacuation Map
              </button>
              <button className="flex-1 bg-white border border-gray-200 py-2 rounded-lg text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-50 transition-colors">
                Details
              </button>
            </div>
          </div>
        ))}
        
        <div className="pt-4 flex items-center justify-between">
           <button className="text-[10px] font-black text-brand-red uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
             View Full Map <ChevronRight className="w-3 h-3" />
           </button>
           <button 
             onClick={onClose}
             className="px-6 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold border border-gray-100"
           >
             Close
           </button>
        </div>
      </div>
    </Modal>
  );
}

export function ReportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="OUTBREAK" 
      subtitle="REPORT INCIDENT"
      icon={<Camera className="w-6 h-6" />}
    >
      <div className="space-y-6">
         <div className="space-y-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</span>
            <button className="w-full py-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-all active:scale-[0.98]">
               <MapPin className="w-4 h-4" />
               <span className="font-bold text-sm italic">Detect My Location</span>
            </button>
            <div className="flex items-center gap-2 px-2">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               <span className="text-[10px] text-gray-400 font-medium italic">GPS accuracy: ~5 meters</span>
            </div>
         </div>

         <div className="space-y-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incident Type</span>
            <select className="w-full p-4 rounded-2xl border border-gray-100 bg-white font-bold text-zinc-900 text-sm italic focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none appearance-none">
               <option>Select Damage Type...</option>
               <option>Flooding</option>
               <option>Landslide</option>
               <option>Structural Damage</option>
               <option>Road Block</option>
            </select>
         </div>

         <div className="space-y-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Evidence Photo</span>
            <div className="w-full aspect-video border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-4 group hover:border-brand-red/20 transition-all cursor-pointer bg-gray-50/50">
               <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-gray-300 group-hover:text-brand-red transition-colors">
                  <Camera className="w-6 h-6" />
               </div>
               <div className="text-center">
                  <p className="text-sm font-bold text-zinc-900 italic">Tap to take photo</p>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">or upload from gallery</p>
               </div>
            </div>
         </div>

         <div className="space-y-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</span>
            <textarea 
               placeholder="Describe the damage or situation briefly..."
               className="w-full h-32 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none transition-all placeholder:text-gray-300 font-medium text-sm"
            />
         </div>

         <button className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-xl shadow-orange-500/20 font-black text-xl italic tracking-tight uppercase flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
            <Send className="w-6 h-6" />
            Submit Report
         </button>
         
         <p className="text-[9px] text-gray-400 text-center font-bold italic">
           False reporting is a punishable offense under Emergency Regulations.
         </p>
      </div>
    </Modal>
  );
}
