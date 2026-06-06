import React, { useMemo } from 'react';
import { Wallet, Clock, AlertCircle, TrendingDown, Activity } from 'lucide-react';
import { formatUSDC } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePortfolioSummary, PortfolioLoan } from '@/hooks/usePortfolioSummary';

interface DashboardSummaryProps {
  loanIds: bigint[];
}

/**
 * Premium Command Center summary component.
 * Provides a high-level overview of the user's lending portfolio.
 */
export const DashboardSummary = ({ loanIds }: DashboardSummaryProps) => {
  const { summary } = usePortfolioSummary(loanIds);
  const loading = summary?.loading ?? true;

  if (loading) {
    return (
      <div className="mb-12 fade-up">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-24 bg-muted rounded-2xl" />
            <div className="h-24 bg-muted rounded-2xl" />
            <div className="h-24 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="mb-12 fade-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div className="flex gap-4">
          <div className="bg-card/40 backdrop-blur-md border border-border/40 p-4 rounded-2xl hover:border-[var(--color-sage)]/20 transition-colors">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Portfolio Health</p>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${summary.minRatio < 110 ? 'bg-red-500 animate-pulse' : summary.minRatio < 140 ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
              <span className={`text-lg font-bold ${summary.minRatio < 110 ? 'text-red-500' : summary.minRatio < 140 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                {summary.minRatio >= 100 ? `${summary.minRatio.toFixed(1)}%` : 'CRITICAL'}
              </span>
            </div>
          </div>
          
          <div className="bg-card/40 backdrop-blur-md border border-border/40 p-4 rounded-2xl hover:border-[var(--color-sage)]/20 transition-colors">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Total Active Debt</p>
            <p className="text-xl font-bold text-foreground font-mono">${formatUSDC(summary.totalDebt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[var(--color-sage-light)]/20 to-transparent p-6 rounded-2xl border border-[var(--color-sage)]/20 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Next Payment Due</p>
              <div className="flex items-center gap-3">
                <Clock className="size-6 text-[var(--color-sage)]" />
                <span className="text-2xl font-bold text-foreground font-mono">
                  {summary.nextDue > 0n ? new Date(Number(summary.nextDue) * 1000).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'No active deadlines'}
                </span>
              </div>
            </div>
            <div className="p-2 bg-white/50 rounded-lg">
              <TrendingDown className="size-4 text-[var(--color-sage)]" />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-card/40 backdrop-blur-md border border-border/40 p-6 rounded-2xl flex flex-col justify-center shadow-sm">
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Active Positions</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-[var(--border)] border-t-[var(--color-sage)] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="size-6 text-[var(--color-sage)]" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-foreground font-mono">
                {loanIds.length} Active Loans
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {loanIds.length} borrowing positions are currently active and under management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
