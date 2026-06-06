/**
 * Credential verification card component.
 * Displays individual credential items with attestation status and benefits.
 */

import { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, RefreshCw } from "lucide-react";
import { CREDENTIAL_ITEMS, CredentialItem } from "@/lib/constants";

interface CredentialCardProps {
  item: CredentialItem;
  isAttesting: boolean;
  onAttest: (id: number) => void;
  attestingId: number | null;
}

export function CredentialCard({ item, isAttesting, onAttest, attestingId }: CredentialCardProps) {
  const Icon = item.icon;

  return (
    <Card
      className="group/cred border border-border/60 hover:border-[var(--color-sage)]/30 transition-all duration-500 bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/60 backdrop-blur-sm hover:shadow-lg hover:shadow-[var(--color-sage)]/5 hover:-translate-y-0.5 rounded-2xl overflow-hidden"
    >
      {/* Subtle accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-sage)]/20 to-transparent opacity-0 group-hover/cred:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex gap-4 items-start">
          <div className="p-3 rounded-xl border bg-gradient-to-br from-[var(--color-sage-light)]/30 to-[var(--color-sage-light)]/10 border-[var(--color-sage)]/20 text-[var(--color-sage-text)] dark:text-[var(--color-sage)] group-hover/cred:scale-110 transition-all duration-300 shadow-sm">
            <Icon className="size-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground group-hover/cred:text-[var(--color-sage-text)] transition-colors duration-300">{item.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">{item.description}</p>
            <div className="flex items-center gap-2">
              <div className="h-px w-3 bg-[var(--color-sage)]/30" />
              <p className="text-[9px] font-mono text-muted-foreground/70">
                {item.method}
              </p>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-end gap-3 shrink-0 self-end sm:self-center">
          <div className="text-right space-y-0.5">
            <span className="block text-[10px] font-mono font-bold text-[var(--color-sage-text)] bg-[var(--color-sage-light)]/20 px-2 py-0.5 rounded-lg border border-[var(--color-sage)]/10">{item.collateralDiscount}</span>
            <span className="block text-[9px] font-mono text-muted-foreground/70">{item.rateDiscount}</span>
          </div>
          
          <Button
            size="sm"
            disabled={attestingId !== null}
            onClick={() => onAttest(item.id)}
            className="h-10 px-5 font-mono text-[9px] uppercase tracking-widest bg-gradient-to-r from-[var(--color-sage-dark)] to-[var(--color-sage)] hover:from-[var(--color-sage-text)] hover:to-[var(--color-sage-dark)] text-white shadow-md hover:shadow-lg hover:shadow-[var(--color-sage)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 rounded-xl"
          >
            {isAttesting ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                ATTESTING...
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                ATTEST
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
