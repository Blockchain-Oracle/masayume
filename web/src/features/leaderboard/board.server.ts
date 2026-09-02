import { ensureMarkets, parseMarketsEnv, readVenueBoard, unwrap, type VenueBoard } from "@masayume/markets";
import type { LeaderboardPayload } from "./protocol";

/**
 * The board, served: one venue-wide replay per few minutes, shared by every reader — server-side,
 * cached in memory, no database and no credential. The reference caches its route the same way;
 * a venue is ranked once, not once per visitor.
 *
 * A day, as the reference settled on: a venue whose Windows close in minutes fills a day with
 * hundreds of rounds and a week with more pages than a request can finish. Fills are read from two
 * days back so every Window that expired today has its whole life in hand (no cadence exceeds a day).
 */
const DAY_MS = 86_400_000;
const WINDOW_MS = DAY_MS;
const LOOKBACK_MS = 2 * DAY_MS;
const CACHE_TTL_MS = 3 * 60_000;
const TOP = 50;

let cache: { payload: LeaderboardPayload; atMs: number } | null = null;
let inFlight: Promise<LeaderboardPayload> | null = null;

function serialize(board: VenueBoard, computedAtMs: number): LeaderboardPayload {
  return {
    rankings: board.rankings.map((r) => ({ ...r, pnlBase: r.pnlBase.toString(), volumeBase: r.volumeBase.toString() })),
    meta: {
      period: "24h",
      windowStartMs: board.windowStartMs,
      windowEndMs: board.windowEndMs,
      computedAtMs,
      rankedTraders: board.rankedTraders,
      totalWallets: board.totalWallets,
      closedCalls: board.closedCalls,
      totalVolumeBase: board.rankings.reduce((sum, r) => sum + r.volumeBase, 0n).toString(),
      complete: board.complete,
      decimals: board.decimals,
      symbol: board.symbol,
    },
  };
}

async function compute(nowMs: number): Promise<LeaderboardPayload> {
  const env = parseMarketsEnv();
  ensureMarkets(env);
  const board = unwrap(
    await readVenueBoard({ venueId: env.venueId, windowStartMs: nowMs - WINDOW_MS, windowEndMs: nowMs, lookbackSec: Math.floor((nowMs - LOOKBACK_MS) / 1000), top: TOP }),
  );
  return serialize(board, nowMs);
}

/** One computation at a time per process; concurrent readers share it, and a result serves for three minutes. */
export async function readBoard(nowMs = Date.now()): Promise<LeaderboardPayload> {
  if (cache && nowMs - cache.atMs < CACHE_TTL_MS) return cache.payload;
  if (!inFlight) {
    inFlight = compute(nowMs)
      .then((payload) => {
        cache = { payload, atMs: nowMs };
        return payload;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
