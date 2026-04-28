"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, Camera, LifeBuoy, Navigation, LocateFixed, Megaphone } from "lucide-react";
import { renderToString } from "react-dom/server";
import { updateUserLocation } from "@/app/actions/data";
import { useToast } from "@/context/ToastContext";
import { useLiveLocation } from "@/hooks/useLiveLocation";

// Fix for default marker icons in Leaflet with Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

type Coordinates = [number, number];

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

interface MapInnerProps {
  hazards: MapItem[];
  incidents: MapItem[];
  needs: MapItem[];
  news: MapItem[];
  userLocation: Coordinates;
}

const createCustomIcon = (color: string, IconComponent: any) => {
  const iconHtml = renderToString(
    <div style={{
      backgroundColor: color,
      padding: '8px',
      borderRadius: '50%',
      border: '2px solid white',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <IconComponent size={16} strokeWidth={3} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const userIcon = L.divIcon({
  html: renderToString(
    <div className="relative flex items-center justify-center">
      <div className="absolute w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
      <div className="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
    </div>
  ),
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function RecenterMap({ coords }: { coords: Coordinates }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords);
  }, [coords, map]);
  return null;
}

export default function SituationMapInner({ hazards, incidents, needs, news, userLocation: initialLocation }: MapInnerProps) {
  const { location: liveLocation, error: locationError } = useLiveLocation(true);
  const [userLocation, setUserLocation] = useState<Coordinates>(initialLocation);
  const [isLocating, setIsLocating] = useState(false);
  const { showToast } = useToast();

  // Sync manual userLocation state with liveLocation hook
  useEffect(() => {
    if (liveLocation) {
      setUserLocation(liveLocation);
    }
  }, [liveLocation]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", "error");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newCoords: Coordinates = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newCoords);
        setIsLocating(false);
        showToast("Location updated successfully", "success");
        
        // Persist to database
        try {
          await updateUserLocation(newCoords[0], newCoords[1]);
        } catch (err) {
          console.error("Failed to persist location:", err);
        }
      },
      (error) => {
        setIsLocating(false);
        showToast("Could not retrieve your location", "error");
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true }
    );
  };

  const hazardIcon = useMemo(() => createCustomIcon('#ef4444', AlertTriangle), []);
  const incidentIcon = useMemo(() => createCustomIcon('#f97316', Camera), []);
  const needIcon = useMemo(() => createCustomIcon('#8b5cf6', LifeBuoy), []);
  
  // Striking News Icon with Animation
  const newsIcon = useMemo(() => {
    const iconHtml = renderToString(
      <div className="relative">
        <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
        <div style={{
          backgroundColor: '#fbbf24', // Amber/Yellow
          padding: '8px',
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          position: 'relative'
        }}>
          <Megaphone size={16} strokeWidth={3} />
        </div>
      </div>
    );

    return L.divIcon({
      html: iconHtml,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, []);

  const asCoord = (item: MapItem): [number, number] | null => {
    const lat = typeof item.latitude === 'string' ? parseFloat(item.latitude) : item.latitude;
    const lng = typeof item.longitude === 'string' ? parseFloat(item.longitude) : item.longitude;
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) return [lat, lng];
    return null;
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={userLocation}
        zoom={10}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />
        
        <RecenterMap coords={userLocation} />

        {/* User Location */}
        <Marker position={userLocation} icon={userIcon}>
          <Popup className="custom-popup">
            <div className="p-1 font-bold">You are here</div>
          </Popup>
        </Marker>
        <Circle 
          center={userLocation} 
          radius={5000} 
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '5, 10' }} 
        />

        {/* Hazards */}
        {hazards.map((h) => {
          const pos = asCoord(h);
          if (!pos) return null;
          return (
            <Marker key={`h-${h.id}`} position={pos} icon={hazardIcon}>
              <Popup>
                <div className="space-y-1">
                  <h4 className="font-bold text-red-600">{h.title || 'Hazard'}</h4>
                  <p className="text-xs">{h.description}</p>
                  {h.distance_km && <p className="text-[10px] font-bold uppercase text-gray-500">{h.distance_km}km away</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Incidents */}
        {incidents.map((i) => {
          const pos = asCoord(i);
          if (!pos) return null;
          return (
            <Marker key={`i-${i.id}`} position={pos} icon={incidentIcon}>
              <Popup>
                <div className="space-y-1">
                  <h4 className="font-bold text-orange-500">{i.itype || 'Incident'}</h4>
                  <p className="text-xs">{i.description}</p>
                  {i.distance_km && <p className="text-[10px] font-bold uppercase text-gray-500">{i.distance_km}km away</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Needs */}
        {needs.map((n) => {
          const pos = asCoord(n);
          if (!pos) return null;
          return (
            <Marker key={`n-${n.id}`} position={pos} icon={needIcon}>
              <Popup>
                <div className="space-y-1">
                  <h4 className="font-bold text-purple-600">{n.stype || 'Need'}</h4>
                  <p className="text-xs">{n.additional_info}</p>
                  {n.distance_km && <p className="text-[10px] font-bold uppercase text-gray-500">{n.distance_km}km away</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* News / Official Updates */}
        {news.map((nw) => {
          const pos = asCoord(nw);
          if (!pos) return null;
          return (
            <Marker key={`news-${nw.id}`} position={pos} icon={newsIcon}>
              <Popup>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="bg-yellow-100 text-yellow-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">Official Update</span>
                  </div>
                  <h4 className="font-bold text-yellow-600">{nw.title}</h4>
                  <p className="text-xs line-clamp-3">{nw.content}</p>
                  {nw.distance_km && <p className="text-[10px] font-bold uppercase text-gray-500">{nw.distance_km}km away</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Modern UI Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/50 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-800">Situation Map | Sri Lanka</span>
          </div>
        </div>

        {/* Locate Me Button */}
        <button 
          onClick={handleLocateMe}
          disabled={isLocating}
          className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/50 pointer-events-auto flex items-center gap-3 active:scale-95 transition-all text-slate-700 hover:text-blue-600 disabled:opacity-50"
        >
          {isLocating ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <LocateFixed className="w-4 h-4" />
          )}
          <span className="text-[10px] font-black tracking-widest uppercase">
            {isLocating ? "Locating..." : "Update My GPS"}
          </span>
        </button>
      </div>

      <style jsx global>{`
        .leaflet-container {
          background: #f1f5f9;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
