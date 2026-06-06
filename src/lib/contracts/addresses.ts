/**
 * Maye — Contract Addresses by Network
 * Hardened ZKP Stack + Live Rialo RLO Integration (Updated May 30, 2026)
 */

import { baseSepolia } from "viem/chains";

export const CONTRACT_ADDRESSES: Record<number, Partial<ContractAddresses>> = {
  [baseSepolia.id]: {
    // Live Rialo Suite (RLO Collateralized) — redeployed Jun 6 2026 (TestUSDC no faucet, RLO faucet 10k)
    rialoLendingPool: "0xFeB64f1024B8F776d9a66c452904D863315E2AA8",
    credentialVerifier: "0x3c5EE8B883670Be1BA7ed83ac17C2c99994c8762",
    mockRLO: "0xB6a14d169a69c97597E385288690e82AA39ca828",
    testUSDC: "0x19fc415Cd4c0C68981E40c4A9C7688CEc485C624",

    // Legacy contracts preserved for backward compatibility
    lendingPool: "0xb219E15E2F52AC529B505AfC885C78496193885c", // Map lendingPool to old LendingPool
    mAYE: "0x5716881f1cb5C2Dc76D0a29F24773F898FDDb9df",
    borrowerRegistry: "0x58b37458232C837023e8140404498cac41360842",
    bAYE: "0xE3c9D89317446FB67fDCa80D39f1069BD4376370",
  },
};

export interface ContractAddresses {
  rialoLendingPool: string;
  credentialVerifier: string;
  mockRLO: string;
  testUSDC: string;
  lendingPool: string;
  mAYE: string;
  borrowerRegistry: string;
  bAYE: string;
}

export function getContractAddress(chainId: number, name: keyof ContractAddresses): string {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) throw new Error(`Unsupported chain ID: ${chainId}`);
  return addresses[name] as string;
}

export function isTestnet(): boolean {
  return baseSepolia.id === parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532");
}
