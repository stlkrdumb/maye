import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatUnits } from "viem"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function formatCompact(val: bigint, decimals: number): string {
  const num = Number(val) / (10 ** decimals);
  if (num >= 1_000_000_000) {
    const formatted = num / 1_000_000_000;
    return `${formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    const formatted = num / 1_000_000;
    return `${formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(2)}M`;
  }
  if (num >= 1_000) {
    const formatted = num / 1_000;
    return `${formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(2)}K`;
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatUSDC(val: bigint): string {
  const num = Number(formatUnits(val, 6));
  const truncated = Math.floor(num * 100) / 100;
  return truncated.toLocaleString(undefined, {
    minimumFractionDigits: truncated % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatRLO(val: bigint): string {
  const num = Number(formatUnits(val, 18));
  const truncated = Math.floor(num * 100) / 100;
  return truncated.toLocaleString(undefined, {
    minimumFractionDigits: truncated % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatCompactUSDC(val: bigint): string {
  return formatCompact(val, 6);
}

export function timeAgo(ts: bigint): string {
  const diff = Math.floor((Date.now() / 1000) - Number(ts));
  if (diff < 0) return "just now";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
