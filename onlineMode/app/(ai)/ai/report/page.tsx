"use client";

import { 
  ArrowLeft, 
  Share2, 
  Download, 
  ChevronRight, 
  Waves, 
  AlertTriangle, 
  Zap, 
  Activity, 
  Building2, 
  MapPin, 
  Info,
  Clock,
  TrendingUp,
  ShieldCheck,
  Flame,
  Droplets
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getDetailedReportData } from "@/app/actions/forecasting";
import { getRecentSos, getActiveHazards } from "@/app/actions/data";
import stationsData from "@/lib/stations.json";
import { formatForecast } from "@/lib/forecastMeta";

function ReportContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const stationId = parseInt(searchParams.get("stationId") || "21");
  
  const [data, setData] = useState<{reports: any[], station: any, globalInsights: any[]} | null>(null);
  const [sos, setSos] = useState<any[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    async function loadData() {
      setLoading(true);
      const [reportData, sosData, hazardData] = await Promise.all([
        getDetailedReportData(stationId),
        getRecentSos(),
        getActiveHazards()
      ]);
      setData(reportData);
      setSos(sosData);
      setHazards(hazardData);
      setLoading(false);
    }
    loadData();
  }, [stationId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4 text-zinc-400">
          <Activity className="w-12 h-12 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t("ai_generating_audit")}</span>
        </div>
      </div>
    );
  }

  const latestReport = data?.reports?.[data?.reports?.length - 1];
  const stationName = data?.station?.name || `Station ${stationId}`;
  const riverName = data?.station?.river || "River System";
  const allStationsData = data?.globalInsights || [];
  
  // National Stats
  const stationsAtRisk = allStationsData.filter(r => r.water_level_now >= r.alert_level).length;
  const majorFloodCount = allStationsData.filter(r => r.water_level_now >= r.major_flood).length;

  // Station Risk Logic
  const isCritical = latestReport?.water_level_now >= (latestReport?.major_flood || 8.0);
  const isHigh = latestReport?.water_level_now >= (latestReport?.alert_level || 5.0) && !isCritical;
  const riskLevel = isCritical ? t("critical") : isHigh ? t("high") : t("ai_risk_normal");
  const riskColor = isCritical ? "text-red-500" : isHigh ? "text-orange-500" : "text-emerald-500";

  // Chart Mapping (normalized for 400x240 viewbox)
  const maxVal = Math.max(...(data?.reports?.map(r => r.water_level_now) || [10]), latestReport?.major_flood || 10) * 1.2;
  const scaleY = (val: number) => 240 - (val / maxVal) * 200;
  const reportsArray = data?.reports || [];
  const points = reportsArray.map((r, i) => {
    const x = i === 0 ? 20 : (i / (reportsArray.length - 1 || 1)) * 360 + 20;
    return `${x},${scaleY(r.water_level_now)}`;
  }).join(" ");
  
  const thresholdY = scaleY(latestReport?.major_flood || 8.0);
  const forecastPointX = 395;
  const forecastPointY = scaleY(latestReport?.forecast_1h != null ? latestReport.forecast_1h : latestReport?.water_level_now);

  // Helper to get status tag for global table
  const getStatusInfo = (report: any) => {
    if (report.water_level_now >= report.major_flood) return { label: t("ai_status_flood"), color: "bg-red-500" };
    if (report.water_level_now >= report.minor_flood) return { label: t("ai_status_minor"), color: "bg-orange-500" };
    if (report.water_level_now >= report.alert_level) return { label: t("ai_status_alert"), color: "bg-yellow-500" };
    return { label: t("ai_status_safe"), color: "bg-emerald-500" };
  };

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
        {/* Action Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="space-y-1">
                <h1 className="text-2xl font-black text-zinc-900 italic tracking-tight uppercase leading-none">{t("ai_flood_forecast_report_title")}</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase">{t("ai_generated_on_label")} {hasMounted ? new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '') : "--"}</p>
            </div>

            <div className="flex items-center gap-3">
                <button className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-900 shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-all">
                    <Share2 className="w-4 h-4 text-gray-400" />
                    {t("ai_share_with_authorities")}
                </button>
                <button className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/10 flex items-center gap-2 transition-all active:scale-95">
                    <Download className="w-4 h-4" />
                    {t("download_pdf")}
                </button>
            </div>
        </div>

        {/* Report Paper */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-14 space-y-12">
                {/* Official Branding */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-10">
                    <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tight uppercase text-zinc-900 leading-none">OUTBREAK</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 italic">{t("ai_flood_forecasting_system_tagline")}</span>
                    </div>
                    </div>
                    <div className="flex flex-col items-end text-right">
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 text-[8px] font-black rounded uppercase tracking-widest">{t("ai_generated_forecast_badge")}</span>
                    <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">{t("ai_ref_label")} AI-NAT-{new Date().toISOString().slice(0,10).replace(/-/g, '')}-{stationId}</span>
                    </div>
                </div>

                {/* Executive Summary Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-4 py-1">
                    <h2 className="text-sm font-black text-zinc-900 italic uppercase">{t("executive_summary")}</h2>
                    </div>

                    <div className="bg-gray-50/50 rounded-2xl p-8 border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 leading-relaxed mb-6 italic">
                        {t("ai_report_ensemble_prefix")} <span className="font-black text-zinc-900 uppercase">{stationName}</span> {t("ai_report_indicates")} <span className={cn("font-black uppercase", riskColor)}>{riskLevel} {t("ai_report_status_suffix")}</span>.
                        {t("ai_report_nationally")} <span className="font-black text-zinc-900 uppercase">{stationsAtRisk} {t("ai_stations_word")}</span> {t("ai_report_stations_alert")} <span className="font-black text-red-500 uppercase">{majorFloodCount} {t("ai_active_flood_events_label")}</span> {t("ai_detected_suffix")}
                        {isCritical ? ` ${t("ai_report_critical_note")}` : ` ${t("ai_report_baseline_note")}`}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 px-1">
                        {[
                        { label: t("ai_station_risk_label"), val: riskLevel, color: riskColor },
                        { label: t("ai_national_alerts_label"), val: stationsAtRisk.toString(), color: "text-zinc-900" },
                        { label: t("ai_sensor_reliability_label"), val: "94%", color: "text-blue-500" }
                        ].map((m, i) => (
                        <div key={i} className="bg-white p-5 border border-gray-50 rounded-xl space-y-1 shadow-sm">
                            <span className="text-[10px] font-black text-gray-300 uppercase leading-none">{m.label}</span>
                            <div className={cn("text-xl font-black italic tracking-tighter", m.color)}>{m.val}</div>
                        </div>
                        ))}
                    </div>
                    </div>
                </div>

                {/* Hydrological Analysis */}
                <div className="space-y-8">
                    <div className="flex justify-between items-end border-l-4 border-blue-500 pl-4 py-1">
                    <h2 className="text-sm font-black text-zinc-900 italic uppercase">{riverName} {t("hydro_analysis")}</h2>
                    <span className="text-[8px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded tracking-widest border border-blue-100">{t("ai_primary_sensor_label")} {stationName}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 aspect-[4/3] bg-white border border-gray-50 rounded-2xl relative p-6">
                        {/* Legend / Info */}
                        <div className="absolute top-4 left-6 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase italic">{t("ai_measured_level_legend")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-0.5 bg-orange-500 border-2 border-orange-500 border-dashed" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase italic">{t("ai_trend_monitor_legend")}</span>
                        </div>
                        </div>

                        <svg className="w-full h-full" viewBox="0 0 400 240">
                            {[40, 80, 120, 160, 200].map(y => (
                            <line key={y} x1="20" y1={y} x2="380" y2={y} stroke="#f8fafc" strokeWidth="1" />
                            ))}
                            <line x1="20" y1={thresholdY} x2="380" y2={thresholdY} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
                            <text x="25" y={thresholdY - 5} className="text-[8px] font-black fill-red-500 opacity-80 uppercase tracking-widest">{t("ai_major_flood_label")} ({latestReport?.major_flood}m)</text>

                            <polyline
                                points={points} 
                                fill="none" 
                                stroke="#3b82f6" 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                            />
                            <line 
                                x1={380} y1={scaleY(latestReport?.water_level_now)} 
                                x2={forecastPointX} y2={forecastPointY} 
                                fill="none" 
                                stroke="#f97316" 
                                strokeWidth="3" 
                                strokeDasharray="6 4"
                                strokeLinecap="round" 
                            />
                            <circle cx="380" cy={scaleY(latestReport?.water_level_now)} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                        </svg>
                        
                        <div className="flex justify-between px-2 text-[8px] font-black text-gray-300 italic uppercase">
                            <span>{hasMounted && data?.reports?.[0] ? `${new Date(data.reports[0].timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} ${new Date(data.reports[0].timestamp).getHours()}:00` : "--"}</span>
                            <span>{t("ai_mid_point_index")}</span>
                            <span className="text-blue-500 bg-blue-50 px-1 rounded">{t("ai_current_time_label")}</span>
                            <span className="text-orange-500">{t("ai_plus_1hr_forecast")}</span>
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t("ai_hydraulic_level")}</span>
                            <div className="text-3xl font-black text-zinc-900 italic tracking-tighter">{latestReport?.water_level_now}m</div>
                            <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase">{t("ai_delta_label")} {((latestReport?.water_level_now - latestReport?.water_level_lag1) || 0).toFixed(2)}m/hr</p>
                        </div>
                        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{t("ai_dmc_rainfall")}</span>
                            <div className="text-3xl font-black text-zinc-900 italic tracking-tighter">{latestReport?.rainfall_roll3}mm</div>
                            <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase">{t("ai_official_catchment_data")}</p>
                        </div>
                    </div>
                    </div>
                </div>

                {/* National River Overview table replaces Seismic Clusters */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-slate-900 pl-4 py-1">
                        <h2 className="text-sm font-black text-zinc-900 italic uppercase">{t("ai_national_river_monitor_title")}</h2>
                    </div>

                    <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">{t("ai_table_station")}</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">{t("ai_table_river")}</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">{t("ai_table_level")}</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">{t("ai_table_ai_prediction")}</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">{t("ai_table_status")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {allStationsData.slice(0, 8).map((report, idx) => {
                                    const status = getStatusInfo(report);
                                    return (
                                        <tr key={idx} className="hover:bg-white transition-colors group">
                                            <td className="px-6 py-4 text-[11px] font-black text-zinc-900 italic group-hover:text-blue-500">
                                                {stationsData.find(s => s.id === report.station_id)?.name || `${t("ai_station_fallback_prefix")} ${report.station_id}`}
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">
                                                {stationsData.find(s => s.id === report.station_id)?.river || t("ai_main_system_fallback")}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-black text-zinc-900 italic">{report.water_level_now}m</td>
                                            <td className="px-6 py-4 text-xs font-black text-orange-500 italic text-center">
                                                {formatForecast(report.forecast_1h)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={cn("px-2 py-0.5 text-[8px] font-black text-white rounded uppercase tracking-[0.1em]", status.color)}>
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {allStationsData.length > 8 && (
                            <div className="px-6 py-3 bg-white border-t border-gray-100 text-center">
                                <span className="text-[8px] font-bold text-gray-300 uppercase italic">{t("ai_showing_top_8_sites")}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Critical Hotspots Section */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-red-500 pl-4 py-1">
                        <h2 className="text-sm font-black text-zinc-900 italic uppercase">{t("ai_infield_audit_title")}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hazards.length === 0 && sos.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest italic border-2 border-dashed border-gray-100 rounded-3xl underline-offset-4">{t("ai_zero_active_reports")}</div>
                          ) : (
                            [
                              ...sos.map(s => ({ ...s, feedType: 'sos' })),
                              ...hazards.map(h => ({ ...h, feedType: 'hazard' }))
                            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .slice(0, 6)
                            .map((h, i) => (
                            <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 items-start group hover:border-zinc-900 transition-all shadow-sm">
                               <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner", h.feedType === 'sos' ? "bg-red-50" : "bg-orange-50")}>
                                  {h.feedType === 'sos' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <MapPin className="w-5 h-5 text-orange-500" />}
                               </div>
                               <div className="flex-1 min-w-0 pt-1">
                                  <div className="flex justify-between items-center mb-1">
                                     <h4 className="text-[11px] font-black text-zinc-900 italic truncate uppercase">{h.feedType === 'sos' ? `${t("ai_req_prefix")} ${h.stype || t("ai_sos_fallback")}` : (h.title || t("ai_hazard_fallback"))}</h4>
                                     <span className={cn("text-[7px] font-black uppercase px-2 py-0.5 rounded tracking-widest", h.feedType === 'sos' ? "bg-red-600 text-white" : "bg-orange-500 text-white")}>
                                       {h.feedType === 'sos' ? t("ai_sos_fallback") : (h.severity || t("high"))}
                                     </span>
                                  </div>
                                  <p className="text-[10px] font-medium text-gray-400 line-clamp-2 leading-tight italic">{h.feedType === 'sos' ? h.additional_info : h.description}</p>
                                  <div className="mt-2 text-[8px] font-bold text-zinc-300 uppercase">{new Date(h.created_at).toLocaleTimeString()}</div>
                               </div>
                            </div>
                        )))}
                    </div>
                </div>

                {/* Final Footer Marks */}
                <div className="pt-12 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 opacity-40">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-[8px] font-bold text-gray-500 uppercase italic">{t("ai_digital_integrity_verified")}</span>
                    </div>
                    <span className="text-[8px] font-bold text-gray-300 uppercase italic text-right">{t("ai_audit_copy_footer")}</span>
                </div>
            </div>
        </div>
    </main>
  );
}

export default function PredictionReportPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 sticky top-0 z-50">
          <Link href="/ai" className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors">
             <ArrowLeft className="w-4 h-4" />
             {t("back_to_dashboard")}
          </Link>
          <div className="flex items-center gap-4 text-xs font-black text-gray-600">
             <span>Colombo, LK</span>
             <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200" />
          </div>
       </header>

       <Suspense fallback={
         <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-zinc-400">
               <Activity className="w-12 h-12 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">{t("ai_loading_report_engine")}</span>
            </div>
         </div>
       }>
         <ReportContent />
       </Suspense>
       
       <Footer />
       
       <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
             display: none;
          }
       `}</style>
    </div>
  );
}
