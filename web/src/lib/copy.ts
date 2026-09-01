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
