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
        "group relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 md:p-6 text-left transition-all hover:shadow-xl hover:border-brand-red/20 active:scale-[0.98] shadow-sm",
        className
      )}
    >
      {BgIcon && (
        <BgIcon className="absolute -right-4 -bottom-4 w-24 h-24 md:w-32 md:h-32 text-gray-50 group-hover:text-brand-red/[0.03] transition-colors" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:bg-brand-red group-hover:text-white transition-colors">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-brand-red group-hover:text-white transition-colors" />
        </div>

        <h3 className="text-sm md:text-base font-bold text-zinc-900 group-hover:text-brand-red transition-colors leading-tight">
          {title}
        </h3>
        <p className="text-[10px] md:text-xs font-medium text-gray-500 mt-1 leading-relaxed">
          {description}
        </p>

        {count !== undefined && (
          <div className="mt-3 md:mt-4 inline-flex items-center gap-2">
            <span className="text-[9px] md:text-[10px] font-black uppercase text-brand-red tracking-widest border-b border-brand-red/20 pb-0.5">
              {count} Active Alerts
            </span>
          </div>
        )}

        {title === "Request Help" && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <div className="flex flex-col items-center">
              <span className="text-[8px] md:text-[10px] font-black text-brand-red uppercase mb-0.5 md:mb-1">SOS</span>
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-brand-red animate-ping" />
                <div className="absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-red" />
              </div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
