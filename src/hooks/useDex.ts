"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi } from "viem";
import { getContractAddress } from "@/lib/contracts/addresses";
import { baseSepolia } from "viem/chains";

const RLO_ADDRESS = getContractAddress(baseSepolia.id, "mockRLO") as `0x${string}`;
const USDC_ADDRESS = getContractAddress(baseSepolia.id, "testUSDC") as `0x${string}`;
const MAYE_ADDRESS = getContractAddress(baseSepolia.id, "mayeGovernance") as `0x${string}`;
const ROUTER_ADDRESS = getContractAddress(baseSepolia.id, "mayeDexRouter") as `0x${string}`;

const ERC20_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

const ROUTER_ABI = parseAbi([
  "function getReserves(address tokenA, address tokenB) view returns (uint256 rA, uint256 rB)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256 amountOut)",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to) returns (uint256[] memory amounts)",
]);

export function useDex(userAddress?: `0x${string}`) {
  // --- Token Balances ---
  const rloBalance = useReadContract({
    chainId: baseSepolia.id,
    address: RLO_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 5000 },
  });

  const usdcBalance = useReadContract({
    chainId: baseSepolia.id,
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 5000 },
  });

  const mayeBalance = useReadContract({
    chainId: baseSepolia.id,
    address: MAYE_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 5000 },
  });

  // --- Router Allowances ---
  const rloAllowance = useReadContract({
    chainId: baseSepolia.id,
    address: RLO_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ROUTER_ADDRESS] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 5000 },
  });

  const usdcAllowance = useReadContract({
    chainId: baseSepolia.id,
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ROUTER_ADDRESS] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 5000 },
  });

  const mayeAllowance = useReadContract({
    chainId: baseSepolia.id,
    address: MAYE_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ROUTER_ADDRESS] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 5000 },
  });

  // --- Pool Reserves ---
  const rloUsdcReserves = useReadContract({
    chainId: baseSepolia.id,
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getReserves",
    args: [RLO_ADDRESS, USDC_ADDRESS],
    query: { refetchInterval: 10000 },
  });

  const mayeUsdcReserves = useReadContract({
    chainId: baseSepolia.id,
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getReserves",
    args: [MAYE_ADDRESS, USDC_ADDRESS],
    query: { refetchInterval: 10000 },
  });

  // --- Write Actions ---
  const { writeContractAsync: writeApprove, data: approveHash, reset: resetApprove } = useWriteContract();
  const { writeContractAsync: writeSwap, data: swapHash, reset: resetSwap } = useWriteContract();

  // Approve token spending
  async function approveToken(token: "rlo" | "usdc" | "maye", amount: bigint) {
    const tokenAddress = token === "rlo" ? RLO_ADDRESS : token === "usdc" ? USDC_ADDRESS : MAYE_ADDRESS;
    return writeApprove({
      chainId: baseSepolia.id,
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [ROUTER_ADDRESS, amount],
    });
  }

  // Swap tokens
  async function swapTokens(amountIn: bigint, amountOutMin: bigint, path: `0x${string}`[], to: `0x${string}`) {
    return writeSwap({
      chainId: baseSepolia.id,
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [amountIn, amountOutMin, path, to],
    });
  }

  // Refetch all queries
  function refetchAll() {
    rloBalance.refetch();
    usdcBalance.refetch();
    mayeBalance.refetch();
    rloAllowance.refetch();
    usdcAllowance.refetch();
    mayeAllowance.refetch();
    rloUsdcReserves.refetch();
    mayeUsdcReserves.refetch();
  }

  return {
    rloBalance,
    usdcBalance,
    mayeBalance,
    rloAllowance,
    usdcAllowance,
    mayeAllowance,
    rloUsdcReserves,
    mayeUsdcReserves,
    approveToken,
    swapTokens,
    approveHash,
    swapHash,
    resetApprove,
    resetSwap,
    refetchAll,
  };
}
