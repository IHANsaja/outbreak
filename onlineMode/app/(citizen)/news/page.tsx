"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import DataCard from "@/components/DataCard";
import { Search, Filter, MapPin } from "lucide-react";
import { getCityFromCoords } from "@/lib/geocoding";

export default function NewsPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCity, setFilterCity] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const { getOfficialUpdates, getActiveHazards } = await import('@/app/actions/data');
        const [updatesData, hazardsData] = await Promise.all([
          getOfficialUpdates(),
          getActiveHazards()
        ]);
        setUpdates(updatesData || []);

        if (hazardsData) {
          const withCities = await Promise.all(hazardsData.map(async (h: any) => {
            let city = "Unknown Location";
            if (h.latitude && h.longitude) {
              city = await getCityFromCoords(h.latitude, h.longitude);
            }
            return { ...h, city };
          }));
          setHazards(withCities);
        } else {
          setHazards([]);
        }

      } catch (err) {
        console.error("Failed to fetch news data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const uniqueCities = useMemo(() => {
    const hazardCities = hazards.map(h => h.city).filter(Boolean);
    const updateLocations = updates.map(() => "Command Center"); // Official updates are global
    return Array.from(new Set([...hazardCities, ...updateLocations])).sort();
  }, [hazards, updates]);

  const combinedData = useMemo(() => {
    const formattedHazards = hazards.map(h => ({
      id: `hazard-${h.id}`,
      variant: "hazard" as const,
      title: h.title,
      description: h.description,
      status: h.status,
      timestamp: new Date(h.created_at),
      location: h.distance_km != null ? `${h.city} (${h.distance_km} km away)` : h.city,
      city: h.city,
      category: "Hazard Alert",
      severity: h.severity === 'high' || h.severity === 'critical' || h.severity === 'Critical' ? 'urgent' : h.severity === 'medium' || h.severity === 'moderate' || h.severity === 'High' ? 'warning' : 'info'
    }));

    const formattedUpdates = updates.map(u => ({
      id: `update-${u.id}`,
      variant: "update" as const,
      title: u.title,
      description: u.content,
      status: "Verified",
      timestamp: new Date(u.created_at),
      location: "Command Center",
      city: "Command Center", // Special City group for updates
      category: "Official News",
      severity: u.severity === 'urgent' ? 'urgent' : u.severity === 'warning' ? 'warning' : 'info'
    }));

    let allItems = [...formattedHazards, ...formattedUpdates].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return allItems.filter(item => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = item.title.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
      
      let matchesFilter = true;
      if (filterType === 'hazards') matchesFilter = item.variant === 'hazard';
      if (filterType === 'updates') matchesFilter = item.variant === 'update';
      if (filterType === 'urgent') matchesFilter = item.severity === 'urgent';

      const matchesCity = filterCity === "all" || item.city === filterCity;

      return matchesSearch && matchesFilter && matchesCity;
    });

  }, [updates, hazards, searchQuery, filterType, filterCity]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 md:px-8 md:py-20 mt-16 md:mt-20">
        <PageHeader 
          title="Official News & Alerts" 
          description="Verified updates and hazard warnings from the disaster management command center."
          count={hazards.length}
          countLabel="Active Hazards"
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-8 text-red-400 text-sm">
            Failed to load live data. Showing connection error.
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center mb-8">
          <div className="relative flex-1 w-full flex items-center">
            <Search className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search news & alerts..." 
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
              <option value="all">All Locations</option>
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none cursor-pointer"
            >
              <option value="all">All Updates</option>
              <option value="hazards">Hazards Only</option>
              <option value="updates">Official News Only</option>
              <option value="urgent">Urgent Only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {loading ? (
             [1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-[32px] border border-gray-200" />)
          ) : combinedData.length > 0 ? (
            combinedData.map((item) => (
              <DataCard
                key={item.id}
                variant={item.variant}
                title={item.title}
                description={item.description}
                status={item.status}
                timestamp={item.timestamp.toLocaleString()}
                location={item.location}
                category={item.category}
                severity={item.severity as 'info' | 'warning' | 'urgent'}
              />
            ))
          ) : !error && (
            <div className="col-span-full py-20 text-center text-gray-400 font-medium bg-white rounded-3xl border border-dashed border-gray-200">
              No matching news or alerts found for this filter.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
