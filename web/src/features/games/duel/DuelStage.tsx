"use client";

import { isTerminal, type MatchState, type StakeTierId } from "@masayume/core/games";
import { isOk } from "@masayume/core/schemas";
import type { Bytes32 } from "@masayume/core/types";
import { useArenaMatch } from "@masayume/markets/react";
import { shortHex } from "@masayume/core/units";
import { useEffect, useState, type ReactNode } from "react";
import { useNowMs } from "@/components/data";
import { useWalletSession } from "@/lib/wallet-session";
import { useGames } from "../GamesProvider";
import { DUEL } from "./copy";
import { DuelEntry } from "./DuelEntry";
import { DuelLobby } from "./DuelLobby";
import { DuelPicking } from "./DuelPicking";
import { DuelPublicResult } from "./DuelPublicResult";
import { DuelQueue } from "./DuelQueue";
import { DuelResult } from "./DuelResult";
import { useDuelRoom } from "./useDuelRoom";
import { searchingNow, useRoomOccupancy, type RoomOccupancy } from "./useRoomOccupancy";
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
export function DuelStage({ resumeMatchId = null }: { resumeMatchId?: Bytes32 | null }) {
  const room = useDuelRoom("default", resumeMatchId);
  const { address } = useWalletSession();
  // A deep link is answered from the chain first: a seat gets the stage in resume mode, anyone else the
  // read-only result — Flicky's `play.tsx` guard, which sends a non-participant to `/game/duel/:id`.
  const named = useArenaMatch(resumeMatchId);
  const namedView = named && isOk(named) ? named.value : null;
  const you = address?.toLowerCase() ?? null;
  const spectator = resumeMatchId !== null && namedView !== null && (you === null || (namedView.match.creator !== you && namedView.match.challenger !== you));
  const { setMatch } = useGames();
  const { state, auth } = room;
  // Held here so it survives the entry being unmounted and remounted by a phase change.
  const [tierId, setTierId] = useState<StakeTierId>("free");
  // Read whether or not a wallet is connected: the gate needs it most.
  const occupancy = useRoomOccupancy();

  // The shell's copy of the match, so the rail and the hub can offer to bring a player back to it.
  useEffect(() => setMatch(state), [state, setMatch]);

  return (
    <div className="container gm-page">
      <header className="du-head">
        <span className="gm-eyebrow">{DUEL.eyebrow}</span>
        <h1 className="du-title">
          {DUEL.title}
          <span className="accent">.</span>
        </h1>
      </header>

      <div className="du-layout">
        <div>
          {spectator && resumeMatchId ? (
            <DuelPublicResult matchId={resumeMatchId} />
          ) : auth.kind !== "ready" ? (
            <Gate room={room} occupancy={occupancy} />
          ) : (
            <Match room={room} wallet={address} tierId={tierId} onTier={setTierId} occupancy={occupancy} />
          )}
          {room.error && (
            <div className="du-error" role="status">
              <p className="du-body">{room.error.message}</p>
              <p className="du-foot">{room.error.retryable ? DUEL.error.retryable : DUEL.error.terminal}</p>
              <button type="button" className="du-quiet" onClick={room.dismissError}>
                {DUEL.error.dismiss}
              </button>
            </div>
          )}
        </div>

        <aside className="du-side">
          <p className="du-intro">{DUEL.intro}</p>
          <Connection status={room.status} authed={auth.kind === "ready"} />
        </aside>
      </div>
    </div>
  );
}

/**
 * Everything before the socket: no room here, no wallet, or one signature still to give.
 *
 * Every arm of it now carries the room's occupancy, read with no credential at all. A gate that shows
 * only a button asks a player to spend a wallet prompt to discover whether anybody is on the other side
 * of it — which was the first thing this screen got wrong.
 */
function Gate({ room, occupancy }: { room: ReturnType<typeof useDuelRoom>; occupancy: RoomOccupancy | null }) {
  const { auth, authorize } = room;
  const here = <Occupancy occupancy={occupancy} />;

  if (auth.kind === "asking") return <p className="du-body">{DUEL.status.connecting}</p>;
  if (auth.kind === "unavailable") {
    return (
      <div className="du-plate">
        <h2 className="du-queue-title">{DUEL.entry.unavailable}</h2>
        <p className="du-body">{auth.why}</p>
      </div>
    );
  }
  if (auth.kind === "connect") {
    return (
      <div className="du-plate">
        <h2 className="du-queue-title">{DUEL.auth.connectTitle}</h2>
        <p className="du-body">{DUEL.auth.connectBody}</p>
        {here}
      </div>
    );
  }

  return (
    <div className="du-plate">
      <h2 className="du-queue-title">{DUEL.auth.signTitle}</h2>
      <p className="du-body">{DUEL.auth.signBody}</p>
      {here}
      {auth.kind === "refused" && <p className="du-refusal">{auth.why}</p>}
      <button type="button" className="du-cta" disabled={auth.kind === "signing"} onClick={() => void authorize()}>
        {auth.kind === "signing" ? DUEL.auth.signing : auth.kind === "refused" ? DUEL.auth.retry : DUEL.auth.sign}
      </button>
    </div>
  );
}

/** One branch per phase. Nothing here is invented: every arm draws a state the reducer is actually in. */
function Match({
  room,
  wallet,
  tierId,
  onTier,
  occupancy,
}: {
  room: ReturnType<typeof useDuelRoom>;
  wallet: string | null;
  tierId: StakeTierId;
  onTier: (tier: StakeTierId) => void;
  occupancy: RoomOccupancy | null;
}) {
  const { state } = room;
  const nowMs = useNowMs();
  const entry = <DuelEntry onFind={room.joinQueue} roomOpen={room.status === "open"} tierId={tierId} onTier={onTier} occupancy={occupancy} />;

  switch (state.phase) {
    case "idle":
      return entry;

    /**
     * The entry again, with what just happened above it.
     *
     * `readiness` is where a dissolved pairing lands, and saying nothing here would put the player back
     * at "find a match" as though the last two minutes had not happened — which, before `match.dissolved`
     * existed, is what a silent re-queue did to them.
     */
    case "readiness":
      return room.dissolved ? <Dissolved dissolved={room.dissolved} entry={entry} /> : entry;

    case "queued":
      // `nowMs` ticks, so the wait counts up instead of freezing at whatever the last render saw.
      return <DuelQueue queue={room.queue} waitedSec={nowMs === 0 ? 0 : Math.max(0, Math.floor((nowMs - state.queuedAtMs) / 1_000))} onLeave={room.leaveQueue} />;

    case "matched":
    case "committed":
    case "revealed":
      return <DuelLobby state={state} wallet={wallet} dealing={room.dealing} />;

    case "picking":
      return <DuelPicking state={state} wallet={wallet} room={room} />;

    case "locked":
    case "settling":
    case "finalized":
    case "forfeited":
      return <DuelResult state={state} wallet={wallet} />;

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

/** The room's own count, or the honest absence of one. Never a zero standing in for a service that is down. */
function Occupancy({ occupancy }: { occupancy: RoomOccupancy | null }) {
  if (!occupancy) return null;
  if (!occupancy.reachable) return <p className="du-foot">{DUEL.auth.roomDown}</p>;
  const searching = searchingNow(occupancy);
  if (searching > 0) return <p className="du-deck">{DUEL.auth.searching(searching)}</p>;
  if (occupancy.pairing > 0) return <p className="du-deck">{DUEL.auth.inMatch(occupancy.pairing)}</p>;
  return <p className="du-foot">{DUEL.auth.nobody}</p>;
}

/** A pairing the room ended before the chain was involved: what happened, and what is being done about it. */
function Dissolved({ dissolved, entry }: { dissolved: NonNullable<ReturnType<typeof useDuelRoom>["dissolved"]>; entry: ReactNode }) {
  return (
    <>
      <div className="du-notice" role="status">
        <p className="du-body">
          {DUEL.lobby.dissolvedTitle}: {dissolved.why}.
        </p>
        <p className="du-foot">{dissolved.searchAgain ? DUEL.lobby.dissolvedAgain : DUEL.lobby.dissolvedStop}</p>
      </div>
      {entry}
    </>
  );
}

/** A match that ended without a winner. It says what happened, then offers the entry again. */
function Ended({ body, entry }: { body: string; entry: ReactNode }) {
  return (
    <>
      <p className="du-notice">{body}</p>
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
    <div className="du-plate">
      <h2 className="du-queue-title">{DUEL.beyond.title}</h2>
      <p className="du-body">{isTerminal(state.phase) || state.phase === "forfeited" ? DUEL.beyond.done : DUEL.beyond.live}</p>
      {"matchId" in state && (
        <dl className="du-facts">
          <div className="du-fact">
            <dt className="du-k">{DUEL.beyond.match}</dt>
            <dd className="du-v du-mono">{shortHex(state.matchId, 10, 8)}</dd>
          </div>
          <div className="du-fact">
            <dt className="du-k">{DUEL.beyond.phase}</dt>
            <dd className="du-v">{state.phase}</dd>
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
    <p className={`du-conn du-conn--${status}`} role="status">
      <span className="du-conn-dot" aria-hidden />
      {label}
    </p>
  );
}
