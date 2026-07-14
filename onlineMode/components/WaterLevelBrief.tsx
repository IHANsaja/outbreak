"use client";

import { useState, useEffect, useRef } from "react";
import { Waves, TrendingUp, TrendingDown, Minus, AlertTriangle, Droplets, Activity, Radio, ChevronRight, Zap, HelpCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

function HelpTooltip({ text }: { text: string }) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (show && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
  }, [show]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShow(!show); }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-gray-300 hover:text-blue-400 transition-colors ml-1"
        aria-label={t("c_help")}
      >
        <HelpCircle className="w-3 h-3" />
      </button>
      {show && pos && (
        <div
          className="fixed w-52 bg-zinc-900 text-white text-[10px] font-medium leading-relaxed rounded-lg px-3 py-2.5 shadow-xl z-[9999] pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45 -mt-1" />
        </div>
      )}
    </>
  );
}

interface StationReport {
  station_id: number;
  station_name: string;
  river_name: string;
  water_level_now: number;
  alert_level: number;
  minor_flood: number;
  major_flood: number;
  forecast_1h: number | null;
  rainfall_roll3: number;
  is_anomaly: boolean;
  status: "safe" | "alert" | "minor_flood" | "flood";
  delta: number;
  created_at: string;
}

interface DMCBriefStats {
  totalMonitored: number;
  atAlert: number;
  flooding: number;
  anomalies: number;
  lastUpdated: string | null;
}

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  flood: { color: "text-white", bg: "bg-red-500", border: "border-red-200" },
  minor_flood: { color: "text-white", bg: "bg-orange-500", border: "border-orange-200" },
  alert: { color: "text-white", bg: "bg-yellow-500", border: "border-yellow-200" },
  safe: { color: "text-white", bg: "bg-emerald-500", border: "border-emerald-200" },
};

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0.05) return <TrendingUp className="w-3 h-3 text-red-500" />;
  if (delta < -0.05) return <TrendingDown className="w-3 h-3 text-emerald-500" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: any; accent: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:shadow-md transition-all">
      <div className="absolute -top-2 -right-2 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
        <Icon className="w-16 h-16" />
      </div>
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={cn("text-2xl font-black italic tracking-tighter", accent)}>{value}</span>
    </div>
  );
}

export default function WaterLevelBrief() {
  const { t } = useLanguage();
  const [stations, setStations] = useState<StationReport[]>([]);
  const [stats, setStats] = useState<DMCBriefStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    async function fetchData() {
      try {
        const { getLatestDMCBrief } = await import("@/app/actions/forecasting");
        const result = await getLatestDMCBrief();
        setStations(result.stations);
        setStats(result.stats);
      } catch (err) {
        console.error("WaterLevelBrief fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded bg-slate-200" />
          <Skeleton className="h-4 w-48 bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 space-y-2">
              <Skeleton className="h-2 w-16 bg-slate-200" />
              <Skeleton className="h-6 w-10 bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex gap-3 items-center">
                <Skeleton className="w-8 h-8 rounded-lg bg-slate-200" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24 bg-slate-200" />
                  <Skeleton className="h-2 w-32 bg-slate-200" />
                </div>
              </div>
              <Skeleton className="h-4 w-12 bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!stats || stations.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-gray-400" />
          <h3 className="font-black text-zinc-900 italic text-base md:text-lg">{t("c_river_water_level_data")}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <Radio className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-400">{t("c_no_water_data")}</p>
          <p className="text-[10px] text-gray-300 mt-1">{t("c_pipeline_populate_note")}</p>
        </div>
      </section>
    );
  }

  const displayStations = stations.slice(0, 6);
  const hasHighRisk = stats.flooding > 0;

  return (
    <section id="water-level-brief" className="space-y-4 md:space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
          <h3 className="font-black text-zinc-900 italic text-base md:text-lg">{t("c_river_water_level_data")}</h3>
          {hasHighRisk && (
            <span className="ml-2 px-2 py-0.5 bg-red-50 border border-red-100 rounded text-[8px] font-black text-red-500 uppercase tracking-widest animate-pulse">
              {t("c_active_floods_badge")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {stats.lastUpdated && hasMounted && (
            <span className="text-[9px] font-bold text-gray-400 hidden md:inline">
              {t("c_updated_prefix")} {new Date(stats.lastUpdated).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
          )}
          <Link
            href="/ai/report?stationId=21"
            className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-0.5"
          >
            {t("c_full_report")} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* National Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t("c_stat_monitored")} value={stats.totalMonitored} icon={Radio} accent="text-zinc-900" />
        <StatCard label={t("c_stat_at_alert")} value={stats.atAlert} icon={AlertTriangle} accent={stats.atAlert > 0 ? "text-orange-500" : "text-zinc-900"} />
        <StatCard label={t("c_stat_flood_events")} value={stats.flooding} icon={Droplets} accent={stats.flooding > 0 ? "text-red-500" : "text-zinc-900"} />
        <StatCard label={t("c_stat_ai_anomalies")} value={stats.anomalies} icon={Zap} accent={stats.anomalies > 0 ? "text-purple-500" : "text-zinc-900"} />
      </div>

      {/* Station Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50/80 border-b border-gray-100">
          <span className="col-span-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">{t("c_th_station")}</span>
          <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">{t("c_th_river")}</span>
          <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right flex items-center justify-end">
            {t("c_th_level_m")}
            <HelpTooltip text={t("c_tooltip_level")} />
          </span>
          <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right flex items-center justify-end">
            {t("c_th_ai_1h")}
            <HelpTooltip text={t("c_tooltip_ai_1h")} />
          </span>
          <span className="col-span-1 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">{t("c_th_status")}</span>
          <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">{t("c_updated_prefix")}</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
          {displayStations.map((station, idx) => {
            const cfg = statusConfig[station.status];
            const statusLabels: Record<string, string> = {
              flood: t("c_status_flood"),
              minor_flood: t("c_status_minor"),
              alert: t("c_status_alert"),
              safe: t("c_status_safe"),
            };
            return (
              <Link
                key={station.station_id}
                href={`/ai/report?stationId=${station.station_id}`}
                className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-blue-50/40 transition-all group cursor-pointer"
                title={`${t("c_last_updated_prefix")} ${new Date(station.created_at).toLocaleString()}`}
              >
                {/* Station Name */}
                <div className="col-span-5 md:col-span-3 flex items-center gap-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black",
                    station.status === "flood" ? "bg-red-100 text-red-600" :
                    station.status === "minor_flood" ? "bg-orange-100 text-orange-600" :
                    station.status === "alert" ? "bg-yellow-100 text-yellow-600" :
                    "bg-emerald-50 text-emerald-600"
                  )}>
                    <Waves className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-zinc-900 italic truncate group-hover:text-blue-600 transition-colors">
                      {station.station_name}
                    </p>
                    <p className="text-[9px] font-bold text-gray-400 truncate md:hidden">
                      {station.river_name.split("(")[0].trim()}
                    </p>
                  </div>
                </div>

                {/* River (desktop only) */}
                <div className="hidden md:block col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{station.river_name}</p>
                </div>

                {/* Water Level + Delta */}
                <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-1.5">
                  <TrendIcon delta={station.delta} />
                  <span className="text-xs font-black text-zinc-900 italic tabular-nums">
                    {station.water_level_now.toFixed(2)}
                  </span>
                  <span className={cn(
                    "text-[8px] font-black tabular-nums",
                    station.delta > 0 ? "text-red-400" : station.delta < 0 ? "text-emerald-400" : "text-gray-300"
                  )}>
                    {station.delta > 0 ? "+" : ""}{station.delta.toFixed(2)}
                  </span>
                </div>

                {/* AI Forecast */}
                <div className="hidden md:flex col-span-2 items-center justify-end gap-1">
                  {station.forecast_1h != null ? (
                    <>
                      <Activity className="w-3 h-3 text-orange-400" />
                      <span className="text-xs font-black text-orange-500 italic tabular-nums">
                        {station.forecast_1h.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-300">—</span>
                  )}
                </div>

                {/* Status Badge */}
                <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-[0.08em]",
                    cfg.color, cfg.bg
                  )}>
                    {statusLabels[station.status]}
                  </span>
                  {station.is_anomaly && (
                    <span
                      className="ml-1.5 px-1 py-0.5 bg-purple-100 text-purple-600 text-[7px] font-black rounded uppercase cursor-help"
                      title={t("c_anomaly_tooltip")}
                    >
                      AI
                    </span>
                  )}
                </div>

                {/* Last Updated */}
                <div className="col-span-2 md:col-span-2 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3 text-gray-300 hidden md:block" />
                  <span className="text-[9px] font-bold text-gray-400 tabular-nums">
                    {new Date(station.created_at).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        {stations.length > 6 && (
          <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[9px] font-bold text-gray-400 italic">
              {t("c_showing_top")} 6 {t("c_of")} {stations.length} {t("c_monitored_stations_suffix")}
            </span>
            <Link
              href="/ai/report?stationId=21"
              className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-0.5"
            >
              {t("c_view_all")} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Source Attribution */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold text-gray-400">{t("c_data_source_label")}: DMC Sri Lanka — dmc.gov.lk</span>
        </div>
        <span className="text-[9px] font-bold text-gray-300 italic">Outbreak Data Pipeline v2</span>
      </div>
    </section>
  );
}
