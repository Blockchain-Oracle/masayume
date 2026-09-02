import type { StrategiesPayload, StrategyWire } from "@/features/strategies/protocol";

export const DECIMALS = 6;
export const SYMBOL = "tUSDC";
const ONE = 1_000_000n;
const NOW_SEC = 1_788_400_000;
export const FIXTURE_NOW_MS = NOW_SEC * 1000;
export const RUNNER = "0x2a4b7c9d1e3f5a6b8c0d2e4f6a8b0c2d4e6f8a10";
export const CREATOR = "0x9f8e7d6c5b4a39281706f5e4d3c2b1a0f9e8d7c6";

const metadata = (name: string) => JSON.stringify({ name, description: "Every round it reads the last 6 prices. If BTC moved at least 0.2%, it bets with that move. Otherwise it sits out.", spec: { preset: "momentum", lookback: 6, thresholdBps: 20 } });

function strategy(over: Partial<StrategyWire> & { strategyId: string }): StrategyWire {
  return {
    creator: CREATOR,
    runner: RUNNER,
    specHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    metadata: metadata("Oracle follow"),
    envelope: { maxStakePerTradeBase: (50n * ONE).toString(), maxDailySpendBase: (500n * ONE).toString(), maxOpenPositions: 2, maxPriceRaw: "0" },
    feeBase: "0",
    active: true,
    createdAtSec: NOW_SEC - 86_400 * 9,
    subscribers: 0,
    revision: 0,
    record: { fills: 0, settled: 0, wins: 0, losses: 0, voids: 0, netBase: "0", stakedBase: "0", curve: [], lastActiveSec: 0, distinctSubscribers: 0, typicalCostBase: "0" },
    playbook: null,
    health: { kind: "never-started", lastTickMs: null, intervalMs: null, why: null },
    ...over,
  };
}

/** A desk with a public record: 14 settled copy-trades, drawdown drawn, alive runner. */
export const HOUSE = strategy({
  strategyId: "1",
  subscribers: 6,
  record: {
    fills: 17,
    settled: 14,
    wins: 8,
    losses: 5,
    voids: 1,
    netBase: (11n * ONE + 400_000n).toString(),
    stakedBase: (61n * ONE).toString(),
    curve: [2, 4, 1, 3, 6, 5, 8, 7, 10, 9, 12, 11, 13, 11].map((v, i) => ({ atSec: NOW_SEC - (14 - i) * 3600, cumBase: (BigInt(v) * ONE - 2n * ONE).toString() })),
    lastActiveSec: NOW_SEC - 420,
    distinctSubscribers: 5,
    typicalCostBase: (2n * ONE + 170_000n).toString(),
  },
  playbook: "Follow the print. Never fade a 1h Window under 0.2%. Sit out the first minute after the print lands.",
  health: { kind: "alive", lastTickMs: FIXTURE_NOW_MS - 20_000, intervalMs: 30_000, why: "scanned 6 markets, closest trigger 8 bps away; 6 live subscribers" },
});

export const YOUNG = strategy({ strategyId: "2", runner: "0x3b5c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a1b2c", metadata: metadata("Fade the print"), envelope: { maxStakePerTradeBase: (5n * ONE).toString(), maxDailySpendBase: (20n * ONE).toString(), maxOpenPositions: 1, maxPriceRaw: "700000" }, feeBase: (1n * ONE).toString(), subscribers: 2, record: { fills: 3, settled: 0, wins: 0, losses: 0, voids: 0, netBase: "0", stakedBase: (6n * ONE).toString(), curve: [], lastActiveSec: NOW_SEC - 7_200, distinctSubscribers: 2, typicalCostBase: (2n * ONE).toString() }, health: { kind: "stale", lastTickMs: FIXTURE_NOW_MS - 3_600_000, intervalMs: 30_000, why: "scanned 6 markets, closest trigger 31 bps away" } });

export const FRESH = strategy({ strategyId: "3", runner: "0x4c6d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d", metadata: metadata("Quiet momentum"), createdAtSec: NOW_SEC - 3_600 });

export const FILLS: StrategiesPayload["fills"] = [
  { txHash: "0xaaaa000000000000000000000000000000000000000000000000000000000001", strategyId: "1", owner: "0x1111111111111111111111111111111111111111", marketId: "0x0000000000000000000000000000000000000000000000000000000000011019", side: "up", cashDeltaBase: (2n * ONE + 170_000n).toString(), tokenDeltaRaw: (5n * ONE).toString(), atSec: NOW_SEC - 420, settled: false, payoutBase: null },
  { txHash: "0xaaaa000000000000000000000000000000000000000000000000000000000002", strategyId: "1", owner: "0x2222222222222222222222222222222222222222", marketId: "0x0000000000000000000000000000000000000000000000000000000000011019", side: "up", cashDeltaBase: (2n * ONE + 170_000n).toString(), tokenDeltaRaw: (5n * ONE).toString(), atSec: NOW_SEC - 421, settled: false, payoutBase: null },
  { txHash: "0xaaaa000000000000000000000000000000000000000000000000000000000003", strategyId: "1", owner: "0x1111111111111111111111111111111111111111", marketId: "0x0000000000000000000000000000000000000000000000000000000000011008", side: "down", cashDeltaBase: (2n * ONE).toString(), tokenDeltaRaw: (5n * ONE).toString(), atSec: NOW_SEC - 4_000, settled: true, payoutBase: (5n * ONE).toString() },
  { txHash: "0xaaaa000000000000000000000000000000000000000000000000000000000004", strategyId: "2", owner: "0x3333333333333333333333333333333333333333", marketId: "0x0000000000000000000000000000000000000000000000000000000000011001", side: "up", cashDeltaBase: (2n * ONE).toString(), tokenDeltaRaw: (4n * ONE).toString(), atSec: NOW_SEC - 7_200, settled: false, payoutBase: null },
];

const base = { decimals: DECIMALS, symbol: SYMBOL, asset: "BTC", computedAtMs: FIXTURE_NOW_MS };

export const PAYLOADS: Record<"live" | "empty" | "noStore" | "notDeployed", StrategiesPayload> = {
  live: { ...base, deployed: true, strategies: [HOUSE, YOUNG, FRESH], fills: FILLS, stores: { fills: true, heartbeats: true } },
  empty: { ...base, deployed: true, strategies: [], fills: [], stores: { fills: true, heartbeats: true } },
  noStore: { ...base, deployed: true, strategies: [HOUSE, FRESH], fills: [], stores: { fills: false, heartbeats: false } },
  notDeployed: { ...base, deployed: false, strategies: [], fills: [], stores: { fills: false, heartbeats: false } },
};
