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
  needs: { before: "needs", after: (side: string) => `for ${side}` },
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

/**
 * The hero-as-ticket head, ported from Yosuku's /markets.
 *
 * Yosuku asks "BTC holds above $77,800?" against a strike its model derives from
 * spot. Masayume's Windows settle at or above the **opening print**, so the print
 * is the line — the same question over a real on-chain number rather than a
 * derived one. Until the print exists there is no line, and the headline says so
 * by naming the pair instead of inventing a level.
 */
export const HERO_HEAD = {
  holdsAbove: (asset: string) => `${asset} holds above`,
  pair: (asset: string) => `${asset} · USD`,
  cadenceGroup: "Market length",
  betweenRounds: "Between rounds",
  settlesIn: "Settles in",
  noClock: "—",
  aboveLine: "above the UP line",
  needsForUp: "for UP to win",
  needs: "needs",
  room: "The Room",
  roomQualifier: "bettors only",
  /** Stage 3 stands the Room up on Postgres + realtime; the control is honest about that now. */
  roomPending: "The Room opens when the comment service is live — it is not connected yet.",
  settlesOnItsOwn: "Settles on its own the moment time's up",
  rampUp: "UP",
  noPrice: "—",
  betUp: "Bet UP",
  betDown: "Bet DOWN",
} as const;

export const BALANCE = {
  title: "Your money",
  spendable: "Spendable",
  headlineNote: "what you can bet right now — nothing else is added in",
  poolsLabel: "Other pools of your money",
  rows: { vault: "Vault", escrow: "Order escrow", credit: "Venue payout credit", gas: "STT for gas" },
  escrowNote: "locked in your resting orders until they fill or you cancel",
  creditFirst: "spent first on your next buy in its window",
  creditFirstHint: "of venue credit is spent first on your next buy",
  gasLow: "below the gas envelope — the next write needs more STT",
  connect: { why: "Connect a wallet to see your money: one spendable number, every other pool labeled beneath it." },
  devTitle: "Balance plate",
  fixtures: {
    zero: "Zero wallet",
    funded: "Funded wallet",
    pools: "Escrow + venue credit",
    stale: "Stale — last good kept, as-of tick",
    error: "First read failed",
    loading: "Nothing known yet",
    live: "Live — connected wallet",
  },
} as const;

export const VERDICT_UI = {
  title: "Verdict",
  netPnl: "Net P&L",
  paidOut: "Paid out",
  costUnknown: "No entry cost on record for this wallet — showing the payout.",
  legs: "Your legs",
  contracts: "contracts",
  payout: "payout",
  receiptTitle: "Settlement receipt",
  window: "Window",
  openingPrint: "Opening print",
  closingPrint: "Closing print",
  settlementTx: "Settlement tx",
  pendingTx: "landing on chain…",
  oracleGraph: "Oracle graph",
  question: (id: string) => `question ${id}`,
  noQuestion: "not on record",
  share: "Copy link",
  shareFailed: "Couldn't copy — use the address bar instead.",
  settling: "the closing print lands a few seconds after expiry.",
  noPosition: { why: "You held nothing in this window — nothing to stamp." },
  connect: { why: "Connect a wallet to see your verdict." },
  notFound: { why: "This window is gone.", nextAction: { label: "Pick a live window", href: "/markets" } },
  devTitle: "Verdict moment",
  devEyebrow: "?m=<marketId> stamps a live window for the connected wallet",
  fixtures: {
    win: "Win — 正夢 in vermilion; the P&L figure is the only green",
    loss: "Loss — 逆夢 in neutral ink; a fact, not a scare",
    void: "Void — 無効; no reliable print, both sides pay 0.5",
    both: "Both sides held — one card, net P&L, both legs listed",
  },
} as const;

export const CLAIM = {
  claimable: "claimable",
  claimAll: "Claim all",
  retry: "Claim the rest",
  title: "Claim everything",
  pageIntro: "Winnings are claimed, never sent. Each redemption is one signature, paid to your wallet only.",
  waiting: (n: number) => (n === 0 ? "Nothing waiting right now" : `${n} settled ${n === 1 ? "Window" : "Windows"} waiting`),
  netLabel: "net of the settlement fee",
  feeNote: (bps: number) => (bps === 0 ? "fee 0% — read from chain" : `fee ${(bps / 100).toString()}% — read from chain`),
  oneSignatureEach: "One signature per redemption — the venue has no batch claim, so each item reports its own outcome.",
  contracts: "contracts",
  closed: "closed",
  settled: "settled",
  kind: {
    win: "Win",
    void: "Void — no reliable print, both sides pay 0.5",
    "vault-credit": "Vault credit — withdrawal",
  },
  leg: { up: "UP leg", down: "DOWN leg" },
  status: {
    pending: "waiting",
    claiming: "claiming…",
    confirmed: "claimed",
    reverted: "reverted — nothing moved",
    unknown: "unknown — check the explorer",
  },
  progress: (current: number, total: number) => `claiming ${current} of ${total}`,
  finished: (claimed: number, total: number) => (claimed === total ? `Claimed ${claimed} of ${total}` : `${claimed} of ${total} claimed — the rest stayed put`),
  stopped: "Stopped early — every remaining item is untouched.",
  receipt: {
    title: "Claim receipt",
    figureLabel: "Paid to your wallet",
    settlement: "settlement tx",
    oracle: "Oracle Graph",
    pending: "…",
    settlementDegraded: "settlement tx not indexed yet — redemption tx only",
    oracleDegraded: "oracle question unknown — raw tx only",
  },
  empty: { why: "Nothing to claim — winnings land here the moment a Window you're in settles." },
  disconnected: { why: "Connect a wallet to see what's waiting for it." },
  dev: {
    title: "Claim-all plate",
    intro: "Canned rows for every claim state, then the live plate for the connected wallet.",
    plate: "Plate, idle",
    progress: "Mid-run — one reverted, one signing",
    receipt: "Success receipt",
    live: "Live — your wallet",
  },
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

/**
 * Reference controls whose product is real but whose contract is not yet deployed.
 *
 * Both are Yosuku parity and both belong to Stage 5 (`RangeReserve`, and the
 * prefunded model that backs leverage). They stay where the reference puts them
 * and say exactly what is missing — omitting them would misrepresent the product,
 * and wiring them to an ordinary Up/Down order would misrepresent the trade.
 */
export const TICKET_PENDING = {
  modeLabel: "Bet type",
  modeDirection: "Up / Down",
  modeRange: "Range",
  rangePending: "Range bets settle against the RangeReserve contract, which is not deployed yet. Up / Down is live.",
  leverageLabel: "Leverage",
  leverageOne: "1×",
  leveragePending: (multiple: string) =>
    `${multiple} needs the prefunded reserve that backs leveraged payouts. It is not deployed yet, so every bet here is 1×.`,
} as const;
