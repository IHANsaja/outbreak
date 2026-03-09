"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import DataCard from "@/components/DataCard";
import { Search, Filter, MapPin, LifeBuoy } from "lucide-react";
import { getCityFromCoords } from "@/lib/geocoding";

export default function PeopleNeedsPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterSource, setFilterSource] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const { getResources, getRecentSos } = await import('@/app/actions/data');
        const [resourcesData, sosData] = await Promise.all([
          getResources(),
          getRecentSos()
        ]);
        setResources(resourcesData || []);

        // Reverse geocode SOS requests to get city names
        if (sosData) {
          const activeSos = sosData.filter((s: any) => s.status === 'active');
          const withCities = await Promise.all(activeSos.map(async (s: any) => {
            let city = "Unknown Location";
            if (s.latitude && s.longitude) {
              city = await getCityFromCoords(s.latitude, s.longitude);
            }
            return { ...s, city };
          }));
          setHelpRequests(withCities);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const uniqueRegions = useMemo(() => {
    const resourceRegions = resources.map(r => r.regions?.name || r.region_id).filter(Boolean);
    const helpCities = helpRequests.map(h => h.city).filter(Boolean);
    return Array.from(new Set([...resourceRegions, ...helpCities])).sort();
  }, [resources, helpRequests]);

  // Parse structured additional_info from help requests
  function parseHelpInfo(info: string) {
    const parts: Record<string, string> = {};
    if (!info) return parts;
    info.split(' | ').forEach(part => {
      const [key, ...rest] = part.split(': ');
      if (key && rest.length) parts[key.trim()] = rest.join(': ').trim();
    });
    return parts;
  }

  const stypeLabels: Record<string, string> = {
    medical: "Medical Aid",
    rescue: "Rescue Needed",
    supplies: "Food / Water",
    fire: "Fire / Hazard",
    shelter: "Shelter Needed",
    other: "Other Need"
  };

  const combinedItems = useMemo(() => {
    const resourceItems = resources.map(r => ({
      id: `resource-${r.id}`,
      source: "resource" as const,
      title: r.name,
      description: `Resource type: ${r.rtype}. Monitoring inventory levels.`,
      status: r.status,
      timestamp: new Date(r.updated_at).toLocaleString(),
      location: r.regions?.name || r.region_id || "Unknown",
      category: r.rtype,
      quantity: r.quantity?.toString() || "0",
      unit: r.unit,
      severity: (r.status === 'critical' ? 'urgent' : r.status === 'low' ? 'warning' : 'info') as 'urgent' | 'warning' | 'info',
      sortDate: new Date(r.updated_at)
    }));

    const helpItems = helpRequests.map(s => {
      const parsed = parseHelpInfo(s.additional_info || '');
      const urgency = parsed['Urgency'] || 'critical';
      const people = parsed['People affected'];
      const details = parsed['Details'] || s.additional_info || '';
      
      return {
        id: `help-${s.id}`,
        source: "help_request" as const,
        title: stypeLabels[s.stype] || s.stype,
        description: details + (people ? ` — ${people} people affected` : ''),
        status: urgency === 'critical' ? 'critical' : urgency === 'high' ? 'low' : 'adequate',
        timestamp: new Date(s.created_at).toLocaleString(),
        location: s.city || "Unknown",
        category: "Help Request",
        quantity: people || "1",
        unit: people ? "people" : "request",
        severity: (urgency === 'critical' ? 'urgent' : urgency === 'high' ? 'warning' : 'info') as 'urgent' | 'warning' | 'info',
        sortDate: new Date(s.created_at)
      };
    });

    let allItems = [...resourceItems, ...helpItems].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

    return allItems.filter(item => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = item.title.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
      
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const matchesRegion = filterRegion === "all" || item.location === filterRegion;
      const matchesSource = filterSource === "all" || item.source === filterSource;

      return matchesSearch && matchesStatus && matchesRegion && matchesSource;
    });
  }, [resources, helpRequests, searchQuery, filterStatus, filterRegion, filterSource]);

  const totalCritical = resources.filter(r => r.status === 'critical' || r.status === 'low').length + helpRequests.length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 md:px-8 md:py-20 mt-16 md:mt-20">
        <PageHeader 
          title="Community Needs" 
          description="Resource shortages and active help requests from the community."
          count={totalCritical}
          countLabel="Active Needs"
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
              placeholder="Search needs, resources, or help requests..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
            />
          </div>
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl hidden md:block">
              <LifeBuoy className="w-5 h-5 text-gray-500" />
            </div>
            <select 
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="resource">Resources Only</option>
              <option value="help_request">Help Requests Only</option>
            </select>
          </div>
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl hidden md:block">
              <MapPin className="w-5 h-5 text-gray-500" />
            </div>
            <select 
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none cursor-pointer"
            >
              <option value="all">All Locations</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>{region}</option>
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
              <option value="all">All Urgency</option>
              <option value="critical">Critical</option>
              <option value="low">High / Low Stock</option>
              <option value="adequate">Moderate / Adequate</option>
              <option value="surplus">Surplus</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {loading ? (
             [1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-[32px] border border-gray-200" />)
          ) : combinedItems.length > 0 ? (
            combinedItems.map((item) => (
              <DataCard
                key={item.id}
                variant="need"
                title={item.title}
                description={item.description}
                status={item.status}
                timestamp={item.timestamp}
                location={item.location}
                category={item.category}
                quantity={item.quantity}
                unit={item.unit}
                severity={item.severity}
              />
            ))
          ) : !error && (
            <div className="col-span-full py-20 text-center text-gray-400 font-medium bg-white rounded-3xl border border-dashed border-gray-200">
              No matching needs found for this filter.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
