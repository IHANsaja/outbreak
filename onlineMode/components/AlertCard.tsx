"use client";

import { AlertTriangle, Clock, ChevronRight, Info, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

interface AlertCardProps {
  variant?: "detailed" | "compact";
  severity?: "severe" | "urgent" | "moderate" | "low";
  title: string;
  description: string;
  updatedTime: string;
  impactLevel?: "Low" | "Moderate" | "High" | "Extreme";
  className?: string;
  routesHref?: string;
  detailsHref?: string;
}

export default function AlertCard({
  variant = "detailed",
  severity = "severe",
  title,
  description,
  updatedTime,
  impactLevel = "High",
  className,
  routesHref,
  detailsHref,
}: AlertCardProps) {
  const isDetailed = variant === "detailed";
  
  const severityColors = {
    severe: "border-brand-red text-brand-red bg-red-50",
    urgent: "border-brand-red text-white bg-brand-red",
    moderate: "border-brand-orange text-brand-orange bg-orange-50",
    low: "border-brand-yellow text-brand-yellow bg-yellow-50",
  };

  const badgeText = {
    severe: "SEVERE WARNING",
    urgent: "URGENT ALERT",
    moderate: "MODERATE ALERT",
    low: "ADVISORY",
  };

  if (variant === "compact") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl",
          severityColors[severity],
          className
        )}
      >
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider uppercase">
               {badgeText[severity]}
             </span>
             <span className="text-[10px] opacity-80 flex items-center gap-1">
               Issued {updatedTime}
             </span>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2 uppercase">{title}</h2>
            <p className="text-sm md:text-base opacity-90 max-w-2xl font-medium leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto relative z-20">
          <Link 
            href={routesHref || "#"} 
            className="flex-1 md:flex-none bg-white text-zinc-900 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all shadow-lg active:scale-95 group"
          >
            <MapPin className="w-4 h-4" />
            View Safe Routes
          </Link>
          <Link 
            href={detailsHref || "#"} 
            className="flex-1 md:flex-none bg-black/20 backdrop-blur-md text-white border border-white/30 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black/30 transition-all active:scale-95"
          >
            Details
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-md border-l-8 overflow-hidden transition-all hover:shadow-lg border-slate-200",
      severity === "severe" ? "border-brand-red" : "border-brand-orange",
      className
    )}>
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <span className={cn(
               "px-3 py-1 rounded-md text-[10px] font-black tracking-wider uppercase",
               severity === "severe" ? "bg-red-100 text-brand-red" : "bg-orange-100 text-brand-orange"
            )}>
              {badgeText[severity]}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
              <Clock className="w-3 h-3" />
              Updated: {updatedTime}
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
            {title}
          </h2>
          
          <p className="text-gray-600 leading-relaxed font-medium">
            {description}
          </p>
        </div>
        
        <div className="md:w-48 bg-gray-50 rounded-xl p-5 flex flex-col items-center justify-center border border-gray-100">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Impact Level</span>
           <div className="flex gap-1.5 mb-2">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-8 h-2.5 rounded-full transition-colors",
                    i <= 3 ? "bg-brand-red" : "bg-gray-200"
                  )} 
                />
              ))}
           </div>
           <span className="text-xl font-black text-brand-red uppercase tracking-tighter">
             {impactLevel}
           </span>
        </div>
      </div>
    </div>
  );
}
