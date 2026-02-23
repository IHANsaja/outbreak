"use client";

import { Wifi, MessageSquare, Download, Phone, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NetworkStatus() {
  const statuses = [
    { name: "Internet", detail: "Stable Connection", status: "Online", color: "text-green-500", icon: Wifi },
    { name: "SMS Alerts", detail: "Emergency Broadcasts", status: "Active", color: "text-green-500", icon: MessageSquare },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-8">
        <Wifi className="w-5 h-5 text-gray-400" />
        <h3 className="font-bold text-zinc-900 italic">Network Status</h3>
      </div>
      
      <div className="space-y-6 flex-1">
        {statuses.map((s, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-black text-zinc-900">{s.name}</span>
                 <span className="text-[10px] font-medium text-gray-400">{s.detail}</span>
              </div>
            </div>
            <span className={cn("text-xs font-black", s.color)}>{s.status}</span>
          </div>
        ))}
      </div>
      
      <div className="pt-6 border-t border-gray-50 mt-auto space-y-4">
         <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Offline Resources</span>
         <div className="space-y-3">
           <button className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-brand-red transition-colors group">
              <Download className="w-4 h-4 text-gray-400 group-hover:text-brand-red" />
              Download Emergency Guide (PDF)
           </button>
           <button className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-brand-red transition-colors group">
              <Phone className="w-4 h-4 text-gray-400 group-hover:text-brand-red" />
              Save Emergency Contacts
           </button>
         </div>
      </div>
    </div>
  );
}

export function OfficialUpdates() {
  const updates = [
    { 
      type: "info", 
      title: "Relief centers opened in Panadura North", 
      detail: "The Divisional Secretariat has authorized 3 new locations for displaced persons.",
      meta: "Disaster Management Center • 45m ago",
      icon: Info,
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    { 
      type: "warning", 
      title: "Power outage expected in sector 4", 
      detail: "Preventative shutdown scheduled to avoid electrocution hazards in flooded areas.",
      meta: "CEB • 2h ago",
      icon: AlertTriangle,
      color: "bg-orange-50 text-orange-600 border-orange-100"
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-black text-zinc-900 italic mb-4">Official Updates</h3>
      <div className="space-y-3">
        {updates.map((update, idx) => (
          <Link 
            key={idx} 
            href={`/updates/${idx + 1}`}
            className={cn("p-6 rounded-2xl border flex gap-4 transition-all hover:shadow-md cursor-pointer group outline-none", update.color)}
          >
            <div className="mt-1">
               <update.icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-zinc-900 text-sm group-hover:text-black transition-colors">{update.title}</h4>
              <p className="text-xs font-medium text-gray-600 leading-relaxed max-w-2xl">{update.detail}</p>
              <span className="block text-[10px] font-bold text-gray-400 mt-2">{update.meta}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
