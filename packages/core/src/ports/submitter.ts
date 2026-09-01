import type { Diagnosis } from "../types/diagnosis";
import type { EventMarket, MarketId, OutcomeIdx, Side } from "../types/market";
import type { Address, Hex } from "../types/primitives";
import type { Quote } from "../types/trading";

/** The write-path state machine every surface renders (EXPERIENCE.md). */
export type WritePhase = "composing" | "submitted" | "confirming" | "confirmed" | "reverted" | "unknown";

export type PhaseListener = (phase: WritePhase, detail?: { txHash?: Hex }) => void;

export interface OrderRequest {
  market: EventMarket;
  side: Side;
  stakeBase: bigint;
  /** The quote the user confirmed; its `maxCostBase` is the cap — a fresh quote whose `maxCostBase` exceeds it is surfaced as a requote, never silently accepted. */
  displayedQuote: Quote;
  wallet: Address;
}

export interface BookedOrder {
  marketId: MarketId;
  side: Side;
  contractsRaw: bigint;
  costBase: bigint;
  avgPriceBps: number;
  txHash: Hex;
  fillCount: number;
}

export type OrderOutcome =
  | { status: "confirmed"; booked: BookedOrder }
  /** The tx mined but crossed nothing: the book moved before the IOC landed; the stake was never taken. */
  | { status: "nothingFilled"; txHash: Hex }
  /** The fresh quote's `maxCostBase` exceeds the confirmed one — the surface shows the new cost and asks again. */
  | { status: "requote"; quote: Quote }
  | { status: "refused"; diagnosis: Diagnosis }
  | { status: "reverted"; diagnosis: Diagnosis; txHash: Hex }
  | { status: "unknown"; diagnosis: Diagnosis; txHash?: Hex };

export type TxIntent =
  | { kind: "faucet"; amountBase: bigint }
  | { kind: "approve"; token: Address; spender: Address; amountBase: bigint }
  | {
      kind: "redeem";
      marketId: MarketId;
      outcomeIdx: OutcomeIdx;
      amountRaw: bigint;
      marketAddress: Address;
      outcomeToken: Address;
    };

export type TxOutcome =
  | { status: "confirmed"; txHash: Hex }
  | { status: "reverted"; diagnosis: Diagnosis; txHash?: Hex }
  | { status: "refused"; diagnosis: Diagnosis }
  | { status: "unknown"; diagnosis: Diagnosis; txHash?: Hex };

/** The ONE write pipeline, two lanes (AD-3). */
export interface Submitter {
  submitOrder(request: OrderRequest, onPhase?: PhaseListener): Promise<OrderOutcome>;
  submitTx(intent: TxIntent, onPhase?: PhaseListener): Promise<TxOutcome>;
  hasSigner(): boolean;
}

export type StopDecision = { ok: true; reservationId: string } | { ok: false; reason: string };

/** Daily-Stop gate — a mandatory pre-send step of the order lane; allow-all until Epic 5 (AD-9). */
export interface StopGate {
  checkAndReserve(wallet: Address, costBase: bigint): Promise<StopDecision>;
  reconcile(reservationId: string, bookedCostBase: bigint): Promise<void>;
}

export interface Attribution {
  builder?: Address;
  builderFeeBpsTimes1k?: bigint;
}

/** Builder-tag hook, no-op in v1 (AD-11). */
export type AttributionHook = (request: OrderRequest) => Attribution;

export type IntentState = "recorded" | "sent" | "confirmed" | "failed" | "unknown";

export interface IntentRecord {
  id: string;
  kind: TxIntent["kind"] | "order";
  wallet: Address;
  createdAtMs: number;
  state: IntentState;
  txHash?: Hex;
  summary: string;
}

/** Intent is journaled before send so a no-digest timeout can be reconciled instead of retried (AD-3). */
export interface IntentJournal {
  record(entry: Omit<IntentRecord, "id" | "state" | "createdAtMs">): Promise<IntentRecord>;
  markSent(id: string, txHash: Hex): Promise<void>;
  markConfirmed(id: string): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
  markUnknown(id: string): Promise<void>;
  listUnresolved(wallet: Address): Promise<IntentRecord[]>;
}
