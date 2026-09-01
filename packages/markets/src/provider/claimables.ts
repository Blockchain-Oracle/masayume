import { enumerateClaimables, type SettledHolding } from "@masayume/core/claims";
import { isOk, type Reading } from "@masayume/core/schemas";
import type { Address, Bytes32, ClaimableRow, EventMarket, Holdings } from "@masayume/core/types";
import { getClient } from "../exchange";
import { settlementFeeBps } from "./fees";
import { listSettled } from "./markets";
import { getOnchain } from "./onchain";
import { withReading } from "./reading";

let outcomeToken: Address | null = null;

/** OutcomeToken6909 is one singleton for every market; learn its address from any market once. */
async function resolveOutcomeToken(sample: EventMarket): Promise<Address> {
  if (outcomeToken) return outcomeToken;
  const onchain = await getOnchain(sample.marketId);
  if (!isOk(onchain)) throw new Error(onchain.error.technical);
  outcomeToken = onchain.value.outcomeToken;
  return outcomeToken;
}

async function holdingsFor(wallet: Address, markets: readonly EventMarket[], token: Address): Promise<Holdings[]> {
  const queries = markets.flatMap((m) => [
    { token, id: m.yesTokenId },
    { token, id: m.noTokenId },
  ]);
  const balances = await getClient().getBalances(queries, wallet);
  return markets.map((_, i) => ({ upRaw: balances[i * 2] ?? 0n, downRaw: balances[i * 2 + 1] ?? 0n }));
}

/** Claimables for a wallet: settled markets discovered via the past list, holdings via ERC-6909, fee read at use time (canon #10, #11, #15). */
export async function listClaimables(wallet: Address, venueId: Bytes32): Promise<Reading<ClaimableRow[]>> {
  return withReading(`claimables:${wallet}:${venueId}`, async () => {
    const settled = await listSettled(venueId);
    if (!isOk(settled)) throw new Error(settled.error.technical);
    const markets = settled.value;
    if (markets.length === 0) return [];

    const token = await resolveOutcomeToken(markets[0] as EventMarket);
    const holdings = await holdingsFor(wallet, markets, token);
    const held = markets
      .map((market, i) => ({ market, holdings: holdings[i] as Holdings }))
      .filter(({ holdings: h }) => h.upRaw > 0n || h.downRaw > 0n);

    const fees = await Promise.all(held.map(({ market }) => settlementFeeBps(market.marketId)));
    const inputs: SettledHolding[] = held.map((entry, i) => {
      const fee = fees[i];
      return { ...entry, feeBps: fee && isOk(fee) ? fee.value : 0 };
    });
    return enumerateClaimables(inputs);
  });
}
