/**
 * Stat block component for displaying protocol metrics.
 * Used in the metrics row and position cards.
 */

import { USDCLogo } from "@/components/icons";
import { Activity, TrendingUp } from "lucide-react";

interface StatBlockProps {
  label: string;
  value: string | null;
  icon: "usdc" | "activity" | "trending";
  subvalue?: string;
  loading: boolean;
  color?: string;
}

const ICONS = {
  usdc: USDCLogo,
  activity: Activity,
  trending: TrendingUp,
} as const;

export function StatBlock({ label, value, icon, subvalue, loading, color = "var(--color-sage)" }: StatBlockProps) {
  const Icon = ICONS[icon];
  
  return (
    <div className="group/stat relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/60 backdrop-blur-md border border-border/40 hover:border-[var(--color-sage)]/30 transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-sage)]/5 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 flex items-start justify-between p-6">
        <div className="flex flex-col space-y-1.5">
          <span className="text-[9px] font-mono tracking-[0.15em] uppercase text-muted-foreground/80 font-medium">{label}</span>
          {loading ? (
            <div className="h-8 w-24 bg-muted/50 animate-pulse rounded-lg" />
          ) : (
            <>
              <span className="heading-3 !text-2xl text-foreground font-bold tracking-tight">{value}</span>
              {subvalue && <span className="text-[10px] font-mono text-muted-foreground/70">{subvalue}</span>}
            </>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--color-sage-light)]/20 border border-[var(--color-sage)]/20 text-[var(--color-sage-text)] dark:text-[var(--color-sage)] group-hover/stat:scale-110 transition-all duration-300 shadow-sm">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
