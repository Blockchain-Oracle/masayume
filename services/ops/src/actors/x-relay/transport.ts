import { fetchMentions, type Mention, type PostingAuth, replyTo } from "./client";

/**
 * How the relay reaches X. Two ways, one contract:
 *
 * - `official` — the X API v2 (`GET /2/users/:id/mentions`, `POST /2/tweets`) with the developer
 *   portal's tokens. Pay-per-use since 2026: about $0.005 per mention read, $0.015 per plain reply,
 *   credits bought up front; the deprecated Free plan serves none of these endpoints.
 * - `rettiwt` — the account's own session through `rettiwt-api` (cookies encoded as an API key), which
 *   talks to X the way the website does: a search for the handle's mentions and a reply as the account.
 *   Costs nothing; unofficial, so the account should be one made for the purpose.
 *
 * The parse, the execution under the grant, the receipts and the reply words are the same either way.
 */
export interface XTransport {
  kind: "official" | "rettiwt";
  /** One line for the boot log: which way, and as whom. */
  describe(): string;
  /** Mentions newer than `sinceId`, oldest first. */
  fetchMentions(sinceId: string | null): Promise<Mention[]>;
  /** A reply under the mention, or null when this transport cannot post. */
  reply: ((mentionId: string, text: string) => Promise<string | null>) | null;
}

export function officialTransport(bearerToken: string, accountId: string, posting: PostingAuth | null): XTransport {
  return {
    kind: "official",
    describe: () => `X API v2 · account ${accountId}`,
    // "0" is the relay's own "started" cursor; X's since_id wants a real id or nothing.
    fetchMentions: (sinceId) => fetchMentions(bearerToken, accountId, sinceId === "0" ? null : sinceId),
    reply: posting ? (mentionId, text) => replyTo(posting, mentionId, text) : null,
  };
}
