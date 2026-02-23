"use client";

import { 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Printer, 
  Copy, 
  Activity, 
  AlertCircle,
  Building2,
  Users2,
  Zap,
  Info,
  FileText
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function IntelligenceBriefingPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <Navbar type="briefing" backHref="/ai" />
       
       <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
          {/* Top Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
             <Link href="/ai" className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-brand-red transition-colors">
                <ArrowLeft className="w-4 h-4" />
                {t("back_to_dashboard")}
             </Link>
             
             <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-900 shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-all">
                   <Printer className="w-3.5 h-3.5" />
                   {t("print_pdf")}
                </button>
                <button className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/10 flex items-center gap-2 transition-all active:scale-95">
                   <Copy className="w-3.5 h-3.5" />
                   {t("copy_clipboard")}
                </button>
             </div>
          </div>

          {/* Main Briefing Container */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative">
             {/* Print Watermark (Visual Only) */}
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] rotate-[-35deg] scale-150 select-none">
                <span className="text-[12rem] font-black tracking-tighter">{t("confidential")}</span>
             </div>

             <div className="p-8 md:p-16 space-y-12 relative z-10">
                {/* Header Information */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-gray-50 pb-10">
                   <div className="flex gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-gray-100">
                         <ShieldCheck className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col uppercase">
                         <h1 className="text-3xl font-black text-zinc-900 italic tracking-tighter leading-none mb-2">{t("intelligence_briefing")}</h1>
                         <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black px-1.5 py-0.5 bg-red-100 text-red-600 rounded">{t("restricted")}</span>
                            <span className="text-[9px] font-bold text-gray-400">REF: AI-BRF-2024-892</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex flex-col items-start md:items-end text-right">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t("generated_by")}</span>
                      <span className="text-xs font-black text-zinc-900 italic">Central AI Core (Level 5)</span>
                      <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-gray-400 uppercase">
                         <Clock className="w-3 h-3" />
                         24 OCT 2024 - 14:32:05 UTC
                      </div>
                   </div>
                </div>

                {/* Executive Summary */}
                <section className="space-y-6">
                   <div className="flex items-center gap-3 border-b-2 border-orange-500/10 pb-4">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                         <FileText className="w-4 h-4 text-orange-500" />
                      </div>
                      <h2 className="text-sm font-black text-zinc-900 italic uppercase underline decoration-orange-500 decoration-2 underline-offset-4">{t("executive_summary")}</h2>
                   </div>
                   <p className="text-sm font-medium text-gray-600 leading-relaxed max-w-4xl">
                      High-confidence analysis indicates a critical escalation in the <span className="font-black text-zinc-900">Ratnapura District</span> following prolonged heavy rainfall. AI models (Confidence: 94%) predict a severe landslide event within the next 4-6 hours targeting the eastern slopes. Immediate evacuation protocols are advised for Sector 7. Secondary risks involve flash flooding downstream affecting critical supply routes.
                   </p>
                </section>

                {/* Immediate Threats Grid */}
                <section className="space-y-6">
                   <div className="flex items-center gap-3 border-b-2 border-red-500/10 pb-4">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                         <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                      <h2 className="text-sm font-black text-zinc-900 italic uppercase">{t("immediate_threats")}</h2>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-red-50/30 border-l-4 border-l-red-500 border border-gray-100 flex flex-col gap-4">
                         <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-zinc-900 italic">Major Landslide Risk</h3>
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-red-500 text-white rounded tracking-widest">CRITICAL</span>
                         </div>
                         <p className="text-xs font-medium text-gray-500 leading-relaxed capitalize">
                           Soil saturation levels at 98% in Eheliyagoda region. Seismic sensors detect micro-tremors consistent with pre-slip conditions.
                         </p>
                         <div className="flex items-center gap-2 text-[9px] font-black text-red-500 uppercase italic">
                            <Clock className="w-3 h-3" />
                            Impact Window: T-minus 4 hours
                         </div>
                      </div>
                      
                      <div className="p-6 rounded-2xl bg-orange-50/30 border-l-4 border-l-orange-500 border border-gray-100 flex flex-col gap-4">
                         <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-zinc-900 italic">River Bank Breach</h3>
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-orange-500 text-white rounded tracking-widest">HIGH</span>
                         </div>
                         <p className="text-xs font-medium text-gray-500 leading-relaxed capitalize">
                           Kalu Ganga water levels rising at 0.5m/hour. Potential breach at Embilipitiya embankment point B-4.
                         </p>
                         <div className="flex items-center gap-2 text-[9px] font-black text-orange-500 uppercase italic">
                            <Activity className="w-3 h-3" />
                            Current Level: 14.2m (Threshold: 15m)
                         </div>
                      </div>
                   </div>
                </section>

                {/* Affected Infrastructure */}
                <section className="space-y-6">
                   <div className="flex items-center gap-3 border-b-2 border-slate-500/10 pb-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                         <Building2 className="w-4 h-4 text-slate-500" />
                      </div>
                      <h2 className="text-sm font-black text-zinc-900 italic uppercase">{t("affected_infrastructure")}</h2>
                   </div>
                   
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="border-b border-gray-100">
                               <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset Name</th>
                               <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                               <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status Prediction</th>
                               <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Population Impact</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {[
                               { name: "A4 Highway (km 45-48)", type: "Transport", status: "Blocked (High Prob)", color: "text-red-500 bg-red-50", impact: "~15,000 Commuters" },
                               { name: "Ratnapura Base Hospital", type: "Healthcare", status: "Access Compromised", color: "text-orange-500 bg-orange-50", impact: "450 Patients" },
                               { name: "Substation #9", type: "Power Grid", status: "Stable", color: "text-green-500 bg-green-50", impact: "N/A" }
                            ].map((row, i) => (
                               <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                  <td className="py-5 font-black text-xs text-zinc-900 italic uppercase tracking-tight">{row.name}</td>
                                  <td className="py-5 text-xs font-bold text-gray-400 uppercase">{row.type}</td>
                                  <td className="py-5 text-center px-4">
                                     <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter whitespace-nowrap", row.color)}>
                                        {row.status}
                                     </span>
                                  </td>
                                  <td className="py-5 text-right font-black text-xs text-gray-500 italic uppercase">{row.impact}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </section>

                {/* Recommended Actions */}
                <section className="space-y-6">
                   <div className="flex items-center gap-3 border-b-2 border-green-500/10 pb-4">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                         <Zap className="w-4 h-4 text-green-500" />
                      </div>
                      <h2 className="text-sm font-black text-zinc-900 italic uppercase">{t("recommended_actions")}</h2>
                   </div>
                   
                   <div className="space-y-4">
                      {[
                        { title: "Initiate Level 3 Evacuation", desc: "Deploy emergency transport units to Sector 7 immediately. Utilize alternative route B12 due to A4 blockage risk.", num: "1" },
                        { title: "Alert Downstream Communities", desc: "Broadcast SMS warning via Cell Broadcast Service (CBS) to Kalutara District regarding river overflow.", num: "2" },
                        { title: "Prepare Medical Triage", desc: "Put Ratnapura Base Hospital on standby for potential trauma cases. Ensure backup power generators are fueled.", num: "3" }
                      ].map((action, i) => (
                        <div key={i} className="flex gap-6 p-6 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-green-200 transition-all">
                           <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                              {action.num}
                           </div>
                           <div className="space-y-1">
                              <h4 className="text-xs font-black text-zinc-900 italic uppercase italic tracking-wider">{action.title}</h4>
                              <p className="text-[11px] font-medium text-gray-500 leading-relaxed line-clamp-2 md:line-clamp-none">
                                {action.desc}
                              </p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>

                {/* Footer Disclaimer */}
                <div className="pt-12 border-t border-gray-50">
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] text-center italic">
                       THIS DOCUMENT CONTAINS CONFIDENTIAL INTELLIGENCE DERIVED FROM AI PREDICTIVE MODELS.
                    </p>
                    <p className="text-[8px] font-bold text-gray-400 mt-2 text-center uppercase">
                       Outbreak Platform © 2024 National Disaster Management Center
                    </p>
                </div>
             </div>
          </div>
       </main>
       
       <Footer />
    </div>
  );
}
