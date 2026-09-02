import { PRINT_DECIMALS } from "@masayume/core/range";
import { formatOracleRaw } from "@masayume/core/units";

const CENTS = 100n;

/** Whole dollars, grouped, from a print in cents — the reference's `fmtUsd0`. */
export function usd0(print: bigint): string {
  return `$${formatOracleRaw(print, PRINT_DECIMALS, 0)}`;
}

/** Dollars and cents from a print. */
export function usd2(print: bigint): string {
  return `$${formatOracleRaw(print, PRINT_DECIMALS, 2)}`;
}

/** A print in cents → whole dollars as a number, for the band arithmetic the reference does in dollars. */
export function printToUsd(print: bigint): number {
  return Number(print / CENTS);
}

export function usdToPrint(usd: number): bigint {
  return BigInt(Math.round(usd)) * CENTS;
}

/** `multiplier.toFixed(1)` without a float — the reference's slip figure. */
export function formatMultiplierTenths(milli: number): string {
  const tenths = Math.round(milli / 100);
  return `${Math.floor(tenths / 10)}.${tenths % 10}×`;
}

/** A probability per 1e6 as `31.6`. */
export function formatProbE6(probE6: bigint): string {
  const tenths = Number(probE6 / 1_000n);
  return `${Math.floor(tenths / 10)}.${tenths % 10}`;
}

export function utilizationPct(bps: number): string {
  return String(Math.round(bps / 100));
}
