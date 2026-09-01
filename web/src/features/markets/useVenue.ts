"use client";

import { isOk, type Reading } from "@masayume/core/schemas";
import type { Bytes32 } from "@masayume/core/types";
import { useMarketsBoot, type MarketsBoot } from "@masayume/markets/react";
import { webEnv } from "@/lib/env";

export interface VenueContext {
  boot: Reading<MarketsBoot> | null;
  /** Null until the boot read answers or when no venue has live rows. */
  venueId: Bytes32 | null;
  /** Collateral decimals read from chain; null until known — never a guessed 6. */
  decimals: number | null;
  clockOffsetMs: number;
}

/** The three boot facts every markets surface needs: live venue id, collateral decimals, chain clock offset. */
export function useVenue(): VenueContext {
  const boot = useMarketsBoot(webEnv.markets);
  const value = boot && isOk(boot) ? boot.value : null;
  return {
    boot,
    venueId: value?.venue.venueId ?? null,
    decimals: value?.collateral.decimals ?? null,
    clockOffsetMs: value?.clock.offsetMs ?? 0,
  };
}
