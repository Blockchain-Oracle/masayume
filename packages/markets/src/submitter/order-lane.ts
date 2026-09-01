import type { AttributionHook, IntentJournal, OrderOutcome, OrderRequest, PhaseListener, StopGate } from "@masayume/core/ports";
import { diagnosis, type Diagnosis } from "@masayume/core/types";
import { signerAddress } from "../exchange";
import { OrderRefusedError, RequoteError } from "./errors";
import { isTimeoutError } from "./failure";
import { assertTxOk, diagnoseWrite, TxRevertedError } from "./steps/assert-tx-ok";
import { bookFills } from "./steps/book-fills";
import { orderExpiryNs } from "./steps/expiry";
import { assertFunded } from "./steps/funding";
import { freshQuote } from "./steps/quote";
import { sendOrder } from "./steps/send";
import { statusGate } from "./steps/status-gate";

export interface OrderLaneContext {
  journal: IntentJournal;
  stopGate: StopGate;
  attribution: AttributionHook;
  nowMs: () => number;
}

function refused(diag: Diagnosis): OrderOutcome {
  return { status: "refused", diagnosis: diag };
}

function summarize({ side, market, stakeBase }: OrderRequest): string {
  return `buy ${side} on ${market.marketId} for ${stakeBase}`;
}

function preSendOutcome(error: unknown): OrderOutcome {
  if (error instanceof RequoteError) return { status: "requote", quote: error.quote };
  if (error instanceof OrderRefusedError) return refused(error.diagnosis);
  return refused(diagnoseWrite(error));
}

async function sendFailure(journal: IntentJournal, id: string, error: unknown, onPhase?: PhaseListener): Promise<OrderOutcome> {
  const diag = diagnoseWrite(error);
  if (error instanceof TxRevertedError) {
    await journal.markSent(id, error.txHash);
    await journal.markFailed(id, diag.technical);
    onPhase?.("reverted", { txHash: error.txHash });
    return { status: "reverted", diagnosis: diag, txHash: error.txHash };
  }
  if (isTimeoutError(error)) {
    await journal.markUnknown(id);
    onPhase?.("unknown");
    return { status: "unknown", diagnosis: diagnosis("send-unknown", diag.technical) };
  }
  await journal.markFailed(id, diag.technical);
  onPhase?.("composing");
  return refused(diag);
}

/**
 * AD-3's order lane, in order: on-chain status gate → Daily-Stop gate → fresh quote against the confirmed
 * cap → headroom expiry → funding → journal → send IOC → assertTxOk → book from fills → reconcile the Stop
 * reservation. A send that times out with no digest is journaled unknown and never auto-retried.
 */
export async function submitOrder(ctx: OrderLaneContext, req: OrderRequest, onPhase?: PhaseListener): Promise<OrderOutcome> {
  const wallet = signerAddress();
  if (!wallet) return refused(diagnosis("signer-required", "connect a wallet before betting"));
  const { market, side, stakeBase, displayedQuote } = req;
  const target = { marketId: market.marketId, poolAddress: market.poolAddress, decimals: market.decimals, intervalSec: market.intervalSec };

  let reservationId: string | null = null;
  try {
    const onchain = await statusGate(market.marketId);
    const stop = await ctx.stopGate.checkAndReserve(wallet, displayedQuote.maxCostBase);
    if (!stop.ok) return refused(diagnosis("daily-stop", stop.reason));
    reservationId = stop.reservationId;

    const quote = await freshQuote({ target, side, stakeBase, displayed: displayedQuote });
    const expireTimestampNs = orderExpiryNs(ctx.nowMs(), onchain, market.intervalSec);
    const funding = await assertFunded(wallet, onchain, quote);
    if (!funding.ok) throw new OrderRefusedError(funding.diagnosis);

    const record = await ctx.journal.record({ kind: "order", wallet, summary: summarize(req) });
    onPhase?.("submitted");
    try {
      const result = assertTxOk(await sendOrder({ onchain, side, quote, expireTimestampNs, attribution: ctx.attribution(req) }), "order");
      await ctx.journal.markSent(record.id, result.hash);
      const booked = bookFills({ result, marketId: market.marketId, side, decimals: market.decimals });
      await ctx.journal.markConfirmed(record.id);
      await ctx.stopGate.reconcile(reservationId, booked?.costBase ?? 0n);
      reservationId = null;
      onPhase?.("confirmed", { txHash: result.hash });
      return booked ? { status: "confirmed", booked } : { status: "nothingFilled", txHash: result.hash };
    } catch (error) {
      const outcome = await sendFailure(ctx.journal, record.id, error, onPhase);
      // An unknown send may still land, so its reservation stays until the journal is reconciled (AD-9).
      if (outcome.status === "unknown") reservationId = null;
      return outcome;
    }
  } catch (error) {
    onPhase?.("composing");
    return preSendOutcome(error);
  } finally {
    if (reservationId) await ctx.stopGate.reconcile(reservationId, 0n);
  }
}
