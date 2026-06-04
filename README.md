# Maye — AI-Powered Unsecured Consumer Lending Protocol

A lending protocol on Base Sepolia that replaces traditional credit scores (FICO) with AI-agent-powered assessment using alternative financial signals. Inspired by the paradigm of upgrading the entire consumer lending stack, not just the underwriting layer.

## Architecture

```
┌────────────── Next.js 15 Frontend ──────────────┐
│ Landing │ Lend │ Apply (loan flow) │ Dashboard   │
│ Wagmi v2 + RainbowKit + Tailwind CSS v4        │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│     AI Credit Agent (Offchain Service)          │
│  Employment │ Income │ Cash Flow │ Behavior     │
│           ↓                                    │
│      Credit Score (0–1000)                     │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│         Base Sepolia — Solidity Contracts       │
│  LendingPool │ BorrowerRegistry │ mAYE Token    │
│  ICreditOracle (interface)                        │
└─────────────────────────────────────────────────┘
```

## Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4, Wagmi v2, RainbowKit
- **Smart Contracts**: Solidity ^0.8.28, Foundry (Forge + Cast)
- **Blockchain**: Base Sepolia Testnet
- **AI Agent**: Offchain service for credit assessment via alternative data

## Getting Started

### Prerequisites

- Node.js 20+
- Foundry (forge, cast, anvil, chisel)
- Git

### Installation

```bash
# Install frontend dependencies
npm install

# Initialize smart contract dependencies (already in lib/)
# forge install OpenZeppelin/openzeppelin-contracts@v5.0.0 --commit main

# Copy environment variables
cp .env.example .env.local
```

### Development

```bash
# Start the Next.js development server
npm run dev

# Compile smart contracts
npm run compile

# Run Foundry tests (145 tests, 100% pass rate)
npm run test:foundry
```

### Smart Contract Tests

| Suite | Tests | Status |
|-------|-------|--------|
| `Counter.t.sol` | 2 | ✅ Pass |
| `MAYE.t.sol` | 30 | ✅ Pass |
| `LendingPool.t.sol` | 57 | ✅ Pass |
| `BorrowerRegistry.t.sol` | 41 | ✅ Pass |
| `Integration.t.sol` | 15 | ✅ Pass |
| **Total** | **145** | **100% pass rate** |

### Project Structure

```
maye/
├── src/                    # Next.js application
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks (wallet, contracts)
│   ├── lib/               # Utilities & providers
│   └── types/             # TypeScript type definitions
├── contracts/              # Solidity smart contracts
│   ├── interfaces/         # Contract interfaces
│   ├── Tokens/            # ERC-20 tokens (mAYE)
│   ├── LendingPool.sol    # Main lending pool
│   ├── BorrowerRegistry.sol
│   └── CreditOracle.sol   # Onchain credit score interface
├── test/                   # Foundry tests (145 tests, 100% pass rate)
│   ├── LendingPool.t.sol    # Pool deposit/borrow/repay/fuzz tests
│   ├── BorrowerRegistry.t.sol # Registration/score/ban/fuzz tests
│   ├── Integration.t.sol    # End-to-end lending flows
│   ├── MAYE.t.sol           # Token & vault tests
│   └── mocks/               # Mock contracts for testing
├── scripts/               # Deployment scripts
├── foundry.toml           # Foundry configuration
└── .env.example           # Environment variables template
```

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Sage (`--color-sage`) | `#a9ddd3` | Primary accent, CTAs, success |
| Bone (`--color-bone`) | `#e8e3d5` | Backgrounds, card surfaces |
| Ink (`--color-ink`) | `#010101` | Primary text, dark elements |
| White (`--color-white`) | `#fdfcfa` | Canvas background |

## License

MIT
