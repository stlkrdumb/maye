"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { Badge } from "@/components/ui/badge";
import { usePoolRead, usePoolWrite, usePoolWriteExtended } from "@/hooks/useContracts";
import { formatUSDC, bpsToPercent } from "@/types/contracts";
import { useToast } from "@/lib/providers/toast";
import { StatBlock, TransactionCard, PositionCard } from "@/components/lend";
import { Coins, Activity, TrendingUp, Wallet, CheckCircle } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data Extraction
  const totalDeposits = pool.totalDeposits.data as bigint | undefined;
  const totalBorrows = pool.totalBorrows.data as bigint | undefined;
  const userDeposit = pool.userDeposit.data as bigint | undefined;
  const configRaw = pool.config.data as readonly [bigint, bigint, bigint, bigint, bigint, bigint] | undefined;
  const usdcBalRaw = pool.usdcBalance.data;

  // Derived Values
  const usdcDisplay = usdcBalRaw ? formatPrettyUSDC(usdcBalRaw as bigint) : "0";
  const userDepositDisplay = userDeposit ? formatPrettyUSDC(userDeposit) : "0";
  const apy = configRaw ? bpsToPercent(configRaw[2]) : "—";
  const utilization = useMemo(() => {
    if (!totalDeposits || totalDeposits === 0n) return 0;
    return Math.min(100, Math.round((Number(totalBorrows || 0n) / Number(totalDeposits)) * 100));
  }, [totalDeposits, totalBorrows]);

  const estimatedYieldYearly = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (configRaw) {
      const aprNum = Number(configRaw[2]) / 10000;
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
        setAmount((Number(usdcBalRaw as bigint) / 1e6).toString());
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
          <StatBlock
            label="Total Pool Size"
            value={totalDeposits ? `$${formatPrettyUSDC(totalDeposits)}` : "$0"}
            icon="usdc"
            subvalue="Supplied Assets"
            loading={!poolStatsLoaded}
          />
          <StatBlock
            label="Current APY"
            value={apy}
            icon="activity"
            subvalue="Variable Rate"
            loading={!poolStatsLoaded}
          />
          <StatBlock
            label="Pool Utilization"
            value={`${utilization}%`}
            icon="trending"
            subvalue="Active Capital Ratio"
            loading={!poolStatsLoaded}
          />
        </div>

        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch fade-up" style={{ animationDelay: '100ms' }}>
          <TransactionCard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            amount={amount}
            setAmount={setAmount}
            usdcDisplay={usdcDisplay}
            userDepositDisplay={userDepositDisplay}
            estimatedYieldYearly={estimatedYieldYearly}
            isConnected={isConnected}
            isProcessing={isProcessing}
            supply={supply}
            manage={manage}
            error={error}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            setMax={setMax}
          />

          <PositionCard
            userDepositDisplay={userDepositDisplay}
            totalDeposits={totalDeposits}
            userDeposit={userDeposit}
            amount={amount}
            activeTab={activeTab}
            currentPercent={currentPercent}
            projectedPercent={projectedPercent}
            projectedShare={projectedShare}
            utilization={utilization}
          />
        </div>

        {/* Bottom Section: Features/Trust */}
        <div className="mt-24 grid sm:grid-cols-3 gap-12 border-t border-border pt-16 fade-up" style={{ animationDelay: '200ms' }}>
          {[
            { title: "On-Chain Settlements", desc: "Every yield payment is settled instantly on Base Sepolia, verifiable by anyone." },
            { title: "Variable APY", desc: "Rates adjust dynamically based on pool utilization and borrower risk profiles." },
            { title: "Zero Collateral", desc: "Maye is built for consumer credit, relying on AI-vetted financial DNA." }
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

function formatPrettyUSDC(val: bigint | undefined): string {
  if (val === undefined) return "0";
  const num = Number(val) / 1e6;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
