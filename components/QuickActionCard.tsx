"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface QuickActionProps {
  icon: LucideIcon;
  bgIcon?: LucideIcon;
  title: string;
  description: string;
  count?: number;
  className?: string;
  onClick?: () => void;
}

export default function QuickActionCard({
  icon: Icon,
  bgIcon: BgIcon,
  title,
  description,
  count,
  className,
  onClick,
}: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 text-left transition-all hover:shadow-xl hover:border-brand-red/20 active:scale-[0.98] shadow-sm",
        className
      )}
    >
      {BgIcon && (
        <BgIcon className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-50 group-hover:text-brand-red/[0.03] transition-colors" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-red group-hover:text-white transition-colors">
          <Icon className="w-6 h-6 text-brand-red group-hover:text-white transition-colors" />
        </div>

        <h3 className="font-bold text-zinc-900 group-hover:text-brand-red transition-colors">
          {title}
        </h3>
        <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">
          {description}
        </p>

        {count !== undefined && (
          <div className="mt-4 inline-flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-brand-red tracking-widest border-b border-brand-red/20 pb-0.5">
              {count} Active Alerts
            </span>
          </div>
        )}

        {title === "Request Help" && (
          <div className="absolute top-6 right-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-brand-red uppercase mb-1">SOS</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-brand-red animate-ping" />
                <div className="absolute w-2 h-2 rounded-full bg-brand-red" />
              </div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
