import { NextResponse } from "next/server";
import { keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;

export async function POST(req: Request) {
  try {
    const { address, credentialId } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }
    if (credentialId === undefined || credentialId === null || credentialId < 0 || credentialId > 4) {
      return NextResponse.json({ error: "Invalid credentialId" }, { status: 400 });
    }

    if (!PRIVATE_KEY) {
      return NextResponse.json({ error: "Server DEPLOYER_PRIVATE_KEY not configured" }, { status: 500 });
    }

    console.log(`TEE Enclave: Signing credential ${credentialId} for user ${address}...`);

    // 1. Generate unique payload hash (salt + credentialId) to ensure attestation freshness
    const payloadHash = keccak256(
      encodePacked(["string", "uint8"], [`rialo-tee-verification-salt-${address.toLowerCase()}-`, credentialId])
    );

    // 2. Reconstruct the message hash verified by the TEE: keccak256(user, credentialId, payloadHash)
    const messageHash = keccak256(
      encodePacked(
        ["address", "uint8", "bytes32"],
        [address as `0x${string}`, credentialId, payloadHash]
      )
    );

    // 3. Sign the raw message hash using the enclave's private key
    // signMessage automatically adds the standard "\x19Ethereum Signed Message:\n32" prefix
    const account = privateKeyToAccount(PRIVATE_KEY);
    const signature = await account.signMessage({
      message: { raw: messageHash },
    });

    console.log(`TEE Enclave: Signed successfully. Signature: ${signature}`);

    return NextResponse.json({
      payloadHash,
      signature,
      teeVerifier: account.address,
    });
  } catch (error) {
    const err = error as Error;
    console.error("TEE signing error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
