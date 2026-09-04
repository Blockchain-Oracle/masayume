"use client";

import type { GrantTerms, TxOutcome } from "@masayume/core/ports";
import { diagnosisCopy } from "@masayume/core/copy";
import { formatBaseUnits } from "@masayume/core/units";
import type { VaultGrant } from "@masayume/core/vault";
import { invalidateAfterWrite, useSigner, useSubmitter, useVaultSnapshot } from "@masayume/markets/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { X_CARD, X_HANDLE } from "./copy";

/** The EXECUTOR grant's shape when it is created from the X surfaces (reference: `maxMargin = what you fund this round`). */
export const X_GRANT = { openWindows: 8, days: 30 } as const;

export type XGrantBusy = "" | "fund" | "cashout";

export interface XGrantState {
  /** null while unread; the vault's own reading says whether it is deployed here. */
  deployed: boolean | null;
  decimals: number;
  /** The live EXECUTOR grant for this wallet, or null. */
  grant: VaultGrant | null;
  /** What mentions can still spend — the grant's budget. */
  balanceBase: bigint | null;
  availableBase: bigint | null;
  busy: XGrantBusy;
  error: string;
  ok: string;
  fund: (amountBase: bigint, executor: string | null) => Promise<void>;
  cashOut: () => Promise<void>;
  clear: () => void;
}

function outcomeError(outcome: TxOutcome): string | null {
  if (outcome.status === "confirmed") return null;
  return diagnosisCopy(outcome.diagnosis.kind).headline;
}

/**
 * The X betting balance, as an EXECUTOR grant on the EventVault: fund = deposit + grant in one
 * transaction the first time (then deposit + top-up), cash out = revoke, which returns the
 * budget to the wallet's Trading Balance rather than to the wallet itself.
 */
export function useXGrant(): XGrantState {
  const { address } = useSigner();
  const submitter = useSubmitter();
  const queryClient = useQueryClient();
  const snapshot = useVaultSnapshot(address);
  const [busy, setBusy] = useState<XGrantBusy>("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const value = snapshot && snapshot.ok ? snapshot.value : null;
  const deployed = snapshot && snapshot.ok ? value !== null : null;
  const decimals = value?.decimals ?? 6;
  const grant = value?.grants.executor ?? null;
  const live = grant && !grant.revoked && grant.expiresAtSec * 1000 > Date.now() ? grant : null;

  const clear = useCallback(() => {
    setError("");
    setOk("");
  }, []);

  const fund = useCallback(
    async (amountBase: bigint, executor: string | null) => {
      if (!submitter || !address || busy) return;
      clear();
      if (!deployed) return setError(X_CARD.notDeployed);
      if (!executor) return setError(X_CARD.noExecutor);
      if (amountBase <= 0n) return setError(X_CARD.enterAmount);
      setBusy("fund");
      try {
        const caps = { maxStakePerTradeBase: amountBase, maxDailySpendBase: amountBase, maxOpenPositions: X_GRANT.openWindows, maxPriceRaw: 0n };
        const expiresAtSec = Math.floor(Date.now() / 1000) + X_GRANT.days * 86_400;
        const terms: GrantTerms = { kind: "executor", actor: executor as GrantTerms["actor"], caps, expiresAtSec, budgetBase: amountBase };
        if (live && live.actor === executor.toLowerCase()) {
          const deposit = await submitter.submitTx({ kind: "vault-deposit", amountBase });
          const failed = outcomeError(deposit);
          if (failed) throw new Error(failed);
          const topUp = await submitter.submitTx({ kind: "vault-fund-grant", grantId: live.grantId, amountBase });
          const failedTopUp = outcomeError(topUp);
          if (failedTopUp) throw new Error(failedTopUp);
        } else {
          const outcome = await submitter.submitTx({ kind: "vault-deposit-and-grant", amountBase, terms });
          const failed = outcomeError(outcome);
          if (failed) throw new Error(failed);
        }
        setOk(X_CARD.funded(formatBaseUnits(amountBase, decimals), X_HANDLE));
        await invalidateAfterWrite(queryClient, { wallet: address });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setBusy("");
      }
    },
    [submitter, address, busy, deployed, live, decimals, queryClient, clear],
  );

  const cashOut = useCallback(async () => {
    if (!submitter || !address || busy) return;
    clear();
    if (!live || live.budgetBase <= 0n) return setError(X_CARD.nothingToCashOut);
    setBusy("cashout");
    try {
      const outcome = await submitter.submitTx({ kind: "vault-revoke", grantId: live.grantId });
      const failed = outcomeError(outcome);
      if (failed) throw new Error(failed);
      setOk(X_CARD.cashedOut(formatBaseUnits(live.budgetBase, decimals)));
      await invalidateAfterWrite(queryClient, { wallet: address });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy("");
    }
  }, [submitter, address, busy, live, decimals, queryClient, clear]);

  return {
    deployed,
    decimals,
    grant: live,
    balanceBase: live ? live.budgetBase : deployed ? 0n : null,
    availableBase: value ? value.account.availableBase : null,
    busy,
    error,
    ok,
    fund,
    cashOut,
    clear,
  };
}
