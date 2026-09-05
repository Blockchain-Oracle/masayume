# X reply audit — 5 September 2026

> Historical baseline at commit `5b1d6ff`, before the approved receipt implementation. See [release evidence](receipt-release-2026-09-05.md) for changes, validation and remaining limits.

The bot currently replies with **plain text only**. A `filled` reply means a confirmed trade produced a nonzero token receipt, not that the prediction won. The installed X library supports media uploads, but Masayume has not connected that capability to its reply transport.

Source reviewed: `5b1d6ffdca3be94a2c5f62f79184ce4b9d4f1f1d`. This audit read source and exercised the pure formatter with synthetic inputs. No X account, private user records or environment values were read; no upload, post, transaction or runtime change was made. Banner approval is separate from implementing or publishing automated replies.

The parent separately inspected the public X profile, but could not verify the Replies tab because browser actions failed. The strings below are therefore source-proven formatter outputs, not verified live posts.

## Current path

1. **Identity and permission.** Web OAuth 1.0a establishes an X identity; wallet binding requires a fresh wallet signature and refuses an account already bound to another wallet. This user identity flow is separate from the bot’s posting session. Evidence: `web/src/app/api/x/callback/route.ts:10-14,32-53`; `web/src/app/api/x/bind/route.ts:19-36`.
2. **Poll mentions.** Ops starts the relay from `services/ops/src/main.ts:23`. Rettiwt searches for mentions of the configured handle, reads one page of 20, filters ids beyond the stored cursor and sorts oldest first. Default polling is 20 seconds; first startup establishes a cursor without executing historical mentions. Evidence: `services/ops/src/actors/x-relay/rettiwt.ts:4-28`; `env.ts:23,27-47`; `index.ts:50-60`.
3. **Execute.** A mention is linked by its X author id, parsed deterministically, checked against the wallet’s EXECUTOR grant, matched to the soonest eligible Trading Window, quoted, then submitted through the vault-grant order lane. The current grammar supports BTC/ETH, UP/DOWN, stake and cadence; it refuses leverage extras. Evidence: `services/ops/src/actors/x-relay/execute.ts:37-109`; `packages/core/src/x/parse.ts:40-111`.
4. **Persist and reply.** Before those checks, the relay inserts a `submitted` placeholder. It replaces that row with the final receipt, optionally formats and posts a reply, then advances the cursor. `X_POSTING_ENABLED` controls replies only: disabling it does not disable trading. Evidence: `services/ops/src/actors/x-relay/index.ts:39-43,63-78`; `env.ts:45`.
5. **Display in the app.** `/api/x/receipts?wallet=…` reads stored rows; the browser polls every 15 seconds. The receipt list displays status, original instruction, requested amount and an explorer link when a transaction hash exists. Evidence: `web/src/app/api/x/receipts/route.ts:8-16`; `web/src/features/x/useXReceipts.ts:6-19`; `web/src/features/x/XReceiptsList.tsx:16-31`.

## What the status words establish

| Status | Actual condition | Appropriate interpretation |
| --- | --- | --- |
| `submitted` | The relay has inserted a placeholder **before** link, parser, grant and quote checks | Instruction received / being checked; this does not prove broadcast |
| `filled` | `OrderOutcome.confirmed` with a booked fill; the vault receipt succeeded and its matching `Executed` event has nonzero `tokenDelta` | A trade filled, potentially for less than the requested amount; outcome still pending |
| `nothing-filled` | Transaction receipt succeeded but no nonzero matching vault fill was booked | No position was booked; transaction success alone is not a fill |
| `refused` | Preflight refusal, requote, or a non-timeout write failure classified as refused | Not placed according to the lane’s diagnosis; avoid publishing raw diagnostic internals |
| `reverted` | Receipt explicitly reports on-chain failure | The trade reverted; “nothing was taken” refers to trade funds, not a promise that no gas was spent |
| `unknown` | A timeout was detected during the vault write path | Send/confirmation state is uncertain; do not assert a fill or encourage immediate resubmission |

Evidence: `services/ops/src/actors/x-relay/execute.ts:50-64`; `packages/markets/src/submitter/order-lane.ts:68-70`; `packages/markets/src/vault/order.ts:85-99,132-156`; `packages/markets/src/vault/write.ts:40-59,88-106,223-238`.

There is no `success`, `won`, `settled` or `paid` state in the X receipt model (`packages/core/src/x/receipt.ts:4-21`). The low-level receipt word `success` means successful EVM execution. A separate settlement/result check is needed before a card can show winnings, profit or a completed prediction.

## Exact current reply samples

These are synthetic outputs from the current `replyText()` using 5 tUSDC requested, UP and a fake 66-character hash. The repeated `a` hash is not a real transaction. Character counts below are JavaScript string lengths, which is what the installed library uses for its endpoint switch.

```text
Filled: UP, 5.00 staked. Your receipt is on the app's Trade-from-X page · tx 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

Nothing filled: the book moved before the order landed; nothing was taken. Nothing was taken.

The order reverted on-chain; nothing was taken. tx 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

Sent, but the chain has not answered yet. We will reconcile it on the app's Trade-from-X page.

Submitted — waiting for the chain.

Not placed: say up or down.
```

The six replies are respectively **143, 93, 117, 94, 34 and 27** characters. Each actual reply is one line; the blank lines above separate examples. Evidence: `services/ops/src/actors/x-relay/execute.ts:117-136`.

The `submitted` formatter branch exists, but the normal loop posts only after `executeMention()` returns its final receipt. It does not send a separate acknowledgement when inserting the placeholder.

## Problems to resolve before automated reply cards

- **Requested stake is presented as booked spend.** `execute.ts:81` stores the instruction’s stake; `outcomeToReceipt()` retains only status/reason/hash and discards `booked.costBase`, quantity and average price. Yet `replyText()` calls it “staked.” A partial fill or cheaper execution can make that amount misleading. The authoritative booked fields already exist in `packages/core/src/ports/submitter.ts:37-44` and come from vault event deltas (`packages/markets/src/vault/order.ts:86-98`). The receipt schema has no columns for them (`packages/db/src/x.ts:15-28,138-152`).
- **Precision and context are lost.** `formatBaseUnits()` defaults to two decimal places and truncates (`packages/core/src/units/format.ts:16-29`). A synthetic one-base-unit tUSDC request formats as `0.00 staked`. Replies omit token symbol, asset, cadence and actual expiry. The stored timestamp is the mention’s creation time, not execution time (`execute.ts:32`), and must not be labelled “filled at.”
- **“Sent” and promised reconciliation overstate the unknown path.** `writeVault()` simulates, submits and awaits a receipt inside one call; only after it returns does the order lane record the hash. A timeout can occur before a hash is returned, or after broadcast while waiting. Both become `unknown`, and the failure result drops the hash. The relay uses a process-local memory journal (`index.ts:39`; `journal-memory.ts:4-16`). No X receipt reconciliation caller was found. Generic recovery exists, but its actual callers are browser recovery components, not the X worker; the receipts API only reads the database. The current “We will reconcile” promise is therefore unsupported by the traced X path.
- **A placeholder can remain stuck.** Existing mention rows are skipped regardless of status (`index.ts:64`). If execution throws or the process stops after the initial insert, the `submitted` row can survive without execution recovery. Its initial wallet is null, so it is also absent from a wallet-filtered receipt feed. The deduplication lookup and insert are separate operations, not an atomic work claim across worker instances.
- **Reply delivery is not recorded.** Reply exceptions are logged and the cursor still advances; a `null` reply id is ignored. No posted tweet id, media id, delivery state or retry outbox is persisted. A confirmed trade can consequently have no reply, and restarting does not repair that reply (`index.ts:64-75`; `rettiwt.ts:30-32`; `packages/db/src/x.ts:15-28`).
- **Unbounded diagnostics can change the posting endpoint.** Reasons are interpolated without a length limit or sanitization. Installed Rettiwt switches to its long-form endpoint when `text.length > 280` (`TweetService.ts:382-394`), described there as Premium-only. A synthetic 300-character diagnostic produced a 325-character reply and would take that branch. No claim is made here about this account’s entitlement or live posting success.
- **Newlines and links need deliberate formatting.** Normal templates contain no line breaks. Actual line feeds in a diagnostic remain line feeds; the library copies text directly, so there is no normal-path double-escaping bug to fix. Literal backslash-plus-`n` characters would remain literal if supplied. `NewTweet` copies `text` unchanged (`models/args/PostArgs.ts:131-136`), then the request passes it as `tweet_text` (`requests/Tweet.ts:294-308`). One synthetic multiline diagnostic preserved one line feed. The nothing-filled reply also repeats “nothing was taken.”

The no-link comment in `execute.ts:122-123` is a developer rationale, not evidence of an X rule or guaranteed account protection. Filled/reverted replies include a full hash with no explorer URL. Unknown/nothing-filled replies omit their hashes. Some refusal text contains the bare app domain or a relative `/trade-from-x` path (`execute.ts:76,87,89`), so the “never a link” comment is not even uniform across statuses.

The app does build a clickable `${EXPLORER_URL}/tx/${hash}` link (`XReceiptsList.tsx:22-27`); `EXPLORER_URL` comes from the installed Shannon chain (`packages/markets/src/chain.ts:8`). There is no mention-specific public receipt URL in the current reply, only a direction to the general Trade-from-X page.

## Media capability: present in the dependency, absent from the relay

The installed dependency is **rettiwt-api 7.1.3** (`services/ops/package.json:30`). The following dependency paths are relative to `services/ops/node_modules/rettiwt-api/src/`:

| Capability | Installed implementation |
| --- | --- |
| Upload a local file or ArrayBuffer and obtain a media id | `services/public/TweetService.ts:910-925` |
| Initialize, append and finalize upload | `requests/Media.ts:16-65`; calls the X upload service |
| Attach uploaded media while replying | `types/args/PostArgs.ts:170-185` accepts both `media` and `replyTo`; `requests/Tweet.ts:304-308` serializes both |
| Media item data | `types/args/PostArgs.ts:205-215` contains id and tagged users; no alt-text field in this interface |

Masayume’s `XTransport.reply` currently accepts only `(mentionId, text)` (`services/ops/src/actors/x-relay/transport.ts:18-24`) and calls `tweet.post({ text, replyTo })`. No application upload call, card renderer, media metadata, alt-text attachment or upload fallback was found. `ClaimReceiptCard.tsx` is an on-screen UI component, not a server-rendered reply image or an X upload integration.

That UI card’s `CLAIMED` state means the connected wallet matches the X binding (`web/src/features/x/ClaimScreen.tsx:49-55,135`; `ClaimReceiptCard.tsx:20`; `copy.ts:150`). It is not a confirmed payout event, so its badge should not become a transaction-success reply unchanged.

This is static capability evidence, not a successful upload test. The installed upload helper performs one append and finalize; it does not establish a production video-processing workflow or current file-size/format/account limits. Those need separate verification before choosing video replies.

## Recommended implementation sequence — proposals only

1. **Fix receipt truth first.** Preserve requested stake separately from actual booked cost, quantity and average price. Persist resolved asset, cadence, expiry and execution time. Keep trade, settlement and reply-delivery states separate.
2. **Make unknown recoverable.** Persist a transaction hash immediately after broadcast, retain durable intent/work state, and reconcile unresolved X receipts before retrying. Use “Status needs checking” when broadcast is uncertain. Reserve “Confirmation pending” for a known submitted transaction; only promise reconciliation once that worker exists.
3. **Define state-specific cards.** The proposed “Order filled” headline and “The market result comes later” subtitle accurately distinguish execution from outcome. Add actual spend and the specific Window only from validated receipt data. No-fill, refusal, revert and pending need distinct layouts. A win/payout card needs later settlement evidence. Keep the prototype labelled DEMO; the approved header direction does not authorize deployment of reply changes.
4. **Build a deterministic reply payload.** Use a short status sentence, deliberate real newlines and one inspectable receipt/explorer link. Budget the final text, keep raw diagnostics in internal logs, and retain a clear text-only version. Show the testnet and collateral context.
5. **Add media behind that payload.** Render cards deterministically from validated receipt fields; do not use AI to invent or rewrite transaction data. Upload the card, attach the returned id alongside `replyTo`, and handle accessibility metadata through a verified interface. A media failure should fall back to an accurate text reply without replaying the trade.
6. **Record delivery independently.** Store reply id, media id, attempts and last failure. Use atomic work ownership and an outbox so a crash or posting failure does not lose the reply or duplicate financial execution.

## Existing verification and missing coverage

- `packages/core/src/x/parse.test.ts:16-44` has five parser cases covering canonical grammar, synonyms/order, ambiguity, unsupported/missing fields and excessive decimal precision.
- `packages/markets/src/submitter/recovery.test.ts:30-51` checks generic journal recovery with a stub reconciler. It does not exercise X receipt updates or live chain recovery.
- The current source search found no dedicated tests for `replyText`, `executeMention`, the Rettiwt transport, X delivery persistence, partial-fill reply amounts or media upload. No direct `bookVaultFill` / vault-order write-lane test was found in the searched TypeScript tests.
- This audit ran synthetic formatter probes only: all status samples above, tiny amount truncation, a long diagnostic and a real newline. It did not run the full test suite or any live X integration.

Before implementation is accepted, focused tests should cover partial fills versus requested stake, success-with-zero-fill, timeout before/after hash, restart from a placeholder, reconciliation updates, missing reply ids, upload failure/text fallback, final text length/newlines and duplicate delivery prevention.
