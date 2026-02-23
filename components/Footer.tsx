"use client";

import { Phone } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0F172A] text-white pt-12 pb-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Emergency Hotlines</h3>
            <div className="flex flex-wrap gap-4">
              <a
                href="tel:117"
                className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors border border-slate-700"
              >
                <Phone className="w-4 h-4 text-brand-red" />
                <span className="font-bold">117</span>
              </a>
              <a
                href="tel:119"
                className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors border border-slate-700"
              >
                <Phone className="w-4 h-4 text-brand-red" />
                <span className="font-bold">119</span>
              </a>
              <a
                href="tel:1990"
                className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors border border-slate-700"
              >
                <Phone className="w-4 h-4 text-blue-400" />
                <span className="font-bold">1990</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button className="px-4 py-1.5 text-xs font-bold rounded-md transition-colors hover:bg-slate-700 text-slate-400">
                Sinhala
              </button>
              <button className="px-4 py-1.5 text-xs font-bold rounded-md transition-colors hover:bg-slate-700 text-slate-400">
                Tamil
              </button>
              <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-white text-slate-900">
                English
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-xs">
            © {currentYear} Disaster Management Center of Sri Lanka. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
