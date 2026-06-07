"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePoolRead } from "@/hooks/useContracts";
import { FeatureIcon, SectionLabel } from "@/components/home";
import { HOME_FEATURES, HOME_BENEFITS, containerVariants, itemVariants, staggerContainer } from "@/lib/constants";

/* ── Main Page ──────────────────────────────────────────────────── */

export default function HomePage() {
  const pool = usePoolRead();
  // Note: In a real app, handle loading/error states from pool
  // const totalDeposits = pool.totalDeposits.data as bigint | undefined;

  return (
    <div className="relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10">
        <motion.div 
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[-10%] right-[-5%] size-[600px] rounded-full bg-[var(--color-sage)]/5 blur-[120px]" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[10%] left-[-5%] size-[500px] rounded-full bg-[var(--color-bone)]/10 blur-[100px]" 
        />
      </div>

      {/* ── CHAPTER 0: HERO ── */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative pt-24 md:pt-32 pb-32 px-4 md:px-8 max-w-7xl mx-auto"
      >
        <div className="max-w-3xl">
          <motion.div variants={itemVariants}>
            <Badge variant="outline" className="mb-8 py-1.5 px-4 border-[var(--color-sage)]/20 text-[var(--color-sage-text)] bg-[var(--color-sage-light)]/10 backdrop-blur-sm">
              NOW LIVE ON BASE SEPOLIA
            </Badge>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="heading-display !text-[clamp(3.5rem,9vw,6.5rem)] leading-[0.85] tracking-tighter mb-10"
          >
            Capital based on <br />
            <span className="italic font-normal opacity-90" style={{ fontFamily: 'Newsreader, serif' }}>behavior,</span > not history.
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl text-[var(--ink-muted)] leading-relaxed mb-12 max-w-2xl"
          >
            maye uses Zero-Knowledge and cryptographic attestations to unlock dynamic, under-collateralized loans. Lower your collateral requirements and borrow rates privately and securely on-chain.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap gap-4"
          >
            <Link href="/apply">
              <Button className="h-14 px-10 btn-primary !rounded-full shadow-lg shadow-[var(--color-sage)]/10 hover:shadow-xl hover:shadow-[var(--color-sage)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                Verify Credentials
              </Button>
            </Link>

            <Link href="/lend">
              <Button variant="outline" className="h-14 px-10 border-[var(--border)] !rounded-full hover:bg-[var(--bone)]/20 hover:border-[var(--color-sage)]/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                Provide Liquidity →
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Hero Visual */}
        <motion.div 
          variants={itemVariants}
          className="absolute top-1/2 right-0 -translate-y-1/2 hidden lg:block w-1/3"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-sage)]/20 to-transparent blur-3xl rounded-full" />
            <Card className="border-none bg-white/50 backdrop-blur-xl shadow-2xl rounded-3xl p-8 relative overflow-hidden group hover:shadow-3xl transition-all duration-500">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-sage)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10 flex justify-end items-start mb-12">
                <Badge className="bg-gradient-to-r from-[var(--color-sage-dark)] to-[var(--color-sage)] text-white shadow-md">ZK-Verified</Badge>
              </div>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--ink-muted)] opacity-60 mb-2">ZK Proof Verification</p>
              <p className="text-6xl font-bold tracking-tighter text-[var(--ink)] mb-4">742</p>
              <div className="relative h-2 w-full bg-[var(--bone)] rounded-full overflow-hidden ring-1 ring-black/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "74.2%" }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-[var(--color-sage-dark)] to-[var(--color-sage)] rounded-full shadow-[0_0_12px_rgba(169,221,211,0.4)]" 
                />
              </div>
              <p className="text-sm font-medium leading-tight mt-6">Tier: Prime <br /><span className="text-[var(--ink-muted)] opacity-60 font-normal">Eligible for up to $5,000</span></p>
            </Card>
          </div>
        </motion.div>
      </motion.section>

      {/* ── CHAPTER 1: THE INVISIBLE ── */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="py-32 md:py-48 bg-[var(--color-bone)]/30 border-y border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionLabel>The Problem</SectionLabel>
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div variants={itemVariants}>
              <h2 className="heading-2 !text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-8">
                32 million Americans are <span className="italic">credit invisible.</span>
              </h2>
              <p className="text-lg text-[var(--ink-muted)] leading-relaxed mb-8">
                Legacy scoring models rely on decades of debt history. If you&apos;re young, 
                an immigrant, or debt-averse, the system effectively ignores you — 
                regardless of your real financial health.
              </p>
              <p className="text-lg text-[var(--ink-muted)] leading-relaxed">
                We use ZKPs to look at <span className="text-[var(--ink)] font-semibold underline decoration-[var(--color-sage)]/50">private financial signals:</span> 
                income stability, spending predictability, and bank-verified cash flow.
              </p>
            </motion.div>
            
            <motion.div 
              variants={staggerContainer}
              className="grid sm:grid-cols-2 gap-4"
            >
              {[
                { label: "Credit Invisible", value: "32M", desc: "Reliable adults with no score." },
                { label: "TAM", value: "$5.1T", desc: "Unsecured consumer debt market." },
                { label: "Efficiency", value: "97%", desc: "Avg. digital repayment rates." },
                { label: "Speed", value: "< 3m", desc: "Average time to onchain credit." }
              ].map((s, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <Card className="border-none bg-white/60 backdrop-blur-sm p-6 hover:bg-white transition-colors duration-500 h-full">
                    <p className="text-4xl font-bold tracking-tighter mb-1">{s.value}</p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-muted)] opacity-60 mb-3">{s.label}</p>
                    <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{s.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── CHAPTER 2: THE ENGINE ── */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="py-32 md:py-48 px-4 md:px-8 max-w-7xl mx-auto"
      >
        <div className="text-center max-w-2xl mx-auto mb-24">
          <SectionLabel>How it Works</SectionLabel>
          <motion.h2 variants={itemVariants} className="heading-2 mb-6">Integrated intelligence.</motion.h2>
          <motion.p variants={itemVariants} className="text-[var(--ink-muted)]">Three layers between you and the capital you need.</motion.p>
        </div>

        <motion.div 
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-12 relative"
        >
          {/* Connector Line */}
          <div className="absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent hidden md:block" />
          
          {HOME_FEATURES.map((item, i) => (
            <motion.div key={i} variants={itemVariants} className="group relative">
              <div className="relative size-16 rounded-2xl bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/60 border border-[var(--glass-border)] shadow-[var(--glass-shadow)] flex items-center justify-center mb-12 group-hover:border-[var(--color-sage)]/40 group-hover:shadow-lg transition-all duration-500 z-10 text-[var(--foreground)] hover:-translate-y-1">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-sage)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="absolute -top-3 -right-3 text-[9px] font-mono font-bold text-[var(--color-sage-text)] dark:text-[var(--color-sage)] opacity-60 bg-[var(--background)] px-1.5 py-0.5 rounded-md border border-[var(--border)]">{item.step}</span>
                <span className="relative z-10">{item.icon}</span>
              </div>
              <h3 className="heading-3 mb-4 text-[var(--foreground)] group-hover:text-[var(--color-sage-text)] dark:group-hover:text-[var(--color-sage)] transition-colors duration-300">{item.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ── CHAPTER 3: WHY ONCHAIN ── */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="py-32 md:py-48 bg-[var(--primary)] text-[var(--primary-foreground)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] size-[800px] rounded-full bg-[var(--color-sage-dark)] blur-[150px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-16">
            <div className="h-px w-8 bg-[var(--primary-foreground)] opacity-30" />
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[var(--primary-foreground)] opacity-80">Infrastructure</span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-20">
            <motion.div variants={itemVariants}>
              <h2 className="heading-display !text-[var(--primary-foreground)] leading-[1.1] mb-12">
                A protocol built for <br />
                <span className="italic opacity-60">transparency.</span>
              </h2>
              <div className="space-y-12">
                {[
                  { title: "Verifiable Solvency", desc: "Pool liquidity and borrower health are 100% transparent and verifiable on Base Sepolia." },
                  { title: "Deterministic Execution", desc: "Loan terms, interest accrual, and repayments are managed by immutable smart contracts." }
                ].map((f, i) => (
                  <motion.div key={i} variants={itemVariants}>
                    <h4 className="heading-3 !text-[var(--primary-foreground)] mb-2">{f.title}</h4>
                    <p className="text-[var(--primary-foreground)] opacity-60 leading-relaxed max-w-sm">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              className="grid gap-6"
            >
              {HOME_BENEFITS.map((b, i) => (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  className="group/feature flex items-center gap-6 p-6 rounded-2xl bg-[var(--primary-foreground)]/5 border border-[var(--primary-foreground)]/10 hover:bg-[var(--primary-foreground)]/10 hover:border-[var(--primary-foreground)]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="size-12 rounded-xl bg-[var(--primary-foreground)]/10 flex items-center justify-center group-hover/feature:scale-110 group-hover/feature:bg-[var(--primary-foreground)]/15 transition-all duration-300 text-[var(--primary-foreground)]">
                    {b.icon}
                  </div>
                  <span className="font-semibold tracking-tight text-lg text-[var(--primary-foreground)] group-hover/feature:text-[var(--color-sage)] transition-colors duration-300">{b.title}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── FINAL CTA ── */}
      <section className="py-48 px-4 md:px-8 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--color-sage)]/5 blur-[120px]" />
        </div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="heading-display mb-8"
          >
            Ready to borrow?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[var(--ink-muted)] mb-12"
          >
            Verify your credentials and access under-collateralized liquidity in under 3 minutes.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/apply" className="w-full sm:w-auto">
              <Button className="h-16 px-12 btn-primary !rounded-full w-full shadow-lg shadow-[var(--color-sage)]/10 hover:shadow-xl hover:shadow-[var(--color-sage)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">Start Application</Button>
            </Link>
            <Link href="/lend" className="w-full sm:w-auto">
              <Button variant="outline" className="h-16 px-12 !rounded-full border-[var(--border)] w-full hover:bg-[var(--bone)]/20 hover:border-[var(--color-sage)]/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">Browse Yields</Button>
            </Link>
          </motion.div>
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
                Consumer Lending Portal
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-8">
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
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-muted)] mb-6">Rialo</p>
              <ul className="space-y-3">
                <li><a href="https://rialo.io/" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">Rialo Website</a></li>
                <li><a href="https://rialo.io/for-devs" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">For Developers</a></li>
                <li><a href="https://rialo.io/docs" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-muted)] mb-6">Social</p>
              <ul className="space-y-3">
                {["Twitter", "GitHub"].map(s => (
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
