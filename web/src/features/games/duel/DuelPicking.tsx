"use client";

import {
  STAKE_TIERS,
  cardPlayable,
  pickWindowEndsSec,
  type DeckCard,
  type MatchState,
  type Pick,
} from "@masayume/core/games";
import { isOk } from "@masayume/core/schemas";
import type { Bytes32 } from "@masayume/core/types";
import { formatBaseUnits, formatClock } from "@masayume/core/units";
import { useArenaState } from "@masayume/markets/react";
import { useCallback, useMemo, useState } from "react";
import { useNowMs } from "@/components/data";
import { useVenue } from "@/features/markets";
import { StageFace, StageFact } from "../stage/StageFace";
import { SwipeDeck } from "../stage/SwipeDeck";
import { DUEL } from "./copy";
import { useArenaWrites } from "./useArenaWrites";
import type { DuelRoom } from "./useDuelRoom";

/**
 * The swipe, with money behind it.
 *
 * Same `SwipeDeck` as Practice, so the motion a player learned there is the motion here. Three
 * things it adds, and each of them is a finding from the first live duel rather than a design idea:
 *
 * **A card is gated on the arena's rule, never on ours.** `phase()` calls a Window unenterable for
 * its last 300 seconds; the arena's own floor is `minCardLifeSec`, 240 at the deployed parameters.
 * Gating on ours would refuse swipes the chain would have taken — measured at 278 seconds of card
 * life, where our buffer said no and the arena quoted 11,000 raw (`context/54` §4).
 *
 * **The countdown is the earlier of two clocks.** The pick window can legally outrun the soonest
 * card's usable life, so showing the arena's `pickDeadlineSec` alone would promise seconds that are
 * already refusable.
 *
 * **A lost race is not a failure.** Both seats draw on the same book; the retry lives in the write
 * lane and the stage says what it is doing, so a player sees "asking again", not an error.
 */
export function DuelPicking({ state, wallet, room }: { state: Extract<MatchState, { phase: "picking" }>; wallet: string | null; room: DuelRoom }) {
  const nowMs = useNowMs();
  const arena = useArenaState();
  const { boot } = useVenue();
  const { pick, progress, busy, canSign } = useArenaWrites();
  const [failed, setFailed] = useState<number | null>(null);

  const you = wallet?.toLowerCase() ?? null;
  const params = arena && isOk(arena) ? arena.value?.params : undefined;
  const decimals = boot && isOk(boot) ? boot.value.collateral.decimals : null;
  const symbol = boot && isOk(boot) ? boot.value.collateral.symbol : "";

  // The stake is the tier's own per-card cap, the same for both seats. A duel compares real PnL, so
  // letting one player stake ten times the other would make the pot a bet on size, not on calls.
  const stakeBase = arena && isOk(arena) ? (arena.value?.tiers[STAKE_TIERS.findIndex((t) => t.id === state.tier)]?.perCardCapBase ?? null) : null;

  const mine = useMemo(() => state.receipts.filter((r) => r.player.toLowerCase() === you), [state.receipts, you]);
  const playedSide = useCallback((cardIndex: number) => mine.find((r) => r.cardIndex === cardIndex)?.pick ?? null, [mine]);
  const active = state.cards.find((card) => !mine.some((r) => r.cardIndex === card.index)) ?? null;

  const nowSec = Math.floor((nowMs || Date.now()) / 1_000);
  const endsSec = params ? pickWindowEndsSec(state.cards, params, Math.floor(state.deadlineMs / 1_000)) : Math.floor(state.deadlineMs / 1_000);
  const leftSec = Math.max(0, endsSec - nowSec);
  const playable = active !== null && params !== undefined && cardPlayable(active, params, nowSec);

  const onPick = useCallback(
    (card: DeckCard, side: Pick) => {
      if (stakeBase === null || !canSign) return;
      setFailed(null);
      // Advisory only, and without the side: the opponent learns that you are on this card.
      room.send({ type: "pick.pending", matchId: state.matchId, cardIndex: card.index });
      void pick({ matchId: state.matchId as Bytes32, cardIndex: card.index, marketId: card.marketId, side, stakeBase, deadlineSec: endsSec }).then((outcome) => {
        if (outcome.status !== "confirmed" && outcome.status !== "unknown") setFailed(card.index);
      });
    },
    [pick, room, state.matchId, stakeBase, endsSec, canSign],
  );

  const money = (base: bigint | null) => (base === null || decimals === null ? "—" : formatBaseUnits(base, decimals, { maxDp: 2, minDp: 0 }));

  const renderFace = useCallback(
    (card: DeckCard) => (
      <StageFace
        card={card}
        nowMs={nowMs || undefined}
        question={DUEL.picking.title}
        facts={
          <>
            <StageFact label={DUEL.picking.stake} value={`${money(stakeBase)} ${symbol}`} />
            <StageFact label={DUEL.picking.deadline} value={formatClock(leftSec)} />
          </>
        }
      />
    ),
    [nowMs, stakeBase, symbol, leftSec, decimals],
  );

  const refusal = !canSign ? DUEL.lobby.noSigner : active && params && !playable ? DUEL.picking.tooLate : null;

  /** The opponent's cue only means anything while it is fresh; a stale one is a lie about presence. */
  const OPPONENT_CUE_MS = 8_000;
  const opponentHere =
    room.opponentPending !== null && active !== null && room.opponentPending.cardIndex === active.index && nowMs - room.opponentPending.atMs < OPPONENT_CUE_MS;

  return (
    <section className="du-picking" aria-label={DUEL.picking.title}>
      <SwipeDeck
        cards={state.cards}
        active={active}
        playedSide={playedSide}
        onPick={onPick}
        busy={busy !== null}
        refusal={refusal}
        renderFace={renderFace}
        hint={
          <p className="st-hint">
            {progress ? DUEL.picking.placing(progress.attempt) : failed !== null ? DUEL.picking.failed : DUEL.picking.raceNote}
          </p>
        }
      />

      {opponentHere && (
        <p className="du-pending" role="status">
          <span className="du-pending-dot" aria-hidden />
          {DUEL.picking.opponentDeciding}
        </p>
      )}

      {mine.length > 0 && (
        <div className="du-picked">
          <span className="du-k">{DUEL.picking.yourPicks}</span>
          <ul className="du-picked-list">
            {mine
              .slice()
              .sort((a, b) => a.cardIndex - b.cardIndex)
              .map((receipt) => {
                const card = state.cards.find((c) => c.index === receipt.cardIndex);
                return (
                  <li key={receipt.pickKey} className="du-picked-row">
                    <span className={`du-dot du-dot--${receipt.pick}`} aria-hidden />
                    <span className="du-v">{card?.asset ?? "—"}</span>
                    <span className="du-k">{receipt.pick}</span>
                    <span className="du-foot">{DUEL.picking.filled(receipt.quantity.toString(), money(receipt.costBase), symbol)}</span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </section>
  );
}
