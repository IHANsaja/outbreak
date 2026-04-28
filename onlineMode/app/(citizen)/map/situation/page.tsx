"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import SituationMap from "@/components/SituationMap";

type Hazard = {
  id: string | number;
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  created_at?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type Incident = {
  id: string | number;
  itype?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type Need = {
  id: string | number;
  stype?: string | null;
  additional_info?: string | null;
  status?: string | null;
  created_at?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export default function SituationMapPage() {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMapData() {
      try {
        const { getActiveHazards, getAllIncidents, getActiveSosRequests, getOfficialUpdates } = await import("@/app/actions/data");
        const [hazardData, incidentData, needData, newsData] = await Promise.all([
          getActiveHazards(),
          getAllIncidents(),
          getActiveSosRequests(),
          getOfficialUpdates(),
        ]);

        setHazards(hazardData);
        setIncidents(incidentData);
        setNeeds(needData);
        setNews(newsData);
      } catch (error) {
        console.error("Situation map data error:", error);
      }
    }

    fetchMapData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <MapIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-500">Live proximity map</p>
              <h1 className="text-xl font-black italic text-zinc-900">Situation Map</h1>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-900 shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="h-[calc(100vh-152px)] min-h-[540px] overflow-hidden rounded-[28px] border border-gray-100 shadow-sm">
          <SituationMap 
            hazards={hazards} 
            incidents={incidents} 
            needs={needs} 
            news={news}
            userLocation={[6.9271, 79.8612]} 
          />
        </div>
      </main>
    </div>
  );
}
