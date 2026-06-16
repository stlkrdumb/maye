"use client";

import { useReadContract } from "wagmi";
import { ShieldCheck, Lock } from "lucide-react";
import { CredentialVerifierABI } from "@/lib/contracts/abis";
import { getContractAddress } from "@/lib/contracts/addresses";
import { baseSepolia } from "viem/chains";
import { Badge } from "@/components/ui/badge";

const CRED_LABELS = [
  "Credit Score",
  "Banking Verification",
  "KYC / Identity",
  "On-Chain Reputation",
  "Credit Consent",
];

export function CredMultiplierBadge({ userAddress }: { userAddress?: `0x${string}` }) {
  const verifierAddr = getContractAddress(baseSepolia.id, "credentialVerifier") as `0x${string}`;

  const { data: rawCreds } = useReadContract({
    address: verifierAddr,
    abi: CredentialVerifierABI,
    functionName: "getCredentials",
    args: userAddress ? [userAddress] : undefined,
    query: { refetchInterval: 30_000, enabled: !!userAddress },
  });

  const creds = rawCreds || [false, false, false, false, false];
  const verifiedCount = creds.filter(Boolean).length;
  
  // Multiplier logic matches LendingPool.sol:
  // Base = 1.0x (100%)
  // Each verified = +8% (0.08x)
  // All 5 = +120% (1.20x) combo bonus
  const multiplier = 1.0 + (verifiedCount * 0.08) + (verifiedCount === 5 ? 1.20 : 0);

  if (!userAddress) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-[var(--glass-bg)] backdrop-blur-md p-6 space-y-4 shadow-lg h-full">
      <div className="flex items-center justify-between pb-1 border-b border-border/20">
        <h4 className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground font-semibold">
          Cred Bonus Multiplier
        </h4>
        <span className="text-xl font-bold font-mono text-[var(--color-sage-text)]">
          {multiplier.toFixed(2)}x
        </span>
      </div>

      <div className="space-y-2 pt-1">
        {(CRED_LABELS as string[]).map((label, idx) => {
          const verified = creds[idx];
          return (
            <div 
              key={idx} 
              className={`flex items-center justify-between text-[10px] font-mono py-1.5 px-3 rounded-lg border transition-colors ${
                verified 
                  ? "bg-[var(--color-sage-light)]/10 border-[var(--color-sage)]/20 text-[var(--ink)]" 
                  : "bg-background/50 border-border/30 text-muted-foreground/50"
              }`}
            >
              <div className="flex items-center gap-2">
                {verified ? (
                  <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="size-3.5 shrink-0" />
                )}
                <span>{label}</span>
              </div>
              <span className={verified ? "text-[var(--color-sage-text)] font-semibold" : ""}>
                {verified ? "+8%" : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div className={`mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-[9px] font-mono uppercase tracking-wider ${verifiedCount === 5 ? 'text-[var(--color-sage-text)]' : 'text-muted-foreground/60'}`}>
        <span>Combo Bonus (All 5)</span>
        <span className="font-bold">{verifiedCount === 5 ? "+120%" : "—"}</span>
      </div>
      
      {verifiedCount === 5 && (
        <div className="mt-2 text-center">
          <Badge variant="outline" className="text-[8px] bg-[var(--color-sage)] text-[var(--bg)] border-none px-2 py-0">
            MAX BOOST ACTIVE
          </Badge>
        </div>
      )}
    </div>
  );
}