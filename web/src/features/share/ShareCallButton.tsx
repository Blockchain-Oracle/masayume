"use client";

import { buildCallTweetText, renderCallShareCard, shortCallId, type CallCard } from "./call-card";
import { SHARE } from "./copy";
import { shareHost, useShareCard } from "./useShareCard";

interface ShareCallButtonProps {
  card: CallCard;
  /** The full-width vermilion CTA under The Call; the quiet link otherwise. */
  variant?: "primary" | "link";
}

/** "Share this call ↗" — ported from `reference/yosuku/components/ShareBetButton.tsx`. */
export function ShareCallButton({ card, variant = "link" }: ShareCallButtonProps) {
  const { busy, share } = useShareCard();
  const host = shareHost();
  return (
    <button
      type="button"
      className={variant === "primary" ? "call-share" : "share-link"}
      disabled={busy}
      aria-busy={busy}
      data-cursor="hover"
      onClick={() => void share({ render: () => renderCallShareCard(card, host), fileName: `masayume-call-${shortCallId(card)}.png`, text: buildCallTweetText(card, host) })}
    >
      {busy ? SHARE.rendering : `${SHARE.shareCall} ↗`}
    </button>
  );
}
