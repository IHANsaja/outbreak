"use client";
import React, { useState, useEffect, useMemo } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Plus, Search, Filter, AlertTriangle, Trash2, CheckCircle, MapPin, Loader2, Zap } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getAllHazards, deleteHazard, resolveHazard } from "@/app/actions/data";
import AddHazardModal from "@/components/AddHazardModal";
import { cn } from "@/lib/utils";

export default function HazardsPage() {
  const { showToast } = useToast();
  const [hazards, setHazards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function fetchHazards() {
    setLoading(true);
    try {
      const data = await getAllHazards();
      setHazards(data);
    } catch (err) {
      showToast("Failed to fetch hazards", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHazards();
  }, []);

  const filteredHazards = useMemo(() => {
    return hazards.filter(h => {
      const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           h.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterSeverity === "all" || h.severity.toLowerCase() === filterSeverity.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [hazards, searchQuery, filterSeverity]);

  const handleResolve = async (id: string) => {
    try {
      await resolveHazard(id);
      showToast("Hazard marked as resolved", "success");
      fetchHazards();
    } catch (err) {
      showToast("Failed to resolve hazard", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hazard permanently?")) return;
    try {
      await deleteHazard(id);
      showToast("Hazard deleted", "success");
      fetchHazards();
    } catch (err) {
      showToast("Failed to delete hazard", "error");
    }
  };

  return (
    <AuthorityLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hazard Zones</h1>
            <p className="text-slate-500 text-sm">Monitor and manage dangerous areas nationwide.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-5 h-5" />
            Add Hazard Zone
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-auth-border auth-card-shadow">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search hazards..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/10 transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Hazards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[32px] border border-auth-border" />)
          ) : filteredHazards.length > 0 ? (
            filteredHazards.map((hazard) => (
              <HazardCard 
                key={hazard.id} 
                hazard={hazard} 
                onResolve={() => handleResolve(hazard.id)}
                onDelete={() => handleDelete(hazard.id)}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-slate-300 font-bold uppercase tracking-widest italic">
              No matching hazards found
            </div>
          )}
        </div>
      </div>

      <AddHazardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchHazards}
      />
    </AuthorityLayout>
  );
}

function HazardCard({ hazard, onResolve, onDelete }: { hazard: any, onResolve: () => void, onDelete: () => void }) {
  const isResolved = hazard.status === 'resolved';

  return (
    <div className={cn("bg-white p-6 rounded-[32px] border border-auth-border auth-card-shadow group transition-all duration-300", 
      isResolved ? "opacity-60 bg-slate-50" : "hover:border-orange-500/20")}>
      <div className="flex justify-between items-start mb-6">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 shadow-sm",
          hazard.severity.toLowerCase() === 'critical' ? 'bg-red-50 border-red-100 text-red-500' :
          hazard.severity.toLowerCase() === 'high' ? 'bg-orange-50 border-orange-100 text-orange-500' :
          'bg-yellow-50 border-yellow-100 text-yellow-500'
        )}>
          <Zap className="w-6 h-6" />
        </div>
        <div className="flex gap-2">
           {!isResolved && (
             <button 
               onClick={onResolve}
               className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors shadow-sm"
               title="Mark as Resolved"
             >
                <CheckCircle className="w-4 h-4" />
             </button>
           )}
           <button 
             onClick={onDelete}
             className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
             title="Delete Permanently"
           >
              <Trash2 className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
           <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 group-hover:text-orange-500 transition-colors">{hazard.title}</h3>
              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter", 
                isResolved ? "bg-slate-200 text-slate-500" : "bg-orange-500 text-white")}>
                {hazard.status}
              </span>
           </div>
           <p className="text-xs text-slate-500 mt-1 line-clamp-2">{hazard.description || "No hazards details provided for this location."}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
           <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-3 h-3" />
              {hazard.distance_km != null ? (
                <span className="text-[10px] font-bold tracking-tighter text-orange-500 uppercase">{hazard.distance_km} km away</span>
              ) : (
                <span className="text-[10px] font-bold font-mono tracking-tighter uppercase">{hazard.latitude}, {hazard.longitude}</span>
              )}
           </div>
           <span className={cn("text-[10px] font-black uppercase tracking-widest", 
             hazard.severity.toLowerCase() === 'critical' ? 'text-red-500' :
             hazard.severity.toLowerCase() === 'high' ? 'text-orange-500' : 'text-yellow-600'
           )}>
             {hazard.severity}
           </span>
        </div>
      </div>
    </div>
  );
}
