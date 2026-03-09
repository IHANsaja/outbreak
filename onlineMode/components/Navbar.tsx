"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  ArrowLeft, Wifi, MapPin, User, AlertCircle, Menu, X, Brain, 
  Home, Newspaper, HeartHandshake, ShieldAlert, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, Language } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  type?: "briefing" | "dashboard";
  backHref?: string;
  cityName?: string;
  emergencyLevel?: number;
}

const NAV_LINKS = [
  { label: "home", href: "/", icon: Home },
  { label: "news", href: "/news", icon: Newspaper },
  { label: "people_needs", href: "/people-needs", icon: HeartHandshake },
  { label: "incidents", href: "/incidents", icon: ShieldAlert },
];

import { createClient } from "@/utils/supabase/client";
import { logout } from "@/app/auth/actions";
import { useEffect } from "react";

export default function Navbar({
  type = "dashboard",
  backHref,
  cityName = "Colombo, LK",
  emergencyLevel = 3,
}: NavbarProps) {
  const pathname = usePathname();
  const isBriefing = type === "briefing";
  const isDashboard = type === "dashboard";
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 border-b border-gray-100 px-4 py-4 md:px-8 z-[100] transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Branding */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 md:w-11 md:h-11 transform group-hover:scale-110 transition-transform duration-300">
              <Image
                src="/outbreak-logo-withBackground.png"
                alt="Outbreak Logo"
                width={44}
                height={44}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-black tracking-tighter leading-none text-zinc-900 group-hover:text-brand-red transition-colors">
                OUTBREAK
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 mt-1">
                {isBriefing ? t("briefing") : t("dashboard")}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  pathname === link.href 
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-gray-100" 
                    : "text-gray-400 hover:text-zinc-900 hover:bg-white"
                )}
              >
                <link.icon className={cn("w-3.5 h-3.5", pathname === link.href ? "text-brand-red" : "text-gray-400")} />
                {t(link.label)}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* AI Insights - Desktop */}
          <Link
            href="/ai"
            className={cn(
              "hidden md:flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-[10px] font-black italic uppercase transition-all hover:bg-black hover:shadow-lg active:scale-95 group",
              pathname === "/ai" && "ring-2 ring-brand-red ring-offset-2"
            )}
          >
            <Brain className="w-4 h-4 text-orange-500 group-hover:animate-pulse" />
            {t("ai_insights")}
          </Link>


          {/* Lang Switcher */}
          <div className="hidden sm:flex bg-gray-100 p-1 rounded-xl">
            {(["en", "si", "ta"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "px-2.5 md:px-3 py-1.5 text-[10px] font-black rounded-lg transition-all",
                  language === lang ? "bg-white text-zinc-900 shadow-sm" : "text-gray-400 hover:text-zinc-900"
                )}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* User / Login / Logout */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
               <div className="flex items-center gap-2">
                 <button
                   onClick={handleLogout}
                   className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-red transition-colors"
                 >
                   Logout
                 </button>
                 <Link
                   href="/profile"
                   className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all text-gray-500 hover:text-brand-red group"
                 >
                   <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                 </Link>
               </div>
            ) : (
              <Link
                href="/login"
                className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all text-gray-500 hover:text-zinc-900 group"
              >
                <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2.5 bg-zinc-900 text-white rounded-xl lg:hidden hover:bg-black transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-2xl overflow-hidden"
          >
            <div className="p-6 space-y-8">
              {/* Navigation Links */}
              <div className="grid grid-cols-1 gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      pathname === link.href 
                        ? "bg-red-50 text-brand-red" 
                        : "text-zinc-600 hover:bg-gray-50"
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="text-sm font-black uppercase tracking-widest">{t(link.label)}</span>
                  </Link>
                ))}
              </div>

              {/* AI Insights & Actions */}
              <div className="space-y-3">
                <Link
                  href="/ai"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-5 bg-zinc-900 text-white rounded-2xl italic font-black uppercase text-xs hover:bg-black transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Brain className="w-5 h-5 text-orange-500" />
                    {t("ai_insights")}
                  </div>
                  <X className="w-4 h-4 rotate-180 opacity-0" />
                </Link>

                <div className="grid grid-cols-2 gap-3">
                  {user ? (
                    <>
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center p-4 border border-gray-100 rounded-2xl font-black uppercase text-xs text-zinc-600 hover:bg-gray-50"
                      >
                        Logout
                      </button>
                      <Link
                        href="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center p-4 bg-brand-red text-white rounded-2xl font-black uppercase text-xs hover:bg-red-600 shadow-lg shadow-red-100"
                      >
                        Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center p-4 border border-gray-100 rounded-2xl font-black uppercase text-xs text-zinc-600 hover:bg-gray-50"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center p-4 bg-brand-red text-white rounded-2xl font-black uppercase text-xs hover:bg-red-600 shadow-lg shadow-red-100"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Footer Info */}
              <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Online
                </div>
                <div>{cityName}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
