"use client";

import type { EventMarket, Lane } from "@masayume/core/types";
import { cn } from "@/lib/utils";
import { assetMark } from "./asset-mark";
import { HeroCadenceTabs } from "./HeroCadenceTabs";
import { HeroQuestion } from "./HeroQuestion";
import { HeroSettlesIn } from "./HeroSettlesIn";

export interface HeroChartHeadProps {
  market: EventMarket;
  openingRaw: bigint | null;
  currentRaw: bigint | null;
  nowMs: number;
  lanes: readonly Lane[];
  activeIntervalSec: number | null;
  pinnedMissingIntervalSec: number | null;
  onPin: (intervalSec: number) => void;
}

/** Asset, lane length, the question, and the clock — everything you need before choosing a side. */
export function HeroChartHead({
  market,
  openingRaw,
  currentRaw,
  nowMs,
  lanes,
  activeIntervalSec,
  pinnedMissingIntervalSec,
  onPin,
}: HeroChartHeadProps) {
  const mark = assetMark(market.asset);
  return (
    <div className="hero-chart-head">
      <div>
        <div className="mh-asset-row">
          <span aria-hidden className={cn("mh-asset-badge", mark.variant)}>
            {mark.glyph}
          </span>
          <span className="mh-asset-label">{market.asset}</span>
          <HeroCadenceTabs
            lanes={lanes}
            activeIntervalSec={activeIntervalSec}
            pinnedMissingIntervalSec={pinnedMissingIntervalSec}
            onPin={onPin}
          />
        </div>
        <HeroQuestion asset={market.asset} openingRaw={openingRaw} currentRaw={currentRaw} />
      </div>
      <HeroSettlesIn expirySec={market.expirySec} intervalSec={market.intervalSec} nowMs={nowMs} />
    </div>
  );
}
