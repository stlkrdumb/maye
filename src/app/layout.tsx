import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/providers/wallet";
import { ThemeProvider } from "@/lib/providers/theme";
import { ToastProvider } from "@/lib/providers/toast";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Maye — Dynamic Under-Collateralized Lending",
  description:
    "Consumer lending reimagined with cryptographic credential verification. Access loans with lower collateral requirements and interest rates based on your credentials.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans")} suppressHydrationWarning>
      <body className="min-h-[100dvh]">
        {/* Skip to main content for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--color-ink)] focus:text-[var(--color-white)] focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <WalletProvider>
            <ToastProvider>
              <Header />
              <main id="main-content" className="pt-20" tabIndex={-1}>
                {children}
              </main>
            </ToastProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
