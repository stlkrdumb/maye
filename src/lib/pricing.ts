/**
 * Core mathematical engine matching RialoLendingPool.sol specifications.
 * Computes dynamic LTV ratios, interest APRs, RLO collateral needs, and capital savings.
 */

export interface CredentialState {
  credit: boolean;      // Credit Score
  bank: boolean;        // Banking Verification
  identity: boolean;    // KYC / Identity
  history: boolean;     // On-chain Reputation
  reporting: boolean;   // Credit Reporting Consent
}

export const BASE_COLLATERAL_RATIO = 150; // 150% base collateral ratio
export const BASE_INTEREST_RATE = 12.5;   // 12.5% base APR

export const CREDENTIALS_METADATA = [
  { id: "credit", label: "Credit Score", collateralDiscount: 25, rateDiscount: 1.8 },
  { id: "bank", label: "Banking Verification", collateralDiscount: 20, rateDiscount: 1.2 },
  { id: "identity", label: "KYC / Identity", collateralDiscount: 15, rateDiscount: 0.8 },
  { id: "history", label: "On-chain Reputation", collateralDiscount: 10, rateDiscount: 0.6 },
  { id: "reporting", label: "Credit Reporting Consent", collateralDiscount: 8, rateDiscount: 0.4 },
];

export const COMBO_COLLATERAL_DISCOUNT = 5;  // 5% bonus
export const COMBO_INTEREST_DISCOUNT = 0.3;  // 0.3% bonus

/**
 * Computes dynamic borrowing terms (LTV collateral ratio and APR) based on verified credentials
 */
export function getBorrowingTerms(credentials: CredentialState) {
  let collateralDiscount = 0;
  let rateDiscount = 0;
  let verifiedCount = 0;

  for (const item of CREDENTIALS_METADATA) {
    if (credentials[item.id as keyof CredentialState]) {
      collateralDiscount += item.collateralDiscount;
      rateDiscount += item.rateDiscount;
      verifiedCount++;
    }
  }

  // Apply combo bonus if all 5 are checked
  if (verifiedCount === 5) {
    collateralDiscount += COMBO_COLLATERAL_DISCOUNT;
    rateDiscount += COMBO_INTEREST_DISCOUNT;
  }

  const ratio = Math.max(0, BASE_COLLATERAL_RATIO - collateralDiscount);
  const interestRate = Math.max(0, BASE_INTEREST_RATE - rateDiscount);

  return {
    collateralRatio: ratio,                           // e.g. 67 for 67%
    interestRate: Number(interestRate.toFixed(2)),    // e.g. 7.4 for 7.4%
  };
}

/**
 * Computes dynamic collateral details (RLO collateral needed, dollar costs, freed up capital)
 */
export function computeCollateralDetails(
  credentials: CredentialState,
  loanAmount: number, // USDC amount (e.g. 60000)
  rloPrice: number = 1.0 // RLO target price ($1.00)
) {
  const { collateralRatio, interestRate } = getBorrowingTerms(credentials);

  // Normal over-collateralized needed (150% standard DeFi)
  const standardCollateralNeededUsd = loanAmount * (BASE_COLLATERAL_RATIO / 100);
  
  // Custom under-collateralized collateral needed (USD)
  const collateralNeededUsd = loanAmount * (collateralRatio / 100);
  
  // RLO needed = collateralNeededUsd / rloPrice
  const collateralRlo = collateralNeededUsd / rloPrice;

  // Capital freed up vs. standard DeFi
  const capitalFreedUsd = standardCollateralNeededUsd - collateralNeededUsd;

  // Annual interest cost
  const annualInterestCost = loanAmount * (interestRate / 100);
  const standardAnnualCost = loanAmount * (BASE_INTEREST_RATE / 100);
  const annualSavings = standardAnnualCost - annualInterestCost;

  return {
    collateralRatio,
    interestRate,
    collateralNeededUsd,
    collateralRlo: Number(collateralRlo.toFixed(4)),
    standardCollateralNeededUsd,
    capitalFreedUsd,
    annualInterestCost: Number(annualInterestCost.toFixed(2)),
    standardAnnualCost,
    annualSavings: Number(annualSavings.toFixed(2)),
  };
}
