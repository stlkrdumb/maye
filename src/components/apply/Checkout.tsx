/**
 * Checkout confirmation component for the borrow flow.
 * Displays transaction approval and execution cards.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface CheckoutProps {
  borrowAmount: number;
  loanDurationDays: number;
  pricingDetails: {
    collateralRatio: number;
    collateralRlo: number;
    interestRate: number;
  };
  isRloApproved: boolean;
  borrowWrite: {
    isApproving: boolean;
    isBorrowing: boolean;
    borrowError?: unknown;
    borrowHash?: string;
    isBorrowSuccess?: boolean;
  };
  faucets: {
    isMintingUsdc: boolean;
    requestUsdcFaucet: () => void;
  };
  onApprove: () => void;
  onBorrow: () => void;
  onBack: () => void;
}

export function Checkout({
  borrowAmount,
  loanDurationDays,
  pricingDetails,
  isRloApproved,
  borrowWrite,
  faucets,
  onApprove,
  onBorrow,
  onBack,
}: CheckoutProps) {
  return (
    <>
      {/* Position Summary Card */}
      <Card className="border-none bg-[var(--glass-bg)] mb-8 overflow-hidden">
        <div className="p-6 bg-muted/40 border-b border-border flex justify-between items-baseline">
          <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Borrowing Principal</span>
          <span className="heading-3 text-foreground">${borrowAmount.toLocaleString()} USDC</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-baseline text-xs font-mono">
            <span className="text-muted-foreground uppercase">Collateral Ratio</span>
            <span className="font-semibold text-foreground">{pricingDetails.collateralRatio}%</span>
          </div>
          <div className="flex justify-between items-baseline text-xs font-mono">
            <span className="text-muted-foreground uppercase">Locked Collateral</span>
            <span className="font-semibold text-foreground">{pricingDetails.collateralRlo.toLocaleString()} RLO</span>
          </div>
          <div className="flex justify-between items-baseline text-xs font-mono">
            <span className="text-muted-foreground uppercase">Borrowing APR</span>
            <span className="font-semibold text-foreground">{pricingDetails.interestRate}% APR</span>
          </div>
          <div className="flex justify-between items-baseline text-xs font-mono">
            <span className="text-muted-foreground uppercase">Loan Duration Term</span>
            <span className="font-semibold text-foreground">{loanDurationDays} Days</span>
          </div>
        </div>
      </Card>

      {/* Faucet Box in case they run out of ETH gas */}
      <div className="p-4 bg-muted border border-border rounded-lg mb-8 flex justify-between items-center text-xs font-mono">
        <span className="text-muted-foreground">Gas/Liquidity faucet:</span>
        <div className="flex gap-2">
          <Button size="sm" onClick={faucets.requestUsdcFaucet} disabled={faucets.isMintingUsdc} variant="outline" className="h-7 text-[8px] uppercase tracking-widest">
            {faucets.isMintingUsdc ? "Minting..." : "Mint USDC"}
          </Button>
        </div>
      </div>

      {/* Checkout Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Tx 1: Approve */}
        <Card className={`p-6 border transition-all duration-300 flex flex-col justify-between ${
          isRloApproved 
            ? "border-[var(--color-sage)]/40 bg-[var(--color-sage-light)]/5"
            : "border-border bg-[var(--glass-bg)]"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider">Transaction 01</Badge>
              {isRloApproved && (
                <span className="text-[9px] font-mono text-[var(--color-sage-text)] font-bold">APPROVED ✓</span>
              )}
            </div>
            <h4 className="text-sm font-bold text-foreground mb-2">Approve RLO Collateral</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Approve the RialoLendingPool smart contract to secure and lock {pricingDetails.collateralRlo.toLocaleString()} RLO collateral from your wallet.
            </p>
          </div>
          <Button
            disabled={isRloApproved || borrowWrite.isApproving}
            onClick={onApprove}
            className={`w-full font-mono text-[10px] uppercase tracking-widest h-11 ${
              isRloApproved
                ? "bg-[var(--color-sage-light)] text-[var(--color-sage-text)] border border-[var(--color-sage)]/30 hover:bg-[var(--color-sage-light)]"
                : "bg-[var(--color-sage-dark)] hover:bg-[var(--color-sage-text)] text-white"
            }`}
          >
            {borrowWrite.isApproving ? "Confirming..." : isRloApproved ? "Approved" : "Approve RLO"}
          </Button>
        </Card>

        {/* Tx 2: Borrow */}
        <Card className={`p-6 border transition-all duration-300 flex flex-col justify-between ${
          !isRloApproved
            ? "opacity-50 pointer-events-none border-border bg-[var(--glass-bg)]"
            : "border-border bg-[var(--glass-bg)]"
        }`}>
          <div>
            <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider mb-4">Transaction 02</Badge>
            <h4 className="text-sm font-bold text-foreground mb-2">Execute Borrow Request</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Sign standard on-chain call to deposit RLO collateral into the pool and receive {borrowAmount.toLocaleString()} USDC directly in your address.
            </p>
          </div>
          <Button
            disabled={!isRloApproved || borrowWrite.isBorrowing}
            onClick={onBorrow}
            className="w-full font-mono text-[10px] uppercase tracking-widest h-11 bg-primary text-primary-foreground"
          >
            {borrowWrite.isBorrowing ? "Borrowing..." : "Confirm & Borrow"}
          </Button>
        </Card>
      </div>

      {/* Error notifications */}
      {borrowWrite.borrowError && (
        <Alert variant="destructive" className="mb-8">
          <AlertTitle>Transaction Failed</AlertTitle>
          <AlertDescription>{String(borrowWrite.borrowError)}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-start">
        <Button onClick={onBack} variant="outline" disabled={borrowWrite.isBorrowing || borrowWrite.isApproving} className="px-6">← Edit Terms</Button>
      </div>
    </>
  );
}
