"use client";

import type { EventMarket, MarketId, Side } from "@masayume/core/types";
import { ORACLE_PRICE_SCALE } from "@masayume/markets/identity";
import { Countdown, Money } from "@/components/data";
import { formatCadence, MARKETS, plainQuestion } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { OddsChips } from "./OddsChips";

interface MarketRowProps {
  market: EventMarket;
  nowMs: number;
  selected: boolean;
  selectedSide: Side | null;
  onSelect: (marketId: MarketId, side?: Side) => void;
}

/** One live Window: asset · cadence · countdown · the question · the numbers the official app hides · UP/DOWN at the top of book. */
export function MarketRow({ market, nowMs, selected, selectedSide, onSelect }: MarketRowProps) {
  const question = plainQuestion(market, ORACLE_PRICE_SCALE);
  return (
    <li
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex flex-col gap-3 rounded-(--market-card-radius) border bg-(--market-card-surface) p-4",
        selected ? "border-gold-dim" : "border-(--market-card-border)",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => onSelect(market.marketId)} className="flex min-h-touch items-baseline gap-2 text-left">
          <span className="type-title text-ink">{market.asset}</span>
          <span className="type-label-micro text-ink-secondary">{formatCadence(market.intervalSec)}</span>
        </button>
        <Countdown expirySec={market.expirySec} intervalSec={market.intervalSec} nowMs={nowMs} className="type-data-lg" />
      </div>
      <p className={cn("type-caption", question.pending ? "text-ink-muted" : "text-ink-secondary")}>{question.text}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="type-caption text-ink-secondary">
          <Money value={market.volumeQuoteRaw} decimals={market.decimals} /> {MARKETS.volume} · <span className="numbers">{MARKETS.trades(market.tradeCount)}</span>
        </span>
        <OddsChips market={market} selectedSide={selected ? selectedSide : null} onSelect={onSelect} />
      </div>
    </li>
  );
}
