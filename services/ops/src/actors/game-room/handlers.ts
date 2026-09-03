import {
  encodeMatchState,
  roomError,
  roomRef,
  sanitizeChat,
  ROOM_PROTOCOL_VERSION,
  type ClientMessage,
  type MatchState,
  type ServerMessage,
} from "@masayume/core/games";
import { isBytes32, type Address, type Bytes32 } from "@masayume/core/types";
import { marketsProvider } from "@masayume/markets";
import type { RoomConnection, RoomHub } from "./hub";
import { buildMatchSnapshot } from "./snapshot";

/**
 * What the room does with one validated message.
 *
 * Two invariants hold across every branch. A connection is answered only after `hello`, so a client
 * cannot skip the version handshake by sending something else first. And joining a match's room requires
 * being one of its two players, checked against the arena's own record rather than against anything the
 * client said — there is no spectator seat, so a wallet that is not in the match is refused rather than
 * given a read-only view of somebody else's picks.
 */

/** Pairing and the queue, when a matchmaker is running. Absent, the queue is honestly unavailable. */
export interface Matchmaker {
  join(connection: RoomConnection, request: Extract<ClientMessage, { type: "queue.join" }>): Promise<void>;
  leave(connection: RoomConnection): void;
}

/** Where a fresh browser learns which match it is already in, without being told by the browser. */
export interface MatchDirectory {
  activeMatchFor(wallet: Address): Promise<Bytes32 | null>;
}

export interface RoomContext {
  hub: RoomHub;
  chainId: number;
  arena: Address;
  log: (why: string) => void;
  matchmaker: Matchmaker | null;
  directory: MatchDirectory | null;
}

const IDLE_SNAPSHOT = { phase: "idle" } as const;

function playersOf(state: MatchState): readonly Address[] {
  if (!("players" in state)) return [];
  const { creator, challenger } = state.players;
  return challenger ? [creator, challenger] : [creator];
}

/** A match id the arena could actually hold. Checked here so a malformed one is a refusal, not an RPC error. */
function asMatchId(value: string): Bytes32 | null {
  const lower = value.toLowerCase();
  return isBytes32(lower) ? lower : null;
}

/**
 * The reconnect path, whole: read the match, check the wallet belongs in it, join its room, send one
 * snapshot, then let the deltas resume. Nothing about the previous connection is consulted.
 */
async function sendSnapshot(ctx: RoomContext, connection: RoomConnection, matchId: Bytes32 | null, about: ClientMessage["type"]): Promise<void> {
  const serverTimeMs = marketsProvider.nowMs();
  if (!matchId) {
    ctx.hub.send(connection, { type: "snapshot", serverTimeMs, wallet: connection.wallet, room: null, state: IDLE_SNAPSHOT });
    return;
  }

  const built = await buildMatchSnapshot(matchId, ctx.chainId);
  if (!built.ok) {
    ctx.hub.send(connection, roomError(built.code, built.why, about));
    return;
  }
  if (built.warning) ctx.log(built.warning);

  const players = playersOf(built.state);
  if (!players.some((player) => player === connection.wallet)) {
    ctx.hub.send(connection, roomError("forbidden", "this match is not yours", about));
    return;
  }

  const ref = roomRef(ctx.chainId, ctx.arena, matchId);
  ctx.hub.join(connection, ref, players);
  ctx.hub.send(connection, { type: "snapshot", serverTimeMs, wallet: connection.wallet, room: ref, state: encodeMatchState(built.state) });
  const presence = ctx.hub.presenceOf(ref.key);
  if (presence) ctx.hub.broadcast(ref.key, presence);
}

/** The room a message claims, if this connection is really in it. */
function roomFor(connection: RoomConnection, matchId: string): string | null {
  return connection.room && connection.room.matchId === matchId.toLowerCase() ? connection.room.key : null;
}

function relay(ctx: RoomContext, connection: RoomConnection, matchId: string, message: ServerMessage, about: ClientMessage["type"]): void {
  const key = roomFor(connection, matchId);
  if (!key) {
    ctx.hub.send(connection, roomError("forbidden", "you are not in that room", about));
    return;
  }
  ctx.hub.broadcast(key, message);
}

export async function handleMessage(ctx: RoomContext, connection: RoomConnection, message: ClientMessage): Promise<void> {
  if (message.type !== "hello" && !connection.greeted) {
    ctx.hub.send(connection, roomError("bad-protocol", "say hello first", message.type));
    return;
  }

  switch (message.type) {
    case "hello": {
      if (message.protocolVersion !== ROOM_PROTOCOL_VERSION) {
        ctx.hub.send(connection, roomError("bad-protocol", `this room speaks protocol ${ROOM_PROTOCOL_VERSION}`, "hello"));
        connection.socket.close();
        return;
      }
      connection.greeted = true;
      const asked = message.resumeMatchId ?? null;
      const resume = asked ? asMatchId(asked) : ((await ctx.directory?.activeMatchFor(connection.wallet)) ?? null);
      if (asked && !resume) {
        ctx.hub.send(connection, roomError("bad-message", "that is not a match id", "hello"));
        return;
      }
      await sendSnapshot(ctx, connection, resume, "hello");
      return;
    }

    case "resync": {
      const matchId = asMatchId(message.matchId);
      if (!matchId) {
        ctx.hub.send(connection, roomError("bad-message", "that is not a match id", "resync"));
        return;
      }
      await sendSnapshot(ctx, connection, matchId, "resync");
      return;
    }

    case "queue.join": {
      if (!ctx.matchmaker) {
        ctx.hub.send(connection, roomError("queue-unavailable", "matchmaking is not running on this room", "queue.join"));
        return;
      }
      await ctx.matchmaker.join(connection, message);
      return;
    }

    case "queue.leave":
      ctx.matchmaker?.leave(connection);
      return;

    /** Advisory only, and deliberately without the side: the opponent learns *that* you are deciding. */
    case "pick.pending":
      relay(ctx, connection, message.matchId, { type: "pick.pending", matchId: message.matchId, player: connection.wallet, cardIndex: message.cardIndex }, "pick.pending");
      return;

    case "chat": {
      const body = sanitizeChat(message.body);
      if (!body) return;
      relay(ctx, connection, message.matchId, { type: "chat", matchId: message.matchId, author: connection.wallet, body, atMs: marketsProvider.nowMs() }, "chat");
      return;
    }

    case "reaction":
      relay(ctx, connection, message.matchId, { type: "reaction", matchId: message.matchId, author: connection.wallet, reaction: message.reaction, atMs: marketsProvider.nowMs() }, "reaction");
      return;
  }
}

/** A player leaving is a presence change for whoever is left, not a silent disappearance. */
export function announceDeparture(ctx: RoomContext, connection: RoomConnection): void {
  const key = connection.room?.key;
  ctx.hub.close(connection);
  if (!key) return;
  const presence = ctx.hub.presenceOf(key);
  if (presence) ctx.hub.broadcast(key, presence);
}
