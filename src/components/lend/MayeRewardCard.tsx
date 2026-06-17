"use client";

import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp } from "lucide-react";
import { useMayeRewards } from "@/hooks/useMayeRewards";
import { useToast } from "@/lib/providers/toast";
import { MAYELogo } from "@/components/icons";

export function MayeRewardCard() {
  const { address, isConnected } = useAccount();
  const { success: showSuccess, pending: showPending, error: showError } = useToast();
  const { claimable, rate, isClaiming, claim, formatRate, lastSnapshotDeposit } = useMayeRewards(address);

  if (!isConnected) return null;

  // Let's format the claimable rewards
  const claimableDisplay = parseFloat(formatUnits(claimable || 0n, 18));
  
  const hasDeposit = lastSnapshotDeposit && lastSnapshotDeposit > 0n;
  const activeRate = rate || 0n;

  // If user has deposit: use their snapshot deposit balance.
  // Otherwise, fallback to a baseline of $1,000 USDC (with 1.0x multiplier = 1000 * 10^18 scaled)
  const referenceDeposit = hasDeposit ? lastSnapshotDeposit : (1000n * 10n**18n);

  const ratePerSec = (referenceDeposit * activeRate) / 10n**18n;
  const hourlyEstimate = parseFloat(formatUnits(ratePerSec * 3600n, 18));

  async function handleClaim() {
    try {
      console.log("[Rewards] Starting claim tx...");
      const txHash = await claim();
      console.log("[Rewards] Claim tx submitted:", txHash);
      showPending("Claiming MAYE", "Minting governance rewards on-chain...", txHash);
    } catch (err) {
      const error = err as Error;
      console.error("[Rewards] Claim failed:", error);
      showError("Claim Failed", error.message || "Transaction failed");
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-[var(--glass-bg)] backdrop-blur-md p-6 space-y-4 shadow-lg flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MAYELogo className="size-4" />
            <h3 className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground font-semibold">
              MAYE Rewards
            </h3>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono bg-[var(--color-sage-light)]/10 border-[var(--color-sage)]/20 text-[var(--color-sage-text)]">
            Active
          </Badge>
        </div>

        {/* Main value */}
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Pending Rewards</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight font-mono text-[var(--ink)]">
              {claimableDisplay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            <span className="text-sm font-semibold text-muted-foreground/60 font-mono">MAYE</span>
          </div>
        </div>

        {/* Rate + estimate */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" /> {hasDeposit ? "My Rate" : "Rate (per $1k)"}
            </p>
            <p className="text-xs font-mono mt-0.5 text-[var(--ink)]">
              {rate ? `${parseFloat(formatUnits(ratePerSec, 18)).toFixed(4)}/s` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3" /> {hasDeposit ? "Est. Hourly" : "Est. (per $1k)"}
            </p>
            <p className="text-xs font-mono mt-0.5 text-[var(--ink)]">
              {hourlyEstimate > 0 ? `+${hourlyEstimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Claim button */}
      <Button
        onClick={handleClaim}
        disabled={isClaiming || !claimable || claimable === 0n}
        className="w-full h-10 !rounded-lg text-[9px] uppercase tracking-widest font-bold font-mono transition-all duration-300 mt-2"
        variant={claimable && claimable > 0n ? "default" : "outline"}
      >
        {isClaiming ? (
          <span className="flex items-center justify-center gap-2">
            <Clock className="size-3 animate-spin mr-1" /> CLAIMING...
          </span>
        ) : (
          `Claim ${claimableDisplay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAYE`
        )}
      </Button>
    </div>
  );
}