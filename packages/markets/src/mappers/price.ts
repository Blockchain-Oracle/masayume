import type { AssetPrice, PricePoint } from "@masayume/core/types";
import type { LivePrice, PricePoint as FeedPoint } from "@somnia-chain/markets-sdk";
import { bigintOrZero } from "./scalars";

/** The feed's float fields are for display only; we carry the raw 18-dp integers (AD-2). */
export function toAssetPrice(price: LivePrice): AssetPrice {
  return {
    asset: price.asset,
    priceRaw: bigintOrZero(price.raw.price),
    emaRaw: bigintOrZero(price.raw.ema),
    decimals: price.decimals,
    blockTimestampSec: price.blockTimestamp,
  };
}

export function toPricePoint(point: FeedPoint): PricePoint {
  return {
    priceRaw: bigintOrZero(point.raw.price),
    emaRaw: bigintOrZero(point.raw.ema),
    blockTimestampSec: point.blockTimestamp,
  };
}
