# X live acceptance readiness — 6 September 2026

## Live test addendum — 21:09 UTC

The coordinator posted one new authorized Shannon testnet command, `2096704007112696288`, at 20:56:04 UTC. **Its financial execution and image delivery were confirmed, but overall X acceptance failed because the old relay treated its own receipt as another mention.** Posting is disabled until the fix below is deployed and checked. The readiness sections below remain the earlier 20:47–20:53 snapshot.

| Verified fact | Evidence |
| --- | --- |
| Command | `Shannon testnet demonstration. Faucet assets only.\n@masayume_app btc up 1 4h` |
| Original receipt | One `filled` row for `2096704007112696288`; original stored sender `1971264227093643264`, `@masayume_app` |
| Chain transaction | `0x072a0259bd75c22697d960da29c513ff9a0d3b0f24ba5eefbe626810093fa26b`, successful at block `481550357` |
| Decoded chain event | Exactly one `Executed` event: expected owner, X executor, grant **4**, BTC market `0x…15529`, UP buy, **908520** cash base units spent and **1340000** token units received |
| Public valid reply | `2096704198461084030`, parent `2096704007112696288`, correct account; one delivery attempt |
| Media acknowledgement | Stored media `2096704190013640708` matches public reply media metadata; public image `https://pbs.twimg.com/media/HRj9WhzWEAQeUH4.jpg` |
| Adjacent text | `For @masayume_app`, `Spent 0.90852 tUSDC.`, and a public expanded URL matching the full transaction hash |
| Loop defect | The valid reply was erroneously claimed as a new instruction and refused, creating extra reply `2096704320867541006`. That extra reply was then also claimed/refused; its next delivery is `unknown` with no acknowledged post ID. Both refused rows have no transaction hash. |
| Containment | Coordinator disabled `X_POSTING_ENABLED`; a read-only probe confirmed `false` at **21:09:02 UTC**. No new execution or receipt rows were present beyond those three. |

The public image's sender/hash pixels still require visual inspection by the coordinator; matching media metadata alone does not establish that. One additional delivery remains ambiguous and must not be retried, even if a bounded public search does not find a post.

The fix verifies the session's stable account ID against its configured handle, suppresses every bot-authored **reply** before claim, and independently recognizes persisted delivery reply IDs. The bot's own top-level commands and other users' reply commands remain eligible. Suppression advances only the mention cursor; it creates no new execution receipt or delivery. A failed durable lookup keeps the cursor unchanged.

Before starting delivery, the fixed relay permanently holds recursive pending/preparing/posting/unknown jobs as `failed` with `relay-reply-suppressed`, preserving exact payload and media evidence. Acquisition and the final POST gate also exclude known receipt IDs. Sent original and clutter acknowledgements remain intact. Identity or suppression unavailability holds only X startup and retries after one minute. No new social post or trade is needed to prove that the old held item stays held after deployment.

Local checks: **114 X unit cases** (113 suite cases plus the added mixed-command case), **18** disposable PostgreSQL delivery checks, DB/ops typecheck, **14** repository invariants and diff whitespace checks passed. At the time of this addendum, deployment and live suppression verification belong to the coordinator and are not claimed complete. Raw public-only observations are in `.masayume/acceptance-2026-09-06/x-live-mention-evidence.json`; the original nine-post cleanup list is separate from the new clutter inventory.

## Initial readiness snapshot

Read-only checks performed from the existing `masayume-ops` Fly machine at **20:47:18 UTC**, with an additional account/package check at **20:49:37 UTC**. No tweet was posted, uploaded or deleted; no database row was written and no transaction was signed. Database queries ran inside a PostgreSQL **READ ONLY** transaction. This record contains only public identifiers, contract facts and bounded service state; no credentials or account-link signature are included.

## Result

The existing linked account, EXECUTOR grant, remaining budget and executor gas satisfy the account/funding prerequisites for a small X test. The relay is polling successfully and its posting/image switches are enabled. **Live media acceptance remains unproved:** the reply-delivery table is empty and no image acknowledgement exists. A fresh market, quote and contract permission check must still pass when the new instruction executes.

The owner has not yet confirmed deletion of the exact nine-post batch. Deletion calls below remain pending that confirmation. The coordinator is proceeding with the separately authorized new test; its new instruction and reply are excluded from the old nine-id batch. None of these mutation calls were run by this readiness worker.

## Account and chain evidence

| Fact | Read result |
| --- | --- |
| Authenticated X account | `1971264227093643264`, `@masayume_app` |
| Current profile count | 9 posts; all 9 ids in the existing cleanup manifest were returned by `tweet.details(ids)` and all named that same author |
| Active database link | Account above → `0xd357019e2c55375477802a047db7bc1a77819358`; `revoked_at = null` |
| Network/block | Somnia Shannon, chain 50312, block **481544811**, chain timestamp **1788727638** |
| EventVault | `0x84Ec824D89ee78d5728545CE0B40EC968aa7CD7A` |
| Actual configured executor | Key-derived public address `0xFf3e12Ec3d555CF3b4B715586403AB4199Ad02E5` |
| Active EXECUTOR grant | **4**, kind 1; owner and actor both match; not revoked |
| Expiry | **5 October 2026, 05:34:21 UTC** (`1791178461`), later than the checked chain timestamp |
| Remaining grant budget | **4.092090 tUSDC** (`4092090` base units) |
| Caps | **5 tUSDC per trade**, **5 per UTC day**, **8 open Windows**, no extra entry-price ceiling (`maxPriceRaw = 0`) |
| Open positions | **1 of 8** recorded against the grant |
| Daily counter | Stored `spentDay = 20701`, `spentToday = 907910`; current chain UTC day is **20702**, so effective spend for the current day is **0** under the contract's day-reset rule |
| Owner's available Trading Balance | **1.071716 tUSDC**; separate from the 4.092090 already reserved to the X grant |
| Owner's wallet token balance | **9933.384537 tUSDC**; no new deposit is needed to request a 1 tUSDC instruction from the existing grant |
| Executor gas | **1.980980096 STT**, above the current vault-order preflight requirement **0.432 STT** |

The gas requirement is the application's 6,000,000-gas vault-order ceiling × 60 gwei × 1.2 safety factor, not a prediction of actual gas spent. Source: `packages/core/src/constants/gas.ts`, `packages/markets/src/submitter/gas.ts`. Grant day accounting is in `contracts/src/vault/EventVault.sol` and `packages/core/src/vault/caps.ts`.

The existing open position may be historical; this check did not settle it or infer its current market result. One used slot does not exhaust the eight-slot cap.

### Fresh quote comparison at 20:53:56 UTC

These are read-only quotes for **1 tUSDC UP** using the same soonest-enterable asset/cadence selection and SDK quote path as the relay. Every returned reading was fresh. They are a transient test-routing snapshot, not a directional market recommendation or a guaranteed fill.

| Window | Expected cost | Maximum cost / limit price | Quantity / average price | Result |
| --- | --- | --- | --- | --- |
| BTC 4h, market `0x0000000000000000000000000000000000000000000000000000000000015529` | 0.908791 tUSDC | 0.999802 tUSDC / 75.8¢ | 1.319000 / 68.9¢ | Chosen proposed test route; expires 7 September 00:00 UTC |
| ETH 4h, market `0x000000000000000000000000000000000000000000000000000000000001552a` | 0.907509 tUSDC | 0.999267 tUSDC / 89.3¢ | 1.119000 / 81.1¢ | Fillable snapshot, higher protective price |
| BTC 1h, market `0x000000000000000000000000000000000000000000000000000000000001552b` | 0.992992 tUSDC | 0.999999 tUSDC / 99.9¢ | 1.001000 / 99.2¢ | Near-one price; not selected for the test |
| ETH 1h, market `0x000000000000000000000000000000000000000000000000000000000001552c` | — | — | — | No fillable quote |

Grant 4's `maxPriceRaw = 0` means it adds no 85¢ or 95¢ ceiling. Those agent/copy posture settings do not automatically constrain an explicit X instruction. The quote's protective limit still belongs to that order. The relay must re-read it at execution time.

## Relay and delivery evidence

| Fact | Read result |
| --- | --- |
| `X_HANDLE` | `masayume_app` |
| Account session / database configured | Both present; values never emitted |
| Posting enabled | `true` |
| Reply images enabled | `true` |
| Mention cursor | `2096111782209233405`, last updated 5 September 05:43:06 UTC |
| Polling | `ok`, checked **20:47:11 UTC** on 6 September |
| Execution recovery | `idle`, checked **20:47:11 UTC**; no successful recovery timestamp recorded |
| Reply delivery | `idle`, checked **20:47:15 UTC**; images enabled; no successful delivery timestamp recorded |
| Unresolved executions | **0** |
| Replies needing inspection | **0** |
| Delivery rows / acknowledged image | **0 rows** / **none** |

The old cursor is compatible with no newer supported instruction; fresh successful polling establishes that the worker is checking. It does not prove a new trade or media upload. The historical filled receipt under mention `2096111782209233405` retains transaction `0x4bcbc318626a31c46968d6c801eba7ba60339219f0a7bb812f5a42f67fc9c484`, but lacks the newer execution-journal fields and has no delivery row. Historical rows are not automatically backfilled or replayed.

## Installed provider methods

The **running Fly installation** is Rettiwt **7.1.3**. Its installed TypeScript declarations and runtime expose:

```ts
tweet.unpost(id: string): Promise<boolean>;
tweet.upload(media: string | ArrayBuffer): Promise<string>;
tweet.post(options: INewTweet): Promise<string | undefined>;
```

The deletion method is **`unpost`**, not `tweet.delete`. `INewTweet` accepts `text`, `replyTo` and `media: [{ id }]`; media must be uploaded first. `upload` accepts a local filename or an `ArrayBuffer`. The installed media type has no alt-text field. Essential transaction facts must remain in adjacent text.

Read methods used for verification are `user.details()`, `tweet.details(ids)` and the existing paginated timeline APIs. The declaration supports `user.timeline(id?, count?, cursor?)`, `user.replies(id?, count?, cursor?)` and `tweet.replies(id, cursor?, sortBy?)`. Use the library's public methods; no private endpoint emulation is needed.

Source pointers: installed `rettiwt-api/dist/services/public/TweetService.d.ts`, `UserService.d.ts`, `types/args/PostArgs.d.ts`; application adapter `services/ops/src/actors/x-relay/rettiwt.ts`.

## Prepared calls — not executed

Use the existing server-side environment inside the Fly process. Keep `logging: false`, and disable automatic retries for mutation methods so an ambiguous acknowledgement cannot trigger a duplicate post. Never print the credential, client internals or raw provider error object.

```ts
const reader = new Rettiwt({
  apiKey: process.env.X_RETTIWT_API_KEY,
  timeout: 30_000,
  maxRetries: 0,
  logging: false,
});
const writer = new Rettiwt({
  apiKey: process.env.X_RETTIWT_API_KEY,
  timeout: 30_000,
  maxRetries: 0,
  logging: false,
});

// READ ONLY: recheck immediately before the separately confirmed batch.
const me = await reader.user.details();
if (me?.id !== "1971264227093643264") throw new Error("Wrong X account");
const originals = await reader.tweet.details(confirmedNineIds);
if (originals.length !== confirmedNineIds.length
  || originals.some(t => t.tweetBy.id !== me.id
    || !confirmedNineIds.includes(t.id))) {
  throw new Error("The confirmed batch no longer matches the account");
}

// MUTATION: only after the owner confirms this exact saved nine-id batch.
// Sequential calls; record each acknowledgement before proceeding.
for (const id of confirmedNineIds) {
  const removed = await writer.tweet.unpost(id);
  await recordPublicDeletionResult({ id, removed });
  if (!removed) throw new Error("Deletion needs inspection before continuing");
}
```

`confirmedNineIds` must be copied from the exact approved local `.masayume/acceptance-2026-09-06/x-cleanup-manifest.json`, with nine unique ids and no additions. It is **not** a dynamically fetched “delete all” list. The current manifest and all nine authors were rechecked at 20:49:37 UTC. If a call times out or result recording fails, inspect that particular post before deciding whether any further deletion is needed. Preserve the batch's per-id outcomes. Recheck Posts, Replies and Media with pagination after completion; a count alone is not enough.

For a newly authorized end-to-end test, the provider call to create the original instruction is:

```ts
// MUTATION + TRADE TRIGGER: the configured relay can spend its owner's grant.
// Recheck fresh BTC/4h availability, quota and grant first; do not execute here.
const mentionId = await writer.tweet.post({
  text: "@masayume_app btc up 1 4h",
});
```

This is a proposed 1 tUSDC test instruction, not a recommendation about BTC direction. If it returns no id or an ambiguous error, search the account's new posts before considering another instruction. Do not resend blindly. The existing relay should own receipt creation, media upload and reply posting for this mention.

The exact media/reply method shape is shown for reference, **not as a second posting path while the relay owns the delivery row**:

```ts
const mediaId = await writer.tweet.upload(Uint8Array.from(png).buffer);
const replyId = await writer.tweet.post({
  text: validatedReceiptText,
  replyTo: mentionId,
  media: [{ id: mediaId }],
});
```

Production already invokes these through `rettiwtTransport` and the durable delivery loop. For the live acceptance, observe that loop instead of manually producing a duplicate reply. The validated text must retain the full clickable explorer URL; the card must use the saved sender and matching full hash. Local renderer success is not media delivery evidence.

### Exact read-only verification after the original post

Query the new mention only; do not infer its outcome from the old filled receipt or last-success timestamp:

```ts
const rows = await db.begin("read only", async tx => tx`
  SELECT r.mention_id, r.author_id, r.handle, r.wallet, r.grant_id,
         r.market_id, r.side, r.stake_base, r.status, r.tx_hash, r.details,
         d.state AS delivery_state, d.reply_id, d.media_id, d.reply_text
  FROM x_receipts r
  LEFT JOIN x_reply_delivery d USING (mention_id)
  WHERE r.mention_id = ${mentionId}
`);
const row = rows[0];
const original = await reader.tweet.details(mentionId);
const reply = row?.reply_id
  ? await reader.tweet.details(row.reply_id)
  : undefined;
const mediaMatches = Boolean(reply?.media?.some(m => m.id === row?.media_id));
const authorMatches = reply?.tweetBy.id === "1971264227093643264";
const parentMatches = reply?.replyTo === mentionId;
const hasExpectedLink = Boolean(row?.tx_hash && reply?.entities.urls.some(
  url => url === "https://shannon-explorer.somnia.network/tx/" + row.tx_hash,
));
```

For provider-visible media, inspect `reply.media`: each item exposes `{ id, type, url }` and an optional `thumbnailUrl`. A passing record needs `delivery_state === "sent"`, a nonempty media id and acknowledged reply id, matching author/parent/media, plus the correct expanded transaction URL. Open the real post/media in the browser and inspect its pixels; metadata alone cannot verify the card's sender, numbers or full hash.

If no reply id was saved, use `reader.tweet.replies(mentionId, cursor)` with its returned pagination cursor to inspect the original conversation, or the author's reply timeline. Do not call `post` as a substitute for this read. If `entities.urls` differs because the provider exposes a shortened link, resolve/inspect the actual expanded link and record the result; do not treat that representation difference alone as proof of incorrect delivery.

## Acceptance evidence to collect after the authorized test

1. Original new mention id, author id/handle and exact supported instruction.
2. Saved receipt's owner, grant 4, market, side, requested amount, actual booked cost/quantity when confirmed, and full transaction hash. Confirm that it advances beyond the old cursor without replaying historical posts.
3. Public chain receipt matching that owner/executor/market/grant/side and actual deltas. A mined transaction can still return no fill; use its actual status.
4. Delivery record progressing to `sent`, with a numeric media id and acknowledged reply id; preserve uncertainty if acknowledgement is lost.
5. Open the actual reply and inspect its image: correct saved sender, Window, amounts, status and full transaction hash; text links to the same transaction. No “won” or payout claim for a newly filled position.
6. A fresh health read showing the acknowledged image timestamp. Do not promote idle/healthy polling to delivery success.

Refresh this snapshot before the test; available markets, grant budget, gas and provider state can change. Cleanup confirmation and new-post execution remain with the coordinator. This readiness check is complete without performing either action.
