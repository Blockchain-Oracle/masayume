import { describe, expect, it } from "vitest";
import { toMarketId } from "../types/market";
import { DECK_MAX, DECK_MIN, INTERVAL_15M_SEC, INTERVAL_1H_SEC, INTERVAL_5M_SEC, selectDeck, type DeckCandidate, type DeckPolicy } from "./deck";

const NOW = 1_700_000_000;

const POLICY: DeckPolicy = {
  supportedAssets: ["BTC", "ETH"],
  maxSpreadRaw: 200_000n,
  minDepthRaw: 20_000_000n,
  horizonSec: 2 * 60 * 60,
};

function candidate(n: number, overrides: Partial<DeckCandidate> = {}): DeckCandidate {
  return {
    marketId: toMarketId(`0x${String(n).padStart(64, "0")}`),
    asset: "BTC",
    intervalSec: INTERVAL_15M_SEC,
    expirySec: NOW + 900 + n * 60,
    trading: true,
    spreadRaw: 100_000n,
    depthRaw: 30_000_000n,
    ...overrides,
  };
}

describe("deck selection", () => {
  it("deals three to five distinct 15m Windows, soonest first", () => {
    const result = selectDeck([candidate(3), candidate(1), candidate(2), candidate(4)], POLICY, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cards).toHaveLength(4);
    expect(result.cards.map((c) => c.index)).toEqual([0, 1, 2, 3]);
    expect(result.cards[0]?.expirySec).toBeLessThan(result.cards[1]?.expirySec ?? 0);
  });

  it("never deals more than five cards", () => {
    const many = Array.from({ length: 9 }, (_, i) => candidate(i + 1));
    const result = selectDeck(many, POLICY, NOW);
    expect(result.ok && result.cards.length).toBe(DECK_MAX);
  });

  it("refuses the 5m lane outright, however eligible it looks", () => {
    const fives = Array.from({ length: 5 }, (_, i) => candidate(i + 1, { intervalSec: INTERVAL_5M_SEC }));
    expect(selectDeck(fives, POLICY, NOW).ok).toBe(false);
  });

  it("falls back to the 1h lane only when fewer than three 15m Windows qualify", () => {
    const mixed = [
      candidate(1),
      candidate(2),
      ...Array.from({ length: 3 }, (_, i) => candidate(10 + i, { intervalSec: INTERVAL_1H_SEC, expirySec: NOW + 3_600 + i * 60 })),
    ];
    const result = selectDeck(mixed, POLICY, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // A fallback deck is all 1h: mixing cadences would give one card five times another's time to move.
    expect(result.cards.every((c) => c.intervalSec === INTERVAL_1H_SEC)).toBe(true);
  });

  it("drops Windows that are untradeable, unsupported, wide, thin, too close or past the horizon", () => {
    const bad = [
      candidate(1, { trading: false }),
      candidate(2, { asset: "SOL" }),
      candidate(3, { spreadRaw: 900_000n }),
      candidate(4, { depthRaw: 1n }),
      candidate(5, { expirySec: NOW + 60 }),
      candidate(6, { expirySec: NOW + 5 * 60 * 60 }),
    ];
    const result = selectDeck(bad, POLICY, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.refusal).toEqual({ kind: "too-few-eligible", eligible: 0, needed: DECK_MIN });
  });

  it("counts one Window once, however many times the venue lists it", () => {
    const dupe = candidate(1);
    expect(selectDeck([dupe, dupe, dupe, dupe], POLICY, NOW).ok).toBe(false);
  });
});
