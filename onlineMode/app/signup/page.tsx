"use client";

import React, { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { UserPlus, Shield, User, Bot, ArrowRight, AlertCircle, Mail, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/context/ToastContext";
import { signup } from "@/app/auth/actions";

const clearanceLevels = [
    { id: "citizen", title: "Citizen", icon: User, color: "text-blue-500" },
    { id: "authority", title: "Authority", icon: Shield, color: "text-red-500" },
    { id: "community_supporter", title: "Supporter", icon: UserPlus, color: "text-emerald-500" },
];

export default function SignupPage() {
    const [selectedRole, setSelectedRole] = useState<string>("citizen");
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        const timer = setTimeout(() => setIsInitialLoading(false), 1800);
        return () => clearTimeout(timer);
    }, []);

    const handleSignupAction = (formData: FormData) => {
        formData.append('role', selectedRole);
        
        startTransition(async () => {
            const result = await signup(formData);
            if (result?.error) {
                showToast(result.error, "error");
            } else {
                showToast("Account created! Please check your email.", "success");
            }
        });
    };

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-red/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-xl z-10"
            >
                <div className="glass-morphism p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <header className="text-center mb-8 md:mb-10">
                        <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-brand-red rounded-xl mb-4 md:mb-6 shadow-lg shadow-brand-red/20">
                            <UserPlus className="text-white w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <h1 className="text-xl md:text-3xl font-bold text-white mb-1.5 md:mb-2 tracking-tight leading-tight">
                            Create Your Account
                        </h1>
                        <p className="text-auth-text-sub text-[11px] md:text-sm">
                            Join the mesh network to stay protected and informed.
                        </p>
                    </header>

                    <AnimatePresence mode="wait">
                        {isInitialLoading ? (
                            <motion.div
                                key="signup-skeleton"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-14 w-full rounded-2xl" />
                                    </div>
                                    <div className="space-y-3">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-14 w-full rounded-2xl" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-3 w-32" />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Skeleton className="h-28 w-full rounded-2xl" />
                                        <Skeleton className="h-28 w-full rounded-2xl" />
                                        <Skeleton className="h-28 w-full rounded-2xl" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-14 w-full rounded-2xl" />
                                </div>
                                <Skeleton className="h-14 w-full rounded-2xl" />
                            </motion.div>
                        ) : (
                            <motion.form
                                key="signup-form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                action={handleSignupAction}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3 md:space-y-4">
                                        <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/20 group-focus-within:text-brand-red transition-colors" />
                                            <input
                                                type="text"
                                                name="fullName"
                                                required
                                                placeholder="John Doe"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 md:py-4 pl-11 md:pl-12 pr-4 text-[13px] md:text-base text-white placeholder:text-white/10 focus:outline-none focus:border-brand-red transition-all focus:bg-white/[0.08]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/20 group-focus-within:text-brand-red transition-colors" />
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                placeholder="john@example.com"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 md:py-4 pl-11 md:pl-12 pr-4 text-[13px] md:text-base text-white placeholder:text-white/10 focus:outline-none focus:border-brand-red transition-all focus:bg-white/[0.08]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Assign Clearance Level</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {clearanceLevels.map((level) => (
                                            <button
                                                key={level.id}
                                                type="button"
                                                onClick={() => setSelectedRole(level.id)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 gap-2 md:gap-3 group/role",
                                                    selectedRole === level.id
                                                        ? "border-brand-red bg-white/10 shadow-lg shadow-brand-red/10"
                                                        : "border-white/5 bg-white/5 hover:border-white/20"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-transform group-hover/role:scale-110",
                                                    selectedRole === level.id ? "bg-brand-red" : "bg-white/10"
                                                )}>
                                                    <level.icon className={cn("w-4 h-4 md:w-5 md:h-5 text-white", selectedRole !== level.id && "opacity-40")} />
                                                </div>
                                                <span className={cn(
                                                    "text-[9px] md:text-[10px] font-black uppercase tracking-widest",
                                                    selectedRole === level.id ? "text-white" : "text-white/30"
                                                )}>
                                                    {level.title.split(' ')[0]}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                    <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Secure Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/20 group-focus-within:text-brand-red transition-colors" />
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            placeholder="••••••••"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 md:py-4 pl-11 md:pl-12 pr-4 text-[13px] md:text-base text-white placeholder:text-white/10 focus:outline-none focus:border-brand-red transition-all focus:bg-white/[0.08]"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isPending}
                                    className={cn(
                                        "w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all duration-300 flex items-center justify-center gap-3",
                                        "emergency-gradient text-white shadow-xl shadow-brand-red/30 cursor-pointer"
                                    )}
                                >
                                    {isPending ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </motion.button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <p className="mt-8 text-center text-auth-text-sub text-sm">
                        Already registered?{" "}
                        <Link href="/login" className="text-brand-red font-bold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>

                <p className="mt-8 text-center text-white/20 text-[10px] font-mono uppercase tracking-widest">
                    Protocol 8392-A ∙ Distributed Mesh Access
                </p>
            </motion.div >
        </div >
    );
}
