"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useDex } from "@/hooks/useDex";
import { useToast } from "@/lib/providers/toast";
import { ArrowDown, RefreshCw, Wallet, Settings2, ChevronDown } from "lucide-react";
import { USDCLogo, RLOLogo, MAYELogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getContractAddress } from "@/lib/contracts/addresses";
import { baseSepolia } from "viem/chains";

type TokenID = "rlo" | "usdc" | "maye";

interface TokenInfo {
  id: TokenID;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  address: `0x${string}`;
}

const TOKENS: Record<TokenID, TokenInfo> = {
  usdc: {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    icon: "/icons/usdc.svg", // Fallback to generic if needed
    address: getContractAddress(baseSepolia.id, "testUSDC") as `0x${string}`,
  },
  rlo: {
    id: "rlo",
    symbol: "RLO",
    name: "Rialo",
    decimals: 18,
    icon: "/icons/rlo.svg",
    address: getContractAddress(baseSepolia.id, "mockRLO") as `0x${string}`,
  },
  maye: {
    id: "maye",
    symbol: "MAYE",
    name: "Maya Governance",
    decimals: 18,
    icon: "/icons/maye.svg",
    address: getContractAddress(baseSepolia.id, "mayeGovernance") as `0x${string}`,
  },
};

function TokenIcon({ symbol, className = "size-6" }: { symbol: string; className?: string }) {
  if (symbol === "USDC") return <USDCLogo className={className} />;
  if (symbol === "RLO") return <RLOLogo className={className} />;
  if (symbol === "MAYE") return <MAYELogo className={className} />;
  return null;
}

// AMM constant product calculation
function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000n + amountInWithFee;
  return numerator / denominator;
}

export default function DexPage() {
  const { address, isConnected } = useAccount();
  const dex = useDex(address);
  const { success: showSuccess, error: showError, pending: showPending } = useToast();

  const [fromToken, setFromToken] = useState<TokenID>("rlo");
  const [toToken, setToToken] = useState<TokenID>("usdc");
  const [amountIn, setAmountIn] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Watch Approval Status
  useEffect(() => {
    if (dex.approveHash) {
      showPending("Approving token", "Authorizing DEX router to spend tokens...", dex.approveHash);
    }
  }, [dex.approveHash]);

  // Watch Swap Status
  useEffect(() => {
    if (dex.swapHash) {
      showPending("Swapping tokens", "Executing swap transaction on-chain...", dex.swapHash);
    }
  }, [dex.swapHash]);

  // Fetch balances
  const balances = {
    rlo: (dex.rloBalance.data as bigint) || 0n,
    usdc: (dex.usdcBalance.data as bigint) || 0n,
    maye: (dex.mayeBalance.data as bigint) || 0n,
  };

  const allowances = {
    rlo: (dex.rloAllowance.data as bigint) || 0n,
    usdc: (dex.usdcAllowance.data as bigint) || 0n,
    maye: (dex.mayeAllowance.data as bigint) || 0n,
  };

  // Compute estimated output
  const estimatedOutput = (() => {
    const amt = parseFloat(amountIn) || 0;
    if (amt <= 0) return 0n;

    const fromInfo = TOKENS[fromToken];
    const inBig = parseUnits(amountIn, fromInfo.decimals);

    // Reserves extraction
    const rloReserves = dex.rloUsdcReserves.data as readonly [bigint, bigint] | undefined;
    const mayeReserves = dex.mayeUsdcReserves.data as readonly [bigint, bigint] | undefined;

    if (!rloReserves || !mayeReserves) return 0n;

    const [rloR_RLO, rloR_USDC] = rloReserves;
    const [mayeR_MAYE, mayeR_USDC] = mayeReserves;

    // Single hop: RLO -> USDC
    if (fromToken === "rlo" && toToken === "usdc") return getAmountOut(inBig, rloR_RLO, rloR_USDC);
    if (fromToken === "usdc" && toToken === "rlo") return getAmountOut(inBig, rloR_USDC, rloR_RLO);
    // Single hop: MAYE -> USDC
    if (fromToken === "maye" && toToken === "usdc") return getAmountOut(inBig, mayeR_MAYE, mayeR_USDC);
    if (fromToken === "usdc" && toToken === "maye") return getAmountOut(inBig, mayeR_USDC, mayeR_MAYE);

    // Multi-hop: RLO -> MAYE (RLO -> USDC -> MAYE)
    if (fromToken === "rlo" && toToken === "maye") {
      const usdcOut = getAmountOut(inBig, rloR_RLO, rloR_USDC);
      return getAmountOut(usdcOut, mayeR_USDC, mayeR_MAYE);
    }
    // Multi-hop: MAYE -> RLO (MAYE -> USDC -> RLO)
    if (fromToken === "maye" && toToken === "rlo") {
      const usdcOut = getAmountOut(inBig, mayeR_MAYE, mayeR_USDC);
      return getAmountOut(usdcOut, rloR_USDC, rloR_RLO);
    }

    return 0n;
  })();

  const outputDisplay = estimatedOutput > 0n 
    ? formatUnits(estimatedOutput, TOKENS[toToken].decimals) 
    : "";

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmountIn(outputDisplay || "");
  };

  const handleMax = () => {
    const bal = balances[fromToken];
    if (bal > 0n) {
      setAmountIn(formatUnits(bal, TOKENS[fromToken].decimals));
    }
  };

  const amountInBig = amountIn ? parseUnits(amountIn, TOKENS[fromToken].decimals) : 0n;
  const isSufficientBalance = balances[fromToken] >= amountInBig;
  const isApproved = allowances[fromToken] >= amountInBig;

  const handleAction = async () => {
    if (!address || !amountInBig || isProcessing) return;

    setIsProcessing(true);
    try {
      if (!isApproved) {
        const tx = await dex.approveToken(fromToken, amountInBig);
        showSuccess("Approval Submitted", `Authorizing ${TOKENS[fromToken].symbol} for swap.`, tx);
        dex.resetApprove();
        // Poll for allowance update
        await new Promise(r => setTimeout(r, 4000));
        dex.refetchAll();
      } else {
        // Swap execution
        // Default 2% slippage
        const minOut = (estimatedOutput * 98n) / 100n;
        
        let path: `0x${string}`[] = [];
        if (
          (fromToken === "rlo" && toToken === "usdc") ||
          (fromToken === "usdc" && toToken === "rlo") ||
          (fromToken === "maye" && toToken === "usdc") ||
          (fromToken === "usdc" && toToken === "maye")
        ) {
          path = [TOKENS[fromToken].address, TOKENS[toToken].address];
        } else if (fromToken === "rlo" && toToken === "maye") {
          path = [TOKENS.rlo.address, TOKENS.usdc.address, TOKENS.maye.address];
        } else if (fromToken === "maye" && toToken === "rlo") {
          path = [TOKENS.maye.address, TOKENS.usdc.address, TOKENS.rlo.address];
        }

        const tx = await dex.swapTokens(amountInBig, minOut, path, address);
        showSuccess("Swap Successful!", `Swapped ${TOKENS[fromToken].symbol} to ${TOKENS[toToken].symbol}.`, tx);
        dex.resetSwap();
        setAmountIn("");
        await new Promise(r => setTimeout(r, 4000));
        dex.refetchAll();
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Swap Error:", error);
      showError("Swap Failed", error.message || "An error occurred during the transaction.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 flex justify-center items-center">
      <div className="w-full max-w-md">
        
        {/* Card Container */}
        <div className="border border-border/40 shadow-2xl bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/80 backdrop-blur-xl rounded-3xl p-4 sm:p-6 fade-up">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-xl font-bold tracking-tight text-[var(--ink)]">Swap</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => dex.refetchAll()} className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors">
                <RefreshCw size={18} />
              </button>
              <button className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors">
                <Settings2 size={18} />
              </button>
            </div>
          </div>

          {/* Input Block: FROM */}
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/30 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">You pay</span>
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 cursor-pointer hover:text-foreground" onClick={handleMax}>
                <Wallet size={12} />
                {Number(formatUnits(balances[fromToken], TOKENS[fromToken].decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="0"
                value={amountIn}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val)) setAmountIn(val);
                }}
                className="w-full bg-transparent border-none outline-none text-3xl font-mono text-foreground placeholder:text-muted-foreground/30 py-2 focus:ring-0"
              />
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-2 bg-background/50 border border-border/50 text-foreground text-sm font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer hover:bg-background transition-colors select-none whitespace-nowrap min-w-[110px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={TOKENS[fromToken].symbol} className="size-5" />
                    <span>{TOKENS[fromToken].symbol}</span>
                  </div>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-border/60 rounded-xl p-1 shadow-lg z-50">
                  {Object.values(TOKENS).map((t) => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => {
                        const newFrom = t.id;
                        if (newFrom === toToken) handleSwapTokens();
                        else setFromToken(newFrom);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors ${
                        fromToken === t.id ? "bg-muted/30 font-medium" : ""
                      }`}
                    >
                      <TokenIcon symbol={t.symbol} className="size-5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground text-xs leading-none">{t.symbol}</span>
                        <span className="text-[10px] text-muted-foreground leading-none">{t.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Swap Arrow Down */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={handleSwapTokens}
              className="bg-background border border-border/60 rounded-full p-2 hover:bg-muted/50 hover:scale-105 active:scale-95 transition-all shadow-sm text-muted-foreground"
            >
              <ArrowDown size={18} />
            </button>
          </div>

          {/* Input Block: TO */}
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">You receive</span>
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                <Wallet size={12} />
                {Number(formatUnits(balances[toToken], TOKENS[toToken].decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="0"
                value={outputDisplay || ""}
                readOnly
                className="w-full bg-transparent border-none outline-none text-3xl font-mono text-foreground/80 placeholder:text-muted-foreground/30 py-2 focus:ring-0 cursor-not-allowed"
              />
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-2 bg-background/50 border border-border/50 text-foreground text-sm font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer hover:bg-background transition-colors select-none whitespace-nowrap min-w-[110px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={TOKENS[toToken].symbol} className="size-5" />
                    <span>{TOKENS[toToken].symbol}</span>
                  </div>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-border/60 rounded-xl p-1 shadow-lg z-50">
                  {Object.values(TOKENS).map((t) => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => {
                        const newTo = t.id;
                        if (newTo === fromToken) handleSwapTokens();
                        else setToToken(newTo);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors ${
                        toToken === t.id ? "bg-muted/30 font-medium" : ""
                      }`}
                    >
                      <TokenIcon symbol={t.symbol} className="size-5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground text-xs leading-none">{t.symbol}</span>
                        <span className="text-[10px] text-muted-foreground leading-none">{t.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Output Stats */}
          {amountIn && estimatedOutput > 0n && (
            <div className="mt-4 px-2 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-mono text-foreground/80">
                  1 {TOKENS[fromToken].symbol} = {(parseFloat(outputDisplay) / parseFloat(amountIn)).toFixed(4)} {TOKENS[toToken].symbol}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Slippage Tolerance</span>
                <span className="font-mono text-foreground/80 text-right">2.00%</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6">
            {!isConnected ? (
              <Button disabled className="w-full h-14 rounded-xl text-lg font-medium opacity-50 cursor-not-allowed">
                Connect Wallet
              </Button>
            ) : !amountIn ? (
              <Button disabled className="w-full h-14 rounded-xl text-lg font-medium bg-muted text-muted-foreground hover:bg-muted">
                Enter an amount
              </Button>
            ) : !isSufficientBalance ? (
              <Button disabled className="w-full h-14 rounded-xl text-lg font-medium bg-destructive/10 text-destructive hover:bg-destructive/10">
                Insufficient {TOKENS[fromToken].symbol} balance
              </Button>
            ) : !isApproved ? (
              <Button onClick={handleAction} disabled={isProcessing} className="w-full h-14 rounded-xl text-lg font-medium relative group overflow-hidden">
                <span className="relative z-10">{isProcessing ? "Approving..." : `Approve ${TOKENS[fromToken].symbol}`}</span>
              </Button>
            ) : (
              <Button onClick={handleAction} disabled={isProcessing} className="w-full h-14 rounded-xl text-lg font-medium bg-[var(--color-sage-dark)] hover:bg-[var(--color-sage-dark)]/90 text-[var(--color-sage-light)] relative group overflow-hidden">
                <span className="relative z-10">{isProcessing ? "Swapping..." : "Swap"}</span>
              </Button>
            )}
          </div>

        </div>
        
        {/* Badge under card */}
        <div className="mt-6 text-center">
          <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border/40 font-normal tracking-wide text-muted-foreground/80">
            Powered by MayeDex V1 AMM
          </Badge>
        </div>
      </div>
    </div>
  );
}
