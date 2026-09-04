"use client";

import type { DeckCard } from "@masayume/core/games";
import { Clock } from "lucide-react";
import type { ReactNode } from "react";
import { Countdown } from "@/components/data";
import { BearMark, BullMark, CoinMark } from "../art/PixelArt";
import { cadenceLabel } from "./SwipeDeck";

/** Flicky's ramp on every clock: calm, then vermilion inside ten minutes, then the loss colour inside two — and a pulse in the last thirty seconds. */
export function clockUrgency(remainingSec: number): { level: "calm" | "near" | "last"; pulse: boolean } {
  return { level: remainingSec <= 120 ? "last" : remainingSec <= 600 ? "near" : "calm", pulse: remainingSec > 0 && remainingSec <= 30 };
}

/**
 * One card's face: whose Window it is, how long it has, what it asks, and the mode's own facts.
 *
 * The countdown is always the Window's real expiry, whatever the mode scores on. A card is a claim
 * on a specific live Window and a player has to be able to see how much of it is left — Practice
 * says separately what it scores, rather than hiding the Window's clock to make its own rule tidy.
 */
export function StageFace({
  card,
  question,
  facts,
  nowMs,
}: {
  card: DeckCard;
  question: ReactNode;
  facts?: ReactNode;
  /** Chain-corrected now from the port; omitted, the countdown ticks locally. */
  nowMs?: number;
}) {
  const urgency = clockUrgency(card.expirySec - Math.floor((nowMs ?? Date.now()) / 1_000));
  return (
    <>
      <div className="st-face-head">
        <span className="st-asset">{card.asset}</span>
        <span className="st-cadence">{cadenceLabel(card.intervalSec)}</span>
        <span className="st-clock" data-urgency={urgency.level} data-pulse={urgency.pulse || undefined}>
          <Clock aria-hidden />
          <Countdown expirySec={card.expirySec} intervalSec={card.intervalSec} nowMs={nowMs} />
        </span>
      </div>
      {/* Flicky's art window (`swipe-screen.tsx` L318–338): the mascot reacts to the lean — the coin at rest,
          the bull on an upward drag, the bear on a downward one — behind a CRT face. The card's own
          `data-swipe` drives the swap, so the face knows nothing about the gesture. */}
      <div className="st-art crt-screen" aria-hidden>
        <CoinMark className="st-art-idle" />
        <BullMark className="st-art-up" />
        <BearMark className="st-art-down" />
      </div>
      <p className="st-question">{question}</p>
      {facts && <div className="st-face-facts">{facts}</div>}
    </>
  );
}

export function StageFact({ label, value, tone }: { label: string; value: ReactNode; tone?: "up" | "down" }) {
  return (
    <div className="st-fact">
      <span className="st-fact-k">{label}</span>
      <span className={`st-fact-v${tone ? ` st-fact-v--${tone}` : ""}`}>{value}</span>
    </div>
  );
}
