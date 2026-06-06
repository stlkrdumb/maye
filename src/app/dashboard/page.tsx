"use client";

import { useState, useMemo, useEffect, ComponentType } from "react";
import Link from "next/link";
import { useAccount, useBalance } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import {
  useRialoPoolRead,
  useRialoLoanDetails,
  useRialoRepayWrite,
  useRialoFaucets
} from "@/hooks/useContracts";
import { useToast } from "@/lib/providers/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity,
  Coins,
  ShieldAlert,
  Wallet,
  Clock,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle,
  Fingerprint,
  ShieldCheck,
  Lock,
  Calendar,
  RefreshCw
} from "lucide-react";

/* ── Helpers ────────────────────────────────────────────────── */

function timeAgo(ts: bigint): string {
  const diff = Math.floor((Date.now() / 1000) - Number(ts));
  if (diff < 0) return "just now";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatUSDC(val: bigint): string {
  return Number(formatUnits(val, 6)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRLO(val: bigint): string {
  return Number(formatUnits(val, 18)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ── Coin Logos ────────────────────────────────────────────────── */

function USDCLogo({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#3e73c4" d="M8 16c4.4183 0 8 -3.5817 8 -8 0 -4.41828 -3.5817 -8 -8 -8C3.58172 0 0 3.58172 0 8c0 4.4183 3.58172 8 8 8Z" strokeWidth={0.5}></path>
      <path fill="#ffffff" d="M10.01105 9.062c0 -1.062 -0.64 -1.426 -1.92 -1.578 -0.914 -0.1215 -1.0965 -0.364 -1.0965 -0.789 0 -0.425 0.305 -0.698 0.914 -0.698 0.5485 0 0.8535 0.182 1.0055 0.6375 0.0158 0.04405 0.04475 0.0822 0.08295 0.10925 0.03815 0.0271 0.0837 0.04185 0.13055 0.04225h0.4875c0.02815 0.00075 0.05615 -0.0042 0.08235 -0.0146 0.02615 -0.0104 0.04995 -0.02605 0.0699 -0.0459 0.01995 -0.01985 0.0357 -0.0436 0.0462 -0.0697 0.01055 -0.02615 0.01565 -0.05415 0.01505 -0.0823v-0.03c-0.0596 -0.32955 -0.22635 -0.6302 -0.47435 -0.85525 -0.248 -0.22505 -0.5634 -0.36185 -0.89715 -0.38925V4.571005c0 -0.1215 -0.0915 -0.2125 -0.2435 -0.243h-0.4575c-0.1215 0 -0.213 0.091 -0.2435 0.243V5.269c-0.9145 0.121 -1.493 0.728 -1.493 1.487 0 1.001 0.609 1.3955 1.889 1.5475 0.8535 0.1515 1.1275 0.334 1.1275 0.8195 0 0.485 -0.4265 0.819 -1.0055 0.819 -0.7925 0 -1.0665 -0.3335 -1.158 -0.789 -0.03 -0.121 -0.122 -0.182 -0.2135 -0.182h-0.518c-0.02815 -0.0007 -0.0561 0.00435 -0.0822 0.0148 -0.02615 0.0104 -0.04985 0.02605 -0.0698 0.0459 -0.0199 0.01985 -0.03555 0.04355 -0.04605 0.06965 -0.0105 0.0261 -0.0156 0.05405 -0.01495 0.08215v0.03c0.1215 0.759 0.6095 1.305 1.615 1.457v0.7285c0 0.121 0.0915 0.2125 0.2435 0.2425h0.4575c0.1215 0 0.213 -0.091 0.2435 -0.2425V10.67c0.9145 -0.1515 1.5235 -0.789 1.5235 -1.6085v0.0005Z" strokeWidth={0.5}></path>
      <path fill="#ffffff" d="M6.446 12.2485c-2.37698 -0.85 -3.59598 -3.49 -2.71198 -5.8265 0.457 -1.275 1.46248 -2.2455 2.71198 -2.701 0.122 -0.0605 0.1825 -0.1515 0.1825 -0.3035v-0.425c0 -0.121 -0.0605 -0.212 -0.1825 -0.2425 -0.0305 0 -0.0915 0 -0.122 0.03 -0.68575 0.21416 -1.3224 0.561865 -1.87327 1.023085 -0.550855 0.461225 -1.00503 1.026855 -1.336385 1.664315 -0.331355 0.6375 -0.53334 1.3342 -0.59432 2.05005 -0.06098 0.71585 0.020245 1.4367 0.238995 2.12105 0.548 1.7 1.8585 3.005 3.56498 3.551 0.122 0.0605 0.244 0 0.274 -0.1215 0.0305 -0.03 0.0305 -0.061 0.0305 -0.1215v-0.425c0 -0.091 -0.091 -0.212 -0.1825 -0.273Zm3.23 -9.468c-0.122 -0.061 -0.244 0 -0.274 0.121 -0.0305 0.0305 -0.0305 0.061 -0.0305 0.1215v0.425c0 0.1215 0.091 0.2425 0.1825 0.3035 2.377 0.85 3.596 3.49 2.712 5.8265 -0.457 1.275 -1.4625 2.2455 -2.712 2.701 -0.122 0.0605 -0.1825 0.1515 -0.1825 0.3035v0.425c0 0.121 0.0605 0.212 0.1825 0.2425 0.0305 0 0.0915 0 0.122 -0.03 0.6858 -0.21415 1.32245 -0.56185 1.8733 -1.0231 0.55085 -0.4612 1.00505 -1.02685 1.3364 -1.6643 0.33135 -0.6375 0.53335 -1.3342 0.5943 -2.05005 0.061 -0.71585 -0.02025 -1.4367 -0.239 -2.12105 -0.548 -1.73 -1.889 -3.035 -3.565 -3.581Z" strokeWidth={0.5}></path>
    </svg>
  );
}

function ETHLogo({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L12 11.5L20 8.5L12 2Z" fill="#8C8C8C" />
      <path d="M12 2L4 8.5L12 11.5V2Z" fill="#343434" />
      <path d="M12 12.5L12 22L20 10L12 12.5Z" fill="#3C3C3C" />
      <path d="M12 22V12.5L4 10L12 22Z" fill="#8C8C8C" />
      <path d="M12 11.5L20 8.5L12 6.5V11.5Z" fill="#141414" />
      <path d="M12 11.5V6.5L4 8.5L12 11.5Z" fill="#3C3C3C" />
    </svg>
  );
}

function RLOLogo({ className = "size-6" }: { className?: string }) {
  return (
    <img 
      src="/rialo-favicon.png" 
      alt="RLO Logo" 
      className={`${className} rounded-full object-contain`} 
    />
  );
}

/* ── Components ────────────────────────────────────────────────── */

function DashboardStat({
  label,
  value,
  subvalue,
  icon: Icon
}: {
  label: string;
  value: string;
  subvalue?: string;
  icon?: ComponentType<{ className?: string }>;
}) {
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

/* ── Main Dashboard Page ────────────────────────────────────────── */

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: ethBal } = useBalance({ address });
  
  // Live pool reads
  const pool = useRialoPoolRead(address);
  const faucets = useRialoFaucets();

  // ── Toast Notifications loop ──
  const { success: showSuccess, error: showError, pending: showPending } = useToast();

  // Watch Faucet confirmations
  useEffect(() => {
    if (faucets.rloHash) {
      if (faucets.isRloSuccess) {
        showSuccess("RLO Minted!", "10,000 RLO collateral added to your wallet.", faucets.rloHash);
      } else {
        showPending("Minting RLO Faucet", "Claiming test RLO from faucet...", faucets.rloHash);
      }
    }
  }, [faucets.rloHash, faucets.isRloSuccess]);

  const userLoans = pool.userLoans.data as bigint[] | undefined;
  const liveCredentials = (pool.credentials.data as readonly boolean[]) || [false, false, false, false, false];

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
    // Base trust score starts at 500, +80 points per attestation, +100 bonus for combo
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
                "FAUCET: 10K RLO"
              )}
            </Button>

            <Link href="/apply">
              <Button size="sm" variant="default" className="h-10 px-6 !rounded-lg text-[9px] uppercase tracking-widest font-bold font-mono">
                Initiate Borrow →
              </Button>
            </Link>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main position stats and active loans */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <DashboardStat label="USDC Liquid Balance" value={`${usdcBalanceDisplay}`} subvalue="Repayment Token" icon={USDCLogo} />
              <DashboardStat label="RLO Collateral Balance" value={`${rloBalanceDisplay}`} subvalue="Free in Wallet" icon={RLOLogo} />
              <DashboardStat label="ETH Gas Balance" value={`${ethDisplay} ETH`} subvalue="Base Sepolia Gas" icon={ETHLogo} />
            </div>

            {/* Active Borrowing positions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">Active Borrowing Positions</h3>
                <span className="text-[10px] font-mono text-muted-foreground opacity-40">
                  {userLoans?.length || 0} position(s) detected
                </span>
              </div>

              {userLoans && userLoans.length > 0 ? (
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
          </div>

          {/* Side Panels: Trust Profile and Stats */}
          <div className="space-y-8">
            {/* ZK DNA Score Card */}
            <Card className="relative overflow-hidden border border-border/40 bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/60 shadow-lg backdrop-blur-md group hover:shadow-xl hover:shadow-[var(--color-sage)]/5 hover:border-[var(--color-sage)]/20 transition-all duration-500">
              {/* A beautiful glowing orb in the corner to represent ZK / cryptographic reputation energy */}
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[var(--color-sage)]/10 blur-3xl pointer-events-none group-hover:bg-[var(--color-sage)]/20 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-sage)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              <CardContent className="p-8 space-y-6 relative">
                {/* Top Row: Title & Badge */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[var(--color-sage-light)] text-[var(--color-sage-text)] dark:bg-[var(--color-sage-light)]/20 dark:text-[var(--color-sage)] animate-pulse shadow-[0_0_8px_rgba(169,221,211,0.2)]">
                      <Fingerprint className="size-4" />
                    </div>
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground font-semibold">
                      ZK reputation pass
                    </span>
                  </div>
                  
                  {/* Sleek pill badge */}
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
                
                {/* Middle Row: Score Display */}
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
                
                {/* Bottom Row: Attestation Progress & Details */}
                <div className="space-y-3 pt-4 border-t border-border/30">
                  <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>Attestation Integrity</span>
                    <span className="text-foreground font-bold">{liveCredentials.filter(Boolean).length} / 5 Verified</span>
                  </div>
                  
                  {/* Sleek glowing progress bar */}
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

/* ── Individual Loan Card Component ───────────────────────────── */

function LoanPositionCard({ loanId, userAddress }: { loanId: bigint; userAddress: string }) {
  const poolRead = useRialoPoolRead(userAddress);
  const loanDetails = useRialoLoanDetails(loanId);
  const repayWrite = useRialoRepayWrite();

  const { success: showSuccess, error: showError, pending: showPending } = useToast();

  const [now, setNow] = useState<bigint>(0n);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(BigInt(Math.floor(Date.now() / 1000)));
  }, []);

  // Per-card transaction tracking — single-click auto-flow
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
        // Auto-trigger repayment immediately after approval
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

  const [refetchTrigger, setRefetchTrigger] = useState(0);

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

  // Helper: is this card currently waiting for its own tx to confirm?
  const isLocalApproving = localApproveHash !== undefined;
  const isLocalRepaying = localRepayHash !== undefined;

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
    return null; // Don't show settled loans
  }

  const isOverdue = now > 0n ? now > dueTime : false;

  // Simple progress tracking (time elapsed / total loan duration)
  const totalDuration = dueTime - startTime;
  const elapsed = now > 0n ? now - startTime : 0n;
  const progressPercent = totalDuration > 0n 
    ? Math.min(100, Math.round((Number(elapsed) / Number(totalDuration)) * 100))
    : 0;

  // Repayment USDC allowance verification — reactive to refetch
  const currentUsdcAllowance = (poolRead.usdcAllowance.data as bigint) || 0n;
  const needsApproval = repaymentRaw !== undefined && currentUsdcAllowance < repaymentRaw;

  const handleRepayLoan = async () => {
    try {
      setRepaymentError(undefined);
      // If approval is needed, trigger approval first
      if (needsApproval) {
        const buffer = parseUnits("10", 6);
        setLocalApproveHash(undefined);
        const hash = await repayWrite.approveUsdc(repaymentRaw! + buffer);
        setLocalApproveHash(hash);
        return;
      }
      // Approval already done, trigger repayment directly
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
      {/* Subtle top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-sage)]/20 to-transparent" />
      
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Principal & APR readout */}
          <div className="flex items-center gap-5">
            {/* Premium Dynamic Token Seal */}
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-sage-light)]/30 to-[var(--color-sage-light)]/10 border border-[var(--color-sage)]/20 flex flex-col items-center justify-center font-mono shrink-0 group-hover:scale-105 group-hover:border-[var(--color-sage)]/40 transition-all duration-500 shadow-sm">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-sage)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 text-[6px] uppercase tracking-[0.25em] text-[var(--color-sage-text)]/60 dark:text-[var(--color-sage)]/60 leading-none">ID</span>
              <span className="relative z-10 text-sm font-bold text-foreground leading-none">#{loanId.toString().slice(-4)}</span>
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
              
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-muted-foreground opacity-60">
                <span>Issued {timeAgo(startTime)}</span>
                <span>•</span>
                <span className="text-[var(--color-sage-text)] dark:text-[var(--color-sage)]">{(Number(interestRate) / 100).toFixed(2)}% APR</span>
                <span>•</span>
                <span>Collateral: {formatRLO(collateralLocked)} RLO</span>
              </div>
            </div>
          </div>

          {/* Time Repayment progress bar */}
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

          {/* Settle loan action button — single-click auto-flow */}
          <div className="shrink-0 flex flex-col items-end gap-1 self-end lg:self-center">
            {repaymentRaw !== undefined && (
              <>
                {/* Progress status text */}
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

                {/* Main action button */}
                <Button 
                  size="sm" 
                  onClick={handleRepayLoan} 
                  disabled={isLocalApproving || isLocalRepaying || repaymentConfirmed}
                  className={`relative overflow-hidden h-11 px-6 font-mono text-[9px] uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-xl flex items-center gap-2 cursor-pointer ${
                    repaymentConfirmed
                      ? "bg-emerald-600/90 text-white shadow-emerald-500/20"
                      : isLocalApproving || isLocalRepaying
                      ? "bg-muted/80 text-muted-foreground cursor-wait"
                      : repaymentError
                      ? "bg-red-600/90 text-white shadow-red-500/20"
                      : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-primary/20"
                  }`}
                >
                  {repaymentConfirmed ? (
                    <>
                      <ShieldCheck className="size-3.5" />
                      CONFIRMED
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
