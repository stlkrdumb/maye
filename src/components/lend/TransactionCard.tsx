/**
 * Transaction card component for deposit/withdraw operations.
 * Handles amount input, yield preview, and action buttons.
 */

import { useState, useEffect, useCallback } from "react";
import { USDCLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, CheckCircle } from "lucide-react";

interface TransactionCardProps {
  activeTab: "deposit" | "withdraw";
  setActiveTab: (tab: "deposit" | "withdraw") => void;
  amount: string;
  setAmount: (amount: string) => void;
  usdcDisplay: string;
  userDepositDisplay: string;
  userDeposit?: bigint;
  estimatedYieldYearly: string;
  isConnected: boolean;
  isProcessing: boolean;
  supply: {
    isApproved: boolean;
    isDeposited: boolean;
    depositHash?: string;
  };
  manage: {
    isWithdrawn: boolean;
    withdrawHash?: string;
  };
  error: string | null;
  onDeposit: () => void;
  onWithdraw: () => void;
  setMax: () => void;
}

/** Formats a numeric string with thousand separators, preserving decimals. */
function formatWithCommas(raw: string): string {
  if (!raw || raw === "0") return "0";
  const parts = raw.split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
}

export function TransactionCard({
  activeTab,
  setActiveTab,
  amount,
  setAmount,
  usdcDisplay,
  userDepositDisplay,
  userDeposit,
  estimatedYieldYearly,
  isConnected,
  isProcessing,
  supply,
  manage,
  error,
  onDeposit,
  onWithdraw,
  setMax,
}: TransactionCardProps) {
  const [inputValue, setInputValue] = useState(formatWithCommas(amount));

  // Sync input value whenever the amount prop changes (e.g. from MAX button)
  useEffect(() => {
    setInputValue(formatWithCommas(amount));
  }, [amount]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, "");
      // Only allow digits and at most one decimal point
      if (/^\d*\.?\d*$/.test(raw)) {
        setAmount(raw);
      }
    },
    [setAmount],
  );

  const handleMaxClick = useCallback(() => {
    setMax();
  }, [setMax]);

  const handleTabChange = useCallback(
    (tab: "deposit" | "withdraw") => {
      setActiveTab(tab);
      setAmount("");
    },
    [setActiveTab, setAmount],
  );

  return (
    <div className="lg:col-span-7 flex flex-col h-full">
      <div className="border border-border/40 shadow-lg bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/80 backdrop-blur-md overflow-hidden rounded-2xl flex flex-col h-full justify-between">
        <div>
          {/* Embedded Tabs Switcher */}
          <div className="flex border-b border-border/40 bg-muted/20">
            {["deposit", "withdraw"].map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t as "deposit" | "withdraw")}
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
                onClick={handleMaxClick}
                className="flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-widest text-foreground hover:text-[var(--color-sage-dark)] transition-all duration-300"
              >
                <span className="opacity-60 font-semibold">
                  {activeTab === "deposit" ? `${usdcDisplay} USDC` : `$${userDepositDisplay}`}
                </span>
                <Badge variant="outline" className="text-[8px] py-0.5 px-1.5 border-border bg-muted/40 hover:bg-muted/80">
                  MAX
                </Badge>
              </button>
            </div>

            {/* Amount Input Area */}
            <div className="relative py-10 flex flex-col items-center justify-center border-y border-border/30 bg-muted/5 dark:bg-white/[0.01] rounded-lg">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full text-center text-7xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 tracking-tighter placeholder:text-muted-foreground/10 appearance-none text-foreground selection:bg-accent"
                autoFocus
              />

              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="px-2.5 py-1 bg-primary text-primary-foreground rounded-full text-[9px] font-mono font-black tracking-[0.2em] uppercase shadow-md flex items-center gap-1.5 border border-border/20">
                  <USDCLogo className="size-3" /> USDC
                </div>
                <span className="text-xs text-muted-foreground opacity-60 font-mono tracking-tight">
                  ≈ ${parseFloat(amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{estimatedYieldYearly} USDC / yr
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 pt-0 space-y-4">
          {/* Action button */}
          <div>
            {!isConnected ? (
              <Button className="w-full h-16 btn-primary !rounded-xl text-[10px] uppercase tracking-[0.2em] opacity-50" disabled>
                Connect Wallet
              </Button>
            ) : activeTab === "deposit" ? (
              <Button
                onClick={onDeposit}
                disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                variant="default"
                className="w-full h-16 !rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 active:scale-[0.98] cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <div className="size-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Processing Supply</span>
                  </div>
                ) : supply.isApproved ? (
                  "Confirm Supply"
                ) : (
                  "Approve & Supply"
                )}
              </Button>
            ) : (
              <Button
                onClick={onWithdraw}
                disabled={
                  isProcessing ||
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) > Number(userDeposit || 0n) / 1e6
                }
                variant="outline"
                className="w-full h-16 !rounded-xl text-[10px] uppercase tracking-[0.2em] border-border hover:bg-muted transition-all duration-300 active:scale-[0.98] text-foreground cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <div className="size-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                    <span>Processing Withdrawal</span>
                  </div>
                ) : (
                  "Execute Withdrawal"
                )}
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 rounded-xl">
              <AlertDescription className="text-[10px] font-mono uppercase tracking-widest text-center text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {(supply.isDeposited || manage.isWithdrawn) && (
            <Alert className="bg-accent/20 border-accent/20 rounded-xl">
              <AlertTitle className="text-accent-foreground text-[10px] font-mono uppercase tracking-[0.2em] text-center">
                Protocol Receipt
              </AlertTitle>
              <AlertDescription className="text-[9px] mt-2 font-mono opacity-50 break-all leading-tight text-center">
                {supply.depositHash || manage.withdrawHash}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
