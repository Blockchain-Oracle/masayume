/** Test funds use a bounded STT treasury and a separate wallet-signed tUSDC mint. */
export const FUNDING = {
  pill: {
    title: "Tap to add money.",
    unit: (symbol: string) => symbol,
    plus: "+",
    aria: "Your balance — tap to add money",
  },
  modal: {
    eyebrow: "Add funds · testnet",
    title: "Get test funds",
    body: "Get free tUSDC for trading. If your wallet is low on STT, we can add gas first, subject to the daily allocation. Both land in your wallet on Somnia Shannon.",
    connectFirst: "Connect a wallet first.",
    account: "Your account",
    copied: "copied ✓",
    request: (_amount: string, _symbol: string) => "Get test funds",
    requesting: "Minting…",
    done: (amount: string, symbol: string) => `${amount} ${symbol} added to your wallet.`,
    trade: "Trade from wallet →",
    close: "Close add funds",
    needMore: "External STT faucets ↗",
    gasFirst: "Need gas while our allocation is unavailable? Use an external faucet:",
  },
  welcome: {
    eyebrow: "You're funded",
    title: (amount: string, symbol: string) => `${amount} ${symbol} is in your wallet`,
    body: "On the house. These are testnet play chips, not real money. You're ready to take your first side.",
    cta: "Let's go →",
    close: "Close",
  },
} as const;

/** The reference's `yosuku:open-funds` / `yosuku:credited`, under our name. Anything may open the modal; only a credit fires the welcome. */
export const OPEN_FUNDS_EVENT = "masayume:open-funds";
export const CREDITED_EVENT = "masayume:credited";
