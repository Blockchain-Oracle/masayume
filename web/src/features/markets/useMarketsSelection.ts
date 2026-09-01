"use client";

import type { EventMarket, Lane, LaneSet, MarketId, Side } from "@masayume/core/types";
import { marketDeepLink } from "@masayume/core/urls";
import { useCallback } from "react";
import { findMarket, useResolveDeepLink } from "@/lib/deep-link";

/** What the hero and the Ticket render from — the URL is the source of truth, so a share link reproduces it exactly. */
export interface MarketsSelection {
  marketId: MarketId | null;
  side: Side | null;
  market: EventMarket | null;
  /** Chain-corrected clock, ticking; 0 before the first client tick. */
  nowMs: number;
  /** True while a deep link is still being resolved against the chain. */
  resolving: boolean;
}

export interface MarketsSelectionApi {
  selection: MarketsSelection;
  setSelection: (marketId: MarketId, side?: Side) => void;
}

/** Deep link → pinned lane's soonest Window → first live Window. */
export function useMarketsSelection(lanes: LaneSet | null, activeLane: Lane | null, nowMs: number): MarketsSelectionApi {
  const resolved = useResolveDeepLink(lanes, nowMs);
  const fallback = activeLane?.markets[0] ?? lanes?.lanes[0]?.markets[0] ?? null;
  const market = resolved.market ?? findMarket(lanes, resolved.marketId) ?? fallback;

  const setSelection = useCallback(
    (marketId: MarketId, side?: Side) => {
      const dir = side ?? resolved.side ?? undefined;
      window.history.replaceState(null, "", marketDeepLink({ marketId, dir }));
    },
    [resolved.side],
  );

  return {
    selection: { marketId: market?.marketId ?? null, side: resolved.side, market, nowMs, resolving: resolved.resolving },
    setSelection,
  };
}
