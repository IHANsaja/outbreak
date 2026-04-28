"use client";

import dynamic from "next/dynamic";

const SituationMapInner = dynamic(() => import("./SituationMapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center relative overflow-hidden rounded-[28px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
      <div className="z-10 text-center space-y-4">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Geospatial Engine...</div>
      </div>
    </div>
  ),
});

type MapItem = {
  id: string | number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  title?: string | null;
  description?: string | null;
  content?: string | null;
  severity?: string | null;
  stype?: string | null;
  itype?: string | null;
  additional_info?: string | null;
  distance_km?: number | null;
};

interface MapProps {
  hazards?: MapItem[];
  incidents?: MapItem[];
  needs?: MapItem[];
  news?: MapItem[];
  userLocation?: [number, number];
}

export default function SituationMap({ 
  hazards = [], 
  incidents = [], 
  needs = [], 
  news = [], 
  userLocation = [6.9271, 79.8612] 
}: MapProps) {
  // Leaflet expects [lat, lng] whereas we were using [lng, lat] in react-simple-maps
  // Let's ensure we pass [lat, lng] to SituationMapInner
  
  return (
    <SituationMapInner
      hazards={hazards}
      incidents={incidents}
      needs={needs}
      news={news}
      userLocation={userLocation}
    />
  );
}
