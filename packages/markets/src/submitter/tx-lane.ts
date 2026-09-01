import type { GasLane } from "@masayume/core/constants";
import type { IntentJournal, PhaseListener, TxIntent, TxOutcome } from "@masayume/core/ports";
import { diagnosis, type Diagnosis } from "@masayume/core/types";
import type { TxResult } from "@somnia-chain/markets-sdk";
import type { Address } from "@masayume/core/types";
import type { SessionTrader } from "../sessions/trader";
import { isTimeoutError } from "./failure";
import { checkGas, gasLimitFor } from "./gas";
import { assertTxOk, diagnoseWrite, TxRevertedError } from "./steps/assert-tx-ok";

export interface TxLaneContext {
  journal: IntentJournal;
  /** The calling session's bound trader and the account it signs for. */
  trader: SessionTrader;
  wallet: Address;
}

const LANE_OF: Record<TxIntent["kind"], GasLane> = { faucet: "faucet", redeem: "redeem", approve: "approve" };

const NO_STANDALONE_APPROVE =
  "approvals are absorbed into the action that needs them (autoApprove); there is no standalone approve";

function summarize(intent: TxIntent): string {
  switch (intent.kind) {
    case "faucet":
      return `faucet ${intent.amountBase}`;
    case "redeem":
      return `redeem ${intent.amountRaw} of outcome ${intent.outcomeIdx} on ${intent.marketId}`;
    case "approve":
      return `approve ${intent.spender} for ${intent.amountBase}`;
  }
}

function send(trader: SessionTrader, intent: Exclude<TxIntent, { kind: "approve" }>): Promise<TxResult> {
  const gas = gasLimitFor(LANE_OF[intent.kind]);
  if (intent.kind === "faucet") return trader.faucet({ amount: intent.amountBase, gas });
  // Explicit outcomeIdx always (canon #11): a voided market pays both sides, so "infer the winner" is meaningless there.
  return trader.redeem({
    marketId: intent.marketId,
    amount: intent.amountRaw,
    outcomeIdx: intent.outcomeIdx,
    market: intent.marketAddress,
    outcomeToken: intent.outcomeToken,
    autoApprove: true,
    gas,
  });
}

function refused(diag: Diagnosis): TxOutcome {
  return { status: "refused", diagnosis: diag };
}

async function settleFailure(journal: IntentJournal, id: string, error: unknown, onPhase?: PhaseListener): Promise<TxOutcome> {
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

/** Every non-order write (AD-3 second lane): journal intent → gas check → send → assertTxOk → diagnose → book from the receipt. */
export async function submitTx(ctx: TxLaneContext, intent: TxIntent, onPhase?: PhaseListener): Promise<TxOutcome> {
  const { wallet } = ctx;
  if (intent.kind === "approve") return refused(diagnosis("unknown", NO_STANDALONE_APPROVE));

  const record = await ctx.journal.record({ kind: intent.kind, wallet, summary: summarize(intent) });
  const gas = await checkGas(wallet, LANE_OF[intent.kind]);
  if (!gas.ok) {
    await ctx.journal.markFailed(record.id, gas.diagnosis.technical);
    return refused(gas.diagnosis);
  }

  onPhase?.("submitted");
  try {
    const result = assertTxOk(await send(ctx.trader, intent), intent.kind);
    await ctx.journal.markSent(record.id, result.hash);
    await ctx.journal.markConfirmed(record.id);
    onPhase?.("confirmed", { txHash: result.hash });
    return { status: "confirmed", txHash: result.hash };
  } catch (error) {
    return settleFailure(ctx.journal, record.id, error, onPhase);
  }
}
