import type { Hex } from "@masayume/core/types";

export interface RunnerEnv {
  privateKey: Hex | null;
  strategyIds: bigint[];
  intervalMs: number;
  dryRun: boolean;
  venueId: string | undefined;
}

const DEFAULT_INTERVAL_MS = 30_000;

/** Read once at boot; a missing key or an empty strategy list is logged as "not configured", never guessed. */
export function readRunnerEnv(env: NodeJS.ProcessEnv = process.env): RunnerEnv {
  const key = env.RUNNER_PRIVATE_KEY;
  const ids = (env.STRATEGY_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => BigInt(s));
  const interval = Number(env.RUNNER_INTERVAL_MS);
  return {
    privateKey: key && /^0x[0-9a-fA-F]{64}$/.test(key) ? (key as Hex) : null,
    strategyIds: ids,
    intervalMs: Number.isFinite(interval) && interval >= 5_000 ? interval : DEFAULT_INTERVAL_MS,
    dryRun: env.DRY_RUN === "1" || env.DRY_RUN === "true",
    venueId: env.VENUE_ID,
  };
}
