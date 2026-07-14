"use client";

import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Printer,
  Copy,
  Activity,
  Building2,
  Zap,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { getGlobalAIInsights, getCriticalAlerts, getLatestDMCBrief } from "@/app/actions/forecasting";

// "unknown" ranks below "safe" so it never outranks a real risk signal, and
// is rendered distinctly rather than being conflated with a confirmed-safe
// reading (a missing forecast is not itself a safety guarantee).
const SEVERITY_RANK: Record<string, number> = { major: 3, minor: 2, alert: 1, safe: 0, unknown: -1 };
// Keys into the translation dictionary, resolved to display text inside the
// component (module scope has no hook access) via severityLabel() below.
const SEVERITY_LABEL_KEY: Record<string, string> = { major: "critical", minor: "high", alert: "ai_severity_advisory", safe: "stable", unknown: "ai_severity_no_data" };
const SEVERITY_COLOR: Record<string, string> = {
  major: "bg-red-500 text-white",
  minor: "bg-orange-500 text-white",
  alert: "bg-yellow-500 text-white",
  safe: "bg-green-500 text-white",
  unknown: "bg-gray-300 text-gray-700",
};

interface StationReport {
  station_id: number;
  water_level_now?: number;
  major_flood?: number;
  forecast_24h?: number;
}

interface CriticalAlert {
  station_id: number;
  river: string;
  station: string;
  currentLevel: string;
  forecastLevel: string;
  isAnomaly: boolean;
  timestamp: string;
}

interface RiskStation extends CriticalAlert {
  report?: StationReport;
  rank: number;
}

export default function IntelligenceBriefingPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [stats, setStats] = useState({ totalMonitored: 0, atAlert: 0, flooding: 0, anomalies: 0, lastUpdated: null as string | null });
  const [riskStations, setRiskStations] = useState<RiskStation[]>([]);

  const severityLabel = (level: string) => t(SEVERITY_LABEL_KEY[level] ?? level).toUpperCase();

  useEffect(() => {
    async function load() {
      const [insights, alerts, brief] = await Promise.all([
        getGlobalAIInsights(),
        getCriticalAlerts(),
        getLatestDMCBrief(),
      ]);

      const insightsByStation = new Map<number, StationReport>(
        insights.map((r: StationReport) => [r.station_id, r])
      );

      const merged: RiskStation[] = (alerts as CriticalAlert[])
        .map((a) => {
          const report = insightsByStation.get(a.station_id);
          const rank = Math.max(SEVERITY_RANK[a.currentLevel] ?? 0, SEVERITY_RANK[a.forecastLevel] ?? 0);
          return { ...a, report, rank };
        })
        .sort((a, b) => b.rank - a.rank);

      setStats(brief.stats);
      setRiskStations(merged);
      setGeneratedAt(new Date());
      setLoading(false);
    }
    load();
  }, []);

  const topRisks = riskStations.slice(0, 2);
  const tableRows = riskStations.slice(0, 6);
  const hasCritical = riskStations.some(r => r.rank >= 3);
  const hasElevated = riskStations.length > 0;

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
                <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-900 shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-all">
                   <Printer className="w-3.5 h-3.5" />
                   {t("print_pdf")}
                </button>
                <button
                   onClick={() => navigator.clipboard?.writeText(window.location.href)}
                   className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/10 flex items-center gap-2 transition-all active:scale-95"
                >
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
                            <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded", hasCritical ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500")}>
                               {hasCritical ? t("restricted") : t("ai_routine_status")}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400">REF: AI-BRF-{stats.totalMonitored}-{riskStations.length}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col items-start md:items-end text-right">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t("generated_by")}</span>
                      <span className="text-xs font-black text-zinc-900 italic">Outbreak Forecasting Engine (XGBoost / LSTM / TFT)</span>
                      <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-gray-400 uppercase">
                         <Clock className="w-3 h-3" />
                         {generatedAt ? generatedAt.toUTCString() : "..."}
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
                      {loading ? t("ai_briefing_compiling") : hasElevated ? (
                        <>
                          {t("ai_briefing_summary_of")} <span className="font-black text-zinc-900">{stats.totalMonitored}</span> {t("ai_briefing_summary_monitored")} <span className="font-black text-zinc-900">{stats.atAlert}</span> {t("ai_briefing_summary_alert")} <span className="font-black text-zinc-900">{stats.flooding}</span> {t("ai_briefing_summary_flooding")}
                          {topRisks[0] && <> {t("ai_briefing_summary_highest")} <span className="font-black text-zinc-900">{topRisks[0].station}</span> {t("ai_briefing_summary_on")} <span className="font-black text-zinc-900">{topRisks[0].river}</span>, {t("ai_briefing_summary_currently")} {severityLabel(topRisks[0].currentLevel).toLowerCase()} {t("ai_briefing_summary_level_with")} {severityLabel(topRisks[0].forecastLevel).toLowerCase()} {t("ai_briefing_summary_trajectory")}</>}
                          {stats.anomalies > 0 && <> {stats.anomalies} {t("ai_briefing_summary_anomaly_flag")}</>}
                        </>
                      ) : (
                        <>{t("ai_briefing_summary_all_safe_prefix")} {stats.totalMonitored} {t("ai_briefing_summary_all_safe_suffix")}</>
                      )}
                   </p>
                </section>

                {/* Immediate Threats Grid */}
                {topRisks.length > 0 && (
                <section className="space-y-6">
                   <div className="flex items-center gap-3 border-b-2 border-red-500/10 pb-4">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                         <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                      <h2 className="text-sm font-black text-zinc-900 italic uppercase">{t("immediate_threats")}</h2>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {topRisks.map((risk) => (
                        <div key={risk.station_id} className={cn(
                          "p-6 rounded-2xl border-l-4 border border-gray-100 flex flex-col gap-4",
                          risk.rank >= 3 ? "bg-red-50/30 border-l-red-500" : "bg-orange-50/30 border-l-orange-500"
                        )}>
                           <div className="flex justify-between items-center">
                              <h3 className="text-sm font-black text-zinc-900 italic">{risk.station}</h3>
                              <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest", SEVERITY_COLOR[risk.currentLevel])}>
                                 {severityLabel(risk.currentLevel)}
                              </span>
                           </div>
                           <p className="text-xs font-medium text-gray-500 leading-relaxed capitalize">
                             {risk.river} {t("ai_briefing_current_level_prefix")} {risk.report?.water_level_now?.toFixed(2) ?? "--"}m {t("ai_briefing_against_threshold")} {risk.report?.major_flood?.toFixed(2) ?? "--"}m.
                             {risk.isAnomaly && ` ${t("ai_briefing_anomalous_reading")}`}
                           </p>
                           <div className="flex items-center gap-2 text-[9px] font-black uppercase italic text-orange-500">
                              <Activity className="w-3 h-3" />
                              {t("ai_24h_forecast_label")} {risk.report?.forecast_24h != null ? `${risk.report.forecast_24h.toFixed(2)}m` : "—"} ({severityLabel(risk.forecastLevel)})
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
                )}

                {/* Stations at Risk */}
                <section className="space-y-6">
                   <div className="flex items-center gap-3 border-b-2 border-slate-500/10 pb-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                         <Building2 className="w-4 h-4 text-slate-500" />
                      </div>
                      <h2 className="text-sm font-black text-zinc-900 italic uppercase">{t("ai_stations_at_risk_title")}</h2>
                   </div>

                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="border-b border-gray-100">
                               <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("ai_table_station")}</th>
                               <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("ai_table_river")}</th>
                               <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t("ai_table_current_status")}</th>
                               <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t("ai_table_24h_forecast")}</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {tableRows.length > 0 ? tableRows.map((row) => (
                               <tr key={row.station_id} className="group hover:bg-gray-50/50 transition-colors">
                                  <td className="py-5 font-black text-xs text-zinc-900 italic uppercase tracking-tight">{row.station}</td>
                                  <td className="py-5 text-xs font-bold text-gray-400 uppercase">{row.river}</td>
                                  <td className="py-5 text-center px-4">
                                     <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter whitespace-nowrap", SEVERITY_COLOR[row.currentLevel])}>
                                        {severityLabel(row.currentLevel)}
                                     </span>
                                  </td>
                                  <td className="py-5 text-right font-black text-xs text-gray-500 italic uppercase">{severityLabel(row.forecastLevel)}</td>
                               </tr>
                            )) : (
                               <tr><td colSpan={4} className="py-8 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">{loading ? t("ai_loading_telemetry") : t("ai_no_stations_at_risk")}</td></tr>
                            )}
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
                      {(hasElevated ? [
                        { title: t("ai_action_escalate_title"), desc: `${t("ai_action_escalate_desc_prefix")} ${riskStations.length} ${t("ai_action_escalate_desc_mid")} ${topRisks[0]?.station ?? t("ai_action_default_station")} ${t("ai_briefing_summary_on")} ${topRisks[0]?.river ?? t("ai_action_default_river")}.` },
                        ...(hasCritical ? [{ title: t("ai_action_evacuation_title"), desc: t("ai_action_evacuation_desc") }] : []),
                        { title: t("ai_action_verify_title"), desc: stats.anomalies > 0 ? `${stats.anomalies} ${t("ai_action_verify_desc_anomalous_suffix")}` : t("ai_action_verify_desc_none") },
                      ] : [
                        { title: t("ai_action_routine_title"), desc: t("ai_action_routine_desc") },
                      ]).map((action, i) => (
                        <div key={i} className="flex gap-6 p-6 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-green-200 transition-all">
                           <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                              {i + 1}
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
                       {t("ai_footer_disclaimer")}
                    </p>
                    <p className="text-[8px] font-bold text-gray-400 mt-2 text-center uppercase">
                       {t("ai_footer_platform_tagline")}
                    </p>
                </div>
             </div>
          </div>
       </main>

       <Footer />
    </div>
  );
}
