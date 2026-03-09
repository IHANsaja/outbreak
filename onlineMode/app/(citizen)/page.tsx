"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AlertCard from "@/components/AlertCard";
import QuickActionCard from "@/components/QuickActionCard";
import { NetworkStatus, OfficialUpdates } from "@/components/DashboardWidgets";
import { HazardsModal, ReportModal, SOSModal } from "@/components/ModalSystem";
import {
  LifeBuoy,
  Dam,
  Bell,
  Map as MapIcon,
  Maximize2,
  Plus,
  Camera,
  Activity,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const [isHazardsOpen, setIsHazardsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [stats, setStats] = useState({ activeIncidents: 0, criticalNeeds: 0, activeHazards: 0, activeSos: 0 });
  const [urgentHazard, setUrgentHazard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchData() {
      try {
        const { getStats, getActiveHazards } = await import('@/app/actions/data');
        const [statsData, hazardsData] = await Promise.all([
          getStats(),
          getActiveHazards()
        ]);
        setStats(statsData);
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
            title={urgentHazard.title}
            description={urgentHazard.description}
            updatedTime={new Date(urgentHazard.created_at).toLocaleString()}
            routesHref="/map/situation"
            detailsHref="/news"
          />
        ) : !loading && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-900 tracking-tight">System Status: No immediate hazards in your sector.</p>
            </div>
            <Link href="/news" className="text-[10px] font-black uppercase text-emerald-600 hover:underline">View History</Link>
          </div>
        )}

        {/* Quick Actions Grid */}
        <section className="space-y-4 md:space-y-6">
          <h3 className="font-black text-zinc-900 italic text-base md:text-lg">{t("quick_actions")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <QuickActionCard
              icon={LifeBuoy}
              bgIcon={LifeBuoy}
              title="Request Help"
              description="Medical, Rescue, or Supplies needed immediately."
              showSOSBadge={stats.activeSos > 0}
              className="h-full"
              onClick={() => setIsSOSOpen(true)}
            />
            <QuickActionCard
              icon={Camera}
              bgIcon={Camera}
              title="Report Damage"
              description="Submit photos of infrastructure issues or hazards."
              count={stats.activeIncidents > 0 ? stats.activeIncidents : undefined}
              className="h-full"
              onClick={() => setIsReportOpen(true)}
            />
            <QuickActionCard
              icon={Bell}
              bgIcon={Activity}
              title="View Nearby Alerts"
              description="See active hazard zones in your proximity."
              count={stats.activeHazards > 0 ? stats.activeHazards : undefined}
              className="h-full"
              onClick={() => setIsHazardsOpen(true)}
            />
          </div>
        </section>

        {/* Map and Network Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-8 flex flex-col space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <h3 className="font-black text-zinc-900 italic text-sm md:text-base">{t("situation_map")}</h3>
              </div>
              <span className="text-[9px] md:text-[10px] font-black text-red-500 bg-red-50 px-1.5 md:px-2 py-0.5 rounded uppercase tracking-widest border border-red-100">
                Zone: High Risk
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video lg:aspect-auto flex-1 h-[250px] md:h-[300px] lg:h-[400px] border border-gray-100 shadow-sm bg-blue-50">
              <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/80.010,6.585,13,0/1200x600?access_token=pk.eyJ1IjoiYm9vdGciLCJhIjoiY2toZ3p4Z3p4MDZ6eDJ4bzR4Z3p4Z3p4ZSJ9.0')] bg-cover bg-center" />

              {/* Map Overlay Markers */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative flex flex-col items-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-brand-red ring-4 md:ring-8 ring-brand-red/10">
                      <Plus className="w-4 h-4 md:w-5 md:h-5 text-brand-red" />
                    </div>
                    <div className="bg-white px-1.5 md:px-2 py-0.5 rounded text-[7px] md:text-[8px] font-bold mt-1.5 md:mt-2 shadow-sm border border-gray-100">You</div>
                  </div>
                </div>

                <div className="absolute top-[40%] left-[45%]">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-red/20 rounded-full border border-brand-red/40 animate-pulse flex items-center justify-center">
                    <Dam className="w-5 h-5 md:w-6 md:h-6 text-brand-red" />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6">
                <Link
                  href="/map/situation"
                  className="bg-white/95 backdrop-blur-sm shadow-xl text-zinc-900 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold flex items-center gap-2 text-[10px] md:text-xs border border-gray-100 hover:bg-white transition-all active:scale-95"
                >
                  <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Expand Map
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <NetworkStatus />
          </div>
        </div>

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
