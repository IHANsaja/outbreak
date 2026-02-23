"use client";

import { History, Phone, ShieldCheck, Download, FileText, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  time: string;
  date: string;
  title: string;
  description: string;
  status: "new" | "past";
}

export function EventTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-8">
        <History className="w-5 h-5 text-gray-500" />
        <h3 className="font-bold text-zinc-900 italic">Event Timeline</h3>
      </div>
      
      <div className="space-y-8 relative">
        <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-gray-100" />
        
        {events.map((event, idx) => (
          <div key={event.id} className="relative pl-8">
            <div 
              className={cn(
                "absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-1 ring-gray-100",
                event.status === "new" ? "bg-brand-red" : "bg-gray-300"
              )} 
            />
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-sm font-black text-zinc-900">{event.title}</h4>
              <span className="text-[10px] font-bold text-gray-400">{event.date}, {event.time}</span>
            </div>
            <p className="text-xs font-medium text-gray-500 leading-relaxed">
              {event.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Responder {
  name: string;
  type: string;
  phone: string;
}

export function LocalResponders({ responders }: { responders: Responder[] }) {
  return (
    <div className="bg-[#0F172A] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-brand-red" />
        <h3 className="font-bold text-white italic">Local Responders</h3>
      </div>
      
      <div className="space-y-3">
        {responders.map((responder, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 group hover:bg-slate-800 transition-colors">
            <div className="flex flex-col">
              <span className="text-xs font-black text-white">{responder.name}</span>
              <span className="text-[10px] font-medium text-slate-500">{responder.type}</span>
            </div>
            <a 
              href={`tel:${responder.phone}`}
              className="w-10 h-10 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center hover:bg-green-500 hover:text-white transition-all"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
      
      <button className="w-full bg-brand-red hover:bg-red-600 text-white font-black py-4 rounded-xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 italic uppercase tracking-wider text-sm">
        <Phone className="w-4 h-4 animate-bounce" />
        Request Assistance
      </button>
    </div>
  );
}

export function Downloads() {
  const files = [
    { name: "Evacuation Route Map.pdf", icon: MapIcon, color: "text-red-500" },
    { name: "Emergency Checklist.pdf", icon: FileText, color: "text-blue-500" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-black text-zinc-900 italic mb-6">DOWNLOADS</h3>
      <div className="space-y-3">
        {files.map((file, idx) => (
          <a 
            key={idx}
            href="#" 
            className="flex items-center gap-3 p-3 border border-gray-50 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <file.icon className={cn("w-5 h-5", file.color)} />
            <span className="text-xs font-bold text-gray-600">{file.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
