/**
 * Maye — Contract Addresses by Network
 * Hardened ZKP Stack + Live Rialo RLO Integration (Updated May 30, 2026)
 */

import { baseSepolia } from "viem/chains";

export const CONTRACT_ADDRESSES: Record<number, Partial<ContractAddresses>> = {
  [baseSepolia.id]: {
    // Live Rialo Suite (RLO Collateralized)
    rialoLendingPool: "0xFE3F04af1ad5c83740d731B06CA4316F13402C7a",
    credentialVerifier: "0x0c3CaF9066aAe4cCD34E9E956F04c41e5FE38bDd",
    mockRLO: "0x9a294C318Ecb7E1cEF2db0114093f61396aF0A98",
    testUSDC: "0x4aadaE938D355b1F8E33ACa3cB3a2b3E8A8f6F27",

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
