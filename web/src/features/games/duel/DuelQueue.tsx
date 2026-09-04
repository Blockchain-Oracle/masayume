"use client";

import { DUEL } from "./copy";
import type { QueueView } from "./useDuelRoom";

/**
 * Waiting for an opponent, with the venue's own supply on screen beside the count.
 *
 * The deck line is the reason this screen exists rather than a spinner. A duel needs live Windows
 * with enough life left for both players to play every card, and for a few minutes an hour the venue
 * has none — so "nothing is happening" and "no deck exists right now" are different facts, and only
 * one of them means the player should walk away.
 *
 * `nextDeckInSec` has three values and this is where they must not be merged (`protocol.ts` says why):
 * a number is a countdown, `null` is "further out than the projection looked", and **absent** is "not
 * known yet" — which is what every client sees before the server's first supply read lands.
 */
export function DuelQueue({ queue, waitedSec, onLeave }: { queue: QueueView | null; waitedSec: number; onLeave: () => void }) {
  const deckLine =
    queue === null || queue.nextDeckInSec === undefined
      ? DUEL.queue.deckUnknown
      : queue.nextDeckInSec === null
        ? DUEL.queue.deckNone
        : DUEL.queue.deckIn(queue.nextDeckInSec);

  return (
    <section className="dl-queue" aria-label={DUEL.queue.title}>
      <div className="dl-queue-head">
        <span className="dl-spinner" aria-hidden />
        <h2 className="dl-queue-title">{DUEL.queue.title}</h2>
      </div>

      <dl className="dl-facts">
        <div className="dl-fact">
          <dt className="dl-k">{DUEL.queue.waited(waitedSec)}</dt>
          <dd className="dl-v">{queue ? DUEL.queue.waiting(queue.waitingCount) : "—"}</dd>
        </div>
        <div className="dl-fact">
          <dt className="dl-k">{DUEL.entry.mode}</dt>
          <dd className="dl-v">{queue ? DUEL.queue.band(queue.bandNow) : "—"}</dd>
        </div>
      </dl>

      <p className="dl-deck" aria-live="polite">
        {deckLine}
      </p>
      <p className="dl-foot">{DUEL.queue.deckWhy}</p>

      <button type="button" className="dl-quiet" onClick={onLeave}>
        {DUEL.queue.leave}
      </button>
    </section>
  );
}
