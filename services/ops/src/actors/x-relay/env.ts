import type { OAuth1Credentials } from "./oauth1";

export type RelayTransportKind = "official" | "rettiwt";

/** What the relay needs, and what is missing — read once, reported in the heartbeat, never a crash. */
export interface RelayEnv {
  /** `rettiwt` when its key is set (or asked for), else the official API. */
  transport: RelayTransportKind;
  /** The account's session, encoded by rettiwt's own login. */
  rettiwtApiKey: string | null;
  /** The handle whose mentions are the instructions, without the `@`. */
  handle: string | null;
  bearerToken: string;
  accountId: string;
  executorPrivateKey: `0x${string}`;
  postingEnabled: boolean;
  /** A user-context OAuth 2.0 token with tweet.write; app-only bearers can read mentions but cannot reply. */
  userAccessToken: string | null;
  /** The portal's OAuth 1.0a access token for the account's own app — the other way to reply. */
  oauth1: OAuth1Credentials | null;
  pollMs: number;
  databaseUrl: string;
}

export const RELAY_ENV = {
  transport: "X_TRANSPORT",
  rettiwtKey: "X_RETTIWT_API_KEY",
  handle: "X_HANDLE",
  bearer: "X_BEARER_TOKEN",
  account: "X_ACCOUNT_ID",
  executor: "X_EXECUTOR_PRIVATE_KEY",
  posting: "X_POSTING_ENABLED",
  userToken: "X_USER_ACCESS_TOKEN",
  apiKey: "X_API_KEY",
  apiKeySecret: "X_API_KEY_SECRET",
  accessToken: "X_ACCESS_TOKEN",
  accessTokenSecret: "X_ACCESS_TOKEN_SECRET",
  poll: "X_POLL_MS",
  db: "DATABASE_URL",
} as const;

/** All four or none: a half-pasted OAuth 1.0a set signs nothing, and the heartbeat should say which half. */
export function readOAuth1(env: NodeJS.ProcessEnv = process.env): { credentials: OAuth1Credentials | null; partial: string[] } {
  const values = {
    consumerKey: env.X_API_KEY ?? "",
    consumerSecret: env.X_API_KEY_SECRET ?? "",
    accessToken: env.X_ACCESS_TOKEN ?? "",
    accessTokenSecret: env.X_ACCESS_TOKEN_SECRET ?? "",
  };
  const names = [RELAY_ENV.apiKey, RELAY_ENV.apiKeySecret, RELAY_ENV.accessToken, RELAY_ENV.accessTokenSecret];
  const present = Object.values(values).map((v) => v.length > 0);
  if (present.every(Boolean)) return { credentials: values, partial: [] };
  if (present.some(Boolean)) return { credentials: null, partial: names.filter((_, i) => !present[i]) };
  return { credentials: null, partial: [] };
}

const DEFAULT_POLL_MS = 20_000;

export type RelayEnvReading = { ok: true; env: RelayEnv } | { ok: false; missing: string[] };

export function readRelayEnv(): RelayEnvReading {
  const missing: string[] = [];
  const bearerToken = process.env.X_BEARER_TOKEN ?? "";
  const accountId = process.env.X_ACCOUNT_ID ?? "";
  const rettiwtApiKey = process.env.X_RETTIWT_API_KEY || null;
  const handle = (process.env.X_HANDLE ?? "").replace(/^@/, "") || null;
  const asked = process.env.X_TRANSPORT;
  const transport: RelayTransportKind = asked === "official" ? "official" : asked === "rettiwt" || rettiwtApiKey ? "rettiwt" : "official";
  const executorPrivateKey = process.env.X_EXECUTOR_PRIVATE_KEY ?? "";
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (transport === "rettiwt") {
    if (!rettiwtApiKey) missing.push(RELAY_ENV.rettiwtKey);
    if (!handle) missing.push(RELAY_ENV.handle);
  } else {
    if (!bearerToken) missing.push(RELAY_ENV.bearer);
    if (!accountId) missing.push(RELAY_ENV.account);
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(executorPrivateKey)) missing.push(RELAY_ENV.executor);
  if (!databaseUrl) missing.push(RELAY_ENV.db);
  if (missing.length > 0) return { ok: false, missing };
  const pollMs = Number(process.env.X_POLL_MS);
  return {
    ok: true,
    env: {
      transport,
      rettiwtApiKey,
      handle,
      bearerToken,
      accountId,
      executorPrivateKey: executorPrivateKey as `0x${string}`,
      postingEnabled: process.env.X_POSTING_ENABLED === "1" || process.env.X_POSTING_ENABLED === "true",
      userAccessToken: process.env.X_USER_ACCESS_TOKEN || null,
      oauth1: readOAuth1().credentials,
      pollMs: Number.isFinite(pollMs) && pollMs >= 5_000 ? pollMs : DEFAULT_POLL_MS,
      databaseUrl,
    },
  };
}
