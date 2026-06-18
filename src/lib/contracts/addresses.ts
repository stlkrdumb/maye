/**
 * Maye — Contract Addresses by Network
 * Hardened ZKP Stack + Live Rialo RLO Integration (Updated May 30, 2026)
 */

import { baseSepolia } from "viem/chains";

export const CONTRACT_ADDRESSES: Record<number, Partial<ContractAddresses>> = {
  [baseSepolia.id]: {
    // Fresh Deployment with MAYEGov Integration (Fully Linked)
    rialoLendingPool: "0x008633b8E4Dc1Ede02A8AA23B45854f40c4426e2",
    mockRLO: "0xEc3185aFbc31F2e50b5B36BB2E7afB1fC5820d64",
    testUSDC: "0x6f402aa1285e010fbc5FAc5F176Ed5c5c27D5E0C",
    lendingPool: "0xfdfDBb377CcC6CFC0DB54aaAC850A67869949053",
    mAYE: "0xA68811e410955bb1a399074a0BbaAaF56b48Ec9F",
    borrowerRegistry: "0x5f74E514A74Cc49620AB9e3dE5f57C3a917A8f8b",
    credentialVerifier: "0xC4b57f451f510437Aac43093E96eE73b3D86C3bf",
    bAYE: "0x1c17740478ebfc1c50eb48B540FAC533F67df019",
    mayeGovernance: "0xD63A89A014f37c229E25d2fb85c88a3479e50583",
    mayeDexPair: "0xA4c37A50188bc8B3828555e68Fb90ec2F545d862",
    mayeDexRouter: "0xaCd63A02E2Fcaf90459525112f34a2e83759AB65",
    mayeDexFactory: "0xC90b0568B8A6ea8eC00c8dcf59E208E9C2aa77f8",
    mayeDexMayeUsdcPair: "0x9455004F4aAEdb701DcE1492869FD6Eb34f8aa39",
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
  mayeDexPair: string;
  mayeDexRouter: string;
  mayeDexFactory: string;
  mayeDexMayeUsdcPair: string;
}

export function getContractAddress(chainId: number, name: keyof ContractAddresses): string {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) throw new Error(`Unsupported chain ID: ${chainId}`);
  return addresses[name] as string;
}

export function isTestnet(): boolean {
  return baseSepolia.id === parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532");
}
