"use client";
import React, { useState } from "react";
import { X, AlertTriangle, MapPin, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";
import { addHazard } from "@/app/actions/data";
import { useLanguage } from "@/context/LanguageContext";

interface AddHazardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddHazardModal({ isOpen, onClose, onSuccess }: AddHazardModalProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"Low" | "Moderate" | "High" | "Critical">("Moderate");
  const [latitude, setLatitude] = useState("6.9271");
  const [longitude, setLongitude] = useState("79.8612");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return showToast(t("au_title_required_toast"), "error");

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("severity", severity);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);

      await addHazard(formData);
      showToast(t("au_hazard_added_toast"), "success");
      onSuccess();
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setSeverity("Moderate");
    } catch (err) {
      showToast(t("au_add_hazard_failed_toast"), "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 pb-4 flex justify-between items-start">
              <div className="flex gap-4">
                 <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">{t("au_add_hazard_zone")}</h2>
                    <p className="text-slate-500 text-xs mt-1">{t("au_mark_dangerous_area_desc")}</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t("au_hazard_title_label")}</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("au_hazard_title_placeholder")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t("au_severity_label")}</label>
                    <select
                      value={severity}
                      onChange={(e: any) => setSeverity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-700 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="Low">{t("au_low")}</option>
                      <option value="Moderate">{t("au_moderate")}</option>
                      <option value="High">{t("high")}</option>
                      <option value="Critical">{t("critical")}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t("au_initial_status_label")}</label>
                    <div className="w-full bg-slate-100 rounded-2xl py-4 px-6 text-slate-400 font-bold cursor-not-allowed">
                       {t("au_active_status")}
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t("au_latitude_label")}</label>
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-700 font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t("au_longitude_label")}</label>
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-700 font-mono text-sm focus:outline-none"
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t("au_description_label")}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("au_hazard_desc_placeholder")}
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-[28px] p-6 text-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all resize-none"
                  />
               </div>

               <button
                 type="submit"
                 disabled={isSending}
                 className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] group"
               >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                  {isSending ? t("au_creating_hazard_zone") : t("au_create_active_hazard")}
               </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
