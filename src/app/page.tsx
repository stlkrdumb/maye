"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePoolRead } from "@/hooks/useContracts";
import { formatUSDC } from "@/types/contracts";

/* ── Components ────────────────────────────────────────────────── */

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="size-12 rounded-xl bg-[var(--bone)]/30 flex items-center justify-center text-[var(--color-sage-dark)] mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-[var(--border)]">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-4 mb-8 fade-up">
      <div className="h-px w-8 bg-[var(--color-sage-dark)] opacity-30" />
      <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[var(--ink-muted)] opacity-60">
        {children}
      </span>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */

export default function HomePage() {
  const pool = usePoolRead();
  const totalDeposits = pool.totalDeposits.data as bigint | undefined;

  return (
    <div className="relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] right-[-5%] size-[600px] rounded-full bg-[var(--color-sage)]/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[-5%] size-[500px] rounded-full bg-[var(--color-bone)]/10 blur-[100px]" />
      </div>

      {/* ── CHAPTER 0: HERO ── */}
      <section className="relative pt-24 md:pt-32 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-8 py-1.5 px-4 border-[var(--color-sage)]/20 text-[var(--color-sage-text)] bg-[var(--color-sage-light)]/10 backdrop-blur-sm fade-up">
            NOW LIVE ON BASE SEPOLIA
          </Badge>
          
          <h1 className="heading-display !text-[clamp(3.5rem,9vw,6.5rem)] leading-[0.85] tracking-tighter mb-10 fade-up" style={{ animationDelay: '100ms' }}>
            Capital based on <br />
            <span className="italic font-normal opacity-90" style={{ fontFamily: 'Newsreader, serif' }}>behavior,</span> not history.
          </h1>

          <p className="text-xl md:text-2xl text-[var(--ink-muted)] leading-relaxed mb-12 max-w-2xl fade-up" style={{ animationDelay: '200ms' }}>
            maye sequences your financial DNA using <span className="text-[var(--ink)] font-semibold">Zero-Knowledge Proofs</span> to unlock fair, 
            unsecured credit. Cryptographically private, trustless, and friction-free.
          </p>

          <div className="flex flex-wrap gap-4 fade-up" style={{ animationDelay: '300ms' }}>
            <Link href="/apply">
              <Button className="h-14 px-10 btn-primary !rounded-full shadow-lg shadow-[var(--color-sage)]/10">
                Verify Your DNA
              </Button>
            </Link>
            <Link href="/lend">
              <Button variant="outline" className="h-14 px-10 border-[var(--border)] !rounded-full hover:bg-[var(--bone)]/20 transition-all duration-300">
                Provide Liquidity →
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 hidden lg:block w-1/3 fade-up" style={{ animationDelay: '400ms' }}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-sage)]/20 to-transparent blur-3xl rounded-full" />
            <Card className="border-none bg-white/40 backdrop-blur-xl shadow-2xl rounded-3xl p-8 relative overflow-hidden group">
              <div className="flex justify-end items-start mb-12">
                <Badge className="bg-[var(--color-sage-dark)] text-white">ZK-Verified</Badge>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-muted)] opacity-50 mb-2">ZK Proof Verification</p>
              <p className="text-5xl font-bold tracking-tighter text-[var(--ink)] mb-4">742</p>
              <div className="h-1.5 w-full bg-[var(--bone)] rounded-full overflow-hidden mb-8">
                <div className="h-full bg-[var(--color-sage-dark)] w-[74.2%] transition-all duration-1000 delay-500" />
              </div>
              <p className="text-sm font-medium leading-tight">Tier: Prime <br /><span className="text-[var(--ink-muted)] opacity-60 font-normal">Eligible for up to $5,000</span></p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 1: THE INVISIBLE ── */}
      <section className="py-32 md:py-48 bg-[var(--color-bone)]/30 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionLabel>The Problem</SectionLabel>
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="heading-2 !text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-8 fade-up">
                32 million Americans are <span className="italic">credit invisible.</span>
              </h2>
              <p className="text-lg text-[var(--ink-muted)] leading-relaxed mb-8 fade-up">
                Legacy scoring models rely on decades of debt history. If you&apos;re young, 
                an immigrant, or debt-averse, the system effectively ignores you — 
                regardless of your real financial health.
              </p>
              <p className="text-lg text-[var(--ink-muted)] leading-relaxed fade-up">
                We use ZKPs to look at <span className="text-[var(--ink)] font-semibold underline decoration-[var(--color-sage)]/50">private financial signals:</span> 
                income stability, spending predictability, and bank-verified cash flow.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 fade-up">
              {[
                { label: "Credit Invisible", value: "32M", desc: "Reliable adults with no score." },
                { label: "TAM", value: "$5.1T", desc: "Unsecured consumer debt market." },
                { label: "Efficiency", value: "97%", desc: "Avg. digital repayment rates." },
                { label: "Speed", value: "< 3m", desc: "Average time to onchain credit." }
              ].map((s, i) => (
                <Card key={i} className="border-none bg-white/60 backdrop-blur-sm p-6 hover:bg-white transition-colors duration-500">
                  <p className="text-4xl font-bold tracking-tighter mb-1">{s.value}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-muted)] opacity-60 mb-3">{s.label}</p>
                  <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{s.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 2: THE ENGINE ── */}
      <section className="py-32 md:py-48 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-24">
          <SectionLabel>How it Works</SectionLabel>
          <h2 className="heading-2 mb-6">Integrated intelligence.</h2>
          <p className="text-[var(--ink-muted)]">Three layers between you and the capital you need.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connector Line */}
          <div className="absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent hidden md:block" />
          
          {[
            {
              step: "01",
              title: "Sequence",
              desc: "Link your bank data or on-chain history. Our AI analyzes patterns, not just points.",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 11 2-2-2-2M11 19h10M15 9l2 2-2 2M3 13l2 2-2 2" /></svg>
            },
            {
              step: "02",
              title: "Attest",
              desc: "Results are attested onchain to your address, creating a portable credit reputation.",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            },
            {
              step: "03",
              title: "Deploy",
              desc: "Receive USDC instantly from the liquidity pool based on your dynamic terms.",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            }
          ].map((item, i) => (
            <div key={i} className="group relative fade-up" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="relative size-16 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] flex items-center justify-center mb-12 group-hover:border-[var(--color-sage-dark)] transition-all duration-500 z-10 text-[var(--foreground)]">
                <span className="absolute -top-3 -right-3 text-[10px] font-mono font-bold text-[var(--color-sage-dark)] opacity-40">{item.step}</span>
                {item.icon}
              </div>
              <h3 className="heading-3 mb-4 text-[var(--foreground)]">{item.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CHAPTER 3: WHY ONCHAIN ── */}
      <section className="py-32 md:py-48 bg-[var(--primary)] text-[var(--primary-foreground)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] size-[800px] rounded-full bg-[var(--color-sage-dark)] blur-[150px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="h-px w-8 bg-[var(--primary-foreground)] opacity-30" />
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[var(--primary-foreground)] opacity-80">Infrastructure</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-20">
            <div>
              <h2 className="heading-display !text-[var(--primary-foreground)] leading-[1.1] mb-12">
                A protocol built for <br />
                <span className="italic opacity-60">transparency.</span>
              </h2>
              <div className="space-y-12">
                {[
                  { title: "Verifiable Solvency", desc: "Pool liquidity and borrower health are 100% transparent and verifiable on Base Sepolia." },
                  { title: "Deterministic Execution", desc: "Loan terms, interest accrual, and repayments are managed by immutable smart contracts." }
                ].map((f, i) => (
                  <div key={i} className="fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <h4 className="heading-3 !text-[var(--primary-foreground)] mb-2">{f.title}</h4>
                    <p className="text-[var(--primary-foreground)] opacity-60 leading-relaxed max-w-sm">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              {[
                { title: "Composable Capital", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
                { title: "Non-Custodial", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
                { title: "Yield Recirculation", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> }
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-6 p-6 rounded-2xl bg-[var(--primary-foreground)]/5 border border-[var(--primary-foreground)]/10 hover:bg-[var(--primary-foreground)]/10 transition-all duration-300 group">
                  <div className="size-12 rounded-xl bg-[var(--primary-foreground)]/10 flex items-center justify-center group-hover:scale-110 transition-transform text-[var(--primary-foreground)]">{b.icon}</div>
                  <span className="font-semibold tracking-tight text-lg text-[var(--primary-foreground)]">{b.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-48 px-4 md:px-8 text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="heading-display mb-8">Ready to sequence?</h2>
          <p className="text-xl text-[var(--ink-muted)] mb-12">
            Get your AI Credit Score and access liquidity in under 3 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/apply" className="w-full sm:w-auto">
              <Button className="h-16 px-12 btn-primary !rounded-full w-full">Start Application</Button>
            </Link>
            <Link href="/lend" className="w-full sm:w-auto">
              <Button variant="outline" className="h-16 px-12 !rounded-full border-[var(--border)] w-full">Browse Yields</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="max-w-7xl mx-auto py-16 px-4 md:px-8 border-t border-[var(--border)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-12">
          <div className="flex items-center gap-3">
            <div className="relative size-10">
              <Image src="/logo.svg" alt="maye Logo" fill className="object-contain opacity-80" />
            </div>
            <div>
              <span className="heading-3 !text-xl lowercase tracking-tighter">maye</span>
              <p className="text-xs text-[var(--ink-muted)] mt-1 font-mono uppercase tracking-widest opacity-60">
                AI Credit Protocol
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-16 gap-y-8">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-muted)] mb-6">Protocol</p>
              <ul className="space-y-3">
                {["Apply", "Lend", "Dashboard"].map(l => (
                  <li key={l}><Link href={`/${l.toLowerCase()}`} className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-muted)] mb-6">Network</p>
              <ul className="space-y-3 text-sm text-[var(--ink-muted)]">
                <li>Base Sepolia</li>
                <li>Audit (Soon)</li>
                <li>Whitepaper</li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-muted)] mb-6">Social</p>
              <ul className="space-y-3">
                {["Twitter", "GitHub", "Docs"].map(s => (
                  <li key={s}><a href="#" className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">{s}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-24 pt-8 border-t border-[var(--border)] flex justify-between items-center text-[10px] font-mono text-[var(--ink-muted)] opacity-40 uppercase tracking-[0.2em]">
          <span>© 2026 maye protocol</span>
          <span>Built for the credit-invisible</span>
        </div>
      </footer>
    </div>
  );
}
