"use client";

import type { MatchState } from "@masayume/core/games";
import { shortHex } from "@masayume/core/units";
import type { CSSProperties } from "react";
import { addressHue } from "@/lib/address-hue";
import { DUEL } from "./copy";

/**
 * Between the pairing and the first swipe: an opponent, a sealed deck, and the deck opening.
 *
 * The commitment is on screen because it is the thing a player can actually check. The deck is chosen
 * and hashed before either side sees a card, the hash reaches the chain first, and `revealDeck`
 * re-derives it — so showing the hash here is not decoration, it is the receipt for "these cards were
 * fixed before you knew them".
 */
export function DuelLobby({ state, wallet }: { state: Extract<MatchState, { matchId: string }>; wallet: string | null }) {
  const you = wallet?.toLowerCase() ?? null;
  const isCreator = you !== null && state.players.creator.toLowerCase() === you;
  const opponent = isCreator ? state.players.challenger : state.players.creator;

  const stage =
    state.phase === "matched"
      ? { title: DUEL.lobby.committing, body: DUEL.lobby.committingBody }
      : state.phase === "committed"
        ? { title: DUEL.lobby.committed, body: DUEL.lobby.committedBody }
        : { title: DUEL.lobby.revealing, body: DUEL.lobby.waitingPot };

  return (
    <section className="dl-lobby" aria-label={DUEL.lobby.matched}>
      <div className="dl-seats">
        <Seat label={DUEL.lobby.you} address={you} />
        <span className="dl-versus" aria-hidden>
          vs
        </span>
        <Seat label={DUEL.lobby.opponent} address={opponent} />
      </div>
      <p className="dl-seat-note">{isCreator ? DUEL.lobby.seatCreator : DUEL.lobby.seatChallenger}</p>

      <div className="dl-plate">
        <div className="dl-queue-head">
          <span className="dl-spinner" aria-hidden />
          <h2 className="dl-queue-title">{stage.title}</h2>
        </div>
        <p className="dl-body">{stage.body}</p>

        {state.phase === "committed" && <p className="dl-refusal">{DUEL.lobby.createPending}</p>}

        {"commitment" in state && (
          <dl className="dl-facts">
            <div className="dl-fact">
              <dt className="dl-k">{DUEL.lobby.commitment}</dt>
              <dd className="dl-v dl-mono">{shortHex(state.commitment.hash, 10, 8)}</dd>
            </div>
            <div className="dl-fact">
              <dt className="dl-k">{DUEL.entry.tier}</dt>
              <dd className="dl-v">{DUEL.lobby.cards(state.commitment.size)}</dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}

function Seat({ label, address }: { label: string; address: string | null }) {
  return (
    <div className="dl-seat">
      <span className="dl-avatar" style={{ "--dl-hue": address ? addressHue(address) : 0 } as CSSProperties} aria-hidden />
      <span className="dl-seat-name">
        <span className="dl-k">{label}</span>
        <span className="dl-mono">{address ? shortHex(address, 6, 4) : "—"}</span>
      </span>
    </div>
  );
}
