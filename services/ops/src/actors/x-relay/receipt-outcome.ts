import type { OrderOutcome } from "@masayume/core/ports";
import type { XReceipt, XRefusalCode } from "@masayume/core/x";
import { REFUSAL_DETAILS } from "./reply-format";

type OutcomeReceipt = Pick<XReceipt, "status" | "reason" | "txHash" | "refusalCode" | "bookedCostBase" | "bookedContractsRaw" | "avgPriceBps">;

/** Stable categories replace provider exception text in both stored public receipts and replies. */
function refusalCode(kind: string): XRefusalCode {
  const codes: Record<string, XRefusalCode> = {
    "grant-refused": "permission-denied",
    "daily-stop": "permission-denied",
    "insufficient-collateral": "insufficient-funds",
    "out-of-gas": "execution-unavailable",
    "not-deployed": "not-deployed",
  };
  return Object.hasOwn(codes, kind) ? (codes[kind] ?? "unconfirmed") : "unconfirmed";
}

export function outcomeToReceipt(outcome: OrderOutcome): OutcomeReceipt {
  switch (outcome.status) {
    case "confirmed":
      return { status: "filled", reason: null, txHash: outcome.booked.txHash, bookedCostBase: outcome.booked.costBase.toString(), bookedContractsRaw: outcome.booked.contractsRaw.toString(), avgPriceBps: outcome.booked.avgPriceBps };
    case "nothingFilled":
      return { status: "nothing-filled", reason: "No position was booked.", txHash: outcome.txHash };
    case "requote":
      return { status: "refused", refusalCode: "price-moved", reason: REFUSAL_DETAILS["price-moved"], txHash: null };
    case "refused": {
      const code = refusalCode(outcome.diagnosis.kind);
      return { status: "refused", refusalCode: code, reason: REFUSAL_DETAILS[code], txHash: outcome.diagnosis.txHash ?? null };
    }
    case "reverted":
      return { status: "reverted", reason: "The trade reverted on-chain.", txHash: outcome.txHash };
    case "unknown":
      return { status: "unknown", reason: "Transaction status needs checking before another instruction.", txHash: outcome.txHash ?? outcome.diagnosis.txHash ?? null };
  }
}
