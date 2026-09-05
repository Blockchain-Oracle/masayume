import { createMemoryJournal, createSubmitterSession, ensureMarkets, getCollateral, loadCollateral, parseMarketsEnv, syncClock } from "@masayume/markets";
import { xAcquireReplyDelivery, xBeginReplyPost, xClaimMention, xFinishReplyPost, xMarkInterruptedReplyPosts, xReceiptByMention, xRelayStateGet, xRelayStateSet, xStopReplyDelivery } from "@masayume/db";
import type { Bytes32 } from "@masayume/core/types";
import { readRelayEnv, RELAY_ENV } from "./env";
import { executeMention, resolveVenue, xReceiptUpsert } from "./execute";
import { rettiwtTransport } from "./rettiwt";
import { startReplyDelivery } from "./reply-delivery";
import { renderReplyCardPng } from "./reply-card";

const HEARTBEAT_MS = 60_000;
const CURSOR_KEY = "mentions.since_id";
/** The cursor after a first poll that found nothing: every real id is above it, so the next mention counts. */
const STARTED_CURSOR = "0";

/**
 * The X mention relay (doc 03 §X prediction rail): bounded polling of the account's mentions,
 * one receipt per mention, idempotent by tweet id, executing from an isolated x-executor
 * session under the owner's EXECUTOR grant, through the account's own session (`rettiwt.ts`). Without
 * its key it heartbeats what is missing and never crashes; without `X_POSTING_ENABLED` it executes but
 * does not reply.
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
  // The way to X: the account's own session. Replies go out as the account only when asked for.
  const transport = rettiwtTransport(relay.rettiwtApiKey, relay.handle);
  if (!relay.postingEnabled) transport.reply = null;
  const delivery = {
    store: { acquire: xAcquireReplyDelivery, receipt: xReceiptByMention, beginPost: xBeginReplyPost, sent: xFinishReplyPost, stop: xStopReplyDelivery, markInterrupted: xMarkInterruptedReplyPosts },
    transport, decimals: getCollateral().decimals, symbol: getCollateral().symbol,
    imagesEnabled: relay.replyImagesEnabled, render: renderReplyCardPng, log,
  };
  log(`executor ${session.address} on venue ${venueId}; via ${transport.describe()}; posting ${transport.reply ? "on (as the account)" : `off (set ${RELAY_ENV.posting}=1)`}`);
  // Delivery has its own busy gate and error boundary; it never schedules financial execution.
  startReplyDelivery(delivery);

  let busy = false;
  const cycle = async () => {
    if (busy) return;
    busy = true;
    try {
      const sinceId = await xRelayStateGet(CURSOR_KEY);
      const mentions = await transport.fetchMentions(sinceId);
      if (sinceId === null) {
        // The very first poll — and only that one — draws the line: nothing before now is an instruction.
        // With mentions already there, the cursor starts at the newest and none is executed (a tweet written
        // before the relay existed was not written to it); with none, the cursor is written as "started"
        // so the first mention that arrives later is executed rather than mistaken for history.
        const newest = mentions.length > 0 ? mentions[mentions.length - 1]!.id : STARTED_CURSOR;
        await xRelayStateSet(CURSOR_KEY, newest);
        log(mentions.length > 0 ? `first run: the cursor starts at ${newest}; ${mentions.length} earlier mention(s) left alone` : "first run: nothing before now; watching from here");
        return;
      }
      if (mentions.length === 0) log(`scanned mentions since ${sinceId ?? "the start"}: none new`);
      for (const mention of mentions) {
        const claimed = await xClaimMention({ mentionId: mention.id, authorId: mention.authorId, handle: mention.handle, wallet: null, grantId: null, marketId: null, side: null, stakeBase: null, status: "submitted", reason: null, txHash: null, instruction: mention.text, atMs: mention.createdAtMs }, Boolean(transport.reply));
        if (!claimed) {
          await xRelayStateSet(CURSOR_KEY, mention.id);
          continue;
        }
        const receipt = await executeMention({ session, venueId, log }, mention);
        await xReceiptUpsert(receipt);
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
