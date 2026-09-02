"use client";

import type { WalletHistory } from "@masayume/core/projection";
import type { Reading } from "@masayume/core/schemas";
import type { Address } from "@masayume/core/types";
import { keys, useWalletHistory } from "@masayume/markets/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useWalletSession } from "@/lib/wallet-session";

export interface HistoryReading {
  address: Address | null;
  reading: Reading<WalletHistory> | null;
  retry: () => void;
}

/** The connected wallet's projection plus the retry every boundary hands its error state. */
export function useHistoryReading(): HistoryReading {
  const { address } = useWalletSession();
  const reading = useWalletHistory(address);
  const queryClient = useQueryClient();
  const retry = useCallback(() => {
    if (address) void queryClient.invalidateQueries({ queryKey: keys.history(address) });
  }, [address, queryClient]);
  return { address, reading, retry };
}
