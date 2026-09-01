"use client";

import { SubmitterSessionProvider } from "@masayume/markets/react";
import type { ReactNode } from "react";
import { useWalletClient } from "wagmi";
import { webEnv } from "@/lib/env";
import { useWalletSession } from "@/lib/wallet-session";

/**
 * Hands wagmi's wallet client to a signing session — and only while the wallet is on Somnia
 * Shannon, so a wrong-chain wallet can never sign a venue write.
 *
 * This replaces the old global `bindSigner` handoff. The difference that matters: switching
 * account or chain disposes the session rather than swapping a signer inside a shared object,
 * so authority ends when the session ends.
 */
export function UserSessionProvider({ children }: { children: ReactNode }) {
  const { data: walletClient } = useWalletClient();
  const { isRightChain } = useWalletSession();

  return (
    <SubmitterSessionProvider env={webEnv.markets} walletClient={walletClient} enabled={isRightChain}>
      {children}
    </SubmitterSessionProvider>
  );
}
