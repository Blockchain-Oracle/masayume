"use client";

import { formatBaseUnits } from "@masayume/core/units";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { LEVERAGE } from "./copy";

interface KnockoutMeterProps {
  /** What the position was worth at entry: its cost. The track's full width. */
  entryBase: bigint;
  /** The knock-out line, `fronted × maintenance`. The marker. */
  lineBase: bigint;
  /** What the book would pay now; null before the first mark, when the fill shows the entry. */
  markBase: bigint | null;
  knockable: boolean;
  /** No bids to mark against right now. */
  unpriced?: boolean;
  decimals: number;
  symbol: string;
  compact?: boolean;
}

function pct(part: bigint, whole: bigint): number {
  if (whole <= 0n) return 0;
  return Math.min(100, Number((part * 10_000n) / whole) / 100);
}

/**
 * The 21st meter's shape (a track, a fill, a threshold) on the boost's own numbers: the fill is the position's
 * value against what it cost, the marker is the line it knocks out at, and the legend says how much room is
 * left. Under the line the fill takes the loss ink — the only place that ink is allowed.
 */
export function KnockoutMeter({ entryBase, lineBase, markBase, knockable, unpriced = false, decimals, symbol, compact = false }: KnockoutMeterProps) {
  const reduced = useReducedMotion();
  const value = markBase ?? entryBase;
  const fill = pct(value, entryBase);
  const line = pct(lineBase, entryBase);
  const room = value > lineBase ? pct(value - lineBase, value) : 0;
  const { meter } = LEVERAGE;

  return (
    <div className={cn("ko", compact && "ko--compact")} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fill)} aria-label={meter.label}>
      <div className="ko-track">
        <motion.span
          className={cn("ko-fill", knockable && "ko-fill--under")}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${fill}%` }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 24 }}
        />
        <span className="ko-line" style={{ left: `${line}%` }} aria-hidden />
      </div>
      <div className="ko-legend">
        <span>{meter.line(formatBaseUnits(lineBase, decimals), symbol)}</span>
        <span className={cn(knockable && "text-warning")}>{unpriced ? meter.unpriced : knockable ? meter.under : meter.room(room.toFixed(0))}</span>
      </div>
    </div>
  );
}
