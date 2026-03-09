"use client";
import React, { useState, useMemo, useEffect } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Search, Filter, Plus, ChevronDown, MoreHorizontal, AlertCircle, CheckCircle, Trash2, XCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import CreateIncidentModal from "@/components/CreateIncidentModal";
import { getAllIncidents, updateIncidentStatus, deleteIncident } from "@/app/actions/data";
import { cn } from "@/lib/utils";

export default function IncidentsPage() {
  const { showToast } = useToast();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function fetchIncidents() {
    setLoading(true);
    try {
      const data = await getAllIncidents();
      setIncidents(data);
    } catch (err) {
      showToast("Failed to fetch incidents", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIncidents();
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesSearch = incident.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incident.itype.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "All Types" || incident.itype === typeFilter;
      const matchesStatus = statusFilter === "All Status" || incident.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [incidents, searchTerm, typeFilter, statusFilter]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateIncidentStatus(id, newStatus);
      showToast(`Incident marked as ${newStatus}`, "success");
      fetchIncidents();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this incident report?")) return;
    try {
      await deleteIncident(id);
      showToast("Incident report deleted", "success");
      fetchIncidents();
    } catch (err) {
      showToast("Failed to delete incident", "error");
    }
  };

  return (
    <AuthorityLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Incidents</h1>
            <p className="text-slate-500 mt-1">Manage and track all ongoing disaster situations across regions.</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#f26522] hover:bg-[#d4551c] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-5 h-5" />
            Create New Incident
          </button>
        </div>

        <div className="bg-white rounded-[32px] border border-auth-border auth-card-shadow overflow-hidden">
          {/* Table Filters */}
          <div className="p-6 border-b border-auth-border flex flex-wrap items-center justify-between gap-4">
             <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                <div className="relative flex-1">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search incidents..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-auth-accent-red/20 focus:border-auth-accent-red transition-all"
                   />
                </div>
                <button 
                  onClick={() => { setSearchTerm(""); setTypeFilter("All Types"); setStatusFilter("All Status"); }}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                >
                   <Filter className="w-5 h-5" />
                </button>
             </div>

             <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400 font-medium">Filter:</span>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 focus:outline-none"
                >
                  <option>All Types</option>
                  <option>Flooding</option>
                  <option>Landslide</option>
                  <option>Structural Damage</option>
                  <option>Road Block</option>
                </select>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 focus:outline-none"
                >
                  <option>All Status</option>
                  <option>pending</option>
                  <option>verified</option>
                  <option>resolved</option>
                  <option>rejected</option>
                </select>
             </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-auth-border bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loc / Dist</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-auth-border">
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 animate-pulse font-bold">LOADING DATA...</td></tr>
                ) : filteredIncidents.length > 0 ? filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", 
                            incident.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600')}>
                             <AlertCircle className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{incident.itype}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 max-w-xs truncate">{incident.description || "No description"}</td>
                    <td className="px-6 py-5 text-xs text-slate-500">
                      {incident.distance_km != null ? (
                        <span className="font-bold text-auth-accent-red">{incident.distance_km} km away</span>
                      ) : (
                        <span className="font-mono text-slate-400">{incident.latitude}, {incident.longitude}</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                       <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                         incident.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                         incident.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                         'bg-green-100 text-green-700'
                       )}>
                         {incident.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                      {incident.status === 'pending' && (
                        <button onClick={() => handleStatusUpdate(incident.id, 'verified')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 title='Verify'">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {incident.status !== 'resolved' && (
                        <button onClick={() => handleStatusUpdate(incident.id, 'resolved')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 title='Resolve'">
                          <XCircle className="w-4 h-4 text-green-600 rotate-45" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(incident.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-20 text-center opacity-30 font-bold uppercase">No incidents found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <CreateIncidentModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); fetchIncidents(); }} />
    </AuthorityLayout>
  );
}
