/** The X API v2 slice the relay uses: the account's mentions timeline, and a reply. */
const API = "https://api.x.com/2";
const PAGE = 100;

export interface Mention {
  id: string;
  authorId: string;
  handle: string | null;
  text: string;
  createdAtMs: number;
}

interface MentionsPayload {
  data?: Array<{ id: string; author_id?: string; text: string; created_at?: string }>;
  includes?: { users?: Array<{ id: string; username?: string }> };
  meta?: { newest_id?: string };
}

/** Mentions newer than `sinceId`, oldest first, so receipts are written in the order people asked. */
export async function fetchMentions(bearerToken: string, accountId: string, sinceId: string | null): Promise<Mention[]> {
  const url = new URL(`${API}/users/${encodeURIComponent(accountId)}/mentions`);
  url.searchParams.set("max_results", String(PAGE));
  url.searchParams.set("tweet.fields", "author_id,created_at,text");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "username");
  if (sinceId) url.searchParams.set("since_id", sinceId);
  const response = await fetch(url, { headers: { authorization: `Bearer ${bearerToken}` } });
  if (!response.ok) throw new Error(`mentions ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const payload = (await response.json()) as MentionsPayload;
  const handles = new Map((payload.includes?.users ?? []).map((u) => [u.id, u.username ?? null]));
  return (payload.data ?? [])
    .map((t) => ({ id: t.id, authorId: t.author_id ?? "", handle: handles.get(t.author_id ?? "") ?? null, text: t.text, createdAtMs: t.created_at ? Date.parse(t.created_at) : Date.now() }))
    .filter((m) => m.authorId !== "")
    .sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
}

/** A reply under the mention. Needs a user-context token; the relay says so when it has none. */
export async function replyTo(userAccessToken: string, mentionId: string, text: string): Promise<string | null> {
  const response = await fetch(`${API}/tweets`, {
    method: "POST",
    headers: { authorization: `Bearer ${userAccessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ text, reply: { in_reply_to_tweet_id: mentionId } }),
  });
  if (!response.ok) throw new Error(`reply ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const payload = (await response.json()) as { data?: { id?: string } };
  return payload.data?.id ?? null;
}
