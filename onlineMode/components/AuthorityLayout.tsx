"use client";
import AuthoritySidebar from "@/components/AuthoritySidebar";
import { Bell, Calendar, ChevronRight, Globe, Search } from "lucide-react";

export default function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-auth-bg font-outfit">
      <AuthoritySidebar />
      
      <main className="pl-64 min-h-screen">
        {/* Top Header */}
        <header className="h-20 border-b border-auth-border bg-white sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Command Center</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-600 font-medium">Overview</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-600">Oct 24, 2023</span>
            </div>

            <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700">System Operational</span>
            </div>

            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
              <Bell className="w-5 h-5 text-slate-500" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-auth-accent-red rounded-full border-2 border-white"></div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
