import { useEffect, useState } from "react";

/** A counter that advances every `intervalMs` — the render clock for countdowns, staleness ticks, and requotes. */
export function useTick(intervalMs: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
