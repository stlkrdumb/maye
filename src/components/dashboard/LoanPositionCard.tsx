/**
 * Individual loan position card component.
 * Displays loan details, progress, and repayment actions.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatUnits, parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/providers/toast";
import { useRialoPoolRead, useRialoLoanDetails, useRialoRepayWrite } from "@/hooks/useContracts";
import { timeAgo, formatRLO, formatUSDC } from "@/lib/utils";
import { Clock, CheckCircle, RefreshCw, ShieldCheck, Calendar, Coins } from "lucide-react";

interface LoanPositionCardProps {
  loanId: bigint;
  userAddress: string;
}

export function LoanPositionCard({ loanId, userAddress }: LoanPositionCardProps) {
  const poolRead = useRialoPoolRead(userAddress);
  const loanDetails = useRialoLoanDetails(loanId);
  const repayWrite = useRialoRepayWrite();

  const { success: showSuccess, error: showError, pending: showPending } = useToast();

  const [now, setNow] = useState<bigint>(0n);
  useEffect(() => {
    setNow(BigInt(Math.floor(Date.now() / 1000)));
  }, []);

  const [localApproveHash, setLocalApproveHash] = useState<`0x${string}` | undefined>(undefined);
  const [localRepayHash, setLocalRepayHash] = useState<`0x${string}` | undefined>(undefined);
  const [repaymentConfirmed, setRepaymentConfirmed] = useState(false);
  const [repaymentError, setRepaymentError] = useState<string | undefined>(undefined);

  // Watch Approval confirmations — auto-trigger repayment after approval
  useEffect(() => {
    if (repayWrite.approveHash && localApproveHash && repayWrite.approveHash === localApproveHash) {
      if (repayWrite.isApproveSuccess) {
        showSuccess("Repayment Approved", "USDC authorized for loan settlement.", repayWrite.approveHash);
        setLocalApproveHash(undefined);
        setTimeout(async () => {
          try {
            setLocalRepayHash(undefined);
            const hash = await repayWrite.repay(loanId);
            setLocalRepayHash(hash);
          } catch (err) {
            console.error("Auto-repay failed:", err);
            setRepaymentError("Repayment failed. Please try again.");
          }
        }, 500);
      } else {
        showPending("Approving Repayment", "Authorizing USDC spend in your wallet...", repayWrite.approveHash);
      }
    }
  }, [repayWrite.approveHash, repayWrite.isApproveSuccess, localApproveHash]);

  // Watch Repay confirmations
  useEffect(() => {
    if (repayWrite.repayHash && localRepayHash && repayWrite.repayHash === localRepayHash) {
      if (repayWrite.isRepaySuccess) {
        showSuccess("Loan Repaid!", "Your debt has been settled. Locked RLO returned to wallet.", repayWrite.repayHash);
        setLocalRepayHash(undefined);
        setRepaymentConfirmed(true);
      } else {
        showPending("Settling Loan", "Repaying USDC outstanding debt on-chain...", repayWrite.repayHash);
      }
    }
  }, [repayWrite.repayHash, repayWrite.isRepaySuccess, localRepayHash]);

  // Refresh loan details when operations finalize
  useEffect(() => {
    if (repayWrite.isApproveSuccess) {
      poolRead.usdcAllowance.refetch();
    }
  }, [repayWrite.isApproveSuccess]);

  useEffect(() => {
    if (repayWrite.isRepaySuccess) {
      loanDetails.loan.refetch();
      loanDetails.repaymentAmount.refetch();
      poolRead.rloBalance.refetch();
      poolRead.usdcBalance.refetch();
    }
  }, [repayWrite.isRepaySuccess]);

  const isLocalApproving = localApproveHash !== undefined || repayWrite.isApproving;
  const isLocalRepaying = localRepayHash !== undefined || repayWrite.isRepaying;

  // Reset states on mount (cleanup on unmount)
  useEffect(() => {
    setRepaymentConfirmed(false);
    setRepaymentError(undefined);
    return () => {
      setRepaymentConfirmed(false);
      setRepaymentError(undefined);
    };
  }, []);

  const ld = loanDetails.loan.data as readonly [string, bigint, bigint, bigint, bigint, bigint, bigint, boolean] | undefined;
  const repaymentRaw = loanDetails.repaymentAmount.data as bigint | undefined;

  if (!ld) {
    return <div className="h-32 bg-[var(--glass-bg)] border border-border/40 animate-pulse rounded-lg" />;
  }

  const [
    borrower,
    borrowedAmount,
    collateralLocked,
    collateralRatio,
    interestRate,
    startTime,
    dueTime,
    isActive
  ] = ld;

  if (!isActive) {
    return null;
  }

  const isOverdue = now > 0n ? now > dueTime : false;

  const totalDuration = dueTime - startTime;
  const elapsed = now > 0n ? now - startTime : 0n;
  const progressPercent = totalDuration > 0n
    ? Math.min(100, Math.round((Number(elapsed) / Number(totalDuration)) * 100))
    : 0;

  const currentUsdcAllowance = (poolRead.usdcAllowance.data as bigint) || 0n;
  const usdcBalanceRaw = (poolRead.usdcBalance.data as bigint) || 0n;
  const needsApproval = repaymentRaw !== undefined && currentUsdcAllowance < repaymentRaw;
  const isInsufficientUsdc = repaymentRaw !== undefined && usdcBalanceRaw < repaymentRaw;

  const handleRepayLoan = async () => {
    try {
      setRepaymentError(undefined);
      if (isInsufficientUsdc) {
        setRepaymentError(`Insufficient USDC balance. You need at least ${formatUSDC(repaymentRaw!)} USDC to repay.`);
        return;
      }
      if (needsApproval) {
        const buffer = parseUnits("10", 6);
        setLocalApproveHash(undefined);
        const hash = await repayWrite.approveUsdc(repaymentRaw! + buffer);
        setLocalApproveHash(hash);
        return;
      }
      setLocalRepayHash(undefined);
      const hash = await repayWrite.repay(loanId);
      setLocalRepayHash(hash);
    } catch (err) {
      console.error("Repayment failed:", err);
      setRepaymentError("Transaction failed. Please try again.");
    }
  };

  return (
    <Card className="border border-border/40 bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/70 backdrop-blur-md shadow-sm hover:shadow-xl hover:shadow-[var(--color-sage)]/5 hover:border-[var(--color-sage)]/20 transition-all duration-500 rounded-2xl overflow-hidden group">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-sage)]/20 to-transparent" />
      
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-sage-light)]/30 to-[var(--color-sage-light)]/10 border border-[var(--color-sage)]/20 flex items-center justify-center text-[var(--color-sage-text)] dark:text-[var(--color-sage)] shrink-0 group-hover:scale-105 group-hover:border-[var(--color-sage)]/40 transition-all duration-500 shadow-sm">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-sage)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Coins className="size-6 relative z-10" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="heading-3 !text-lg font-mono text-foreground">${formatUSDC(borrowedAmount)} USDC</span>
                {isOverdue ? (
                  <div className="px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-mono font-bold tracking-widest uppercase flex items-center gap-2 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    OVERDUE
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold tracking-widest uppercase flex items-center gap-2 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    ACTIVE
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground opacity-60">
                <span>Position ID: #{loanId.toString().slice(-8)}</span>
                <span>•</span>
                <span>Verified</span>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-muted-foreground opacity-60">
                <span>Issued {timeAgo(startTime)}</span>
                <span>•</span>
                <span className="text-[var(--color-sage-text)] dark:text-[var(--color-sage)]">{(Number(interestRate) / 100).toFixed(2)}% APR</span>
                <span>•</span>
                <span>Collateral: {formatRLO(collateralLocked)} RLO</span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 max-w-xs flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3 text-muted-foreground/60" />
                <span>Term Progress</span>
              </div>
              <span className={isOverdue ? "text-red-500 font-bold" : "text-foreground font-semibold"}>
                {isOverdue ? "Expired" : `${progressPercent}%`}
              </span>
            </div>
            
            <div className="relative h-2 bg-muted/50 dark:bg-muted/30 rounded-full overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
              <div
                className={`h-full transition-all duration-1000 rounded-full ${isOverdue ? "bg-gradient-to-r from-red-600 to-rose-500" : "bg-gradient-to-r from-[var(--color-sage-dark)] to-[var(--color-sage)] shadow-[0_0_12px_rgba(169,221,211,0.4)]"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            {repaymentRaw !== undefined && (
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground opacity-60 mt-0.5">
                <span>Principal: ${formatUSDC(borrowedAmount)}</span>
                <span className="font-semibold text-foreground/80">Due: ${formatUSDC(repaymentRaw)}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1 self-end lg:self-center">
            {repaymentRaw !== undefined && (
              <>
                {isLocalApproving && (
                  <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-[var(--color-sage)]">
                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-sage)] animate-pulse" />
                    Approving USDC spend authorization...
                  </div>
                )}
                {isLocalRepaying && (
                  <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-[var(--color-sage)]">
                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-sage)] animate-pulse" />
                    Settling loan debt...
                  </div>
                )}
                {repaymentError && (
                  <div className="text-[8px] font-mono text-red-500/80">
                    {repaymentError}
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={handleRepayLoan}
                  disabled={isLocalApproving || isLocalRepaying || repaymentConfirmed || isInsufficientUsdc}
                  className={`relative overflow-hidden h-11 px-6 font-mono text-[9px] uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-xl flex items-center gap-2 ${
                    repaymentConfirmed
                      ? "bg-emerald-600/90 text-white shadow-emerald-500/20"
                      : isLocalApproving || isLocalRepaying
                      ? "bg-muted/80 text-muted-foreground cursor-wait"
                      : isInsufficientUsdc
                      ? "bg-red-600/90 text-white shadow-red-500/20 opacity-80 cursor-not-allowed"
                      : repaymentError
                      ? "bg-red-600/90 text-white shadow-red-500/20"
                      : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-primary/20 cursor-pointer"
                  }`}
                >
                  {repaymentConfirmed ? (
                    <>
                      <ShieldCheck className="size-3.5" />
                      CONFIRMED
                    </>
                  ) : isInsufficientUsdc ? (
                    <>
                      <RefreshCw className="size-3.5" />
                      INSUFFICIENT USDC
                    </>
                  ) : isLocalApproving ? (
                    <>
                      <Clock className="size-3.5 animate-spin" />
                      APPROVING
                    </>
                  ) : isLocalRepaying ? (
                    <>
                      <Clock className="size-3.5 animate-spin" />
                      REPAYING
                    </>
                  ) : repaymentError ? (
                    <>
                      <RefreshCw className="size-3.5" />
                      RETRY
                    </>
                  ) : (
                    <>
                      <CheckCircle className="size-3.5" />
                      REPAY DEBT
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
