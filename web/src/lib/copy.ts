export * from "@masayume/core/copy";

/** Surface labels only — contract strings live in @masayume/core/copy. */
export const NAV = {
  markets: "Markets",
  reels: "Reels",
  portfolio: "Portfolio",
} as const;

export const SECTIONS = {
  lanes: { index: "01", title: "Live windows" },
  hero: { index: "02", title: "The window" },
  ticket: { index: "03", title: "Your call" },
} as const;

export const CONNECT = {
  connect: "Connect",
  connecting: "Connecting…",
  wrongChain: "Wrong network",
  disconnect: "Disconnect",
} as const;

export const BANNER = {
  wrongNetwork: (chainName: string) => `This app runs on ${chainName}.`,
  switchTo: (chainName: string) => `Switch to ${chainName}`,
  switching: "Switching…",
} as const;

export const FAUCET = {
  title: "Fuel up",
  intro: (amountText: string) => `Mint test tUSDC straight from the venue's own faucet — ${amountText} per tap, no sign-up.`,
  cta: (amountText: string) => `Mint ${amountText} tUSDC`,
  minted: "Minted — your balance updates on its own",
  gasTitle: "Get STT for gas first",
  yourAddress: "Your address:",
  recheck: "I've got STT — check again",
} as const;

export const WALLET_DEV = {
  connection: "Connection",
  balances: "Balances",
  faucet: "Faucet",
  address: "address",
  chain: "chain",
  rightChain: "on Somnia Shannon",
  wrongChain: "not on Somnia Shannon",
  signer: "signer",
  signerBound: "bound to the venue SDK",
  noSigner: "not bound",
  connectFirst: "Connect a wallet to read balances.",
  spendable: "Spendable tUSDC",
  native: "STT for gas",
  escrow: "Order escrow",
  credit: "Venue payout credit",
} as const;

export const CLAIM = {
  claimable: "claimable",
  claimAll: "Claim all",
} as const;

export const TOASTS = {
  copied: "Copied",
} as const;

export const DEV = {
  title: "Fixtures",
  intro: "Every card, receipt, and state from canned data — no wallet, no database.",
} as const;

export const MARKETS = {
  title: "Markets",
  plainWords: "Plain words",
  up: "UP",
  down: "DOWN",
  estimated: "estimated",
  volume: "vol",
  noBook: "no book",
  live: (n: number) => `${n} live`,
  trades: (n: number) => `${n} ${n === 1 ? "trade" : "trades"}`,
  fixedStrikeHidden: (n: number) => `${n} fixed-strike ${n === 1 ? "Window" : "Windows"} hidden — v1 lists up/down Windows only.`,
  noLiveWindows: { why: "No live Windows on this venue right now — Windows roll continuously, so this fills in as the next one opens." },
  heroPlaceholder: { why: "Pick a Window above to read it here." },
  ticketPlaceholder: { why: "Choose a Window and a side to open your call." },
  notes: {
    moved: "That page moved — here are the live Windows.",
    gone: "That Window is gone — showing the live Windows instead.",
    successor: (cadence: string) => `That ${cadence} Window settled — moved you to its successor.`,
  },
} as const;

export const HERO = {
  question: (asset: string) => `Will ${asset} close at or above its opening print?`,
  openingPrint: "opening print",
  livePrice: "live · feed EMA",
  pendingPrint: "waiting for the opening print",
  pendingDistance: "No opening print yet — nothing to measure against.",
  noLivePrice: "No live price right now.",
  needs: (side: string, amount: string) => `needs ${amount} for ${side}`,
  leading: (side: string) => `${side} is winning right now`,
  source: "Settles on the Prophecy oracle median · chart follows the feed EMA",
  depthTitle: "Top of book",
  buyUp: "Buy UP",
  buyDown: "Buy DOWN",
  noDepth: "no resting offers",
  contracts: "contracts",
  chartLabel: (asset: string, opening: string, live: string) => `${asset} price: opening print ${opening}, live ${live}`,
  notFound: { why: "This window is gone.", nextAction: { label: "Pick a live window", href: "/markets" } },
  phase: {
    upcoming: "Opens soon",
    pendingOpeningPrint: "Waiting for the opening print",
    trading: "Trading",
    noEntryBuffer: "Closing — no new entries",
    locked: "Locked — waiting for the closing print",
    settledUnclaimed: "Settled",
    finalized: "Settled",
    voided: "Voided",
  },
  devTitle: "Hero market",
  devEmpty: { why: "No live window on this venue right now — come back when the next window opens." },
} as const;

export const TICKET = {
  title: "Your call",
  sideLabel: "Side",
  stakeLabel: "Stake",
  stakePlaceholder: "0.00",
  minStake: (floorText: string) => `Minimum stake ${floorText}`,
  chips: "Quick amounts",
  chipBelowMin: "below the minimum stake",
  enterStake: "Pick a side and enter a stake to see the exact deal.",
  cost: "Cost",
  payoutIfRight: (side: string) => `Payout if ${side} lands`,
  maxLoss: "Max loss",
  odds: "Odds",
  requoting: "requoting…",
  noLiquidity: "No liquidity at this size — nobody is on the other side right now.",
  partial: (fillableText: string) => `Fills up to ${fillableText} at this size — the rest stays in your wallet.`,
  creditNote: (creditText: string) => `${creditText} comes from your venue payout credit first.`,
  approvalNote: "Two signatures this first time: approve tUSDC, then your order.",
  advanced: (fromCadence: string, toCadence: string) =>
    `That ${fromCadence} Window closed for entries — moved you to the next ${toCadence} Window. Side and stake kept.`,
  buy: (side: string) => `Buy ${side} for`,
  buyPlain: "Buy",
  booked: (contractsText: string, side: string, avgPriceBps: number) => `Bought ${contractsText} ${side} contracts at ${Math.round(avgPriceBps / 100)}¢`,
  bookedPrefix: "Bought",
  bookedAt: "at",
  nothingFilled: "Nothing filled — the book moved before your order landed. Your stake was never taken.",
  requotePrefix: "The book moved — it now costs up to",
  requoteSuffix: "Confirm again to buy at the new price.",
  txLabel: "entry tx",
  syncing: "Syncing the chain clock…",
  gotIt: "Got it",
  sheetCta: (side: string) => `Your call · ${side}`,
  sheetCtaPlain: "Open your call",
  srCost: (costText: string) => `Cost ${costText}`,
} as const;
