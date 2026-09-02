/** What the relay needs, and what is missing — read once, reported in the heartbeat, never a crash. */
export interface RelayEnv {
  bearerToken: string;
  accountId: string;
  executorPrivateKey: `0x${string}`;
  postingEnabled: boolean;
  /** A user-context token with tweet.write; app-only bearers can read mentions but cannot reply. */
  userAccessToken: string | null;
  pollMs: number;
  databaseUrl: string;
}

export const RELAY_ENV = {
  bearer: "X_BEARER_TOKEN",
  account: "X_ACCOUNT_ID",
  executor: "X_EXECUTOR_PRIVATE_KEY",
  posting: "X_POSTING_ENABLED",
  userToken: "X_USER_ACCESS_TOKEN",
  poll: "X_POLL_MS",
  db: "DATABASE_URL",
} as const;

const DEFAULT_POLL_MS = 20_000;

export type RelayEnvReading = { ok: true; env: RelayEnv } | { ok: false; missing: string[] };

export function readRelayEnv(): RelayEnvReading {
  const missing: string[] = [];
  const bearerToken = process.env.X_BEARER_TOKEN ?? "";
  const accountId = process.env.X_ACCOUNT_ID ?? "";
  const executorPrivateKey = process.env.X_EXECUTOR_PRIVATE_KEY ?? "";
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!bearerToken) missing.push(RELAY_ENV.bearer);
  if (!accountId) missing.push(RELAY_ENV.account);
  if (!/^0x[0-9a-fA-F]{64}$/.test(executorPrivateKey)) missing.push(RELAY_ENV.executor);
  if (!databaseUrl) missing.push(RELAY_ENV.db);
  if (missing.length > 0) return { ok: false, missing };
  const pollMs = Number(process.env.X_POLL_MS);
  return {
    ok: true,
    env: {
      bearerToken,
      accountId,
      executorPrivateKey: executorPrivateKey as `0x${string}`,
      postingEnabled: process.env.X_POSTING_ENABLED === "1" || process.env.X_POSTING_ENABLED === "true",
      userAccessToken: process.env.X_USER_ACCESS_TOKEN || null,
      pollMs: Number.isFinite(pollMs) && pollMs >= 5_000 ? pollMs : DEFAULT_POLL_MS,
      databaseUrl,
    },
  };
}
