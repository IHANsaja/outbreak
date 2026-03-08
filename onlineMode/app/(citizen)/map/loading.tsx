"use client";

import { Skeleton } from "@/components/Skeleton";

export default function MapLoading() {
    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header Skeleton */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Skeleton className="h-6 w-32 rounded-full" />
                    <Skeleton className="h-10 w-40 rounded-xl" />
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Skeleton */}
                <aside className="w-[300px] border-r border-gray-100 flex flex-col bg-white overflow-hidden p-6 space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex gap-3">
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-2 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="w-10 h-5 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="space-y-3">
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                        </div>
                    </div>
                </aside>

                {/* Main Map View Skeleton */}
                <main className="flex-1 relative bg-slate-50">
                    <Skeleton className="w-full h-full" />

                    <div className="absolute top-6 right-6">
                        <Skeleton className="h-40 w-48 rounded-xl" />
                    </div>

                    <div className="absolute bottom-6 right-6 space-y-3">
                        <Skeleton className="h-40 w-12 rounded-xl" />
                        <Skeleton className="h-12 w-12 rounded-xl" />
                    </div>
                </main>
            </div>
        </div>
    );
}
