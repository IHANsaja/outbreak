"use client";

import { Info, Map as MapIcon } from "lucide-react";

interface Instruction {
  step: number;
  title: string;
  description: string;
}

export default function EvacuationInstructions({ 
  instructions,
  affectedAreas 
}: { 
  instructions: Instruction[],
  affectedAreas: string[]
}) {
  return (
    <div className="bg-red-50/30 rounded-2xl p-6 md:p-8 border border-red-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center">
          <Info className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 italic">Evacuation Instructions</h3>
      </div>
      
      <div className="space-y-8 mb-12">
        {instructions.map((item) => (
          <div key={item.step} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#1e293b] text-white flex-shrink-0 flex items-center justify-center font-bold text-sm">
              {item.step}
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-zinc-900 italic">{item.title}</h4>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-8 border-t border-red-100">
        <div className="flex items-center gap-2 mb-4">
           <MapIcon className="w-4 h-4 text-gray-400" />
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Affected Areas (GN Divisions)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {affectedAreas.map((area) => (
            <span 
              key={area}
              className="px-4 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-bold text-gray-600 shadow-sm transition-all hover:border-brand-red/20 hover:text-brand-red cursor-default"
            >
              {area}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
