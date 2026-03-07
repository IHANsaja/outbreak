"use client";

import { 
  ArrowLeft, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Share2, 
  MessageSquare, 
  Facebook, 
  Printer, 
  Phone, 
  Map as MapIcon, 
  Info,
  Building2,
  Users2
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

export default function UpdateDetailPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">
           <Link href="/" className="hover:text-brand-red transition-colors flex items-center gap-1">
             <ArrowLeft className="w-3 h-3" />
             Back to Dashboard
           </Link>
           <ChevronRight className="w-3 h-3" />
           <span className="text-gray-300">Official Updates</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           {/* Main Document Area */}
           <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 md:p-12 space-y-10">
                 {/* Document Header */}
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-50 pb-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <ShieldCheck className="w-6 h-6" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Source</span>
                          <span className="text-sm font-black text-zinc-900 italic tracking-tight mt-1">Disaster Management Center</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Released</span>
                       <span className="text-sm font-black text-zinc-900 italic tracking-tight mt-1">Oct 24, 2024 • 08:30 AM</span>
                    </div>
                 </div>

                 {/* Content Area */}
                 <article className="space-y-8">
                    <div className="space-y-4">
                       <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black tracking-widest uppercase border border-blue-100">
                         Press Release #DMC-2024-882
                       </span>
                       <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight italic leading-tight">
                         Relief centers opened in Panadura North following flash floods
                       </h1>
                       <p className="text-base font-bold text-gray-500 leading-relaxed italic">
                         Immediate evacuation orders have been issued for low-lying areas. Three new secure locations are now operational for displaced persons.
                       </p>
                    </div>

                    <div className="prose prose-slate max-w-none">
                       <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6">
                         <span className="font-black text-zinc-900 uppercase italic">COLOMBO, SRI LANKA —</span> The Disaster Management Center (DMC), in coordination with the Divisional Secretariat, has authorized the opening of three new emergency relief centers in the Panadura North division. This action comes in response to rising water levels in the Bolgoda Lake basin, which has rendered several residential zones unsafe.
                       </p>
                       
                       <div className="bg-gray-50/50 rounded-2xl p-6 md:p-8 space-y-6 border border-gray-100 mb-8">
                          <h3 className="text-sm font-black text-zinc-900 italic uppercase flex items-center gap-2">
                             <Building2 className="w-4 h-4 text-brand-red" />
                             Authorized Relief Centers
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                             {[
                               { name: "Sri Sumangala College (Main Hall)", loc: "Wekada, Panadura.", cap: "500 persons." },
                               { name: "Panadura Town Hall", loc: "Galle Road, Panadura.", cap: "350 persons." },
                               { name: "Methsarana Community Center", loc: "Nalluruwa.", cap: "200 persons." }
                             ].map((center, i) => (
                               <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-50 shadow-sm">
                                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4 text-brand-red" />
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-xs font-black text-zinc-900 italic">{center.name}</span>
                                     <span className="text-[10px] font-bold text-gray-400 mt-0.5">{center.loc} <span className="text-zinc-400">Capacity: {center.cap}</span></span>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>

                       <h3 className="text-sm font-black text-zinc-900 italic uppercase mb-4">Instructions for Citizens</h3>
                       <p className="text-sm font-medium text-gray-600 leading-relaxed italic mb-4">
                         Residents in Zone A and Zone B (indicated in previous hazard maps) are advised to evacuate immediately. Do not wait until water enters your home.
                       </p>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Please bring the following essential items if possible:</p>
                       <ul className="grid grid-cols-1 md:grid-cols-1 gap-2 border-l-2 border-gray-100 pl-6 mb-8">
                          {[
                            "National Identity Cards (NIC) or other identification documents.",
                            "Essential medication for at least 3 days.",
                            "Infant supplies (milk powder, diapers) if applicable.",
                            "A torch and spare batteries."
                          ].map((item, i) => (
                             <li key={i} className="text-xs font-bold text-gray-500 italic flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                {item}
                             </li>
                          ))}
                       </ul>

                       <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl">
                          <p className="text-[11px] font-bold text-yellow-800 italic leading-relaxed">
                            <span className="font-black text-zinc-900 uppercase">Note:</span> Transport services for the elderly and disabled are available. Call 117 to request assistance.
                          </p>
                       </div>
                    </div>
                 </article>

                 <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-1">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none">Signed,</span>
                       <span className="block text-sm font-black text-zinc-900 italic tracking-tight">Director General,</span>
                       <span className="block text-xs font-bold text-gray-400 italic mt-1">Disaster Management Center</span>
                    </div>
                    {/* Mock Seal */}
                    <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center p-2 opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                       <ShieldCheck className="w-10 h-10 text-brand-red/40" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Sidebar Actions */}
           <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 space-y-8 sticky top-8">
                 <div className="space-y-4">
                    <h3 className="text-sm font-black text-zinc-900 italic uppercase flex items-center gap-2">
                       <Share2 className="w-4 h-4 text-gray-400" />
                       Share Information
                    </h3>
                    <p className="text-[11px] font-medium text-gray-400 leading-relaxed uppercase tracking-wider">Help your community by sharing this official update. Prioritize SMS for low-bandwidth areas.</p>
                    
                    <div className="space-y-3">
                       <button className="w-full bg-[#0F172A] hover:bg-black text-white py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-xs transition-all active:scale-[0.98]">
                          <MessageSquare className="w-4 h-4" />
                          Share via SMS
                       </button>
                       <button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-xs transition-all active:scale-[0.98]">
                          <Share2 className="w-4 h-4" />
                          Share via WhatsApp
                       </button>
                       <button className="w-full bg-[#1877F2] hover:bg-[#0E52A4] text-white py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-xs transition-all active:scale-[0.98]">
                          <Facebook className="w-4 h-4" />
                          Post to Facebook
                       </button>
                    </div>
                 </div>

                 <div className="pt-8 border-t border-gray-50 space-y-4">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block">Related Actions</span>
                    <div className="space-y-3">
                       <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                          <div className="flex items-center gap-3 text-xs font-black text-zinc-900 italic uppercase">
                             <MapIcon className="w-4 h-4 text-brand-red" />
                             View Relief Map
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-zinc-600 transition-colors" />
                       </button>
                       <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                          <div className="flex items-center gap-3 text-xs font-black text-zinc-900 italic uppercase">
                             <Phone className="w-4 h-4 text-blue-500" />
                             Contact DMC
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-zinc-600 transition-colors" />
                       </button>
                       <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                          <div className="flex items-center gap-3 text-xs font-black text-zinc-900 italic uppercase">
                             <Printer className="w-4 h-4 text-gray-400" />
                             Print Notice
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-zinc-600 transition-colors" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
