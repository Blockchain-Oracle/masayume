import { diagnosisCopy } from "@masayume/core/copy";
import { phase } from "@masayume/core/lifecycle";
import type { OrderOutcome } from "@masayume/core/ports";
import { formatBaseUnits } from "@masayume/core/units";
import { describeRefusal, parseInstruction, type XInstruction } from "@masayume/core/x";
import { xLinkByAuthor, xReceiptUpsert, type XReceiptRecord } from "@masayume/db";
import { getCollateral, getVaultSnapshot, marketsProvider, resolveVenueId, type SubmitterSession } from "@masayume/markets";
import type { Bytes32, EventMarket } from "@masayume/core/types";
import type { Mention } from "./client";

export interface ExecutorContext {
  session: SubmitterSession;
  venueId: Bytes32;
  log: (why: string) => void;
}

/** Every mention ends as one row: the instruction, what it resolved to, and what became of it. */
function receiptFor(mention: Mention, over: Partial<XReceiptRecord>): XReceiptRecord {
  return {
    mentionId: mention.id,
    authorId: mention.authorId,
    handle: mention.handle,
    wallet: null,
    grantId: null,
    marketId: null,
    side: null,
    stakeBase: null,
    status: "refused",
    reason: null,
    txHash: null,
    instruction: mention.text,
    atMs: mention.createdAtMs,
    ...over,
  };
}

/** The soonest Window still enterable for the asset and cadence a mention named. */
async function liveWindow(venueId: Bytes32, instruction: XInstruction): Promise<EventMarket | null> {
  const lanes = await marketsProvider.listLiveLanes(venueId);
  if (!lanes.ok) return null;
  const nowMs = marketsProvider.nowMs();
  return (
    lanes.value.lanes
      .flatMap((lane) => lane.markets)
      .filter((m) => m.asset === instruction.asset && m.intervalSec === instruction.intervalSec && m.isUpDown && phase(m, nowMs) === "trading")
      .sort((a, b) => a.expirySec - b.expirySec)[0] ?? null
  );
}

function outcomeToReceipt(outcome: OrderOutcome): Pick<XReceiptRecord, "status" | "reason" | "txHash"> {
  switch (outcome.status) {
    case "confirmed":
      return { status: "filled", reason: null, txHash: outcome.booked.txHash };
    case "nothingFilled":
      return { status: "nothing-filled", reason: "the book moved before the order landed; nothing was taken", txHash: outcome.txHash };
    case "requote":
      return { status: "refused", reason: "the price moved past the confirmed cost", txHash: null };
    case "refused":
      return { status: "refused", reason: `${diagnosisCopy(outcome.diagnosis.kind).headline}: ${outcome.diagnosis.technical}`, txHash: null };
    case "reverted":
      return { status: "reverted", reason: outcome.diagnosis.technical, txHash: outcome.txHash };
    case "unknown":
      return { status: "unknown", reason: outcome.diagnosis.technical, txHash: outcome.txHash ?? null };
  }
}

/**
 * One mention → one receipt. Authenticate the author by their live link, parse deterministically,
 * resolve the Window, check the EXECUTOR grant is live and names this executor, quote, and send
 * through the same order lane every surface uses — `route: vault-grant`, caps pre-checked by
 * `simulateCaps` and enforced again by the contract. Nothing here can pay the executor.
 */
export async function executeMention(ctx: ExecutorContext, mention: Mention): Promise<XReceiptRecord> {
  const { decimals } = getCollateral();
  const link = await xLinkByAuthor(mention.authorId);
  if (!link) return receiptFor(mention, { reason: "this X account is not linked to a wallet — link it on masayume.app/trade-from-x" });

  const parsed = parseInstruction(mention.text, { decimals });
  if (!parsed.ok) return receiptFor(mention, { wallet: link.wallet, reason: describeRefusal(parsed.reason, parsed.token) });
  const { instruction } = parsed;
  const base = { wallet: link.wallet, side: instruction.side, stakeBase: instruction.stakeBase.toString() };

  const snapshot = await getVaultSnapshot(link.wallet as `0x${string}`);
  if (!snapshot.ok) return receiptFor(mention, { ...base, reason: "could not read the Trading Balance right now" });
  if (!snapshot.value) return receiptFor(mention, { ...base, reason: "the Trading Balance contract is not deployed on this network" });
  const grant = snapshot.value.grants.executor;
  if (!grant) return receiptFor(mention, { ...base, reason: "no live X grant for this wallet — fund and authorize on /trade-from-x" });
  if (grant.actor !== ctx.session.address.toLowerCase()) return receiptFor(mention, { ...base, grantId: grant.grantId.toString(), reason: "the wallet's X grant names a different executor" });
  if (grant.expiresAtSec * 1000 <= Date.now()) return receiptFor(mention, { ...base, grantId: grant.grantId.toString(), reason: "the X grant has expired — renew it on /trade-from-x" });

  const market = await liveWindow(ctx.venueId, instruction);
  if (!market) return receiptFor(mention, { ...base, grantId: grant.grantId.toString(), reason: `no ${instruction.asset} ${instruction.cadence} Window is open right now` });

  const target = { marketId: market.marketId, poolAddress: market.poolAddress, decimals: market.decimals, intervalSec: market.intervalSec };
  const quote = await marketsProvider.freshQuoteStake(target, instruction.side, instruction.stakeBase);
  const withMarket = { ...base, grantId: grant.grantId.toString(), marketId: market.marketId };
  if (!quote.ok) return receiptFor(mention, { ...withMarket, reason: `could not quote the book: ${quote.error.technical}` });
  if (!quote.value) return receiptFor(mention, { ...withMarket, reason: `nothing fillable for ${formatBaseUnits(instruction.stakeBase, decimals)} on the ${instruction.side} side` });

  const outcome = await ctx.session.submitter.submitOrder({
    market,
    side: instruction.side,
    stakeBase: instruction.stakeBase,
    displayedQuote: quote.value,
    wallet: ctx.session.address,
    route: { kind: "vault-grant", grantId: grant.grantId },
  });
  ctx.log(`mention ${mention.id}: ${outcome.status}`);
  return receiptFor(mention, { ...withMarket, ...outcomeToReceipt(outcome) });
}

export async function resolveVenue(configured: Bytes32): Promise<Bytes32 | null> {
  const venue = await resolveVenueId(configured);
  return venue.ok ? venue.value.venueId : null;
}

/** The reply under a mention: the receipt in one line, never a number that was not booked. */
export function replyText(receipt: XReceiptRecord, decimals: number): string {
  const stake = receipt.stakeBase ? `${formatBaseUnits(BigInt(receipt.stakeBase), decimals)} staked` : "";
  const side = receipt.side ? receipt.side.toUpperCase() : "";
  switch (receipt.status) {
    case "filled":
      return `Filled: ${side}, ${stake}. Receipt: masayume.app/trade-from-x · tx ${receipt.txHash ?? ""}`;
    case "nothing-filled":
      return `Nothing filled: ${receipt.reason ?? "the book moved"}. Nothing was taken.`;
    case "reverted":
      return `The order reverted on-chain; nothing was taken. tx ${receipt.txHash ?? ""}`;
    case "unknown":
      return `Sent, but the chain has not answered yet. We will reconcile it — see masayume.app/trade-from-x.`;
    case "submitted":
      return `Submitted — waiting for the chain.`;
    case "refused":
      return `Not placed: ${receipt.reason ?? "refused"}.`;
  }
}

export { xReceiptUpsert };
