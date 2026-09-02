/**
 * The reference's band presets (`lib/sui/ticket624.core.ts` L222–230) and its per-cadence scaling
 * (`Ticket624Drawer.tsx` L64–66: a ±$30 band is trivial on a 1-minute market but a real call on 1h).
 * The reference knew three cadences; the venue lists more, so the other lanes scale by √time from the
 * 5-minute anchor, which is what the reference's own three factors roughly follow.
 */
export const RANGE_PRESETS = [
  { key: "tight", label: "Tight", half: 15 },
  { key: "medium", label: "Medium", half: 30 },
  { key: "wide", label: "Wide", half: 55 },
] as const;
export type RangePresetKey = (typeof RANGE_PRESETS)[number]["key"];

/** How far the band centre may drift from spot, in dollars, before scaling. */
export const RANGE_CENTER_MAX = 35;
/** The centre moves in five-dollar steps, as the reference's does. */
export const RANGE_STEP_USD = 5;
const ANCHOR_SEC = 300;
const MAX_FACTOR = 16;

export function cadenceBandFactor(intervalSec: number): number {
  if (intervalSec <= 60) return 0.5;
  if (intervalSec <= ANCHOR_SEC) return 1;
  if (intervalSec === 3600) return 4;
  return Math.min(MAX_FACTOR, Math.round(Math.sqrt(intervalSec / ANCHOR_SEC) * 10) / 10);
}

/** The preset's half-width in dollars for this cadence, never under five. */
export function bandHalfUsd(preset: RangePresetKey, intervalSec: number): number {
  const half = RANGE_PRESETS.find((p) => p.key === preset)?.half ?? 30;
  return Math.max(5, Math.round(half * cadenceBandFactor(intervalSec)));
}

export function centerMaxUsd(intervalSec: number): number {
  return Math.max(10, Math.round(RANGE_CENTER_MAX * cadenceBandFactor(intervalSec)));
}

export function snapOffset(value: number, max: number): number {
  const snapped = Math.round(value / RANGE_STEP_USD) * RANGE_STEP_USD;
  return Math.max(-max, Math.min(max, snapped));
}
