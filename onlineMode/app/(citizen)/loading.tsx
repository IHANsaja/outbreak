"use client";

import { Skeleton } from "@/components/Skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CitizenLoading() {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <Navbar type="dashboard" />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-10">

                {/* Urgent Alert Banner Skeleton */}
                <Skeleton className="w-full h-32 rounded-3xl" />

                {/* Quick Actions Grid Skeleton */}
                <section className="space-y-4 md:space-y-6">
                    <Skeleton className="h-6 w-32" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <Skeleton className="h-28 md:h-32 rounded-2xl md:rounded-3xl" />
                        <Skeleton className="h-28 md:h-32 rounded-2xl md:rounded-3xl" />
                        <Skeleton className="h-28 md:h-32 rounded-2xl md:rounded-3xl" />
                    </div>
                </section>

                {/* Map and Network Status Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    <div className="lg:col-span-8 flex flex-col space-y-3 md:space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 md:h-6 w-40" />
                            <Skeleton className="h-5 md:h-6 w-24" />
                        </div>

                        <Skeleton className="w-full h-[250px] md:h-[300px] lg:h-[400px] rounded-2xl" />
                    </div>

                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 h-full space-y-8">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-5 h-5 rounded" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-3">
                                        <Skeleton className="w-10 h-10 rounded-lg" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-2 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-12" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-3">
                                        <Skeleton className="w-10 h-10 rounded-lg" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-2 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-12" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Official Updates Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-6 w-40" />
                    <div className="space-y-3">
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    );
}
