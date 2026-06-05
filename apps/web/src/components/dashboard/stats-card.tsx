"use client";

import React from "react";
import { cn } from "@vantagepay/ui";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* --------------------------------------------------------------------------
   Types
   -------------------------------------------------------------------------- */

export type StatsCardVariant = "default" | "indigo" | "emerald" | "amber";

export interface StatsCardProps {
  /** Lucide icon component to render. */
  icon: LucideIcon;
  /** Label text (e.g. "Total Balance"). */
  label: string;
  /** Value displayed large and bold. */
  value: string;
  /** Optional trend indicator. Positive = green/up, negative = red/down. */
  trend?: number;
  /** Color variant for the card's gradient accent. */
  variant?: StatsCardVariant;
  className?: string;
}

/* --------------------------------------------------------------------------
   Variant style maps
   -------------------------------------------------------------------------- */

const variantStyles: Record<
  StatsCardVariant,
  {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    trendUp: string;
    trendDown: string;
  }
> = {
  default: {
    bg: "from-slate-100/80 to-slate-50/50 dark:from-slate-900/80 dark:to-slate-950/50",
    border: "border-slate-200 dark:border-slate-800",
    iconBg: "bg-slate-200 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-600 dark:text-red-400",
  },
  indigo: {
    bg: "from-indigo-50/60 to-indigo-50/20 dark:from-indigo-950/60 dark:to-indigo-950/20",
    border: "border-indigo-200 dark:border-indigo-800/50",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-600 dark:text-red-400",
  },
  emerald: {
    bg: "from-emerald-50/60 to-emerald-50/20 dark:from-emerald-950/60 dark:to-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/50",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-600 dark:text-red-400",
  },
  amber: {
    bg: "from-amber-50/60 to-amber-50/20 dark:from-amber-950/60 dark:to-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/50",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-600 dark:text-red-400",
  },
};

/* --------------------------------------------------------------------------
   Component
   -------------------------------------------------------------------------- */

/**
 * Stats card — a compact KPI card with icon, label, value, and optional trend.
 *
 * Variants provide distinct background gradients that match the card's
 * semantic intent (indigo for balance, emerald for positive metrics, etc.).
 */
export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  variant = "default",
  className,
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-gradient-to-br",
        styles.bg,
        styles.border,
        "p-4 md:p-5",
        "transition-all duration-200 hover:shadow-md",
        className,
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center mb-3",
          styles.iconBg,
        )}
      >
        <Icon className={cn("w-4.5 h-4.5", styles.iconColor)} />
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </p>

      {/* Value + Trend */}
      <div className="flex items-baseline gap-2">
        <span className="text-xl md:text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
          {value}
        </span>

        {trend !== undefined && trend !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
              trend > 0 ? styles.trendUp : styles.trendDown,
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
    </div>
  );
}
