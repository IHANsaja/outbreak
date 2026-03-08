"use client";

import { Skeleton } from "@/components/Skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function UpdatesLoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar type="dashboard" />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
                <div className="mb-10 space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>

                <div className="space-y-6">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
