"use client";

import { useEffect, useState } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { formatUnits, parseAbiItem } from "viem";
import { getContractAddress } from "@/lib/contracts/addresses";
import { baseSepolia } from "viem/chains";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw } from "lucide-react";
import { MAYELogo } from "@/components/icons";

interface ClaimLog {
  amount: string;
  txHash: string;
  blockNumber: bigint;
}

export function MayeRewardHistory() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [claims, setClaims] = useState<ClaimLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mayeAddr = getContractAddress(baseSepolia.id, "mayeGovernance") as `0x${string}`;

  const fetchClaims = async () => {
    if (!isConnected || !address || !publicClient) return;
    setIsLoading(true);
    try {
      const logs = await publicClient.getLogs({
        address: mayeAddr,
        event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
        args: {
          from: "0x0000000000000000000000000000000000000000",
          to: address,
        },
        fromBlock: 12000000n, // Start from a recent block or let it scan
        toBlock: "latest",
      });

      const parsedClaims: ClaimLog[] = logs.map((log) => ({
        amount: parseFloat(formatUnits(log.args.value || 0n, 18)).toFixed(4),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      }));

      // Sort with newest claims first
      setClaims(parsedClaims.reverse());
    } catch (err) {
      console.error("Error fetching claim logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [address, isConnected]);

  if (!isConnected) return null;

  return (
    <Card className="border border-border/40 bg-[var(--glass-bg)] shadow-md backdrop-blur-sm relative overflow-hidden group">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/20">
          <div className="flex items-center gap-2">
            <MAYELogo className="size-4" />
            <h4 className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground font-semibold">
              MAYE Rewards Claim History
            </h4>
          </div>
          <button 
            onClick={fetchClaims} 
            disabled={isLoading}
            className="text-muted-foreground/60 hover:text-foreground transition-colors p-1"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Claims List */}
        {claims.length > 0 ? (
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {claims.map((claim, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between text-xs py-2 px-3 rounded-lg border border-border/20 bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground/60 font-mono text-[10px]">
                    Block #{claim.blockNumber.toString()}
                  </span>
                  <Badge variant="outline" className="text-[8px] font-mono bg-[var(--color-sage-light)]/10 text-[var(--color-sage-text)] border-[var(--color-sage)]/25">
                    Claimed
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[var(--ink)]">
                    {claim.amount} MAYE
                  </span>
                  <a
                    href={`https://sepolia.basescan.org/tx/${claim.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[var(--color-sage-text)] transition-colors"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground opacity-50 text-xs">
            {isLoading ? "Retrieving claim logs from Base Sepolia..." : "No past reward claims detected on-chain."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}