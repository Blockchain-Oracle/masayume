import type { MarketsProvider } from "@masayume/core/ports";
import { getBalanceSheet } from "./balances";
import { getBookDepth, getBookParams } from "./books";
import { listClaimables } from "./claimables";
import { nowMs } from "./clock";
import { syncClock } from "./clock-sync";
import { settlementFeeBps } from "./fees";
import { getMarket, listLiveLanes, listSettled } from "./markets";
import { nextWindow } from "./next-window";
import { getOnchain } from "./onchain";
import { getHoldings, listOpenPositions } from "./positions";
import { getAssetPrice, getOpeningPrice, getPriceHistory } from "./prices";
import { freshQuoteStake } from "./quotes";
import { getResolution } from "./resolution";

/** The one read port every surface plugs into (AD-1). */
export const marketsProvider: MarketsProvider = {
  listLiveLanes,
  getMarket,
  listSettled,
  getOnchain,
  getBookDepth,
  getBookParams,
  freshQuoteStake,
  getOpeningPrice,
  getAssetPrice,
  getPriceHistory,
  settlementFeeBps,
  listOpenPositions,
  getHoldings,
  listClaimables,
  getBalanceSheet,
  syncClock,
  nowMs,
  nextWindow,
  getResolution,
};

export { bootMarkets, type MarketsBoot } from "./boot";
export { DEFAULT_BOOK_DEPTH, liveBookDepth } from "./books";
export { applyClockSync, lastClockSync, nowMs, nowSec } from "./clock";
export { syncClock } from "./clock-sync";
export { laneNextStart } from "./next-window";
export { fetchOpeningPrices } from "./prices";
export { quoteFromBook, type QuoteInput } from "./quotes";
export { forgetReading, unwrap, withReading, type Unwrap } from "./reading";
