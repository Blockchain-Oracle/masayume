"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { SOMNIA_SHANNON } from "@masayume/markets/chain";
import { MarketsProvider } from "@masayume/markets/react";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { AlertsWatcher } from "@/features/alerts";
import { BRAND } from "@/lib/copy";
import { webEnv } from "@/lib/env";
import { MarketsBoot } from "./MarketsBoot";
import { createQueryClient } from "./query-client";
import { rainbowKitTheme } from "./rainbowkit-theme";
import { UserSessionProvider } from "./UserSessionProvider";
import { wagmiConfig } from "./wagmi";

/** Client composition root: wallet session → query cache → wallet UI → shared read runtime → isolated signing session → boot gate. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowKitTheme} initialChain={SOMNIA_SHANNON} modalSize="compact" appInfo={{ appName: BRAND.name }}>
          <MarketsProvider env={webEnv.markets}>
            <UserSessionProvider>
              <MarketsBoot>
                {/* The price-alert evaluator: one watch per asset with a pending rule, on the shared read runtime. */}
                <AlertsWatcher />
                {children}
              </MarketsBoot>
            </UserSessionProvider>
          </MarketsProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
