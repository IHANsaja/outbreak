"use client";

import { Droplets, Info, Ban, Waves, CircleCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GaugeProps {
  name: string;
  level: string;
  maxLevel: string;
  status: string;
  percentage: number;
}

export function WaterLevels({ gauges }: { gauges: GaugeProps[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-zinc-900">Water Levels</h3>
        </div>
        <span className="bg-red-50 text-brand-red text-[10px] font-black px-2 py-0.5 rounded tracking-widest animate-pulse">
          RISING
        </span>
      </div>
      
      <div className="space-y-6">
        {gauges.map((gauge, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-500">{gauge.name}</span>
              <span className="text-zinc-900">
                {gauge.level} <span className="text-gray-400 font-medium">({gauge.status})</span>
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
               <div 
                 className={cn(
                   "h-full transition-all duration-1000",
                   gauge.percentage > 80 ? "bg-brand-red" : "bg-blue-500"
                 )}
                 style={{ width: `${gauge.percentage}%` }}
               />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RoadProp {
  name: string;
  detail: string;
  status: "restricted" | "submerged" | "open";
}

export function RoadStatus({ roads }: { roads: RoadProp[] }) {
  const icons = {
    restricted: <Ban className="w-4 h-4 text-red-500" />,
    submerged: <Waves className="w-4 h-4 text-orange-500" />,
    open: <CircleCheck className="w-4 h-4 text-green-500" />,
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className="font-bold text-zinc-900">Road Status</h3>
      </div>
      
      <div className="space-y-5">
        {roads.map((road, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="mt-0.5">{icons[road.status]}</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-900">{road.name}</span>
              <span className="text-[10px] font-medium text-gray-400">{road.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
