"use client";

import { Skeleton } from "@/components/Skeleton";
import AuthorityLayout from "@/components/AuthorityLayout";

export default function AuthorityLoading() {
    return (
        <AuthorityLayout>
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* Header Section Skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>

                {/* Top Stat Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <Skeleton className="h-40 md:h-48 rounded-3xl" />
                    <Skeleton className="h-40 md:h-48 rounded-3xl" />
                    <Skeleton className="h-40 md:h-48 rounded-3xl" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* AI Insights & Charts Skeleton */}
                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        <Skeleton className="h-[300px] md:h-[400px] rounded-[1.5rem] md:rounded-[2rem]" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <Skeleton className="h-[280px] md:h-[350px] rounded-[1.5rem] md:rounded-[2rem]" />
                            <Skeleton className="h-[280px] md:h-[350px] rounded-[1.5rem] md:rounded-[2rem]" />
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="space-y-8">
                        <Skeleton className="h-96 rounded-[32px]" />
                        <Skeleton className="h-96 rounded-[32px]" />
                    </div>
                </div>
            </div>
        </AuthorityLayout>
    );
}
