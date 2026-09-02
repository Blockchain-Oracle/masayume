import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * The "Sign in with X" session — a port of the reference's `lib/claimOAuth.ts`.
 *
 * The HMAC-signed cookie carries the X authorId the bind route trusts precisely BECAUSE it is
 * signed; a public fallback key would let anyone mint a session for any handle and bind someone
 * else's account to their own wallet. There is no safe default for a key whose whole job is
 * being unguessable, so a missing `X_SESSION_SECRET` refuses.
 */
const b64url = (b: Buffer) => b.toString("base64url");

export const genVerifier = () => b64url(randomBytes(32));
export const codeChallenge = (verifier: string) => b64url(createHash("sha256").update(verifier).digest());
export const genState = () => b64url(randomBytes(16));

/** 30 days, as the reference settled on: a one-shot claim tolerates 30 minutes, a portfolio card does not. */
export const X_SESSION_TTL_MS = 30 * 24 * 60 * 60_000;
export const X_SESSION_COOKIE = "x_sess";
export const X_PKCE_COOKIES = { verifier: "x_v", state: "x_s", ret: "x_ret" } as const;
export const X_PKCE_TTL_SEC = 600;

export interface XSession {
  authorId: string;
  handle: string | null;
  t: number;
}

export function signSession(secret: string, payload: XSession): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/** The session this cookie proves, or null — expired, forged, or malformed all read the same. */
export function readSession(secret: string, token: string | undefined): XSession | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".") as [string, string];
  const expected = Buffer.from(createHmac("sha256", secret).update(body).digest("base64url"));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as Partial<XSession>;
    if (typeof parsed.authorId !== "string" || !parsed.authorId) return null;
    if (typeof parsed.t === "number" && Date.now() - parsed.t > X_SESSION_TTL_MS) return null;
    return { authorId: parsed.authorId, handle: typeof parsed.handle === "string" ? parsed.handle : null, t: parsed.t ?? 0 };
  } catch {
    return null;
  }
}
