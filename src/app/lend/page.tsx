"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { usePoolRead, usePoolWrite, usePoolWriteExtended } from "@/hooks/useContracts";
import { formatUSDC, bpsToPercent } from "@/types/contracts";
import { useToast } from "@/lib/providers/toast";
import { Coins, Activity, TrendingUp, Wallet, CheckCircle } from "lucide-react";

function formatPrettyUSDC(val: bigint | undefined): string {
  if (val === undefined) return "0";
  const num = Number(val) / 1e6;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function USDCLogo({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#3e73c4" d="M8 16c4.4183 0 8 -3.5817 8 -8 0 -4.41828 -3.5817 -8 -8 -8C3.58172 0 0 3.58172 0 8c0 4.4183 3.58172 8 8 8Z" strokeWidth={0.5}></path>
      <path fill="#ffffff" d="M10.01105 9.062c0 -1.062 -0.64 -1.426 -1.92 -1.578 -0.914 -0.1215 -1.0965 -0.364 -1.0965 -0.789 0 -0.425 0.305 -0.698 0.914 -0.698 0.5485 0 0.8535 0.182 1.0055 0.6375 0.0158 0.04405 0.04475 0.0822 0.08295 0.10925 0.03815 0.0271 0.0837 0.04185 0.13055 0.04225h0.4875c0.02815 0.00075 0.05615 -0.0042 0.08235 -0.0146 0.02615 -0.0104 0.04995 -0.02605 0.0699 -0.0459 0.01995 -0.01985 0.0357 -0.0436 0.0462 -0.0697 0.01055 -0.02615 0.01565 -0.05415 0.01505 -0.0823v-0.03c-0.0596 -0.32955 -0.22635 -0.6302 -0.47435 -0.85525 -0.248 -0.22505 -0.5634 -0.36185 -0.89715 -0.38925V4.571005c0 -0.1215 -0.0915 -0.2125 -0.2435 -0.243h-0.4575c-0.1215 0 -0.213 0.091 -0.2435 0.243V5.269c-0.9145 0.121 -1.493 0.728 -1.493 1.487 0 1.001 0.609 1.3955 1.889 1.5475 0.8535 0.1515 1.1275 0.334 1.1275 0.8195 0 0.485 -0.4265 0.819 -1.0055 0.819 -0.7925 0 -1.0665 -0.3335 -1.158 -0.789 -0.03 -0.121 -0.122 -0.182 -0.2135 -0.182h-0.518c-0.02815 -0.0007 -0.0561 0.00435 -0.0822 0.0148 -0.02615 0.0104 -0.04985 0.02605 -0.0698 0.0459 -0.0199 0.01985 -0.03555 0.04355 -0.04605 0.06965 -0.0105 0.0261 -0.0156 0.05405 -0.01495 0.08215v0.03c0.1215 0.759 0.6095 1.305 1.615 1.457v0.7285c0 0.121 0.0915 0.2125 0.2435 0.2425h0.4575c0.1215 0 0.213 -0.091 0.2435 -0.2425V10.67c0.9145 -0.1515 1.5235 -0.789 1.5235 -1.6085v0.0005Z" strokeWidth={0.5}></path>
      <path fill="#ffffff" d="M6.446 12.2485c-2.37698 -0.85 -3.59598 -3.49 -2.71198 -5.8265 0.457 -1.275 1.46248 -2.2455 2.71198 -2.701 0.122 -0.0605 0.1825 -0.1515 0.1825 -0.3035v-0.425c0 -0.121 -0.0605 -0.212 -0.1825 -0.2425 -0.0305 0 -0.0915 0 -0.122 0.03 -0.68575 0.21416 -1.3224 0.561865 -1.87327 1.023085 -0.550855 0.461225 -1.00503 1.026855 -1.336385 1.664315 -0.331355 0.6375 -0.53334 1.3342 -0.59432 2.05005 -0.06098 0.71585 0.020245 1.4367 0.238995 2.12105 0.548 1.7 1.8585 3.005 3.56498 3.551 0.122 0.0605 0.244 0 0.274 -0.1215 0.0305 -0.03 0.0305 -0.061 0.0305 -0.1215v-0.425c0 -0.091 -0.091 -0.212 -0.1825 -0.273Zm3.23 -9.468c-0.122 -0.061 -0.244 0 -0.274 0.121 -0.0305 0.0305 -0.0305 0.061 -0.0305 0.1215v0.425c0 0.1215 0.091 0.2425 0.1825 0.3035 2.377 0.85 3.596 3.49 2.712 5.8265 -0.457 1.275 -1.4625 2.2455 -2.712 2.701 -0.122 0.0605 -0.1825 0.1515 -0.1825 0.3035v0.425c0 0.121 0.0605 0.212 0.1825 0.2425 0.0305 0 0.0915 0 0.122 -0.03 0.6858 -0.21415 1.32245 -0.56185 1.8733 -1.0231 0.55085 -0.4612 1.00505 -1.02685 1.3364 -1.6643 0.33135 -0.6375 0.53335 -1.3342 0.5943 -2.05005 0.061 -0.71585 -0.02025 -1.4367 -0.239 -2.12105 -0.548 -1.73 -1.889 -3.035 -3.565 -3.581Z" strokeWidth={0.5}></path>
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

function StatBlock({ label, value, subvalue, loading }: { 
  label: string; 
  value: string | null; 
  subvalue?: string;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-2">{label}</span>
      {loading ? (
        <div className="h-8 w-24 bg-muted animate-pulse rounded" />
      ) : (
        <>
          <span className="heading-3 !text-2xl text-foreground">{value}</span>
          {subvalue && <span className="text-[10px] text-muted-foreground font-mono mt-1">{subvalue}</span>}
        </>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */

export default function LendPage() {
  const { address, isConnected } = useAccount();
  
  // Contracts
  const pool = usePoolRead(address);
  const supply = usePoolWrite(address);
  const manage = usePoolWriteExtended(address);

  // ── Toast Notifications loop ──
  const { success: showSuccess, error: showError, pending: showPending } = useToast();

  // Watch Supply/Deposit confirmations
  useEffect(() => {
    if (supply.approveHash) {
      if (supply.isApproved) {
        showSuccess("Approval Confirmed", "USDC authorized for supply deposits.", supply.approveHash);
      } else {
        showPending("Approving USDC", "Authorizing pool to supply USDC...", supply.approveHash);
      }
    }
  }, [supply.approveHash, supply.isApproved]);

  useEffect(() => {
    if (supply.depositHash) {
      if (supply.isDeposited) {
        showSuccess("Capital Supplied!", "USDC supplied. You are now earning dynamic APY yield.", supply.depositHash);
      } else {
        showPending("Supplying Capital", "Depositing USDC into vault on-chain...", supply.depositHash);
      }
    }
  }, [supply.depositHash, supply.isDeposited]);

  // Watch Withdrawal confirmations
  useEffect(() => {
    if (manage.withdrawHash) {
      if (manage.isWithdrawn) {
        showSuccess("Capital Withdrawn", "USDC capital successfully returned to wallet.", manage.withdrawHash);
      } else {
        showPending("Withdrawing Capital", "Recalling USDC supply deposits on-chain...", manage.withdrawHash);
      }
    }
  }, [manage.withdrawHash, manage.isWithdrawn]);

  // UI State
  const [amount, setAmount] = useState("");
  const [activeTab, setActiveTab] = useState("deposit");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data Extraction
  const totalDeposits = pool.totalDeposits.data as bigint | undefined;
  const totalBorrows = pool.totalBorrows.data as bigint | undefined;
  const userDeposit = pool.userDeposit.data as bigint | undefined;
  const configRaw = pool.config.data as readonly [bigint, bigint, bigint, bigint, bigint, bigint] | undefined;
  const usdcBalRaw = pool.usdcBalance.data;

  // Derived Values
  const usdcDisplay = usdcBalRaw ? formatPrettyUSDC(usdcBalRaw.value) : "0";
  const userDepositDisplay = userDeposit ? formatPrettyUSDC(userDeposit) : "0";
  const apy = configRaw ? bpsToPercent(configRaw[2]) : "—";
  const utilization = useMemo(() => {
    if (!totalDeposits || totalDeposits === 0n) return 0;
    return Math.min(100, Math.round((Number(totalBorrows || 0n) / Number(totalDeposits)) * 100));
  }, [totalDeposits, totalBorrows]);

  const estimatedYieldYearly = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (configRaw) {
      const aprNum = Number(configRaw[2]) / 10000; // e.g. 0.125
      return (amt * aprNum).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return "0.00";
  }, [amount, configRaw]);

  const currentPercent = useMemo(() => {
    if (!totalDeposits || totalDeposits === 0n) return 0;
    return (Number(userDeposit || 0n) / Number(totalDeposits)) * 100;
  }, [userDeposit, totalDeposits]);

  const projectedPercent = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0 || activeTab !== "deposit") return currentPercent;
    const inputAmountBig = parseUnits(amount, 6);
    const projectedTotal = (totalDeposits || 0n) + inputAmountBig;
    return (Number((userDeposit || 0n) + inputAmountBig) / Number(projectedTotal)) * 100;
  }, [amount, activeTab, userDeposit, totalDeposits, currentPercent]);

  const projectedShare = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0 || activeTab !== "deposit") {
      return totalDeposits && totalDeposits > 0n 
        ? ((Number(userDeposit || 0n) / Number(totalDeposits)) * 100).toFixed(4) 
        : "0.0000";
    }
    const inputAmountBig = parseUnits(amount, 6);
    const projectedTotal = (totalDeposits || 0n) + inputAmountBig;
    return ((Number((userDeposit || 0n) + inputAmountBig) / Number(projectedTotal)) * 100).toFixed(4);
  }, [amount, activeTab, userDeposit, totalDeposits]);

  const poolStatsLoaded = totalDeposits !== undefined && configRaw !== undefined;

  /* ── Handlers ────────────────────────────────────────────────── */

  const handleDeposit = async () => {
    if (!amount || isProcessing) return;
    setError(null);
    setIsProcessing(true);
    try {
      const units = parseUnits(amount, 6);
      if (!supply.isApproved) {
        await supply.approve(units);
      } else {
        await supply.deposit(units);
        setAmount("");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || isProcessing) return;
    setError(null);
    setIsProcessing(true);
    try {
      const units = parseUnits(amount, 6);
      await manage.withdraw(units);
      setAmount("");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Withdrawal failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const setMax = () => {
    if (activeTab === "deposit") {
      if (usdcBalRaw) {
        setAmount((Number(usdcBalRaw.value) / 1e6).toString());
      }
    } else {
      if (userDeposit) {
        setAmount((Number(userDeposit) / 1e6).toString());
      }
    }
  };

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 md:px-8">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full opacity-5"
          style={{ 
            background: 'radial-gradient(circle, var(--color-sage-dark) 0%, transparent 70%)',
            filter: 'blur(120px)' 
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 fade-up">
          <div className="max-w-xl">
            <Badge variant="outline" className="mb-4 py-1 px-3 border-[var(--color-sage)]/30 text-[var(--color-sage-text)] bg-[var(--color-sage-light)]/5 border-dashed">
              Institutional Grade Yield
            </Badge>
            <div className="flex items-center gap-3">
              <h1 className="heading-2 !text-[clamp(1.5rem,3vw,2.25rem)] leading-none tracking-tighter text-[var(--ink)]">
                Supply capital. Earn <span className="italic font-normal opacity-90" style={{ fontFamily: 'Newsreader, serif' }}>real yield.</span>
              </h1>
              <div className="group relative shrink-0">
                <div className="cursor-help size-5 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--ink-muted)] opacity-40 hover:opacity-100 hover:border-[var(--color-sage-dark)] transition-all duration-300">
                  <span className="text-[10px] font-mono font-bold">?</span>
                </div>
                
                {/* Tooltip box */}
                <div className="absolute left-0 top-full mt-4 w-64 p-4 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] translate-y-2 group-hover:translate-y-0">
                  <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                    Lenders fuel the Maye ecosystem. Your assets power high-confidence 
                    borrowers vetted by our AI-agent — recycling interest directly 
                    to your liquidity position.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 fade-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-start justify-between p-6 rounded-xl bg-[var(--glass-bg)] border border-border/40 shadow-sm hover:border-primary/10 hover:shadow-md transition-all duration-300 group">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-2">Total Pool Size</span>
              {poolStatsLoaded ? (
                <span className="heading-3 !text-2xl text-foreground font-mono">{totalDeposits ? `$${formatPrettyUSDC(totalDeposits)}` : "$0"}</span>
              ) : (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              )}
              <span className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60">Supplied Assets</span>
            </div>
            <div className="p-1 rounded-full border border-border/10 bg-background/50 backdrop-blur-sm shadow-sm group-hover:scale-105 transition-all duration-500 shrink-0">
              <USDCLogo />
            </div>
          </div>

          <div className="flex items-start justify-between p-6 rounded-xl bg-[var(--glass-bg)] border border-border/40 shadow-sm hover:border-primary/10 hover:shadow-md transition-all duration-300 group">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-2">Current APY</span>
              {poolStatsLoaded ? (
                <span className="heading-3 !text-2xl text-foreground font-mono">{apy}</span>
              ) : (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              )}
              <span className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60">Variable Rate</span>
            </div>
            <div className="p-1 rounded-full border border-border/10 bg-background/50 backdrop-blur-sm shadow-sm group-hover:scale-105 transition-all duration-500 shrink-0">
              <Activity className="size-6 text-[var(--color-sage-text)] dark:text-[var(--color-sage)]" />
            </div>
          </div>

          <div className="flex items-start justify-between p-6 rounded-xl bg-[var(--glass-bg)] border border-border/40 shadow-sm hover:border-primary/10 hover:shadow-md transition-all duration-300 group">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-2">Pool Utilization</span>
              {poolStatsLoaded ? (
                <span className="heading-3 !text-2xl text-foreground font-mono">{utilization}%</span>
              ) : (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              )}
              <span className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60">Active Capital Ratio</span>
            </div>
            <div className="p-1 rounded-full border border-border/10 bg-background/50 backdrop-blur-sm shadow-sm group-hover:scale-105 transition-all duration-500 shrink-0">
              <TrendingUp className="size-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch fade-up" style={{ animationDelay: '100ms' }}>
          {/* Left Column: Transaction Card */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <Card className="border border-border/40 shadow-lg bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/80 backdrop-blur-md overflow-hidden rounded-2xl flex flex-col h-full justify-between">
              <div>
                {/* Embedded Tabs Switcher */}
                <div className="flex border-b border-border/40 bg-muted/20">
                  {["deposit", "withdraw"].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setActiveTab(t);
                        setAmount("");
                      }}
                      className={`flex-1 py-4 font-mono text-[10px] tracking-[0.2em] uppercase transition-all duration-300 border-b-2 ${
                        activeTab === t
                          ? "border-foreground text-foreground font-bold bg-muted/40"
                          : "border-transparent text-muted-foreground opacity-40 hover:opacity-100 hover:bg-muted/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="p-8 space-y-6">
                  {/* Balance / Cap Indicator */}
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-40">
                      {activeTab === "deposit" ? "Available Assets" : "Supplied Assets"}
                    </span>
                    <button 
                      onClick={setMax}
                      className="flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-widest text-foreground hover:text-[var(--color-sage-dark)] transition-all duration-300"
                    >
                      <span className="opacity-60 font-semibold">{activeTab === "deposit" ? `${usdcDisplay} USDC` : `$${userDepositDisplay}`}</span>
                      <Badge variant="outline" className="text-[8px] py-0.5 px-1.5 border-border bg-muted/40 hover:bg-muted/80">MAX</Badge>
                    </button>
                  </div>

                  {/* Amount Input Area */}
                  <div className="relative py-10 flex flex-col items-center justify-center border-y border-border/30 bg-muted/5 dark:bg-white/[0.01] rounded-lg">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        if (/^\d*\.?\d*$/.test(raw)) {
                          setAmount(raw);
                        }
                      }}
                      className="w-full text-center text-7xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 tracking-tighter placeholder:text-muted-foreground/10 appearance-none text-foreground selection:bg-accent"
                      autoFocus
                    />
                    
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <div className="px-2.5 py-1 bg-primary text-primary-foreground rounded-full text-[9px] font-mono font-black tracking-[0.2em] uppercase shadow-md flex items-center gap-1.5 border border-border/20">
                        <USDCLogo className="size-3" /> USDC
                      </div>
                      <span className="text-xs text-muted-foreground opacity-60 font-mono tracking-tight">
                        ≈ ${(Number(amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Yield Preview */}
                  {amount && parseFloat(amount) > 0 && activeTab === "deposit" && (
                    <div className="px-4 py-3 rounded-xl bg-[var(--color-sage-light)]/20 border border-[var(--color-sage)]/25 text-xs text-[var(--color-sage-text)] dark:text-[var(--color-sage)] flex items-center justify-between gap-3 animate-pulse duration-1000 transition-all duration-300">
                      <div className="flex items-center gap-2 font-semibold">
                        <Activity className="size-3.5" />
                        <span>Projected Annual Yield</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{estimatedYieldYearly} USDC / yr</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 pt-0 space-y-4">
                {/* Action button */}
                <div>
                  {!isConnected ? (
                    <Button className="w-full h-16 btn-primary !rounded-xl text-[10px] uppercase tracking-[0.2em] opacity-50" disabled>Connect Wallet</Button>
                  ) : activeTab === "deposit" ? (
                    <Button 
                      onClick={handleDeposit} 
                      disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                      variant="default"
                      className="w-full h-16 !rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 active:scale-[0.98] cursor-pointer"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-3">
                          <div className="size-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                          <span>Processing Supply</span>
                        </div>
                      ) : supply.isApproved ? "Confirm Supply" : "Approve & Supply"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleWithdraw} 
                      disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > Number(userDeposit || 0n) / 1e6}
                      variant="outline"
                      className="w-full h-16 !rounded-xl text-[10px] uppercase tracking-[0.2em] border-border hover:bg-muted transition-all duration-300 active:scale-[0.98] text-foreground cursor-pointer"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-3">
                          <div className="size-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                          <span>Processing Withdrawal</span>
                        </div>
                      ) : "Execute Withdrawal"}
                    </Button>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 rounded-xl">
                    <AlertDescription className="text-[10px] font-mono uppercase tracking-widest text-center text-destructive">{error}</AlertDescription>
                  </Alert>
                )}

                {(supply.isDeposited || manage.isWithdrawn) && (
                  <Alert className="bg-accent/20 border-accent/20 rounded-xl">
                    <AlertTitle className="text-accent-foreground text-[10px] font-mono uppercase tracking-[0.2em] text-center">Protocol Receipt</AlertTitle>
                    <AlertDescription className="text-[9px] mt-2 font-mono opacity-50 break-all leading-tight text-center">
                      {supply.depositHash || manage.withdrawHash}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: User Position & Health */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <Card className="border border-border/40 shadow-lg bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/80 backdrop-blur-md p-8 rounded-2xl flex flex-col justify-between h-full">
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
                    <Progress value={utilization} className="h-1.5 bg-muted dark:bg-muted/30 [&>div]:bg-amber-500" />
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
            </Card>
          </div>
        </div>

        {/* Bottom Section: Features/Trust */}
        <div className="mt-24 grid sm:grid-cols-3 gap-12 border-t border-border pt-16 fade-up" style={{ animationDelay: '200ms' }}>
          {[
            { 
              title: "On-Chain Settlements", 
              desc: "Every yield payment is settled instantly on Base Sepolia, verifiable by anyone." 
            },
            { 
              title: "Variable APY", 
              desc: "Rates adjust dynamically based on pool utilization and borrower risk profiles." 
            },
            { 
              title: "Zero Collateral", 
              desc: "Maye is built for consumer credit, relying on AI-vetted financial DNA." 
            }
          ].map((item, i) => (
            <div key={i}>
              <h5 className="font-semibold text-sm mb-2 text-foreground">{item.title}</h5>
              <p className="text-xs text-muted-foreground leading-relaxed opacity-70">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
