import { CLOCK_RESYNC_MS } from "@masayume/core/constants";
import { combineReadings, mapReading, type Reading } from "@masayume/core/schemas";
import type { ClockSync } from "@masayume/core/types";
import { loadCollateral, type CollateralInfo } from "../collateral";
import type { MarketsEnv } from "../env";
import { syncClock } from "../provider/clock-sync";
import { resolveVenueId, type VenueResolution } from "../venue";
import { keys } from "./keys";
import { useReadingQuery } from "./useReadingQuery";

export interface MarketsBoot {
  clock: ClockSync;
  collateral: CollateralInfo;
  venue: VenueResolution;
}

/** The three reads every screen needs before its first number: chain clock, collateral decimals, and the live venue id. */
export async function bootMarkets(env: MarketsEnv): Promise<Reading<MarketsBoot>> {
  const [clock, collateral, venue] = await Promise.all([syncClock(), loadCollateral(), resolveVenueId(env.venueId)]);
  return mapReading(combineReadings(combineReadings(clock, collateral), venue), ([[c, col], v]) => ({ clock: c, collateral: col, venue: v }));
}

export function useMarketsBoot(env: MarketsEnv): Reading<MarketsBoot> | null {
  return useReadingQuery(keys.boot(), () => bootMarkets(env), { pollMs: CLOCK_RESYNC_MS });
}
