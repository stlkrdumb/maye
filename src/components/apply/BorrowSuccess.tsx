/**
 * Borrow success component.
 * Displays confirmation message and transaction details after successful borrow.
 */

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BorrowSuccessProps {
  borrowAmount: number;
  pricingDetails: {
    collateralRlo: number;
    interestRate: number;
  };
  borrowHash?: string;
  isBorrowSuccess: boolean;
}

export function BorrowSuccess({
  borrowAmount,
  pricingDetails,
  borrowHash,
  isBorrowSuccess,
}: BorrowSuccessProps) {
  if (!isBorrowSuccess) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--color-sage)]/25" />
          <div className="absolute inset-0 rounded-full border-4 border-[var(--color-sage-dark)] border-t-transparent animate-spin" />
        </div>
        <h2 className="heading-3 text-2xl mb-4 text-foreground">Deploying Capital On-Chain...</h2>
        <p className="text-xs text-[var(--ink-muted)] max-w-sm mx-auto leading-relaxed">
          Securing your RLO collateral and deploying USDC funds on Base Sepolia. This takes approximately 3-5 seconds.
        </p>
        {borrowHash && (
          <p className="text-[9px] font-mono text-muted-foreground opacity-55 mt-4 break-all max-w-xs mx-auto">
            Tx: {borrowHash}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="w-20 h-20 rounded-full bg-[var(--color-sage-light)] flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(140,196,184,0.3)]">
        <Check className="size-8 text-[var(--color-sage-text)] stroke-[3]" />
      </div>
      <h1 className="heading-display mb-4">Capital Deployed.</h1>
      <p className="text-base text-[var(--ink-muted)] mb-10 max-w-sm mx-auto">
        Your under-collateralized loan of **${borrowAmount.toLocaleString()} USDC** is confirmed and processed on Base Sepolia.
      </p>

      <Card className="p-6 border-none bg-[var(--glass-bg)] mb-10 max-w-md mx-auto">
        <p className="text-[10px] text-[var(--ink-muted)] mb-2 font-mono uppercase tracking-widest">Attestation Details</p>
        <div className="space-y-3 font-mono text-[10px] text-left">
          <div className="flex justify-between">
            <span className="text-muted-foreground">COLLATERAL SECURED:</span>
            <span className="text-foreground">{pricingDetails.collateralRlo.toLocaleString()} RLO</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">REPAYMENT APR:</span>
            <span className="text-foreground">{pricingDetails.interestRate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TRANSACTION HASH:</span>
            <a
              href={`https://sepolia.basescan.org/tx/${borrowHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-sage-text)] hover:underline truncate max-w-[180px] block"
            >
              {borrowHash}
            </a>
          </div>
        </div>
      </Card>

      <Link href="/dashboard">
        <Button className="btn-primary max-w-sm w-full py-6">
          Enter Command Center Dashboard
        </Button>
      </Link>
    </>
  );
}
