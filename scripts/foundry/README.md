# Foundry Deploy Scripts

## Quick Start

### 1. Set up environment

```bash
cp .env.example .env
# Edit .env with your private key and API keys
```

### 2. Dry Run (preview gas, no real tx)

```bash
npx cross-env DEPLOYER_PRIVATE_KEY=0x... \
  forge script scripts/foundry/Deploy.s.sol:Deploy \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --sig "run()"
```

### 3. Deploy to Base Sepolia

```bash
# Using npm script (recommended)
npm run deploy:base-sepolia

# Or directly with forge
forge script scripts/foundry/Deploy.s.sol:Deploy \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  --sig "run()"
```

### 4. Post-Deployment Setup

After deploying, configure the pool:

```bash
# Update addresses in SetupPool.s.sol or use env vars
forge script scripts/foundry/SetupPool.s.sol:SetupPool \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --sig "run()"
```

## Scripts

| Script | Purpose |
|--------|---------|
| `Deploy.s.sol` | Deploys all 3 contracts in order |
| `SetupPool.s.sol` | Configures pool after deployment |
| `VerifyAll.s.sol` | Verifies contracts on Basescan |

## Deployment Order

1. **BorrowerRegistry** — no dependencies
2. **mAYE** — depends on USDC address
3. **MayeLendingPool** — depends on USDC + BorrowerRegistry

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEPLOYER_PRIVATE_KEY` | Yes | Wallet private key for deployment |
| `BASESCAN_API_KEY` | Optional | For contract verification |
| `ALCHEMY_API_KEY` | Optional | Alchemy RPC key (falls back to public) |
| `TEST_BORROWER` | Optional | Address to register as test borrower |

## Output

After deployment, `broadcast/deployment.json` is created with:

```json
{
  "deployment": {
    "borrowerRegistry": "0x...",
    "mAYE": "0x...",
    "lendingPool": "0x...",
    "USDC": "0x03871De2D4e0B6356Fd4A977581bC70764077895"
  }
}
```

## Verification

Contracts are auto-verified with `--verify` flag. Manual verification:

```bash
forge verify-contract \
  --chain 84532 \
  --constructor-args <hex_encoded_args> \
  --num-of-optimization-runs 200 \
  --watch \
  <DEPLOYED_ADDRESS> \
  BorrowerRegistry
```

Constructor args (ABI-encoded):
- **BorrowerRegistry**: `abi.encode(deployer_address)`
- **mAYE**: `abi.encode(deployer_address, 0x03871De2D4e0B6356Fd4A977581bC70764077895)`
- **MayeLendingPool**: `abi.encode(0x03871De2D4e0B6356Fd4A977581bC70764077895, deployer_address)`
