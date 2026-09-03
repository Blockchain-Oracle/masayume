import type { MarketId } from "../types/market";
import type { Address, Bytes32 } from "../types/primitives";
import type { RefundReason } from "./lifecycle";
import type { ArenaStatus, Pick, StakeTierId } from "./types";

/**
 * The chain's half of a duel, in the arena contract's own vocabulary.
 *
 * Everything here mirrors `contracts/src/games/IGameArena.sol` one for one, in its declaration order,
 * with an index mapper beside every enum. That is the same discipline `types.ts` applies to `ArenaStatus`,
 * and for the same reason: an ABI decode returns a number, and a number that silently means the wrong
 * thing is a bug no type checker can see.
 */

/** Which side of the table. The contract keys every pick by `cardIndex * 2 + seat`. */
export type Seat = 0 | 1;

export const SEAT_CREATOR: Seat = 0;
export const SEAT_CHALLENGER: Seat = 1;

/** `IGameArena.RefundReason`, in the contract's enum order. */
export const ARENA_REFUND_REASONS: readonly RefundReason[] = ["creator-timeout", "join-timeout", "reveal-unavailable", "both-incomplete"];

export function arenaRefundReasonOf(index: number): RefundReason {
  const reason = ARENA_REFUND_REASONS[index];
  if (!reason) throw new Error(`unknown arena refund reason ${index}`);
  return reason;
}

/** Where the arena lives on one chain — regenerated from `contracts/deployments` (AD-10). */
export interface ArenaDeployment {
  chainId: number;
  gameArena: Address;
  fromBlock: bigint;
}

export const ARENA_NOT_DEPLOYED = "GameArena is not deployed on this network yet" as const;

/** The arena's tunables, as `IGameArena.Params` declares them. */
export interface ArenaParams {
  joinWindowSec: number;
  revealWindowSec: number;
  pickWindowSec: number;
  minDeckSize: number;
  maxDeckSize: number;
  minCardLifeSec: number;
}

/** One priced entry. `potBase` is per player; `perCardCapBase` bounds one card's market order. */
export interface ArenaTier {
  tier: number;
  potBase: bigint;
  perCardCapBase: bigint;
  enabled: boolean;
}

/**
 * The arena's record of a match. `pickedMask0` / `pickedMask1` carry one bit per card per seat, and
 * `settledMask` one bit per card — the same three bytes the contract reasons about, kept as numbers
 * rather than expanded, so a projection can compare them to the chain without re-deriving anything.
 */
export interface ArenaMatch {
  matchId: Bytes32;
  creator: Address;
  challenger: Address;
  tier: number;
  status: ArenaStatus;
  deckSize: number;
  pickedMask0: number;
  pickedMask1: number;
  settledMask: number;
  policyVersion: number;
  deckHash: Bytes32;
  createdAtSec: number;
  joinedAtSec: number;
  revealedAtSec: number;
  pickDeadlineSec: number;
  potBase: bigint;
  perCardCapBase: bigint;
}

/** What the arena measured around one IOC, and what the redemption later paid for it. */
export interface ArenaPick {
  cardIndex: number;
  seat: Seat;
  placed: boolean;
  settled: boolean;
  pick: Pick;
  quantity: bigint;
  costBase: bigint;
  payoutBase: bigint;
}

/** A size read off the live book for a stake, as `sizeForStake` returns it. */
export interface ArenaQuote {
  quantityRaw: bigint;
  costRaw: bigint;
  limitYesRaw: bigint;
  priceRaw: bigint;
}

/** True while the pot is still the arena's to decide. */
export function arenaPotOpen(status: ArenaStatus): boolean {
  return status !== "finalized" && status !== "refunded";
}

/** Every card index whose bit is set in a mask — the shape a projection actually iterates. */
export function cardsInMask(mask: number, deckSize: number): readonly number[] {
  const out: number[] = [];
  for (let i = 0; i < deckSize; i += 1) if ((mask >> i) & 1) out.push(i);
  return out;
}

/** The mask a complete deck produces, so "did this seat finish" is one comparison. */
export function fullDeckMask(deckSize: number): number {
  return (1 << deckSize) - 1;
}

export function seatComplete(match: ArenaMatch, seat: Seat): boolean {
  const mask = seat === SEAT_CREATOR ? match.pickedMask0 : match.pickedMask1;
  return mask === fullDeckMask(match.deckSize);
}

export function seatOf(match: ArenaMatch, wallet: Address): Seat | null {
  const who = wallet.toLowerCase();
  if (match.creator.toLowerCase() === who) return SEAT_CREATOR;
  if (match.challenger.toLowerCase() === who) return SEAT_CHALLENGER;
  return null;
}

/** The tier the arena priced, matched back to the table core already publishes. */
export function stakeTierIdOf(tier: number): StakeTierId {
  const ids: readonly StakeTierId[] = ["free", "t1", "t5", "t10"];
  const id = ids[tier];
  if (!id) throw new Error(`unknown arena tier ${tier}`);
  return id;
}

/**
 * Everything a duel ever asks the chain to do, as data. The permissionless ones are marked: any caller
 * may crank them, and the money still goes where the arena already recorded it should.
 */
export type ArenaIntent =
  | { kind: "arena-create"; matchId: Bytes32; challenger: Address; tier: number; deckHash: Bytes32; deckSize: number; policyVersion: number; potBase: bigint }
  | { kind: "arena-join"; matchId: Bytes32; potBase: bigint }
  /** Permissionless: the commitment, not a key, is what proves the deck was fixed first. */
  | { kind: "arena-reveal"; matchId: Bytes32; serverSeed: Bytes32; clientSeeds: readonly Bytes32[]; cards: readonly MarketId[] }
  | { kind: "arena-pick"; matchId: Bytes32; cardIndex: number; pick: Pick; stakeBase: bigint; minQuantityRaw: bigint }
  /** Permissionless once the pick deadline has passed. */
  | { kind: "arena-lock"; matchId: Bytes32 }
  /** Permissionless once the card's Window is resolved or voided. */
  | { kind: "arena-settle-card"; matchId: Bytes32; cardIndex: number }
  /** Permissionless once every played card is settled. */
  | { kind: "arena-finalize"; matchId: Bytes32 }
  | { kind: "arena-cancel"; matchId: Bytes32 }
  /** Permissionless once the join window has closed. */
  | { kind: "arena-refund-unjoined"; matchId: Bytes32 }
  /** Permissionless once the reveal window has closed. */
  | { kind: "arena-refund-unrevealed"; matchId: Bytes32 }
  /** Permissionless: the credit only ever goes to the player named. */
  | { kind: "arena-claim"; player: Address };

/** The intents that move a player's own money and therefore need an allowance first. */
export function arenaIntentSpend(intent: ArenaIntent): bigint {
  if (intent.kind === "arena-create" || intent.kind === "arena-join") return intent.potBase;
  if (intent.kind === "arena-pick") return intent.stakeBase;
  return 0n;
}
