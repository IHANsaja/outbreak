"use client";
import React, { useState } from "react";
import { 
  X, 
  Package, 
  Truck, 
  MapPin, 
  ChevronDown, 
  Calendar,
  Layers,
  Box,
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";

interface NewShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewShipmentModal({ isOpen, onClose }: NewShipmentModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      showToast("Shipment registered and tracking initiated.", "success");
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
            className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-start">
              <div className="flex gap-5">
                 <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
                    <Package className="w-7 h-7 text-blue-500" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">New Resource Shipment</h2>
                    <p className="text-slate-500 text-sm mt-1">Register supply chain movement and logistics.</p>
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

            {/* Progress Steps */}
            <div className="px-8 mt-4">
               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <StepIndicator icon={<Layers size={14}/>} active={step === 1} done={step > 1} label="Items" />
                  <ArrowRight size={14} className="text-slate-300" />
                  <StepIndicator icon={<Truck size={14}/>} active={step === 2} done={isSubmitting} label="Logistics" />
               </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
               {step === 1 ? (
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Resource Category</label>
                        <div className="relative">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                              <Box className="w-5 h-5" />
                           </div>
                           <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer">
                              <option>Medical Supplies</option>
                              <option>Food & Water</option>
                              <option>Infrastructure Equipment</option>
                              <option>Personnel Gear</option>
                           </select>
                           <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Quantity</label>
                           <input type="number" required placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Unit</label>
                           <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer">
                              <option>Kits</option>
                              <option>Metric Tons</option>
                              <option>Units</option>
                              <option>Pallets</option>
                           </select>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Destination Facility</label>
                        <div className="relative">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                              <MapPin className="w-5 h-5" />
                           </div>
                           <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer">
                              <option>Regional Hub A (Colombo)</option>
                              <option>Field Hospital Beta (Kandy)</option>
                              <option>Distribution Center (Galle)</option>
                           </select>
                           <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Estimated Arrival</label>
                        <div className="relative">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                              <Calendar className="w-5 h-5" />
                           </div>
                           <input type="datetime-local" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                        </div>
                     </div>
                  </div>
               )}

               {/* Actions */}
               <div className="flex gap-4 pt-2">
                  {step === 2 ? (
                     <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-8 py-5 rounded-[24px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                     >
                        Back
                     </button>
                  ) : null}
                  <button 
                    type={step === 2 ? "submit" : "button"}
                    onClick={step === 1 ? () => setStep(2) : undefined}
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] disabled:bg-slate-300"
                  >
                     {isSubmitting ? (
                        <>
                           <Loader2 className="w-5 h-5 animate-spin" />
                           REGISTERING...
                        </>
                     ) : (
                        <>
                           {step === 1 ? (
                              <>Next Step <ArrowRight className="w-5 h-5" /></>
                           ) : (
                              <>Initiate Shipment <Truck className="w-5 h-5" /></>
                           )}
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

function StepIndicator({ icon, active, done, label }: any) {
   return (
      <div className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all ${
         active ? "bg-white border-slate-200 shadow-sm text-blue-600" : 
         done ? "bg-green-50 border-green-100 text-green-600" :
         "text-slate-400 border-transparent grayscale"
      }`}>
         {done ? <CheckCircle2 size={14}/> : icon}
         <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
   );
}
