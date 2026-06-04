# Maye — Onchain Unsecured Consumer Lending Protocol

> **Concept**: A lending protocol that replaces traditional credit scores (FICO) with AI-agent-powered alternative data assessment — inspired by the "upgrading the consumer lending stack" paradigm. Borrowers with thin/missing credit files can access unsecured loans via verifiable financial health signals. Built on Base Sepolia testnet with an integrated Next.js frontend, Solidity smart contracts, and an AI credit agent.

---

## Phase 1 — Project Foundation & Setup ✅ COMPLETE

- [x] Initialize project directory
- [x] Set up Next.js 15 app (App Router) with TypeScript
- [x] Configure Tailwind CSS v4 with custom design tokens
- [x] Set up Foundry for Solidity development
- [x] Install OpenZeppelin contracts (v5.0.0) via forge
- [x] Configure environment files (.env.local) for Base Sepolia *(.env.example created)*
- [x] Set up ESLint + Prettier + Commitlint
- [x] Initialize git repository with conventional commits

---

## Phase 2 — Smart Contract Development (Foundry/Solidity) ✅ COMPLETE

### 2A — Core Protocol Contracts
- [x] `MayeLendingPool` — Main lending pool for deposit/withdraw/borrow (`contracts/LendingPool.sol`)
- [ ] `LoanFactory` — Creates individual loan positions *(deferred to v2)*
- [x] `CreditOracle` — Onchain interface for AI credit score results (`contracts/interfaces/ICreditOracle.sol`)
- [x] `InterestRateModel` — Dynamic interest rate calculation *(embedded in LendingPool for v1)*

### 2B — Loan & Position Management
- [x] `LoanPosition` — Individual loan state machine (created → active → repaid/delinquent/defaulted)
- [x] `RepaymentSchedule` — Automated repayment tracking with due dates and grace periods
- [x] `BorrowerRegistry` — Tracks borrower addresses, credit scores, and history (`contracts/BorrowerRegistry.sol`)
- [x] **Registry Oracle Fix**: Implemented `ICreditOracle` in `BorrowerRegistry` to support `LendingPool` lookups.

### 2C — Risk & Compliance
- [x] `RiskManager` — Position limits, concentration checks, exposure caps *(embedded in PoolConfig for v1)*
- [x] `ComplianceModule` — Sanctions screen interface (placeholder for real integration)
- [ ] `LiquidationEngine` — For undercollateralized positions *(deferred to v2)*

### 2D — Token Layer
- [x] `mAYE` — Yield-bearing token representing lent position (ERC-20 vault, `contracts/Tokens/mAYE.sol`)
- [x] `bAYE` — Debt position token (ERC-721 representation, dynamic SVG metadata, fully tested)

### 2E — Testing & Deployment
- [x] Write comprehensive Foundry tests for all contracts
- [x] Set up Foundry forge config and test harnesses (`foundry.toml`, `test/`)
- [x] Deploy scripts for Base Sepolia testnet (`scripts/foundry/Deploy.s.sol`)
- [ ] Verify contracts on Basescan
- [x] Solidity compilation verified ✅ (all contracts compile with no errors)

---

## Phase 3 — Trustless Verification & ZKP Integration 🔄 HIGHEST PRIORITY

### 3A — ZKP Ingestion (Privacy-First Credit) 🔄 IN PROGRESS
- [x] **Secure Session Management**: Implemented `/api/zk-session` to protect Reclaim APP_SECRET.
- [x] **Cryptographic Verification**: Integrated `verifyProof` in `credit-scanner` API to validate real ZK attestations.
- [x] **Data Mapping**: Finalize mapping for specific Reclaim providers (Stripe, Chase, etc.) to credit score weights.
- [ ] **zkEmail Verification**: Verify "Employment" or "Salary" emails via DKIM-signed proofs (no raw data storage).
- [ ] **On-chain Verifier**: Deploy Solidity verifiers for ZK-proofs on Base Sepolia to trustlessly update credit scores.

### 3B — Tokenized Debt (`bAYE` NFTs) ✅ CORE COMPLETE
- [x] **ERC-721 Implementation**: Develop `bAYE.sol` to represent individual debt positions.
- [x] **Metadata Engine**: Implement dynamic SVG/JSON metadata that reflects real-time loan health.
- [ ] **Secondary Market Hooks**: Ensure `bAYE` tokens are tradable between lenders to provide private credit liquidity.

### 3C — The Covenant "Truth Engine"
- [ ] **Covenant Monitor**: Build a contract that tracks borrower "health Factor" based on periodic ZK-proof updates.
- [ ] **Programmable Penalties**: Automatic interest rate hikes or "distressed" flags if ZK-proofs are not refreshed or bank balance proofs fail.

---

## Phase 4 — Frontend & Composability ✅ CORE COMPLETE

### 4A — Design System & Foundations ✅ COMPLETE
- [x] Configure color palette: `#a9ddd3` (sage), `#e8e3d5` (bone), `#010101` (ink)
- [x] **Editorial Minimalism**: High-contrast typography and generous whitespace.
- [x] **Liquid Glass**: Premium backdrop-blur and translucent effects.
- [x] **Theme Parity**: Fully optimized light and dark modes with adaptive semantic tokens.
- [x] **Custom Branding**: Integrated custom logo and lowercase "maye" typography.

### 4B — Pages & Routes ✅ COMPLETE
- [x] `/` — Narrative landing page (Storytelling chapters, immersive visuals)
- [x] `/dashboard` — Command center (Asset liquidity, active borrowing, risk profile sidebar)
- [x] `/apply` — Premium multi-step borrowing flow (Wallet → Profile → AI Assess → Offers → Execute)
- [x] `/lend` — Unified liquidity portal (Deposit/Withdraw tabbed interaction, real-time pool stats)

### 4C — Web3 Integration
- [x] Set up wagmi v2 + viem + @rainbowkit/rainbow-kit ✅
- [x] Configure Base Sepolia as default network ✅
- [x] Contract interaction hooks (custom React hooks) — `usePoolWrite`, `useBorrowWrite`, etc.
- [x] **On-chain Execution**: Integrated `applyAndBorrow`, `deposit`, `withdraw`, and `repay` transactions.
- [x] **Theme Sync**: Synchronized RainbowKit theme with the application's light/dark mode. ✅
- [x] Success confirmations and explorer links.

### 4D — UX Polish & Refinement ✅ COMPLETE
- [x] **Theme Sync**: Synchronized RainbowKit theme with application. ✅
- [x] **Input UX**: Implemented thousand separators and auto-formatting. ✅
- [x] **ZKP Flow (Next Step)**: Design the "Verify via ZK" button in the Apply flow to replace raw data input.

---

## Phase 5 — Testing, Auditing & Deployment ⬜ TODO

### 5A — Advanced Invariants & Truth Engine Testing
- [ ] Invariant tests for `LendingPool` vs `bAYE` NFT supply.
- [ ] Fuzz testing for the Truth Engine's covenant violation logic.
- [ ] Slither static analysis for new ZKP verifier contracts.

### 5B — Deployment
- [ ] Final production deployment to Base Mainnet
- [ ] Verify on Basescan
- [ ] Deploy Next.js to Vercel
- [ ] Set up monitoring and error tracking (Sentry)

---

## Future Roadmap (v2 & Beyond) 🚀

- **ZKP Integration (Plan B)**: Fully replace or augment AI attestation with Reclaim Protocol and zkEmail for trustless verification.
- **Multichain Deployment**: Expand from Base to other L2s (Optimism, Arbitrum).
- **Secondary Debt Market**: Allow lenders to trade their `mAYE` receipt tokens or borrow against their lent positions.
- **Loan Factory (v2)**: Support customized loan terms (amortization schedules, grace periods) via a factory pattern.
- **Liquidation Engine**: Automated auctions for delinquent positions to protect lender liquidity.
- **ZK-KYC**: Privacy-preserving identity verification for production-level compliance.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        NEXT.JS FRONTEND                      │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Landing  │Dashboard │   Apply  │  Lend    │ Borrow   │  │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘  │
│       │          │          │          │          │         │
│  ┌────▼──────────▼──────────▼──────────▼──────────▼─────┐   │
│  │              Web3 Layer (wagmi + viem)                │   │
│  └────────────────────────┬─────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              AI CREDIT AGENT (Offchain Service)               │
│  ┌─────────────┬──────────────┬──────────────────────────┐  │
│  │Employment   │ Income/Cash  │ Behavioral/Platform       │  │
│  │Verification │ Flow Analysis │ Signals                   │  │
│  └─────────────┴──────────────┴──────────────────────────┘  │
│                    ↓                                          │
│          Credit Score (0–1000)                                │
└──────────────────────────┬──────────────────────────────────┘
                           │ verify & attested
┌──────────────────────────▼──────────────────────────────────┐
│               BASE SEPOLIA — SOLIDITY CONTRACTS              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │Lending   │ LoanPos. │ Credit   │ Interest │ mAYE     │  │
│  │  Pool    │  ition   │  Oracle  │ Rate     │ Vault    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │Borrower │ Repay.   │ Risk     │ Compli- │ bAYE NFT │  │
│  │Registry │ Schedule │ Manager  │ ance     │          │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Test Results

| Test Suite | Passed | Failed | Total | Notes |
|-----------|--------|--------|-------|-------|
| `Counter.t.sol` | 2 | 0 | 2 | Default Foundry tests ✅ |
| `MAYE.t.sol` | 30 | 0 | 30 | ERC-20 + yield-bearing vault tests ✅ |
| `Integration.t.sol` | 19 | 0 | 19 | Full lending flow + bAYE NFT validation tests ✅ |
| `BorrowerRegistry.t.sol` | 16 | 0 | 16 | Registration, credit scores, ban status, and updates ✅ |
| `LendingPool.t.sol` | 57 | 0 | 57 | Deposit/withdraw, borrow, repay, interest rates, pool stats, config, fuzz ✅ |
| **TOTAL** | **124** | **0** | **124** | **100% pass rate** ✅ |

---

## Commands Quick Reference

```bash
# Frontend
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm start          # Start production server
npm run lint       # ESLint check

# Smart Contracts
npm run compile    # forge build — compile all contracts
npm run test:foundry  # forge test --via-ir — run Foundry tests (145 tests)
npm run test:foundry:v     # forge test --via-ir -v — verbose output
forge clean        # Clean artifacts & cache
forge inspect <Contract> abi  # Inspect contract ABI
```
