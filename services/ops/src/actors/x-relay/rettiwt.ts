import { Rettiwt } from "rettiwt-api";
import type { Mention, XTransport } from "./transport";

/** One page of the account's latest mentions per poll; the cursor keeps the relay from re-reading old ones. */
const PAGE = 20;

/**
 * The relay over the account's own session (`rettiwt-api`): X's search for `@handle`, newest first, and a
 * reply posted as the account. The API key is the account's cookies encoded by the library's own login
 * (`rettiwt auth login` or `Rettiwt.auth.login`), kept as a secret like any other.
 */
export function rettiwtTransport(apiKey: string, handle: string): XTransport {
  const user = handle.replace(/^@/, "");
  const client = new Rettiwt({ apiKey, timeout: 30_000, maxRetries: 2 });
  return {
    describe: () => `rettiwt (the account's session) · mentions of @${user}`,
    async fetchMentions(sinceId) {
      const page = await client.tweet.search({ mentions: [user] }, PAGE);
      return page.list
        .map<Mention>((t) => ({
          id: t.id,
          authorId: t.tweetBy?.id ?? "",
          handle: t.tweetBy?.userName ?? null,
          text: t.fullText,
          createdAtMs: t.createdAt ? Date.parse(t.createdAt) || Date.now() : Date.now(),
        }))
        .filter((m) => m.authorId !== "" && (sinceId === null || BigInt(m.id) > BigInt(sinceId)))
        .sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
    },
    reply: async (mentionId, text) => {
      const id = await client.tweet.post({ text, replyTo: mentionId });
      return typeof id === "string" && id ? id : null;
    },
  };
}
