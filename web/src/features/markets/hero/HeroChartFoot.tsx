"use client";

import { MessageCircle } from "lucide-react";
import { HERO_HEAD } from "@/lib/copy";
import type { TopOfBook } from "./useTopOfBook";

interface HeroChartFootProps {
  book: TopOfBook;
  onOpenRoom: () => void;
}

/**
 * The Room, and how the market is currently priced.
 *
 * The Room is live: the control opens it, and the sheet itself says which of the
 * gate's states this wallet is in — including "not connected on this deployment",
 * when there is no social store. That belongs in the sheet rather than in a
 * disabled button, because "you have no position" and "this deployment has no
 * database" are different answers and only one of them is about you.
 *
 * The ramp's fill is the UP price, so a bar at 64¢ means UP costs 64¢ — the width
 * is the number, not a mood. With no resting offer there is no width to draw, so
 * the bar stays empty and the figure reads "—".
 */
export function HeroChartFoot({ book, onOpenRoom }: HeroChartFootProps) {
  const cents = book.upCents;
  return (
    <div className="hero-chart-foot">
      <button type="button" className="mh-room" onClick={onOpenRoom} data-cursor="hover">
        <MessageCircle className="mh-room-icon" aria-hidden />
        {HERO_HEAD.room}
        <span className="mh-room-meta">{HERO_HEAD.roomQualifier}</span>
      </button>
      <span className="ramp">
        <span>{HERO_HEAD.rampUp}</span>
        <span className="bar">
          <span className="fill" style={{ width: `${cents ?? 0}%` }} />
        </span>
        <span className="mh-ramp-cents">{cents === null ? HERO_HEAD.noPrice : `${cents}¢`}</span>
      </span>
    </div>
  );
}
