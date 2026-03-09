"use client";
import React, { useState, useEffect } from "react";
import { 
  X, 
  Megaphone, 
  MapPin, 
  ChevronDown, 
  Info, 
  Eye, 
  AlertTriangle, 
  Send,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";
import { addOfficialUpdate, getRegions } from "@/app/actions/data";

interface BroadcastAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BroadcastAlertModal({ isOpen, onClose }: BroadcastAlertModalProps) {
  const { showToast } = useToast();
  const [alertLevel, setAlertLevel] = useState<"info" | "warning" | "error">("warning");
  const [content, setContent] = useState("FLASH FLOOD WARNING: Residents in low-lying areas of Kalutara District must evacuate immediately to higher ground.");
  const [title, setTitle] = useState("Emergency Alert");
  const [isSending, setIsSending] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      getRegions().then(setRegions).catch(console.error);
    }
  }, [isOpen]);

  const handleBroadcast = async () => {
    if (!content.trim() || !title.trim()) {
      showToast("Please provide both title and content", "error");
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("severity", alertLevel);

      await addOfficialUpdate(formData);
      showToast("Emergency Alert Broadcasted Successfully", "success");
      onClose();
    } catch (err) {
      showToast("Failed to broadcast alert", "error");
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
            onClick={!isSending ? onClose : undefined}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 pb-4 flex justify-between items-start">
              <div className="flex gap-5">
                 <div className={`w-14 h-14 ${alertLevel === 'error' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'} rounded-2xl flex items-center justify-center border transition-colors shrink-0`}>
                    {isSending ? <Loader2 className="w-7 h-7 text-orange-500 animate-spin" /> : <Megaphone className={alertLevel === 'error' ? 'text-red-500' : 'text-orange-500'} />}
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isSending ? "Broadcasting..." : "Broadcast Emergency Alert"}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {isSending ? "Syncing with regional transmission towers..." : "Send critical notifications to citizens."}
                    </p>
                 </div>
              </div>
              <button onClick={onClose} disabled={isSending} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900 disabled:opacity-30">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className={`p-8 pt-4 space-y-6 transition-opacity duration-300 ${isSending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Alert Title</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Target Region (Notice only)</label>
                  <div className="relative group">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <MapPin className="w-5 h-5" />
                     </div>
                     <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-700 font-bold appearance-none focus:outline-none cursor-pointer">
                        <option>All Sri Lanka (National Alert)</option>
                        {regions.map(r => <option key={r.id}>{r.name}</option>)}
                     </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <ChevronDown className="w-5 h-5" />
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Alert Level</label>
                  <div className="grid grid-cols-3 gap-4">
                     <AlertLevelButton 
                        active={alertLevel === "info"} 
                        onClick={() => setAlertLevel("info")}
                        icon={<Info className="w-5 h-5" />}
                        label="ADVISORY" 
                        color="yellow"
                     />
                     <AlertLevelButton 
                        active={alertLevel === "warning"} 
                        onClick={() => setAlertLevel("warning")}
                        icon={<Eye className="w-5 h-5" />}
                        label="WATCH" 
                        color="orange"
                     />
                     <AlertLevelButton 
                        active={alertLevel === "error"} 
                        onClick={() => setAlertLevel("error")}
                        icon={<AlertTriangle className="w-5 h-5" />}
                        label="WARNING" 
                        color="red"
                     />
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Emergency Message</label>
                  <textarea 
                     className="w-full h-32 bg-slate-50 border border-slate-200 rounded-[28px] p-6 text-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all resize-none leading-relaxed"
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                  ></textarea>
               </div>

               <div className="space-y-4 pt-4">
                  <button 
                    disabled={isSending}
                    onClick={handleBroadcast}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl shadow-red-600/30 transition-all active:scale-[0.98] group"
                  >
                     <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 fill-white" />}
                     </div>
                     {isSending ? "BROADCASTING..." : "CONFIRM & SEND TO ALL CITIZENS"}
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface AlertLevelButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: "yellow" | "orange" | "red";
}

function AlertLevelButton({ active, onClick, icon, label, color }: AlertLevelButtonProps) {
  const colorClasses = {
    yellow: active ? "border-amber-500 bg-amber-50 text-amber-600" : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-amber-200",
    orange: active ? "border-orange-500 bg-orange-50 text-orange-600" : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-orange-200",
    red: active ? "border-red-500 bg-red-50 text-red-600" : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-red-200",
  };

  return (
    <button onClick={onClick} className={`h-20 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 group ${colorClasses[color]}`}>
       <div className={`${active ? "scale-110" : "group-hover:scale-110"} transition-transform`}>
          {icon}
       </div>
       <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{label}</span>
    </button>
  );
}
