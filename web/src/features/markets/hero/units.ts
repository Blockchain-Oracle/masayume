import { oneUnit } from "@masayume/core/units";
import { ORACLE_PRICE_SCALE } from "@masayume/markets/identity";

/** Feed.decimals is 18 on every asset today (SDK PRICE_FEED_DECIMALS); a live tick's own `decimals` overrides it. */
export const FEED_DECIMALS_DEFAULT = 18;
export const ORACLE_SCALE = ORACLE_PRICE_SCALE;

/** Feed raw (10^feedDecimals) → the oracle's cents scale, truncating sub-cent precision the oracle never prints. */
export function feedRawToOracleRaw(raw: bigint, feedDecimals = FEED_DECIMALS_DEFAULT): bigint {
  const shift = feedDecimals - ORACLE_SCALE;
  return shift >= 0 ? raw / oneUnit(shift) : raw * oneUnit(-shift);
}
