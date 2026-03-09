"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description: string;
  count?: number;
  countLabel?: string;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  count,
  countLabel,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 md:mb-12", className)}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 md:space-y-3">
            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tight uppercase leading-none">
              {title}
            </h1>
            <p className="text-base md:text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
              {description}
            </p>
          </div>

          {count !== undefined && (
            <div className="flex flex-col items-start md:items-end">
              <span className="text-3xl md:text-5xl font-black text-brand-red tabular-nums leading-none">
                {count.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-1 md:mt-2">
                {countLabel || "Total Records"}
              </span>
            </div>
          )}
        </div>
        <div className="h-1 w-20 bg-brand-red mt-6 md:mt-8 rounded-full" />
      </motion.div>
    </div>
  );
}
