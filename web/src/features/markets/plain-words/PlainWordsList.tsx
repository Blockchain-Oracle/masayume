"use client";

import type { EventMarket, MarketId } from "@masayume/core/types";
import { QuestionRow } from "./QuestionRow";

interface PlainWordsListProps {
  markets: readonly EventMarket[];
  nowMs: number;
  selectedMarketId: MarketId | null;
}

export function PlainWordsList({ markets, nowMs, selectedMarketId }: PlainWordsListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {markets.map((market) => (
        <QuestionRow key={market.marketId} market={market} nowMs={nowMs} selected={market.marketId === selectedMarketId} />
      ))}
    </ul>
  );
}
