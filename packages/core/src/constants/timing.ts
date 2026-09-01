export const QUOTE_DEBOUNCE_MS = 350;
export const REQUOTE_MS = 12_000;
export const QUOTE_STALE_AFTER_MS = 20_000;

export const MARKETS_POLL_MS = 15_000;
export const PRICE_POLL_MS = 5_000;
export const ONCHAIN_POLL_MS = 5_000;
export const OPENING_PRINT_POLL_MS = 3_000;
export const VERDICT_POLL_MS = 3_000;
export const CLOCK_RESYNC_MS = 60_000;

/** No-entry buffer before expiry: max(30, min(300, interval × 0.4)) seconds (canon #9). */
export const HEADROOM_MIN_SEC = 30;
export const HEADROOM_MAX_SEC = 300;
export const HEADROOM_FRACTION = 0.4;

/** Countdown turns urgent at min(60, interval × 0.4) seconds (UX-DR14). */
export const URGENT_MAX_SEC = 60;
export const URGENT_FRACTION = 0.4;

/** Windows are back-to-back on Shannon (next tradingStart == previous expiry, Story 1.4); a gap > 0 is a skipped window, not a schedule. */
export const ROLL_GAP_SEC = 0;

/** A price tick older than this is shown frozen with a staleness tick, never as live. */
export const PRICE_STALE_AFTER_MS = 15_000;

/** Bootstrap partials read a few seconds short of their series cadence; snap within this tolerance so they don't create phantom lanes. */
export const CADENCE_SNAP_TOLERANCE_SEC = 5;
