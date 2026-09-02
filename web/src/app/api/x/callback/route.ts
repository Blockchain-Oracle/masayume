import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { readXConfig } from "@/features/x/config.server";
import { exchangeCode, fetchMe } from "@/features/x/oauth.server";
import { X_DEFAULT_RETURN, X_REASON_PARAM, X_RETURN_PARAM } from "@/features/x/protocol";
import { signSession, X_PKCE_COOKIES, X_SESSION_COOKIE, X_SESSION_TTL_MS } from "@/features/x/session.server";

export const dynamic = "force-dynamic";

/**
 * X redirects here with `?code&state`. Exchange for a token, read the handle and id, stash a
 * signed session, and bounce back to the page that started it with `?x=1` — or `?x=err&x_reason=`.
 * Ported from the reference's `api/claim/x/callback`.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const jar = await cookies();
  const ret = jar.get(X_PKCE_COOKIES.ret)?.value;
  const home = `${origin}${ret && ret.startsWith("/") && !ret.startsWith("//") ? ret : X_DEFAULT_RETURN}`;
  const withResult = (result: "1" | "err", reason?: string) => {
    const url = new URL(home);
    url.searchParams.set(X_RETURN_PARAM, result);
    if (reason) url.searchParams.set(X_REASON_PARAM, reason);
    return url.toString();
  };

  const reading = readXConfig(origin);
  if (!reading.configured) return NextResponse.redirect(withResult("err", "config"));
  const { config } = reading;

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const verifier = jar.get(X_PKCE_COOKIES.verifier)?.value;
  const savedState = jar.get(X_PKCE_COOKIES.state)?.value;
  if (!code || !state) return NextResponse.redirect(withResult("err", "denied"));
  if (!verifier || !savedState || state !== savedState) return NextResponse.redirect(withResult("err", "state"));

  try {
    const token = await exchangeCode({ clientId: config.clientId, clientSecret: config.clientSecret, code, redirectUri: config.redirectUri, verifier });
    if (!token.ok || !token.accessToken) {
      const errorCode = String(token.error ?? "unknown").replace(/[^a-z0-9_-]/gi, "").slice(0, 48);
      console.error("X OAuth token exchange failed", { status: token.status, code: errorCode, mode: token.mode });
      return NextResponse.redirect(withResult("err", `token_${errorCode || "unknown"}`));
    }
    const me = await fetchMe(token.accessToken);
    if (!me) return NextResponse.redirect(withResult("err", "profile"));

    const res = NextResponse.redirect(withResult("1"));
    res.cookies.set(X_SESSION_COOKIE, signSession(config.sessionSecret, { authorId: me.id, handle: me.username, t: Date.now() }), {
      httpOnly: true,
      secure: origin.startsWith("https"),
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(X_SESSION_TTL_MS / 1000),
    });
    res.cookies.delete(X_PKCE_COOKIES.verifier);
    res.cookies.delete(X_PKCE_COOKIES.state);
    res.cookies.delete(X_PKCE_COOKIES.ret);
    return res;
  } catch (error) {
    console.error("X OAuth callback failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.redirect(withResult("err", "server"));
  }
}
