/**
 * The words on `/docs` — ported from `reference/yosuku/app/docs/page.tsx` with the facts
 * replaced by this app's own. Nothing here describes a capability that is not live; what
 * is not built keeps its page and says so there, not here.
 *
 * Sources for each claim are named in DocsContent.tsx beside the section that makes it.
 */

export interface DocsNavItem {
  id: string;
  label: string;
}

export interface DocsNavGroup {
  group: string;
  index: string;
  items: DocsNavItem[];
}

/** The spine of the docs — three groups, nine sections, the reference's own grouping (L21–37). */
export const NAV: DocsNavGroup[] = [
  {
    group: "Start here",
    index: "01",
    items: [
      { id: "overview", label: "Overview" },
      { id: "how-it-works", label: "How a Window works" },
      { id: "four-ways", label: "Four ways in" },
    ],
  },
  {
    group: "Build",
    index: "02",
    items: [
      { id: "chain-layer", label: "The chain layer" },
      { id: "read-runtime", label: "The read runtime" },
      { id: "signing", label: "Signing sessions" },
    ],
  },
  {
    group: "Trust",
    index: "03",
    items: [
      { id: "projection", label: "The projection" },
      { id: "verify", label: "Verify on-chain" },
      { id: "honest", label: "What this is & isn’t" },
    ],
  },
];

export const ALL_IDS: string[] = NAV.flatMap((group) => group.items.map((item) => item.id));

export const SOURCE_URL = "https://github.com/Blockchain-Oracle/masayume";
export const SDK_NPM_URL = "https://www.npmjs.com/package/@somnia-chain/markets-sdk";
export const DREAMDEX_DOCS_URL = "https://docs.dreamdex.io/developers/event-contracts";

export const DOCS = {
  title: "Docs",
  sidebarLabel: "Docs",
  navLabel: "Documentation sections",
  eyebrow: { a: "Documentation", b: "DreamDEX Event Contracts", c: "Testnet" },
  h1: { lead: "The close, ", accent: "documented", tail: "." },
  intro:
    "Masayume is a prediction market built on DreamDEX Event Contracts, Somnia’s fully on-chain order book for binary Up/Down markets on crypto prices. Pick a side on a Window, the oracle prints the close, the chain decides. Below: how to trade, how the app is built on the chain, and how to verify every claim on-chain.",
  chips: { pkg: "@somnia-chain/markets-sdk", verify: "Verified on-chain ↓" },
  ship: {
    title: "Ship something",
    links: [
      { label: "SDK on npm ↗", href: SDK_NPM_URL, external: true },
      { label: "source ↗", href: SOURCE_URL, external: true },
      { label: "make the call ↗", href: "/markets", external: false },
    ],
  },
  foot: {
    call: { label: "Make the call →", href: "/markets" },
    links: [
      { label: "source ↗", href: SOURCE_URL, external: true },
      { label: "status ↗", href: "/status", external: false },
    ],
  },
  copy: { idle: "copy", done: "copied ✓" },
  addrChip: "ADDR",
  sections: {
    overview: { num: "01", eyebrow: "For everyone", title: "Overview" },
    howItWorks: { num: "02", eyebrow: "For everyone", title: "How a Window works" },
    fourWays: { num: "03", eyebrow: "For everyone", title: "Four ways in" },
    chainLayer: { num: "04", eyebrow: "For builders", title: "The chain layer" },
    readRuntime: { num: "05", eyebrow: "For builders", title: "The read runtime" },
    signing: { num: "06", eyebrow: "For builders", title: "Signing sessions" },
    projection: { num: "07", eyebrow: "Trust", title: "The projection" },
    verify: { num: "08", eyebrow: "Verify", title: "Contracts & proof" },
    honest: { num: "09", eyebrow: "Honest", title: "What this is and isn’t" },
  },
  disclosureLabel: "Disclosure",
} as const;

/** Real lines from this repo, abridged with a comment where the file goes on — never an invented API. */
export const CODE = {
  provider: {
    label: "packages/core/src/ports/markets-provider.ts",
    body: `// The ONE chain port for reads. Every method returns a Reading<T>; nothing here throws for a chain failure.
export interface MarketsProvider {
  listLiveLanes(venueId: Bytes32): Promise<Reading<LaneSet>>;
  getBookDepth(target: BookTarget, depth?: number): Promise<Reading<BookDepth>>;
  freshQuoteStake(target: QuoteTarget, side: Side, stakeBase: bigint): Promise<Reading<Quote | null>>;
  listWalletHistory(wallet: Address): Promise<Reading<WalletHistory>>;
  syncClock(): Promise<Reading<ClockSync>>;
  // … 20 reads in all
}`,
  },
  send: {
    label: "packages/markets/src/submitter/steps/send.ts",
    body: `// Takers send immediate-or-cancel at the protective limit: what crosses fills now,
// the remainder is cancelled, so no escrow ever rests invisibly.
return trader.placeOrder({
  pool: onchain.pool,
  side: toBuySide(side),
  price: quote.limitPriceRaw,
  quantity: quote.contractsRaw,
  orderType: ORDER_TYPE.MARKET,
  expireTimestampNs,
  autoApprove: true,
});`,
  },
} as const;
