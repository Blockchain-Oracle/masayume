"use client";

import { Ticker } from "./Ticker";

/** The live-fed price strip lands in Story 1.6; until then the strip renders empty rather than inventing numbers. */
export function LiveTicker() {
  return <Ticker entries={[]} />;
}
