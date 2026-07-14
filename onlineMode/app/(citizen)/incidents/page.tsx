"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import DataCard from "@/components/DataCard";
import { Search, Filter, MapPin } from "lucide-react";
import { getCityFromCoords } from "@/lib/geocoding";
import { useLanguage } from "@/context/LanguageContext";

export default function IncidentsPage() {
  const { t } = useLanguage();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity, setFilterCity] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const { getAllIncidents } = await import('@/app/actions/data');
        const data = await getAllIncidents();
        
        if (data) {
          // Resolve cities for all incidents
          const withCities = await Promise.all(data.map(async (inc: any) => {
            let city = "Unknown Location";
            if (inc.latitude && inc.longitude) {
              city = await getCityFromCoords(inc.latitude, inc.longitude);
            }
            return { ...inc, city };
          }));
          setIncidents(withCities);
        } else {
          setIncidents([]);
        }
      } catch (err) {
        console.error("Failed to fetch incidents data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const uniqueCities = useMemo(() => {
    const cities = incidents.map(i => i.city).filter(Boolean);
    return Array.from(new Set(cities)).sort();
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = incident.itype.toLowerCase().includes(query) || incident.description?.toLowerCase().includes(query);
      const matchesStatus = filterStatus === "all" || incident.status === filterStatus;
      const matchesCity = filterCity === "all" || incident.city === filterCity;

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [incidents, searchQuery, filterStatus, filterCity]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 md:px-8 md:py-20 mt-16 md:mt-20">
        <PageHeader
          title={t("c_active_incidents_title")}
          description={t("c_active_incidents_desc")}
          count={incidents.length}
          countLabel={t("c_live_reports")}
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-8 text-red-400 text-sm">
            {t("c_load_error")}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center mb-8">
          <div className="relative flex-1 w-full flex items-center">
            <Search className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder={t("c_search_incidents_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
            />
          </div>
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl hidden md:block">
              <MapPin className="w-5 h-5 text-gray-500" />
            </div>
            <select 
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none cursor-pointer"
            >
              <option value="all">{t("c_all_cities")}</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl hidden md:block">
              <Filter className="w-5 h-5 text-gray-500" />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none cursor-pointer"
            >
              <option value="all">{t("c_all_status")}</option>
              <option value="pending">{t("c_status_pending_verification")}</option>
              <option value="verified">{t("c_status_verified")}</option>
              <option value="resolved">{t("c_status_resolved")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {loading ? (
             [1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-[32px] border border-gray-200" />)
          ) : filteredIncidents.length > 0 ? (
            filteredIncidents.map((incident) => (
              <DataCard
                key={incident.id}
                variant="incident"
                title={incident.itype}
                description={incident.description}
                status={incident.status}
                timestamp={new Date(incident.created_at).toLocaleString()}
                location={incident.distance_km != null ? `${incident.city} (${incident.distance_km} km away)` : incident.city}
                category={t("c_incident_type_category")}
                imageUrl={incident.evidence_photo_url}
                severity={incident.status === 'verified' ? 'high' : incident.status === 'resolved' ? 'info' : 'medium'}
              />
            ))
          ) : !error && (
            <div className="col-span-full py-20 text-center text-gray-400 font-medium bg-white rounded-3xl border border-dashed border-gray-200">
              {t("c_no_matching_incidents")}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
