/**
 * The money's words — `components/AddFunds.tsx`, `CreditWelcome.tsx` and `app/fund/page.tsx` in the reference,
 * with one change of fact: Yosuku's faucet drips from a treasury with no signature, ours is the venue's own
 * `faucet(uint)` that the wallet signs, so "free" stays true and "no tap" does not.
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
    body: "Masayume runs on testnet, so these are play chips, not real money. Mint some for free, or buy with a card. Either way it lands straight in your wallet.",
    connectFirst: "Connect a wallet first.",
    account: "Your account",
    copied: "copied ✓",
    request: (amount: string, symbol: string) => `Mint ${amount} ${symbol} free`,
    requesting: "Minting…",
    card: "Buy with a card →",
    bridge: "Deposit from another chain →",
    /** Yosuku's third way in bridges USDC through a relayer this deployment does not have. */
    bridgeUnavailable: "No bridge relayer on this deployment yet.",
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
  fund: {
    eyebrow: "Add money",
    title: "Fund your",
    titleAccent: "wallet.",
    body: (symbol: string) => `Choose how much ${symbol} you want. Pay by card, it lands in your wallet in seconds, and only you can ever cash it out.`,
    youGet: "You get",
    youPay: "You pay",
    preset: (n: number, symbol: string) => `${n} ${symbol}`,
    cap: (n: number, symbol: string) => `up to ${n} ${symbol} at a time`,
    connect: "Connect a wallet to fund it.",
    cta: "Fund",
    /**
     * The reference charges a Paystack test card in Naira and credits from a treasury. Neither exists here, so the
     * button says exactly what is missing instead of pretending — the modal's free mint is the real way in.
     */
    blocked: "Card checkout needs a Paystack key and a treasury this deployment does not have",
    freeInstead: "Mint test funds free instead →",
    footnote: "Your funds go straight to your wallet. Masayume never holds your money.",
  },
} as const;

/** The reference's `yosuku:open-funds` / `yosuku:credited`, under our name. Anything may open the modal; only a credit fires the welcome. */
export const OPEN_FUNDS_EVENT = "masayume:open-funds";
export const CREDITED_EVENT = "masayume:credited";
