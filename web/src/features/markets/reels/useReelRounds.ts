"use client";

import { isEnterable, phase, type MarketPhase } from "@masayume/core/lifecycle";
import type { EventMarket, LaneSet } from "@masayume/core/types";
import { useRef } from "react";

/**
 * Windows in the reel, across every cadence, soonest bell first.
 *
 * Yosuku keeps a round while `expiry - now > minMintMs(cadence) * 0.6` — a heuristic
 * for "there is still time to get in". The same rule already lives in core as the
 * no-entry buffer, so the reel derives from `phase()` like every other surface
 * rather than carrying a second copy of the cutoff. A Window inside the buffer stays
 * on screen and says it is closing; one that has locked is gone.
 */
const IN_REEL: ReadonlySet<MarketPhase> = new Set<MarketPhase>(["pendingOpeningPrint", "trading", "noEntryBuffer"]);

export function reelPhase(market: EventMarket, nowMs: number): MarketPhase {
  return phase(market, nowMs);
}

/** True once the Window stops taking entries — the card keeps its frame and says so. */
export function isClosing(marketPhase: MarketPhase): boolean {
  return !isEnterable(marketPhase) && IN_REEL.has(marketPhase);
}

function sameIds(a: readonly EventMarket[], b: readonly EventMarket[]): boolean {
  return a.length === b.length && a.every((market, i) => market.marketId === b[i]!.marketId);
}

/**
 * The clock ticks every second, so recomputing this list would hand the feed a new
 * array every second and remount every card's chart. The previous array is kept
 * while the membership and order are unchanged — but only for as long as it came
 * from the lane set still in hand, so a refetched Window is never rendered from the
 * copy the last poll returned.
 */
export function useReelRounds(laneSet: LaneSet | null, nowMs: number): EventMarket[] {
  const held = useRef<{ from: LaneSet | null; rounds: EventMarket[] }>({ from: null, rounds: [] });
  const next =
    laneSet === null || nowMs === 0
      ? []
      : laneSet.lanes
          .flatMap((lane) => lane.markets)
          .filter((market) => IN_REEL.has(phase(market, nowMs)))
          .sort((a, b) => a.expirySec - b.expirySec);
  if (held.current.from !== laneSet || !sameIds(held.current.rounds, next)) {
    held.current = { from: laneSet, rounds: next };
  }
  return held.current.rounds;
}
