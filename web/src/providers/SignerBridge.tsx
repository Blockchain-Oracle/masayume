"use client";

import { bindSigner } from "@masayume/markets";
import { useEffect } from "react";
import { useWalletClient } from "wagmi";
import { useWalletSession } from "@/lib/wallet-session";

/** Hands wagmi's wallet client to the SDK singleton — only while on Somnia Shannon, so a wrong-chain wallet can never sign a venue write. */
export function SignerBridge() {
  const { data: walletClient } = useWalletClient();
  const { isRightChain } = useWalletSession();

  useEffect(() => {
    bindSigner(walletClient && isRightChain ? walletClient : undefined);
  }, [walletClient, isRightChain]);

  return null;
}
