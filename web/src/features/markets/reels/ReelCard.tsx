"use client";

import type { EventMarket } from "@masayume/core/types";
import { useOpeningPrice } from "@masayume/markets/react";
import { REELS } from "@/lib/copy";
import { useOracleSpot } from "../hero/useOracleSpot";
import { ReelCall } from "./ReelCall";
import { ReelChart } from "./ReelChart";
import { ReelHead } from "./ReelHead";
import { ReelQuestion } from "./ReelQuestion";
import { isClosing, reelPhase } from "./useReelRounds";

interface ReelCardProps {
  market: EventMarket;
  /** Chain-corrected clock; 0 before the first client tick. */
  nowMs: number;
  /** False for a card more than one swipe away: it keeps its frame and skips its chart. */
  near: boolean;
}

/**
 * One Window as a framed portrait card — the question, the tape, and the call.
 *
 * Ported from `reference/yosuku/app/reels/page.tsx` (`ReelCard`, L57) over the
 * DreamDEX pipeline. Everything on it is a real read: the round comes from the live
 * lanes, the line is the on-chain opening print, the price is the feed the Window
 * settles on. Nothing here is a placeholder number.
 */
export function ReelCard({ market, nowMs, near }: ReelCardProps) {
  const opening = useOpeningPrice(market.marketId);
  // Not gated on `near`: the price read is keyed by asset, so every card on the same
  // asset shares one. Reading it everywhere costs nothing and means a card is never
  // showing "—" for a beat after it snaps in.
  const spotRaw = useOracleSpot(market.asset);
  const openingRaw = opening?.ok ? opening.value : market.openingPriceRaw;
  const closing = isClosing(reelPhase(market, nowMs));

  return (
    <article className="reel-card">
      <div aria-hidden className="reel-grain" />
      <div aria-hidden className="reel-heat" />

      <ReelHead market={market} nowMs={nowMs} />
      <ReelQuestion asset={market.asset} openingRaw={openingRaw} currentRaw={spotRaw} />

      <div className="reel-chart">
        {near ? (
          <ReelChart market={market} openingRaw={openingRaw} />
        ) : (
          <p className="reel-chart-holding">{REELS.swipeToRead}</p>
        )}
      </div>

      <ReelCall marketId={market.marketId} closing={closing} />
    </article>
  );
}
