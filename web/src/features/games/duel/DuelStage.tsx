"use client";

import { isTerminal, type MatchState, type StakeTierId } from "@masayume/core/games";
import { shortHex } from "@masayume/core/units";
import { useEffect, useState, type ReactNode } from "react";
import { useNowMs } from "@/components/data";
import { useWalletSession } from "@/lib/wallet-session";
import { useGames } from "../GamesProvider";
import { DUEL } from "./copy";
import { DuelEntry } from "./DuelEntry";
import { DuelLobby } from "./DuelLobby";
import { DuelQueue } from "./DuelQueue";
import { useDuelRoom } from "./useDuelRoom";
import "./duel.css";

/**
 * `/games/duel` — the match, drawn from whatever phase the reducer is in.
 *
 * There is one branch here per phase of `MatchState` and no screen state beside it. That is the whole
 * design: the room folds chain-derived messages into the reducer, and this file only chooses which
 * face of that union to draw, so a reconnect that lands on a snapshot draws the right thing without
 * anything here having remembered a step.
 *
 * The shell's `match` is published from here, because the hub has to be able to offer "resume" over
 * "start a new one" from any page under `/games` (`GamesProvider` §match).
 */
export function DuelStage() {
  const room = useDuelRoom();
  const { address } = useWalletSession();
  const { setMatch } = useGames();
  const { state, auth } = room;
  // Held here so it survives the entry being unmounted and remounted by a phase change.
  const [tierId, setTierId] = useState<StakeTierId>("free");

  // The shell's copy of the match, so the rail and the hub can offer to bring a player back to it.
  useEffect(() => setMatch(state), [state, setMatch]);

  return (
    <div className="container gm-page">
      <header className="dl-head">
        <span className="gm-eyebrow">{DUEL.eyebrow}</span>
        <h1 className="dl-title">
          {DUEL.title}
          <span className="accent">.</span>
        </h1>
      </header>

      <div className="dl-layout">
        <div>
          {auth.kind !== "ready" ? <Gate room={room} /> : <Match room={room} wallet={address} tierId={tierId} onTier={setTierId} />}
          {room.error && (
            <div className="dl-error" role="status">
              <p className="dl-body">{room.error.message}</p>
              <p className="dl-foot">{room.error.retryable ? DUEL.error.retryable : DUEL.error.terminal}</p>
              <button type="button" className="dl-quiet" onClick={room.dismissError}>
                {DUEL.error.dismiss}
              </button>
            </div>
          )}
        </div>

        <aside className="dl-side">
          <p className="dl-intro">{DUEL.intro}</p>
          <Connection status={room.status} authed={auth.kind === "ready"} />
        </aside>
      </div>
    </div>
  );
}

/** Everything before the socket: no room here, no wallet, or one signature still to give. */
function Gate({ room }: { room: ReturnType<typeof useDuelRoom> }) {
  const { auth, authorize } = room;

  if (auth.kind === "asking") return <p className="dl-body">{DUEL.status.connecting}</p>;
  if (auth.kind === "unavailable") {
    return (
      <div className="dl-plate">
        <h2 className="dl-queue-title">{DUEL.entry.unavailable}</h2>
        <p className="dl-body">{auth.why}</p>
      </div>
    );
  }
  if (auth.kind === "connect") {
    return (
      <div className="dl-plate">
        <h2 className="dl-queue-title">{DUEL.auth.connectTitle}</h2>
        <p className="dl-body">{DUEL.auth.connectBody}</p>
      </div>
    );
  }

  return (
    <div className="dl-plate">
      <h2 className="dl-queue-title">{DUEL.auth.signTitle}</h2>
      <p className="dl-body">{DUEL.auth.signBody}</p>
      {auth.kind === "refused" && <p className="dl-refusal">{auth.why}</p>}
      <button type="button" className="dl-cta" disabled={auth.kind === "signing"} onClick={() => void authorize()}>
        {auth.kind === "signing" ? DUEL.auth.signing : auth.kind === "refused" ? DUEL.auth.retry : DUEL.auth.sign}
      </button>
    </div>
  );
}

/** One branch per phase. Nothing here is invented: every arm draws a state the reducer is actually in. */
function Match({ room, wallet, tierId, onTier }: { room: ReturnType<typeof useDuelRoom>; wallet: string | null; tierId: StakeTierId; onTier: (tier: StakeTierId) => void }) {
  const { state } = room;
  const nowMs = useNowMs();
  const entry = <DuelEntry onFind={room.joinQueue} roomOpen={room.status === "open"} tierId={tierId} onTier={onTier} />;

  switch (state.phase) {
    case "idle":
    case "readiness":
      return entry;

    case "queued":
      // `nowMs` ticks, so the wait counts up instead of freezing at whatever the last render saw.
      return <DuelQueue queue={room.queue} waitedSec={nowMs === 0 ? 0 : Math.max(0, Math.floor((nowMs - state.queuedAtMs) / 1_000))} onLeave={room.leaveQueue} />;

    case "matched":
    case "committed":
    case "revealed":
      return <DuelLobby state={state} wallet={wallet} />;

    case "cancelled":
    case "expired":
      return <Ended body={state.phase === "expired" ? DUEL.ended.expired : room.queueDropped ? DUEL.ended.dropped : DUEL.ended.cancelled} entry={entry} />;

    case "refunded":
      return <Ended body={DUEL.ended.refunded[state.reason]} entry={entry} />;

    default:
      // Picking, locked, settling, finalized and forfeited: live on chain, not yet drawn here.
      return <Beyond state={state} />;
  }
}

/** A match that ended without a winner. It says what happened, then offers the entry again. */
function Ended({ body, entry }: { body: string; entry: ReactNode }) {
  return (
    <>
      <p className="dl-notice">{body}</p>
      {entry}
    </>
  );
}

/**
 * A match past this build's screens. It reports where the match really is and what will finish it,
 * and it invents nothing: settlement, the pot and every payout are permissionless cranks that run
 * with or without this page open.
 */
function Beyond({ state }: { state: MatchState }) {
  return (
    <div className="dl-plate">
      <h2 className="dl-queue-title">{DUEL.beyond.title}</h2>
      <p className="dl-body">{DUEL.beyond.body}</p>
      {"matchId" in state && (
        <dl className="dl-facts">
          <div className="dl-fact">
            <dt className="dl-k">{DUEL.beyond.match}</dt>
            <dd className="dl-v dl-mono">{shortHex(state.matchId, 10, 8)}</dd>
          </div>
          <div className="dl-fact">
            <dt className="dl-k">{DUEL.status.open}</dt>
            <dd className="dl-v">{isTerminal(state.phase) ? state.phase : `${state.phase}…`}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

function Connection({ status, authed }: { status: string; authed: boolean }) {
  if (!authed) return null;
  const label =
    status === "open"
      ? DUEL.status.open
      : status === "reconnecting"
        ? DUEL.status.reconnecting
        : status === "closed"
          ? DUEL.status.closed
          : DUEL.status.connecting;
  return (
    <p className={`dl-conn dl-conn--${status}`} role="status">
      <span className="dl-conn-dot" aria-hidden />
      {label}
    </p>
  );
}
