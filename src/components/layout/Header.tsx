"use client";

import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTheme } from "@/lib/providers/theme";
import { Sun, Moon } from "@phosphor-icons/react";

function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center justify-center w-8 h-8 rounded-sm transition-colors duration-150 hover:bg-[color:var(--muted)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] no-underline border border-[color:var(--border)]"
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? (
        <Sun weight="duotone" size={20} />
      ) : (
        <Moon weight="duotone" size={20} />
      )}
    </button>
  );
}

export function Header() {
  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8">
      <nav className="flex items-center justify-between h-14 px-6 max-w-7xl mx-auto bg-[color:var(--background)]/80 backdrop-blur-xl border border-[color:var(--border)] rounded-2xl shadow-sm hover:shadow-md hover:border-[color:var(--border)]/50 transition-all duration-300">
        <Link href="/" className="flex items-center gap-2.5 no-underline text-inherit group">
          <div className="relative size-7 transition-transform duration-300 group-hover:scale-110">
            <Image
              src="/logo.svg"
              alt="Maye Logo"
              fill
              className="object-contain opacity-80"
              priority
            />
          </div>
          <span className="heading-3 !text-base tracking-tighter lowercase text-[var(--ink)]">maye</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: "/lend", label: "Lend" },
            { href: "/apply", label: "Borrow" },
            { href: "/dashboard", label: "Dashboard" },
            { href: "/dex", label: "DEX" }
          ].map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="relative px-4 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-all duration-200 no-underline rounded-lg hover:bg-[color:var(--muted)]/50"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: theme + wallet */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        </div>
      </nav>
    </header>
  );
}
