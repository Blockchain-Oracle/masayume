import { NextResponse, type NextRequest } from "next/server";
import { readXConfig } from "@/features/x/config.server";
import { X_AUTHORIZE_URL, X_SCOPES } from "@/features/x/oauth.server";
import { codeChallenge, genState, genVerifier, X_PKCE_COOKIES, X_PKCE_TTL_SEC } from "@/features/x/session.server";

export const dynamic = "force-dynamic";

/**
 * "Sign in with X": PKCE + state in short-lived httpOnly cookies, then a redirect to X.
 * `?return=/path` says where the callback lands (default `/trade-from-x`). Ported from the
 * reference's `api/claim/x/start`, including its origin guard: the cookies must be written on
 * the origin that receives the callback, or X appears to succeed and the page asks again.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const reading = readXConfig(origin);
  if (!reading.configured) return NextResponse.json({ configured: false, missing: reading.missing });
  const { config } = reading;

  const ret = req.nextUrl.searchParams.get("return");
  const safeRet = ret && ret.startsWith("/") && !ret.startsWith("//") ? ret : "";

  const callbackOrigin = new URL(config.redirectUri).origin;
  if (origin !== callbackOrigin) {
    const canonical = new URL("/api/x/start", callbackOrigin);
    if (safeRet) canonical.searchParams.set("return", safeRet);
    return NextResponse.redirect(canonical);
  }

  const verifier = genVerifier();
  const state = genState();
  const url = new URL(X_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", X_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");

  const res = NextResponse.redirect(url.toString());
  const opts = { httpOnly: true, secure: origin.startsWith("https"), sameSite: "lax" as const, path: "/", maxAge: X_PKCE_TTL_SEC };
  res.cookies.set(X_PKCE_COOKIES.verifier, verifier, opts);
  res.cookies.set(X_PKCE_COOKIES.state, state, opts);
  if (safeRet) res.cookies.set(X_PKCE_COOKIES.ret, safeRet, opts);
  return res;
}
