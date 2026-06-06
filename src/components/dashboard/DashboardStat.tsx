/**
 * Dashboard stat component for displaying key metrics.
 * Used in the dashboard summary and main dashboard grid.
 */

import { ComponentType } from "react";

interface DashboardStatProps {
  label: string;
  value: string;
  subvalue?: string;
  icon?: ComponentType<{ className?: string }>;
}

export function DashboardStat({ label, value, subvalue, icon: Icon }: DashboardStatProps) {
  return (
    <div className="relative overflow-hidden group/stat flex flex-col justify-between p-6 rounded-2xl bg-card/40 backdrop-blur-md border border-border/40 hover:border-primary/20 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 flex items-start justify-between mb-4">
        <span className="text-[9px] font-mono tracking-[0.2em] text-muted-foreground uppercase">{label}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-background/50 border border-border/40 text-foreground/80 group-hover/stat:scale-110 group-hover/stat:text-primary transition-all duration-500">
            <Icon className="size-5" />
          </div>
        )}
      </div>
      <div className="relative z-10">
        <span className="text-3xl font-bold tracking-tight text-foreground font-mono">{value}</span>
        {subvalue && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="h-px w-3 bg-primary/30" />
            <span className="text-[10px] font-mono text-muted-foreground/70">{subvalue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
