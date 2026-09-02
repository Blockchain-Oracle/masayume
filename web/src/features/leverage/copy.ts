import { LEVERAGE_NOT_DEPLOYED } from "@masayume/core/leverage";

/**
 * The Ticket's leverage — the reference's own words where it has them (`Ticket624Drawer.tsx` L1074–1090:
 * the 1×/2×/3× chips, "L× can knock out before expiry."; `BetPlacedCard.tsx` L123: the caveat on The Call)
 * and the reserve's real numbers where the reference showed none: what it fronts, the fee, the line.
 */
export const LEVERAGE = {
  label: "Leverage",
  multiple: (x: number) => `${x}×`,
  /** The reference: "Private bets are placed at 1x." Ours: a boost is bought by the reserve, so it takes the wallet route. */
  lockedForRoute: "Boosts are placed from the wallet. Choose Wallet to bet at 2× or 3×.",
  notDeployed: LEVERAGE_NOT_DEPLOYED,
  paused: "The leverage reserve is paused: no new boosts. Live ones still settle, cash out and knock out.",
  strip: {
    exposure: "Exposure",
    /** The reference's exact sentence under the quote strip. */
    knockout: (x: number) => `${x}× can knock out before expiry.`,
    terms: (fronted: string, fee: string, symbol: string) => `The reserve fronts ${fronted} ${symbol} for a ${fee} ${symbol} fee, repaid first out of what the contracts fetch.`,
    line: (line: string, symbol: string) => `Knocks out if the book's bid for the position falls to ${line} ${symbol}: sold at the bids, the reserve repaid, the rest yours.`,
    sized: (charged: string, symbol: string) => `Sized to the venue's lot: ${charged} ${symbol} is charged, the rest stays in your wallet.`,
    requote: (contracts: string) => `The book moved — your stake now buys ${contracts} contracts. Confirm again at the new size.`,
    /** The guard under the CTA: the open refuses a fill more than this far under the quoted size. */
    guard: (contracts: string) => `Fills at least ${contracts} contracts or not at all — the stake never changes.`,
  },
  /** The boost card: the reference's numbers laid out as a breakdown — the user's 2026-09-02 redesign call. */
  card: {
    boost: "Boost",
    you: "you",
    reserve: "the reserve fronts",
    fee: "fee",
    knocksOutAt: (line: string, symbol: string) => `knocks out at ${line} ${symbol}`,
    how: "Sold at the bids if the position's value falls to the line: the reserve is repaid first, the rest is yours.",
  },
  meter: {
    label: "Room before the knock-out",
    line: (line: string, symbol: string) => `line ${line} ${symbol}`,
    room: (pct: string) => `${pct}% of room left`,
    under: "under the line",
    unpriced: "no bids to mark against",
  },
  cta: {
    buy: (side: string, x: number) => `Buy ${side} ${x}× for`,
  },
  bets: {
    boosted: (x: number) => `${x}× boosted`,
    staked: "Staked",
    yours: "Yours now",
    line: (line: string) => `knocks out at ${line}`,
    knockable: "at the knock-out line — anyone may close it now",
    unpriced: "no bids to mark against",
    cashOut: "Cash out",
    cashingOut: "Cashing out…",
    settle: "Settle",
    settling: "Settling…",
    knockedOut: "Knocked out",
    closed: "Cashed out",
    won: "Won",
    lost: "Lost",
    settled: "Settled",
    paid: (amount: string, symbol: string) => `paid ${amount} ${symbol}`,
    nothingBack: "nothing back",
    history: "Boosts, settled",
    cashedOut: (amount: string, symbol: string) => `Cashed out: ${amount} ${symbol} back to your wallet.`,
    settledToast: "Settled. Whatever the contracts paid is in your wallet, the reserve repaid first.",
  },
  devTitle: "Leverage",
} as const;
