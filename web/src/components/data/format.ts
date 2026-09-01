// TODO(1.3): replace with @masayume/core/units and @masayume/core/lifecycle once Story 1.3 lands.

const ODDS_MIN_CENTS = 1;
const ODDS_MAX_CENTS = 99;
const URGENT_CEILING_SEC = 60;
const URGENT_FRACTION = 0.4;
const SEC_PER_HOUR = 3600;
const SEC_PER_MIN = 60;

/** Odds in cents per dollar, clamped to [1, 99] so a book never reads as certain. */
export function bpsToOddsCents(bps: number): number {
  return Math.min(ODDS_MAX_CENTS, Math.max(ODDS_MIN_CENTS, Math.round(bps / 100)));
}

export interface FormatBaseUnitsOptions {
  maxDp?: number;
  minDp?: number;
  signed?: boolean;
}

export function formatBaseUnits(value: bigint, decimals: number, options: FormatBaseUnitsOptions = {}): string {
  const { maxDp = 2, minDp = 0, signed = false } = options;
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = (abs / base).toLocaleString("en-US");
  const fraction = (abs % base).toString().padStart(decimals, "0").slice(0, maxDp).replace(/0+$/, "");
  const fractionOut = fraction.length < minDp ? fraction.padEnd(minDp, "0") : fraction;
  const body = fractionOut ? `${whole}.${fractionOut}` : whole;
  if (negative) return `-${body}`;
  return signed && value > 0n ? `+${body}` : body;
}

export function urgentAtSec(intervalSec: number): number {
  return Math.min(URGENT_CEILING_SEC, intervalSec * URGENT_FRACTION);
}

export interface CountdownState {
  remainingSec: number;
  urgent: boolean;
  settling: boolean;
  fraction: number;
}

export function countdown(nowMs: number, expirySec: number, intervalSec: number): CountdownState {
  const remainingSec = Math.max(0, Math.floor(expirySec - nowMs / 1000));
  const settling = remainingSec === 0;
  return {
    remainingSec,
    settling,
    urgent: !settling && remainingSec <= urgentAtSec(intervalSec),
    fraction: intervalSec > 0 ? Math.min(1, remainingSec / intervalSec) : 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatClock(remainingSec: number): string {
  const hours = Math.floor(remainingSec / SEC_PER_HOUR);
  const minutes = Math.floor((remainingSec % SEC_PER_HOUR) / SEC_PER_MIN);
  const seconds = remainingSec % SEC_PER_MIN;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export function shortHex(hex: string, lead = 6, tail = 4): string {
  return hex.length <= lead + tail + 1 ? hex : `${hex.slice(0, lead)}…${hex.slice(-tail)}`;
}

export interface FormatUtcOptions {
  withSeconds?: boolean;
  withDate?: boolean;
}

export function formatUtc(ms: number, { withSeconds = true, withDate = false }: FormatUtcOptions = {}): string {
  const iso = new Date(ms).toISOString();
  const time = withSeconds ? iso.slice(11, 19) : iso.slice(11, 16);
  return withDate ? `${iso.slice(0, 10)} ${time} UTC` : `${time} UTC`;
}
