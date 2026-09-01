import type { BookTarget } from "@masayume/core/ports";
import { ok, stale, type Reading } from "@masayume/core/schemas";
import type { BookDepth } from "@masayume/core/types";
import { useLiveBinaryOrderBookByMarket, useLiveStatus, useWatchMarket } from "@somnia-chain/markets-sdk/react";
import { useMemo } from "react";
import { toBookDepth } from "../mappers/book";
import { DEFAULT_BOOK_DEPTH } from "../provider/books";
import { nowMs } from "../provider/clock";

/**
 * Push-fed live book. Keyed by market id so a stale page shows an empty book rather than the
 * successor market's liquidity (canon #3). Null while the watch is still hydrating.
 */
export function useBook(target: BookTarget | null, depth = DEFAULT_BOOK_DEPTH): Reading<BookDepth> | null {
  const watch = useWatchMarket(target?.poolAddress);
  const book = useLiveBinaryOrderBookByMarket(target?.marketId, depth);
  const status = useLiveStatus();
  return useMemo(() => {
    if (!target || watch === "hydrating") return null;
    const reading = ok(toBookDepth(book, target.decimals), nowMs());
    return watch === "live" && status.wsConnected ? reading : stale(reading, "offline");
  }, [target, watch, book, status.wsConnected]);
}
