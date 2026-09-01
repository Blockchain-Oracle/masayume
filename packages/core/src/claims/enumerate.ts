import type { EventMarket } from "../types/market";
import type { ClaimableRow, ClaimLeg, Holdings } from "../types/trading";
import { estPayoutBase } from "./payout";

export interface SettledHolding {
  market: EventMarket;
  holdings: Holdings;
  feeBps: number;
}

function voidLegs(holdings: Holdings, feeBps: number): ClaimLeg[] {
  const legs: ClaimLeg[] = [];
  if (holdings.upRaw > 0n) legs.push({ outcomeIdx: 0, amountRaw: holdings.upRaw, payoutBase: estPayoutBase(holdings.upRaw, "void", feeBps) });
  if (holdings.downRaw > 0n) legs.push({ outcomeIdx: 1, amountRaw: holdings.downRaw, payoutBase: estPayoutBase(holdings.downRaw, "void", feeBps) });
  return legs;
}

function winLegs(market: EventMarket, holdings: Holdings, feeBps: number): ClaimLeg[] {
  if (market.winningOutcome === null) return [];
  const amountRaw = market.winningOutcome === 0 ? holdings.upRaw : holdings.downRaw;
  if (amountRaw === 0n) return [];
  return [{ outcomeIdx: market.winningOutcome, amountRaw, payoutBase: estPayoutBase(amountRaw, "win", feeBps) }];
}

/** Every claimable row for a wallet: voids redeem BOTH sides as one row with two legs; a losing side is never a row (canon #11). */
export function enumerateClaimables(settled: readonly SettledHolding[]): ClaimableRow[] {
  const rows: ClaimableRow[] = [];
  for (const { market, holdings, feeBps } of settled) {
    const kind = market.voided ? "void" : "win";
    const legs = kind === "void" ? voidLegs(holdings, feeBps) : winLegs(market, holdings, feeBps);
    const netPayoutBase = legs.reduce((sum, leg) => sum + leg.payoutBase, 0n);
    if (netPayoutBase === 0n) continue;
    rows.push({
      kind,
      marketId: market.marketId,
      marketAddress: market.marketAddress,
      asset: market.asset,
      intervalSec: market.intervalSec,
      legs,
      netPayoutBase,
      feeBps,
      decimals: market.decimals,
      settledAtMs: market.resolvedAtMs,
    });
  }
  return rows.sort((a, b) => (b.settledAtMs ?? 0) - (a.settledAtMs ?? 0));
}

export function netClaimableSum(rows: readonly ClaimableRow[]): bigint {
  return rows.reduce((sum, row) => sum + row.netPayoutBase, 0n);
}
