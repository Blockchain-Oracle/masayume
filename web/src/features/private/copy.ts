import { PRIVATE_HONESTY, PRIVATE_NOT_DEPLOYED } from "@masayume/core/private";

/**
 * The private route — the reference's own words where it has them (`Ticket624Drawer.tsx` L1175–1247: the
 * Public/Private control, the budget line, "Always 1x."; `PrivateClaims.tsx`: the claims list and its backup
 * copy; `MOBILE_INTEGRATION.md` §5: the honest one-liner) and the desk's real facts where it showed none.
 * Never "anonymous", "untraceable" or "zk" — link-reduction is what this is (doc 00 §No-substitution).
 */
export const PRIVATE = {
  route: {
    label: "Private",
    titleReady: PRIVATE_HONESTY,
    titleProbing: "Checking private mode…",
    titleUnavailable: (reason: string) => `Private mode is not available right now: ${reason}`,
    titleOverCap: (cap: string) => `Private bets are capped at ${cap}`,
    titleRange: "Private bets cannot be range bets. Switch to Up or Down, or turn Private off.",
    retry: "retry",
  },
  /** The reference's exact chip title. */
  chipsLocked: "Private bets are placed at 1x.",
  note: {
    balance: (amount: string) => `${amount} in your private balance.`,
    empty: "Private bets spend a balance only you can withdraw.",
    addFunds: "add funds",
    adding: "adding…",
    /** The reference: "Always 1x. Cash out from this device." — the claim lives in this browser, and the list is on Portfolio. */
    always: "Always 1×. Cash out from this browser, on Portfolio.",
    honesty: PRIVATE_HONESTY,
    signatures: "Adding funds is a transaction (two signatures the first time); the bet itself is one signature more, and moves nothing by itself.",
  },
  cta: {
    buy: (side: string) => `Buy ${side} privately for`,
    fundAndBuy: (amount: string, side: string) => `Add ${amount} and buy ${side} privately`,
    placing: "Placing privately…",
    funding: "Adding funds…",
  },
  quote: {
    cost: "Cost",
    payoutIfRight: (side: string) => `Payout if ${side} lands`,
    maxLoss: "Max loss",
    odds: "Odds",
    sized: (charged: string, symbol: string) => `Sized to the venue's lot off the live book: ${charged} ${symbol} is what the slot pays; the rest stays in your private balance.`,
  },
  toasts: {
    placed: (side: string, window: string) => `Private bet placed: ${side} on ${window}`,
    refunded: (amount: string, symbol: string) => `${amount} ${symbol} is back in your private balance.`,
    toppedUp: "Private balance topped up. Only you can withdraw it.",
    unknown: "The chain has not answered yet — try again; nothing is charged twice.",
    cashedOut: (amount: string, symbol: string) => `Cashed out: ${amount} ${symbol} credited to your private balance.`,
    lost: "Settled — that one lost. Whatever the slot still held is back in your private balance.",
    stillOpen: "Not settled yet — cash out once the Window closes.",
    alreadyHome: "Already credited to your private balance.",
    withdrawn: "Private balance withdrawn to your wallet.",
    revoked: "The desk's allowance is revoked; your balance is untouched.",
    deposited: "Private balance topped up. Only you can withdraw it.",
  },
  /** `PrivateClaims.tsx`, verbatim but for the brand and the signer — a desk key the contract pins, not an attested enclave. */
  claims: {
    emptyTitle: "No private positions yet",
    emptySub: "Turn on Private before you place a bet and your address stays off the position.",
    title: "Private positions",
    sub: "Only you hold the proof these are yours.",
    backUp: "Back up",
    restore: "Restore",
    restored: (n: number) => `Restored ${n} claim${n === 1 ? "" : "s"}.`,
    nothingNew: "Nothing new in that file.",
    unreadable: "That file could not be read.",
    warn: "One of these was not signed by the desk key the contract pins, so cashing it out is blocked. That usually means the file it was restored from was edited, or the desk key was rotated. Restore from a clean backup.",
    checking: "Checking",
    verified: "Verified",
    verifiedTitle: "Signed by the desk key the contract pins",
    unverified: "Unverified",
    unverifiedTitle: "This claim was not signed by the desk key the contract pins",
    cashOut: "Cash out",
    cashingOut: "Cashing out",
    open: "open",
    settled: "settled",
    credited: "credited",
    foot: "Keep your backup somewhere safe. Nobody at Masayume can rebuild these for you, which is the same reason nobody there can read them.",
    fileName: (date: string) => `masayume-private-claims-${date}.json`,
    just: "just now",
    minutes: (m: number) => `${m}m ago`,
    hours: (h: number) => `${h}h ago`,
    days: (d: number) => `${d}d ago`,
  },
  panel: {
    eyebrow: "Private balance",
    note: "Private bets spend from this, inside the limit you set. Only you can withdraw it.",
    amountLabel: "Private balance amount",
    deposit: "Deposit",
    depositing: "Depositing",
    withdraw: "Withdraw",
    withdrawing: "Withdrawing",
    revoke: "Revoke",
    revoking: "Revoking",
    revokeNote: "stops private bets; the balance stays yours",
    cells: { balance: "Balance", allowance: "Desk may spend", spendable: "Spendable", desk: "Desk key" },
    approvalNote: "Two signatures this first time: approve tUSDC, then the deposit.",
    allowanceNote: "A deposit allows the desk the whole new balance.",
    trust: "The desk can move your allowance into a bet and a payout back to this balance. It cannot pay itself: only your wallet withdraws, and the pool between bets holds only what was just charged or just won.",
    correlation: "What stays visible: the charge and the slot's funding land seconds apart for the same figure. Someone determined can line them up.",
  },
  pool: {
    label: "Private",
    note: "Private bets spend from this. Only you can withdraw it.",
  },
  notDeployed: {
    why: PRIVATE_NOT_DEPLOYED,
    how: "A record in contracts/deployments, or the NEXT_PUBLIC_PRIVATE_DESK_ADDRESS override, connects it. Public bets keep working.",
  },
  devTitle: "Private",
} as const;
