"use client";

import { useEffect, useState } from "react";
import { Rss, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEdgeMessages } from "@/app/actions/data";

interface EdgeMessage {
  id: string;
  node_id: string;
  origin_node_id: string | null;
  peer_nick: string | null;
  message_text: string;
  priority: string;
  rssi: number | null;
  distance_m: number | null;
  created_at: string;
}

export default function EdgeMessagesFeed() {
  const [messages, setMessages] = useState<EdgeMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getEdgeMessages();
      if (!cancelled) {
        setMessages(data);
        setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-white p-8 rounded-[32px] border border-auth-border auth-card-shadow">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Rss className="w-4 h-4 text-slate-400" />
            Edge Device Messages
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Synced from offline IoT nodes</p>
        </div>
      </div>
      <div className="space-y-6">
        {loading ? (
          <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs animate-pulse">Loading...</p>
        ) : messages.length > 0 ? messages.map((msg) => (
          <div key={msg.id} className="flex gap-4 items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0 group">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
              msg.priority === 'CRITICAL' ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400")}>
              <Radio className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-auth-accent-red transition-colors">
                  {msg.peer_nick || "Unknown Node"}
                </h4>
                {msg.priority === 'CRITICAL' && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full shrink-0">Critical</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">&quot;{msg.message_text}&quot;</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] font-bold text-slate-300">· Node {msg.node_id}</span>
                {msg.origin_node_id && (
                  <span className="text-[10px] font-bold text-sky-500">
                    via LoRa{msg.rssi != null ? ` · ${msg.rssi} dBm` : ""}{msg.distance_m != null ? ` · ~${msg.distance_m}m` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        )) : (
          <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs">No edge messages synced yet</p>
        )}
      </div>
    </div>
  );
}
