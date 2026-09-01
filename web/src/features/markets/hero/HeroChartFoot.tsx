"use client";

import { MessageCircle } from "lucide-react";
import { HERO_HEAD } from "@/lib/copy";
import type { TopOfBook } from "./useTopOfBook";

interface HeroChartFootProps {
  book: TopOfBook;
}

/**
 * The Room, and how the market is currently priced.
 *
 * The Room is a Stage 3 capability — comments need Postgres and realtime, neither
 * of which is connected. The control stays where the reference puts it and says
 * so, rather than disappearing and leaving the foot looking like a different
 * product.
 *
 * The ramp's fill is the UP price, so a bar at 64¢ means UP costs 64¢ — the width
 * is the number, not a mood. With no resting offer there is no width to draw, so
 * the bar stays empty and the figure reads "—".
 */
export function HeroChartFoot({ book }: HeroChartFootProps) {
  const cents = book.upCents;
  return (
    <div className="hero-chart-foot">
      <button type="button" className="mh-room" disabled title={HERO_HEAD.roomPending}>
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
