/**
 * The money's words — `components/AddFunds.tsx` and `CreditWelcome.tsx` in the reference, with one change of
 * fact: Yosuku's faucet drips from a treasury with no signature, ours is the venue's own `faucet(uint)` that the
 * wallet signs, so "free" stays true and "no tap" does not. The reference's card checkout (`app/fund/page.tsx`)
 * and bridge row are not carried — the owner's ruling of 2026-09-04: one money rail on this testnet, the mint.
 */
export const FUNDING = {
  pill: {
    title: "Tap to add money.",
    unit: (symbol: string) => symbol,
    plus: "+",
    aria: "Your balance — tap to add money",
  },
  modal: {
    eyebrow: "Add funds · testnet",
    title: "Add money",
    body: "Masayume runs on testnet, so these are play chips, not real money. Mint some for free — it lands straight in your wallet.",
    connectFirst: "Connect a wallet first.",
    account: "Your account",
    copied: "copied ✓",
    request: (amount: string, symbol: string) => `Mint ${amount} ${symbol} free`,
    requesting: "Minting…",
    done: (amount: string, symbol: string) => `${amount} ${symbol} added to your wallet.`,
    trade: "Trade from wallet →",
    close: "Close add funds",
    needMore: "Need STT for gas? Get it from a Somnia faucet ↗",
    gasFirst: "Minting is a transaction, so the wallet needs a little STT first:",
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
