import { getDb } from "./client";
import { ensureSchema } from "./migrate";

export type DecisionVerdictSide = "up" | "down" | "hold" | "none";
export type DecisionGate = "trade" | "held" | "failed";

/** One Window an agent strategy read: the model's words, the gate's ruling, what the runner then sent. */
export interface StrategyDecisionRecord {
  id: number;
  strategyId: string;
  marketId: string;
  runner: string;
  decidedAtMs: number;
  model: string;
  promptHash: string;
  verdictSide: DecisionVerdictSide;
  confidence: number | null;
  why: string;
  gate: DecisionGate;
  gateReason: string;
  side: "up" | "down" | null;
  filled: number;
  skipped: number;
  dryRun: boolean;
}

export type NewStrategyDecision = Omit<StrategyDecisionRecord, "id" | "decidedAtMs" | "filled" | "skipped">;

interface DecisionRow {
  id: string;
  strategy_id: string;
  market_id: string;
  runner: string;
  decided_at: Date;
  model: string;
  prompt_hash: string;
  verdict_side: DecisionVerdictSide;
  confidence: number | null;
  why: string;
  gate: DecisionGate;
  gate_reason: string;
  side: "up" | "down" | null;
  filled: number;
  skipped: number;
  dry_run: boolean;
}

const toDecision = (r: DecisionRow): StrategyDecisionRecord => ({
  id: Number(r.id),
  strategyId: r.strategy_id,
  marketId: r.market_id,
  runner: r.runner,
  decidedAtMs: r.decided_at.getTime(),
  model: r.model,
  promptHash: r.prompt_hash,
  verdictSide: r.verdict_side,
  confidence: r.confidence,
  why: r.why,
  gate: r.gate,
  gateReason: r.gate_reason,
  side: r.side,
  filled: r.filled,
  skipped: r.skipped,
  dryRun: r.dry_run,
});

/**
 * One read per Window: the (strategy, market) pair is unique, so a runner that restarts mid-Window
 * cannot ask twice. Ids are lowercased at the write — the reads lowercase too, and a table whose
 * writes do not is one the settler was blind to for its whole life.
 */
export async function recordStrategyDecision(d: NewStrategyDecision): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  await ensureSchema();
  await db`
    INSERT INTO strategy_decisions (strategy_id, market_id, runner, model, prompt_hash, verdict_side, confidence, why, gate, gate_reason, side, dry_run)
    VALUES (${d.strategyId}, ${d.marketId.toLowerCase()}, ${d.runner.toLowerCase()}, ${d.model}, ${d.promptHash}, ${d.verdictSide}, ${d.confidence}, ${d.why}, ${d.gate}, ${d.gateReason}, ${d.side}, ${d.dryRun})
    ON CONFLICT (strategy_id, market_id) DO NOTHING
  `;
  return true;
}

/** After the execution loop: how many subscribers the decision reached, and how many it skipped. */
export async function markDecisionExecution(strategyId: string, marketId: string, filled: number, skipped: number): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  await ensureSchema();
  await db`UPDATE strategy_decisions SET filled = ${filled}, skipped = ${skipped} WHERE strategy_id = ${strategyId} AND market_id = ${marketId.toLowerCase()}`;
  return true;
}

/**
 * Newest first; all strategies when `strategyId` is null. Dry-run rows are left out unless asked for:
 * the card never shows a rehearsal as memory, but the runner warms its "already read" set from every row.
 */
export async function listStrategyDecisions(strategyId: string | null, limit: number, includeDryRun = false): Promise<StrategyDecisionRecord[] | null> {
  const db = getDb();
  if (!db) return null;
  await ensureSchema();
  const dry = includeDryRun ? db`` : db`AND dry_run = false`;
  const rows = strategyId
    ? await db<DecisionRow[]>`SELECT * FROM strategy_decisions WHERE strategy_id = ${strategyId} ${dry} ORDER BY decided_at DESC LIMIT ${limit}`
    : await db<DecisionRow[]>`SELECT * FROM strategy_decisions WHERE true ${dry} ORDER BY decided_at DESC LIMIT ${limit}`;
  return rows.map(toDecision);
}
