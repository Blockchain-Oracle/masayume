/**
 * The token exchange and profile read against X's API — a port of the reference's callback
 * helpers. A confidential client authenticates with Basic auth; a public PKCE client puts its
 * client_id in the body; the two request shapes are kept distinct, and a stale secret on a
 * public app falls back to the public shape before asking the user to start over.
 */
export const X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const ME_URL = "https://api.x.com/2/users/me";
export const X_SCOPES = "users.read tweet.read";

export interface TokenResult {
  ok: boolean;
  status: number;
  accessToken: string | null;
  error: string | null;
  mode: "confidential" | "public";
}

export async function exchangeCode(input: { clientId: string; clientSecret: string | null; code: string; redirectUri: string; verifier: string }): Promise<TokenResult> {
  const request = async (mode: TokenResult["mode"]): Promise<TokenResult> => {
    const confidential = mode === "confidential";
    const body = new URLSearchParams({ grant_type: "authorization_code", code: input.code, redirect_uri: input.redirectUri, code_verifier: input.verifier });
    if (!confidential) body.set("client_id", input.clientId);
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        ...(confidential ? { authorization: `Basic ${Buffer.from(`${input.clientId}:${input.clientSecret}`).toString("base64")}` } : {}),
      },
      body,
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      ok: response.ok && typeof payload.access_token === "string",
      status: response.status,
      accessToken: typeof payload.access_token === "string" ? payload.access_token : null,
      error: typeof payload.error === "string" ? payload.error : null,
      mode,
    };
  };

  if (!input.clientSecret) return request("public");
  const confidential = await request("confidential");
  if (confidential.ok) return confidential;
  if (confidential.status === 401 || confidential.error === "invalid_client" || confidential.error === "unauthorized_client") return request("public");
  return confidential;
}

export async function fetchMe(accessToken: string): Promise<{ id: string; username: string | null } | null> {
  const response = await fetch(ME_URL, { headers: { authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const me = (await response.json().catch(() => ({}))) as { data?: { id?: string; username?: string } };
  if (!response.ok || !me.data?.id) return null;
  return { id: String(me.data.id), username: me.data.username ?? null };
}
