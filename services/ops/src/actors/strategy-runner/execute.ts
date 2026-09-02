import { isOk } from "@masayume/core/schemas";
import { dailyHeadroomBase, type VaultGrant } from "@masayume/core/vault";
import type { Decision, StrategyFill, StrategySubscription } from "@masayume/core/strategies";
import { toMarketId, type EventMarket, type MarketId } from "@masayume/core/types";
import { msToSec } from "@masayume/core/units";
import { marketsProvider, type SubmitterSession } from "@masayume/markets";

export type ExecutionResult =
  | { status: "filled"; fill: StrategyFill }
  | { status: "skipped"; reason: string }
  | { status: "refused"; reason: string }
  | { status: "dry-run"; stakeBase: bigint };

/**
 * The grant, head-fresh: an owner holds one live STRATEGY grant at a time, so the vault snapshot's
 * strategy slot is the subscription's grant exactly when the ids agree — a stale or replaced grant
 * reads as "not live", never as a cached copy the contract would refuse.
 */
async function readGrant(owner: StrategySubscription["subscriber"], grantId: bigint): Promise<VaultGrant | null> {
  const snapshot = await marketsProvider.getVaultSnapshot(owner);
  if (!isOk(snapshot) || !snapshot.value) return null;
  const grant = snapshot.value.grants.strategy;
  return grant && grant.grantId === grantId ? grant : null;
}

/**
 * One subscriber, one Window, one decision → at most one IOC through the subscriber's grant.
 * The stake is the smallest of the per-trade cap, today's headroom and the budget; a subscriber
 * already holding this Window is left alone (one entry per Window, the reference's rule).
 */
export async function executeForSubscriber(input: {
  session: SubmitterSession;
  sub: StrategySubscription;
  market: EventMarket;
  decision: Decision;
  nowMs: number;
  dryRun: boolean;
}): Promise<ExecutionResult> {
  const { session, sub, market, decision, nowMs, dryRun } = input;
  const side = decision.side;
  if (!side) return { status: "skipped", reason: "no side" };
  const grant = await readGrant(sub.subscriber, sub.grantId);
  if (!grant || grant.revoked || msToSec(nowMs) > grant.expiresAtSec) return { status: "skipped", reason: "grant not live" };

  const onchain = await marketsProvider.getOnchain(market.marketId);
  if (!isOk(onchain)) return { status: "skipped", reason: `chain read failed: ${onchain.error.technical}` };
  const held = await marketsProvider.getVaultHoldings(grant.owner, onchain.value);
  if (isOk(held) && held.value.upRaw + held.value.downRaw > 0n) return { status: "skipped", reason: "already in this Window" };

  const headroom = dailyHeadroomBase(grant, msToSec(nowMs));
  const stakeBase = [grant.caps.maxStakePerTradeBase, headroom, grant.budgetBase].reduce((min, v) => (v < min ? v : min));
  if (stakeBase <= 0n) return { status: "skipped", reason: "no headroom today" };
  if (dryRun) return { status: "dry-run", stakeBase };

  const target = { marketId: market.marketId, poolAddress: market.poolAddress, decimals: market.decimals, intervalSec: market.intervalSec };
  const quote = await marketsProvider.freshQuoteStake(target, side, stakeBase);
  if (!isOk(quote) || !quote.value) return { status: "skipped", reason: "nothing fillable at this size" };

  const outcome = await session.submitter.submitOrder({
    market,
    side,
    stakeBase,
    displayedQuote: quote.value,
    wallet: session.address,
    route: { kind: "vault-grant", grantId: sub.grantId },
  });
  if (outcome.status === "confirmed") {
    const fill: StrategyFill = {
      txHash: outcome.booked.txHash,
      strategyId: sub.strategyId,
      grantId: sub.grantId,
      owner: grant.owner,
      marketId: toMarketId(market.marketId) as MarketId,
      side,
      cashDeltaBase: outcome.booked.costBase,
      tokenDeltaRaw: outcome.booked.contractsRaw,
      atSec: msToSec(nowMs),
      dryRun: false,
    };
    return { status: "filled", fill };
  }
  if (outcome.status === "nothingFilled") return { status: "skipped", reason: "the book moved; nothing filled" };
  if (outcome.status === "requote") return { status: "skipped", reason: "quote moved past the cap" };
  return { status: "refused", reason: outcome.diagnosis.technical };
}
