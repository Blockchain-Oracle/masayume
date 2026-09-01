"use client";

import { ChevronUpIcon, FeatherIcon } from "lucide-react";
import { useRef, useState } from "react";
import { REELS } from "@/lib/copy";
import { useChainNowMs } from "../useChainNow";
import { useLanesState } from "../lanes";
import { useVenue } from "../useVenue";
import { ReelCard } from "./ReelCard";
import { ReelHolding } from "./ReelHolding";
import { useActiveReel } from "./useActiveReel";
import { useReelRounds } from "./useReelRounds";

/** A real move, not the first stray pixel of momentum — the reference's own correction. */
const SCROLLED_PX = 60;

/**
 * The reel — a full-screen vertical snap feed of live Windows.
 *
 * Ported from `reference/yosuku/app/reels/page.tsx` over the same DreamDEX pipeline
 * that feeds `/markets`, so a price never disagrees between the two. Three
 * differences from the reference are deliberate:
 *
 *  - Rounds come from the live lanes across every cadence the venue lists, not a
 *    fixed 1m/5m/1h table, and membership derives from `phase()` like every other
 *    surface rather than a second copy of the entry cutoff.
 *  - The line is the on-chain opening print, as on `/markets`.
 *  - Community takes are not woven in yet; the composer names Stage 3 rather than
 *    opening onto a feed that does not exist.
 */
export function ReelsScreen() {
  const venue = useVenue();
  const nowMs = useChainNowMs();
  const lanes = useLanesState(venue.venueId);
  const rounds = useReelRounds(lanes.laneSet, nowMs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { register, isNear } = useActiveReel(scrollRef, rounds.length);
  const [scrolled, setScrolled] = useState(false);

  const waiting = lanes.reading === null || nowMs === 0;
  const hasReel = rounds.length > 0;

  return (
    <>
      <div
        ref={scrollRef}
        className="reel-page feed-snap"
        onScroll={(event) => {
          if (event.currentTarget.scrollTop > SCROLLED_PX) setScrolled(true);
        }}
      >
        {waiting ? (
          <ReelHolding>{REELS.reading}</ReelHolding>
        ) : venue.venueId === null ? (
          <ReelHolding>{REELS.noVenue}</ReelHolding>
        ) : !hasReel ? (
          <ReelHolding>{REELS.betweenRounds}</ReelHolding>
        ) : (
          rounds.map((market, index) => (
            <section key={market.marketId} ref={register(index)} className="feed-card reel-slot">
              <ReelCard market={market} nowMs={nowMs} near={isNear(index)} />
            </section>
          ))
        )}
      </div>

      {hasReel && (
        <>
          {/* The social entry point. Stage 3 stands the take board up; until then the
              control is here and says what it waits on rather than opening onto nothing. */}
          <button type="button" disabled className="reel-take" aria-label={REELS.takesPending} title={REELS.takesPending}>
            <FeatherIcon size={24} aria-hidden />
            <span>Take</span>
          </button>

          {/* Nothing else on screen says this is a snap scroll, so a viewer who does not
              swipe sees one market and assumes that is the whole app. */}
          <div aria-hidden className="reel-hint" data-scrolled={scrolled}>
            <ChevronUpIcon size={20} strokeWidth={3} className="reel-hint-arrow" />
            <span className="reel-hint-pill">{REELS.swipeHint}</span>
          </div>
        </>
      )}
    </>
  );
}
