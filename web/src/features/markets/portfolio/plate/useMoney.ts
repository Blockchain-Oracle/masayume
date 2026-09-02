"use client";

import { isOk } from "@masayume/core/schemas";
import type { Address } from "@masayume/core/types";
import { shortHex } from "@masayume/core/units";
import { useVaultSnapshot } from "@masayume/markets/react";
import { useXGrant, useXStatus } from "@/features/x";
import { useWalletSession } from "@/lib/wallet-session";
import { useBalancePlate } from "../../balance";
import { PLATE } from "./copy";

export type PoolId = "x" | "private";

/** Ported from `lib/portfolio/useMoney.ts`: one sentence per pool, saying what it is for and who can move it. */
export interface Pool {
  id: PoolId;
  label: string;
  note: string;
  /** null renders as a placeholder rather than a fake 0.00. */
  amountBase: bigint | null;
  action: { label: string; href: string } | null;
  /** Rendered instead of the action when the user cannot act from where they are. */
  blockedReason: string | null;
}

export interface Money {
  address: Address | null;
  decimals: number;
  /** Wallet + Trading Balance: a bet routes to either, so this is the honest "can bet now". */
  readyToBetBase: bigint;
  walletBase: bigint;
  accountBase: bigint;
  /** False while either half is still loading: render pending, never assert a wrong number. */
  totalReady: boolean;
  totalUnknown: boolean;
  pools: Pool[];
}

/** Every pool the wallet owns, read once, so the plate and the rows cannot disagree. */
export function useMoney(): Money {
  const { address } = useWalletSession();
  const plate = useBalancePlate();
  const vault = useVaultSnapshot(address);
  const x = useXStatus();
  const xGrant = useXGrant();

  const reading = plate.kind === "connected" ? plate.reading : null;
  const sheet = reading && isOk(reading) ? reading.value : null;
  const snapshot = vault && isOk(vault) ? vault.value : null;
  const decimals = sheet?.decimals ?? snapshot?.decimals ?? 6;
  const walletBase = sheet?.spendableBase ?? 0n;
  const accountBase = sheet?.vaultBase ?? 0n;

  const pools: Pool[] = [];
  if (address) {
    const binding = x.status?.binding ?? null;
    const budget = xGrant.grant?.budgetBase ?? null;
    pools.push({
      id: "x",
      label: PLATE.pools.x.label,
      note: PLATE.pools.x.note,
      amountBase: budget ?? (xGrant.deployed ? 0n : null),
      action: x.walletMismatch || !binding ? null : { label: PLATE.pools.x.manage, href: "/trade-from-x" },
      blockedReason:
        x.walletMismatch && binding
          ? PLATE.pools.x.mismatch(shortHex(binding.wallet))
          : !binding && (budget === null || budget === 0n)
            ? PLATE.pools.x.unlinked
            : null,
    });
    if (snapshot && snapshot.account.privateAvailableBase > 0n) {
      pools.push({
        id: "private",
        label: PLATE.pools.private.label,
        note: PLATE.pools.private.note,
        amountBase: snapshot.account.privateAvailableBase,
        action: null,
        blockedReason: null,
      });
    }
  }

  return {
    address,
    decimals,
    readyToBetBase: walletBase + accountBase,
    walletBase,
    accountBase,
    totalReady: sheet !== null,
    totalUnknown: reading !== null && !reading.ok,
    pools,
  };
}
