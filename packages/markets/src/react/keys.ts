import type { Bytes32, MarketId } from "@masayume/core/types";
import { QUERY_KEY_SCOPE, marketFeesKey, marketOnchainKey } from "@somnia-chain/markets-sdk";

const APP = "masayume";

/** Query keys for every port read; SDK factories are reused where the SDK defines one so caches never fork. */
export const keys = {
  boot: () => [QUERY_KEY_SCOPE, APP, "boot"] as const,
  lanes: (venueId: string | null) => [QUERY_KEY_SCOPE, APP, "lanes", venueId] as const,
  market: (marketId: string | null) => [QUERY_KEY_SCOPE, APP, "market", marketId] as const,
  openingPrice: (marketId: string | null) => [QUERY_KEY_SCOPE, APP, "opening", marketId] as const,
  assetPrice: (asset: string | null) => [QUERY_KEY_SCOPE, APP, "assetPrice", asset] as const,
  priceHistory: (asset: string | null, fromSec: number, toSec: number) => [QUERY_KEY_SCOPE, APP, "priceHistory", asset, fromSec, toSec] as const,
  bookParams: (pool: string | null) => [QUERY_KEY_SCOPE, APP, "bookParams", pool] as const,
  resolution: (marketId: string | null) => [QUERY_KEY_SCOPE, APP, "resolution", marketId] as const,
  positions: (wallet: string | null) => [QUERY_KEY_SCOPE, APP, "positions", wallet] as const,
  claimables: (wallet: string | null, venueId: Bytes32 | null) => [QUERY_KEY_SCOPE, APP, "claimables", wallet, venueId] as const,
  balanceSheet: (wallet: string | null) => [QUERY_KEY_SCOPE, APP, "balanceSheet", wallet] as const,
  nextWindow: (marketId: MarketId | null) => [QUERY_KEY_SCOPE, APP, "nextWindow", marketId] as const,
  clock: () => [QUERY_KEY_SCOPE, APP, "clock"] as const,
  onchain: (marketId: MarketId | null) => marketOnchainKey(marketId),
  fee: (marketId: MarketId | null) => marketFeesKey(marketId),
};
