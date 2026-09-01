"use client";

import { mapReading, stale, type Reading } from "@masayume/core/schemas";
import type { AssetPrice, EventMarket, PricePoint } from "@masayume/core/types";
import { PRICE_BASIS } from "@masayume/markets/identity";
import { useAssetPrice, usePriceHistory } from "@masayume/markets/react";
import { useEffect, useMemo, useState } from "react";
import { FEED_DECIMALS_DEFAULT, feedRawToOracleRaw } from "./units";

const HISTORY_LEAD_SEC = 60;

/** One chart sample in the oracle's cents scale. */
export interface ChartPoint {
  timeSec: number;
  valueRaw: bigint;
}

export interface ChartSeries {
  points: ChartPoint[];
  latest: ChartPoint | null;
  feedDecimals: number;
}

function basisRaw(point: Pick<PricePoint, "priceRaw" | "emaRaw">): bigint {
  return PRICE_BASIS === "ema" ? point.emaRaw : point.priceRaw;
}

function toChartPoint(point: PricePoint | AssetPrice, feedDecimals: number): ChartPoint {
  return { timeSec: point.blockTimestampSec, valueRaw: feedRawToOracleRaw(basisRaw(point), feedDecimals) };
}

/** lightweight-charts needs strictly ascending, unique times; the last sample in a second wins. */
function dedupeByTime(points: ChartPoint[]): ChartPoint[] {
  const byTime = new Map<number, ChartPoint>();
  for (const point of points) byTime.set(point.timeSec, point);
  return [...byTime.values()].sort((a, b) => a.timeSec - b.timeSec);
}

/** History from a minute before the window opened, then live ticks appended; both on the settlement basis (Story 1.4). */
export function useChartSeries(market: EventMarket): Reading<ChartSeries> | null {
  const fromSec = market.tradingStartSec - HISTORY_LEAD_SEC;
  const history = usePriceHistory(market.asset, fromSec, market.expirySec);
  const live = useAssetPrice(market.asset);
  const [liveTicks, setLiveTicks] = useState<ChartPoint[]>([]);

  useEffect(() => setLiveTicks([]), [market.marketId]);

  useEffect(() => {
    if (!live?.ok || !live.value) return;
    const tick = toChartPoint(live.value, live.value.decimals);
    setLiveTicks((prev) => {
      const last = prev.at(-1);
      return !last || tick.timeSec > last.timeSec ? [...prev, tick] : prev;
    });
  }, [live]);

  return useMemo(() => {
    if (history === null) return null;
    const feedDecimals = live?.ok && live.value ? live.value.decimals : FEED_DECIMALS_DEFAULT;
    const merged = mapReading(history, (points) => {
      const all = dedupeByTime([...points.map((p) => toChartPoint(p, feedDecimals)), ...liveTicks]).filter((p) => p.timeSec >= fromSec);
      return { points: all, latest: all.at(-1) ?? null, feedDecimals };
    });
    if (!merged.ok || live === null) return merged;
    if (!live.ok) return stale(merged, "refresh-failed");
    return live.stale ? stale(merged, live.staleReason ?? "aged") : merged;
  }, [history, live, liveTicks, fromSec]);
}
