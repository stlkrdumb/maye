/**
 * Loan terms configuration component.
 * Displays slider inputs for loan amount and duration with real-time pricing.
 */

import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoanTermsProps {
  borrowAmount: number;
  setBorrowAmount: (amount: number) => void;
  loanDurationDays: number;
  setLoanDurationDays: (days: number) => void;
  pricingDetails: {
    collateralRatio: number;
    interestRate: number;
    capitalFreedUsd: number;
    collateralRlo: number;
  };
  rloBalanceDisplay: string;
  requiredRloRaw: bigint;
  poolRead: {
    rloBalance: {
      data?: bigint;
      refetch: () => void;
    };
  };
  faucets: {
    isMintingRlo: boolean;
    requestRloFaucet: () => void;
  };
}

export function LoanTerms({
  borrowAmount,
  setBorrowAmount,
  loanDurationDays,
  setLoanDurationDays,
  pricingDetails,
  rloBalanceDisplay,
  requiredRloRaw,
  poolRead,
  faucets,
}: LoanTermsProps) {
  const hasSufficientCollateral = poolRead.rloBalance.data !== undefined && (poolRead.rloBalance.data as bigint) >= requiredRloRaw;

  return (
    <>
      {/* Parameters Read-out */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none bg-[var(--glass-bg)] p-5">
          <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-1">Required LTV Ratio</p>
          <div className="flex items-baseline gap-2">
            <span className="heading-3 text-foreground">{pricingDetails.collateralRatio}%</span>
            {pricingDetails.collateralRatio < 150 && (
              <span className="text-[10px] font-mono text-[var(--color-sage-text)]">
                (-{150 - pricingDetails.collateralRatio}%)
              </span>
            )}
          </div>
        </Card>

        <Card className="border-none bg-[var(--glass-bg)] p-5">
          <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-1">Active Borrow APR</p>
          <div className="flex items-baseline gap-2">
            <span className="heading-3 text-foreground">{pricingDetails.interestRate}%</span>
            {pricingDetails.interestRate < 12.5 && (
              <span className="text-[10px] font-mono text-[var(--color-sage-text)]">
                (-{(12.5 - pricingDetails.interestRate).toFixed(1)}%)
              </span>
            )}
          </div>
        </Card>

        <Card className="border-none bg-[var(--color-sage-light)] p-5">
          <p className="text-[10px] font-mono tracking-widest text-[var(--color-sage-text)]/70 uppercase mb-1">Capital Saved</p>
          <span className="heading-3 text-[var(--color-sage-text)] font-bold">
            ${pricingDetails.capitalFreedUsd.toLocaleString()}
          </span>
        </Card>
      </div>

      {/* Inputs Section */}
      <Card className="border-none bg-[var(--glass-bg)] p-6 mb-8 space-y-8">
        {/* Slider 1: Loan Amount */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">USDC Borrow Amount</Label>
            <span className="font-mono font-bold text-foreground text-lg">${borrowAmount.toLocaleString()} USDC</span>
          </div>
          <input
            type="range"
            min="10000"
            max="1000000"
            step="5000"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(Number(e.target.value))}
            className="w-full accent-[var(--color-sage-dark)] h-1 bg-[var(--bone)] rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground opacity-50">
            <span>MIN: $10,000</span>
            <span>MAX: $1,000,000</span>
          </div>
        </div>

        {/* Slider 2: Duration */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Loan Duration Term</Label>
            <span className="font-mono font-bold text-foreground text-lg">{loanDurationDays} Days</span>
          </div>
          <input
            type="range"
            min="7"
            max="365"
            step="1"
            value={loanDurationDays}
            onChange={(e) => setLoanDurationDays(Number(e.target.value))}
            className="w-full accent-[var(--color-sage-dark)] h-1 bg-[var(--bone)] rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground opacity-50">
            <span>MIN: 7 DAYS</span>
            <span>MAX: 365 DAYS</span>
          </div>
        </div>
      </Card>

      {/* RLO Balance & Faucet Notification */}
      <Card className="border-none bg-[var(--glass-bg)] p-6 mb-10">
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">RLO Collateral Status</h4>
        
        <div className="grid grid-cols-2 gap-4 items-center mb-6">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground opacity-50">Required Collateral</p>
            <p className="font-mono text-sm font-semibold text-foreground">{pricingDetails.collateralRlo.toLocaleString()} RLO</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground opacity-50">Your RLO Balance</p>
            <p className="font-mono text-sm font-semibold text-foreground">{rloBalanceDisplay} RLO</p>
          </div>
        </div>

        {!hasSufficientCollateral ? (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2.5 items-start sm:items-center text-amber-600">
              <AlertCircle className="size-4 shrink-0 mt-0.5 sm:mt-0" />
              <span className="text-xs font-semibold">Insufficient RLO collateral to lock for this loan size.</span>
            </div>
            <Button
              size="sm"
              disabled={faucets.isMintingRlo}
              onClick={() => faucets.requestRloFaucet()}
              className="h-8 px-4 font-mono text-[9px] uppercase tracking-widest bg-amber-600 hover:bg-amber-700 text-white shadow-sm shrink-0"
            >
              {faucets.isMintingRlo ? "Minting..." : "Claim 200k RLO Faucet"}
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[var(--color-sage-light)]/20 border border-[var(--color-sage)]/20 text-[var(--color-sage-text)] flex items-center gap-2">
            <Check className="size-4 shrink-0" />
            <span className="text-xs font-semibold">Collateral threshold satisfied. Ready to proceed.</span>
          </div>
        )}
      </Card>
    </>
  );
}
