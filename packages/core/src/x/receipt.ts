import type { Side } from "../types/market";

/** What became of one mention — every state a reply or a row can be in. */
export const X_RECEIPT_STATUSES = ["refused", "submitted", "filled", "nothing-filled", "reverted", "unknown"] as const;
export type XReceiptStatus = (typeof X_RECEIPT_STATUSES)[number];

/** A receipt links the instruction to the grant, the Window, the transaction and the beneficiary. */
export interface XReceipt {
  mentionId: string;
  authorId: string;
  handle: string | null;
  wallet: string | null;
  grantId: string | null;
  marketId: string | null;
  side: Side | null;
  stakeBase: string | null;
  status: XReceiptStatus;
  reason: string | null;
  txHash: string | null;
  instruction: string;
  atMs: number;
}
