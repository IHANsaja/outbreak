"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Wifi, MapPin, User, AlertCircle, Menu, X, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, Language } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  type?: "briefing" | "dashboard";
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
  const isBriefing = type === "briefing";
  const isDashboard = type === "dashboard";
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-white border-b border-gray-100 px-4 py-3 md:px-8 relative z-[100]">
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

          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="relative w-auto h-8 md:h-11 transform group-hover:scale-105 transition-transform flex items-center">
              <Image
                src="/outbreak-logo-withBackground.png"
                alt="Outbreak Logo"
                width={44}
                height={44}
                className="object-contain w-7 h-7 md:w-11 md:h-11"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base md:text-xl font-black tracking-tight leading-none text-zinc-900">
                OUTBREAK
              </span>
              <span className="text-[7px] md:text-[10px] uppercase tracking-widest font-bold text-gray-500 mt-0.5">
                {isBriefing ? t("download_briefing") : t("dashboard")}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          {isDashboard && (
            <>
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-red-50 text-brand-red rounded-full text-[10px] md:text-xs font-bold ring-1 ring-red-100">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-brand-red rounded-full animate-pulse" />
                EMERGENCY LEVEL {emergencyLevel}
              </div>
              <div className="hidden xl:flex items-center gap-4 text-[10px] md:text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-500" />
                  <span className="text-green-600">Online</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>{cityName}</span>
                </div>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gray-100 rounded-lg hidden md:flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer group">
                <User className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover:text-zinc-900 transition-colors" />
              </div>
            </>
          )}

          <div className="hidden sm:flex bg-gray-100 p-1 rounded-xl">
            {(["en", "si", "ta"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "px-1.5 md:px-2 py-1 text-[9px] md:text-[10px] font-black rounded-lg transition-all",
                  language === lang ? "bg-white text-zinc-900 shadow-sm" : "text-gray-400 hover:text-zinc-900"
                )}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 md:px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-zinc-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-3 md:px-4 py-2 bg-brand-red text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all hover:bg-red-600 active:scale-95 shadow-sm"
            >
              Sign Up
            </Link>
          </div>

          <Link
            href="/ai"
            className="hidden md:flex items-center gap-2 px-3 md:px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] md:text-xs font-black italic uppercase transition-all hover:bg-black active:scale-95"
          >
            <Brain className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500" />
            {t("ai_insights")}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 md:p-2.5 bg-gray-50 text-zinc-900 rounded-xl md:hidden hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white overflow-hidden shadow-xl"
          >
            <div className="p-6 space-y-6">
              {/* Language Switcher for small screens */}
              <div className="flex sm:hidden flex-col gap-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Language</span>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {(["en", "si", "ta"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        "flex-1 py-2 text-xs font-black rounded-lg transition-all",
                        language === lang ? "bg-white text-zinc-900 shadow-sm" : "text-gray-400 hover:text-zinc-900"
                      )}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <Link
                  href="/ai"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-4 bg-zinc-900 text-white rounded-2xl italic font-black uppercase text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-orange-500" />
                    {t("ai_insights")}
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>

                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center p-4 border border-gray-200 rounded-2xl font-black uppercase text-xs text-gray-600 hover:bg-gray-50"
                >
                  Log In
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center p-4 bg-brand-red text-white rounded-2xl font-black uppercase text-xs hover:bg-red-600"
                >
                  Sign Up
                </Link>
              </div>

              {isDashboard && (
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400">
                  <div className="flex items-center gap-1.5 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    System Online
                  </div>
                  <div className="uppercase tracking-widest">{cityName}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
