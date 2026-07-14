"use client";
import React, { useState, useMemo, useEffect } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Search, Filter, Plus, ChevronDown, MoreHorizontal, AlertCircle, CheckCircle, Trash2, XCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import CreateIncidentModal from "@/components/CreateIncidentModal";
import { getAllIncidents, updateIncidentStatus, deleteIncident } from "@/app/actions/data";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function IncidentsPage() {
  const { t } = useLanguage();
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
      showToast(t("au_fetch_incidents_failed_toast"), "error");
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
      showToast(`${t("au_incident_marked_as_toast")} ${newStatus}`, "success");
      fetchIncidents();
    } catch (err) {
      showToast(t("au_update_status_failed_toast"), "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("au_delete_incident_confirm"))) return;
    try {
      await deleteIncident(id);
      showToast(t("au_incident_report_deleted_toast"), "success");
      fetchIncidents();
    } catch (err) {
      showToast(t("au_delete_incident_failed_toast"), "error");
    }
  };

  return (
    <AuthorityLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t("au_active_incidents")}</h1>
            <p className="text-slate-500 mt-1">{t("au_manage_track_desc")}</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#f26522] hover:bg-[#d4551c] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-5 h-5" />
            {t("au_create_new_incident")}
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
                    placeholder={t("au_search_incidents_placeholder")}
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
                <span className="text-sm text-slate-400 font-medium">{t("au_filter_label")}</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 focus:outline-none"
                >
                  <option value="All Types">{t("au_all_types")}</option>
                  <option value="Flooding">{t("au_flooding")}</option>
                  <option value="Landslide">{t("au_landslide")}</option>
                  <option value="Structural Damage">{t("au_structural_damage")}</option>
                  <option value="Road Block">{t("au_road_block")}</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 focus:outline-none"
                >
                  <option value="All Status">{t("au_all_status")}</option>
                  <option value="pending">{t("au_status_pending")}</option>
                  <option value="verified">{t("au_status_verified")}</option>
                  <option value="resolved">{t("au_status_resolved")}</option>
                  <option value="rejected">{t("au_status_rejected")}</option>
                </select>
             </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-auth-border bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("au_type_col")}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("au_description_label")}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("au_loc_dist_col")}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("au_status_col")}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{t("au_actions_col")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-auth-border">
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 animate-pulse font-bold">{t("au_loading_data")}</td></tr>
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
                    <td className="px-6 py-5 text-sm text-slate-600 max-w-xs truncate">{incident.description || t("au_no_description")}</td>
                    <td className="px-6 py-5 text-xs text-slate-500">
                      {incident.distance_km != null ? (
                        <span className="font-bold text-auth-accent-red">{incident.distance_km} {t("au_km_away")}</span>
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
                      <button onClick={() => handleDelete(incident.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title={t("au_delete_tooltip")}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-20 text-center opacity-30 font-bold uppercase">{t("au_no_incidents_found")}</td></tr>
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
