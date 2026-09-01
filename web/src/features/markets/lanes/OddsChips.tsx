"use client";

import { isOk } from "@masayume/core/schemas";
import type { BookLevelView, EventMarket, MarketId, Side } from "@masayume/core/types";
import { useBook } from "@masayume/markets/react";
import { Odds } from "@/components/data";
import { Button } from "@/components/ui/button";
import { MARKETS } from "@/lib/copy";
import { cn } from "@/lib/utils";

const TOP_OF_BOOK = 1;

const SIDE_CLASSES: Record<Side, string> = {
  up: "border-(--button-up-border) text-(--button-up-ink) aria-pressed:bg-(--button-up-fill)",
  down: "border-(--button-down-border) text-(--button-down-ink) aria-pressed:bg-(--button-down-fill)",
};

const SIDE_WORD: Record<Side, string> = { up: MARKETS.up, down: MARKETS.down };

interface SideChipProps {
  side: Side;
  level: BookLevelView | null;
  hydrating: boolean;
  selected: boolean;
  onSelect: () => void;
}

/** The side word is always present; the price is what you pay for $1 on that side (own terms). */
function SideChip({ side, level, hydrating, selected, onSelect }: SideChipProps) {
  return (
    <Button variant="outline" size="sm" aria-pressed={selected} onClick={onSelect} className={cn("gap-2", SIDE_CLASSES[side])}>
      <span>{SIDE_WORD[side]}</span>
      {level ? <Odds bps={level.priceBps} /> : <span className="numbers text-ink-muted">{hydrating ? "…" : MARKETS.noBook}</span>}
    </Button>
  );
}

interface OddsChipsProps {
  market: EventMarket;
  selectedSide: Side | null;
  onSelect: (marketId: MarketId, side: Side) => void;
}

export function OddsChips({ market, selectedSide, onSelect }: OddsChipsProps) {
  const book = useBook({ marketId: market.marketId, poolAddress: market.poolAddress, decimals: market.decimals }, TOP_OF_BOOK);
  const depth = book && isOk(book) ? book.value : null;
  return (
    <div className="flex gap-2" role="group" aria-label={`${market.asset} sides`}>
      <SideChip side="up" level={depth?.upAsks[0] ?? null} hydrating={book === null} selected={selectedSide === "up"} onSelect={() => onSelect(market.marketId, "up")} />
      <SideChip side="down" level={depth?.downAsks[0] ?? null} hydrating={book === null} selected={selectedSide === "down"} onSelect={() => onSelect(market.marketId, "down")} />
    </div>
  );
}
