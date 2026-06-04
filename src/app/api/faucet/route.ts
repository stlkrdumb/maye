import { NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { TestUSDCABI, MockRLOABI } from "@/lib/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
let RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";
if (RPC_URL.includes("${ALCHEMY_API_KEY}")) {
  RPC_URL = RPC_URL.replace("${ALCHEMY_API_KEY}", process.env.ALCHEMY_API_KEY || "");
}

export async function POST(req: Request) {
  try {
    const { address, token } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }
    if (!token || (token !== "usdc" && token !== "rlo")) {
      return NextResponse.json({ error: "Invalid token. Use 'usdc' or 'rlo'" }, { status: 400 });
    }

    if (!PRIVATE_KEY) {
      return NextResponse.json({ error: "Server DEPLOYER_PRIVATE_KEY not configured" }, { status: 500 });
    }

    const account = privateKeyToAccount(PRIVATE_KEY);
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    console.log(`Server Faucet: Minting ${token} for user ${address}...`);

    let txHash: `0x${string}`;

    if (token === "usdc") {
      const usdcAddress = CONTRACT_ADDRESSES[baseSepolia.id]?.testUSDC as `0x${string}`;
      const amount = parseUnits("50000", 6); // $50k USDC (6 decimals)

      const { request } = await publicClient.simulateContract({
        account,
        address: usdcAddress,
        abi: TestUSDCABI,
        functionName: "mint",
        args: [address as `0x${string}`, amount],
      });

      txHash = await walletClient.writeContract(request);
    } else {
      const rloAddress = CONTRACT_ADDRESSES[baseSepolia.id]?.mockRLO as `0x${string}`;
      const amount = parseUnits("100000", 18); // 100k RLO (18 decimals)

      const { request } = await publicClient.simulateContract({
        account,
        address: rloAddress,
        abi: MockRLOABI,
        functionName: "mint",
        args: [address as `0x${string}`, amount],
      });

      txHash = await walletClient.writeContract(request);
    }

    console.log(`Server Faucet: Transaction submitted. Hash: ${txHash}`);

    // Wait for the transaction to be mined
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({
      success: true,
      token,
      amount: token === "usdc" ? "50,000" : "100,000",
      txHash,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Server Faucet error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
