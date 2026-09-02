"use client";

import type { StrategySubscription } from "@masayume/core/strategies";
import type { VaultGrant, VaultSnapshot } from "@masayume/core/vault";
import { isOk, type Reading } from "@masayume/core/schemas";
import type { Address } from "@masayume/core/types";
import { useMemo } from "react";
import type { StrategiesPayload, StrategyWire } from "./protocol";
import { useMySubscriptions, useStrategyHealth } from "./useStrategies";

export interface DeskModel {
  /** The house desk: the active strategy with the most copiers, ties to the oldest. */
  featured: StrategyWire | null;
  subscriptions: StrategySubscription[];
  subscriptionOf: (strategyId: string) => StrategySubscription | null;
  /** The wallet's live STRATEGY grant when it backs the featured subscription. */
  grant: VaultGrant | null;
  copying: boolean;
  paused: boolean;
  /** Consent on record but the grant names a runner the strategy no longer uses. */
  staleRunner: boolean;
  /** The desk balance: what the grant may still spend. */
  ledgerBase: bigint;
  availableBase: bigint;
  health: ReturnType<typeof useStrategyHealth>;
}

export function featuredOf(strategies: readonly StrategyWire[]): StrategyWire | null {
  return [...strategies].filter((s) => s.active).sort((a, b) => b.subscribers - a.subscribers || Number(BigInt(a.strategyId) - BigInt(b.strategyId)))[0] ?? null;
}

export function useDesk(payload: StrategiesPayload | null, wallet: Address | null, snapshot: Reading<VaultSnapshot | null> | null): DeskModel {
  const strategies = payload?.strategies ?? [];
  const ids = useMemo(() => strategies.map((s) => BigInt(s.strategyId)), [strategies]);
  const subsReading = useMySubscriptions(wallet, ids);
  const subscriptions = subsReading && isOk(subsReading) ? subsReading.value : [];
  const health = useStrategyHealth(strategies.map((s) => s.strategyId));
  const featured = featuredOf(strategies);
  const vault = snapshot && isOk(snapshot) ? snapshot.value : null;
  const strategyGrant = vault?.grants.strategy ?? null;

  const subscriptionOf = (strategyId: string) => subscriptions.find((s) => s.strategyId.toString() === strategyId) ?? null;
  const mine = featured ? subscriptionOf(featured.strategyId) : null;
  const grant = mine && strategyGrant && strategyGrant.grantId === mine.grantId ? strategyGrant : null;
  const copying = Boolean(mine?.live);
  const paused = Boolean(mine && !mine.live);
  const staleRunner = Boolean(mine && grant && featured && grant.actor !== featured.runner);

  return {
    featured,
    subscriptions,
    subscriptionOf,
    grant,
    copying,
    paused,
    staleRunner,
    ledgerBase: grant?.budgetBase ?? 0n,
    availableBase: vault?.account.availableBase ?? 0n,
    health,
  };
}
