import { createMemoryJournal, createSubmitterSession, ensureMarkets, getCollateral, loadCollateral, parseMarketsEnv, syncClock } from "@masayume/markets";
import { xReceiptByMention, xRelayStateGet, xRelayStateSet } from "@masayume/db";
import type { Bytes32 } from "@masayume/core/types";
import { fetchMentions, type PostingAuth, replyTo } from "./client";
import { readOAuth1, readRelayEnv, RELAY_ENV } from "./env";
import { executeMention, replyText, resolveVenue, xReceiptUpsert } from "./execute";

const HEARTBEAT_MS = 60_000;
const CURSOR_KEY = "mentions.since_id";

/**
 * The X mention relay (doc 03 §X prediction rail): bounded polling of the account's mentions,
 * one receipt per mention, idempotent by tweet id, executing from an isolated x-executor
 * session under the owner's EXECUTOR grant. Without credentials it heartbeats what is missing
 * and never crashes; without a user-context token it executes but does not reply.
 */
export async function startXRelay(log: (why: string) => void): Promise<void> {
  const reading = readRelayEnv();
  if (!reading.ok) {
    const why = `not configured — set ${reading.missing.join(", ")}`;
    log(why);
    setInterval(() => log(why), HEARTBEAT_MS);
    return;
  }
  const relay = reading.env;
  const marketsEnv = parseMarketsEnv({ venueId: process.env.VENUE_ID });
  ensureMarkets(marketsEnv);
  await loadCollateral();
  await syncClock();
  const venueId = await resolveVenue(marketsEnv.venueId as Bytes32);
  if (!venueId) {
    log("no live venue — nothing to execute against");
    setInterval(() => log("no live venue"), HEARTBEAT_MS);
    return;
  }
  const session = await createSubmitterSession({ env: marketsEnv, authority: "x-executor", signer: { privateKey: relay.executorPrivateKey }, journal: createMemoryJournal() });
  // Replies need a user context: the OAuth 2.0 token if one was minted, else the portal's OAuth 1.0a set.
  const posting: PostingAuth | null = !relay.postingEnabled ? null : relay.userAccessToken ? { kind: "oauth2", userAccessToken: relay.userAccessToken } : relay.oauth1 ? { kind: "oauth1", credentials: relay.oauth1 } : null;
  const partial = readOAuth1().partial;
  const postingWhy = posting ? `on (${posting.kind})` : !relay.postingEnabled ? "off" : partial.length > 0 ? `off (set ${partial.join(", ")})` : `off (set ${RELAY_ENV.userToken}, or ${RELAY_ENV.apiKey} + ${RELAY_ENV.apiKeySecret} + ${RELAY_ENV.accessToken} + ${RELAY_ENV.accessTokenSecret})`;
  log(`executor ${session.address} on venue ${venueId}; posting ${postingWhy}`);

  let busy = false;
  const cycle = async () => {
    if (busy) return;
    busy = true;
    try {
      const sinceId = await xRelayStateGet(CURSOR_KEY);
      const mentions = await fetchMentions(relay.bearerToken, relay.accountId, sinceId);
      if (mentions.length === 0) log(`scanned mentions since ${sinceId ?? "the start"}: none new`);
      for (const mention of mentions) {
        if (await xReceiptByMention(mention.id)) continue;
        await xReceiptUpsert({ mentionId: mention.id, authorId: mention.authorId, handle: mention.handle, wallet: null, grantId: null, marketId: null, side: null, stakeBase: null, status: "submitted", reason: null, txHash: null, instruction: mention.text, atMs: mention.createdAtMs });
        const receipt = await executeMention({ session, venueId, log }, mention);
        await xReceiptUpsert(receipt);
        if (posting) {
          try {
            await replyTo(posting, mention.id, replyText(receipt, getCollateral().decimals));
          } catch (error) {
            log(`reply to ${mention.id} failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        await xRelayStateSet(CURSOR_KEY, mention.id);
      }
    } catch (error) {
      log(`cycle failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      busy = false;
    }
  };
  await cycle();
  setInterval(() => void cycle(), relay.pollMs);
}
