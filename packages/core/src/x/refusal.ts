import type { XRefusalCode } from "./receipt";

/** Safe, shared recovery copy for public replies and the app's receipt list. */
export const X_REFUSAL_DETAILS: Record<XRefusalCode, string> = {
  "account-not-linked": "Link your X account to your wallet in the app.",
  "instruction-invalid": "Use BTC or ETH, UP or DOWN, an amount, and a Window.",
  "balance-unavailable": "Your X trading balance could not be checked. Try again shortly.",
  "not-deployed": "Trading is unavailable on this network.",
  "grant-missing": "Fund and enable X trading in the app.",
  "grant-mismatch": "Reconnect X trading to the current service in the app.",
  "grant-expired": "Renew X trading in the app. Your remaining funds are still yours.",
  "grant-update-required": "Update X trading in the app to use your funded balance. No additional deposit is needed.",
  "no-window": "No matching Window is open right now.",
  "quote-unavailable": "A current quote could not be confirmed.",
  "no-liquidity": "No fillable quote was available for this instruction.",
  "price-moved": "The price moved beyond the accepted cost.",
  "permission-denied": "X trading could not use its current permission. Check X trading in the app.",
  "insufficient-funds": "This order exceeds the available X balance. Fund X trading or request a smaller amount.",
  "position-limit": "Your X permission has reached its open-position limit. Review positions in Portfolio.",
  "price-limit": "Your X permission still has an entry-price restriction. Update X trading in the app.",
  "execution-paused": "X execution is paused by the service. Check its status in the app.",
  "execution-unavailable": "Execution is unavailable; check the app for status.",
  unconfirmed: "The order could not be confirmed. Check the app before trying again.",
};

export function xReceiptRecovery(code: XRefusalCode | null | undefined): { label: string; href: string } | null {
  if (code === "position-limit") return { label: "Review positions", href: "/portfolio" };
  if (code && ["grant-missing", "grant-mismatch", "grant-expired", "grant-update-required", "permission-denied", "price-limit", "insufficient-funds", "account-not-linked"].includes(code)) {
    return { label: code === "insufficient-funds" ? "Manage X balance" : code === "grant-expired" ? "Renew X trading" : "Check X trading", href: "/trade-from-x#x-trading" };
  }
  return null;
}
