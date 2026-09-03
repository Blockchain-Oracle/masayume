import {
  findOpponent,
  queueKey,
  roomRef,
  roomError,
  searchBand,
  stakeTier,
  type ClientMessage,
  type QueueEntry,
  type StakeTierId,
} from "@masayume/core/games";
import { isOk } from "@masayume/core/schemas";
import { deckSupply } from "./deckmaster";
import type { Address, Bytes32 } from "@masayume/core/types";
import { readRatings } from "@masayume/db";
import { getArenaState } from "@masayume/markets/games";
import type { RoomConnection } from "../game-room/hub";
import type { Matchmaker, RoomContext } from "../game-room/handlers";
import { dealDeck, newMatchId, seedCommitment } from "./deckmaster";

/**
 * The queue, the pairing and the seed ceremony — process memory with a chain-backed conscience.
 *
 * Nothing here is durable on purpose. A restart empties the queue, and the correct behaviour is that
 * every queued player is simply not queued any more: nobody has paid anything, no commitment has been
 * published, and a client that reconnects sees an idle snapshot and can queue again. What a restart must
 * NOT lose is a deck that was committed, and that is why the deckmaster writes before it commits.
 *
 * The order of operations is the honest one, and it is worth stating because it is easy to shorten:
 *
 *   join → pair → both seeds revealed → deck dealt and made durable → commitment sent
 *
 * A commitment is the first thing either player can act on, so nothing is published until the seeds are
 * in and the reveal is safe. Neither player, and not the server, can choose a seed after seeing another.
 */

/** How long a paired player has to reveal the seed they committed to before the pairing is dissolved. */
const SEED_WINDOW_MS = 15_000;
/**
 * How long a paired match waits for the venue to have dealable Windows.
 *
 * It needs one because Shannon's cadences lock together on aligned boundaries: for the last couple of
 * minutes of a cycle there is no deck to deal, and the honest answer to two players who have already
 * been matched is "the next Windows open shortly", not "the queue failed". Three minutes covers a 15m
 * boundary with room to spare; past that, something else is wrong and they should be told so.
 */
const DEAL_WINDOW_MS = 3 * 60_000;
/** How often a queued player is told where their search has got to. */
const QUEUE_TICK_MS = 3_000;

interface Waiting extends QueueEntry {
  connection: RoomConnection;
  key: string;
  tier: StakeTierId;
}

interface Pairing {
  matchId: Bytes32;
  players: [Waiting, Waiting];
  seeds: Map<string, Bytes32>;
  openedAtMs: number;
  /** Set when both seeds are in and the deckmaster started trying; null while the seeds are still owed. */
  dealingSinceMs: number | null;
  /** So a pair waiting on the venue is told once, not every three seconds. */
  toldWaiting: boolean;
  /** The sweeper retries every tick; a deal that is still in flight must not be started twice. */
  dealing: boolean;
}

export function createMatchmaker(ctx: RoomContext): Matchmaker {
  const region = process.env.GAME_ROOM_REGION ?? "default";
  const queues = new Map<string, Waiting[]>();
  const pairings = new Map<string, Pairing>();
  /** Which pairing a connection is in, so a seed reveal needs no search. */
  const pairingOf = new Map<string, string>();

  function drop(connection: RoomConnection): void {
    for (const [key, waiting] of queues) {
      const next = waiting.filter((entry) => entry.connection !== connection);
      if (next.length === 0) queues.delete(key);
      else queues.set(key, next);
    }
  }

  function tell(waiting: Waiting, message: Parameters<RoomContext["hub"]["send"]>[1]): void {
    ctx.hub.send(waiting.connection, message);
  }

  /** Both players go back to the queue when a pairing fails: it was nobody's fault, and neither has paid. */
  function dissolve(pairing: Pairing, why: string): void {
    pairings.delete(pairing.matchId);
    for (const player of pairing.players) {
      pairingOf.delete(player.connection.id);
      tell(player, roomError("queue-unavailable", why, "queue.join"));
      // Back in the queue with a fresh clock: a failed pairing should not also cost them their band.
      const queue = (queues.get(player.key) ?? []).filter((entry) => entry.connection !== player.connection);
      queues.set(player.key, [...queue, { ...player, queuedAtMs: Date.now() }]);
    }
    ctx.log(`pairing ${pairing.matchId} dissolved: ${why}`);
  }

  /**
   * Both seeds are in: deal, persist, commit. The room is joined first so the commitment and everything
   * after it reaches both players through one path.
   */
  async function commit(pairing: Pairing): Promise<void> {
    if (pairing.dealing) return;
    pairing.dealing = true;
    try {
      await deal(pairing);
    } finally {
      pairing.dealing = false;
    }
  }

  async function deal(pairing: Pairing): Promise<void> {
    const [creator, challenger] = pairing.players;
    const state = await getArenaState();
    if (!isOk(state) || !state.value) return dissolve(pairing, "the arena is unreadable right now");

    const seeds = pairing.players.map((player) => pairing.seeds.get(player.connection.id) as Bytes32);
    const dealt = await dealDeck({
      matchId: pairing.matchId,
      chainId: ctx.chainId,
      arena: ctx.arena,
      clientSeeds: seeds,
      params: state.value.params,
    }, ctx.log);
    if (!dealt.ok) {
      if (!dealt.retry) return dissolve(pairing, dealt.why);
      // Held, not dissolved: the venue will have Windows again shortly, and the pair is already made.
      if (!pairing.toldWaiting) {
        pairing.toldWaiting = true;
        ctx.log(`${pairing.matchId}: holding — ${dealt.why}`);
        const wait = dealt.nextDeckInSec;
        const when = wait === null || wait === undefined ? "shortly" : `in about ${Math.ceil(wait / 15) * 15}s`;
        for (const player of pairing.players) tell(player, roomError("queue-unavailable", `the venue has no Windows to deal right now; the next ones open ${when}`, "queue.join"));
      }
      return;
    }

    pairings.delete(pairing.matchId);
    for (const entry of pairing.players) pairingOf.delete(entry.connection.id);
    const commitment = { hash: dealt.deck.deckHash, size: dealt.deck.cards.length, policyVersion: dealt.deck.policyVersion };
    for (const player of pairing.players) tell(player, { type: "deck.committed", matchId: pairing.matchId, commitment });
    ctx.log(`${pairing.matchId}: ${creator.wallet} vs ${challenger.wallet} · ${dealt.deck.cards.length} cards from the ${dealt.deck.lane} lane`);
  }

  /**
   * A pair, held until both seeds arrive.
   *
   * `match.found` goes out now rather than after the deck, and the ordering is not cosmetic: a client
   * cannot reveal a seed for a match it has not been told about, so publishing the pairing first is what
   * lets the ceremony start at all. It promises an opponent, which is true, and nothing about cards,
   * which are not dealt yet.
   */
  function pair(a: Waiting, b: Waiting): void {
    queues.set(a.key, (queues.get(a.key) ?? []).filter((entry) => entry !== a && entry !== b));
    const matchId = newMatchId();
    // The player who has waited longest creates the match, so the wallet that has already been patient
    // is the one whose transaction opens it rather than the one who just arrived.
    const players: [Waiting, Waiting] = a.queuedAtMs <= b.queuedAtMs ? [a, b] : [b, a];
    const pairing: Pairing = { matchId, players, seeds: new Map(), openedAtMs: Date.now(), dealingSinceMs: null, toldWaiting: false, dealing: false };
    pairings.set(matchId, pairing);

    const ref = roomRef(ctx.chainId, ctx.arena, matchId);
    const roster = [players[0].wallet, players[1].wallet];
    for (const [index, player] of players.entries()) {
      pairingOf.set(player.connection.id, matchId);
      ctx.hub.join(player.connection, ref, roster);
      const other = players[index === 0 ? 1 : 0] as Waiting;
      tell(player, {
        type: "match.found",
        room: ref,
        players: { creator: players[0].wallet, challenger: players[1].wallet },
        mode: stakeTier(player.tier).mode,
        tier: player.tier,
        opponent: { wallet: other.wallet, rating: other.rating },
      });
    }
    ctx.log(`${matchId}: paired ${players[0].wallet} and ${players[1].wallet}, waiting on both seeds`);
  }

  /**
   * One pass over a queue, pairing whoever is now in band.
   *
   * This runs on the tick, not only on arrival, and that is the whole point of a widening band: two
   * players 300 apart are not compatible when the second one joins, and are compatible a minute later.
   * Pairing only on `queue.join` would leave `searchBand` describing something that never happened.
   */
  function sweepQueue(key: string, nowMs: number): void {
    let waiting = queues.get(key) ?? [];
    for (const entry of [...waiting].sort((x, y) => x.queuedAtMs - y.queuedAtMs)) {
      waiting = queues.get(key) ?? [];
      if (!waiting.includes(entry)) continue;
      const opponent = findOpponent(entry, waiting, nowMs);
      if (opponent) pair(entry, opponent);
    }
  }

  /**
   * How far off the next dealable deck is, refreshed once a tick and shared by every queued player.
   *
   * Cached rather than computed per player: it is a property of the venue, not of a wallet, and asking
   * the indexer once per waiting player per tick would be a read amplification with no new information.
   */
  let nextDeckInSec: number | null = null;
  /** Debounce: when the last read STARTED. Separate from `supplyKnown` on purpose — see below. */
  let supplyAtMs = 0;
  /**
   * Whether a supply read has ever completed.
   *
   * Not derivable from `supplyAtMs`, which is stamped when a read *starts* so two ticks cannot both
   * fire one. Reading "known" off that timestamp reported `nextDeckInSec: null` — "no deck for the
   * foreseeable future" — during the seconds the very first read was still in flight.
   */
  let supplyKnown = false;

  /** Absent until the first read lands, then a number or a real null. The protocol's own distinction. */
  const supply = () => (supplyKnown ? { nextDeckInSec } : {});

  async function refreshSupply(nowMs: number): Promise<void> {
    if (supplyAtMs !== 0 && nowMs - supplyAtMs < QUEUE_TICK_MS) return;
    supplyAtMs = nowMs;
    const state = await getArenaState();
    if (!isOk(state) || !state.value) return;
    nextDeckInSec = await deckSupply(state.value.params);
    supplyKnown = true;
  }

  // Warm before anyone queues, so the common case is a real countdown rather than "not known yet".
  void refreshSupply(Date.now());

  const sweeper = setInterval(() => {
    const nowMs = Date.now();
    for (const pairing of [...pairings.values()]) {
      if (pairing.dealingSinceMs === null) {
        if (nowMs - pairing.openedAtMs > SEED_WINDOW_MS) dissolve(pairing, "the other player did not open their seed in time");
        continue;
      }
      if (nowMs - pairing.dealingSinceMs > DEAL_WINDOW_MS) {
        dissolve(pairing, "no Windows opened in time to deal a deck");
        continue;
      }
      void commit(pairing);
    }
    for (const key of [...queues.keys()]) sweepQueue(key, nowMs);
    if (queues.size > 0) void refreshSupply(nowMs);
    for (const [key, waiting] of queues) {
      for (const entry of waiting) {
        const waitedMs = nowMs - entry.queuedAtMs;
        tell(entry, { type: "queue.update", waitingCount: waiting.length, bandNow: searchBand(waitedMs), waitedMs, ...supply() });
      }
      if (waiting.length === 0) queues.delete(key);
    }
  }, QUEUE_TICK_MS);
  sweeper.unref();

  return {
    async join(connection, request) {
      if (pairingOf.has(connection.id)) {
        ctx.hub.send(connection, roomError("already-queued", "you are already being paired", "queue.join"));
        return;
      }
      drop(connection);

      const key = queueKey(request.mode, request.tier, region);
      const ratings = await readRatings([connection.wallet]);
      const entry: Waiting = {
        wallet: connection.wallet,
        rating: ratings.get(connection.wallet)?.rating ?? 1_000,
        queuedAtMs: Date.now(),
        connectionId: connection.id,
        clientSeedCommitment: request.clientSeedCommitment,
        connection,
        key,
        tier: request.tier,
      };

      const queue = queues.get(key) ?? [];
      const opponent = findOpponent(entry, queue, entry.queuedAtMs);
      if (opponent) return pair(entry, opponent);

      queues.set(key, [...queue, entry]);
      ctx.hub.send(connection, { type: "queue.update", waitingCount: queue.length + 1, bandNow: searchBand(0), waitedMs: 0, ...supply() });
      ctx.log(`${connection.wallet} queued at ${key} (rating ${entry.rating}); ${queue.length + 1} waiting`);
    },

    leave(connection) {
      drop(connection);
      const matchId = pairingOf.get(connection.id);
      const pairing = matchId ? pairings.get(matchId) : undefined;
      if (pairing) dissolve(pairing, "the other player left before the deck was dealt");
    },

    async revealSeed(connection, message) {
      const matchId = pairingOf.get(connection.id);
      const pairing = matchId ? pairings.get(matchId) : undefined;
      if (!pairing || pairing.matchId !== message.matchId.toLowerCase()) {
        ctx.hub.send(connection, roomError("unknown-match", "there is no pairing waiting on that seed", "seed.reveal"));
        return;
      }
      const player = pairing.players.find((entry) => entry.connection === connection);
      if (!player) return;
      if (seedCommitment(message.seed).toLowerCase() !== player.clientSeedCommitment.toLowerCase()) {
        // The one refusal that is a player's own doing: they queued under a different seed.
        dissolve(pairing, "a revealed seed did not match the commitment it was queued with");
        return;
      }
      pairing.seeds.set(connection.id, message.seed);
      if (pairing.seeds.size < 2) return;
      pairing.dealingSinceMs = Date.now();
      await commit(pairing);
    },
  };
}

export type { ClientMessage };
