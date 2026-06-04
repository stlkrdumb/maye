import { NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { BorrowerRegistryABI } from "@/lib/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { verifyProof } from "@reclaimprotocol/js-sdk";

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_BORROWER_REGISTRY_ADDRESS || CONTRACT_ADDRESSES[baseSepolia.id]?.borrowerRegistry) as `0x${string}`;
let RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";
if (RPC_URL.includes("${ALCHEMY_API_KEY}")) {
  RPC_URL = RPC_URL.replace("${ALCHEMY_API_KEY}", process.env.ALCHEMY_API_KEY || "");
}

export async function POST(req: Request) {
  try {
    const { address, income, jobType, employer, proof } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    console.log(`Sequencing ZK DNA for ${address}...`);
    
    // ---- Web3 Reputation Signal Gathering ----
    const [balance, txCount] = await Promise.all([
      publicClient.getBalance({ address: address as `0x${string}` }),
      publicClient.getTransactionCount({ address: address as `0x${string}` }),
    ]);

    // ---- ZK DNA Sequencing Engine ----
    let score = 500; 
    const analysisNotes = [];

    // 1. ZK Proof Validation
    if (proof && proof.identifier !== "0x_simulated_proof") {
      try {
        const isValid = await verifyProof(proof, { dangerouslyDisableContentValidation: true });
        if (isValid) {
          // Strict Context Verification: Ensure the proof was created for THIS address
          try {
            const context = JSON.parse(proof.claimData.context);
            if (context.contextAddress && context.contextAddress.toLowerCase() !== address.toLowerCase()) {
               console.error(`ZK Proof Context Mismatch: Proof Address ${context.contextAddress} vs Wallet ${address}`);
               analysisNotes.push("Security Alert: ZK Proof belongs to a different wallet");
               // If mismatched, we don't grant the ZK bonus
            } else {
               score += 250;
               analysisNotes.push("Cryptographic Proof Verified & Bound to Wallet");
                              // Extract and map data from verified parameters
                try {
                  const params = JSON.parse(proof.claimData.parameters);
                  console.log("Verified Parameters:", params);
                  const providerId = proof.claimData.providerId;

                  // 1. Stripe Seller Signal Mapping
                  if (providerId === "76974246-8e9b-4395-9270-388915469950") {
                    const monthlySales = Number(params.monthly_sales || params.monthlySales || 0);
                    const volume = Number(params.volume || 0);
                    
                    if (monthlySales > 5000) {
                      score += 150;
                      analysisNotes.push("ZK Stripe: Elite merchant volume (> $5k/mo)");
                    } else if (monthlySales > 2500) {
                      score += 100;
                      analysisNotes.push("ZK Stripe: Established merchant volume (> $2.5k/mo)");
                    } else if (monthlySales > 1000) {
                      score += 50;
                      analysisNotes.push("ZK Stripe: Active merchant volume (> $1k/mo)");
                    }

                    if (volume > 10000) {
                      score += 50;
                      analysisNotes.push("ZK Stripe: High lifetime processor volume (> $10k)");
                    }
                  }
                  // 2. Chase Bank Signal Mapping
                  else if (providerId === "67984246-9e9b-4395-9270-388915469950") {
                    const balance = Number(params.balance || params.availableBalance || 0);
                    if (balance > 10000) {
                      score += 200;
                      analysisNotes.push("ZK Chase: Premium liquidity signal (> $10k)");
                    } else if (balance > 5000) {
                      score += 150;
                      analysisNotes.push("ZK Chase: High liquidity signal (> $5k)");
                    } else if (balance > 2000) {
                      score += 100;
                      analysisNotes.push("ZK Chase: Solid liquidity signal (> $2k)");
                    } else if (balance > 500) {
                      score += 50;
                      analysisNotes.push("ZK Chase: Standard balance signal (> $500)");
                    }
                  }
                  // 3. Plaid Signal Mapping
                  else if (providerId === "88974246-0e9b-4395-9270-388915469950") {
                    const balance = Number(params.balance || params.account_balance || params.availableBalance || 0);
                    const salary = Number(params.salary || params.income || 0);
                    
                    if (balance > 5000) {
                      score += 100;
                      analysisNotes.push("ZK Plaid: Confirmed account balance (> $5k)");
                    } else if (balance > 2000) {
                      score += 50;
                      analysisNotes.push("ZK Plaid: Confirmed account balance (> $2k)");
                    }

                    if (salary > 8000) {
                      score += 150;
                      analysisNotes.push("ZK Plaid: High monthly salary signal (> $8k)");
                    } else if (salary > 5000) {
                      score += 100;
                      analysisNotes.push("ZK Plaid: Solid monthly salary signal (> $5k)");
                    } else if (salary > 3000) {
                      score += 50;
                      analysisNotes.push("ZK Plaid: Verified income flow (> $3k)");
                    }
                  }
                  // 4. Default Fallback ZK Signal Mapping
                  else {
                    const balance = Number(params.balance || 0);
                    if (balance > 5000) {
                      score += 50;
                      analysisNotes.push("ZK Proof: Verified high-balance signal");
                    }
                  }
                } catch (e) {
                  console.warn("Could not parse proof parameters", e);
                  analysisNotes.push("Warning: ZK Proof parameters are unparseable");
                }
            }
          } catch (e) {
            console.warn("Could not parse proof context", e);
            analysisNotes.push("Warning: ZK Proof context is missing or invalid");
          }
        } else {
          analysisNotes.push("Warning: ZK Proof failed verification");
        }
      } catch (err) {
        const error = err as Error;
        console.error("Reclaim verification error:", error.message);
        analysisNotes.push("Error: Could not verify ZK proof authenticity");
      }
    } else if (proof && proof.identifier === "0x_simulated_proof") {
      score += 150;
      analysisNotes.push("Simulated ZK verification (Sandbox)");
    } else if (income > 0) {
      // Manual flow
      if (income > 5000) score += 100;
      else if (income > 3000) score += 50;
      analysisNotes.push("Manual income signal (Unverified)");
    }

    // 2. Web3 Reputation Signals
    const ethBalance = Number(balance) / 1e18;
    if (ethBalance > 0.5) {
      score += 100;
      analysisNotes.push("High liquidity detected (ETH)");
    }

    if (txCount > 50) {
      score += 50;
      analysisNotes.push("Established wallet history");
    } else if (txCount === 0) {
      score -= 50;
      analysisNotes.push("Fresh wallet penalty");
    }
    
    // Add controlled randomness
    score += Math.floor(Math.random() * 15);
    
    // Clamp
    score = Math.max(0, Math.min(score, 1000));

    // Determine tier
    let tier = 0; 
    if (score >= 750) tier = 3; 
    else if (score >= 650) tier = 2; 
    else if (score >= 550) tier = 1; 
    
    console.log(`Final ZK Score: ${score}, Tier: ${tier}`);

    // ---- On-chain Attestation ----
    if (!PRIVATE_KEY || !REGISTRY_ADDRESS) {
      return NextResponse.json({ 
        score, 
        tier,
        status: "simulated",
        message: "Server not configured for on-chain attestation" 
      });
    }

    const account = privateKeyToAccount(PRIVATE_KEY);
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    console.log(`Sending on-chain attestation from ZK Agent (${account.address})...`);
    
    try {
      // 1. Ensure borrower is registered
      const { request: regRequest } = await publicClient.simulateContract({
        account,
        address: REGISTRY_ADDRESS,
        abi: BorrowerRegistryABI,
        functionName: "registerBorrower",
        args: [],
      }).catch(() => ({ request: null }));

      // 2. Prepare the attestation hash (ZK proof identifier or a generic mock)
      let attestationHash: `0x${string}` = "0x0000000000000000000000000000000000000000000000000000000000000000";
      
      if (proof && proof.identifier) {
        // Use the Reclaim proof identifier as the on-chain link
        // If it's a hex string already, use it. If not, we could hash it.
        attestationHash = proof.identifier.startsWith("0x") 
          ? (proof.identifier as `0x${string}`)
          : `0x${proof.identifier.slice(0, 64).padEnd(64, "0")}`;
      }

      // 3. Update the credit score
      const { request } = await publicClient.simulateContract({
        account,
        address: REGISTRY_ADDRESS,
        abi: BorrowerRegistryABI,
        functionName: "updateCreditScore",
        args: [address as `0x${string}`, BigInt(score), tier, attestationHash],
      });

      const hash = await client.writeContract(request);
      console.log(`Attestation sent: ${hash}. Waiting for confirmation...`);

      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`Attestation confirmed in block ${receipt.blockNumber}`);

      return NextResponse.json({ 
        score, 
        tier,
        txHash: hash,
        status: "confirmed",
        notes: analysisNotes,
        attestationHash
      });
    } catch (contractError) {
      const err = contractError as Error;
      console.error("Contract call failed:", err);
      return NextResponse.json({ 
        error: "Contract attestation failed. Ensure the ZK Agent is the contract owner.",
        details: err.message 
      }, { status: 500 });
    }

  } catch (error) {
    const err = error as Error;
    console.error("ZK DNA Sequencing error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
