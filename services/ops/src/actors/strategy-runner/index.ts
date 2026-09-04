import { isOk } from "@masayume/core/schemas";
import { parseStrategyMetadata, type StrategyRecord } from "@masayume/core/strategies";
import type { Bytes32 } from "@masayume/core/types";
import { msToSec } from "@masayume/core/units";
import { isDbConfigured, markDecisionExecution, recordHeartbeat, recordStrategyFill } from "@masayume/db";
import { createMemoryJournal, createSubmitterSession, ensureMarkets, marketsProvider, parseMarketsEnv, resolveVenueId, type SubmitterSession } from "@masayume/markets";
import { getStrategy, listLiveSubscribers, resolveRegistryDeployment } from "@masayume/markets/strategies";
import { agentBootLine, createAgentState, scanVenueWithAgent, warmAgentState, type AgentState } from "./agent";
import { scanVenue, type Scan } from "./decide";
import { readRunnerEnv, type RunnerEnv } from "./env";
import { executeForSubscriber } from "./execute";

type Log = (why: string) => void;

interface Runner {
  env: RunnerEnv;
  session: SubmitterSession | null;
  venueId: Bytes32;
  agent: AgentState;
  log: Log;
}

/** Durability only (AD-7): the log line is the truth, the row is what the surface reads later. */
async function heartbeat(runner: Runner, strategyId: bigint, why: string, scanned: number, closestBps: number | null): Promise<void> {
  runner.log(`#${strategyId}: ${why}`);
  const stored = await recordHeartbeat({
    runner: runner.session?.address ?? "unconfigured",
    strategyId: strategyId.toString(),
    intervalMs: runner.env.intervalMs,
    why,
    scanned,
    closestBps,
    dryRun: runner.env.dryRun,
  }).catch((error: unknown) => {
    runner.log(`heartbeat not stored: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  });
  if (!stored && isDbConfigured()) runner.log("heartbeat not stored: the database refused the row");
}

/** The house model or the agent, by the spec's preset; the execution loop below never knows which. */
function scan(runner: Runner, strategy: StrategyRecord, spec: NonNullable<ReturnType<typeof parseStrategyMetadata>>["spec"], nowMs: number): Promise<Scan> {
  if (spec.preset !== "agent") return scanVenue(runner.venueId, spec, nowMs);
  return scanVenueWithAgent({ env: runner.env, venueId: runner.venueId, runnerKey: runner.session?.address ?? "unconfigured", agent: runner.agent, log: runner.log }, strategy, spec, nowMs);
}

async function cycle(runner: Runner, strategyId: bigint, nowMs: number): Promise<void> {
  const reading = await getStrategy(strategyId);
  if (!isOk(reading) || !reading.value) return heartbeat(runner, strategyId, `strategy unreadable: ${isOk(reading) ? "not on this registry" : reading.error.technical}`, 0, null);
  const strategy: StrategyRecord = reading.value;
  if (!strategy.active) return heartbeat(runner, strategyId, "strategy deactivated by its creator; idle", 0, null);
  if (runner.session && strategy.runner !== runner.session.address.toLowerCase()) {
    return heartbeat(runner, strategyId, `this key is ${runner.session.address}, the strategy names ${strategy.runner}; not trading it`, 0, null);
  }
  const meta = parseStrategyMetadata(strategy.metadata);
  if (!meta) return heartbeat(runner, strategyId, "metadata carries no readable spec; idle", 0, null);
  const isAgent = meta.spec.preset === "agent";

  const scanned = await scan(runner, strategy, meta.spec, nowMs);
  const subscribers = await listLiveSubscribers(strategyId);
  const live = isOk(subscribers) ? subscribers.value : [];
  if (scanned.candidates.length === 0 || live.length === 0) {
    return heartbeat(runner, strategyId, `${scanned.why}; ${live.length} live subscriber${live.length === 1 ? "" : "s"}`, scanned.scanned, scanned.closestBps);
  }
  if (!runner.session) return heartbeat(runner, strategyId, `${scanned.why}; no runner key configured, so nothing sent`, scanned.scanned, scanned.closestBps);

  let filled = 0;
  let skipped = 0;
  for (const { market, decision } of scanned.candidates) {
    let filledHere = 0;
    let skippedHere = 0;
    for (const sub of live) {
      const result = await executeForSubscriber({ session: runner.session, sub, market, decision, nowMs, dryRun: runner.env.dryRun });
      if (result.status === "filled") {
        filledHere += 1;
        const { fill } = result;
        await recordStrategyFill({
          txHash: fill.txHash,
          strategyId: fill.strategyId.toString(),
          grantId: fill.grantId.toString(),
          owner: fill.owner,
          marketId: fill.marketId,
          side: fill.side,
          cashDelta: fill.cashDeltaBase.toString(),
          tokenDelta: fill.tokenDeltaRaw.toString(),
          atSec: fill.atSec,
          dryRun: false,
        }).catch(() => false);
        runner.log(`#${strategyId}: filled ${fill.side} on ${market.asset}/${market.intervalSec}s for ${fill.owner} — ${fill.txHash}`);
      } else {
        skippedHere += 1;
        runner.log(`#${strategyId}: ${sub.subscriber} ${result.status}${"reason" in result ? ` — ${result.reason}` : ` — would stake ${result.stakeBase}`}`);
      }
    }
    filled += filledHere;
    skipped += skippedHere;
    if (isAgent) await markDecisionExecution(strategyId.toString(), market.marketId, filledHere, skippedHere).catch(() => false);
  }
  await heartbeat(runner, strategyId, `${scanned.why}; ${filled} filled, ${skipped} skipped${runner.env.dryRun ? " (dry run)" : ""}`, scanned.scanned, scanned.closestBps);
}

/**
 * The house runner (Story 6.5): a single writer over one key, trading each live subscriber's own
 * grant, whether the spec is the oracle-follow model or an agent whose calls a language model
 * makes and a fixed gate rules on. Idle cycles emit heartbeats — never liveness theater.
 */
export async function startStrategyRunner(log: Log): Promise<void> {
  const env = readRunnerEnv();
  if (env.strategyIds.length === 0) return log("not configured: STRATEGY_IDS is empty; idle");
  if (!resolveRegistryDeployment()) return log("StrategyRegistry is not deployed on this network; idle");
  const marketsEnv = parseMarketsEnv({ venueId: env.venueId });
  ensureMarkets(marketsEnv);
  const venue = await resolveVenueId(marketsEnv.venueId);
  if (!isOk(venue) || !venue.value.venueId) return log(`no venue to scan: ${isOk(venue) ? "none live" : venue.error.technical}; idle`);

  let session: SubmitterSession | null = null;
  if (env.privateKey) {
    session = await createSubmitterSession({ env: marketsEnv, authority: "strategy-runner", signer: { privateKey: env.privateKey }, journal: createMemoryJournal() });
    log(`runner key ${session.address}${env.dryRun ? " (dry run: nothing is sent)" : ""}`);
  } else {
    log("RUNNER_PRIVATE_KEY is not set: scanning and reporting only, nothing can be sent");
  }
  if (!isDbConfigured()) log("DATABASE_URL is not set: heartbeats, fills and decisions are logged here only");

  const agent = createAgentState();
  log(agentBootLine(agent));
  if (agent.brain) {
    const warmed = await warmAgentState(agent, msToSec(Date.now()));
    log(`agent memory: ${warmed} Windows already read; budget ${env.agentMaxCallsPerHour} calls/h, ${env.agentTimeoutMs} ms per read`);
  }

  const runner: Runner = { env, session, venueId: venue.value.venueId, agent, log };
  const tick = async () => {
    await marketsProvider.syncClock();
    for (const id of env.strategyIds) {
      await cycle(runner, id, marketsProvider.nowMs()).catch((error: unknown) => log(`#${id}: cycle failed — ${error instanceof Error ? error.message : String(error)}`));
    }
  };
  await tick();
  setInterval(() => void tick(), env.intervalMs);
}
