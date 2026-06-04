"use client";

import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTheme } from "@/lib/providers/theme";

function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center justify-center w-8 h-8 rounded-sm transition-colors duration-150 hover:bg-[color:var(--muted)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] no-underline border border-[color:var(--border)]"
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? (
        /* Sun icon */
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        /* Moon icon */
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export function Header() {
  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8">
      <nav className="flex items-center justify-between h-14 px-6 max-w-7xl mx-auto bg-[color:var(--background)]/80 backdrop-blur-xl border border-[color:var(--border)] rounded-2xl shadow-sm">
        <Link href="/" className="flex items-center gap-2 no-underline text-inherit group">
          <div className="relative size-7 transition-transform duration-300 group-hover:scale-110">
            <Image
              src="/logo.svg"
              alt="Maye Logo"
              fill
              className="object-contain dark:brightness-150"
              priority
            />
          </div>
          <span className="heading-3 !text-base tracking-tighter lowercase text-[var(--ink)]">maye</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/lend" className="text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors duration-150 no-underline">
            Lend
          </Link>
          <Link href="/apply" className="text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors duration-150 no-underline">
            Borrow
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors duration-150 no-underline">
            Dashboard
          </Link>
        </div>

        {/* Right side: theme + wallet */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        </div>
      </nav>
    </header>
  );
}
