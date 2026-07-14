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
import { useLanguage } from "@/context/LanguageContext";

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateIncidentModal({ isOpen, onClose }: CreateIncidentModalProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      showToast(t("au_incident_reported_toast"), "success");
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
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t("au_report_new_incident")}</h2>
                    <p className="text-slate-500 text-sm mt-1">{t("au_initiate_protocol_desc")}</p>
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
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t("au_incident_type_label")}</label>
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                           <Activity className="w-5 h-5" />
                        </div>
                        <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all cursor-pointer">
                           <option value="">{t("au_select_type")}</option>
                           <option>{t("au_flash_flood")}</option>
                           <option>{t("au_disease_outbreak")}</option>
                           <option>{t("au_earthquake")}</option>
                           <option>{t("au_industrial_hazard")}</option>
                           <option>{t("au_wildfire")}</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                     </div>
                  </div>

                  {/* Region */}
                  <div className="space-y-3">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t("au_affected_region_label")}</label>
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                           <MapPin className="w-5 h-5" />
                        </div>
                        <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all cursor-pointer">
                           <option value="">{t("au_select_region")}</option>
                           <option>{t("au_western_province")}</option>
                           <option>{t("au_central_province")}</option>
                           <option>{t("au_southern_province")}</option>
                           <option>{t("au_north_western_province")}</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                     </div>
                  </div>
               </div>

               {/* Severity Level */}
               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t("au_severity_level_label")}</label>
                  <div className="grid grid-cols-4 gap-4">
                     <SeverityButton active={severity === "low"} onClick={() => setSeverity("low")} label={t("au_low_caps")} color="green" />
                     <SeverityButton active={severity === "medium"} onClick={() => setSeverity("medium")} label={t("au_medium_caps")} color="yellow" />
                     <SeverityButton active={severity === "high"} onClick={() => setSeverity("high")} label={t("au_high_caps")} color="orange" />
                     <SeverityButton active={severity === "critical"} onClick={() => setSeverity("critical")} label={t("au_critical_caps")} color="red" />
                  </div>
               </div>

               {/* Description */}
               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t("au_situation_description_label")}</label>
                  <textarea
                     required
                     placeholder={t("au_incident_desc_placeholder")}
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
                    {t("au_discard")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] bg-slate-900 border-b-4 border-slate-950 hover:bg-slate-800 text-white py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 transition-all active:translate-y-1 active:border-b-0 disabled:bg-slate-400 disabled:border-slate-500"
                  >
                     {isSubmitting ? (
                        <>
                           <Loader2 className="w-5 h-5 animate-spin" />
                           {t("au_creating_incident")}
                        </>
                     ) : (
                        <>
                           <Zap className="w-5 h-5 fill-white" />
                           {t("au_trigger_digital_support")}
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
