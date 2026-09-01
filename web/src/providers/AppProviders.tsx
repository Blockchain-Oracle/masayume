"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { SOMNIA_SHANNON } from "@masayume/markets/chain";
import { MarketsProvider } from "@masayume/markets/react";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { BRAND } from "@/lib/copy";
import { webEnv } from "@/lib/env";
import { MarketsBoot } from "./MarketsBoot";
import { createQueryClient } from "./query-client";
import { rainbowKitTheme } from "./rainbowkit-theme";
import { SignerBridge } from "./SignerBridge";
import { wagmiConfig } from "./wagmi";

/** Client composition root: wallet session → query cache → wallet UI → chain port → signer handoff → boot gate. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowKitTheme} initialChain={SOMNIA_SHANNON} modalSize="compact" appInfo={{ appName: BRAND.name }}>
          <MarketsProvider env={webEnv.markets}>
            <SignerBridge />
            <MarketsBoot>{children}</MarketsBoot>
          </MarketsProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
