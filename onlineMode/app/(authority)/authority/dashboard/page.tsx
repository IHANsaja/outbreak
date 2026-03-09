"use client";
import React, { useState, useEffect } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Radio, ChevronRight, Bell, Loader2, AlertTriangle, Package, Activity, MapPin, CheckCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getStats, getRegions, getRecentSos, getAllIncidents, getResources, getHourlyActivityStats, resolveSOS } from "@/app/actions/data";
import { cn } from "@/lib/utils";

export default function AuthorityDashboard() {
  const [stats, setStats] = useState({ activeIncidents: 0, criticalNeeds: 0, activeHazards: 0, activeSos: 0 });
  const [incidents, setIncidents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [recentSos, setRecentSos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsData, regionsData, sosData, incidentsData, resourcesData] = await Promise.all([
        getStats(),
        getRegions(),
        getRecentSos(),
        getAllIncidents(),
        getResources()
      ]);
      setStats(statsData);
      setRecentSos(sosData);
      setIncidents(incidentsData);
      setResources(resourcesData);
    } catch (err) {
      console.error('Dashboard Data Error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AuthorityLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Authority Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time disaster management overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="ACTIVE INCIDENTS"
            value={stats.activeIncidents.toString()}
            trend={stats.activeIncidents > 0 ? `+${stats.activeIncidents} live` : "Zero"}
            description="Verified reports requiring immediate intervention."
            icon={<Activity className="w-5 h-5" />}
          />
          <StatCard
            title="PENDING SOS"
            value={stats.activeSos.toString()}
            trend={stats.activeSos > 5 ? "High Load" : "Stable"}
            trendColor={stats.activeSos > 5 ? "red" : "slate"}
            description="Emergency requests in the last 24 hours."
            icon={<Bell className="w-5 h-5" />}
          />
          <StatCard
            title="CRITICAL NEEDS"
            value={stats.criticalNeeds.toString()}
            trend={stats.criticalNeeds > 0 ? "Shortage" : "Supplied"}
            trendColor={stats.criticalNeeds > 0 ? "orange" : "slate"}
            description="Resource deficits across all active regions."
            icon={<Package className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <AIInsightsPanel incidents={incidents} resources={resources} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <MessageVolumeChart />
              <RegionalSeverityCard />
            </div>
          </div>

          <div className="space-y-8">
            <LiveOperationsMap incidents={incidents} sos={recentSos} />
            <RecentActivityCard activities={recentSos} onResolve={fetchData} />
          </div>
        </div>
      </div>
    </AuthorityLayout>
  );
}

function StatCard({ title, value, trend, description, icon, trendColor = "red" }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-auth-border auth-card-shadow flex flex-col justify-between h-48 group hover:border-auth-accent-red hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">{title}</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-5xl font-bold text-slate-900 tracking-tighter">{value}</h2>
            <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", 
              trendColor === 'red' ? 'bg-red-50 text-red-600' :
              trendColor === 'orange' ? 'bg-orange-50 text-orange-600' :
              'bg-slate-100 text-slate-500'
            )}>{trend}</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-auth-accent-red transition-all shadow-sm">
          {icon}
        </div>
      </div>
      <p className="text-sm text-slate-500 font-medium group-hover:text-slate-700 transition-colors">{description}</p>
    </div>
  );
}

function AIInsightsPanel({ incidents, resources }: { incidents: any[], resources: any[] }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const criticalResources = resources.filter(r => r.status === 'critical');
  const pendingIncidents = incidents.filter(i => i.status === 'pending');

  return (
    <div className="auth-panel-dark rounded-[2rem] p-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-10">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
              <Radio className={`w-6 h-6 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">AI Telemetry Dashboard</h3>
              <p className="text-slate-400 text-sm font-medium">Predictive analysis of system load.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-4 hover:border-red-500/30 transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold bg-red-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">Incident Alert</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">LIVE</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-white leading-tight">{pendingIncidents.length} Pending Reports</h4>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                {pendingIncidents.length > 0 ? "Immediate verification required for reports in active zones." : "System clear. No pending incidents requiring verification."}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-4 hover:border-yellow-500/30 transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold bg-yellow-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">Resource Low</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">STOCK</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-white leading-tight">{criticalResources.length} Critical Stockouts</h4>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                {criticalResources.length > 0 ? `Supplies for ${criticalResources[0].name} are low in the hub.` : "Inventory levels are stable across all regions."}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
    </div>
  );
}

function MessageVolumeChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchChart() {
      const data = await getHourlyActivityStats();
      setChartData(data);
    }
    fetchChart();
  }, []);

  return (
    <div className="bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">System Activity</h3>
          <p className="text-xs text-slate-400 font-medium">Hourly message volume</p>
        </div>
      </div>
      <div className="h-48 w-full flex items-end justify-between gap-1">
        {chartData.length > 0 ? chartData.map((d, i) => (
          <div key={i} className="flex-1 bg-slate-100 rounded-t-lg relative group overflow-hidden" title={`${d.count} events at ${d.hour}:00`}>
            <div 
              className="absolute bottom-0 w-full bg-auth-accent-red/20 group-hover:bg-auth-accent-red/40 transition-all rounded-t-md" 
              style={{ height: `${Math.min(100, (d.count / (Math.max(...chartData.map(cd => cd.count)) || 1)) * 100)}%` }} 
            />
          </div>
        )) : [10, 40, 25, 70, 45, 90, 30, 60, 20].map((h, i) => (
          <div key={i} className="flex-1 bg-slate-100 rounded-t-lg relative group overflow-hidden">
            <div 
              className="absolute bottom-0 w-full bg-slate-200 transition-all rounded-t-md" 
              style={{ height: `${h}%` }} 
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-300 font-bold uppercase tracking-widest px-1">
        <span>00:00</span>
        <span>12:00</span>
        <span>23:59</span>
      </div>
    </div>
  );
}

function RegionalSeverityCard() {
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRegions().then(data => { setRegions(data); setLoading(false); });
  }, []);

  return (
    <div className="bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow min-h-[400px]">
      <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8">Regional Severity</h3>
      <div className="space-y-6">
        {loading ? <p className="animate-pulse">Loading...</p> : regions.map((region) => (
          <div key={region.id} className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
              <span className="text-slate-500">{region.name}</span>
              <span className={cn(
                region.severity_level === 'Critical' ? "text-red-600" :
                region.severity_level === 'High' ? "text-orange-600" : "text-green-600"
              )}>{region.impact_percentage}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all", 
                  region.severity_level === 'Critical' ? "bg-red-500" : "bg-orange-500"
                )} 
                style={{ width: `${region.impact_percentage}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveOperationsMap({ incidents, sos }: { incidents: any[], sos: any[] }) {
  return (
    <div className="bg-white rounded-[32px] border border-auth-border auth-card-shadow overflow-hidden">
      <div className="p-6 border-b border-auth-border">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          Operations Map
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </h3>
      </div>
      <div className="h-64 bg-slate-50 relative flex items-center justify-center">
        <div className="absolute inset-0 grayscale opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative w-full h-full">
           {/* Render markers for real incidents */}
           {incidents.slice(0, 5).map((inc, i) => (
             <div key={inc.id} className="absolute" style={{ top: `${20 + i*15}%`, left: `${30 + i*10}%` }}>
               <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
               <div className="w-3 h-3 bg-red-500 rounded-full" />
             </div>
           ))}
           {sos.map((s, i) => (
             <div key={s.id} className="absolute" style={{ top: `${40 + i*20}%`, right: `${20 + i*10}%` }}>
                <MapPin className="w-4 h-4 text-orange-500" />
             </div>
           ))}
        </div>
        <div className="absolute z-10 text-[10px] font-black text-slate-200 uppercase tracking-widest p-4 text-center">
          Active Incident Simulation View
        </div>
      </div>
    </div>
  );
}

function RecentActivityCard({ activities, onResolve }: { activities: any[], onResolve: () => void }) {
  const { showToast } = useToast();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await resolveSOS(id);
      showToast("SOS request marked as resolved", "success");
      onResolve();
    } catch (err) {
      showToast("Failed to resolve SOS", "error");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow">
      <h3 className="text-lg font-bold text-slate-900 mb-8 tracking-tight">Recent SOS Priority</h3>
      <div className="space-y-6">
        {activities.length > 0 ? activities.map((sos) => (
          <div key={sos.id} className="flex gap-4 items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0 group">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", 
              sos.status === 'active' ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400")}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-auth-accent-red transition-colors uppercase">{sos.stype}</h4>
                {sos.status === 'active' && (
                  <button 
                    disabled={resolvingId === sos.id}
                    onClick={() => handleResolve(sos.id)}
                    className="text-auth-accent-red text-[10px] font-black uppercase tracking-widest hover:underline disabled:opacity-50"
                  >
                    {resolvingId === sos.id ? "Solving..." : "RESOLVE"}
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                "{sos.additional_info || "Urgent assistance needed"}" 
                {sos.distance_km != null && <span className="font-bold text-auth-accent-red ml-1">({sos.distance_km}km away)</span>}
              </p>
            </div>
          </div>
        )) : <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs">No active alerts</p>}
      </div>
    </div>
  );
}
