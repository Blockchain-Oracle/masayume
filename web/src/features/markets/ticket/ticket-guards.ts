import type { BlockerKind } from "@masayume/core/copy";
import type { MarketPhase } from "@masayume/core/lifecycle";
import type { Reading } from "@masayume/core/schemas";
import { admissibilityBlocker, belowMinStake } from "@masayume/core/sizing";
import type { Quote, Side } from "@masayume/core/types";
import type { FundingCheck } from "@masayume/markets";
import type { WalletSession } from "@/lib/wallet-session";

export interface TicketBlockerInput {
  session: WalletSession;
  hasSigner: boolean;
  phase: MarketPhase | null;
  placing: boolean;
  side: Side | null;
  /** Wallet spendable plus venue payout credit; null until the balance sheet has answered. */
  availableBase: bigint | null;
  stakeBase: bigint;
  decimals: number;
  quote: Reading<Quote | null> | null;
  quoting: boolean;
  quoteStale: boolean;
  funding: FundingCheck | null;
}

const PHASE_BLOCKERS: Partial<Record<MarketPhase, BlockerKind>> = {
  upcoming: "upcoming",
  pendingOpeningPrint: "pending-opening-print",
  noEntryBuffer: "no-entry-buffer",
  locked: "locked",
  settledUnclaimed: "locked",
  finalized: "locked",
  voided: "locked",
};

function fundingBlocker(funding: FundingCheck | null): BlockerKind | null {
  if (!funding || funding.ok) return null;
  if (funding.diagnosis.kind === "out-of-gas") return "out-of-gas";
  if (funding.diagnosis.kind === "insufficient-collateral") return "over-balance";
  // A failed pre-check read is not a refusal: the order lane re-checks funding before it sends.
  return null;
}

/** Ordered so the first fixable reason is the one the CTA names; the label IS the blocker (UX-DR3/UX-DR4). */
export function deriveBlocker(i: TicketBlockerInput): BlockerKind | null {
  if (!i.session.isConnected) return i.session.isConnecting ? "connecting" : "disconnected";
  if (!i.session.isRightChain) return "wrong-chain";
  // The signer binds one effect after the session settles; treat the gap as still connecting.
  if (!i.hasSigner) return "connecting";
  if (i.placing) return "placing";
  if (i.phase === null) return "syncing";
  const phaseBlocker = PHASE_BLOCKERS[i.phase];
  if (phaseBlocker) return phaseBlocker;
  if (i.availableBase === 0n) return "no-funds";
  if (i.side === null) return "no-side";
  if (i.stakeBase === 0n) return "no-stake";
  if (belowMinStake(i.stakeBase, i.decimals)) return "below-min-stake";
  if (i.availableBase !== null && i.stakeBase > i.availableBase) return "over-balance";
  const funding = fundingBlocker(i.funding);
  if (funding) return funding;
  if (i.quoting || i.quote === null) return "quoting";
  if (!i.quote.ok) return "stale-quote";
  if (i.quote.value === null) return "no-liquidity-at-size";
  const band = admissibilityBlocker(i.quote.value.avgPriceBps);
  if (band) return band;
  if (i.quoteStale) return "stale-quote";
  return null;
}
