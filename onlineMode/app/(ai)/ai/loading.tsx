"use client";

import { Skeleton } from "@/components/Skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AILoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-96" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-40 rounded-xl" />
                        <Skeleton className="h-10 w-40 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Stats Grid Skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3 md:space-y-4">
                                    <div className="flex justify-between items-start">
                                        <Skeleton className="w-9 h-9 md:w-10 md:h-10 rounded-xl" />
                                        <Skeleton className="h-4 w-12 rounded" />
                                    </div>
                                    <div className="space-y-1.5 md:space-y-2">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-6 md:h-8 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Section Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-[300px] rounded-[2rem]" />
                            <Skeleton className="h-[300px] rounded-[2rem]" />
                        </div>

                        {/* Message Summary Skeleton */}
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-8 w-64" />
                                <Skeleton className="h-10 w-40 rounded-xl" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-64 md:h-80 rounded-[1.5rem] md:rounded-[2rem]" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-8 h-[800px]">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <div className="space-y-6 flex-1">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
