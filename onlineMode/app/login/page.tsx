"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, User, Bot, ArrowRight, AlertCircle, Mail, Lock, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/Skeleton";
import Link from "next/link";

const roles = [
  {
    id: "citizen",
    title: "Citizen",
    description: "Access local news, SOS broadcasts, and maps.",
    icon: User,
    color: "bg-blue-500",
    path: "/",
  },
  {
    id: "authority",
    title: "Authority",
    description: "Manage sectors, monitor assets, and coordinate response.",
    icon: Shield,
    color: "bg-red-500",
    path: "/authority",
  },
  {
    id: "community",
    title: "Community Supporter",
    description: "Support local response and monitor community reports.",
    icon: UserPlus,
    color: "bg-emerald-500",
    path: "/authority",
  },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (path: string) => {
    setIsLoading(true);
    // Simulate a brief delay for "verification"
    setTimeout(() => {
      router.push(path);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-red/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-orange/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl z-10"
      >
        <div className="glass-morphism p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl">
          <header className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-brand-red rounded-2xl mb-4 md:mb-6 shadow-lg shadow-brand-red/20">
              <AlertCircle className="text-white w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h1 className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4 tracking-tight">
              OUTBREAK<span className="text-brand-red">.</span>
            </h1>
            <p className="text-white/60 text-[13px] md:text-lg max-w-sm mx-auto leading-relaxed">
              OutBreak Authentication System. Access your account to continue.
            </p>
          </header>

          <form className="space-y-8">
            <AnimatePresence mode="wait">
              {isInitialLoading ? (
                <motion.div
                  key="credentials-skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24 ml-1" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20 ml-1" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="credentials-fields"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/20 group-focus-within:text-brand-red transition-colors" />
                      <input
                        type="email"
                        required
                        placeholder="yourname@domain.com"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 md:py-4 pl-11 md:pl-12 pr-4 text-[13px] md:text-base text-white placeholder:text-white/10 focus:outline-none focus:border-brand-red transition-all focus:bg-white/[0.08]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Password</label>
                      <Link href="#" className="text-[9px] md:text-[10px] font-bold text-brand-red hover:underline uppercase tracking-wider">Forgot?</Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/20 group-focus-within:text-brand-red transition-colors" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 md:py-4 pl-11 md:pl-12 pr-4 text-[13px] md:text-base text-white placeholder:text-white/10 focus:outline-none focus:border-brand-red transition-all focus:bg-white/[0.08]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select Clearance Level</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AnimatePresence mode="wait">
                  {isInitialLoading ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={`sk-role-${i}`} className="bg-white/5 border border-white/5 p-6 rounded-2xl h-32 flex flex-col justify-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-lg" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                    </>
                  ) : (
                    roles.map((role) => (
                      <motion.div
                        key={role.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.08)" }}
                        onClick={() => setSelectedRole(role.id)}
                        className={cn(
                          "cursor-pointer p-4 md:p-6 rounded-2xl transition-all duration-300 border-2 flex flex-col items-center text-center gap-2 md:gap-3 group/role",
                          selectedRole === role.id
                            ? "border-brand-red bg-white/10 shadow-lg shadow-brand-red/10"
                            : "border-white/5 bg-white/5 hover:border-white/20"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-transform group-hover/role:scale-110",
                          selectedRole === role.id ? role.color : "bg-white/10"
                        )}>
                          <role.icon className={cn("w-4 h-4 md:w-5 md:h-5 text-white", selectedRole !== role.id && "opacity-40")} />
                        </div>
                        <span className={cn(
                          "text-[10px] md:text-xs font-black uppercase tracking-widest",
                          selectedRole === role.id ? "text-white" : "text-white/30"
                        )}>
                          {role.title.split(' ')[0]}
                        </span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="pt-4 space-y-6">
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={!selectedRole || isLoading}
                onClick={(e) => {
                  e.preventDefault();
                  const role = roles.find(r => r.id === selectedRole);
                  if (role) handleLogin(role.path);
                }}
                className={cn(
                  "w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all duration-300 flex items-center justify-center gap-3",
                  selectedRole
                    ? "emergency-gradient text-white shadow-xl shadow-brand-red/30 cursor-pointer"
                    : "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
                )}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating
                  </>
                ) : (
                  <>
                    Login to Account <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>

              <p className="text-center text-white/40 text-sm">
                New to the platform?{" "}
                <Link href="/signup" className="text-brand-red font-bold hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
