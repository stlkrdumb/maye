"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import {
  useRialoPoolRead,
  useRialoFaucets,
  useUserLoans
} from "@/hooks/useContracts";
import { usePortfolioSummary } from "@/hooks/usePortfolioSummary";
import { useToast } from "@/lib/providers/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Clock,
  Fingerprint,
  ShieldCheck,
  Lock
} from "lucide-react";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { DashboardStat } from "@/components/dashboard/DashboardStat";
import { LoanPositionCard } from "@/components/dashboard/LoanPositionCard";
import { useMayeRewards } from "@/hooks/useMayeRewards";
import { MayeRewardHistory } from "@/components/dashboard/MayeRewardHistory";
import { USDCLogo, ETHLogo, RLOLogo, MAYELogo } from "@/components/icons";
import { formatUSDC, formatRLO, timeAgo } from "@/lib/utils";

/* ── Main Dashboard Page ────────────────────────────────────────── */

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: ethBal } = useBalance({ address });
  
  // Live pool reads
  const pool = useRialoPoolRead(address);
  const faucets = useRialoFaucets();

  // Loan IDs from contract
  const userLoans = pool.userLoans.data as bigint[] | undefined;
  const { summary } = usePortfolioSummary(userLoans);
  const liveCredentials = (pool.credentials.data as readonly boolean[]) || [false, false, false, false, false];

  // MAYE Rewards
  const { formatBalance: formatMayeBalance } = useMayeRewards(address as `0x${string}`);

  // ── Toast Notifications ──
  const { success: showSuccess, error: showError, pending: showPending } = useToast();

  // Watch Faucet confirmations
  useEffect(() => {
    if (faucets.rloHash) {
      if (faucets.isRloSuccess) {
        showSuccess("RLO Minted!", "200,000 RLO collateral added to your wallet.", faucets.rloHash);
      } else {
        showPending("Minting RLO Faucet", "Claiming test RLO from faucet...", faucets.rloHash);
      }
    }
  }, [faucets.rloHash, faucets.isRloSuccess]);

  // Refresh balances when faucet transactions land
  useEffect(() => {
    if (faucets.isRloSuccess || faucets.isUsdcSuccess) {
      pool.rloBalance.refetch();
      pool.usdcBalance.refetch();
      pool.rloAllowance.refetch();
      pool.usdcAllowance.refetch();
    }
  }, [faucets.isRloSuccess, faucets.isUsdcSuccess]);

  // Formatted displays
  const ethDisplay = ethBal ? parseFloat(formatUnits(ethBal.value, 18)).toFixed(4) : "0.0000";
  
  const rloBalanceDisplay = useMemo(() => {
    if (pool.rloBalance.data) {
      return formatRLO(pool.rloBalance.data as bigint);
    }
    return "0.00";
  }, [pool.rloBalance.data]);

  const usdcBalanceDisplay = useMemo(() => {
    if (pool.usdcBalance.data) {
      return formatUSDC(pool.usdcBalance.data as bigint);
    }
    return "0.00";
  }, [pool.usdcBalance.data]);

  // Count verified credentials for trust score
  const trustScore = useMemo(() => {
    const numVerified = liveCredentials.filter(Boolean).length;
    return 500 + numVerified * 80 + (numVerified === 5 ? 100 : 0);
  }, [liveCredentials]);

  const trustTier = useMemo(() => {
    if (trustScore >= 850) return { label: "PRIME STACK", color: "text-[var(--color-sage-text)]", bg: "bg-[var(--color-sage-light)]" };
    if (trustScore >= 650) return { label: "ESTABLISHED", color: "text-[var(--color-sage-dark)]", bg: "bg-[var(--color-sage-light)]/50" };
    return { label: "BASELINE", color: "text-muted-foreground", bg: "bg-muted" };
  }, [trustScore]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm fade-up">
          <h1 className="heading-display mb-4">Command Center</h1>
          <p className="text-[var(--ink-muted)] mb-8">Connect your wallet to manage your lending positions and credential registry.</p>
          <div className="p-12 border-2 border-dashed border-[var(--border)] rounded-lg opacity-40">
            <Wallet className="size-8 mx-auto text-muted-foreground mb-4" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Wallet Required</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 md:px-8">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute top-[10%] right-[5%] w-[40%] h-[40%] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, var(--color-sage) 0%, transparent 70%)', filter: 'blur(100px)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header navigation & Faucets */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 fade-up">
          <div>
            <Badge variant="outline" className="mb-4 py-1 px-3 border-[var(--border)] text-[var(--ink-muted)] uppercase tracking-widest font-mono text-[9px]">
              Protocol Dashboard
            </Badge>
            <h1 className="heading-display mb-1">Command & <span className="italic" style={{ fontFamily: 'Newsreader, serif' }}>Reputation.</span></h1>
            <p className="text-xs font-mono text-[var(--ink-muted)] opacity-60">
              Address: {address?.slice(0, 10)}...{address?.slice(-8)}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* RLO Faucet */}
            <Button
              size="sm"
              onClick={() => faucets.requestRloFaucet()}
              disabled={faucets.isMintingRlo}
              variant="outline"
              className="h-10 px-5 font-mono text-[9px] tracking-widest uppercase border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              {faucets.isMintingRlo ? (
                <>
                  <Clock className="size-3 animate-spin" />
                  MINTING RLO...
                </>
              ) : (
                "FAUCET: 200K RLO"
              )}
            </Button>

            <Link href="/apply">
              <Button size="sm" variant="default" className="h-10 px-6 !rounded-lg text-[9px] uppercase tracking-widest font-bold font-mono">
                Initiate Borrow →
              </Button>
            </Link>
          </div>
        </header>

        {/* Dashboard Summary (Command Center) */}
        {summary && summary.activeCount > 0 && (
          <DashboardSummary loanIds={userLoans || []} />
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main position stats and active loans */}
          <div className="lg:col-span-2 space-y-8">
            {/* Portfolio Vertical List */}
            <Card className="border border-border/40 bg-[var(--glass-bg)] shadow-md backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-sage-light)]/20 via-[var(--color-sage)]/40 to-[var(--color-sage-dark)]/20" />
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Wallet className="size-4 text-[var(--color-sage-text)]" />
                  <h4 className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground font-semibold">
                    Your Portfolio
                  </h4>
                </div>
                <div className="divide-y divide-border/30">
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="size-8"><USDCLogo /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">USDC</p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">Liquid Repayment Token</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-lg text-[var(--ink)]">{usdcBalanceDisplay}</span>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="size-8"><RLOLogo /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">RLO</p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">Free Collateral Asset</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-lg text-[var(--ink)]">{rloBalanceDisplay}</span>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="size-8 p-1 rounded-full bg-[var(--color-sage-light)]/20 border border-[var(--color-sage)]/30 flex items-center justify-center">
                        <MAYELogo className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">MAYE</p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">Governance Rewards</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-lg text-[var(--ink)]">{formatMayeBalance()}</span>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="size-8"><ETHLogo /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">ETH</p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">Base Sepolia Gas</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-lg text-[var(--ink)]">{ethDisplay} ETH</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Borrowing positions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">Active Borrowing Positions</h3>
                <span className="text-[10px] font-mono text-muted-foreground opacity-40">
                  {summary ? `${summary.activeCount} active position(s) detected` : "0 active position(s) detected"}
                </span>
              </div>

              {summary && summary.activeCount > 0 && userLoans ? (
                <div className="grid gap-4">
                  {[...userLoans].reverse().map((id) => (
                    <LoanPositionCard key={id.toString()} loanId={id} userAddress={address as string} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-border bg-transparent p-12 text-center text-muted-foreground">
                  <p className="text-sm opacity-50 mb-6">No active under-collateralized positions discovered.</p>
                  <Link href="/apply">
                    <Button variant="outline" className="font-mono text-[9px] uppercase tracking-widest h-10 px-6 border-dashed">
                      Configure Borrow Offering
                    </Button>
                  </Link>
                </Card>
              )}
            </div>

            {/* MAYE Reward Claims History */}
            <div className="pt-2">
              <MayeRewardHistory />
            </div>
          </div>

          {/* Side Panels: Trust Profile and Stats */}
          <div className="space-y-8">
            {/* ZK DNA Score Card */}
            <Card className="relative overflow-hidden border border-border/40 bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/60 shadow-lg backdrop-blur-md group hover:shadow-xl hover:shadow-[var(--color-sage)]/5 hover:border-[var(--color-sage)]/20 transition-all duration-500">
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[var(--color-sage)]/10 blur-3xl pointer-events-none group-hover:bg-[var(--color-sage)]/20 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-sage)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              <CardContent className="p-8 space-y-6 relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[var(--color-sage-light)] text-[var(--color-sage-text)] dark:bg-[var(--color-sage-light)]/20 dark:text-[var(--color-sage)] animate-pulse shadow-[0_0_8px_rgba(169,221,211,0.2)]">
                      <Fingerprint className="size-4" />
                    </div>
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground font-semibold">
                      ZK reputation pass
                    </span>
                  </div>
                  
                  <div className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5 shrink-0 transition-colors duration-500 ${
                    trustScore >= 850 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                      : trustScore >= 650
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
                        : "bg-muted text-muted-foreground border-border"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${
                      trustScore >= 850 
                        ? "bg-emerald-500 animate-pulse" 
                        : trustScore >= 650 
                          ? "bg-amber-500 animate-pulse" 
                          : "bg-muted-foreground"
                    }`} />
                    {trustTier.label}
                  </div>
                </div>
                
                <div className="py-2 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold tracking-tighter text-foreground font-mono leading-none">
                      {trustScore}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">
                      / 900 pts
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                    Cryptographic Proof of Reputation
                  </p>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-border/30">
                  <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>Attestation Integrity</span>
                    <span className="text-foreground font-bold">{liveCredentials.filter(Boolean).length} / 5 Verified</span>
                  </div>
                  
                  <div className="relative h-2 bg-muted dark:bg-muted/50 rounded-full overflow-hidden border border-border/20">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-sage-dark)] to-[var(--color-sage)] rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(169,221,211,0.5)]" 
                      style={{ width: `${((trustScore - 500) / 400) * 100}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credentials Attestation Summary */}
            <Card className="border border-border/40 bg-[var(--glass-bg)] shadow-md backdrop-blur-sm p-6 relative overflow-hidden group">
              <h4 className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-4">Secured Credentials</h4>
              <div className="space-y-2.5">
                {[
                  "FICO Credit Score Bureau Proof",
                  "Open Banking Asset Proof",
                  "Verified Identity Check",
                  "On-Chain Repayment History",
                  "Bureau Default Reporting Consent"
                ].map((label, idx) => {
                  const verified = liveCredentials[idx];
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between text-xs py-2 px-3 rounded-lg border transition-all duration-300 ${
                        verified 
                          ? "bg-[var(--color-sage-light)]/10 border-[var(--color-sage)]/25 text-foreground" 
                          : "bg-muted/10 border-border/20 text-muted-foreground opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {verified ? (
                          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="size-3.5 text-muted-foreground/60 shrink-0" />
                        )}
                        <span className={`text-xs ${verified ? "font-medium text-foreground" : "text-muted-foreground font-normal"}`}>
                          {label}
                        </span>
                      </div>
                      
                      {verified ? (
                        <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
                          SECURED
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-medium tracking-widest text-muted-foreground/50 bg-muted/40 px-1.5 py-0.5 rounded border border-border/10">
                          PENDING
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
