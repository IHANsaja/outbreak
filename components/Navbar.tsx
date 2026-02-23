"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Wifi, MapPin, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, Language } from "@/context/LanguageContext";

interface NavbarProps {
  type?: "briefing" | "dashboard" | "sos";
  backHref?: string;
  cityName?: string;
  emergencyLevel?: number;
}

export default function Navbar({
  type = "dashboard",
  backHref,
  cityName = "Colombo, LK",
  emergencyLevel = 3,
}: NavbarProps) {
  const isSOS = type === "sos";
  const isBriefing = type === "briefing";
  const isDashboard = type === "dashboard";
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="w-full bg-white border-b border-gray-100 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          )}
          
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-auto h-11 transform group-hover:scale-105 transition-transform flex items-center">
               <Image 
                src="/outbreak-logo-withBackground.png" 
                alt="Outbreak Logo" 
                width={44} 
                height={44} 
                className="object-contain"
               />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight leading-none text-zinc-900">
                OUTBREAK
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mt-0.5">
                {isSOS ? t("sos") : isBriefing ? t("download_briefing") : t("dashboard")}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {isDashboard && (
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-50 text-brand-red rounded-full text-xs font-bold ring-1 ring-red-100">
                <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
                EMERGENCY LEVEL {emergencyLevel}
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-600">Online</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{cityName}</span>
                </div>
              </div>
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer group">
                <User className="w-5 h-5 text-gray-500 group-hover:text-zinc-900 transition-colors" />
              </div>
            </>
          )}

          {isBriefing && (
            <>
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 text-brand-red rounded-full text-xs font-bold ring-1 ring-red-100">
                <span className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
                LIVE ALERT
              </div>
            </>
          )}

          {isSOS && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 text-brand-red rounded-full text-xs font-bold ring-1 ring-red-100">
              <span className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
              LIVE
            </div>
          )}

           <div className="flex bg-gray-100 p-1 rounded-xl">
            {(["en", "si", "ta"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "px-2 py-1 text-[10px] font-black rounded-lg transition-all",
                  language === lang ? "bg-white text-zinc-900 shadow-sm" : "text-gray-400 hover:text-zinc-900"
                )}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <Link
            href="/ai"
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black italic uppercase transition-all hover:bg-black active:scale-95"
          >
            {t("ai_insights")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
