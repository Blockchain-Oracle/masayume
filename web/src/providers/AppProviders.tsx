"use client";

import { MarketsProvider } from "@masayume/markets/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { webEnv } from "@/lib/env";
import { createQueryClient } from "./query-client";

/** Client composition root. The wallet session (wagmi + RainbowKit) and the signer bridge slot in here in Story 1.5. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <MarketsProvider env={webEnv.markets}>{children}</MarketsProvider>
    </QueryClientProvider>
  );
}
