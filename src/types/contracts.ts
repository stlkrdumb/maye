/**
 * Maye — TypeScript type definitions for smart contract interactions
 */

// ---- Pool Configuration ----

export interface PoolConfig {
  minCreditScore: bigint;
  maxLoanAmount: bigint;
  baseInterestRate: bigint; // Basis points (1 bp = 0.01%)
  interestRateStep: bigint; // Rate increase per tier below prime
  minLoanDuration: bigint;  // Seconds
  maxLoanDuration: bigint;  // Seconds
}

// ---- Loan Types ----

export enum LoanStatus {
  CREATED = 0,
  ACTIVE = 1,
  REPAYED = 2,
  DELINQUENT = 3,
  DEFAULTED = 4,
}

export interface Loan {
  borrower: string;
  principal: bigint;
  interestRate: bigint;     // Basis points
  startTime: bigint;        // Timestamp
  dueTime: bigint;          // Deadline timestamp
  remainingBalance: bigint; // Principal + accrued interest
  status: LoanStatus;
}

// ---- Borrower Profile ----

export interface BorrowerProfile {
  borrower: string;
  totalLoansTaken: bigint;
  totalAmountBorrowed: bigint;
  totalRepaid: bigint;
  latestCreditScore: bigint; // 0–1000
  isBanned: boolean;
  createdAt: bigint;
}

// ---- Credit Score Types ----

export enum ScoreTier {
  INVALID = 0,
  SUBPRIME = 1,
  NEAR_PRIME = 2,
  PRIME = 3,
}

export interface CreditRecord {
  borrower: string;
  score: bigint; // 0–1000
  tier: ScoreTier;
  timestamp: bigint;
  attestationHash: string;
}

// ---- Deposit Record ----

export interface DepositRecord {
  lender: string;
  amount: bigint;
  lastAccruedInterest: bigint;
}

// ---- Utility Types ----

export type PoolStats = {
  totalDeposits: bigint;
  totalBorrows: bigint;
  availableLiquidity: bigint;
  activeLoans: bigint;
};

/** Convert USDC amount (6 decimals) to human-readable */
export function formatUSDC(raw: bigint): string {
  return (Number(raw) / 1e6).toFixed(2);
}

/** Convert basis points to percentage string */
export function bpsToPercent(bps: bigint | number): string {
  const num = typeof bps === "bigint" ? Number(bps) : bps;
  return (num / 100).toFixed(2) + "%";
}

/** Format seconds into human-readable duration */
export function formatDuration(seconds: bigint): string {
  const totalDays = Number(seconds) / 86400;
  if (totalDays < 7) return `${Math.round(totalDays)}d`;
  if (totalDays < 365) return `${Math.round(totalDays / 7)}w`;
  return `${(totalDays / 365).toFixed(1)}y`;
}

/** Format a date string from timestamp */
export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Convert a raw score to a tier label */
export function scoreToTier(score: bigint): string {
  if (score >= 720) return "Prime";
  if (score >= 660) return "Near-Prime";
  return "Subprime";
}
