import { randomBytes } from "node:crypto";
import { deckCommitmentPreimage, selectDeck, type DeckCandidate, type DeckCard, type DeckLane } from "@masayume/core/games";
import { phase } from "@masayume/core/lifecycle";
import { isOk } from "@masayume/core/schemas";
import type { Address, Bytes32, Hex, MarketId } from "@masayume/core/types";
import { putDeck } from "@masayume/db";
import { marketsProvider, parseMarketsEnv, resolveVenueId } from "@masayume/markets";
import { keccak256 } from "viem";
import { DECK_KEY_ENV, deckKey, journal, seal, type RevealMaterial } from "./seal";

/**
 * Dealing a deck, and making its reveal durable before anyone can be asked to pay for it.
 *
 * The order here is the whole point. Cards are chosen, the material is written to disk and to Postgres,
 * and only then is a commitment handed back for a player to put on chain. A commitment published before
 * its preimage is durable is a match that can only refund, and the player who paid for it will have been
 * told a duel was about to start.
 *
 * The policy version is in the commitment, so a deck dealt under one set of rules can never claim
 * another's guarantees — and it is bumped here, beside the rules it names.
 */

/** Bumped whenever the selection rules change. The mixed lane (2026-09-03) is version 2. */
export const DECK_POLICY_VERSION = 2;

/** A duel should finish inside an hour: every card must settle within it, or the match outlives its players. */
const HORIZON_SEC = Number(process.env.GAME_DECK_HORIZON_SEC ?? 60 * 60);

export interface DealtDeck {
  cards: readonly DeckCard[];
  lane: DeckLane;
  deckHash: Bytes32;
  policyVersion: number;
}

/**
 * `retry` separates "the venue has nothing open this minute" from "this deployment cannot deal decks".
 *
 * Measured on Shannon on 2026-09-03: the 5m, 15m and 1h Windows roll on aligned boundaries and lock
 * together, so for the last couple of minutes of every cycle the only trading Windows are the 4h and 1d
 * pair — outside a duel's horizon, and a deck is briefly impossible. That is a wait, not a failure, and
 * two players who have already been paired should not be thrown out of the queue for it.
 */
export type DealOutcome = { ok: true; deck: DealtDeck } | { ok: false; why: string; retry: boolean };

const bytes32 = (): Bytes32 => `0x${randomBytes(32).toString("hex")}`;

/** A fresh match id. Random rather than derived: two players must not be able to predict one another's. */
export function newMatchId(): Bytes32 {
  return bytes32();
}

/** The commitment a client publishes when it queues, and what the deckmaster checks its reveal against. */
export function seedCommitment(seed: Bytes32): Bytes32 {
  return keccak256(seed);
}

async function candidates(minCardLifeSec: number): Promise<readonly DeckCandidate[] | null> {
  const venue = await resolveVenueId(parseMarketsEnv().venueId);
  if (!isOk(venue) || !venue.value.venueId) return null;
  const lanes = await marketsProvider.listLiveLanes(venue.value.venueId);
  if (!isOk(lanes)) return null;
  const nowMs = marketsProvider.nowMs();
  return lanes.value.lanes
    .flatMap((lane) => lane.markets)
    .map((market) => ({
      marketId: market.marketId,
      asset: market.asset,
      intervalSec: market.intervalSec,
      expirySec: market.expirySec,
      trading: phase(market, nowMs) === "trading",
      // The book filters are open until a measured spread and depth exist for a card's own stake; the
      // per-card cap is small enough that the arena's own minQuantity guard is the binding protection.
      spreadRaw: 0n,
      depthRaw: 1n,
    }))
    .filter((c) => c.expirySec - Math.floor(nowMs / 1_000) > minCardLifeSec);
}

export interface DealInput {
  matchId: Bytes32;
  chainId: number;
  arena: Address;
  clientSeeds: readonly Bytes32[];
  minCardLifeSec: number;
}

/**
 * Deals a deck for one match: choose, seal, persist, commit.
 *
 * Every failure returns a reason rather than throwing, because the caller's answer to all of them is the
 * same and it is a product decision: tell both players the queue could not deal, and put them back.
 */
export async function dealDeck(input: DealInput, onWarning?: (why: string) => void): Promise<DealOutcome> {
  const key = deckKey();
  if (!key) return { ok: false, why: `no ${DECK_KEY_ENV}, so a deck's reveal could not be kept`, retry: false };

  const pool = await candidates(input.minCardLifeSec);
  if (!pool) return { ok: false, why: "the venue's live Windows are unreadable", retry: true };

  const selection = selectDeck(
    pool,
    {
      supportedAssets: [...new Set(pool.map((c) => c.asset))],
      maxSpreadRaw: 2n ** 128n,
      minDepthRaw: 0n,
      horizonSec: HORIZON_SEC,
      minHeadroomSec: input.minCardLifeSec,
    },
    Math.floor(marketsProvider.nowMs() / 1_000),
  );
  if (!selection.ok) {
    // The count of live Windows rides along: "0 of 3" from an empty venue and "0 of 3" from a venue whose
    // Windows are all locked are different operational problems, and the log has to tell them apart.
    const trading = pool.filter((c) => c.trading).length;
    return {
      ok: false,
      retry: true,
      why: `only ${selection.refusal.eligible} of ${selection.refusal.needed} Windows qualify right now (${trading} trading of ${pool.length} live, horizon ${HORIZON_SEC}s, headroom ${input.minCardLifeSec}s)`,
    };
  }

  const cards: readonly MarketId[] = selection.cards.map((card) => card.marketId);
  const serverSeed = bytes32();
  const material: RevealMaterial = {
    matchId: input.matchId,
    serverSeed,
    clientSeeds: input.clientSeeds,
    cards,
    policyVersion: DECK_POLICY_VERSION,
  };
  const preimage = deckCommitmentPreimage({
    chainId: input.chainId,
    arena: input.arena,
    matchId: input.matchId,
    policyVersion: DECK_POLICY_VERSION,
    serverSeed,
    clientSeeds: input.clientSeeds,
    cards,
  });
  const deckHash = keccak256(preimage as Hex);
  const sealed = seal(material, key);

  try {
    // The journal is the durable record and is written first; a failure here refuses the deal outright,
    // because a commitment whose preimage is not on disk is a match that can only ever refund.
    journal(input.matchId, sealed);
  } catch (error) {
    return { ok: false, retry: false, why: `the deck's reveal could not be written: ${error instanceof Error ? error.message : String(error)}` };
  }

  try {
    await putDeck({
      matchId: input.matchId,
      chainId: input.chainId,
      arena: input.arena,
      policyVersion: DECK_POLICY_VERSION,
      lane: selection.lane,
      cards,
      sealed,
    });
  } catch (error) {
    // The row is the queryable copy, not the durable one. Losing it costs a query, not a match — the
    // settler reads the journal when the database cannot answer.
    onWarning?.(`${input.matchId}: the deck row was not written (${error instanceof Error ? error.message : String(error)}); the journal has it`);
  }

  return { ok: true, deck: { cards: selection.cards, lane: selection.lane, deckHash, policyVersion: DECK_POLICY_VERSION } };
}
