import { z } from "zod";
import { addressSchema, type Address } from "../types/primitives";
import type { MatchEvent } from "./lifecycle";
import { decodeDeckCards, decodeMatchState, decodeOutcome, decodeReceipt, wireCommitmentSchema, wireDeckCardSchema, wireMatchStateSchema, wireOutcomeSchema, wireReceiptSchema } from "./wire";

/**
 * The duel room's protocol: every message the browser and the ops room server may exchange, and the
 * one function that turns a server message into reducer events.
 *
 * Three rules are enforced by the shape rather than by the server's care.
 *
 * **No client message carries money.** There is no client message with a cost, a size, a payout or a
 * result in it, so no amount of server bugs can let a browser assert one. The economic messages —
 * `pick.confirmed`, `settlement.progress`, `match.finalized` — exist only in the server union, and the
 * server only ever builds them from a chain log (`06-game-architecture.md`: "Only snapshots/events from
 * chain and Postgres can change economic UI").
 *
 * **`pick.pending` names a card, never a side.** It is the "your opponent is deciding" cue. Relaying the
 * direction would hand the other player a live read on a card they still hold, for the seconds before
 * the chain makes it public anyway; the field simply does not exist, so it cannot be leaked by mistake.
 *
 * **Sequence numbers are absent.** They would be advisory here (`lifecycle.ts` says why): the reducer is
 * total and receipts are keyed by chain log identity, so a duplicate delta is a no-op and a missed one is
 * repaired by the next `snapshot`. A counter would only invite a client to trust ordering it cannot verify.
 */

/** Bumped when a message's meaning changes. A client on another version is refused at `hello`, not tolerated. */
export const ROOM_PROTOCOL_VERSION = 1;

/** Frames above this are dropped by the server before parsing — `ws`'s own `maxPayload`, stated once here. */
export const ROOM_MAX_PAYLOAD_BYTES = 8 * 1024;

/** Silence longer than this fails the heartbeat and the socket is closed; a phone that slept reconnects. */
export const ROOM_HEARTBEAT_MS = 30_000;
export const ROOM_HEARTBEAT_GRACE_MS = 15_000;

export const CHAT_MAX_CHARS = 200;

/** A fixed set, sent as names: the UI owns the glyph, so a room can never be flooded with arbitrary unicode. */
export const REACTIONS = ["fire", "laugh", "shock", "salute", "ice"] as const;
export type Reaction = (typeof REACTIONS)[number];

/** `chainId:arena:matchId` — one room per match per deployment, so two chains never share a room. */
export function roomKey(chainId: number, arena: string, matchId: string): string {
  return `${chainId}:${arena.toLowerCase()}:${matchId.toLowerCase()}`;
}

export interface RoomRef {
  key: string;
  chainId: number;
  arena: Address;
  matchId: string;
}

export function roomRef(chainId: number, arena: Address, matchId: string): RoomRef {
  return { key: roomKey(chainId, arena, matchId), chainId, arena: arena.toLowerCase() as Address, matchId: matchId.toLowerCase() };
}

/**
 * Chat as it is stored and broadcast: trimmed, collapsed, and stripped of the control characters that
 * would otherwise let one line rewrite the transcript around it. Rendering escapes; this normalises.
 */
export function sanitizeChat(body: string): string {
  return body.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").replace(/\s+/g, " ").trim().slice(0, CHAT_MAX_CHARS);
}

/** Every way a room can refuse. `retryable` is the client's instruction: reconnect, or stop and say why. */
export const ROOM_ERROR_CODES = [
  "bad-protocol",
  "unauthenticated",
  "forbidden",
  "unknown-match",
  "bad-message",
  "rate-limited",
  "too-large",
  "already-queued",
  "queue-unavailable",
  "internal",
] as const;
export type RoomErrorCode = (typeof ROOM_ERROR_CODES)[number];

/** Only a transport or capacity problem is worth retrying; a rejected claim will be rejected again. */
export function isRetryable(code: RoomErrorCode): boolean {
  return code === "rate-limited" || code === "queue-unavailable" || code === "internal";
}

const matchIdSchema = z.string().min(1).max(66);
const modeSchema = z.enum(["free", "ranked"]);
const tierSchema = z.enum(["free", "t1", "t5", "t10"]);
const cardIndexSchema = z.number().int().min(0).max(7);
const playersSchema = z.object({ creator: addressSchema, challenger: addressSchema.nullable() });
const roomRefSchema = z.object({ key: z.string().min(3).max(160), chainId: z.number().int().positive(), arena: addressSchema, matchId: matchIdSchema });

/* ── Browser → room ─────────────────────────────────────────────────────────────────────────────── */

export const clientMessageSchema = z.discriminatedUnion("type", [
  /** The first frame after the upgrade. `resumeMatchId` asks for that match's snapshot instead of the queue's. */
  z.object({ type: z.literal("hello"), protocolVersion: z.number().int(), resumeMatchId: matchIdSchema.nullish() }),
  z.object({
    type: z.literal("queue.join"),
    mode: modeSchema,
    tier: tierSchema,
    region: z.string().min(1).max(24),
    /** Published before the deck exists: the player's half of the seed, hashed. */
    clientSeedCommitment: z.string().min(1).max(160),
  }),
  z.object({ type: z.literal("queue.leave") }),
  z.object({ type: z.literal("pick.pending"), matchId: matchIdSchema, cardIndex: cardIndexSchema }),
  z.object({ type: z.literal("chat"), matchId: matchIdSchema, body: z.string().min(1).max(CHAT_MAX_CHARS * 2) }),
  z.object({ type: z.literal("reaction"), matchId: matchIdSchema, reaction: z.enum(REACTIONS) }),
  /** "I think I missed something" — answered with a whole snapshot, never a replay of deltas. */
  z.object({ type: z.literal("resync"), matchId: matchIdSchema }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ClientMessageType = ClientMessage["type"];

/* ── Room → browser ─────────────────────────────────────────────────────────────────────────────── */

export const serverMessageSchema = z.discriminatedUnion("type", [
  /**
   * The whole truth, rebuilt from the arena and the projection. Sent after `hello`, after `resync`, and
   * whenever the server would otherwise have to guess whether a client is caught up.
   */
  z.object({
    type: z.literal("snapshot"),
    serverTimeMs: z.number().int().positive(),
    wallet: addressSchema,
    room: roomRefSchema.nullable(),
    state: wireMatchStateSchema,
  }),
  z.object({
    type: z.literal("queue.update"),
    waitingCount: z.number().int().min(0),
    /** The rating band this player's own search has widened to — the queue screen's honest progress. */
    bandNow: z.number().int().min(0),
    waitedMs: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("match.found"),
    room: roomRefSchema,
    players: playersSchema,
    mode: modeSchema,
    tier: tierSchema,
    opponent: z.object({ wallet: addressSchema, rating: z.number().int().min(0) }),
  }),
  z.object({ type: z.literal("deck.committed"), matchId: matchIdSchema, commitment: wireCommitmentSchema }),
  z.object({
    type: z.literal("deck.revealed"),
    matchId: matchIdSchema,
    cards: z.array(wireDeckCardSchema).min(3).max(5),
    /** The arena's own `pickDeadlineSec`, in milliseconds — never a countdown the client started itself. */
    deadlineMs: z.number().int().positive(),
  }),
  /** Advisory presence, from the opponent's swipe. No side, no amount — see the header. */
  z.object({ type: z.literal("pick.pending"), matchId: matchIdSchema, player: addressSchema, cardIndex: cardIndexSchema }),
  z.object({ type: z.literal("pick.confirmed"), matchId: matchIdSchema, receipt: wireReceiptSchema }),
  z.object({ type: z.literal("picks.locked"), matchId: matchIdSchema, incomplete: z.array(addressSchema).max(2) }),
  z.object({
    type: z.literal("settlement.progress"),
    matchId: matchIdSchema,
    receipt: wireReceiptSchema,
    settled: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  z.object({ type: z.literal("match.finalized"), matchId: matchIdSchema, outcome: wireOutcomeSchema }),
  z.object({
    type: z.literal("match.refunded"),
    matchId: matchIdSchema,
    reason: z.enum(["creator-cancelled", "join-timeout", "reveal-unavailable", "both-incomplete"]),
  }),
  z.object({
    type: z.literal("presence"),
    room: roomRefSchema,
    players: z.array(z.object({ wallet: addressSchema, online: z.boolean(), lastSeenMs: z.number().int().min(0) })).max(2),
  }),
  z.object({ type: z.literal("chat"), matchId: matchIdSchema, author: addressSchema, body: z.string().max(CHAT_MAX_CHARS), atMs: z.number().int().positive() }),
  z.object({ type: z.literal("reaction"), matchId: matchIdSchema, author: addressSchema, reaction: z.enum(REACTIONS), atMs: z.number().int().positive() }),
  z.object({
    type: z.literal("error"),
    code: z.enum(ROOM_ERROR_CODES),
    message: z.string().max(300),
    retryable: z.boolean(),
    /** The client message that caused it, when there was one — so a UI can blame the right control. */
    about: z.string().max(40).nullish(),
  }),
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;
export type ServerMessageType = ServerMessage["type"];

export function roomError(code: RoomErrorCode, message: string, about?: ClientMessageType): Extract<ServerMessage, { type: "error" }> {
  return { type: "error", code, message, retryable: isRetryable(code), about: about ?? null };
}

/**
 * A server message as reducer events — the single place the wire meets `lifecycle.ts`.
 *
 * Messages that carry no lifecycle meaning (presence, chat, a pending swipe, a queue count) return
 * nothing rather than a no-op event, so a caller can tell "this changed the match" from "this did not"
 * without knowing the protocol. `deck.revealed` returns two events because the arena publishes the deck
 * and the pick deadline in one log, while the lifecycle keeps "the cards are known" separate from "the
 * clock is running" — the practice stage has the first without the second.
 */
export function matchEventsOf(message: ServerMessage): readonly MatchEvent[] {
  switch (message.type) {
    case "snapshot":
      return [{ kind: "resync", snapshot: decodeMatchState(message.state) }];
    case "match.found":
      return [{ kind: "paired", matchId: message.room.matchId, players: message.players }];
    case "deck.committed":
      return [{ kind: "commitmentPublished", commitment: message.commitment }];
    case "deck.revealed":
      return [
        { kind: "deckRevealed", cards: decodeDeckCards(message.cards) },
        { kind: "pickingOpened", deadlineMs: message.deadlineMs },
      ];
    case "pick.confirmed":
      return [{ kind: "pickConfirmed", receipt: decodeReceipt(message.receipt) }];
    case "picks.locked":
      return [{ kind: "pickDeadlinePassed", incomplete: message.incomplete }];
    case "settlement.progress":
      return [{ kind: "cardSettled", receipt: decodeReceipt(message.receipt) }];
    case "match.finalized":
      return [{ kind: "finalized", outcome: decodeOutcome(message.outcome) }];
    case "match.refunded":
      return [{ kind: "refunded", reason: message.reason }];
    default:
      return [];
  }
}
