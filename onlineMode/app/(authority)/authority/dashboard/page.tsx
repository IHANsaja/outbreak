"use client";
import React, { useState } from "react";
import AuthorityLayout from "@/components/AuthorityLayout";
import { Radio, ChevronRight, Bell, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AuthorityDashboard() {
  return (
    <AuthorityLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Authority Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time disaster management overview for Sri Lanka Region.</p>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="ACTIVE INCIDENTS"
            value="12"
            trend="+2 new"
            description="Critical attention needed in Galle district."
            icon="incident"
          />
          <StatCard 
            title="PENDING REQUESTS"
            value="45"
            trend="+15% load"
            trendColor="orange"
            description="Avg response time: 14 mins."
            icon="request"
          />
          <StatCard 
            title="REGIONS AFFECTED"
            value="3"
            trend="Stable"
            trendColor="slate"
            description="Western, Central, Southern provinces."
            icon="regions"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Insights & Charts */}
          <div className="lg:col-span-2 space-y-8">
             <AIInsightsPanel />
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <MessageVolumeChart />
                <RegionalSeverityCard />
             </div>
          </div>

          {/* Map & Recent Activity Sidebar */}
          <div className="space-y-8">
             <LiveOperationsMap />
             <RecentActivityCard />
          </div>
        </div>
      </div>
    </AuthorityLayout>
  );
}

// Sub-components (Simplified for now, will keep in this file or extract if too large)

function StatCard({ title, value, trend, description, icon, trendColor = "red" }: any) {
  const { showToast } = useToast();
  return (
    <div 
      onClick={() => showToast(`Opening detailed view for ${title}`, "info")}
      className="bg-white p-6 rounded-3xl border border-auth-border auth-card-shadow flex flex-col justify-between h-48 group hover:border-auth-accent-red hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">{title}</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-5xl font-bold text-slate-900 tracking-tighter">{value}</h2>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              trendColor === 'red' ? 'bg-red-50 text-red-600' : 
              trendColor === 'orange' ? 'bg-orange-50 text-orange-600' :
              'bg-slate-100 text-slate-500'
            }`}>
              {trend}
            </span>
          </div>
        </div>
        <div className="w-12 h-12 flex items-center justify-center opacity-10 group-hover:scale-110 group-hover:opacity-100 group-hover:text-auth-accent-red transition-all duration-500">
           {/* Mock icon placeholder */}
           <div className="w-10 h-10 border-2 border-current rounded-lg flex items-center justify-center font-bold">!</div>
        </div>
      </div>
      <p className="text-sm text-slate-500 font-medium group-hover:text-slate-700 transition-colors">{description}</p>
    </div>
  );
}

function AIInsightsPanel() {
  const { showToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("AI Telemetry refreshed. No new anomalies detected.", "success");
    }, 2000);
  };

  return (
    <div className="auth-panel-dark rounded-[32px] p-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-10">
          <div className="flex gap-4">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
                <Radio className={`w-6 h-6 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-white tracking-tight">AI Insights Panel</h3>
                <p className="text-slate-400 text-sm">Predictive analysis based on live telemetry.</p>
             </div>
          </div>
          <button 
            disabled={isRefreshing}
            onClick={handleRefresh}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all border border-white/10 rounded-xl text-xs font-bold tracking-wide uppercase flex items-center gap-2"
          >
            {isRefreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {isRefreshing ? "Analyzing..." : "Refresh Analysis"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Alert 1 */}
           <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-4 hover:border-red-500/30 transition-colors cursor-pointer group">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold bg-red-500/20 text-red-300 px-3 py-1 rounded-full border border-red-500/20 uppercase tracking-widest">Priority Alert</span>
                 <span className="text-[10px] text-slate-400 font-bold uppercase">2m ago</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">Flood Surge Warning</h4>
                <p className="text-sm text-slate-400">High probability of river overflow in <span className="text-white font-bold underline decoration-red-500/50">Kalutara District</span> within 2 hours based on rainfall intensity.</p>
              </div>
           </div>

           {/* Alert 2 */}
           <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-4 hover:border-yellow-500/30 transition-colors cursor-pointer group">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full border border-yellow-500/20 uppercase tracking-widest">Resource Warning</span>
                 <span className="text-[10px] text-slate-400 font-bold uppercase">15m ago</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">Medical Supply Low</h4>
                <p className="text-sm text-slate-400">Medical supplies in Galle district reaching critical levels. Recommend dispatch from Colombo hub.</p>
              </div>
           </div>
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
    </div>
  );
}

function MessageVolumeChart() {
  const { showToast } = useToast();
  return (
    <div 
      onClick={() => showToast("Opening Advanced Messaging Analytics", "info")}
      className="bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow flex flex-col gap-6 cursor-pointer hover:border-auth-accent-red/20 transition-all"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Message Volume</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Last 24 hours trend</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900 tracking-tighter leading-none">1,240</div>
          <div className="text-[10px] font-bold text-green-600 mt-1 uppercase tracking-widest">+120% vs yesterday</div>
        </div>
      </div>
      
      <div className="h-48 w-full mt-4 flex items-end">
        <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gradient-line" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path 
            d="M0,120 L40,110 L80,130 L120,40 L160,90 L200,100 L240,30 L280,60 L320,10 L360,50 L400,20" 
            fill="none" 
            stroke="#ef4444" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M0,120 L40,110 L80,130 L120,40 L160,90 L200,100 L240,30 L280,60 L320,10 L360,50 L400,20 V150 H0 Z" 
            fill="url(#gradient-line)" 
          />
        </svg>
      </div>
      
      <div className="flex justify-between text-[10px] text-slate-300 font-bold uppercase tracking-widest px-2">
         <span>00:00</span>
         <span>06:00</span>
         <span>12:00</span>
         <span>18:00</span>
         <span className="text-auth-accent-red">Now</span>
      </div>
    </div>
  );
}

function RegionalSeverityCard() {
  const regions = [
    { name: "Western", level: "Critical", color: "bg-red-500", width: "85%" },
    { name: "Central", level: "High", color: "bg-orange-500", width: "65%" },
    { name: "Southern", level: "Mod", color: "bg-yellow-500", width: "45%" },
    { name: "Northern", level: "Low", color: "bg-green-500", width: "15%" },
  ];

  const { showToast } = useToast();

  return (
    <div className="bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Regional Severity</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Current impact distribution</p>
        </div>
        <button onClick={() => showToast("Downloading Regional Impact Report PDF", "success")} className="text-slate-300 hover:text-auth-accent-red transition-colors">
           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>
      </div>

      <div className="space-y-6">
        {regions.map((region) => (
          <div key={region.name} className="flex items-center gap-6 group cursor-pointer" onClick={() => showToast(`Opening ${region.name} Region Details`, "info")}>
            <span className="text-sm font-bold text-slate-500 w-20 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{region.name}</span>
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
               <div className={`h-full ${region.color} rounded-full transition-all duration-1000 group-hover:brightness-110`} style={{ width: region.width }}></div>
            </div>
            <span className={`text-xs font-bold w-16 text-right transition-all group-hover:scale-110 ${
              region.level === 'Critical' ? 'text-red-600' :
              region.level === 'High' ? 'text-orange-600' :
              region.level === 'Mod' ? 'text-yellow-600' :
              'text-green-600'
            }`}>{region.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveOperationsMap() {
  const { showToast } = useToast();
  return (
    <div className="bg-white rounded-[32px] border border-auth-border auth-card-shadow overflow-hidden group">
      <div className="p-6 flex justify-between items-center bg-white">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Live Operations Map
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </h3>
      </div>
      <div className="h-72 bg-slate-100 relative overflow-hidden flex items-center justify-center">
         <div className="absolute inset-0 bg-[#e5e7eb] opacity-50">
             <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#9ca3af 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }}></div>
         </div>
         
         <div className="absolute top-1/2 left-1/3 cursor-pointer group/ping" onClick={(e) => { e.stopPropagation(); showToast("Focusing on Flood Surge: Kalutara", "warning"); }}>
             <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-bounce"></div>
             <div className="absolute -inset-2 bg-red-500/20 rounded-full animate-ping"></div>
         </div>
         <div className="absolute top-1/4 right-1/4 cursor-pointer" onClick={(e) => { e.stopPropagation(); showToast("Resource Status: Galle Hub", "info"); }}>
             <div className="w-4 h-4 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"></div>
         </div>

         <div className="relative z-10 text-center uppercase tracking-widest text-[10px] font-bold text-slate-400">
            [ Interactive GIS View ]
         </div>
      </div>
      <div className="p-4 border-t border-auth-border bg-white text-center">
          <button 
            onClick={() => showToast("Switching to Full GIS Interface...", "info")}
            className="text-auth-accent-red font-bold text-xs uppercase tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto active:scale-95 transition-all"
          >
             Open Full Map
             <ChevronRight className="w-4 h-4" />
          </button>
      </div>
    </div>
  );
}

function RecentActivityCard() {
  const { showToast } = useToast();
  const activities = [
    { id: 1, type: 'alert', title: 'Evacuation started in Zone 4', sub: 'Reported by Field Unit Alpha', time: '10:42', color: 'bg-blue-50 text-blue-500' },
    { id: 2, type: 'resource', title: 'Supplies arrived at Kandy', sub: 'Logistics update #402', time: '09:15', color: 'bg-purple-50 text-purple-500' },
    { id: 3, type: 'user', title: 'Minister joined channel', sub: 'System notification', time: '08:30', color: 'bg-slate-50 text-slate-500' },
  ];

  return (
    <div className="bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Recent Activity</h3>
        <button onClick={() => showToast("Opening Activity Audit Logs", "info")} className="text-auth-accent-red text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
      </div>

      <div className="space-y-8">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-4 group cursor-pointer" onClick={() => showToast(`Opening: ${activity.title}`, "info")}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activity.color} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
               <Bell className="w-5 h-5 transition-transform group-hover:animate-shake" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-auth-accent-red transition-colors">{activity.title}</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase ml-2">{activity.time}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activity.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
