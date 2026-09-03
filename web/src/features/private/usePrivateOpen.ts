"use client";

import { formatCadence } from "@masayume/core/copy";
import { privateOpenMessage, type PrivateOpenRequest, type PrivateOpenResult } from "@masayume/core/private";
import type { Address, EventMarket, Side } from "@masayume/core/types";
import { formatBaseUnits } from "@masayume/core/units";
import { invalidateAfterWrite } from "@masayume/markets/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useSignMessage } from "wagmi";
import { useWalletSession } from "@/lib/wallet-session";
import { upsertPrivateTicket } from "./claims-store";

export interface PrivateOpenInput {
  market: EventMarket;
  side: Side;
  stakeBase: bigint;
  /** The guard against a book that moved since the quote: fewer contracts than this and the desk refunds. */
  minQuantityRaw: bigint;
  symbol: string;
}

async function post(body: PrivateOpenRequest): Promise<PrivateOpenResult> {
  const res = await fetch("/api/private/open", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => null)) as (PrivateOpenResult & { error?: string }) | { error?: string } | null;
  if (!res.ok || !json || !("status" in json)) throw new Error((json && "error" in json && json.error) || `private route answered ${res.status}`);
  return json;
}

/**
 * The private open: one wallet signature over a message that names the bet, then the desk does the rest.
 * The signature is also the secret the bet's three keys derive from, so a reply that never arrived is
 * answered by sending the same request again — `retry` re-posts the last authorisation, nothing is re-signed.
 */
export function usePrivateOpen() {
  const { signMessageAsync } = useSignMessage();
  const { address } = useWalletSession();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const last = useRef<PrivateOpenRequest | null>(null);

  const send = useCallback(
    async (body: PrivateOpenRequest): Promise<PrivateOpenResult> => {
      setBusy(true);
      try {
        const result = await post(body);
        if (result.status === "opened") upsertPrivateTicket(result.ticket);
        if (result.status !== "unknown") await invalidateAfterWrite(queryClient, { wallet: body.owner as Address, marketId: body.marketId as EventMarket["marketId"] });
        return result;
      } finally {
        setBusy(false);
      }
    },
    [queryClient],
  );

  const open = useCallback(
    async ({ market, side, stakeBase, minQuantityRaw, symbol }: PrivateOpenInput): Promise<PrivateOpenResult | null> => {
      if (!address) return null;
      const issuedAtMs = Date.now();
      const message = privateOpenMessage({
        owner: address,
        marketId: market.marketId,
        asset: market.asset,
        cadenceText: formatCadence(market.intervalSec),
        expirySec: market.expirySec,
        side,
        stakeText: formatBaseUnits(stakeBase, market.decimals),
        symbol,
        issuedAtMs,
      });
      const signature = await signMessageAsync({ message });
      const body: PrivateOpenRequest = { owner: address, marketId: market.marketId, side, stakeBase: stakeBase.toString(), minQuantityRaw: minQuantityRaw.toString(), issuedAtMs, signature };
      last.current = body;
      return send(body);
    },
    [address, signMessageAsync, send],
  );

  const retry = useCallback(() => (last.current ? send(last.current) : Promise.resolve(null)), [send]);

  return { open, retry, busy, canRetry: last.current !== null };
}
