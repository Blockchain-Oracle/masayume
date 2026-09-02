"use client";

import type { TxOutcome } from "@masayume/core/ports";
import type { StrategyIntent } from "@masayume/core/strategies";
import type { Address } from "@masayume/core/types";
import type { VaultCaps } from "@masayume/core/vault";
import { isOk } from "@masayume/core/schemas";
import { invalidateAfterWrite, useSubmitter, useVaultSnapshot } from "@masayume/markets/react";
import { getClient } from "@masayume/markets/runtime";
import { submitStrategyTx } from "@masayume/markets/strategies";
import { getVaultSnapshot, resolveVaultDeployment, type VaultContracts } from "@masayume/markets/vault";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { PublicClient } from "viem";
import { webEnv } from "@/lib/env";
import { useOwnerWalletClient } from "@/providers/UserSessionProvider";
import { useWalletSession } from "@/lib/wallet-session";
import { useRefreshStrategies } from "./useStrategies";

export type DeskBusy = "join" | "add" | "withdraw" | "caps" | "pause" | "resume" | "publish" | null;

export interface DeskWriteResult {
  ok: boolean;
  txHash?: `0x${string}`;
  reason?: string;
}

const GRANT_TTL_SEC = 30 * 24 * 3600;

function failed(outcome: TxOutcome): DeskWriteResult {
  if (outcome.status === "confirmed") return { ok: true, txHash: outcome.txHash };
  return { ok: false, reason: outcome.diagnosis.technical, ...("txHash" in outcome && outcome.txHash ? { txHash: outcome.txHash } : {}) };
}

/**
 * Every desk action, each its own small transaction. Joining is two signatures on this chain —
 * the vault's `depositAndGrant` (fund + limits, one call) and the registry's `subscribe` — the
 * reference composed both into one PTB, which the EVM cannot do without a batching contract.
 */
export function useDeskWrites() {
  const submitter = useSubmitter();
  const walletClient = useOwnerWalletClient();
  const { address } = useWalletSession();
  const snapshot = useVaultSnapshot(address);
  const queryClient = useQueryClient();
  const refresh = useRefreshStrategies();
  const [busy, setBusy] = useState<DeskBusy>(null);

  const contracts = useCallback((): VaultContracts | null => {
    if (!walletClient) return null;
    return { walletClient, publicClient: getClient().getViemClient() as PublicClient, deployment: resolveVaultDeployment(webEnv.markets) };
  }, [walletClient]);

  const registry = useCallback(
    async (intent: StrategyIntent): Promise<DeskWriteResult> => {
      if (!submitter || !address) return { ok: false, reason: "connect a wallet first" };
      const c = contracts();
      if (!c) return { ok: false, reason: "wallet is not on Somnia Shannon" };
      return failed(await submitStrategyTx({ journal: submitter.journal, wallet: address, contracts: c }, intent));
    },
    [submitter, address, contracts],
  );

  const settle = useCallback(async () => {
    if (address) await invalidateAfterWrite(queryClient, { wallet: address });
    refresh();
  }, [address, queryClient, refresh]);

  const run = useCallback(
    async <T,>(kind: DeskBusy, body: () => Promise<T>): Promise<T> => {
      setBusy(kind);
      try {
        return await body();
      } finally {
        setBusy(null);
        await settle();
      }
    },
    [settle],
  );

  /** The id of the live STRATEGY grant after a grant write — one live per kind, so the slot is the answer. */
  const liveStrategyGrantId = useCallback(async (): Promise<bigint | null> => {
    if (!address) return null;
    const fresh = await getVaultSnapshot(address);
    return isOk(fresh) && fresh.value ? (fresh.value.grants.strategy?.grantId ?? null) : null;
  }, [address]);

  /** Fund + limits (one vault call), then consent on the registry. */
  const join = useCallback(
    (input: { strategyId: bigint; runner: Address; depositBase: bigint; budgetBase: bigint; caps: VaultCaps; feeBase: bigint }) =>
      run("join", async (): Promise<DeskWriteResult> => {
        if (!submitter || !address) return { ok: false, reason: "connect a wallet first" };
        const terms = { kind: "strategy" as const, actor: input.runner, caps: input.caps, expiresAtSec: Math.floor(Date.now() / 1000) + GRANT_TTL_SEC, budgetBase: input.budgetBase };
        const granted = await submitter.submitTx(
          input.depositBase > 0n ? { kind: "vault-deposit-and-grant", amountBase: input.depositBase, terms } : { kind: "vault-grant", terms },
        );
        if (granted.status !== "confirmed") return failed(granted);
        const grantId = await liveStrategyGrantId();
        if (grantId === null) return { ok: false, reason: "the grant landed but could not be read back; try subscribing again", txHash: granted.txHash };
        return registry({ kind: "strategy-subscribe", strategyId: input.strategyId, grantId, feeBase: input.feeBase });
      }),
    [run, submitter, address, liveStrategyGrantId, registry],
  );

  /** Pause stops new copies: the grant is revoked (budget back to the Vault), then the consent record closes. */
  const pause = useCallback(
    (strategyId: bigint, grantId: bigint) =>
      run("pause", async (): Promise<DeskWriteResult> => {
        if (!submitter) return { ok: false, reason: "connect a wallet first" };
        const revoked = await submitter.submitTx({ kind: "vault-revoke", grantId });
        if (revoked.status !== "confirmed") return failed(revoked);
        return registry({ kind: "strategy-unsubscribe", strategyId });
      }),
    [run, submitter, registry],
  );

  /** Add to the desk: the deposit lands in the Vault, then tops the live grant's budget. */
  const addMoney = useCallback(
    (grantId: bigint, amountBase: bigint) =>
      run("add", async (): Promise<DeskWriteResult> => {
        if (!submitter) return { ok: false, reason: "connect a wallet first" };
        const deposited = await submitter.submitTx({ kind: "vault-deposit", amountBase });
        if (deposited.status !== "confirmed") return failed(deposited);
        return failed(await submitter.submitTx({ kind: "vault-fund-grant", grantId, amountBase }));
      }),
    [run, submitter],
  );

  /** Taking money off the desk revokes the grant first (the budget is the desk), then pays the owner. */
  const withdraw = useCallback(
    (grantId: bigint | null, amountBase: bigint) =>
      run("withdraw", async (): Promise<DeskWriteResult> => {
        if (!submitter) return { ok: false, reason: "connect a wallet first" };
        if (grantId !== null) {
          const revoked = await submitter.submitTx({ kind: "vault-revoke", grantId });
          if (revoked.status !== "confirmed") return failed(revoked);
        }
        return failed(await submitter.submitTx({ kind: "vault-withdraw", amountBase }));
      }),
    [run, submitter],
  );

  const publish = useCallback(
    (intent: Extract<StrategyIntent, { kind: "strategy-publish" }>) => run("publish", () => registry(intent)),
    [run, registry],
  );

  return { busy, join, pause, addMoney, withdraw, publish, snapshot, address, canSign: Boolean(submitter && walletClient) };
}
