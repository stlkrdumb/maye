/**
 * Maye — Contract Addresses by Network
 * Hardened ZKP Stack + Live Rialo RLO Integration (Updated May 30, 2026)
 */

import { baseSepolia } from "viem/chains";

export const CONTRACT_ADDRESSES: Record<number, Partial<ContractAddresses>> = {
  [baseSepolia.id]: {
    // Fresh Deployment with MAYEGov Integration (Fully Linked)
    rialoLendingPool: "0x14Ff0e872699317141329FdC3C6C50217B94825B",
    mockRLO: "0xB925Fa94d142116888908bADBDF2EFce1C85ADa6",
    testUSDC: "0x92d4eD116d637f0808a143C2B233729261C8DF62",
    lendingPool: "0x223165c524650D2384Dd865a3F78FEcA5eD5dc74",
    mAYE: "0x1D3CC690Ff1de7EbdA71B4e06830268B54BEFed6",
    borrowerRegistry: "0x3C0c73214eEbf5351902D1339B19C93f367169fE",
    credentialVerifier: "0x37Ed620cEe2d87ED07db5a6c1A9d14FcE8684D48",
    bAYE: "0x0a8Eb26e7c5996111C6aCbF30762F3C39E1fC883",
    mayeGovernance: "0x6CF04Cf7d754716c8510675D73573ED0D8501992",
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
