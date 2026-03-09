"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  Package,
  Map as MapIcon,
  BarChart3,
  Radio,
  Settings,
  User,
  X,
  Zap
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import BroadcastAlertModal from "./BroadcastAlertModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems: { name: string, href: string, icon: any, badge?: number }[] = [
  { name: "Dashboard", href: "/authority/dashboard", icon: LayoutDashboard },
  { name: "Incidents", href: "/authority/incidents", icon: AlertTriangle },
  { name: "Resources", href: "/authority/resources", icon: Package },
  { name: "Hazards", href: "/authority/hazards", icon: Zap },
  { name: "Map View", href: "/authority/map", icon: MapIcon },
  { name: "Analysis", href: "/authority/analysis", icon: BarChart3 },
];

interface AuthoritySidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AuthoritySidebar({ isOpen, onClose }: AuthoritySidebarProps) {
  const pathname = usePathname();
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [incidentCount, setIncidentCount] = useState<number | null>(null);

  React.useEffect(() => {
    import('@/app/actions/data').then(({ getStats }) => {
      getStats().then(stats => setIncidentCount(stats.activeIncidents)).catch(console.error);
    });
  }, []);

  const dynamicNavItems = navItems.map(item => {
    if (item.name === "Incidents" && incidentCount !== null && incidentCount > 0) {
      return { ...item, badge: incidentCount };
    }
    return item;
  });

  return (
    <>      <div className={cn(
        "w-64 h-screen bg-auth-sidebar text-white flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo & Close Button */}
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-auth-accent-red rounded-lg flex items-center justify-center">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-none">OUTBREAK</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Authority</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {dynamicNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-auth-sidebar-active text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-auth-accent-red" : "group-hover:text-white"
                )} />
                <span className="font-medium text-sm">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-auth-accent-red text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 space-y-4">
          <button
            onClick={() => {
              setIsAlertModalOpen(true);
              // Don't necessarily close sidebar here if modal is large, but usually helpful
            }}
            className="w-full bg-auth-accent-red hover:bg-red-600 transition-colors py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-sm shadow-xl shadow-red-900/20 active:scale-95 duration-200"
          >
            <Radio className="w-5 h-5 animate-pulse" />
            BROADCAST ALERT
          </button>

          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer group">
            <div className="relative">
              <div className="w-10 h-10 bg-slate-700 rounded-lg overflow-hidden border border-slate-600">
                {/* Mock Avatar */}
                <div className="w-full h-full bg-slate-600 flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-auth-sidebar rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Director Silva</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Online</p>
            </div>
            <Settings className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>

      <BroadcastAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />
    </>
  );
}
