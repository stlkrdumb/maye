/**
 * Maye — Contract Addresses by Network
 * Hardened ZKP Stack + Live Rialo RLO Integration (Updated May 30, 2026)
 */

import { baseSepolia } from "viem/chains";

export const CONTRACT_ADDRESSES: Record<number, Partial<ContractAddresses>> = {
  [baseSepolia.id]: {
    // Live Rialo Suite (RLO Collateralized) — redeployed Jun 7 2026
    rialoLendingPool: "0x9B477864e3984b4Ec5067ba8f33611F0F315d061", // Note: Need to redeploy Rialo Pool if needed, but for now we keep existing
    mockRLO: "0x1D26103b5a9d73A55b0bb080EBdCDbDfEAC6599B",

    // Fresh Deployment with MAYEGov Integration
    testUSDC: "0xED66e7258c40bD604bfB35bf1863e7F685393d20",
    lendingPool: "0xC545ccCae89B714050ade996FD0E70B8500b8942",
    mAYE: "0xC69eBC03f264a0a0c31d5a35b6b0b11Cfb93A125",
    borrowerRegistry: "0x2c0FBD143372d27dc820aE5e2e647245Cffb325C",
    credentialVerifier: "0x83804cc2EB15E15d8e2548F328Ef8C48EE6B744e",
    bAYE: "0x0a8d26696a79230eA25a3c16abA102b7fa608661",
    mayeGovernance: "0xd37C6F8e8a79e2E404382a65cA85f10f5895df51",
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
  mayeGovernance: string;
}

export function getContractAddress(chainId: number, name: keyof ContractAddresses): string {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) throw new Error(`Unsupported chain ID: ${chainId}`);
  return addresses[name] as string;
}

export function isTestnet(): boolean {
  return baseSepolia.id === parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532");
}
