import { CLOCK_RESYNC_MS } from "@masayume/core/constants";
import type { Reading } from "@masayume/core/schemas";
import type { MarketsEnv } from "../env";
import { bootMarkets, type MarketsBoot } from "../provider/boot";
import { keys } from "./keys";
import { useReadingQuery } from "./useReadingQuery";

export { bootMarkets, type MarketsBoot };

export function useMarketsBoot(env: MarketsEnv): Reading<MarketsBoot> | null {
  return useReadingQuery(keys.boot(), () => bootMarkets(env), { pollMs: CLOCK_RESYNC_MS });
}
