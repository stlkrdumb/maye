/**
 * Position card component for displaying user's supplied position and protocol health.
 */

import { Wallet, Activity, CheckCircle } from "lucide-react";

interface PositionCardProps {
  userDepositDisplay: string;
  totalDeposits?: bigint;
  userDeposit?: bigint;
  amount: string;
  activeTab: "deposit" | "withdraw";
  currentPercent: number;
  projectedPercent: number;
  projectedShare: string;
  utilization: number;
}

export function PositionCard({
  userDepositDisplay,
  totalDeposits,
  userDeposit,
  amount,
  activeTab,
  currentPercent,
  projectedPercent,
  projectedShare,
  utilization,
}: PositionCardProps) {
  return (
    <div className="lg:col-span-5 flex flex-col h-full">
      <div className="border border-border/40 shadow-lg bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/80 backdrop-blur-md p-8 rounded-2xl flex flex-col justify-between h-full">
        <div className="space-y-8">
          {/* Position Stats */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[var(--color-sage-light)] text-[var(--color-sage-text)] dark:bg-[var(--color-sage-light)]/20 dark:text-[var(--color-sage)]">
                <Wallet className="size-3.5" />
              </div>
              <h4 className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">Your Supplied Position</h4>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground text-xs font-mono">Supplied Capital</span>
                <span className="heading-3 text-2xl text-foreground font-mono">${userDepositDisplay}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-mono">Pool Share</span>
                <span className="font-mono text-foreground font-semibold flex items-center gap-1.5">
                  {totalDeposits && totalDeposits > 0n
                    ? ((Number(userDeposit || 0n) / Number(totalDeposits)) * 100).toFixed(4)
                    : "0.0000"}%
                  {amount && parseFloat(amount) > 0 && activeTab === "deposit" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                      ➔ {projectedShare}%
                    </span>
                  )}
                </span>
              </div>
              <div className="h-1.5 bg-muted dark:bg-muted/30 rounded-full overflow-hidden relative">
                {/* Projected Extension */}
                {amount && parseFloat(amount) > 0 && activeTab === "deposit" && (
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500/30 transition-all duration-1000 border-r border-dashed border-emerald-500 z-0"
                    style={{ width: `${Math.min(100, projectedPercent)}%` }}
                  />
                )}
                {/* Current Share */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-sage-dark)] to-[var(--color-sage)] transition-all duration-1000 z-10"
                  style={{ width: `${currentPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Protocol Health & Security */}
          <div className="pt-8 border-t border-border/40 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Activity className="size-3.5" />
              </div>
              <h4 className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">Protocol Health & Safety</h4>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground text-xs font-mono">Utilization</span>
                <span className="heading-3 text-lg text-foreground font-mono">{utilization}%</span>
              </div>
              <div className="h-1.5 bg-muted dark:bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${utilization}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                * Rates calibrate dynamically. High utilization increases lender yields but restricts immediate withdrawal pool capacity.
              </p>
            </div>
          </div>
        </div>

        {/* Verified badge or micro assurance */}
        <div className="pt-6 border-t border-border/20 flex items-center gap-2 text-[9px] font-mono text-muted-foreground/50 tracking-wider">
          <CheckCircle className="size-3.5 text-emerald-600/60 dark:text-emerald-400/60 shrink-0" />
          VERIFIED Reputations Guarded by Zero-Knowledge Attestations
        </div>
      </div>
    </div>
  );
}
