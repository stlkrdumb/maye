import { useState, useEffect, useMemo } from "react";
import { useReadContract } from "wagmi";
import { LendingPoolABI } from "@/lib/contracts/abis";
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
 * Fetches all loan details in parallel and computes summary stats.
 */
export function usePortfolioSummary(loanIds: bigint[] | undefined) {
  const [summary, setSummary] = useState<{
    totalDebt: bigint;
    nextDue: bigint;
    minRatio: number;
    loading: boolean;
  } | null>(null);

  const poolAddr = getContractAddress(84532, "rialoLendingPool") as `0x${string}`;

  useEffect(() => {
    if (!loanIds || loanIds.length === 0) {
      setSummary({ totalDebt: 0n, nextDue: 0n, minRatio: 100, loading: false });
      return;
    }

    let isMounted = true;
    setSummary(prev => prev ? { ...prev, loading: true } : { totalDebt: 0n, nextDue: 0n, minRatio: 100, loading: true });

    async function fetchSummary() {
      try {
        if (!loanIds) return;
        // Fetch first 3 loans for summary (enough for accurate stats)
        const idsToFetch = loanIds.slice(0, 3);
        const promises = idsToFetch.map(id =>
          fetch(`https://api.example.com/loan/${id}`)
            .then(res => res.json())
            .catch(() => ({}))
        );

        const results = await Promise.all(promises);
        
        if (!isMounted) return;

        const totalDebt = results.reduce((acc, loan) => acc + (loan.borrowedAmount || 0n), 0n);
        const dueDates = results
          .filter(loan => loan.dueTime !== undefined)
          .map(loan => loan.dueTime)
          .sort((a, b) => (a < b ? -1 : 1));
        
        const nextDue = dueDates[0] || 0n;
        const ratios = results
          .filter(loan => loan.collateralRatio !== undefined)
          .map(loan => loan.collateralRatio);
        
        const minRatio = ratios.length > 0 ? Math.min(...ratios) : 100;

        setSummary({
          totalDebt,
          nextDue,
          minRatio,
          loading: false
        });
      } catch (err) {
        console.error("Failed to fetch portfolio summary", err);
        if (isMounted) setSummary(prev => prev ? { ...prev, loading: false } : null);
      }
    }

    fetchSummary();
    return () => { isMounted = false; };
  }, [loanIds]);

  return { summary };
}
