"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider, ConnectButton, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useTheme } from "@/lib/providers/theme";

const rawRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";
const rpcUrl = rawRpcUrl.includes("${ALCHEMY_API_KEY}")
  ? rawRpcUrl.replace("${ALCHEMY_API_KEY}", "eo8KpCpOrZX74iQL3yZ0j")
  : rawRpcUrl;

const customBaseSepolia = {
  ...baseSepolia,
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
};

export const baseSepoliaConfig = customBaseSepolia;

const wagmiConfig = getDefaultConfig({
  appName: "Maye — AI Lending Protocol",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "your-walletconnect-id",
  chains: [customBaseSepolia],
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme === "dark" ? darkTheme() : lightTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { ConnectButton };
