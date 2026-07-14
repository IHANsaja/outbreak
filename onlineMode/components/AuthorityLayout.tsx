"use client";

import React, { useState, useEffect } from "react";
import AuthoritySidebar from "@/components/AuthoritySidebar";
import { Bell, Calendar, ChevronRight, Globe, Search, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage, Language } from "@/context/LanguageContext";

export default function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language, setLanguage, t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Rendered after mount (and refreshed each minute) to avoid an SSR
  // hydration mismatch on the clock.
  const [currentDate, setCurrentDate] = useState("");
  useEffect(() => {
    const update = () =>
      setCurrentDate(
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-auth-bg font-outfit relative">
      <AuthoritySidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:pl-64"
      )}>
        {/* Top Header */}
        <header className="h-20 border-b border-auth-border bg-white sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
              <span className="hidden md:inline">{t("au_command_center")}</span>
              <ChevronRight className="w-4 h-4 hidden md:inline" />
              <span className="text-slate-600 font-medium">{t("au_overview")}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-600">{currentDate || "…"}</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 pl-3 pr-1.5 py-1.5 rounded-xl border border-slate-100">
              <Globe className="w-4 h-4 text-slate-400" />
              <div className="flex bg-white p-1 rounded-lg border border-slate-100">
                {(["en", "si", "ta"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={cn(
                      "px-2 py-1 text-[10px] font-black rounded-md transition-all",
                      language === lang ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-green-50 px-3 md:px-4 py-2 rounded-xl border border-green-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] md:text-sm font-semibold text-green-700 uppercase md:normal-case">{t("au_system_operational")}</span>
            </div>

            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
              <Bell className="w-5 h-5 text-slate-500" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-auth-accent-red rounded-full border-2 border-white"></div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
