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
  /** Nested under the wallet's positions so one invalidation after a write refreshes both. */
  holdings: (wallet: string | null, marketId: string | null) => [QUERY_KEY_SCOPE, APP, "positions", wallet, "holdings", marketId] as const,
  claimables: (wallet: string | null, venueId: Bytes32 | null) => [QUERY_KEY_SCOPE, APP, "claimables", wallet, venueId] as const,
  /** The fill projection: settled rounds, equity, stats — one key, so a claim or an order refreshes all of it. */
  history: (wallet: string | null) => [QUERY_KEY_SCOPE, APP, "history", wallet] as const,
  /** The Trading Balance and its grants; holdings nest under it so one invalidation refreshes both. */
  vault: (wallet: string | null) => [QUERY_KEY_SCOPE, APP, "vault", wallet] as const,
  vaultHoldings: (wallet: string | null, marketId: string | null) => [QUERY_KEY_SCOPE, APP, "vault", wallet, "holdings", marketId] as const,
  /** The reserve's own sheet, and one wallet's tickets. */
  parlayReserve: () => [QUERY_KEY_SCOPE, APP, "parlayReserve"] as const,
  parlays: (wallet: string | null) => [QUERY_KEY_SCOPE, APP, "parlays", wallet] as const,
  parlayQuote: (signature: string) => [QUERY_KEY_SCOPE, APP, "parlayQuote", signature] as const,
  /** The range reserve's sheet, one wallet's rounds, a Window's basis and a band's quote. */
  rangeReserve: () => [QUERY_KEY_SCOPE, APP, "rangeReserve"] as const,
  ranges: (wallet: string | null) => [QUERY_KEY_SCOPE, APP, "ranges", wallet] as const,
  rangeBasis: (marketId: string | null, asset: string | null) => [QUERY_KEY_SCOPE, APP, "rangeBasis", marketId, asset] as const,
  rangeQuote: (signature: string) => [QUERY_KEY_SCOPE, APP, "rangeQuote", signature] as const,
  /** The maker vault's sheet, its open Windows and history, one wallet's shares. */
  makerVault: () => [QUERY_KEY_SCOPE, APP, "makerVault"] as const,
  makerWindows: () => [QUERY_KEY_SCOPE, APP, "makerVault", "windows"] as const,
  makerHistory: (limit: number) => [QUERY_KEY_SCOPE, APP, "makerVault", "history", limit] as const,
  makerShares: (wallet: string | null) => [QUERY_KEY_SCOPE, APP, "makerShares", wallet] as const,
  /** The leverage reserve's sheet, one wallet's boosts, a boost's live mark and a stake's quote. */
  leverageReserve: () => [QUERY_KEY_SCOPE, APP, "leverageReserve"] as const,
  leveragePositions: (wallet: string | null) => [QUERY_KEY_SCOPE, APP, "leverage", wallet] as const,
  leverageMark: (positionId: string | null) => [QUERY_KEY_SCOPE, APP, "leverageMark", positionId] as const,
  leverageQuote: (signature: string) => [QUERY_KEY_SCOPE, APP, "leverageQuote", signature] as const,
  balanceSheet: (wallet: string | null) => [QUERY_KEY_SCOPE, APP, "balanceSheet", wallet] as const,
  nextWindow: (marketId: MarketId | null) => [QUERY_KEY_SCOPE, APP, "nextWindow", marketId] as const,
  clock: () => [QUERY_KEY_SCOPE, APP, "clock"] as const,
  onchain: (marketId: MarketId | null) => marketOnchainKey(marketId),
  fee: (marketId: MarketId | null) => marketFeesKey(marketId),
};
