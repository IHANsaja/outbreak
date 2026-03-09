"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Clock, MapPin, Tag, ChevronRight, AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

export type DataCardVariant = "incident" | "need" | "update" | "hazard";

interface DataCardProps {
  variant: DataCardVariant;
  title: string;
  description: string;
  status: string;
  timestamp: string;
  location?: string;
  category?: string;
  severity?: "low" | "medium" | "high" | "urgent" | "info" | "warning";
  quantity?: string;
  unit?: string;
  imageUrl?: string;
  className?: string;
}

export default function DataCard({
  variant,
  title,
  description,
  status,
  timestamp,
  location,
  category,
  severity,
  quantity,
  unit,
  imageUrl,
  className,
}: DataCardProps) {
  const getStatusConfig = (status: string, variant: DataCardVariant) => {
    const s = status.toLowerCase();
    
    // Default configs
    if (s === "pending" || s === "low" || s === "active") {
      return {
        bg: "bg-amber-50 text-amber-600 border-amber-100",
        icon: <Clock3 className="w-3 h-3" />,
      };
    }
    if (s === "verified" || s === "available" || s === "resolved" || s === "cleared") {
      return {
        bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    }
    if (s === "rejected" || s === "critical") {
      return {
        bg: "bg-red-50 text-red-600 border-red-100",
        icon: <AlertCircle className="w-3 h-3" />,
      };
    }

    return {
      bg: "bg-gray-50 text-gray-600 border-gray-100",
      icon: <Clock3 className="w-3 h-3" />,
    };
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
      case "urgent":
        return "text-brand-red";
      case "medium":
      case "warning":
        return "text-amber-500";
      case "low":
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-400";
    }
  };

  const statusConfig = getStatusConfig(status, variant);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300",
        className
      )}
    >
      <div className="flex flex-col h-full">
        {/* Evidence Image */}
        {imageUrl && (
          <div className="-mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-6 rounded-t-3xl overflow-hidden">
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-40 md:h-48 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Badge and Time */}
        <div className="flex items-center justify-between mb-6">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
            statusConfig.bg
          )}>
            {statusConfig.icon}
            {status}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            {timestamp}
          </div>
        </div>

        {/* Title and Category */}
        <div className="mb-4">
          {category && (
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] mb-2 block",
              getSeverityColor(severity)
            )}>
              {category}
            </span>
          )}
          <h3 className="text-xl md:text-2xl font-black text-zinc-900 leading-tight group-hover:text-brand-red transition-colors">
            {title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed mb-8 flex-grow line-clamp-3">
          {description}
        </p>

        {/* Footer Info */}
        <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {location && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </div>
            )}
            {quantity && (
              <div className="flex items-center gap-1.5 text-xs font-black text-zinc-900 uppercase italic">
                <Tag className="w-3.5 h-3.5 text-brand-red" />
                {quantity} {unit}
              </div>
            )}
          </div>
          
          <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-brand-red group-hover:text-white transition-all transform group-hover:translate-x-1">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
