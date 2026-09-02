"use client";

import type { MarketId } from "@masayume/core/types";
import { getMakerUnsettledExpired } from "@masayume/markets/maker";
import { invalidateAfterWrite, useSubmitter } from "@masayume/markets/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { diagnosisCopy } from "@/lib/copy";
import { useWalletSession } from "@/lib/wallet-session";
import { EARN } from "./copy";

export type EarnBusy = "supply" | "withdraw" | `merge:${string}` | `settle:${string}`;

/** Every vault write from the page through the session's lane; every read the write can change is refetched afterwards. */
export function useEarnWrites() {
  const submitter = useSubmitter();
  const { address } = useWalletSession();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<EarnBusy | null>(null);
  const [msg, setMsg] = useState("");

  const refresh = useCallback(async () => {
    if (address) await invalidateAfterWrite(queryClient, { wallet: address });
    await queryClient.invalidateQueries({ queryKey: ["masayume", "makerVault"], exact: false });
  }, [address, queryClient]);

  const run = useCallback(
    async (key: EarnBusy, body: () => Promise<string | null>) => {
      setBusy(key);
      setMsg("");
      try {
        const failure = await body();
        setMsg(failure ?? EARN.supply.done);
      } catch (error) {
        setMsg(error instanceof Error ? error.message.slice(0, 120) : String(error));
      } finally {
        setBusy(null);
        await refresh();
      }
    },
    [refresh],
  );

  const outcomeMessage = (outcome: { status: string; diagnosis?: { kind: Parameters<typeof diagnosisCopy>[0]; technical: string } }): string | null => {
    if (outcome.status === "confirmed") return null;
    const copy = outcome.diagnosis ? diagnosisCopy(outcome.diagnosis.kind) : null;
    return copy ? `${copy.headline}: ${outcome.diagnosis?.technical.slice(0, 100) ?? copy.body}` : outcome.status;
  };

  const supply = useCallback(
    (amountBase: bigint) => {
      if (!submitter) return;
      void run("supply", async () => outcomeMessage(await submitter.submitTx({ kind: "maker-supply", amountBase })));
    },
    [submitter, run],
  );

  /** Settles a closed Window first when one blocks the exit (anyone may), then redeems the shares. */
  const withdraw = useCallback(
    (shares: bigint) => {
      if (!submitter) return;
      void run("withdraw", async () => {
        const stale = await getMakerUnsettledExpired();
        if (stale.ok && stale.value) {
          setMsg(EARN.position.settling);
          const settled = await submitter.submitTx({ kind: "maker-settle", marketId: stale.value });
          const failure = outcomeMessage(settled);
          if (failure) return failure;
        }
        return outcomeMessage(await submitter.submitTx({ kind: "maker-withdraw", shares }));
      });
    },
    [submitter, run],
  );

  const merge = useCallback(
    (marketId: MarketId) => {
      if (!submitter) return;
      void run(`merge:${marketId}`, async () => outcomeMessage(await submitter.submitTx({ kind: "maker-merge", marketId })));
    },
    [submitter, run],
  );

  const settle = useCallback(
    (marketId: MarketId) => {
      if (!submitter) return;
      void run(`settle:${marketId}`, async () => outcomeMessage(await submitter.submitTx({ kind: "maker-settle", marketId })));
    },
    [submitter, run],
  );

  return { supply, withdraw, merge, settle, busy, msg, canSign: submitter !== null };
}
