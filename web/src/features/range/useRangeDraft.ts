"use client";

import { useCallback, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { printToUsd, usdToPrint } from "./format";
import { bandHalfUsd, centerMaxUsd, snapOffset, RANGE_STEP_USD, type RangePresetKey } from "./presets";

export interface RangeDraft {
  preset: RangePresetKey;
  setPreset: (key: RangePresetKey) => void;
  /** Dollars the band centre sits from spot, clamped to the cadence's limit. */
  offset: number;
  centerMax: number;
  half: number;
  setOffset: (usd: number) => void;
  recenter: () => void;
  nudge: (direction: -1 | 1) => void;
  /** The band in whole dollars and in the oracle's cents; null until spot is known. */
  spotUsd: number | null;
  lowUsd: number | null;
  highUsd: number | null;
  lowPrint: bigint | null;
  highPrint: bigint | null;
  dragging: boolean;
  trackRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerEnd: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
}

/**
 * The reference's band state (`Ticket624Drawer.tsx` L203–333): a width preset scaled per cadence, a centre
 * offset in five-dollar steps around spot, dragged on a track or moved with the keyboard.
 */
export function useRangeDraft(spot: bigint | null, intervalSec: number): RangeDraft {
  const [preset, setPreset] = useState<RangePresetKey>("medium");
  const [rawOffset, setRawOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startOffset: number; usdPerPx: number } | null>(null);

  const half = bandHalfUsd(preset, intervalSec);
  const centerMax = centerMaxUsd(intervalSec);
  const offset = Math.max(-centerMax, Math.min(centerMax, rawOffset));
  const spotUsd = spot === null ? null : printToUsd(spot);
  const center = spotUsd === null ? null : Math.round(spotUsd + offset);
  const lowUsd = center === null ? null : center - half;
  const highUsd = center === null ? null : center + half;

  const setOffset = useCallback((usd: number) => setRawOffset(snapOffset(usd, centerMax)), [centerMax]);
  const recenter = useCallback(() => setRawOffset(0), []);
  const nudge = useCallback((direction: -1 | 1) => setRawOffset((prev) => snapOffset(prev + direction * RANGE_STEP_USD, centerMax)), [centerMax]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      if (!track) return;
      const width = track.getBoundingClientRect().width;
      if (width <= 0) return;
      const axisHalf = Math.max(90, half + 35);
      dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startOffset: offset, usdPerPx: (axisHalf * 2) / width };
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [half, offset],
  );
  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      setOffset(drag.startOffset + (e.clientX - drag.startX) * drag.usdPerPx);
    },
    [setOffset],
  );
  const onPointerEnd = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);
  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") nudge(-1);
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") nudge(1);
      else if (e.key === "Home") recenter();
      else return;
      e.preventDefault();
    },
    [nudge, recenter],
  );

  return {
    preset,
    setPreset,
    offset,
    centerMax,
    half,
    setOffset,
    recenter,
    nudge,
    spotUsd,
    lowUsd,
    highUsd,
    lowPrint: lowUsd === null ? null : usdToPrint(lowUsd),
    highPrint: highUsd === null ? null : usdToPrint(highUsd),
    dragging,
    trackRef,
    onPointerDown,
    onPointerMove,
    onPointerEnd,
    onKeyDown,
  };
}
