import type { Reading } from "@masayume/core/schemas";
import type { MarketId } from "@masayume/core/types";
import { getClient } from "../exchange";
import { numberOf } from "../mappers/scalars";
import { withReading } from "./reading";

/** Settlement fee is read from the venue at use time and never cached at init (canon #15); this venue currently runs at 0. */
export async function settlementFeeBps(marketId: MarketId): Promise<Reading<number>> {
  return withReading(`fee:${marketId}`, async () => {
    const fees = await getClient().getMarketFees(marketId);
    return numberOf(fees?.settlementFeeBps) ?? 0;
  });
}
