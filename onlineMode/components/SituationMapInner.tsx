"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, Camera, LifeBuoy, Navigation, LocateFixed, Megaphone, Droplets, CloudRain, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { renderToString } from "react-dom/server";
import { updateUserLocation } from "@/app/actions/data";
import { getMapStations } from "@/app/actions/forecasting";
import { useToast } from "@/context/ToastContext";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

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
  selectedStationId?: number;
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

export default function SituationMapInner({ hazards, incidents, needs, news, userLocation: initialLocation, selectedStationId }: MapInnerProps) {
  const { t } = useLanguage();
  const { location: liveLocation, error: locationError } = useLiveLocation(true);
  const [userLocation, setUserLocation] = useState<Coordinates>(initialLocation);
  const [isLocating, setIsLocating] = useState(false);
  const [riverStations, setRiverStations] = useState<any[]>([]);
  const { showToast } = useToast();

  // Self-contained: fetch ALL station data on mount
  useEffect(() => {
    getMapStations().then(setRiverStations).catch(err => console.error('Map station fetch error:', err));
  }, []);

  // Sync manual userLocation state with liveLocation hook
  useEffect(() => {
    if (liveLocation) {
      setUserLocation(liveLocation);
    }
  }, [liveLocation]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast(t("au_geolocation_unsupported_toast"), "error");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newCoords: Coordinates = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newCoords);
        setIsLocating(false);
        showToast(t("au_location_updated_toast"), "success");

        // Persist to database
        try {
          await updateUserLocation(newCoords[0], newCoords[1]);
        } catch (err) {
          console.error("Failed to persist location:", err);
        }
      },
      (error) => {
        setIsLocating(false);
        showToast(t("au_location_retrieve_failed_toast"), "error");
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

  const stationIcon = (status: string, isSelected: boolean) => {
    const color = status === 'major' ? '#ef4444' : 
                  status === 'minor' ? '#f97316' : 
                  status === 'alert' ? '#fbbf24' : '#10b981';
    
    const iconHtml = renderToString(
      <div className="relative">
        {isSelected && <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-40"></div>}
        <div style={{
          backgroundColor: color,
          padding: isSelected ? '10px' : '6px',
          borderRadius: '50%',
          border: isSelected ? '3px solid white' : '2px solid white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          position: 'relative'
        }}>
          <Droplets size={isSelected ? 18 : 12} strokeWidth={3} />
        </div>
      </div>
    );

    return L.divIcon({
      html: iconHtml,
      className: '',
      iconSize: isSelected ? [42, 42] : [28, 28],
      iconAnchor: isSelected ? [21, 21] : [14, 14],
    });
  };

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
            <div className="p-1 font-bold">{t("au_you_are_here")}</div>
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
                  <h4 className="font-bold text-red-600">{h.title || t("au_hazard_fallback")}</h4>
                  <p className="text-xs">{h.description}</p>
                  {h.distance_km && <p className="text-[10px] font-bold uppercase text-gray-500">{h.distance_km} {t("au_km_away")}</p>}
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
                  <h4 className="font-bold text-orange-500">{i.itype || t("au_incident_fallback")}</h4>
                  <p className="text-xs">{i.description}</p>
                  {i.distance_km && <p className="text-[10px] font-bold uppercase text-gray-500">{i.distance_km} {t("au_km_away")}</p>}
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
                  <h4 className="font-bold text-purple-600">{n.stype || t("au_need_fallback")}</h4>
                  <p className="text-xs">{n.additional_info}</p>
                  {n.distance_km && <p className="text-[10px] font-bold uppercase text-gray-500">{n.distance_km} {t("au_km_away")}</p>}
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
                    <span className="bg-yellow-100 text-yellow-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">{t("au_official_update_badge")}</span>
                  </div>
                  <h4 className="font-bold text-yellow-600">{nw.title}</h4>
                  <p className="text-xs line-clamp-3">{nw.content}</p>
                  {nw.distance_km && <p className="text-[10px] font-bold uppercase text-gray-500">{nw.distance_km} {t("au_km_away")}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* ══════ River Stations — Self-contained ══════ */}
        {riverStations.map((s) => {
          if (!s.latitude || !s.longitude) return null;

          const wl = s.water_level_now;
          const hasLive = s.hasData && wl != null;

          // Determine flood status
          const status = !hasLive ? 'inactive' :
                         wl >= (s.major_flood ?? Infinity) ? 'major' :
                         wl >= (s.minor_flood ?? Infinity) ? 'minor' :
                         wl >= (s.alert_level ?? Infinity) ? 'alert' : 'normal';

          const isSelected = s.station_id === selectedStationId;
          const f1h = s.forecast_1h;
          const f12h = s.forecast_12h;
          const f24h = s.forecast_24h;

          // Color for marker
          const markerColor = status === 'major' ? '#ef4444' :
                              status === 'minor' ? '#f97316' :
                              status === 'alert' ? '#eab308' :
                              status === 'normal' ? '#10b981' : '#94a3b8';

          return (
            <Marker
               key={`station-${s.station_id}`}
               position={[s.latitude, s.longitude]}
               icon={stationIcon(status === 'inactive' ? 'normal' : status, isSelected)}
               zIndexOffset={isSelected ? 1000 : status === 'major' ? 500 : status === 'minor' ? 400 : 0}
            >
              {/* Permanent label showing water level + trend */}
              {hasLive && (
                <Tooltip
                  permanent
                  direction="right"
                  offset={[15, 0]}
                  className="custom-map-tooltip"
                >
                  <div className="flex items-center gap-1 font-black text-[10px]">
                    <span>{wl.toFixed(1)}m</span>
                    {f12h != null && (
                      <span className={cn(
                        "text-[8px]",
                        f12h > wl ? "text-red-500" : f12h < wl ? "text-emerald-500" : "text-zinc-400"
                      )}>
                        {f12h > wl ? "▲" : f12h < wl ? "▼" : "—"}
                      </span>
                    )}
                  </div>
                </Tooltip>
              )}

              {/* Click popup with full AI intelligence */}
              <Popup className="station-popup">
                <div style={{ minWidth: 220, fontFamily: 'system-ui, sans-serif' }}>
                  {/* Header */}
                  <div style={{ borderBottom: '1px solid #f4f4f5', paddingBottom: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#18181b', lineHeight: 1.2 }}>{s.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.river}</div>
                  </div>

                  {hasLive ? (
                    <>
                      {/* Status badge + current level */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', color: 'white',
                          backgroundColor: markerColor
                        }}>{status === 'normal' ? t("au_safe_status") : status.toUpperCase()} {t("au_level_suffix")}</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#18181b' }}>{wl.toFixed(2)}m</span>
                      </div>

                      {/* Water level change */}
                      {s.water_level_lag1 != null && (
                        <div style={{ fontSize: 10, color: '#71717a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: wl > s.water_level_lag1 ? '#ef4444' : '#10b981', fontWeight: 900 }}>
                            {wl > s.water_level_lag1 ? '▲' : '▼'} {Math.abs(wl - s.water_level_lag1).toFixed(2)}m
                          </span>
                          <span>{t("au_from_last_reading")}</span>
                        </div>
                      )}

                      {/* AI Forecasts */}
                      <div style={{ backgroundColor: '#fafafa', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>🧠 {t("au_ai_predictions_header")}</div>
                        {[
                          { label: t("au_forecast_1h"), val: f1h },
                          { label: t("au_forecast_12h"), val: f12h },
                          { label: t("au_forecast_24h_strategic"), val: f24h },
                        ].map(f => (
                          <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontWeight: 700, padding: '3px 0', borderBottom: '1px solid #f4f4f5' }}>
                            <span style={{ color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{f.label}</span>
                            {f.val != null ? (
                              <span style={{ fontWeight: 900, color: f.val > wl ? '#ef4444' : f.val < wl ? '#10b981' : '#71717a' }}>
                                {f.val.toFixed(2)}m {f.val > wl ? '↑' : f.val < wl ? '↓' : '→'}
                              </span>
                            ) : (
                              <span style={{ color: '#d4d4d8' }}>—</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Rainfall + Thresholds */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <div style={{ backgroundColor: '#eff6ff', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                          <div style={{ fontSize: 8, fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t("au_rainfall_3h")}</div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#1d4ed8' }}>{s.rainfall_roll3 != null ? `${s.rainfall_roll3.toFixed(1)}mm` : '—'}</div>
                        </div>
                        <div style={{ backgroundColor: s.is_anomaly ? '#fef2f2' : '#f0fdf4', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                          <div style={{ fontSize: 8, fontWeight: 900, color: s.is_anomaly ? '#ef4444' : '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.is_anomaly ? t("au_anomaly_label") : t("au_sensor_label")}</div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: s.is_anomaly ? '#dc2626' : '#16a34a' }}>{s.is_anomaly ? `⚠ ${t("au_flagged")}` : `✓ ${t("au_ok_status")}`}</div>
                        </div>
                      </div>

                      {/* Flood thresholds */}
                      {(s.alert_level || s.minor_flood || s.major_flood) && (
                        <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #f4f4f5' }}>
                          <div style={{ fontSize: 8, fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{t("au_flood_thresholds")}</div>
                          <div style={{ display: 'flex', gap: 6, fontSize: 9, fontWeight: 800 }}>
                            {s.alert_level != null && <span style={{ color: '#eab308' }}>⚡ {t("au_alert_colon")} {s.alert_level}m</span>}
                            {s.minor_flood != null && <span style={{ color: '#f97316' }}>▲ {t("au_minor_colon")} {s.minor_flood}m</span>}
                            {s.major_flood != null && <span style={{ color: '#ef4444' }}>⚠ {t("au_major_colon")} {s.major_flood}m</span>}
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      {s.timestamp && (
                        <div style={{ marginTop: 6, fontSize: 8, fontWeight: 700, color: '#d4d4d8', textAlign: 'right' }}>
                          {t("au_updated_colon")} {new Date(s.timestamp).toLocaleString()}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: '#a1a1aa', fontSize: 11, fontWeight: 700 }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>📡</div>
                      {t("au_no_live_telemetry")}
                      <div style={{ fontSize: 9, color: '#d4d4d8', marginTop: 4 }}>{t("au_station_not_monitored")}</div>
                    </div>
                  )}

                  {isSelected && (
                    <div style={{ marginTop: 8, paddingTop: 6, borderTop: '2px dashed #dbeafe', display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 900, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                      <div style={{ width: 6, height: 6, backgroundColor: '#3b82f6', borderRadius: '50%' }} />
                      {t("au_dashboard_target")}
                    </div>
                  )}
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
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-800">{t("au_situation_map_sri_lanka")}</span>
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
            {isLocating ? t("au_locating") : t("au_update_my_gps")}
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
        .custom-map-tooltip {
          background: rgba(15, 23, 42, 0.9) !important;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 6px !important;
          color: white !important;
          padding: 2px 6px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        }
        .custom-map-tooltip::before {
          border-right-color: rgba(15, 23, 42, 0.9) !important;
        }
      `}</style>
    </div>
  );
}
