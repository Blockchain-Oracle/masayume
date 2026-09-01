"use client";

import type { Address } from "@masayume/core/types";
import { useSyncExternalStore } from "react";
import { signerAddress, subscribeExchange } from "../exchange";

export interface SignerState {
  address: Address | null;
  hasSigner: boolean;
}

const getSnapshot = (): Address | null => signerAddress() ?? null;
const getServerSnapshot = (): Address | null => null;

/** The signer the SDK will actually use — not wagmi's account; the two differ until SignerBridge hands the walletClient over. */
export function useSigner(): SignerState {
  const address = useSyncExternalStore(subscribeExchange, getSnapshot, getServerSnapshot);
  return { address, hasSigner: address !== null };
}
