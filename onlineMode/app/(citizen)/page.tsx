"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AlertCard from "@/components/AlertCard";
import QuickActionCard from "@/components/QuickActionCard";
import { NetworkStatus, OfficialUpdates } from "@/components/DashboardWidgets";
import { HazardsModal, ReportModal } from "@/components/ModalSystem";
import { 
  LifeBuoy, 
  Dam, 
  Bell, 
  Map as MapIcon, 
  Maximize2, 
  Plus, 
  Camera,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const [isHazardsOpen, setIsHazardsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar type="dashboard" />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 space-y-10">
        
        {/* Urgent Alert Banner */}
        <AlertCard 
          variant="compact"
          severity="urgent"
          title="FLOOD WARNING: Kalutara District"
          description="Water levels rising rapidly due to heavy rainfall. Evacuate to higher ground immediately if you are in low-lying zones."
          updatedTime="12 mins ago"
          routesHref="/map/navigation"
          detailsHref="/briefing"
        />
        
        {/* Quick Actions Grid */}
        <section className="space-y-6">
          <h3 className="font-black text-zinc-900 italic text-lg">{t("quick_actions")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/sos" className="block outline-none h-full">
              <QuickActionCard 
                icon={LifeBuoy}
                bgIcon={LifeBuoy}
                title="Request Help"
                description="Medical, Rescue, or Supplies needed immediately."
                className="h-full"
              />
            </Link>
            <QuickActionCard 
              icon={Camera}
              bgIcon={Camera}
              title="Report Damage"
              description="Submit photos of infrastructure issues or hazards."
              className="h-full"
              onClick={() => setIsReportOpen(true)}
            />
            <QuickActionCard 
              icon={Bell}
              bgIcon={Activity}
              title="View Nearby Alerts"
              description="See active hazard zones in your proximity."
              count={3}
              className="h-full"
              onClick={() => setIsHazardsOpen(true)}
            />
          </div>
        </section>
        
        {/* Map and Network Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <MapIcon className="w-5 h-5 text-gray-400" />
                   <h3 className="font-black text-zinc-900 italic">{t("situation_map")}</h3>
                </div>
                <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase tracking-widest border border-red-100">
                  Zone: High Risk
                </span>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden aspect-video lg:aspect-auto flex-1 h-[300px] lg:h-[400px] border border-gray-100 shadow-sm bg-blue-50">
                <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/80.010,6.585,13,0/1200x600?access_token=pk.eyJ1IjoiYm9vdGciLCJhIjoiY2toZ3p4Z3p4MDZ6eDJ4bzR4Z3p4Z3p4ZSJ9.0')] bg-cover bg-center" />
                
                {/* Map Overlay Markers */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative flex flex-col items-center">
                       <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-brand-red ring-8 ring-brand-red/10">
                          <Plus className="w-5 h-5 text-brand-red" />
                       </div>
                       <div className="bg-white px-2 py-0.5 rounded text-[8px] font-bold mt-2 shadow-sm border border-gray-100">You</div>
                    </div>
                  </div>
                  
                  <div className="absolute top-[40%] left-[45%]">
                     <div className="w-20 h-20 bg-brand-red/20 rounded-full border border-brand-red/40 animate-pulse flex items-center justify-center">
                        <Dam className="w-6 h-6 text-brand-red" />
                     </div>
                  </div>
                </div>

                <div className="absolute bottom-6 right-6">
                  <Link 
                    href="/map/situation"
                    className="bg-white/95 backdrop-blur-sm shadow-xl text-zinc-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs border border-gray-100 hover:bg-white transition-all active:scale-95"
                  >
                    <Maximize2 className="w-4 h-4" />
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
    </div>
  );
}
