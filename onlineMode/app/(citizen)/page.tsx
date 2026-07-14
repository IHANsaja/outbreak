"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AlertCard from "@/components/AlertCard";
import QuickActionCard from "@/components/QuickActionCard";
import { OfficialUpdates } from "@/components/DashboardWidgets";
import WaterLevelBrief from "@/components/WaterLevelBrief";
import { HazardsModal, ReportModal, SOSModal } from "@/components/ModalSystem";
import SituationMap from "@/components/SituationMap";
import {
  LifeBuoy,
  Bell,
  Map as MapIcon,
  Maximize2,
  Camera,
  Activity,
  CheckCircle2,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

type HomeHazard = {
  id: string | number;
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  created_at?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  distance_km?: number | null;
};

type HomeIncident = {
  id: string | number;
  itype?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  distance_km?: number | null;
};

type HomeSos = {
  id: string | number;
  stype?: string | null;
  additional_info?: string | null;
  status?: string | null;
  created_at?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  distance_km?: number | null;
};

export default function Home() {
  const [isHazardsOpen, setIsHazardsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [stats, setStats] = useState({ activeIncidents: 0, criticalNeeds: 0, activeHazards: 0, activeSos: 0 });
  const [urgentHazard, setUrgentHazard] = useState<HomeHazard | null>(null);
  const [mapHazards, setMapHazards] = useState<HomeHazard[]>([]);
  const [mapIncidents, setMapIncidents] = useState<HomeIncident[]>([]);
  const [mapNeeds, setMapNeeds] = useState<HomeSos[]>([]);
  const [mapNews, setMapNews] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const { getStats, getActiveHazards, getAllIncidents, getActiveSosRequests, getOfficialUpdates } = await import('@/app/actions/data');
        const { getGlobalAIInsights } = await import('@/app/actions/forecasting');
        const [statsData, hazardsData, incidentsData, sosData, newsData, aiData] = await Promise.all([
          getStats(),
          getActiveHazards(),
          getAllIncidents(),
          getActiveSosRequests(),
          getOfficialUpdates(),
          getGlobalAIInsights()
        ]);
        setStats(statsData);
        setMapHazards(hazardsData);
        setMapIncidents(incidentsData);
        setMapNeeds(sosData);
        setMapNews(newsData);
        setStations(aiData);
        if (hazardsData && hazardsData.length > 0) {
          setUrgentHazard(hazardsData[0]); // Take the most recent active hazard
        }
      } catch (err) {
        console.error('Home Page Data Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar type="dashboard" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-10">

        {/* Urgent Alert Banner */}
        {urgentHazard ? (
          <AlertCard
            variant="compact"
            severity={urgentHazard.severity === 'high' ? 'urgent' : 'moderate'}
            title={urgentHazard.title ?? ""}
            description={urgentHazard.description ?? ""}
            updatedTime={new Date(urgentHazard.created_at || "").toLocaleString()}
            routesHref="/map/situation"
            detailsHref="/news"
          />
        ) : !loading && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-900 tracking-tight">{t("c_no_hazards_status")}</p>
            </div>
            <Link href="/news" className="text-[10px] font-black uppercase text-emerald-600 hover:underline">{t("c_view_history")}</Link>
          </div>
        )}

        {/* Quick Actions Grid */}
        <section className="space-y-4 md:space-y-6">
          <h3 className="font-black text-zinc-900 italic text-base md:text-lg">{t("quick_actions")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <QuickActionCard
              icon={LifeBuoy}
              bgIcon={LifeBuoy}
              title={t("c_request_help")}
              description={t("c_request_help_desc")}
              showSOSBadge={stats.activeSos > 0}
              className="h-full"
              onClick={() => setIsSOSOpen(true)}
            />
            <QuickActionCard
              icon={Camera}
              bgIcon={Camera}
              title={t("c_report_damage")}
              description={t("c_report_damage_desc")}
              count={stats.activeIncidents > 0 ? stats.activeIncidents : undefined}
              className="h-full"
              onClick={() => setIsReportOpen(true)}
            />
            <QuickActionCard
              icon={Bell}
              bgIcon={Activity}
              title={t("c_view_nearby_alerts")}
              description={t("c_view_nearby_alerts_desc")}
              count={stats.activeHazards > 0 ? stats.activeHazards : undefined}
              className="h-full"
              onClick={() => setIsHazardsOpen(true)}
            />
            <QuickActionCard
              icon={Brain}
              bgIcon={Brain}
              title={t("c_ai_flood_forecast")}
              description={t("c_ai_flood_forecast_desc")}
              className="h-full"
              onClick={() => router.push('/ai')}
            />
          </div>
        </section>

        {/* Situation Map */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <h3 className="font-black text-zinc-900 italic text-sm md:text-base">{t("situation_map")}</h3>
            </div>
            <Link
              href="/map/situation"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 shadow-sm transition hover:bg-gray-50 active:scale-95"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              {t("c_open_full_map")}
            </Link>
          </div>

          <div className="relative h-[420px] overflow-hidden rounded-2xl border border-gray-100 shadow-sm md:h-[520px] lg:h-[620px]">
            <SituationMap
              hazards={mapHazards}
              incidents={mapIncidents}
              needs={mapNeeds}
              news={mapNews}
              userLocation={[6.9271, 79.8612]}
            />
          </div>
        </div>

        {/* DMC Water Level Brief — Live from Data Pipeline */}
        <WaterLevelBrief />

        {/* Official Updates */}
        <OfficialUpdates />

      </main>

      <Footer />

      {/* Modals */}
      <HazardsModal isOpen={isHazardsOpen} onClose={() => setIsHazardsOpen(false)} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </div>
  );
}
