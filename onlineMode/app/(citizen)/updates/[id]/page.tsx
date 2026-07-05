import {
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Share2,
  MessageSquare,
  Facebook,
  Printer,
  Phone,
  Map as MapIcon,
  AlertTriangle,
  Info
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { getOfficialUpdateById } from "@/app/actions/data";

const SEVERITY_STYLE: Record<string, { badge: string; icon: typeof Info; label: string }> = {
  urgent: { badge: "bg-red-50 text-red-600 border-red-100", icon: AlertTriangle, label: "Urgent" },
  warning: { badge: "bg-orange-50 text-orange-600 border-orange-100", icon: AlertTriangle, label: "Warning" },
  info: { badge: "bg-blue-50 text-blue-600 border-blue-100", icon: Info, label: "Information" },
};

export default async function UpdateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const update = await getOfficialUpdateById(id);

  if (!update) notFound();

  const severity = SEVERITY_STYLE[update.severity] ?? SEVERITY_STYLE.info;
  const SeverityIcon = severity.icon;
  const releasedAt = new Date(update.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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
                       <span className="text-sm font-black text-zinc-900 italic tracking-tight mt-1">{releasedAt}</span>
                    </div>
                 </div>

                 {/* Content Area */}
                 <article className="space-y-8">
                    <div className="space-y-4">
                       <span className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border", severity.badge)}>
                         <SeverityIcon className="w-3 h-3" />
                         {severity.label}
                       </span>
                       <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight italic leading-tight">
                         {update.title}
                       </h1>
                    </div>

                    <div className="prose prose-slate max-w-none">
                       <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-line">
                         {update.content}
                       </p>
                    </div>

                    {(update.latitude && update.longitude) && (
                       <Link
                          href={`/map/situation?lat=${update.latitude}&lng=${update.longitude}`}
                          className="inline-flex items-center gap-2 p-4 bg-gray-50/50 rounded-xl border border-gray-100 text-xs font-black text-zinc-900 italic uppercase hover:bg-gray-100 transition-colors"
                       >
                          <MapIcon className="w-4 h-4 text-brand-red" />
                          View affected location on map
                       </Link>
                    )}
                 </article>

                 <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-1">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none">Issued by,</span>
                       <span className="block text-sm font-black text-zinc-900 italic tracking-tight">Disaster Management Center</span>
                    </div>
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
                       <Link href="/map/situation" className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                          <div className="flex items-center gap-3 text-xs font-black text-zinc-900 italic uppercase">
                             <MapIcon className="w-4 h-4 text-brand-red" />
                             View Situation Map
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-zinc-600 transition-colors" />
                       </Link>
                       <a href="tel:117" className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                          <div className="flex items-center gap-3 text-xs font-black text-zinc-900 italic uppercase">
                             <Phone className="w-4 h-4 text-blue-500" />
                             Contact DMC
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-zinc-600 transition-colors" />
                       </a>
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
