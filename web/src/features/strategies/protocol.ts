import type { RunnerHealthKind } from "@masayume/core/strategies";
import { z } from "zod";

/** Wire shape of `/api/strategies` — base units travel as decimal strings, never floats. */
const capsSchema = z.object({ maxStakePerTradeBase: z.string(), maxDailySpendBase: z.string(), maxOpenPositions: z.number(), maxPriceRaw: z.string() });

export const strategyWireSchema = z.object({
  strategyId: z.string(),
  creator: z.string(),
  runner: z.string(),
  specHash: z.string(),
  metadata: z.string(),
  envelope: capsSchema,
  feeBase: z.string(),
  active: z.boolean(),
  createdAtSec: z.number(),
  subscribers: z.number(),
  revision: z.number(),
  record: z.object({
    fills: z.number(),
    settled: z.number(),
    wins: z.number(),
    losses: z.number(),
    voids: z.number(),
    netBase: z.string(),
    stakedBase: z.string(),
    curve: z.array(z.object({ atSec: z.number(), cumBase: z.string() })),
    lastActiveSec: z.number(),
    distinctSubscribers: z.number(),
    /** Median cost of a fill so far, base units — the join floor reads off it. */
    typicalCostBase: z.string(),
  }),
  playbook: z.string().nullable(),
  health: z.object({ kind: z.enum(["never-started", "alive", "stale", "unknown"]), lastTickMs: z.number().nullable(), intervalMs: z.number().nullable(), why: z.string().nullable() }),
});

export const fillWireSchema = z.object({
  txHash: z.string(),
  strategyId: z.string(),
  owner: z.string(),
  marketId: z.string(),
  side: z.enum(["up", "down"]),
  cashDeltaBase: z.string(),
  tokenDeltaRaw: z.string(),
  atSec: z.number(),
  settled: z.boolean(),
  payoutBase: z.string().nullable(),
});

export const strategiesPayloadSchema = z.object({
  deployed: z.boolean(),
  strategies: z.array(strategyWireSchema),
  fills: z.array(fillWireSchema),
  /** Which off-chain stores answered; false says "not connected", never "empty". */
  stores: z.object({ fills: z.boolean(), heartbeats: z.boolean() }),
  decimals: z.number(),
  symbol: z.string(),
  asset: z.string(),
  computedAtMs: z.number(),
});

export type StrategyWire = z.infer<typeof strategyWireSchema>;
export type FillWire = z.infer<typeof fillWireSchema>;
export type StrategiesPayload = z.infer<typeof strategiesPayloadSchema>;
export type HealthKind = RunnerHealthKind;

export const healthPayloadSchema = z.object({
  reachable: z.boolean(),
  strategies: z.record(z.string(), z.object({ kind: z.enum(["never-started", "alive", "stale", "unknown"]), lastTickMs: z.number().nullable(), intervalMs: z.number().nullable(), why: z.string().nullable(), recent: z.array(z.object({ tickAtMs: z.number(), why: z.string() })) })),
  computedAtMs: z.number(),
});
export type HealthPayload = z.infer<typeof healthPayloadSchema>;

/** The creator signs this exact text to publish a plain-text playbook; the route re-derives it. */
export function playbookMessage(strategyId: string, creator: string, issuedAtMs: number, body: string): string {
  return ["Masayume playbook", `Strategy: ${strategyId}`, `Creator: ${creator.toLowerCase()}`, `Issued: ${issuedAtMs}`, "", body].join("\n");
}

export const playbookRequestSchema = z.object({
  strategyId: z.string().regex(/^\d+$/),
  creator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  issuedAtMs: z.number().int(),
  body: z.string().min(1).max(4000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});
