import { DAILY_STOP_HIT, PLACING, SETTLING } from "./strings";

export const BLOCKER_KINDS = [
  "disconnected",
  "connecting",
  "wrong-chain",
  "syncing",
  "placing",
  "upcoming",
  "pending-opening-print",
  "no-entry-buffer",
  "locked",
  "settling",
  "no-funds",
  "out-of-gas",
  "no-side",
  "no-stake",
  "below-min-stake",
  "over-balance",
  "quoting",
  "no-liquidity-at-size",
  "outside-band-low",
  "outside-band-high",
  "stale-quote",
  "quote-refused",
  "daily-stop",
  "stop-unverified",
  "no-exit",
] as const;

export type BlockerKind = (typeof BLOCKER_KINDS)[number];

export interface BlockerContext {
  chainName?: string;
  minStakeText?: string;
  spendableText?: string;
  quotedCents?: number;
  cadence?: string;
  nextStartText?: string;
  fillableStakeText?: string;
  quoteAgeSec?: number;
}

const DEFAULT_CHAIN = "Somnia Shannon";
const DEFAULT_MIN_STAKE = "1 tUSDC";

/** The blocker IS the control's label — one derived string for the CTA and its accessible name. */
export function blockerLabel(kind: BlockerKind, ctx: BlockerContext = {}): string {
  switch (kind) {
    case "quote-refused":
      return "The reserve refused this band — see why above";
    case "disconnected":
      return "Connect a wallet to bet";
    case "connecting":
      return "Connecting…";
    case "wrong-chain":
      return `Switch to ${ctx.chainName ?? DEFAULT_CHAIN}`;
    case "syncing":
      return "Syncing the chain clock…";
    case "placing":
      return PLACING;
    case "upcoming":
      return "Opens soon — not trading yet";
    case "pending-opening-print":
      return "Waiting for the opening print";
    case "no-entry-buffer":
      return ctx.nextStartText
        ? `Between rounds — next ${ctx.cadence ? `${ctx.cadence} ` : ""}Window opens in ${ctx.nextStartText}`
        : "Between rounds";
    case "locked":
      return "Window locked — settling next";
    case "settling":
      return SETTLING;
    case "no-funds":
      return "No tUSDC yet — mint from the faucet";
    case "out-of-gas":
      return "Out of STT gas — fuel up first";
    case "no-side":
      return "Pick UP or DOWN";
    case "no-stake":
      return "Enter a stake";
    case "below-min-stake":
      return `Minimum stake ${ctx.minStakeText ?? DEFAULT_MIN_STAKE} — below this the venue rounds your order to nothing`;
    case "over-balance":
      return ctx.spendableText ? `Stake exceeds your ${ctx.spendableText} balance` : "Stake exceeds your balance";
    case "quoting":
      return "Quoting…";
    case "no-liquidity-at-size":
      return ctx.fillableStakeText ? `Only ${ctx.fillableStakeText} fillable at this size` : "No liquidity at this size";
    case "outside-band-low":
      return `Too close to impossible — this book is quoting ${ctx.quotedCents ?? 1}¢`;
    case "outside-band-high":
      return `Too close to certain — this book is quoting ${ctx.quotedCents ?? 99}¢`;
    case "stale-quote":
      return ctx.quoteAgeSec === undefined ? "Quote is stale — requoting" : `Quote is ${ctx.quoteAgeSec}s old — requoting`;
    case "daily-stop":
      return DAILY_STOP_HIT;
    case "stop-unverified":
      return "Can't verify your Daily Stop — try again";
    case "no-exit":
      return "No exit right now — no bids at this size";
  }
}
