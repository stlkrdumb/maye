"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/lib/providers/toast";
import { useRialoPoolRead, useRialoBorrowWrite, useCredentialVerifierWrite, useRialoFaucets } from "@/hooks/useContracts";
import { computeCollateralDetails } from "@/lib/pricing";
import { CREDENTIAL_ITEMS } from "@/lib/constants";
import {
  StepIndicator,
  CredentialCard,
  LoanTerms,
  Checkout,
  BorrowSuccess,
} from "@/components/apply";
import { Shield, Fingerprint } from "lucide-react";

export default function ApplyPage() {
  const { address, isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(0);
  const { success: showSuccess, error: showError, pending: showPending } = useToast();

  // Live contract reads
  const poolRead = useRialoPoolRead(address);
  const liveCredentials = useMemo(() => {
    return poolRead.credentials.data
      ? [...poolRead.credentials.data]
      : [false, false, false, false, false];
  }, [poolRead.credentials.data]);

  const numVerified = useMemo(() => liveCredentials.filter(Boolean).length, [liveCredentials]);
  const allVerified = numVerified === 5;

  // Borrow execution logic
  const verifierWrite = useCredentialVerifierWrite();
  const borrowWrite = useRialoBorrowWrite();
  const faucets = useRialoFaucets();

  // Form state
  const [borrowAmount, setBorrowAmount] = useState(60000);
  const [loanDurationDays, setLoanDurationDays] = useState(90);
  const [attestingId, setAttestingId] = useState<number | null>(null);

  // Toast notifications
  useEffect(() => {
    if (verifierWrite.txHash) {
      if (verifierWrite.isConfirmed) {
        showSuccess("Attestation Confirmed!", "Your credential is secure on-chain.", verifierWrite.txHash);
      } else {
        showPending("Securing Attestation", "Registering secure enclave signature...", verifierWrite.txHash);
      }
    }
  }, [verifierWrite.txHash, verifierWrite.isConfirmed]);

  useEffect(() => {
    if (borrowWrite.approveHash) {
      if (borrowWrite.isApproveSuccess) {
        showSuccess("Approval Confirmed", "RLO collateral authorized for deposit.", borrowWrite.approveHash);
      } else {
        showPending("RLO Approval", "Approving collateral transfer in your wallet...", borrowWrite.approveHash);
      }
    }
  }, [borrowWrite.approveHash, borrowWrite.isApproveSuccess]);

  useEffect(() => {
    if (borrowWrite.borrowHash) {
      if (borrowWrite.isBorrowSuccess) {
        showSuccess("Borrow Successful!", "USDC has been deposited in your wallet.", borrowWrite.borrowHash);
      } else {
        showPending("Borrowing USDC", "Locking RLO collateral and issuing USDC...", borrowWrite.borrowHash);
      }
    }
  }, [borrowWrite.borrowHash, borrowWrite.isBorrowSuccess]);

  useEffect(() => {
    if (faucets.rloHash) {
      if (faucets.isRloSuccess) {
        showSuccess("RLO Minted!", "10,000 RLO collateral added to your wallet.", faucets.rloHash);
      } else {
        showPending("Minting RLO Faucet", "Claiming test RLO from faucet...", faucets.rloHash);
      }
    }
  }, [faucets.rloHash, faucets.isRloSuccess]);

  useEffect(() => {
    if (faucets.usdcHash) {
      if (faucets.isUsdcSuccess) {
        showSuccess("USDC Minted!", "1,000 USDC added to your wallet.", faucets.usdcHash);
      } else {
        showPending("Minting USDC Faucet", "Claiming test USDC from faucet...", faucets.usdcHash);
      }
    }
  }, [faucets.usdcHash, faucets.isUsdcSuccess]);

  // Computed values
  const mappedCredState = useMemo(() => ({
    credit: liveCredentials[0],
    bank: liveCredentials[1],
    identity: liveCredentials[2],
    history: liveCredentials[3],
    reporting: liveCredentials[4],
  }), [liveCredentials]);

  const pricingDetails = useMemo(() => computeCollateralDetails(mappedCredState, borrowAmount, 1.0), [mappedCredState, borrowAmount]);
  const rloBalanceDisplay = useMemo(() => poolRead.rloBalance.data ? Number(formatUnits(poolRead.rloBalance.data as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00", [poolRead.rloBalance.data]);
  const requiredRloRaw = parseUnits(pricingDetails.collateralRlo.toString(), 18);
  const currentRloAllowance = (poolRead.rloAllowance.data as bigint) || 0n;
  const isRloApproved = currentRloAllowance >= requiredRloRaw;

  // Handlers
  const handleVerifyCredential = async (id: number) => {
    if (!address) return;
    setAttestingId(id);
    try {
      const response = await fetch("/api/verify-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, credentialId: id })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      await verifierWrite.verifyAndRecord(address, id, data.payloadHash, data.signature);
    } catch (err) {
      console.error("Attestation failed:", err);
      setAttestingId(null);
    }
  };

  useEffect(() => {
    if (verifierWrite.isConfirmed && attestingId !== null) {
      poolRead.credentials.refetch().then(() => setAttestingId(null));
    }
  }, [verifierWrite.isConfirmed, attestingId]);

  useEffect(() => {
    if (faucets.isRloSuccess) {
      poolRead.rloBalance.refetch();
      poolRead.rloAllowance.refetch();
    }
    if (faucets.isUsdcSuccess) {
      poolRead.usdcBalance.refetch();
      poolRead.usdcAllowance.refetch();
    }
  }, [faucets.isRloSuccess, faucets.isUsdcSuccess]);

  useEffect(() => {
    if (borrowWrite.isApproveSuccess) poolRead.rloAllowance.refetch();
  }, [borrowWrite.isApproveSuccess]);

  const handleApproveRLO = async () => {
    try { await borrowWrite.approveRlo(requiredRloRaw); }
    catch (err) { console.error("Approve failed:", err); }
  };

  const handleExecuteBorrow = async () => {
    try {
      const usdcBorrowAmount = parseUnits(borrowAmount.toString(), 6);
      const durationSeconds = BigInt(loanDurationDays * 24 * 60 * 60);
      await borrowWrite.borrow(usdcBorrowAmount, durationSeconds);
      setCurrentStep(3);
    } catch (err) { console.error("Borrow execution failed:", err); }
  };

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 md:px-8">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full opacity-5" style={{ background: 'radial-gradient(circle, var(--color-sage) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-5" style={{ background: 'radial-gradient(circle, var(--color-bone) 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      <div className="max-w-4xl mx-auto">
        {isConnected && currentStep < 3 && <StepIndicator currentStep={currentStep + 1} />}

        {/* Wallet Connection Failsafe */}
        {!isConnected && (
          <div className="text-center py-16 fade-up">
            <Badge variant="outline" className="mb-6 py-1 px-3 border-accent/30 text-accent-foreground uppercase tracking-widest font-mono text-[9px]">Credential-Based Lending</Badge>
            <h1 className="heading-display mb-6 text-foreground">Borrow with <span className="italic" style={{ fontFamily: 'Newsreader, serif' }}>Trust,</span> not over-collateralization.</h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-10 max-w-md mx-auto">Prove traditional credit history and bank reserves privately using secure enclaves to reduce your collateral up to 83%.</p>
            <div className="card p-12 border-dashed border-2 border-border bg-[var(--glass-bg)] flex flex-col items-center justify-center max-w-sm mx-auto">
              <Fingerprint className="size-10 text-muted-foreground/40 mb-4 animate-pulse" />
              <p className="font-mono text-xs tracking-tighter uppercase mb-2 text-foreground">Awaiting Wallet Connection</p>
              <p className="text-xs text-muted-foreground mb-4">Please connect your Web3 wallet to launch</p>
            </div>
          </div>
        )}

        {/* Step 01: Trust Credential Registry */}
        {isConnected && currentStep === 0 && (
          <div className="fade-up">
            <header className="mb-8">
              <Badge className="bg-[var(--color-sage-light)] text-[var(--color-sage-text)] font-mono border-none py-1 mb-2">Step 1 of 3</Badge>
              <h2 className="heading-2 text-foreground mb-2">Cryptographic Attestation Registry</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">Interact with our off-chain Secure Enclave (TEE) to verify your assets, bureau history, and legal identity. Attesting credentials adds structural credibility, additively dropping both your APR and collateral requirements.</p>
            </header>

            {allVerified ? (
              <div className="space-y-6 mb-10">
                <Card className="border-[var(--color-sage-dark)] bg-[var(--color-sage-light)]/20 p-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="size-16 rounded-full bg-[var(--color-sage-dark)] flex items-center justify-center mb-4 shadow-[0_0_20px_var(--color-sage-dark)]">
                      <Shield className="size-8 text-white" />
                    </div>
                    <h3 className="heading-3 text-foreground mb-2">Full Cryptographic Verification</h3>
                    <p className="text-sm text-muted-foreground max-w-lg">Your digital identity and assets are fully verified. You have unlocked the maximum borrowing limits and minimal interest rates available on the Rialo protocol.</p>
                  </div>
                </Card>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => poolRead.credentials.refetch()} variant="outline" className="border-[var(--color-sage-dark)] text-[var(--color-sage-dark)] h-12 px-8 font-mono uppercase tracking-widest">
                    <span className="mr-2">↻</span> Update Attestations
                  </Button>
                  <Button onClick={() => setCurrentStep(1)} className="btn-primary h-12 px-8">Configure Borrowing Terms →</Button>
                </div>
              </div>
            ) : (
              <>
                {/* Live Progress Bar */}
                <Card className="border-none bg-[var(--glass-bg)] mb-8 p-6">
                  <div className="flex items-center justify-between mb-3 text-xs font-mono">
                    <span className="text-muted-foreground">ATTENTION INTEGRITY:</span>
                    <span className="font-bold text-[var(--color-sage-text)]">{numVerified} / 5 SECURED</span>
                  </div>
                  <div className="h-2 bg-[var(--bone)] rounded-full overflow-hidden flex">
                    <div className="h-full bg-[var(--color-sage-dark)] transition-all duration-700" style={{ width: `${(numVerified / 5) * 100}%` }} />
                  </div>
                </Card>

                {/* Credential Cards */}
                <div className="space-y-4 mb-10">
                  {CREDENTIAL_ITEMS.filter((item) => !liveCredentials[item.id]).map((item) => (
                    <CredentialCard
                      key={item.id}
                      item={item}
                      isAttesting={attestingId === item.id}
                      attestingId={attestingId}
                      onAttest={handleVerifyCredential}
                    />
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button onClick={() => setCurrentStep(1)} className="btn-primary px-10 h-12">Configure Borrowing Terms →</Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 02: Loan Slider & Terms Config */}
        {isConnected && currentStep === 1 && (
          <div className="fade-up">
            <header className="mb-8">
              <Badge className="bg-[var(--color-sage-light)] text-[var(--color-sage-text)] font-mono border-none py-1 mb-2">Step 2 of 3</Badge>
              <h2 className="heading-2 text-foreground mb-2">Tailor Loan Parameters</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">Synchronized live with the `RialoLendingPool` pricing contract. Adjust amount and duration to review RLO collateral ratios and interest terms.</p>
            </header>

            <LoanTerms
              borrowAmount={borrowAmount}
              setBorrowAmount={setBorrowAmount}
              loanDurationDays={loanDurationDays}
              setLoanDurationDays={setLoanDurationDays}
              pricingDetails={pricingDetails}
              rloBalanceDisplay={rloBalanceDisplay}
              requiredRloRaw={requiredRloRaw}
              poolRead={poolRead}
              faucets={faucets}
            />

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <Button onClick={() => setCurrentStep(0)} variant="outline" className="px-6 h-12">← Edit Trust Profile</Button>
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={poolRead.rloBalance.data === undefined || (poolRead.rloBalance.data as bigint) < requiredRloRaw}
                className="btn-primary px-10 h-12"
              >
                Proceed to Checkout →
              </Button>
            </div>
          </div>
        )}

        {/* Step 03: Confirm Checkout */}
        {isConnected && currentStep === 2 && (
          <div className="fade-up">
            <header className="mb-8 text-center">
              <Badge className="bg-[var(--color-sage-light)] text-[var(--color-sage-text)] font-mono border-none py-1 mb-2">Checkout Summary</Badge>
              <h2 className="heading-2 text-foreground mb-1">Verify and Secure Position</h2>
              <p className="text-xs text-muted-foreground">Authorize on-chain RLO collateral deposit and execute dynamic USDC loan issuance.</p>
            </header>

            <Checkout
              borrowAmount={borrowAmount}
              loanDurationDays={loanDurationDays}
              pricingDetails={pricingDetails}
              isRloApproved={isRloApproved}
              borrowWrite={borrowWrite}
              faucets={faucets}
              onApprove={handleApproveRLO}
              onBorrow={handleExecuteBorrow}
              onBack={() => setCurrentStep(1)}
            />
          </div>
        )}

        {/* Step 04: Checkout Success */}
        {isConnected && currentStep === 3 && (
          <div className="text-center fade-up py-12">
            <BorrowSuccess
              borrowAmount={borrowAmount}
              pricingDetails={pricingDetails}
              borrowHash={borrowWrite.borrowHash}
              isBorrowSuccess={borrowWrite.isBorrowSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}
