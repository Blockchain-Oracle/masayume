"use client";

import type { Lane, MarketId, Side } from "@masayume/core/types";
import { MarketRow } from "./MarketRow";

interface LaneRowsProps {
  lane: Lane;
  nowMs: number;
  selectedMarketId: MarketId | null;
  selectedSide: Side | null;
  onSelect: (marketId: MarketId, side?: Side) => void;
}

/** Soonest-to-expire first; keyed by marketId, never by the recycled pool. */
export function LaneRows({ lane, nowMs, selectedMarketId, selectedSide, onSelect }: LaneRowsProps) {
  return (
    <ul className="flex flex-col gap-3">
      {lane.markets.map((market) => (
        <MarketRow
          key={market.marketId}
          market={market}
          nowMs={nowMs}
          selected={market.marketId === selectedMarketId}
          selectedSide={selectedSide}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
