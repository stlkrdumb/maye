/**
 * Maye — Custom React hook for interacting with deployed contracts
 * Uses wagmi's useWriteContract and useReadContract directly in components
 */

"use client";

import { useState } from "react";

import { baseSepolia } from "viem/chains";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  LendingPoolABI,
  BorrowerRegistryABI,
  CreditOracleABI,
  RialoLendingPoolABI,
  CredentialVerifierABI,
  MockRLOABI,
  TestUSDCABI,
} from "@/lib/contracts/abis";
import { getContractAddress } from "@/lib/contracts/addresses";
import type { PoolConfig } from "@/types/contracts";

// TestUSDC on Base Sepolia (our mintable testnet token)
function getUSDCAddress(chainId: number): string {
  return getContractAddress(chainId, "testUSDC");
}

// ---- Pool Read Hook ----

/** Hook for reading pool stats — use this in components */
export function usePoolRead(address?: string) {
  const poolAddress = address ? getContractAddress(baseSepolia.id, "lendingPool") : undefined;
  const hasPool = !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000";

  // Each field wraps the wagmi result to keep types clean
  const lendingToken = useReadContract({
    address: hasPool ? (poolAddress as `0x${string}`) : undefined,
    abi: LendingPoolABI,
    functionName: "lendingToken",
    query: { refetchInterval: 2000 },
  });

  const totalDeposits = useReadContract({
    address: hasPool ? (poolAddress as `0x${string}`) : undefined,
    abi: LendingPoolABI,
    functionName: "totalDeposits",
    query: { refetchInterval: 2000 },
  });

  const totalBorrows = useReadContract({
    address: hasPool ? (poolAddress as `0x${string}`) : undefined,
    abi: LendingPoolABI,
    functionName: "totalBorrows",
    query: { refetchInterval: 2000 },
  });

  const availableLiquidity = useReadContract({
    address: hasPool ? (poolAddress as `0x${string}`) : undefined,
    abi: LendingPoolABI,
    functionName: "availableLiquidity",
    query: { refetchInterval: 2000 },
  });

  const userDeposit = useReadContract({
    address: hasPool ? (poolAddress as `0x${string}`) : undefined,
    abi: LendingPoolABI,
    functionName: "getDeposit",
    args: address ? [(address as `0x${string}`)] : undefined,
    query: { refetchInterval: 2000 },
  });

  const config = useReadContract({
    address: hasPool ? (poolAddress as `0x${string}`) : undefined,
    abi: LendingPoolABI,
    functionName: "poolConfig",
    query: { refetchInterval: 2000 },
  });

  const usdcBalance = useBalance({
    address: address ? (address as `0x${string}`) : undefined,
    token: getUSDCAddress(baseSepolia.id) as `0x${string}`,
    query: { refetchInterval: 2000 },
  });

  return {
    lendingToken,
    totalDeposits,
    totalBorrows,
    availableLiquidity,
    userDeposit,
    config,
    usdcBalance,
  };
}

// ---- Borrower Registry Read Hook ----

export function useBorrowerRead(address?: string) {
  const registryAddress = address
    ? getContractAddress(baseSepolia.id, "borrowerRegistry")
    : undefined;
  const hasRegistry = !!registryAddress && registryAddress !== "0x0000000000000000000000000000000000000000";

  const profile = useReadContract({
    address: hasRegistry ? (registryAddress as `0x${string}`) : undefined,
    abi: BorrowerRegistryABI,
    functionName: "getProfileTuple",
    args: address ? [(address as `0x${string}`)] : undefined,
    query: { refetchInterval: 2000 },
  });

  const eligible = useReadContract({
    address: hasRegistry ? (registryAddress as `0x${string}`) : undefined,
    abi: BorrowerRegistryABI,
    functionName: "isEligible",
    args: address ? [(address as `0x${string}`)] : undefined,
    query: { refetchInterval: 2000 },
  });

  return { profile, eligible };
}

// ---- Credit Oracle Read Hook ----

export function useCreditScore(address?: string) {
  const poolAddress = address
    ? getContractAddress(baseSepolia.id, "lendingPool")
    : undefined;
  const hasPool = !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000";

  // Credit score is stored in the BorrowerRegistry, but we also expose
  // a generic read hook in case a real oracle is deployed later
  const score = useReadContract({
    address: hasPool ? (poolAddress as `0x${string}`) : undefined,
    abi: CreditOracleABI,
    functionName: "getScore",
    args: address ? [(address as `0x${string}`)] : undefined,
    query: { refetchInterval: 2000 },
  });

  return score;
}

// ---- Loan Details Read Hook ----

export function useLoanDetails(loanId?: bigint) {
  const poolAddress = loanId !== undefined
    ? getContractAddress(baseSepolia.id, "lendingPool")
    : undefined;
  const hasPool = !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000";

  const loan = useReadContract({
    address: hasPool ? (poolAddress as `0x${string}`) : undefined,
    abi: LendingPoolABI,
    functionName: "getLoan",
    args: loanId !== undefined ? [loanId] : undefined,
    query: { refetchInterval: 2000 },
  });

  return loan;
}

// ---- Active Loans List Hook ----

export function useUserLoans(address?: string) {
  const poolAddress = address
    ? getContractAddress(baseSepolia.id, "lendingPool")
    : undefined;
  const hasPool = !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000";

  // Read the user's loan IDs from the contract
  const loanIds = useReadContract({
    address: hasPool ? (poolAddress as `0x${string}`) : undefined,
    abi: LendingPoolABI,
    functionName: "getUserLoanIds",
    args: address ? [(address as `0x${string}`)] : undefined,
    query: { refetchInterval: 2000 },
  });

  return loanIds;
}

// ---- Pool Write Hook ----

/** Hook for writing to the LendingPool contract */
export function usePoolWrite(address?: string) {
  const poolAddress = address ? getContractAddress(baseSepolia.id, "lendingPool") : undefined;
  const hasPool = !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000";

  const { writeContractAsync, data: approveHash } = useWriteContract();
  const { writeContractAsync: depositAsync, data: depositHash } = useWriteContract();

  const isApproved = useWaitForTransactionReceipt({ hash: approveHash });
  const isDeposited = useWaitForTransactionReceipt({ hash: depositHash });

  /** Approve the lending pool to spend USDC */
  async function approve(amount: bigint) {
    const usdcAddress = getUSDCAddress(baseSepolia.id);
    return writeContractAsync({
      address: usdcAddress as `0x${string}`,
      abi: [
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const,
      functionName: "approve",
      args: [(poolAddress as `0x${string}`), amount],
    });
  }

  /** Deposit USDC into the lending pool */
  async function deposit(amount: bigint) {
    return depositAsync({
      address: (poolAddress as `0x${string}`),
      abi: LendingPoolABI,
      functionName: "deposit",
      args: [amount],
    });
  }

  return {
    approve,
    deposit,
    approveHash,
    depositHash,
    isApproved: isApproved.data?.status === "success",
    isDeposited: isDeposited.data?.status === "success",
  };
}

// ---- Pool Write Hook (extended) ----

export function usePoolWriteExtended(address?: string) {
  const poolAddress = address
    ? getContractAddress(baseSepolia.id, "lendingPool")
    : undefined;
  const hasPool = !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000";

  const { writeContractAsync, data: repayHash } = useWriteContract();
  const { writeContractAsync: withdrawAsync, data: withdrawHash } = useWriteContract();

  const isRepaid = useWaitForTransactionReceipt({ hash: repayHash });
  const isWithdrawn = useWaitForTransactionReceipt({ hash: withdrawHash });

  /** Repay a loan */
  async function repay(loanId: bigint) {
    return writeContractAsync({
      address: (poolAddress as `0x${string}`),
      abi: LendingPoolABI,
      functionName: "repay",
      args: [loanId],
    });
  }

  /** Withdraw deposited USDC */
  async function withdraw(amount: bigint) {
    return withdrawAsync({
      address: (poolAddress as `0x${string}`),
      abi: LendingPoolABI,
      functionName: "withdraw",
      args: [amount],
    });
  }

  return {
    repay,
    withdraw,
    repayHash,
    withdrawHash,
    isRepaid: isRepaid.data?.status === "success",
    isWithdrawn: isWithdrawn.data?.status === "success",
  };
}

// ---- Borrower Write Hook ----

export function useBorrowWrite(address?: string) {
  const poolAddress = address
    ? getContractAddress(baseSepolia.id, "lendingPool")
    : undefined;
  const hasPool = !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000";

  const { writeContractAsync, data: borrowHash, error: borrowError, isPending: isBorrowing } = useWriteContract();
  const isConfirmed = useWaitForTransactionReceipt({ hash: borrowHash });

  /** Apply for and receive a loan */
  async function applyAndBorrow(principal: bigint, duration: bigint) {
    if (!hasPool) throw new Error("Lending pool not configured");
    
    return writeContractAsync({
      address: poolAddress as `0x${string}`,
      abi: LendingPoolABI,
      functionName: "applyAndBorrow",
      args: [principal, duration],
    });
  }

  return {
    applyAndBorrow,
    borrowHash,
    borrowError,
    isBorrowing,
    isConfirmed: isConfirmed.data?.status === "success",
    receipt: isConfirmed.data,
  };
}

// ---- Combined Hook for Wallet + Contracts ----

export function useMaye() {
  const account = useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();

  return {
    ...account,
    connect: connectAsync,
    disconnect: disconnectAsync,
  };
}

// ---- Data Interfaces for AI Assessment ----

export interface AssessmentData {
  employment: EmploymentInfo;
  income: IncomeInfo;
  cashFlow?: CashFlowAnalysis;
  education?: EducationInfo;
  behavioral?: BehavioralSignals;
}

export interface EmploymentInfo {
  employerName?: string;
  yearsEmployed?: number;
  jobType: "full-time" | "part-time" | "contract" | "freelance" | "student" | "self-employed";
  stable: boolean;
}

export interface IncomeInfo {
  monthlyAmount?: number;
  currency: string;
  sources: Array<{ source: string; amount: number }>;
}

export interface CashFlowAnalysis {
  avgMonthlyDeposit: number;
  avgMonthlyWithdrawal: number;
  balanceHistory: Array<{ date: string; balance: number }>;
  overdraftsLast6Months: number;
}

export interface EducationInfo {
  level: "high-school" | "associate" | "bachelor" | "master" | "phd" | "other";
  graduated?: boolean;
  field?: string;
}

export interface BehavioralSignals {
  onchainDurationMonths: number;
  transactionFrequency: "low" | "medium" | "high";
  hasSmartContractInteraction: boolean;
  reputationScore?: number;
}

export interface ScoreRecord {
  borrower: string;
  score: bigint;
  tier: number;
  timestamp: bigint;
  attestationHash: string;
}

export interface BorrowerProfile {
  borrower: string;
  totalLoansTaken: number;
  totalAmountBorrowed: number;
  totalRepaid: number;
  latestCreditScore: number;
  isBanned: boolean;
  createdAt: string;
}

// ---- Loan struct type ----

export interface LoanInfo {
  borrower: string;
  principal: bigint;
  interestRate: bigint;
  duration: bigint;
  startTime: bigint;
  repaymentDeadline: bigint;
  amountRepaid: bigint;
  isActive: boolean;
}

// ============================================================
// Rialo Under-Collateralized (RLO) Integration Hooks
// ============================================================

export interface RialoLoanInfo {
  borrower: string;
  borrowedAmount: bigint;
  collateralLocked: bigint;
  collateralRatio: bigint;
  interestRate: bigint;
  startTime: bigint;
  dueTime: bigint;
  isActive: boolean;
}

/**
 * Hook to read RLO lending pool state and user's specific loan / balance parameters.
 */
export function useRialoPoolRead(userAddress?: string) {
  const poolAddr = getContractAddress(baseSepolia.id, "rialoLendingPool") as `0x${string}`;
  const rloAddr = getContractAddress(baseSepolia.id, "mockRLO") as `0x${string}`;
  const usdcAddr = getContractAddress(baseSepolia.id, "testUSDC") as `0x${string}`;
  const verifierAddr = getContractAddress(baseSepolia.id, "credentialVerifier") as `0x${string}`;

  // Price of RLO collateral ($1.00 target, in 6 decimals)
  const collateralPrice = useReadContract({
    address: poolAddr,
    abi: RialoLendingPoolABI,
    functionName: "wethPrice",
    query: { refetchInterval: 2000 },
  });

  // User loans ID list
  const userLoans = useReadContract({
    address: poolAddr,
    abi: RialoLendingPoolABI,
    functionName: "getUserLoans",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { refetchInterval: 2000 },
  });

  // User credentials from verifier
  const credentials = useReadContract({
    address: verifierAddr,
    abi: CredentialVerifierABI,
    functionName: "getCredentials",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { refetchInterval: 2000 },
  });

  // User RLO balance
  const rloBalance = useReadContract({
    address: rloAddr,
    abi: MockRLOABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { refetchInterval: 2000 },
  });

  // User RLO allowance for the pool
  const rloAllowance = useReadContract({
    address: rloAddr,
    abi: MockRLOABI,
    functionName: "allowance",
    args: userAddress ? [userAddress as `0x${string}`, poolAddr] : undefined,
    query: { refetchInterval: 2000 },
  });

  // User USDC balance
  const usdcBalance = useReadContract({
    address: usdcAddr,
    abi: MockRLOABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { refetchInterval: 2000 },
  });

  // User USDC allowance for the pool
  const usdcAllowance = useReadContract({
    address: usdcAddr,
    abi: MockRLOABI,
    functionName: "allowance",
    args: userAddress ? [userAddress as `0x${string}`, poolAddr] : undefined,
    query: { refetchInterval: 2000 },
  });

  return {
    collateralPrice,
    userLoans,
    credentials,
    rloBalance,
    rloAllowance,
    usdcBalance,
    usdcAllowance,
    poolAddr,
    rloAddr,
    usdcAddr,
    verifierAddr,
  };
}

/**
 * Hook to read individual loan details from RialoLendingPool.
 */
export function useRialoLoanDetails(loanId: bigint) {
  const poolAddr = getContractAddress(baseSepolia.id, "rialoLendingPool") as `0x${string}`;

  const loan = useReadContract({
    address: poolAddr,
    abi: RialoLendingPoolABI,
    functionName: "loans",
    args: [loanId],
    query: { refetchInterval: 2000 },
  });

  const repaymentAmount = useReadContract({
    address: poolAddr,
    abi: RialoLendingPoolABI,
    functionName: "calculateRepaymentAmount",
    args: [loanId],
    query: { refetchInterval: 2000 },
  });

  return { loan, repaymentAmount };
}

/**
 * Hook for borrowing USDC by locking RLO collateral.
 */
export function useRialoBorrowWrite() {
  const poolAddr = getContractAddress(baseSepolia.id, "rialoLendingPool") as `0x${string}`;
  const rloAddr = getContractAddress(baseSepolia.id, "mockRLO") as `0x${string}`;

  const { writeContractAsync: approveAsync, data: approveHash, error: approveError, isPending: isApproving } = useWriteContract();
  const { writeContractAsync: borrowAsync, data: borrowHash, error: borrowError, isPending: isBorrowing } = useWriteContract();

  const isApproveConfirmed = useWaitForTransactionReceipt({ hash: approveHash });
  const isBorrowConfirmed = useWaitForTransactionReceipt({ hash: borrowHash });

  /** 1. Approve RLO spending */
  async function approveRlo(amount: bigint) {
    return approveAsync({
      address: rloAddr,
      abi: MockRLOABI,
      functionName: "approve",
      args: [poolAddr, amount],
    });
  }

  /** 2. Execute Borrow */
  async function borrow(amount: bigint, duration: bigint) {
    return borrowAsync({
      address: poolAddr,
      abi: RialoLendingPoolABI,
      functionName: "borrow",
      args: [amount, duration],
    });
  }

  return {
    approveRlo,
    borrow,
    approveHash,
    borrowHash,
    approveError,
    borrowError,
    isApproving,
    isBorrowing,
    isApproveSuccess: isApproveConfirmed.data?.status === "success",
    isBorrowSuccess: isBorrowConfirmed.data?.status === "success",
    borrowReceipt: isBorrowConfirmed.data,
  };
}

/**
 * Hook for repays, settling outstanding debt and releasing RLO collateral.
 */
export function useRialoRepayWrite() {
  const poolAddr = getContractAddress(baseSepolia.id, "rialoLendingPool") as `0x${string}`;
  const usdcAddr = getContractAddress(baseSepolia.id, "testUSDC") as `0x${string}`;

  const { writeContractAsync: approveAsync, data: approveHash, error: approveError, isPending: isApproving } = useWriteContract();
  const { writeContractAsync: repayAsync, data: repayHash, error: repayError, isPending: isRepaying } = useWriteContract();

  const isApproveConfirmed = useWaitForTransactionReceipt({ hash: approveHash });
  const isRepayConfirmed = useWaitForTransactionReceipt({ hash: repayHash });

  /** 1. Approve USDC spending */
  async function approveUsdc(amount: bigint) {
    return approveAsync({
      address: usdcAddr,
      abi: TestUSDCABI,
      functionName: "approve",
      args: [poolAddr, amount],
    });
  }

  /** 2. Execute Repayment */
  async function repay(loanId: bigint) {
    return repayAsync({
      address: poolAddr,
      abi: RialoLendingPoolABI,
      functionName: "repay",
      args: [loanId],
    });
  }

  return {
    approveUsdc,
    repay,
    approveHash,
    repayHash,
    approveError,
    repayError,
    isApproving,
    isRepaying,
    isApproveSuccess: isApproveConfirmed.data?.status === "success",
    isRepaySuccess: isRepayConfirmed.data?.status === "success",
  };
}

/**
 * Hook to request RLO or USDC faucets to test.
 */
export function useRialoFaucets() {
  const { address } = useAccount();

  const [rloHash, setRloHash] = useState<`0x${string}` | undefined>(undefined);
  const [usdcHash, setUsdcHash] = useState<`0x${string}` | undefined>(undefined);
  const [isMintingRlo, setIsMintingRlo] = useState(false);
  const [isMintingUsdc, setIsMintingUsdc] = useState(false);

  const rloConfirmed = useWaitForTransactionReceipt({ hash: rloHash });
  const usdcConfirmed = useWaitForTransactionReceipt({ hash: usdcHash });

  async function requestRloFaucet() {
    if (!address) return;
    setIsMintingRlo(true);
    setRloHash(undefined);
    try {
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, token: "rlo" }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setRloHash(data.txHash);
    } catch (err) {
      console.error("RLO Faucet failed:", err);
      throw err;
    } finally {
      setIsMintingRlo(false);
    }
  }

  async function requestUsdcFaucet() {
    if (!address) return;
    setIsMintingUsdc(true);
    setUsdcHash(undefined);
    try {
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, token: "usdc" }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setUsdcHash(data.txHash);
    } catch (err) {
      console.error("USDC Faucet failed:", err);
      throw err;
    } finally {
      setIsMintingUsdc(false);
    }
  }

  return {
    requestRloFaucet,
    requestUsdcFaucet,
    rloHash,
    usdcHash,
    isMintingRlo,
    isMintingUsdc,
    isRloSuccess: rloConfirmed.data?.status === "success",
    isUsdcSuccess: usdcConfirmed.data?.status === "success",
  };
}

/**
 * Hook for writing TEE-attested credentials to CredentialVerifier.
 */
export function useCredentialVerifierWrite() {
  const verifierAddr = getContractAddress(baseSepolia.id, "credentialVerifier") as `0x${string}`;

  const { writeContractAsync, data: txHash, error, isPending } = useWriteContract();
  const txConfirmed = useWaitForTransactionReceipt({ hash: txHash });

  async function verifyAndRecord(user: string, credentialId: number, payloadHash: `0x${string}`, signature: `0x${string}`) {
    return writeContractAsync({
      address: verifierAddr,
      abi: CredentialVerifierABI,
      functionName: "verifyAndRecord",
      args: [user as `0x${string}`, credentialId, payloadHash, signature],
    });
  }

  return {
    verifyAndRecord,
    txHash,
    error,
    isPending,
    isConfirmed: txConfirmed.data?.status === "success",
  };
}
