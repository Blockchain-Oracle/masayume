import type { MarketId } from "../types/market";
import type { DeckCard } from "./types";

/**
 * The deckmaster's selection rule, pure so it can be tested without a venue.
 *
 * The owner approved the recommended policy: three to five distinct 15m Windows, widening to 1h only
 * when fewer than three qualify, and **never 5m** until live timing proves the whole swipe-and-signature
 * path fits inside one (`06-game-architecture.md` §Owner decisions 4). The headroom rule is Flicky's —
 * soonest-settling first, but only Windows with real time left, so a deck cannot be dealt cards that
 * lock before a player can reach them.
 *
 * **The mixed lane is not a third preference; it is what the venue forced.** Driven live on Shannon on
 * 2026-09-03, the venue runs two assets, one Window per cadence: at any moment there are exactly two
 * live 15m Windows and two live 1h ones, so a three-card deck of a single cadence is not merely rare —
 * it is impossible. Refusing to deal would have made the duel undeliverable. The single-cadence lanes
 * stay first because they are the nicest to read, and a mixed deck is dealt only when neither has three.
 *
 * What the single-cadence rule was protecting is protected by the filters that remain: every card must
 * be tradable now, must still have real life left, and must settle inside the match horizon — so a
 * mixed deck varies in how long each card runs, never in whether a player can reach it. Both players
 * hold identical cards either way; the asymmetry a mixed deck introduces is between cards, not between
 * players, and each card carries its own countdown on the stage.
 */

export const DECK_MIN = 3;
export const DECK_MAX = 5;
export const INTERVAL_15M_SEC = 900;
export const INTERVAL_1H_SEC = 3_600;
/** Excluded by policy, not by capability: 5m returns only with a measured end-to-end timing. */
export const INTERVAL_5M_SEC = 300;
/** A card must still have this long to run when the deck is dealt. */
export const MIN_HEADROOM_SEC = 600;

export interface DeckCandidate {
  marketId: MarketId;
  asset: string;
  intervalSec: number;
  expirySec: number;
  /** The venue's own trading status, already normalised by the market port. */
  trading: boolean;
  /** Top-of-book spread and resting depth, per whole unit — the deckmaster refuses an unfillable card. */
  spreadRaw: bigint;
  depthRaw: bigint;
}

export interface DeckPolicy {
  supportedAssets: readonly string[];
  maxSpreadRaw: bigint;
  minDepthRaw: bigint;
  /** Every card must settle inside the match's own horizon, or the duel outlives its players' patience. */
  horizonSec: number;
  minHeadroomSec?: number;
}

export type DeckRefusal = { kind: "too-few-eligible"; eligible: number; needed: number };

/** Which lane dealt the deck — recorded so a session can see when the venue was too thin for one cadence. */
export type DeckLane = "15m" | "1h" | "mixed";

export type DeckSelection = { ok: true; cards: readonly DeckCard[]; lane: DeckLane } | { ok: false; refusal: DeckRefusal };

function isEligible(candidate: DeckCandidate, policy: DeckPolicy, nowSec: number): boolean {
  if (!candidate.trading) return false;
  if (candidate.intervalSec === INTERVAL_5M_SEC) return false;
  if (!policy.supportedAssets.includes(candidate.asset)) return false;
  if (candidate.spreadRaw > policy.maxSpreadRaw) return false;
  if (candidate.depthRaw < policy.minDepthRaw) return false;
  const left = candidate.expirySec - nowSec;
  return left >= (policy.minHeadroomSec ?? MIN_HEADROOM_SEC) && left <= policy.horizonSec;
}

/** Soonest-settling first, then by market id so two deckmasters on the same set deal the same deck. */
function byUrgency(a: DeckCandidate, b: DeckCandidate): number {
  return a.expirySec - b.expirySec || a.marketId.localeCompare(b.marketId);
}

function distinctWindows(candidates: readonly DeckCandidate[]): DeckCandidate[] {
  const seen = new Set<MarketId>();
  const out: DeckCandidate[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.marketId)) continue;
    seen.add(candidate.marketId);
    out.push(candidate);
  }
  return out;
}

function toCards(candidates: readonly DeckCandidate[]): readonly DeckCard[] {
  return candidates.slice(0, DECK_MAX).map((c, index) => ({
    index,
    marketId: c.marketId,
    asset: c.asset,
    intervalSec: c.intervalSec,
    expirySec: c.expirySec,
  }));
}

/** Deals a deck, or says why it cannot: one cadence where the venue has three, mixed where it does not. */
export function selectDeck(candidates: readonly DeckCandidate[], policy: DeckPolicy, nowSec: number): DeckSelection {
  const eligible = distinctWindows(candidates.filter((c) => isEligible(c, policy, nowSec)).sort(byUrgency));
  const preferred = eligible.filter((c) => c.intervalSec === INTERVAL_15M_SEC);
  if (preferred.length >= DECK_MIN) return { ok: true, cards: toCards(preferred), lane: "15m" };

  const fallback = eligible.filter((c) => c.intervalSec === INTERVAL_1H_SEC);
  if (fallback.length >= DECK_MIN) return { ok: true, cards: toCards(fallback), lane: "1h" };

  if (eligible.length >= DECK_MIN) return { ok: true, cards: toCards(eligible), lane: "mixed" };
  return { ok: false, refusal: { kind: "too-few-eligible", eligible: eligible.length, needed: DECK_MIN } };
}
