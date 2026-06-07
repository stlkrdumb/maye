import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { RialoLendingPoolABI } from "@/lib/contracts/abis";
import { getContractAddress } from "@/lib/contracts/addresses";

export interface PortfolioLoan {
  loanId: bigint;
  borrowedAmount: bigint;
  dueTime: bigint;
  collateralRatio: bigint;
  isActive: boolean;
}

/**
 * Hook to aggregate portfolio data from multiple loan IDs.
 * Fetches all loan details in parallel from the blockchain and computes live summary stats.
 */
export function usePortfolioSummary(loanIds: bigint[] | undefined) {
  const [summary, setSummary] = useState<{
    totalDebt: bigint;
    nextDue: bigint;
    minRatio: number;
    activeCount: number;
    loading: boolean;
  } | null>(null);

  const poolAddr = getContractAddress(baseSepolia.id, "rialoLendingPool") as `0x${string}`;

  useEffect(() => {
    if (!loanIds || loanIds.length === 0) {
      setSummary({ totalDebt: 0n, nextDue: 0n, minRatio: 150, activeCount: 0, loading: false });
      return;
    }

    let isMounted = true;
    setSummary(prev => prev ? { ...prev, loading: true } : { totalDebt: 0n, nextDue: 0n, minRatio: 150, activeCount: 0, loading: true });

    async function fetchSummary() {
      try {
        if (!loanIds) return;
        
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(rpcUrl),
        });

        // 1. Fetch current price of RLO (rloPeg)
        const rloPeg = await publicClient.readContract({
          address: poolAddr,
          abi: RialoLendingPoolABI,
          functionName: "rloPeg",
        }) as bigint;

        // 2. Fetch loan details in parallel
        const promises = loanIds.map(async (id) => {
          try {
            const loanData = await publicClient.readContract({
              address: poolAddr,
              abi: RialoLendingPoolABI,
              functionName: "loans",
              args: [id],
            }) as readonly [string, bigint, bigint, bigint, bigint, bigint, bigint, boolean];

            const repaymentAmt = await publicClient.readContract({
              address: poolAddr,
              abi: RialoLendingPoolABI,
              functionName: "calculateRepaymentAmount",
              args: [id],
            }) as bigint;

            return {
              borrower: loanData[0],
              borrowedAmount: loanData[1] as bigint,
              collateralLocked: loanData[2] as bigint,
              collateralRatio: loanData[3] as bigint,
              interestRate: loanData[4] as bigint,
              startTime: loanData[5] as bigint,
              dueTime: loanData[6] as bigint,
              isActive: loanData[7] as boolean,
              repaymentAmount: repaymentAmt,
            };
          } catch (e) {
            console.error(`Error reading loan ${id}:`, e);
            return null;
          }
        });

        const rawResults = await Promise.all(promises);
        
        if (!isMounted) return;

        // Filter for active loans
        const results = rawResults.filter((r): r is NonNullable<typeof r> => r !== null && r.isActive);

        if (results.length === 0) {
          setSummary({
            totalDebt: 0n,
            nextDue: 0n,
            minRatio: 150,
            activeCount: 0,
            loading: false
          });
          return;
        }

        const totalDebt = results.reduce((acc, loan) => acc + loan.repaymentAmount, 0n);
        
        const dueDates = results
          .map(loan => loan.dueTime)
          .sort((a, b) => (a < b ? -1 : 1));
        const nextDue = dueDates[0] || 0n;

        // Calculate live collateral health factor relative to required collateral ratio
        // healthFactorPercent = (liveCollateralValueUSDC * 100) / requiredCollateralValueUSDC
        // where requiredValueUsdc = (borrowedAmount * collateralRatio) / 10000
        const ratios = results.map(loan => {
          const collateralValueUsdc = (loan.collateralLocked * rloPeg) / 10n**18n; // 6 decimals
          const requiredValueUsdc = (loan.borrowedAmount * loan.collateralRatio) / 10000n; // 6 decimals
          if (requiredValueUsdc === 0n) return 150;
          return Number((collateralValueUsdc * 10000n) / requiredValueUsdc) / 100;
        });

        const minRatio = ratios.length > 0 ? Math.min(...ratios) : 150;

        setSummary({
          totalDebt,
          nextDue,
          minRatio,
          activeCount: results.length,
          loading: false
        });
      } catch (err) {
        console.error("Failed to fetch portfolio summary", err);
        if (isMounted) setSummary(prev => prev ? { ...prev, loading: false } : null);
      }
    }

    fetchSummary();
    return () => { isMounted = false; };
  }, [loanIds, poolAddr]);

  return { summary };
}
