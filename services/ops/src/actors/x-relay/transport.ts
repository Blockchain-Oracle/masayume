/** One mention of the account, as the relay reads it: who said what, when, and the post's own id. */
export interface Mention {
  id: string;
  authorId: string;
  handle: string | null;
  text: string;
  createdAtMs: number;
}

/**
 * How the relay reaches X. One way since 2026-09-05: the account's own session through `rettiwt-api`
 * (cookies encoded as an API key), which talks to X the way the website does — a search for the handle's
 * mentions and a reply as the account. The X API v2 transport that preceded it is gone: X's deprecated
 * Free plan serves none of its endpoints and pay-per-use wants credits; the session costs nothing.
 * The contract stays so the way to X can change again without touching the parse, the execution under
 * the grant, the receipts or the reply words.
 */
export interface XTransport {
  /** One line for the boot log: which way, and as whom. */
  describe(): string;
  /** Mentions newer than `sinceId`, oldest first. */
  fetchMentions(sinceId: string | null): Promise<Mention[]>;
  /** A reply under the mention, or null when replies are switched off. */
  reply: ((mentionId: string, text: string) => Promise<string | null>) | null;
}
