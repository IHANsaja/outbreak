"use client";
import React, { useState, useEffect, useMemo } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Download, Calendar, ArrowUpRight, ArrowDownRight, TrendingUp, HelpCircle, Map as MapIcon, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ExportReportModal from "@/components/ExportReportModal";
import { getRegions, getAllIncidents } from "@/app/actions/data";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function AnalysisPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [r, i] = await Promise.all([getRegions(), getAllIncidents()]);
        setRegions(r);
        setIncidents(i);
      } catch (err) {
        showToast(t("au_error_fetching_analysis_data"), "error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(inc => {
      counts[inc.itype] = (counts[inc.itype] || 0) + 1;
    });
    const total = incidents.length || 1;
    return Object.entries(counts).map(([label, count]) => ({
      label,
      value: `${Math.round((count / total) * 100)}%`,
      count
    })).sort((a, b) => b.count - (a as any).count);
  }, [incidents]);

  return (
    <AuthorityLayout>
      <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t("au_data_analytics")}</h1>
            <p className="text-slate-500 mt-1">{t("au_deep_analysis_desc")}</p>
          </div>
          <div className="flex gap-4">
             <div
                onClick={() => showToast(t("au_opening_date_range_toast"), "info")}
                className="bg-white border border-auth-border rounded-xl px-4 py-3 flex items-center gap-3 auth-card-shadow cursor-pointer hover:bg-slate-50 transition-colors"
             >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-700">{t("au_last_30_days")}</span>
             </div>
             <button
               onClick={() => setIsExportModalOpen(true)}
               className="bg-[#0f172a] hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
             >
               <Download className="w-5 h-5 text-slate-400" />
               {t("au_export_report")}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Main Trend Chart */}
           <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-auth-border auth-card-shadow relative overflow-hidden group">
              <div className="flex justify-between items-start mb-12">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">{t("au_historical_vs_current_trends")}</h3>
                    <p className="text-sm text-slate-400 mt-1">{t("au_comparing_5yr_desc")}</p>
                 </div>
                 <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("au_current")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("au_historical_avg")}</span>
                    </div>
                 </div>
              </div>

              {/* Chart SVG Mock */}
              <div className="h-64 relative flex items-end mb-10">
                 <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="200" x2="800" y2="200" stroke="#f1f5f9" strokeWidth="2" />
                    
                    {/* Historical Line (Dashed) */}
                    <path 
                      d="M0,170 Q100,165 200,150 T400,130 T600,110 T800,90" 
                      fill="none" 
                      stroke="#cbd5e1" 
                      strokeWidth="3" 
                      strokeDasharray="10,8" 
                    />
                    
                    {/* Current Line (Solid Red) */}
                    <path 
                      d="M0,180 Q100,170 200,140 T400,120 T600,60 T800,20" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="8" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="drop-shadow-2xl transition-all duration-1000"
                    />

                    {/* Annotation */}
                    <g transform="translate(450, 45)">
                       <rect width="100" height="30" rx="15" fill="#1e293b" />
                       <text x="50" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{t("au_increase_24pct")}</text>
                       <line x1="50" y1="30" x2="50" y2="65" stroke="#1e293b" strokeWidth="2" strokeDasharray="4" />
                    </g>
                 </svg>
              </div>

              <div className="flex justify-between px-2 text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                 <span>{t("au_month_jan")}</span>
                 <span>{t("au_month_mar")}</span>
                 <span>{t("au_month_may")}</span>
                 <span>{t("au_month_jul")}</span>
                 <span>{t("au_month_sep")}</span>
                 <span>{t("au_month_nov")}</span>
              </div>
           </div>

           {/* Distribution Pie Chart */}
           <div className="bg-white p-10 rounded-[40px] border border-auth-border auth-card-shadow flex flex-col group">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">{t("au_incident_distribution")}</h3>
                    <p className="text-sm text-slate-400 mt-1">{t("au_by_disaster_type_desc")}</p>
                 </div>
                 <HelpCircle className="w-5 h-5 text-slate-200 cursor-pointer hover:text-auth-accent-red transition-colors" onClick={() => showToast(t("au_showing_distribution_methodology_toast"), "info")} />
              </div>

              <div className="flex-1 flex flex-col justify-center items-center py-6">
                 {/* Donut Chart Mock */}
                 <div className="relative w-48 h-48 mb-12 group-hover:scale-105 transition-transform duration-500">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                       <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="15" />
                       <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="15" strokeDasharray="172.78 251.32" className="transition-all duration-1000" />
                       <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="15" strokeDasharray="70.37 251.32" strokeDashoffset="-172.78" />
                       <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="15" strokeDasharray="8.17 251.32" strokeDashoffset="-243.15" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-bold text-slate-900 tracking-tighter">{incidents.length}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("au_total")}</span>
                    </div>
                 </div>

                  <div className="w-full space-y-4">
                    {loading ? <p className="text-slate-400 text-xs animate-pulse">{t("au_calculating_distribution")}</p> :
                      distribution.slice(0, 4).map((d, i) => (
                        <DistributionLegned 
                          key={d.label} 
                          color={i === 0 ? "bg-red-500" : i === 1 ? "bg-amber-500" : i === 2 ? "bg-blue-500" : "bg-purple-500"} 
                          label={d.label} 
                          value={d.value} 
                        />
                      ))
                    }
                  </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Heatmap Section */}
           <div className="bg-white p-8 rounded-[40px] border border-auth-border auth-card-shadow flex flex-col">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{t("au_predictive_heatmap_24h")}</h3>
                    <p className="text-xs text-slate-400 mt-1">{t("au_projected_impact_zones_desc")}</p>
                 </div>
                 <button
                  onClick={() => showToast(t("au_transferring_gis_toast"), "info")}
                  className="text-auth-accent-red font-bold text-[10px] uppercase tracking-widest hover:underline"
                 >
                    {t("au_full_map_view")}
                 </button>
              </div>
              <div className="flex-1 min-h-[300px] bg-slate-50 rounded-[32px] relative overflow-hidden flex items-center justify-center border border-slate-100 group cursor-pointer" onClick={() => showToast(t("au_capturing_segment_toast"), "info")}>
                 {/* Mock Heatmap Pattern */}
                 <div className="absolute inset-0 bg-[#f1f5f9] opacity-40" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                 <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-red-500/20 blur-[40px] rounded-full animate-pulse"></div>
                 <div className="absolute top-1/3 left-1/2 w-32 h-32 bg-orange-500/20 blur-[30px] rounded-full animate-pulse delay-700"></div>

                 <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/50 shadow-xl relative z-10 transition-transform group-hover:scale-110">
                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{t("au_high_risk_western_province")}</p>
                 </div>
              </div>
           </div>

           {/* Efficiency Metrics */}
           <div className="bg-white p-8 rounded-[40px] border border-auth-border auth-card-shadow">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-lg font-bold text-slate-900 tracking-tight">{t("au_resource_utilization_efficiency")}</h3>
                 <span className="text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100 uppercase tracking-widest">{t("au_optimal")}</span>
              </div>

              <div className="space-y-10">
                 <EfficiencyBar label={t("au_emergency_personnel_deployed")} value="84%" sub={t("au_personnel_active_sub")} />
                 <EfficiencyBar label={t("au_medical_supplies_stock")} value="45%" sub={t("au_restocking_12h")} color="bg-orange-500" />
                 <EfficiencyBar label={t("au_transport_vehicles_available")} value="12%" sub={t("au_critical_shortage_warning")} color="bg-red-500" warning={true} />
              </div>
           </div>
        </div>

        {/* Forecast and Region Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
           <div className="lg:col-span-3 bg-[#0f172a] p-8 rounded-[40px] text-white flex flex-col justify-between group hover:bg-slate-900 transition-colors">
              <div className="space-y-6">
                 <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-7 h-7 text-green-400" />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold tracking-tight">{t("au_ai_forecasting")}</h4>
                    <p className="text-sm text-slate-400 mt-4 leading-relaxed line-clamp-4">{t("au_forecast_trajectory_desc")}</p>
                 </div>
              </div>
              <div className="pt-8 mt-8 border-t border-white/10 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("au_confidence")}</span>
                 <span className="text-2xl font-bold text-green-400 tracking-tighter animate-pulse">92%</span>
              </div>
           </div>

           <div className="lg:col-span-9 bg-white rounded-[40px] border border-auth-border auth-card-shadow overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/50">
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("au_region_id")}</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("au_risk_factor")}</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("au_population_affected")}</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("au_trend")}</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{t("au_action")}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {loading ? (
                        <tr><td colSpan={5} className="py-10 text-center text-slate-400 animate-pulse">{t("au_loading_regional_data")}</td></tr>
                     ) : regions.map(region => (
                        <RegionRow
                          key={region.id}
                          id={region.name}
                          risk={region.severity_level}
                          riskColor={
                            region.severity_level === 'Critical' ? "text-red-600 bg-red-50" :
                            region.severity_level === 'High' ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50"
                          }
                          pop={region.impact_percentage > 50 ? t("au_high_impact") : t("au_moderate")}
                          trend={region.impact_percentage > 50 ? t("au_rising") : undefined}
                          trendIcon={region.impact_percentage > 50 ? <ArrowUpRight className="w-4 h-4 text-red-500" /> : <div className="flex items-center gap-2"><div className="w-2 h-0.5 bg-slate-300"></div><span className="text-sm font-bold text-slate-400 tracking-tighter">{t("stable")}</span></div>}
                        />
                     ))}
                  </tbody>
               </table>
           </div>
        </div>
      </div>
      <ExportReportModal 
         isOpen={isExportModalOpen} 
         onClose={() => setIsExportModalOpen(false)} 
      />
    </AuthorityLayout>
  );
}

function DistributionLegned({ color, label, value }: any) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  return (
    <div
        onClick={() => showToast(`${t("au_filtering_distribution_by_toast")} ${label}`, "info")}
        className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
    >
       <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{label}</span>
       </div>
       <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

function EfficiencyBar({ label, value, sub, color = "bg-blue-600", warning = false }: any) {
  return (
    <div className="space-y-4">
       <div className="flex justify-between items-end">
          <h4 className="text-sm font-bold text-slate-600">{label}</h4>
          <span className="text-lg font-bold text-slate-900">{value}</span>
       </div>
       <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: value }}></div>
       </div>
       <div className="flex items-center gap-2">
          {warning && <AlertTriangle className="w-4 h-4 text-orange-500 animate-bounce" />}
          <p className={`text-[11px] font-bold uppercase tracking-widest ${warning ? "text-orange-600" : "text-slate-400"}`}>{sub}</p>
       </div>
    </div>
  );
}

function RegionRow({ id, risk, riskColor, pop, trend, trendIcon }: any) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  return (
    <tr className="hover:bg-slate-50 transition-colors group">
       <td className="px-8 py-6 text-sm font-bold text-slate-700">{id}</td>
       <td className="px-8 py-6 text-center">
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full border border-current uppercase tracking-widest ${riskColor}`}>
             {risk}
          </span>
       </td>
       <td className="px-8 py-6 text-center text-sm font-medium text-slate-600">{pop}</td>
       <td className="px-8 py-6">
          <div className="flex items-center justify-center gap-2">
             {trendIcon}
             {typeof trend === 'string' && trend && <span className="text-sm font-bold text-slate-900 tracking-tighter">{trend}</span>}
          </div>
       </td>
       <td className="px-8 py-6 text-right">
          <button
            onClick={() => showToast(`${t("au_analyzing_regional_metrics_toast")} ${id}...`, "info")}
            className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-50 transition-all active:scale-95"
          >
             {t("au_analyze")}
          </button>
       </td>
    </tr>
  );
}

function Globe(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  );
}

function Radio(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/></svg>
  );
}
