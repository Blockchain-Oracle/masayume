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
  // A network retry after an accepted POST can create a duplicate public reply.
  const writer = new Rettiwt({ apiKey, timeout: 30_000, maxRetries: 0 });
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
    uploadImage: async (png) => {
      const id = await writer.tweet.upload(Uint8Array.from(png).buffer);
      if (!/^\d+$/.test(id)) throw new Error("X image upload did not return a media id");
      return id;
    },
    reply: async (mentionId, text, mediaId) => {
      if (!/^\d+$/.test(mentionId) || (mediaId && !/^\d+$/.test(mediaId))) throw new Error("Invalid reply identifier");
      if (text.length > 280 || /[^\x20-\x7E\n]/.test(text)) throw new Error("Reply text exceeded its verified ASCII budget");
      const id = await writer.tweet.post({ text, replyTo: mentionId, ...(mediaId ? { media: [{ id: mediaId }] } : {}) });
      return typeof id === "string" && id ? id : null;
    },
  };
}
