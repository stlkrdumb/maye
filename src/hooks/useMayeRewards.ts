"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { MAYEGovABI } from "@/lib/contracts/abis";
import { getContractAddress } from "@/lib/contracts/addresses";
import { baseSepolia } from "viem/chains";

const MAYE_GOVERNANCE_ADDRESS = getContractAddress(baseSepolia.id, "mayeGovernance") as `0x${string}`;

export function useMayeRewards(userAddress?: `0x${string}`) {
  // Read pending rewards (computed on-chain)
  const pendingQuery = useReadContract({
    address: MAYE_GOVERNANCE_ADDRESS,
    abi: MAYEGovABI,
    functionName: "getPendingAt",
    args: userAddress ? [userAddress] : undefined,
    query: { 
      enabled: !!userAddress,
      refetchInterval: 15_000, // Check every 15 seconds
    },
  });

  // Read already accrued (checkpointed) rewards
  const accruedQuery = useReadContract({
    address: MAYE_GOVERNANCE_ADDRESS,
    abi: MAYEGovABI,
    functionName: "rewardsAccrued",
    args: userAddress ? [userAddress] : undefined,
    query: { 
      enabled: !!userAddress,
      refetchInterval: 15_000,
    },
  });

  // Read current global reward rate
  const rateQuery = useReadContract({
    address: MAYE_GOVERNANCE_ADDRESS,
    abi: MAYEGovABI,
    functionName: "rewardRatePerSecond",
    query: { refetchInterval: 60_000 }, // Rate rarely changes
  });

  // Read rewards enabled status
  const enabledQuery = useReadContract({
    address: MAYE_GOVERNANCE_ADDRESS,
    abi: MAYEGovABI,
    functionName: "rewardsEnabled",
    query: { refetchInterval: 60_000 },
  });

  // Read user's MAYE token balance
  const balanceQuery = useReadContract({
    address: MAYE_GOVERNANCE_ADDRESS,
    abi: MAYEGovABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { 
      enabled: !!userAddress,
      refetchInterval: 30_000,
    },
  });

  const { writeContractAsync, data: hash, status } = useWriteContract();
  
  // Claim rewards
  async function claim() {
    return writeContractAsync({
      address: MAYE_GOVERNANCE_ADDRESS,
      abi: MAYEGovABI,
      functionName: "claim",
    });
  }

  const isClaiming = status === "pending";
  
  const isClaimConfirmed = useWaitForTransactionReceipt({ 
    hash 
  });

  // Format helpers
  const formatReward = (val?: bigint) => {
    if (!val) return "0.00";
    return parseFloat(formatUnits(val, 18)).toLocaleString("en-US", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatRate = (val?: bigint) => {
    if (!val) return "—";
    return parseFloat(formatUnits(val, 18)).toLocaleString("en-US", { 
      minimumFractionDigits: 4, 
      maximumFractionDigits: 4 
    }) + " MAYE/s";
  };

  return {
    // Raw data
    pendingAt: pendingQuery.data as bigint | undefined,
    accrued: accruedQuery.data as bigint | undefined,
    rate: rateQuery.data as bigint | undefined,
    enabled: enabledQuery.data,
    balance: balanceQuery.data as bigint | undefined,
    
    // Derived
    claimable: (pendingQuery.data && accruedQuery.data) 
      ? (pendingQuery.data as bigint) - (accruedQuery.data as bigint) 
      : 0n,
    
    // State
    isClaiming,
    isClaimConfirmed: isClaimConfirmed.data?.status === "success",
    
    // Actions
    claim,
    
    // Formatters
    formatPending: () => formatReward(pendingQuery.data as bigint | undefined),
    formatAccrued: () => formatReward(accruedQuery.data as bigint | undefined),
    formatRate: () => formatRate(rateQuery.data as bigint | undefined),
    formatBalance: () => formatReward(balanceQuery.data as bigint | undefined),
  };
}