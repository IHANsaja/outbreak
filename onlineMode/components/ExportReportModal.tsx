"use client";
import React, { useState } from "react";
import { 
  X, 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Eye,
  Calendar,
  BarChart3,
  Map,
  CheckCircle2,
  Loader2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportReportModal({ isOpen, onClose }: ExportReportModalProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState<"pdf" | "excel" | null>(null);

  const handleExport = (format: "pdf" | "excel") => {
    setIsExporting(format);
    showToast(`${t("au_generating_prefix")} ${format.toUpperCase()} ${t("au_report_suffix")}`, "info");

    // Simulate generation and download
    setTimeout(() => {
      setIsExporting(null);
      showToast(`${format.toUpperCase()} ${t("au_report_downloaded_suffix")}`, "success");
    }, 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isExporting ? onClose : undefined}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-slate-50 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-auth-accent-teal/10 rounded-2xl flex items-center justify-center border border-auth-accent-teal/20">
                    <FileText className="w-6 h-6 text-auth-accent-teal" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">{t("au_export_analysis_report")}</h2>
                    <p className="text-slate-500 text-xs mt-0.5">{t("au_preview_generate_desc")}</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                disabled={!!isExporting}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-y-auto p-8">
               <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                  {/* Mock Report Content */}
                  <div className="p-12 space-y-10">
                     {/* Report Header */}
                     <div className="flex justify-between items-start pb-10 border-b border-slate-100">
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-auth-accent-teal font-black text-xl tracking-tighter">
                              <div className="w-8 h-8 bg-auth-accent-teal rounded-lg flex items-center justify-center">
                                 <div className="w-4 h-4 bg-white rounded-full"></div>
                              </div>
                              OUTBREAK AUTHORITY
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("au_confidential_situational_report")}</p>
                        </div>
                        <div className="text-right space-y-1">
                           <p className="text-xs font-bold text-slate-900">{t("au_report_id_mock")}</p>
                           <p className="text-[10px] text-slate-400 font-medium">{t("au_generated_mock")}</p>
                        </div>
                     </div>

                     {/* Summary Section */}
                     <div className="grid grid-cols-3 gap-8">
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Calendar size={12} /> {t("au_reporting_period_label")}
                           </h4>
                           <p className="text-sm font-bold text-slate-900">{t("au_last_24h_active")}</p>
                        </div>
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Map size={12} /> {t("au_coverage_label")}
                           </h4>
                           <p className="text-sm font-bold text-slate-900">{t("au_active_provinces_mock")}</p>
                        </div>
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <BarChart3 size={12} /> {t("au_data_fidelity_label")}
                           </h4>
                           <div className="flex items-center gap-1.5">
                              <CheckCircle2 size={12} className="text-green-500" />
                              <span className="text-sm font-bold text-slate-900">{t("au_verified_ai_model")}</span>
                           </div>
                        </div>
                     </div>

                     {/* Key Indicators Table */}
                     <div className="space-y-6">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">{t("au_critical_performance_indicators")}</h4>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                           <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                                 <tr>
                                    <th className="px-6 py-4">{t("au_metric_col")}</th>
                                    <th className="px-6 py-4">{t("au_value_col")}</th>
                                    <th className="px-6 py-4">{t("au_threshold_col")}</th>
                                    <th className="px-6 py-4 text-right">{t("au_status_col")}</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 <ReportRow metric={t("au_avg_response_latency")} value="4.2 mins" threshold="< 5.0 mins" status={t("au_normal_status")} color="text-green-600" />
                                 <ReportRow metric={t("au_incident_resolution_rate")} value="82.4%" threshold="> 75.0%" status={t("au_optimal")} color="text-green-600" />
                                 <ReportRow metric={t("au_resource_utilization_label")} value="94.1%" threshold="< 90.0%" status={t("critical")} color="text-red-600" />
                              </tbody>
                           </table>
                        </div>
                     </div>

                     {/* Chart Visual Placeholder */}
                     <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">{t("au_incident_distribution_trend")}</h4>
                        <div className="h-48 bg-slate-50 border border-slate-100 rounded-[28px] relative flex flex-col items-center justify-center">
                           <div className="flex gap-4 items-end h-32 w-full px-12">
                              {[35, 65, 45, 85, 55, 95, 75].map((h, i) => (
                                 <div key={i} className="flex-1 bg-auth-accent-teal/20 rounded-t-xl relative group">
                                    <div className="absolute inset-0 bg-auth-accent-teal rounded-t-xl transition-all duration-1000 origin-bottom" style={{ height: `${h}%` }}></div>
                                 </div>
                              ))}
                           </div>
                           <div className="w-full h-px bg-slate-200 mt-2"></div>
                        </div>
                     </div>

                     {/* Footer Note */}
                     <div className="pt-10 border-t border-slate-100 flex justify-between items-center opacity-50">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                           <Clock size={10} />
                           {t("au_automated_system_export")}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400">{t("au_page_1_of_1")}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Actions Bar */}
            <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
               <button 
                  onClick={() => handleExport("excel")}
                  disabled={!!isExporting}
                  className="px-8 py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-600 flex items-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50"
               >
                  {isExporting === "excel" ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5 text-green-600" />}
                  {t("au_download_excel")}
               </button>
               <button
                  onClick={() => handleExport("pdf")}
                  disabled={!!isExporting}
                  className="px-10 py-4 rounded-2xl bg-auth-accent-teal hover:bg-auth-accent-teal/90 text-white font-bold flex items-center gap-3 shadow-xl shadow-auth-accent-teal/20 transition-all active:scale-[0.98] disabled:opacity-50"
               >
                  {isExporting === "pdf" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {t("au_export_as_pdf")}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ReportRow({ metric, value, threshold, status, color }: any) {
   return (
      <tr className="font-medium text-slate-600">
         <td className="px-6 py-4 font-bold text-slate-900">{metric}</td>
         <td className="px-6 py-4">{value}</td>
         <td className="px-6 py-4 text-slate-400 italic font-normal">{threshold}</td>
         <td className={`px-6 py-4 text-right font-bold uppercase tracking-widest text-[10px] ${color}`}>{status}</td>
      </tr>
   );
}
