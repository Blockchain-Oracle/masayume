/**
 * What the X rail needs from the environment, and what is missing — server only.
 *
 * Every route answers `{ configured: false, missing: [...] }` rather than failing when a
 * variable is absent, so the pages keep their controls and say exactly what would connect them.
 */
export interface XConfig {
  clientId: string;
  clientSecret: string | null;
  redirectUri: string;
  sessionSecret: string;
  /** The executor wallet an EXECUTOR grant names; the relay signs from it. */
  executorAddress: string | null;
}

export type XConfigReading = { configured: true; config: XConfig } | { configured: false; missing: string[] };

export const X_ENV = {
  clientId: "X_CLIENT_ID",
  clientSecret: "X_CLIENT_SECRET",
  redirectUri: "X_REDIRECT_URI",
  sessionSecret: "X_SESSION_SECRET",
  executor: "X_EXECUTOR_ADDRESS",
} as const;

export function readXConfig(origin: string): XConfigReading {
  const clientId = process.env.X_CLIENT_ID ?? "";
  const sessionSecret = process.env.X_SESSION_SECRET ?? "";
  const missing: string[] = [];
  if (!clientId) missing.push(X_ENV.clientId);
  if (!sessionSecret) missing.push(X_ENV.sessionSecret);
  if (missing.length > 0) return { configured: false, missing };
  return {
    configured: true,
    config: {
      clientId,
      clientSecret: process.env.X_CLIENT_SECRET || null,
      redirectUri: process.env.X_REDIRECT_URI || `${origin}/api/x/callback`,
      sessionSecret,
      executorAddress: executorAddress(),
    },
  };
}

/** The executor address is public information (it is what the grant names), so either spelling works. */
export function executorAddress(): string | null {
  const value = process.env.X_EXECUTOR_ADDRESS || process.env.NEXT_PUBLIC_X_EXECUTOR_ADDRESS || "";
  return /^0x[0-9a-fA-F]{40}$/.test(value) ? value.toLowerCase() : null;
}
