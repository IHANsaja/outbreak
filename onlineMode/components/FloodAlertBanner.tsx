"use client";

import React, { useEffect, useState } from "react";
import { getCriticalAlerts } from "@/app/actions/forecasting";
import { AlertTriangle, ShieldAlert, Info, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FloodAlertBanner() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      const data = await getCriticalAlerts();
      setAlerts(data);
    }
    fetchAlerts();
    // Refresh every 2 minutes for high-priority updates
    const interval = setInterval(fetchAlerts, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (alerts.length === 0 || !isVisible) return null;

  // Group by river
  const riverGroups: Record<string, string[]> = {};
  let maxThreat = "alert";

  alerts.forEach((alert) => {
    if (!riverGroups[alert.river]) {
      riverGroups[alert.river] = [];
    }
    // Only add unique station names
    if (!riverGroups[alert.river].includes(alert.station)) {
      riverGroups[alert.river].push(alert.station);
    }
    
    // Determine max threat
    if (alert.currentLevel === "major" || alert.forecastLevel === "major") maxThreat = "major";
    else if (maxThreat !== "major" && (alert.currentLevel === "minor" || alert.forecastLevel === "minor")) maxThreat = "minor";
  });

  const configs = {
    major: {
      bg: "bg-red-500/15",
      border: "border-red-500/40",
      text: "text-red-400",
      icon: <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />,
      label: "MAJOR FLOOD WARNING",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.25)]"
    },
    minor: {
      bg: "bg-orange-500/10",
      border: "border-orange-500/40",
      text: "text-orange-400",
      icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
      label: "MINOR FLOOD WARNING",
      glow: ""
    },
    alert: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/40",
      text: "text-yellow-400",
      icon: <Info className="w-5 h-5 text-yellow-500" />,
      label: "FLOOD ADVISORY",
      glow: ""
    }
  };

  const bannerConfig = configs[maxThreat as keyof typeof configs] || configs.alert;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={cn(
          "relative z-50 overflow-hidden border-b transition-all duration-500 backdrop-blur-md",
          bannerConfig.bg,
          bannerConfig.border,
          bannerConfig.glow
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">{bannerConfig.icon}</div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className={cn("font-black text-[10px] md:text-xs tracking-[0.2em] uppercase", bannerConfig.text)}>
                {bannerConfig.label}
              </span>
              <div className="text-xs md:text-sm text-gray-100 flex flex-wrap gap-x-2">
                {Object.entries(riverGroups).map(([river, stations], idx) => (
                  <span key={river} className="flex items-center">
                    <span className="text-white font-bold">{river}</span>
                    <span className="mx-1 text-gray-400 opacity-60">»</span>
                    <span className="text-gray-200">{stations.join(", ")}</span>
                    {idx < Object.entries(riverGroups).length - 1 && (
                      <div className="mx-3 w-px h-3 bg-white/20 hidden md:block" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.location.href = "/ai"}
              className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white border border-white/20 active:scale-95"
            >
              PREDICT TRENDS <ChevronRight className="w-3 h-3" />
            </button>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pulsating background for Major danger */}
        {maxThreat === "major" && (
          <motion.div 
            animate={{ opacity: [0.03, 0.12, 0.03] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-red-600 pointer-events-none -z-10"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
