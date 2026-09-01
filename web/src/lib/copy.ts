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
