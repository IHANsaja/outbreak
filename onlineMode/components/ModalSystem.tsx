import React, { useState, useEffect } from "react";
import { Skeleton } from "./Skeleton";
import { X, MapPin, Camera, ChevronRight, AlertTriangle, Info, Send, LifeBuoy, Heart, Anchor, Package, Flame, PlusSquare, Loader2 } from "lucide-react";
import Link from "next/link";
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
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
  const [hazards, setHazards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      import('@/app/actions/data').then(({ getActiveHazards }) => {
        getActiveHazards().then(data => {
          setHazards(data);
          setLoading(false);
        }).catch(err => {
          console.error(err);
          setLoading(false);
        });
      });
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nearby Active Hazards"
      subtitle="Within 5km of your location"
      icon={<AlertTriangle className="w-6 h-6" />}
    >
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : hazards.length > 0 ? (
          hazards.map((hazard, idx) => (
            <div key={hazard.id || idx} className={cn(
              "p-5 rounded-2xl border transition-all hover:shadow-md",
              hazard.severity === "high" || hazard.severity === 'critical' || hazard.severity === 'Critical' ? "border-red-200 bg-red-50/20" :
                hazard.severity === "medium" || hazard.severity === 'moderate' || hazard.severity === 'High' ? "border-orange-200 bg-orange-50/20" : "border-yellow-200 bg-yellow-50/20"
            )}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase",
                    hazard.severity === "high" || hazard.severity === 'critical' || hazard.severity === 'Critical' ? "bg-red-100 text-brand-red" :
                      hazard.severity === "medium" || hazard.severity === 'moderate' || hazard.severity === 'High' ? "bg-orange-100 text-brand-orange" : "bg-yellow-100 text-brand-yellow"
                  )}>
                    {hazard.severity} severity
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                    {new Date(hazard.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  <MapPin className="w-3 h-3" />
                  {hazard.distance_km != null ? `${hazard.distance_km}km away` : `${hazard.radius_km || 1.5}km radius`}
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
          ))
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-medium">
            No active hazards in your immediate vicinity.
          </div>
        )}

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

import { submitIncident, submitSOS } from "@/app/actions/data";
import { useToast } from "@/context/ToastContext";

export function ReportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image must be under 5MB.", "warning");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Add coordinates if not detected
    if (!formData.get('latitude')) {
      formData.set('latitude', '6.9271');
      formData.set('longitude', '79.8612');
    }

    // Add image file
    if (imageFile) {
      formData.set('photo', imageFile);
    }

    try {
      await submitIncident(formData);
      showToast("Incident report submitted successfully.", "success");
      removeImage();
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Failed to submit report. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OUTBREAK"
      subtitle="REPORT INCIDENT"
      icon={<Camera className="w-6 h-6" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</span>
          <button type="button" className="w-full py-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-all active:scale-[0.98]">
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
          <select name="itype" required className="w-full p-4 rounded-2xl border border-gray-100 bg-white font-bold text-zinc-900 text-sm italic focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none appearance-none">
            <option value="">Select Damage Type...</option>
            <option value="Flooding">Flooding</option>
            <option value="Landslide">Landslide</option>
            <option value="Structural Damage">Structural Damage</option>
            <option value="Road Block">Road Block</option>
          </select>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Evidence Photo</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />
          
          {imagePreview ? (
            <div className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
              <img src={imagePreview} alt="Preview" className="w-full aspect-video object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold">
                {imageFile?.name}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-4 group hover:border-brand-red/20 transition-all cursor-pointer bg-gray-50/50"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-gray-300 group-hover:text-brand-red transition-colors">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-900 italic">Tap to take photo</p>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">or upload from gallery (max 5MB)</p>
              </div>
            </button>
          )}
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</span>
          <textarea
            name="description"
            required
            placeholder="Describe the damage or situation briefly..."
            className="w-full h-32 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none transition-all placeholder:text-gray-300 font-medium text-sm"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-xl shadow-orange-500/20 font-black text-xl italic tracking-tight uppercase flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          {loading ? "Uploading..." : "Submit Report"}
        </button>

        <p className="text-[9px] text-gray-400 text-center font-bold italic">
          False reporting is a punishable offense under Emergency Regulations.
        </p>
      </form>
    </Modal>
  );
}

export function SOSModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string>("critical");
  const [peopleCount, setPeopleCount] = useState("");
  const [description, setDescription] = useState("");

  const needTypes = [
    { id: "medical", title: "Medical Aid", icon: Heart, color: "text-red-500", bg: "bg-red-50" },
    { id: "rescue", title: "Rescue", icon: Anchor, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "supplies", title: "Food / Water", icon: Package, color: "text-orange-500", bg: "bg-orange-50" },
    { id: "fire", title: "Fire / Hazard", icon: Flame, color: "text-amber-600", bg: "bg-amber-50" },
    { id: "shelter", title: "Shelter", icon: PlusSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: "other", title: "Other Need", icon: Info, color: "text-violet-500", bg: "bg-violet-50" },
  ];

  const urgencyOptions = [
    { id: "critical", label: "Critical — Life threatening", color: "border-red-500 bg-red-50 text-red-700" },
    { id: "high", label: "High — Urgent help needed", color: "border-orange-500 bg-orange-50 text-orange-700" },
    { id: "medium", label: "Medium — Can wait some time", color: "border-yellow-500 bg-yellow-50 text-yellow-700" },
  ];

  const handleSend = async () => {
    if (!selected) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.set('stype', selected);
    // Pack all the extra details into additional_info as structured text
    const info = [
      `Urgency: ${urgency}`,
      peopleCount ? `People affected: ${peopleCount}` : '',
      description ? `Details: ${description}` : ''
    ].filter(Boolean).join(' | ');
    formData.set('additional_info', info);
    formData.set('latitude', '6.9271');
    formData.set('longitude', '79.8612');

    try {
      await submitSOS(formData);
      showToast("Help request broadcasted successfully.", "success");
      setSelected(null);
      setUrgency("critical");
      setPeopleCount("");
      setDescription("");
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Failed to send help request. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Help"
      subtitle="Broadcast your need to the community"
      icon={<LifeBuoy className="w-6 h-6" />}
    >
      <div className="space-y-5">
        <p className="text-[13px] font-medium text-gray-500 leading-relaxed text-center px-4">
          Describe what you need. Your request will be visible on the Community Needs board so nearby responders and volunteers can help.
        </p>

        {/* Need Type */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">What do you need?</span>
          <div className="grid grid-cols-3 gap-2">
            {needTypes.map((action) => (
              <button
                key={action.id}
                onClick={() => setSelected(action.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all active:scale-95",
                  selected === action.id
                    ? "border-brand-red bg-white shadow-lg ring-4 ring-brand-red/5"
                    : "border-gray-50 bg-gray-50/50 hover:bg-gray-100/50"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  selected === action.id ? action.bg : "bg-white",
                  action.color
                )}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest transition-colors",
                  selected === action.id ? "text-brand-red" : "text-gray-400"
                )}>
                  {action.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Urgency Level */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Urgency Level</span>
          <div className="flex flex-col gap-2">
            {urgencyOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setUrgency(opt.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all text-left",
                  urgency === opt.id ? opt.color : "border-gray-100 bg-gray-50/50 text-gray-400"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full border-2 flex items-center justify-center",
                  urgency === opt.id ? "border-current" : "border-gray-300"
                )}>
                  {urgency === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                </div>
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {{ 
              medical: "People Injured (optional)",
              rescue: "People Trapped (optional)",
              supplies: "Packets / Portions Needed (optional)",
              fire: "People to Evacuate (optional)",
              shelter: "People Needing Shelter (optional)",
              other: "Quantity Needed (optional)"
            }[selected || "other"] || "Quantity Needed (optional)"}
          </span>
          <input
            type="number"
            value={peopleCount}
            onChange={(e) => setPeopleCount(e.target.value)}
            placeholder={{ 
              medical: "e.g. 3 people",
              rescue: "e.g. 2 people",
              supplies: "e.g. 10 packets",
              fire: "e.g. 5 people",
              shelter: "e.g. 4 families",
              other: "e.g. 5"
            }[selected || "other"] || "e.g. 5"}
            min="1"
            className="w-full p-3 rounded-xl border border-gray-100 bg-white shadow-sm focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none transition-all placeholder:text-gray-300 font-bold text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Describe Your Situation</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened? What supplies or assistance do you need? Any access issues to reach you?"
            className="w-full h-24 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none transition-all placeholder:text-gray-300 font-medium text-sm resize-none"
          />
        </div>

        {/* Submit Area */}
        <div className="p-5 bg-slate-900 rounded-3xl text-white space-y-4 shadow-xl">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Broadcasting GPS</span>
            </div>
            <span className="text-[9px] font-bold text-white/40 tracking-wider">Auto-detected location</span>
          </div>

          <button
            disabled={!selected || loading}
            onClick={handleSend}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-xl italic uppercase tracking-tighter transition-all flex flex-col items-center justify-center gap-0.5",
              selected
                ? "emergency-gradient text-white shadow-lg shadow-red-900/40 active:scale-[0.98]"
                : "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
            )}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "SEND REQUEST"}
            <span className="text-[8px] tracking-[0.2em] font-black opacity-60 normal-case">{loading ? "Broadcasting..." : "Visible on Community Needs board"}</span>
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-center font-medium leading-relaxed italic px-2">
          Your request will be visible to nearby volunteers and authorities. Your GPS location will be shared.
        </p>
      </div>
    </Modal>
  );
}
