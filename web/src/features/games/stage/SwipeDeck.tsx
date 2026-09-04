"use client";

import type { DeckCard, Pick } from "@masayume/core/games";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { useGames } from "../GamesProvider";
import { STAGE } from "./copy";
import "./stage.css";

/**
 * The deck as a gesture: one card at a time, thrown up for UP and down for DOWN.
 *
 * Three things about the shape are deliberate.
 *
 * **The face is a slot.** This component knows a card's identity and nothing about money, so
 * Practice and the Duel are the same motion over different faces — which is the point of building
 * Practice first (`06-game-architecture.md` §Owner decisions 1: the two ship together because they
 * share the swipe loop).
 *
 * **The buttons are not a fallback.** Doc 04 requires a keyboard and pointer alternative to every
 * swipe, so the two calls are always rendered and always sufficient; the drag is the flourish on
 * top. That is also why turning motion off removes the drag and loses nothing.
 *
 * **A refusal is not a failure.** `refusal` is for a card the chain would not take right now — the
 * arena's own entry gate — and it holds the card in place with its reason rather than letting a
 * player throw it at a transaction that would revert.
 */

export interface SwipeDeckProps {
  cards: readonly DeckCard[];
  /** The card awaiting a swipe; null when the deck is played out or the mode has taken the gesture away. */
  active: DeckCard | null;
  /** Which way a card was already played, for the progress strip. Null for one not yet played. */
  playedSide: (cardIndex: number) => Pick | null;
  onPick: (card: DeckCard, side: Pick) => void;
  /** A pick is in flight. The card stays put and the calls go quiet rather than the stage jumping. */
  busy?: boolean;
  /** Why this card cannot be played right now, in the player's words. Null when it can. */
  refusal?: string | null;
  renderFace: (card: DeckCard) => ReactNode;
  /** Rendered under the calls in place of the default hint — the mode's own sentence, when it has one. */
  hint?: ReactNode;
}

/** Past this many pixels of travel, or this fast, the throw counts. Below both, the card springs back. */
const COMMIT_TRAVEL = 84;
const COMMIT_VELOCITY = 480;
const THROW = { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const };
const SETTLE = { type: "spring" as const, stiffness: 260, damping: 26 };
/** Far enough to clear the tallest card at any width; the stack is clipped by the page, not by this. */
const THROW_DISTANCE = 420;

const FULL = {
  enter: { opacity: 0, scale: 0.96, y: 12 },
  in: { opacity: 1, scale: 1, y: 0 },
  out: (side: Pick | null) => ({
    opacity: 0,
    scale: 0.92,
    y: side === "up" ? -THROW_DISTANCE : side === "down" ? THROW_DISTANCE : 0,
    transition: THROW,
  }),
};

/** Reduced motion keeps every state change and drops the movement — the card swaps, it does not fly. */
const REDUCED = {
  enter: { opacity: 1 },
  in: { opacity: 1 },
  out: { opacity: 0, transition: { duration: 0.01 } },
};

function cadenceLabel(intervalSec: number): string {
  if (intervalSec % 3_600 === 0) return `${intervalSec / 3_600}h`;
  if (intervalSec % 60 === 0) return `${intervalSec / 60}m`;
  return `${intervalSec}s`;
}

export function SwipeDeck({ cards, active, playedSide, onPick, busy = false, refusal = null, renderFace, hint }: SwipeDeckProps) {
  const { reducedMotion, feedback } = useGames();
  const [thrown, setThrown] = useState<Pick | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  /** Set only when the card itself had focus when it was played — see the focus effect below. */
  const refocus = useRef(false);

  const held = busy || refusal !== null;
  const draggable = active !== null && !held && !reducedMotion;

  const commit = useCallback(
    (side: Pick) => {
      if (!active || held) {
        feedback("deny");
        return;
      }
      feedback("confirm");
      // Whether to hand focus onward is decided HERE, while the played card still holds it. The
      // calls live outside `.st-deck`, so "focus is inside the deck" means "the card had it".
      refocus.current = document.activeElement !== null && deckRef.current?.contains(document.activeElement) === true;
      setThrown(side);
      onPick(active, side);
    },
    [active, held, onPick, feedback],
  );

  const onDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      const up = info.offset.y <= -COMMIT_TRAVEL || info.velocity.y <= -COMMIT_VELOCITY;
      const down = info.offset.y >= COMMIT_TRAVEL || info.velocity.y >= COMMIT_VELOCITY;
      // Both true means a fast flick that ended back near the origin — the travel decides.
      if (up && !down) commit("up");
      else if (down && !up) commit("down");
    },
    [commit],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        commit("up");
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        commit("down");
      }
    },
    [commit],
  );

  /**
   * A card played from the keyboard hands focus to the next one.
   *
   * Without this the deck is unplayable by keyboard past the first card: the played card unmounts,
   * focus falls back to the body, and the player has to tab all the way in again every time. The
   * guard matters as much as the effect — focus only moves when the card that left had it, so a
   * click on a call button leaves focus on that button, where the player put it.
   *
   * The incoming card is found by its index rather than held in a ref, and that is the whole point:
   * while a throw is in the air BOTH cards are mounted, so a single ref is written by whichever
   * mounts last and cleared by whichever unmounts last. Focusing through it landed on the card on
   * its way out, which then unmounted and dropped focus to the body — the exact bug this fixes.
   */
  useEffect(() => {
    if (!refocus.current || !active) return;
    refocus.current = false;
    deckRef.current?.querySelector<HTMLElement>(`[data-card="${active.index}"]`)?.focus();
  }, [active]);

  const position = active ? cards.findIndex((card) => card.index === active.index) : cards.length;
  const behind = active ? cards.slice(position + 1, position + 3) : [];

  return (
    <div className="st-stage">
      <div className="st-progress">
        <div className="st-pips" aria-hidden>
          {cards.map((card) => {
            const side = playedSide(card.index);
            const state = side ? `st-pip--${side}` : card.index === active?.index ? "st-pip--active" : "";
            return <span key={card.index} className={`st-pip ${state}`} />;
          })}
        </div>
        <span className="st-progress-label">{STAGE.cardOf(Math.min(position + 1, cards.length), cards.length)}</span>
      </div>

      <div className="st-deck" ref={deckRef}>
        {behind.map((card, depth) => (
          <div key={card.index} className="st-card st-card--behind" style={{ "--st-depth": depth + 1 } as CSSProperties} aria-hidden>
            {renderFace(card)}
          </div>
        ))}

        <AnimatePresence initial={false} custom={thrown} mode="popLayout">
          {active ? (
            <motion.div
              key={active.index}
              data-card={active.index}
              className={`st-card st-card--active${held ? " st-card--held" : ""}`}
              variants={reducedMotion ? REDUCED : FULL}
              custom={thrown}
              initial="enter"
              animate="in"
              exit="out"
              transition={SETTLE}
              drag={draggable ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.7}
              dragSnapToOrigin
              onDragEnd={onDragEnd}
              tabIndex={0}
              role="group"
              aria-label={STAGE.cardLabel(active.asset, cadenceLabel(active.intervalSec))}
              onKeyDown={onKeyDown}
            >
              {renderFace(active)}
            </motion.div>
          ) : (
            <div className="st-empty" key="empty">
              <p className="st-empty-title">{STAGE.empty.title}</p>
              <p className="st-empty-body">{STAGE.empty.body}</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <span className="sr-only" aria-live="polite">
        {active ? STAGE.announce(position + 1, cards.length, active.asset, cadenceLabel(active.intervalSec)) : ""}
      </span>

      {refusal && <p className="st-refusal">{refusal}</p>}

      <div className="st-actions">
        <button type="button" className="st-call st-call--up" onClick={() => commit("up")} disabled={!active || held}>
          <ChevronUp aria-hidden />
          {STAGE.up}
        </button>
        <button type="button" className="st-call st-call--down" onClick={() => commit("down")} disabled={!active || held}>
          <ChevronDown aria-hidden />
          {STAGE.down}
        </button>
      </div>

      {hint ?? <p className="st-hint">{held && refusal ? STAGE.hintHeld : STAGE.hint}</p>}
    </div>
  );
}

export { cadenceLabel };
