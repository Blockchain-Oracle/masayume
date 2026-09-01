---
review: adversarial
target: ../ARCHITECTURE-SPINE.md
method: constructed pairs of downstream units (epics/stories) that each obey every AD and convention to the letter yet build incompatibly; every successful pair = a hole, closed with an exact AD tightening
sources-consulted: prd.md (§5 FRs, §11 NFRs, §12), addendum.md (§A–§H)
date: 2026-09-01
verdict: CONDITIONAL — paradigm holds, spine survives; 4 CRITICAL seams and 5 HIGH pins must land before stories are cut. Every hole closes with a bounded AD edit; no restructure required.
---

# Adversarial Review — ARCHITECTURE-SPINE.md (Masayume)

**Attack model.** For each finding: two units one level down, each of which a diligent story-author can build while quoting the spine as authority, and which then do not compose. The permitting text is quoted verbatim. Severity = how certain the collision is × how close it sits to the demo-critical path.

**Severity roll-up:** 4 CRITICAL (F1–F4) · 5 HIGH (F5–F9) · 3 MEDIUM (F10–F12) · 2 MINOR (F13–F14).

---

## F1 — The Daily Stop's enforcement topology is open: session-key tap bets walk around it, and "web ticket API" names a component that cannot exist as written `[CRITICAL]`

**The pair:** *"Daily Stop service story"* vs *"session-key tap-bet story (Reels inline)"*.

**Story A (Daily Stop), letter-compliant.** AD-9: "the Daily Stop lives in Postgres keyed by wallet and is checked by every betting entry point (web ticket API, executor)." Story A builds the Postgres row and puts the check inside the two named entry points: a web server route and the TG executor. Done — the AD's own enumeration is satisfied.

**Story B (tap-bets), letter-compliant.** AD-5: "Session-key tap-trading (FR-4) = a `SESSION` grant to a browser-held ephemeral viem key (IndexedDB)." A browser-held key signs and sends directly to chain via the Submitter running client-side (web imports markets — layer map permits). This path touches no server route. It is neither "web ticket API" nor "executor," so AD-9's list does not bind it. Story B can even cite FR-24's "Vault Runners are bounded separately by their Caps" to classify session bets as cap-governed vault delegation, Stop-exempt.

**The collision.** The rapid-fire, popup-free surface — the single most tilt-prone betting path in the product, the one Ada uses while the Brake watches Maria — is the one path the Stop provably does not cover. AD-9's stated purpose ("a tilting user stopped on web betting on from chat") recurs verbatim: a user stopped on web keeps betting *from the Reels feed with their session key*. Both stories pass review against the letter.

**Second fracture in the same seam.** AD-3 binds "every chain write (web ticket API, ops actors, executor)" and AD-8 says "web never signs with house keys." A "web ticket API" that *places bets* must sign with something — user keys live in the browser wallet, house keys are banned from web. So one story-author reads "web ticket API" as a server bet-placement endpoint (and goes looking for a key that cannot exist); another reads it as a pre-flight check endpoint with client-side signing. Two teams will scaffold two different write topologies from the same noun.

**Permitting text.** AD-9: "checked by every betting entry point (web ticket API, executor)" — a closed list of two, presented as exhaustive. AD-5: "browser-held ephemeral viem key" — a write path that is neither. AD-8: "web never signs with house keys" — makes the plain reading of "web ticket API" unbuildable.

**Tightening (rewrite AD-9's rule):**

> Betting entry points are enumerated and closed: (1) web wallet ticket, (2) Reels inline ticket, (3) Baku act-on-it card, (4) session-key tap bets, (5) TG executor. The Daily-Stop gate is a **named mandatory pre-send step of AD-3's order lane**, so every entry point inherits it by construction. Authority tiers, stated honestly: server-keyed paths (5) hard-refuse; client-keyed paths (1–4) call the same server check endpoint pre-send and refuse in the pipeline — app-layer enforcement over our own surfaces (an adversary bypassing our client is out of scope; our surfaces diverging is not). Strategy-Runner trades are Stop-exempt (Caps govern). **Session-key bets are user-initiated bets — the Stop applies.** The term "web ticket API" is retired: there is no server bet-placement API; orders are client-signed through the Submitter, and the server surface is `POST /api/stop/check` (plus the ops-internal equivalent for the executor).

---

## F2 — AD-1 polices imports, not I/O: the indexer GraphQL endpoint and wagmi's public client are legal parallel chain paths `[CRITICAL]`

**The pair:** *"leaderboard engine story"* vs *"/stats page story"*. (Same hole, second pair: *"wallet-connect story"* vs *"honest-money display story"*.)

**Story A (leaderboard), letter-compliant.** Fetches history through `MarketsProvider`, folds with the core FIFO engine. Exactly as intended.

**Story B (/stats), letter-compliant.** AD-1's rule is: "only `packages/markets` imports `@somnia-chain/markets-sdk` or contract ABIs." A `fetch()` POST to `https://dev.smk.somnia.host/v1/graphql` imports nothing. FR-22 actively invites this reading: "Metrics … are recomputable from chain/indexer queries the page itself names" — the story-author hand-writes GraphQL *because the page must display it*, and queries the indexer directly from a web server route. No AD text is violated.

**The collision.** Two independent scan/dedup/fold implementations of the same chain truth. Win-rate on `/stats` disagrees with the Banzuke row for the same wallet; Tunde screenshots the mismatch; the trust engine manufactures the "it's rigged" moment it exists to kill. This is precisely AD-1's named failure mode — "a second, subtly different tx-build chain" — reborn on the *read* side, through a door AD-1's letter leaves open.

**Second pair through the same door.** The Stack table ships wagmi v2 + RainbowKit, but the layer map's May-import column for web reads "core, markets, db" — wagmi appears in no cell, so web literally cannot build FR-1 as written and every builder learns the column is advisory. Once wagmi is in the tree, `useBalance`/`useReadContract` with viem's *bundled* `erc20Abi` (arguably not a "contract ABI" of the venue — it's a library export) gives every component raw chain reads. The wallet-connect story renders tUSDC balance from a wagmi hook (errors → 0/undefined); the honest-money story renders it from the adapter's AD-6 envelope (stale-not-zero). Two balances on one screen; FR-5's core promise ("never 0, never a spinner that lies") broken by a compliant story.

**Permitting text.** AD-1: "only `packages/markets` **imports** …" — an import rule. Dependency rule: "nothing except `packages/markets` imports the SDK or raw ABIs" — same. Nothing anywhere restricts network I/O, `fetch`, or wagmi's read hooks.

**Tightening (new AD-14 — the I/O boundary):**

> Chain truth is bounded by **I/O, not imports**: no code outside `packages/markets` opens a connection to chain RPCs, the indexer GraphQL endpoint, Multicall3, or the oracle-explorer API. FR-22's named queries are surfaced as *data*: `MarketsProvider` returns each stat together with the provenance query string; the page renders GraphQL, never executes it. wagmi/RainbowKit are added to web's May-import row **scoped to wallet session only** (connect, chain add/switch, `walletClient` handoff to the Submitter); `useBalance` / `useReadContract` / `usePublicClient` are banned in product code — CI grep invariant. Every chain read reaching web is an AD-6 envelope from the adapter.

---

## F3 — SESSION-grant bets spend the Vault, but every balance/sizing surface is contracted to the wallet: compliant stories produce tap-bets that revert on a funded screen `[CRITICAL]`

**The pair:** *"session-key enable flow story"* vs *"Reels inline-ticket story"*.

**Story A (enable flow), letter-compliant.** AD-5: "every delegated power is an EventVault grant … Session-key tap-trading (FR-4) = a `SESSION` grant." FR-4: enabling requires "a capability receipt … and one explicit signature." Story A ships exactly that: one signature creates the grant. No AD requires a deposit at enablement — none exists in the spine.

**Story B (Reels ticket), letter-compliant.** FR-13: inline ticket with "all FR-8/FR-9 guards apply identically." FR-8: "Quick-amount chips scale to the user's actual balance"; FR-5: "Normal bets draw from the **wallet** … The headline 'spendable' number is wallet balance." Story B sizes chips and validates stake against the wallet balance the app headlines.

**The collision.** Ada: wallet 100 tUSDC, Vault 0. She enables tap-trading (one signature — Story A demands nothing more), sees a healthy spendable number and scaled chips (Story B), taps DOWN 10 — and the SESSION-key call spends *EventVault balance*, which is zero. Every tap-bet reverts under a UI showing funds. Both stories obey their text. The PRD saw this exact consequence coming — FR-4: "The fallback changes the funding surface — tap-trading money would live in the Vault, not the wallet; Portfolio/onboarding must present that honestly" — and the spine *adopted the Vault route as primary* (AD-5) without adopting the funding-surface consequence into any AD. The propagation was dropped between documents.

**Permitting text.** AD-5's rule ends at the grant mechanics; nothing in AD-5, AD-2, or the conventions says which pool a session bet debits or which balance a session-mode ticket displays.

**Tightening (append to AD-5):**

> SESSION bets spend **Vault balance** by construction. Therefore: (a) the enable flow composes deposit + grant into one action (FR-29's deposit+subscribe precedent — no orphaned zero-balance grant); (b) while session mode is armed, every ticket and quick-chip sizes against **Vault balance** and labels the source ("betting from your Vault"), per FR-5's labeled-pools rule; (c) a tap that exceeds Vault balance falls back to a normal wallet prompt (FR-4's cap-exceeded fallback, extended to funds-exceeded); (d) session bets are user bets for AD-9 purposes (the Stop applies — see F1), and count toward no Strategy's Caps.

---

## F4 — `daily_stops` has two compliant writers, no atomicity rule, undefined `spent` semantics, and an unstorable reset boundary `[CRITICAL]`

**The pair:** *"web Stop-check endpoint story"* vs *"TG executor story"*.

**Story A, letter-compliant.** The layer map grants web "core, markets, db" — Story A reads *and writes* `daily_stops` through `packages/db` from the web route: read `spent`, compare, allow, then `UPDATE spent = spent + stake`.

**Story B, letter-compliant.** Ops may also import db (layer map: "core, markets, db"). The executor does its own read-compare-write on the same row. AD-8's single-writer rule binds *house keys and chain writes* ("own key, own loop, own local intent journal") — a Postgres row is none of those, so neither story violates it.

**Three collisions, all letter-proof:**
1. **Race.** Both do read-then-write. Limit 100, spent 90; simultaneous 10-stake bets on web and TG both read 90, both pass, spent lands at 110. The one job of a server-authoritative stop — lost to a textbook check-then-act.
2. **Semantics.** PRD glossary calls it "a per-wallet max daily **loss**"; FR-29's cap note establishes the spend-as-loss-bound simplification *for Caps only*. Story A increments `spent` by stake at booking (spend-bound); Story B increments by realized losses at settlement (loss-bound, wins credit back). A user stopped on web keeps betting from chat — AD-9's named failure, achieved through two defensible readings of one word.
3. **Reset.** "resets at midnight in the user's local timezone" (FR-24). The web route knows the browser tz; the executor sees a chat message with no tz. Two services compute two different `resetAt` for one wallet; the row schema (`wallet, limit, spent, resetAt`) stores no timezone, so neither can be corrected.

**Permitting text.** AD-9: "lives in Postgres keyed by wallet and is checked by every betting entry point" — *checked* by many, *written* by unspecified; no mutation owner, no atomicity requirement, no definition of `spent`, no tz storage.

**Tightening (append to AD-9):**

> One writer: the Stop service is a single module living in **ops** (the executor calls it in-process; web reaches it over the existing authed internal-HTTP arrow — no new arrow). Its only mutation is `checkAndReserve(wallet, costBaseUnits)` implemented as one atomic statement (`UPDATE … SET spent = spent + $cost WHERE wallet = $w AND spent + $cost <= limit` — zero rows = refused); read-then-write is a defect. **Semantics pinned:** `spent` = Σ actual booked cost from receipt fills, incremented at booking, never decremented (spend-as-loss-bound, extending FR-29's stated simplification; UI label says "total staked today"). **Reset pinned:** `daily_stops` stores an IANA timezone, captured from the browser at stop configuration (default UTC until configured); midnight is computed server-side from that column — never from the caller's locale. Schema becomes `(wallet, limit, spent, tz, resetAt)`.

---

## F5 — Every non-order chain write is homeless: AD-3's pipeline is order-shaped, so Vault deposits get a second tx path outside the error map `[HIGH]`

**The pair:** *"EventVault web flow story (deposit/withdraw/subscribe)"* vs *"ticket order-flow story"*.

**Story A, letter-compliant.** AD-3's rule: "all writes flow through `Submitter`'s single pipeline: on-chain `status === 1` gate → fresh quote → IOC with `expireTimestampNs` from the headroom formula → send → `assertTxOk` → book from receipt fills." A Vault deposit has no market status, no quote, no IOC, no headroom. Story A reasonably concludes the pipeline governs *orders* — AD-3's Binds line ("web ticket API, ops actors, executor") reads as the order surfaces — and writes the deposit with `walletClient.writeContract` directly from web. Same for: ERC-20 approve, faucet mint, grant create/revoke, parlay open/claim, waitlist join.

**Story B, letter-compliant.** Reads "every chain write" literally and shoves EventVault calls through the order pipeline, implementing the quote/IOC steps as skippable no-ops — a pipeline whose mandatory steps are optional, i.e., no pipeline.

**The collision.** Reading A resurrects the exact disease AD-1/AD-3 exist to cure: a second tx-build path in web, with no intent journal, no `assertTxOk`, and — worst — no AD-13 error map, which is invoked *from the Submitter*. The out-of-STT "invalid parameters" trap that AD-13 names returns on the first deposit, the highest-stakes moment of the delegation story. Reading B produces an unenforceable pipeline. Both quote the spine.

**Permitting text.** AD-3: "all writes flow through `Submitter`'s **single pipeline**" followed immediately by five order-specific steps — the letter forces either exemption or no-op-ing.

**Tightening (rewrite AD-3's rule head):**

> The Submitter has **two lanes**. `submitOrder(…)`: the full canon pipeline as currently written (17-rule canon binding). `submitTx(…)`: journal intent → simulate → send → `assertTxOk` → error-map → book from receipt — for every non-order write: approve, faucet mint, vault deposit/withdraw/subscribe/pause, grant create/revoke, parlay open/claim, waitlist join, redeems. Rule: **no `writeContract`/`sendTransaction` call exists outside `packages/markets`** — CI grep invariant. AD-13's coverage of every write follows by construction.

---

## F6 — "`marketId` is the identity everywhere" is a TypeScript rule; Solidity can't hold a branded type, and the only ambient on-chain handle is the recycled pool `[HIGH]`

**The pair:** *"EventVault/ParlayReserve contract story"* vs *"web portfolio story"*.

**Story A, letter-compliant.** The convention — "`marketId` is the identity everywhere (branded `MarketId` type); never pool address" — names a *branded type*, which cannot exist in Solidity. The contract author reads the convention as TS-scoped, and keys `agentTradeFor` positions and Parlay legs by the handle the venue exposes on-chain — plausibly the pool/book address, since AD-10 requires "ParlayReserve reads leg prices from the on-chain book inside the opening tx," and *the book address is what you read from*. Events emit pool addresses.

**Story B, letter-compliant.** The portfolio story keys everything by `MarketId` (FR-16: "Positions are keyed by `marketId` — a recycled pool never bleeds one window's position into another") and expects Vault/Parlay events to carry it.

**The collision.** Pools are recycled (canon #12). Contract storage keyed by pool address inherits the recycling bug *at the contract layer* — a Vault position from window N is indistinguishable from window N+k in the same pool; the adapter has nothing to map because the disambiguating id was never recorded. FR-30's "auditable event linkable from the subscriber's portfolio" cannot link. This is the spine's #1 named landmine, re-armed inside our own contracts by a compliant reading.

**Permitting text.** Convention: "branded `MarketId` type" — brands are erased at every non-TS boundary; the convention never says what the *on-chain* identity is, and AD-10 points contract authors at the book.

**Tightening (append to AD-10):**

> Contracts store and emit **only the venue's canonical on-chain market identifier** (the id `BinaryMarketsModule`/`OutcomeToken6909` itself keys markets by — pin the exact field in build phase 1's verification pass, candidate: the id underlying `yesId`/`noId`). Pool/book addresses may be *passed* as call arguments where a read requires them (AD-10's in-tx book read) but never persisted in storage or emitted in events. `packages/markets` owns the bijection on-chain id ↔ branded `MarketId`. Named forge test `test_AD10_no_pool_address_in_storage`; event ABI check in the CI invariants script.

---

## F7 — Probabilities aren't "money," so nothing pins their numeric domain: the parlay builder's float preview and the Reserve's integer math are both compliant and disagree `[HIGH]`

**The pair:** *"parlay builder web story"* vs *"ParlayReserve contract story"*.

**Story A, letter-compliant.** AD-2 binds "all money paths"; a probability is not an amount, so the builder previews combined odds in IEEE floats: `raw = p1*p2`, `combined = max(raw, 0.40*min(p))`, `×1.12` margin, then rounds for display. The Fair Value model (addendum §E) is float math — precedent inside core.

**Story B, letter-compliant.** The Reserve computes in bps/fixed-point (`minCombinedProbBps` is already named in bps), with "rounding always favors the Reserve" (FR-33) applied per multiplication, on prices read on-grid from the book in the opening tx.

**The collision.** Float product-then-round ≠ fixed-point round-per-step. The preview quotes stake→payout X; the contract escrows and requires Y; the open tx reverts on a slippage check, or silently escrows a different payout than the slip showed — on the surface whose whole pitch is "your payout is already locked in the contract," and whose pricing FR-33 requires to be "auditable after the fact." Off-by-rounding is unfalsifiable in a demo and deadly in an audit.

**Permitting text.** AD-2: "**Binds:** all money paths … amounts are `bigint` base units" — probabilities escape by not being amounts. No convention row covers the probability/price domain.

**Tightening (new Consistency-Conventions row, "Numbers"):**

> Probabilities and prices cross every module boundary as integers — venue price-grid units where a book is involved, bps elsewhere (combined prob, λ floor, margin: all bps). IEEE floats exist only *inside* `core/fair-value` internals and never serialize. Parlay pricing is **one fixed-point algorithm**: `core/parlay-math` mirrors ParlayReserve op-for-op; a checked-in golden-vector file is asserted by vitest (core) and forge (contract) to produce byte-identical outputs; rounding direction is specified per operation in the vectors — "favors the Reserve" is a test assertion, not a comment.

---

## F8 — The claim protocol between plate and relayer is unwritten: set derivation, validation authority, and partial failure all fork `[HIGH]`

**The pair:** *"claim-all plate story (web)"* vs *"relayer actor story (ops)"*.

**Story A, letter-compliant.** The plate enumerates finalized markets via the adapter (canon #10), computes the claimable sum net of fee (FR-11), collects the user's `signRedeemAuth` signatures — one per market+side, two for voids (canon #11) — and POSTs the batch to ops over the authed internal HTTP (AD-8). It treats the batch as one action: FR-11 says "batches redemption," NFR-7 says sponsor policies are "validated over the **whole batch** (one unlisted call rejects the batch)" — so all-or-nothing is the compliant reading, and the UI renders one success/failure.

**Story B, letter-compliant.** §12: "treat every sponsored or drip endpoint as adversarial." The relayer therefore refuses to burn gas on faith: it re-derives the claimable set from its own chain/indexer read, drops any intent it can't verify (indexer lag — the plate saw Finalized via chain read seconds ago), executes the survivors item-by-item with per-item idempotent journaling (NFR-2), and reads `settlementFeeBps` at execution time (canon #15) rather than trusting the plate's displayed sum.

**The collision.** Same seam, two authorities: the plate's set ≠ the relayer's set under normal indexer lag, so a legitimate claim renders "failed" — the cream-stub "Only you can cash out" moment dying on a race; all-or-nothing UI over per-item execution shows "claimed" while a void's second side silently didn't redeem (money stranded — the exact sharp edge FR-11 exists to absorb); fee read at two different instants makes displayed ≠ paid the moment the venue flips its setting. No AD says who owns the set, what the auth payload binds, or what partial success means.

**Permitting text.** AD-8: "Web calls ops via authenticated internal HTTP" — transport only. AD-3's pipeline is about *placing* orders; FR-11's "batching mechanism per chain support — addendum §H" defers exactly the part the two stories must agree on.

**Tightening (new AD-15 — the claim protocol):**

> The relayer is the **sole execution authority** for sponsored claims. The plate submits per-item claim intents `{marketId, outcomeIdx, minPayoutBaseUnits, redeemAuth}` — the EIP-712 digest binds all fields. The relayer re-validates each intent against its own chain read before spending gas (§12 adversarial rule), executes **per-item, idempotent, journaled** (AD-8), and returns per-item results; the plate renders per-item outcomes and never collapses them into one verdict. Voids are two intents, linked by the plate, rendered as one row with two states. The claimable enumeration and the net-of-fee sum come from **one core function** (`core/claims`) called by both plate (display) and relayer (validation); `settlementFeeBps` is read at execution time, never cached at adapter init. NFR-7's whole-batch allowlist check applies to the *sponsorship policy* (function allowlist), not to execution atomicity.

---

## F9 — `maxDailySpend` has two clocks: the contract can't do "midnight user-local," and nothing says what it does instead `[HIGH]`

**The pair:** *"EventVault contract story"* vs *"TG executor story"*.

**Story A, letter-compliant.** AD-5 gives each grant "independent Caps" including max daily spend; enforcement is in-contract (FR-29: "a delegate tx exceeding any cap reverts"). A contract has no user timezone, so Story A picks `block.timestamp / 86400` UTC-day buckets — or a rolling 24h window; both defensible, neither specified.

**Story B, letter-compliant.** The executor pre-checks cap headroom before submitting (to refuse "naming the specific cap" per FR-37, instead of eating a revert), and — pattern-matching AD-9's stop, the only daily reset the spine defines — mirrors the cap with a midnight-user-local reset.

**The collision.** The executor's headroom math and the contract's diverge for hours around every boundary: the bot refuses bets the contract would allow (demo-visible dead rail), or submits bets the contract reverts (raw revert where FR-37 promised a named cap). And user copy conflates two resets that are genuinely different things.

**Permitting text.** AD-5: "each with independent Caps, expiry" — no day semantics anywhere; AD-9 defines a reset for the Stop only, sitting right next door as the obvious (wrong) template.

**Tightening (append to AD-5):**

> Cap clock pinned: `maxDailySpend` buckets by **UTC day** (`block.timestamp / 86400`) — chosen over rolling-24h for gas and auditability. Delegates (executor, runners) pre-check headroom only via one shared `core/caps.simulate()` that mirrors the contract op-for-op, golden-cross-tested against forge vectors (F7's mechanism). Copy rule: cap resets say "00:00 UTC," the Daily Stop says "midnight your time" — the two are never merged in UI or bot text.

---

## F10 — Ledger assembly is unowned: window-scoped queries vs full-history folds make portfolio and Banzuke disagree for the same wallet `[MEDIUM]`

**The pair:** *"portfolio/Edge story"* vs *"Banzuke engine story"*.

**Story A, letter-compliant.** FR-20: "computed client-side from on-chain history." The client fetches the user's events through the adapter, scoping queries `{from, to}` per canon #17 — a *query-level* window filter, which drops pre-window mints.

**Story B, letter-compliant.** FR-26: "window filtering applies to close time while prior mints still supply cost basis" — the server route fetches *full* history and filters inside the fold.

**The collision.** Same wallet, same core FIFO engine, different feeds: Story A's window-scoped feed loses cost bases → "unmatched redemptions … counted and disclosed" (FR-26) fires on rows Story B matches fine. Your own portfolio net ≠ your Banzuke row, on the product whose thesis is un-fakeable numbers. The conventions pin the *fold* in core ("Core engines: vitest golden tests (FIFO incl. loss-synthesis…)") but nobody owns feed assembly.

**Permitting text.** AD-1 makes the adapter the *door* to reads but says nothing about who composes history queries; canon #17's "always scope `{from…to}`" actively pushes Story A's reading.

**Tightening (append to AD-1's rule):**

> `MarketsProvider.getLedger(wallet)` is the **only** history feed: complete, deduplicated, oldest-first (the adapter owns canon #10/#17 scoping mechanics internally, per-market, and reassembles the full ledger). All window filtering happens inside the `core/pnl` fold (close-time filter, prior mints as basis, per FR-26). No surface composes its own history query; portfolio, Edge, Banzuke, and `/stats` consume the same fold output type.

---

## F11 — "Milliseconds everywhere" meets contracts that live in seconds: a compliant caller turns the Reserve's future-expiry gate into a no-op `[MEDIUM]`

**The pair:** *"parlay builder story"* vs *"ParlayReserve contract story"*.

**Story A, letter-compliant.** Convention: "Milliseconds everywhere; nanoseconds exist only inside `Submitter`." Leg expiries flow through domain types as ms and into the open-parlay call as ms — the convention's letter says nothing about a third domain.

**Story B, letter-compliant.** Solidity checks `require(leg.expirySec > block.timestamp)` (FR-33: "Every leg must be on a future expiry at open").

**The collision.** A ms value in a seconds comparison is ~55,000 years in the future — the gate passes *everything*, including legs whose outcome is already determined. It type-checks (`uint256`), reverts nothing, and silently breaks the one economic-safety invariant of the parlay design. The convention already proves it knows multiple time domains exist (it carved out ns for the Submitter) — it just forgot the one contracts use.

**Tightening (rewrite the Time convention row):**

> Three time domains, converted only at `packages/markets`: **ms** off-chain, **ns** only inside `Submitter`, **seconds** on-chain (`block.timestamp` domain). Every time-valued field, variable, and ABI parameter carries its suffix (`settledAtMs`, `expirySec`, `expireTimestampNs`) — including Solidity names. CI grep invariant: no unsuffixed time-shaped name in shared types or contract ABIs.

---

## F12 — AD-7's degradation list covers three of five stores: runner health under zero-env is either a lie or a crash, and both are compliant `[MEDIUM]`

**The pair:** *"strategy-card story"* vs *"zero-env quickstart story"*.

**Story A, letter-compliant.** FR-32: "alive means `now − lastTick < max(180s, 3×interval)`, computed at render" — the card reads `runner_heartbeats` (layer map: web may import db) and re-derives.

**Story B, letter-compliant.** AD-7's zero-env law: "every store is optional at runtime — absence degrades exactly as EXPERIENCE.md states (memory-less Baku, empty takes, client-local Daily Stop with honest scope label)" — an enumeration of three degradations for a five-store schema (`tg_links` and `runner_heartbeats` are unlisted). The judge's zero-DB run ships no heartbeat rows.

**The collision.** With no rows, Story A's re-derivation yields "dead" for a live Runner (`lastTick` undefined → stale) — the judge's zero-env run shows the flagship agents-first surface as a graveyard — or the story throws, or it hides health and violates FR-32's "a dead Runner must read as dead immediately." All three are compliant because the degradation for this store was never specified. Same gap for `tg_links` (rail behavior with no link table: silent bot? crash? honest refusal?).

**Tightening (append to AD-7):**

> The degradation table is **exhaustive over the schema** — a table added without a degradation row is a defect. Pins: `takes` → empty feed; `baku_memory` → memory-less Reads; `daily_stops` → client-local with honest scope label; `tg_links` → linking refused with an honest bot reply ("this deployment has no link store"), rail visibly disabled; `runner_heartbeats` → **health is served live from ops over the existing authed internal HTTP** (the DB row is durability, not the source — this also fixes FR-32's render-time read under normal operation), and when ops itself is unreachable the card says "status unknown — ops offline," never "alive," never blank.

---

## Minor pins

**F13 — Envelope composition.** The conventions list "Result envelopes `{ ok, value | error }`" and "reads as `{ value, asOf, stale }`" side-by-side with no composition rule; AD-6's "a failed refresh keeps `value` and flips `stale`" is undefined on *first* failure (no value to keep). Two adapters ship `Result<Envelope<T>>` vs `Envelope<Result<T>>` with different first-failure shapes. **Pin one type in `core/schemas`:** `Reading<T> = { ok: true, value, asOf, stale } | { ok: false, error }` — first failure is the error arm; refresh failure keeps `ok: true` and flips `stale`.

**F14 — One writer per table.** F4 fixed `daily_stops`; the principle generalizes. **New conventions row:** every DB table names its single writing service in the schema file — `takes` → web, `baku_memory` → web, `daily_stops` → Stop service (ops), `tg_links` → ops (bot link flow; web participates via the internal HTTP arrow), `runner_heartbeats` → ops. All other services are read-only on that table; a second writer is a defect.

---

## Attacks that did NOT break the spine (checked and held)

- **AD-4 role registry vs actor sprawl** — one-writer-per-key plus the checked-in registry closes the nonce/self-match pairs I constructed.
- **AD-11 attribution hook** — a no-op hook in the single pipeline is genuinely retrofit-proof; no compliant divergent pair exists.
- **AD-6 vs FR-20 client-side compute** — client folds through the port with TanStack islands compose cleanly once F10's `getLedger` pin lands.
- **Venue-id churn** — addendum §A's read-off-a-live-row rule lives inside the adapter; AD-1 contains it.
- **AD-2 decimals for contracts** — caps and balances are raw base-unit `uint256` on-chain; no decimals read needed there; the adapter boundary holds.
- **Relayer vs claim-sweeper key overlap** — AD-4 + AD-8 give each its own key and journal; the collision I tried (double-redeem) dies on redeem idempotency at the venue.

## Verdict

**CONDITIONAL.** The paradigm — one port, pure core, single-writer actors, typed grants — is the right spine, and most classic seam attacks bounce off it. But four seams let fully compliant stories build a product that contradicts itself on its own demo-critical path: the Daily Stop is bypassable by the spine's own session-key design (F1), chain truth has legal side doors around the one port (F2), tap-trading spends a pool no surface displays (F3), and the Stop's row has two writers and no semantics (F4). All fourteen holes close with the bounded AD edits above — one new AD (I/O boundary), one new AD (claim protocol), two rewritten rules (AD-3 lanes, AD-9 topology), five appends, three convention rows. No structural change is needed. Land F1–F9 before cutting epics; F10–F14 can land with the first story that touches each seam.
