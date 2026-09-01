import { HEADROOM_FRACTION, HEADROOM_MAX_SEC, HEADROOM_MIN_SEC } from "../constants/timing";
import { secToMs } from "../units/time";

/** No-entry buffer before expiry: max(30, min(300, interval × 0.4)) seconds (canon #9). */
export function headroomSec(intervalSec: number): number {
  return Math.max(HEADROOM_MIN_SEC, Math.min(HEADROOM_MAX_SEC, Math.round(intervalSec * HEADROOM_FRACTION)));
}

export function noEntryCutoffMs(expirySec: number, intervalSec: number): number {
  return secToMs(expirySec - headroomSec(intervalSec));
}

export function insideNoEntryBuffer(nowMs: number, expirySec: number, intervalSec: number): boolean {
  return nowMs >= noEntryCutoffMs(expirySec, intervalSec);
}

/**
 * Expiry for a taker order: a dead-man's switch one headroom past now, never beyond the market (canon #6).
 * Null inside the no-entry buffer — there is no admissible expiry to send.
 */
export function orderExpirySec(nowSec: number, expirySec: number, intervalSec: number): number | null {
  const headroom = headroomSec(intervalSec);
  if (nowSec >= expirySec - headroom) return null;
  return Math.min(expirySec, nowSec + headroom);
}
