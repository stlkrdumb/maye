import { NextResponse } from "next/server";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";

export async function POST(req: Request) {
  try {
    const { providerId, address } = await req.json();

    const APP_ID = process.env.NEXT_PUBLIC_RECLAIM_APP_ID;
    const APP_SECRET = process.env.RECLAIM_APP_SECRET;

    if (!APP_ID || !APP_SECRET) {
      return NextResponse.json(
        { error: "Reclaim configuration missing on server" },
        { status: 500 }
      );
    }

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    // Initialize the Reclaim Proof Request on the server
    const reclaimProofRequest = await ReclaimProofRequest.init(
      APP_ID,
      APP_SECRET,
      providerId
    );

    // Bind the user's wallet address to the proof request context
    if (address) {
      reclaimProofRequest.addContext(address, `Maye Loan Application for ${address}`);
    }
    
    const requestUrl = await reclaimProofRequest.getRequestUrl();
    const serializedRequest = reclaimProofRequest.toJsonString();

    return NextResponse.json({
      requestUrl,
      serializedRequest
    });
  } catch (error) {
    const err = error as Error;
    console.error("Failed to create ZK session:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initialize ZK session" },
      { status: 500 }
    );
  }
}
