const { createPublicClient, http, formatUnits } = require("viem");
const { baseSepolia } = require("viem/chains");

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";
const client = createPublicClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});

const poolAddr = "0x008633b8E4Dc1Ede02A8AA23B45854f40c4426e2"; // RialoLendingPool
const rloAddr = "0xEc3185aFbc31F2e50b5B36BB2E7afB1fC5820d64"; // MockRLO
const usdcAddr = "0x6f402aa1285e010fbc5FAc5F176Ed5c5c27D5E0C"; // TestUSDC
const userAddr = "0x3D2d3612Bf9194232bFFB5ba111Ad85caCBCB32d";

const poolAbi = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserLoans",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "loanId", type: "uint256" }],
    name: "loans",
    outputs: [
      { name: "borrower", type: "address" },
      { name: "borrowedAmount", type: "uint256" },
      { name: "collateralLocked", type: "uint256" },
      { name: "collateralRatio", type: "uint256" },
      { name: "interestRate", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "dueTime", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "loanId", type: "uint256" }],
    name: "calculateRepaymentAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

async function main() {
  // 1. Get user loans
  const loanIds = await client.readContract({
    address: poolAddr,
    abi: poolAbi,
    functionName: "getUserLoans",
    args: [userAddr],
  });

  console.log(`User loans found: ${loanIds.length}`, loanIds);

  for (const id of loanIds) {
    const loan = await client.readContract({
      address: poolAddr,
      abi: poolAbi,
      functionName: "loans",
      args: [id],
    });

    const repayAmt = await client.readContract({
      address: poolAddr,
      abi: poolAbi,
      functionName: "calculateRepaymentAmount",
      args: [id],
    });

    console.log(`\n--- Loan ID: ${id} ---`);
    console.log("Borrower:         ", loan[0]);
    console.log("Borrowed Amount:  ", formatUnits(loan[1], 6), "USDC");
    console.log("Collateral Locked:", formatUnits(loan[2], 18), "RLO");
    console.log("Interest Rate:    ", Number(loan[4]) / 100, "%");
    console.log("Is Active:        ", loan[7]);
    console.log("Repayment Amount: ", formatUnits(repayAmt, 6), "USDC");
  }

  // 2. Check USDC balance & allowance
  const [usdcBal, usdcAllowed, rloBal, poolRloBal] = await Promise.all([
    client.readContract({ address: usdcAddr, abi: erc20Abi, functionName: "balanceOf", args: [userAddr] }),
    client.readContract({ address: usdcAddr, abi: erc20Abi, functionName: "allowance", args: [userAddr, poolAddr] }),
    client.readContract({ address: rloAddr, abi: erc20Abi, functionName: "balanceOf", args: [userAddr] }),
    client.readContract({ address: rloAddr, abi: erc20Abi, functionName: "balanceOf", args: [poolAddr] }),
  ]);

  console.log(`\n=== Token Balances for ${userAddr} ===`);
  console.log("USDC Balance:    ", formatUnits(usdcBal, 6), "USDC");
  console.log("USDC Allowed:    ", formatUnits(usdcAllowed, 6), "USDC");
  console.log("RLO Balance:     ", formatUnits(rloBal, 18), "RLO");
  console.log("Pool RLO Balance:", formatUnits(poolRloBal, 18), "RLO");
}

main().catch(console.error);
