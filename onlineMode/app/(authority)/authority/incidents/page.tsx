"use client";
import React, { useState, useMemo } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Search, Filter, Plus, ChevronDown, MoreHorizontal, AlertCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import CreateIncidentModal from "@/components/CreateIncidentModal";

const INITIAL_INCIDENTS = [
  { id: "#INC-2023-042", type: "Flash Flood", priority: "Critical", location: "Galle District", reported: "24 mins ago", status: "Responding", color: "text-red-600 bg-red-50" },
  { id: "#INC-2023-041", type: "Urban Fire", priority: "High", location: "Colombo 03", reported: "1 hour ago", status: "Active", color: "text-orange-600 bg-orange-50" },
  { id: "#INC-2023-040", type: "Landslide Risk", priority: "Critical", location: "Kegalle", reported: "2 hours ago", status: "Responding", color: "text-red-600 bg-red-50" },
  { id: "#INC-2023-039", type: "River Overflow", priority: "Medium", location: "Kalutara", reported: "3 hours ago", status: "Responding", color: "text-blue-600 bg-blue-50" },
  { id: "#INC-2023-038", type: "Coastal Surge", priority: "Medium", location: "Matara", reported: "5 hours ago", status: "Resolved", color: "text-slate-600 bg-slate-50" },
  { id: "#INC-2023-037", type: "Factory Fire", priority: "Critical", location: "Gampaha", reported: "6 hours ago", status: "Responding", color: "text-red-600 bg-red-50" },
  { id: "#INC-2023-036", type: "Minor Slide", priority: "Medium", location: "Ratnapura", reported: "Yesterday", status: "Resolved", color: "text-slate-600 bg-slate-50" },
];

export default function IncidentsPage() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredIncidents = useMemo(() => {
    return INITIAL_INCIDENTS.filter(incident => {
      const matchesSearch = incident.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incident.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "All Types" || incident.type === typeFilter;
      const matchesStatus = statusFilter === "All Status" || incident.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, typeFilter, statusFilter]);

  const handleCreateIncident = () => {
    setIsCreateModalOpen(true);
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
            onClick={handleCreateIncident}
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
                    placeholder="Search incidents by ID, location or type..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-auth-accent-red/20 focus:border-auth-accent-red transition-all"
                   />
                </div>
                <button 
                  onClick={() => { setSearchTerm(""); setTypeFilter("All Types"); setStatusFilter("All Status"); showToast("Filters Reset", "info"); }}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                >
                   <Filter className="w-5 h-5" />
                </button>
             </div>

             <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400 font-medium">Filter by:</span>
                <div className="relative">
                   <select 
                     value={typeFilter}
                     onChange={(e) => setTypeFilter(e.target.value)}
                     className="appearance-none bg-slate-50 border border-slate-200 px-4 py-2.5 pr-10 rounded-xl text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-auth-accent-red/10"
                   >
                      <option>All Types</option>
                      <option>Flash Flood</option>
                      <option>Urban Fire</option>
                      <option>Landslide Risk</option>
                      <option>River Overflow</option>
                      <option>Coastal Surge</option>
                   </select>
                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                   <select 
                     value={statusFilter}
                     onChange={(e) => setStatusFilter(e.target.value)}
                     className="appearance-none bg-slate-50 border border-slate-200 px-4 py-2.5 pr-10 rounded-xl text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-auth-accent-red/10"
                   >
                      <option>All Status</option>
                      <option>Responding</option>
                      <option>Active</option>
                      <option>Resolved</option>
                   </select>
                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
             </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-auth-border bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incident ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reported</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-auth-border">
                {filteredIncidents.length > 0 ? filteredIncidents.map((incident) => (
                  <tr 
                    key={incident.id} 
                    onClick={() => showToast(`Opening Audit Log for ${incident.id}`, "info")}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-400 group-hover:text-slate-900 transition-colors">{incident.id}</span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${incident.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                             <AlertCircle className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{incident.type}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${
                         incident.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100 group-hover:bg-red-100' :
                         incident.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100 group-hover:bg-orange-100' :
                         'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-slate-100'
                       }`}>
                         {incident.priority}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-600">{incident.location}</td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-400">{incident.reported}</td>
                    <td className="px-6 py-5">
                       <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                         incident.status === 'Responding' ? 'bg-green-100 text-green-700' :
                         incident.status === 'Active' ? 'bg-orange-100 text-orange-700' :
                         'bg-slate-100 text-slate-700'
                       }`}>
                         {incident.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button className="text-slate-300 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100">
                          <MoreHorizontal className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center gap-3 opacity-30">
                          <Search className="w-10 h-10" />
                          <p className="text-sm font-bold uppercase tracking-widest">No matching incidents found</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <CreateIncidentModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </AuthorityLayout>
  );
}
