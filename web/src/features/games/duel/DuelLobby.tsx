"use client";

import { STAKE_TIERS, type MatchState } from "@masayume/core/games";
import { isOk } from "@masayume/core/schemas";
import type { Address, Bytes32 } from "@masayume/core/types";
import { formatBaseUnits, shortHex } from "@masayume/core/units";
import { useArenaMatch, useArenaState } from "@masayume/markets/react";
import type { CSSProperties } from "react";
import { useVenue } from "@/features/markets";
import { addressHue } from "@/lib/address-hue";
import { DUEL } from "./copy";
import { DealingPlate, RefusalPlate } from "./DuelWaiting";
import { useArenaWrites } from "./useArenaWrites";
import type { DealingView } from "./useDuelRoom";

/**
 * Between the pairing and the first swipe: an opponent, a sealed deck, and the deck opening.
 *
 * The commitment is on screen because it is the thing a player can actually check. The deck is chosen
 * and hashed before either side sees a card, the hash reaches the chain first, and `revealDeck`
 * re-derives it — so showing the hash here is not decoration, it is the receipt for "these cards were
 * fixed before you knew them".
 */
export function DuelLobby({ state, wallet, dealing }: { state: Extract<MatchState, { matchId: string }>; wallet: string | null; dealing: DealingView | null }) {
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

        {/* The room's own clock for this pairing, only while it is the thing being waited on. */}
        {state.phase === "matched" && dealing?.matchId === state.matchId && <DealingPlate dealing={dealing} />}

        {state.phase === "committed" && <OnChain state={state} isCreator={isCreator} wallet={you as Address | null} />}

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

/**
 * The two transactions a paired match needs from its players, and neither of them is automatic.
 *
 * The creator puts the match on chain with the sealed deck's hash; the challenger joins once it is
 * there. Both escrow, so both are a button a player presses — nothing here signs on its own, and the
 * amount named is the arena's own tier price rather than the table's.
 *
 * The challenger's button appears only when the chain says the match is `waiting`. Offering it before
 * the creation has landed would be offering a transaction that reverts.
 */
function OnChain({ state, isCreator, wallet }: { state: Extract<MatchState, { phase: "committed" }>; isCreator: boolean; wallet: Address | null }) {
  const arena = useArenaState();
  const onChain = useArenaMatch(state.matchId as Bytes32);
  const { boot } = useVenue();
  const { create, join, busy, canSign, refusal } = useArenaWrites();

  const tiers = arena && isOk(arena) ? arena.value?.tiers : undefined;
  const potBase = tiers?.[STAKE_TIERS.findIndex((t) => t.id === state.tier)]?.potBase ?? null;
  const decimals = boot && isOk(boot) ? boot.value.collateral.decimals : null;
  const symbol = boot && isOk(boot) ? boot.value.collateral.symbol : "";
  const pot = potBase === null || decimals === null ? "—" : formatBaseUnits(potBase, decimals, { maxDp: 2, minDp: 0 });

  const created = onChain && isOk(onChain) && onChain.value !== null;
  const { challenger } = state.players;

  if (!canSign) return <p className="dl-refusal">{DUEL.lobby.noSigner}</p>;

  const refused = refusal ? <RefusalPlate diagnosis={refusal.diagnosis} gasShort={refusal.gasShort} wallet={wallet} /> : null;

  if (isCreator) {
    if (created) return <p className="dl-body">{DUEL.lobby.waitingCreate}</p>;
    return (
      <>
        <p className="dl-body">{DUEL.lobby.openBody(pot, symbol)}</p>
        <button
          type="button"
          className="dl-cta"
          disabled={busy !== null || potBase === null || !challenger}
          onClick={() =>
            challenger &&
            potBase !== null &&
            void create({
              matchId: state.matchId as Bytes32,
              challenger,
              tier: state.tier,
              deckHash: state.commitment.hash,
              deckSize: state.commitment.size,
              policyVersion: state.commitment.policyVersion,
              potBase,
            })
          }
        >
          {busy === "create" ? DUEL.lobby.opening : refusal ? DUEL.lobby.refusedRetry : DUEL.lobby.openCta}
        </button>
        {refused}
      </>
    );
  }

  if (!created) return <p className="dl-body">{DUEL.lobby.waitingCreate}</p>;
  return (
    <>
      <p className="dl-body">{DUEL.lobby.joinBody(pot, symbol)}</p>
      <button
        type="button"
        className="dl-cta"
        disabled={busy !== null || potBase === null}
        onClick={() => potBase !== null && void join(state.matchId as Bytes32, potBase)}
      >
        {busy === "join" ? DUEL.lobby.joining : refusal ? DUEL.lobby.refusedRetry : DUEL.lobby.joinCta}
      </button>
      {refused}
    </>
  );
}
