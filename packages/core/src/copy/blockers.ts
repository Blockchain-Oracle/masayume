import { DAILY_STOP_HIT, PLACING, SETTLING } from "./strings";

export const BLOCKER_KINDS = [
  "disconnected",
  "connecting",
  "wrong-chain",
  "placing",
  "pending-opening-print",
  "no-entry-buffer",
  "locked",
  "settling",
  "no-funds",
  "out-of-gas",
  "below-min-stake",
  "no-liquidity-at-size",
  "outside-band-low",
  "outside-band-high",
  "stale-quote",
  "daily-stop",
  "stop-unverified",
  "no-exit",
] as const;

export type BlockerKind = (typeof BLOCKER_KINDS)[number];

export interface BlockerContext {
  chainName?: string;
  minStakeText?: string;
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
    case "disconnected":
      return "Connect a wallet to bet";
    case "connecting":
      return "Connecting…";
    case "wrong-chain":
      return `Switch to ${ctx.chainName ?? DEFAULT_CHAIN}`;
    case "placing":
      return PLACING;
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
    case "below-min-stake":
      return `Minimum stake ${ctx.minStakeText ?? DEFAULT_MIN_STAKE} — below this the venue rounds your order to nothing`;
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
