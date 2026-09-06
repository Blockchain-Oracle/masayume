# DreamDEX SDK and documentation feedback

Draft prepared 6 September 2026 for Masayume, using `@somnia-chain/markets-sdk` **0.28.1** on Somnia Shannon (chain **50312**). This report has not been submitted. It describes our integration and identifies suggestions; it does not claim that every suggestion is a reproduced upstream defect.

The required submission artifacts in the [organizer brief retained in this repository](../../context/00-hackathon-brief.md#submission-each-team) are a working testnet prototype, a GitHub repository and a 2–3 minute demo video. This SDK/documentation report and a presentation deck are optional. Preparing this report does not complete those required artifacts or establish live acceptance.

## What the SDK enabled

Masayume uses the SDK for market discovery, on-chain market and book reads, opening-price and history context, underlying price feeds, quote sizing and trading. A shared read runtime supplies the web and operator services. Dedicated signing sessions keep wallet, strategy-runner and X-executor authority separate. Our EventVault, StrategyRegistry and game contracts add product permissions and accounting around Event Contracts.

The pure `quoteBinaryStakeOverBook` and `quoteBinaryOrderOverBook` functions are especially useful for a stake-first interface: they let the same adapter distinguish requested stake, lot-aligned quantity, expected cost and protective escrow without converting trading units through floating-point math. See [quote adapter](../../packages/markets/src/provider/quotes.ts) and [quote mapping](../../packages/markets/src/mappers/quote.ts).

## 1. Make receipt and fill semantics prominent at each API tier

Our trader-tier integration checks `result.receipt.status` explicitly before treating a write as confirmed. Even a successful IOC transaction can book no position. Consumer copy therefore distinguishes **submitted**, **filled**, **no fill**, **reverted** and **unknown**, and it keeps requested stake separate from actual booked cost.

Suggested documentation: a short side-by-side example for unified and trader-tier writes, showing where the hash and receipt live, how reverts are surfaced, and how to establish an actual fill. Include a successful transaction with zero fill and a partial deployment of the requested budget. This would help teams avoid a green transaction check becoming an inaccurate “trade succeeded” or “won” message.

Evidence: [receipt status guard](../../packages/markets/src/submitter/steps/assert-tx-ok.ts), [X receipt outcome](../../services/ops/src/actors/x-relay/receipt-outcome.ts), [receipt formatter](../../services/ops/src/actors/x-relay/reply-format.ts). These show the handling our application needs; they are not a fresh conformance test of every SDK write method.

## 2. Document the boundary between live discovery and safe execution reads

Our app uses indexed discovery and history for browsing, then reads current chain state and an executable book before a send. Our own `Reading` envelope can retain last-good data with `stale: true` after a read fails. The runner and X executor now reject stale input for execution, consent and risk checks rather than interpreting cached data as current authority.

Suggested documentation: one complete “browse, quote, then execute” example that names each source, its freshness requirement and its failure behavior. A stale indexed market list should be distinguishable from no live markets; an unreadable settlement record should be distinguishable from no realized losses. Source/freshness metadata on reads would make this easier to convey consistently.

Evidence: [provider reading wrapper](../../packages/markets/src/provider/reading.ts), [fresh quote adapter](../../packages/markets/src/provider/quotes.ts), [strategy execution gates](../../services/ops/src/actors/strategy-runner/execute.ts), [X execution gates](../../services/ops/src/actors/x-relay/execute.ts). The stale-data bug was in Masayume's use of its own wrapper, not an established SDK defect. A temporary indexer outage also does not by itself identify an SDK bug.

## 3. Provide a transport and signer lifecycle recipe

Our read runtime owns a shared SDK client and WebSocket subscriptions. Each signing session creates a separate SDK instance with one immutable signing identity, a serialized nonce queue and an HTTP public client for our contracts. We explicitly dispose a signing session when its authority ends. This avoids coupling a user's in-flight write to an operator actor or a mutable shared signer.

Suggested documentation: show an application with one shared reader and several independent writers, including which endpoint `getViemClient()` uses, what happens when WebSocket configuration is absent, how a custom HTTP endpoint is supplied, and how to release subscriptions and client resources. A fork example using explicit local read and write endpoints would be useful alongside the browser-wallet example.

Evidence: [read runtime](../../packages/markets/src/runtime/read-runtime.ts), [submitter session](../../packages/markets/src/sessions/submitter-session.ts), [nonce queue](../../packages/markets/src/sessions/nonce-queue.ts).

## 4. Add a restart-safe bot example that preserves uncertainty

The shared SDK signing and quote primitives are useful, but durable execution ownership remains application work. Masayume now records strategy execution reservations before a send and persists the X intent and hash as broadcast progresses. Recovery validates the transaction sender, target contract and exact execution event. A missing hash is matched only with the saved nonce and instruction facts. Missing evidence remains unknown and is never permission to replay.

Suggested documentation: a minimal bot with a durable intent id, a hash checkpoint before receipt waiting, process-restart reconciliation and an explicit no-resend state when broadcast acknowledgement is lost. Include two separate failure cases: the order landed but its receipt was not saved, and an external notification was posted but its acknowledgement was lost. Notification retry must never execute another trade.

Evidence: [strategy lifecycle](../../services/ops/src/actors/strategy-runner/lifecycle.ts), [X execution journal](../../services/ops/src/actors/x-relay/execution-journal.ts), [exact EventVault recovery](../../packages/markets/src/vault/recovery.ts), [X reply delivery](../../services/ops/src/actors/x-relay/reply-delivery.ts). EventVault is our contract; this is a request for a reference integration pattern, not a claim that the SDK should understand Masayume's custom events.

## 5. Include receipt timing and gas troubleshooting examples

Our earlier fork verification recorded an instantly mined transaction whose receipt wait through the shared SDK client did not finish during the 90-second wait. Our contract adapter now polls `getTransactionReceipt` directly and preserves a known hash when waiting fails. This is dated fork evidence, not a newly reproduced Shannon or current SDK-wide issue. A troubleshooting recipe that separates “receipt exists,” “new-head subscription is alive,” and “receipt waiter is still pending” would help isolate the transport involved.

Evidence: [dated fork verification](../../context/41-eventvault-fork-verification-2026-09-02.md), [receipt polling adapter](../../packages/markets/src/vault/write.ts).

During the 6 September release rehearsal, our StrategyRegistry publication also exposed a separate **Masayume integration defect**: we reused a fixed 4,000,000-gas envelope for a variable-size metadata write. The transaction consumed that full allowance and reverted; the release coordinator's read-only estimate for the same call was `0x51e49c` (5,366,940 gas), while `eth_call` succeeded. The inspected fix estimates the exact registry call, adds 20% headroom and checks the corresponding gas balance before sending. Its live retry belongs in the release acceptance record.

Public failed-transaction evidence: [Shannon publication receipt](https://shannon-explorer.somnia.network/tx/0x00dd839e37a0a4eeae44810c52950422cf936e9048f75b7bca25abd888bbe222). Implementation: [registry writer](../../packages/markets/src/strategies/write.ts). This failure is not attributed to the DreamDEX SDK. A successful simulation without a sufficient transaction gas limit is a useful integration troubleshooting example.

## Evidence to attach before submission

The final report should name the committed application revision and the demo's actual public transaction receipts. Keep source/unit checks, isolated database tests, local rendered image checks and live provider acceptance separate. A generated receipt card does not establish media upload to X; a published strategy does not establish a funded copy, model decision, fill or settlement.

No keys, session cookies, authorization headers, private recovery material or provider credentials belong in this report. Public addresses and transaction hashes are sufficient for the chain examples above.
