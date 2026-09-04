import { isOk } from "@masayume/core/schemas";
import { EMPTY_AGENT_RECORD, type AgentPastWindow, type AgentRecordSummary, type AgentWindowOutcome, type FillSettlement } from "@masayume/core/strategies";
import { SIDE_TO_OUTCOME, toMarketId, type MarketId, type Side } from "@masayume/core/types";
import { utcDayOf } from "@masayume/core/vault";
import { listStrategyDecisions, listStrategyFills } from "@masayume/db";
import { marketsProvider } from "@masayume/markets";

const RECENT_WINDOWS = 5;
const DECISION_LOOKBACK = 12;
const FILL_LOOKBACK = 200;

/** Settlement facts per Window, read once per cycle rather than once per row. */
export type SettlementReader = (marketId: MarketId) => Promise<FillSettlement | null>;

export function settlementReader(): SettlementReader {
  const cache = new Map<MarketId, Promise<FillSettlement | null>>();
  return (marketId) => {
    let pending = cache.get(marketId);
    if (!pending) {
      pending = marketsProvider.getMarket(marketId).then((reading) => {
        const m = isOk(reading) ? reading.value : null;
        if (!m) return null;
        const settled = m.status === "Resolved" || m.status === "Voided" || m.status === "Finalized";
        return { settled, voided: m.voided, winningOutcome: m.winningOutcome };
      });
      cache.set(marketId, pending);
    }
    return pending;
  };
}

function outcomeOf(side: Side, settlement: FillSettlement | null): AgentWindowOutcome {
  if (!settlement || !settlement.settled) return "open";
  if (settlement.voided) return "void";
  return settlement.winningOutcome === SIDE_TO_OUTCOME[side] ? "won" : "lost";
}

/**
 * The agent's own memory, as the prompt and the gate read it: its last decided Windows with how
 * they settled, its straight losses, and the worst realised loss any one subscriber took today —
 * the figure the posture's daily loss line is measured against, because the envelope's daily cap
 * is per subscriber too. Nothing here is a store the runner trusts over the chain: every outcome
 * comes from the Window's own settlement.
 */
export async function readAgentRecord(strategyId: bigint, nowSec: number, includeDryRun: boolean, settlementOf: SettlementReader): Promise<AgentRecordSummary> {
  const id = strategyId.toString();
  const [decisions, fills] = await Promise.all([listStrategyDecisions(id, DECISION_LOOKBACK, includeDryRun).catch(() => null), listStrategyFills(id, FILL_LOOKBACK).catch(() => null)]);
  if (!decisions) return EMPTY_AGENT_RECORD;

  const decided = decisions.filter((d): d is typeof d & { side: Side } => d.side !== null);
  const scored = await Promise.all(decided.map(async (d) => ({ side: d.side, why: d.why, atSec: Math.floor(d.decidedAtMs / 1000), outcome: outcomeOf(d.side, await settlementOf(toMarketId(d.marketId))) })));
  const recent: AgentPastWindow[] = scored.slice(0, RECENT_WINDOWS).map(({ side, outcome, why }) => ({ side, outcome, why }));

  let consecutiveLosses = 0;
  let lastLossAtSec: number | null = null;
  for (const w of scored) {
    if (w.outcome === "open" || w.outcome === "void") continue;
    if (w.outcome === "won") break;
    consecutiveLosses += 1;
    lastLossAtSec ??= w.atSec;
  }

  const today = utcDayOf(nowSec);
  const lostByOwner = new Map<string, bigint>();
  for (const f of fills ?? []) {
    if (utcDayOf(f.atSec) !== today) continue;
    if (outcomeOf(f.side, await settlementOf(toMarketId(f.marketId))) !== "lost") continue;
    lostByOwner.set(f.owner, (lostByOwner.get(f.owner) ?? 0n) + BigInt(f.cashDelta));
  }
  const lostTodayBase = [...lostByOwner.values()].reduce((max, v) => (v > max ? v : max), 0n);

  return { recent, consecutiveLosses, lostTodayBase, lastLossAtSec };
}
