import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// ── Configuration ────────────────────────────────────────────────────────
// 1. ADD YOUR UNISWAP PAIR ADDRESS HERE ONCE YOU CREATE THE POOL
const UNISWAP_V2_PAIR_ADDRESS = "0x0000000000000000000000000000000000000000" as const; 

// 2. The RialoLendingPool address that needs to be updated
const RIALO_LENDING_POOL = "0x14Ff0e872699317141329FdC3C6C50217B94825B" as const; // Your live Rialo Pool

// 3. Admin Key (from .env)
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";

// How often to check the price (in milliseconds)
const UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ── Setup Clients ────────────────────────────────────────────────────────
const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(ALCHEMY_RPC),
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(ALCHEMY_RPC),
});

// ── ABIs ─────────────────────────────────────────────────────────────────
const pairAbi = parseAbi([
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
]);

const lendingPoolAbi = parseAbi([
  "function setRloPeg(uint256 _newPeg) external",
  "function rloPeg() external view returns (uint256)"
]);

// ── Bot Logic ────────────────────────────────────────────────────────────

async function fetchAndSyncPrice() {
  if (UNISWAP_V2_PAIR_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("❌ ERROR: Please add your UNISWAP_V2_PAIR_ADDRESS in scripts/price-updater-bot.ts first.");
    process.exit(1);
  }

  console.log(`\n[${new Date().toISOString()}] Fetching reserves from Uniswap Pair...`);

  try {
    // 1. Get tokens to know which is reserve0 and reserve1
    const token0 = await publicClient.readContract({
      address: UNISWAP_V2_PAIR_ADDRESS,
      abi: pairAbi,
      functionName: "token0",
    });

    // 2. Get reserves
    const [reserve0, reserve1] = await publicClient.readContract({
      address: UNISWAP_V2_PAIR_ADDRESS,
      abi: pairAbi,
      functionName: "getReserves",
    });

    // Assuming we pair RLO (18 decimals) with USDC (6 decimals)
    // Identify which reserve is USDC
    const USDC_ADDRESS = process.env.NEXT_PUBLIC_TEST_USDC_ADDRESS?.toLowerCase();
    
    let usdcReserve, rloReserve;
    if (token0.toLowerCase() === USDC_ADDRESS) {
      usdcReserve = reserve0;
      rloReserve = reserve1;
    } else {
      usdcReserve = reserve1;
      rloReserve = reserve0;
    }

    // 3. Calculate Price of 1 RLO in terms of USDC (scaled to 6 decimals for the peg)
    // Price = (usdcReserve / 1e6) / (rloReserve / 1e18) 
    // To get the peg value (which has 6 decimals, e.g. 100000 = $0.10)
    // peg = (usdcReserve * 1e18) / rloReserve
    
    const usdcBig = BigInt(usdcReserve);
    const rloBig = BigInt(rloReserve);
    
    if (rloBig === 0n) throw new Error("RLO reserve is 0!");

    const calculatedPeg = (usdcBig * 10n**18n) / rloBig;
    
    const humanReadablePrice = Number(calculatedPeg) / 1e6;
    console.log(`✅ Current Uniswap Price: 1 RLO = $${humanReadablePrice.toFixed(4)} USDC`);

    // 4. Read current peg from Lending Pool
    const currentPeg = await publicClient.readContract({
      address: RIALO_LENDING_POOL,
      abi: lendingPoolAbi,
      functionName: "rloPeg",
    });

    // If price changed by more than 1%, update it (prevents spamming txs for micro changes)
    const diff = currentPeg > calculatedPeg ? currentPeg - calculatedPeg : calculatedPeg - currentPeg;
    const diffPercent = Number(diff) / Number(currentPeg);

    if (diffPercent > 0.01) {
      console.log(`⚠️ Price deviation detected (${(diffPercent * 100).toFixed(2)}%). Updating on-chain peg to ${calculatedPeg}...`);
      
      const { request } = await publicClient.simulateContract({
        account,
        address: RIALO_LENDING_POOL,
        abi: lendingPoolAbi,
        functionName: "setRloPeg",
        args: [calculatedPeg],
      });

      const txHash = await walletClient.writeContract(request);
      console.log(`🚀 Transaction submitted: ${txHash}`);
      
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log(`✅ On-chain peg successfully updated!`);
    } else {
      console.log(`💤 Price stable (deviation < 1%). No update needed.`);
    }

  } catch (error) {
    console.error("❌ Error running price sync:", error);
  }
}

// ── Entry Point ──────────────────────────────────────────────────────────

console.log("=========================================");
console.log("🤖 Maye Price Updater Bot Started");
console.log("=========================================");

// Run once immediately
fetchAndSyncPrice();

// Then run on interval
setInterval(fetchAndSyncPrice, UPDATE_INTERVAL_MS);
