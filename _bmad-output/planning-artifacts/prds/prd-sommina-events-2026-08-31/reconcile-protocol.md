# Reconciliation: PRD + Addendum vs Protocol Sources (01, 03, 05)

**Input:** `context/01-dreamdex-event-contracts.md` (EC protocol & dev model), `context/03-dreamdex-bot-kit-strategies-and-tools.md` (strategies, tooling, test report), `context/05-somnia-network-and-ecosystem.md` (chain, faucets, AA, reactivity, ecosystem) — reconciled against `prd.md` + `addendum.md`. Date: 2026-09-01.

**Scope note:** claims sourced from docs 02/04 (markets-sdk API, spot HTTP/WS) are outside this pass; where the PRD asserts something my sources explicitly flag as *unverified*, that is called out for cross-check with the `markets-sdk` / `yosuku-api` reconcile passes. Deliberate, reasoned out-of-scope cuts (PRD §9/§10.2, addendum §G) are respected and not re-litigated.

Severity: **HIGH** = will produce a wrong number, a broken demo, or stranded funds if unaddressed. **MED** = will bite during build/ops; cheap to fix now. **LOW** = hygiene/completeness.

---

## 1. Factual errors and unverified assertions (priority a)

### 1.1 HIGH — "A winning position pays 1 tUSDC per contract" stated unconditionally; settlement fee dropped everywhere
- **PRD:** Glossary *Claim* ("a winning position pays 1 tUSDC per contract only when redeemed"), Glossary *Market/Settlement*, UJ-1, FR-11 ("the number shown equals the on-chain claimable sum").
- **Source:** 01 §1 — zero fees is a *venue setting*, not protocol: "Winners redeem 1:1 today — **but read the fee from chain, don't assume** (see `ec-core/settlement.ts`)." 03 §3.5 states it harder: "winner redeems for `1 − settlement fee` (**NOT 1:1**)"; ec-core ships `settlementFeeBps` (indexer → chain fallback, recycled-pool-safe) and `estimatePayout` precisely for this.
- **Gap:** No FR consequence, no NFR, and no gotcha-canon entry (addendum §D has 14 items + one rider; fee-from-chain is absent). Every payout figure in the product (ticket max payout, claim plate, PnL, parlay leg payoff, `/stats` "claims paid") should derive from `settlementFeeBps`, currently 0. One venue config change silently makes every displayed payout wrong.
- **Fix:** add canon item; glossary wording "pays 1 tUSDC per contract *less the on-chain settlement fee (currently 0)*"; payout math via `estimatePayout`/`settlementFeeBps`.

### 1.2 HIGH — EIP-7702 offered as a testnet session-key/batching option, but sources only verify it on **mainnet**; 4337 infra is only listed for **testnet** — nobody draws the chain-match conclusion
- **PRD:** Open Question 5 lists "7702 batching" among session-key mechanisms; FR-11 "batches redemption" implies some batching rail. **Addendum §H** correctly says "EIP-7702 type-4 accepted **on mainnet** (bot-kit batch-7702 verified)" — but v1 is testnet-only (PRD §3.2, §9), so the one place 7702 is verified is the one chain v1 doesn't ship on.
- **Source:** 05 §3 — 7702 "Somnia accepts **on mainnet today** (verified live by the bot kit's batch demo)"; the network-info table (05 §1) lists ERC-4337 EntryPoint v0.7 `0x0000000071727De22E5E9d8BAf0edAc6f37da032` + account factory `0x4be0…dceb` **for testnet only** (mainnet: "—").
- **Gap:** 7702 availability on Shannon testnet is unverified in the entire knowledge base. If FR-4 (session keys) or FR-11 (batched claim-all) leans on 7702, it may simply not exist on the v1 chain. Conversely, the 4337 EntryPoint that *is* on testnet is never connected to FR-3/FR-4 design options.
- **Fix:** amend Open Question 5: "verify 7702 support on chain 50312 first; 4337 EntryPoint v0.7 is confirmed deployed on testnet." FR-11 "batches redemption" needs a mechanism note (7702-if-testnet / 4337 / sequential txs / relayer loop).

### 1.3 MED — `exchange.setSigner({ walletClient })` asserted as a locked decision; source 01 explicitly flags browser-wallet signing as **unverified**
- **Addendum §A** (Wallet row): "`useWalletClient` → `exchange.setSigner({ walletClient })`" stated as settled plumbing.
- **Source:** 01 §7 — "Browser-wallet signing **needs checking in the SDK** (see `02-markets-sdk-api.md`); worst case we build order calldata via exported ABIs + viem/wagmi." Neither `setSigner` nor any walletClient-signing API appears in 01's SDK surface enumeration.
- **Gap:** the entire user write path hangs on this one API. If doc 02 verifies it, fine — but the addendum dropped the caveat and the ABI-fallback plan. **Cross-check with the markets-sdk reconcile pass**; if unverified there, this belongs in Open Questions, and the ABI+viem fallback (01 names the exported ABIs: `binaryModuleWriteAbi` etc.) should be recorded as the contingency.

### 1.4 MED — `signRedeemAuth`/`redeemFor` "built-in gasless claims" (basis of FR-3) appears in **none** of docs 01/03/05
- **Addendum §H:** "Gasless options: `signRedeemAuth`/`redeemFor` (built-in gasless claims) … `build*` verbs return unsigned calls for AA."
- **Source:** 01 §4 enumerates the trader tier (`placeOrder`, `cancelOrder`, `redeem`, `faucet`, mint/merge) — no auth-signature or `redeemFor` verb; 03 and 05 never mention them either.
- **Gap:** FR-3 (gasless claim path) is a demo-critical FR resting on an API my sources cannot confirm. Presumably from doc 02 — **cross-check**; if it doesn't exist, FR-3 needs the 4337/relayer-submits-user-signed-tx design instead, which is a different UX (and the "one signature → relayer pays" consequence changes).

### 1.5 LOW — SDK "pinned exactly at 0.28.1": version unverified; sources say "≥ 0.28.0"
- **Addendum §A** vs 01 §4 ("use ≥ 0.28.0"). 0.28.1's existence is asserted nowhere in the sources. Pinning exactly is the right instinct (03 §7: expect indexer schema drift; checks.mjs hard-floors 0.23.0) — just verify the pin against npm at build time.

### 1.6 LOW — "Somnia Data Streams / SDK `/reactivity` subpath"
- **Addendum §H.** Source 05 §4 names the Streams SDK as a *separate package*, npm `@somnia-chain/streams` (+ viem), with its own method surface (`set`, `emitEvents`, `subscribe`, schema ops). A `/reactivity` subpath of markets-sdk is in no source I hold — cross-check with doc 02; if wrong, the candidate integration is `@somnia-chain/streams`.

### 1.7 LOW — Testnet cadence list omits the observed **daily** series
- **PRD** Glossary *Window* ("testnet cadences observed: 60s / 5m / 10m") and Assumptions §15. Source 03 §7 also records a **BTC ↔ ETH daily roll** on testnet (ec-laddering followed it). Mitigated by the derived-lanes rule (FR-6), but the Glossary states an incomplete fact, and a daily lane changes headroom/no-entry math (`min(300, …)` caps it fine) and "Between rounds" copy (next window could be tomorrow).

### 1.8 Verified clean (for the record)
Checked and matching sources exactly: chain ids 50312/5031; STT/SOMI; tUSDC `0x70a8…5d8E` 6dp, faucet ≤10,000/call; USDso 18dp + 10^12 landmine; BinaryMarketsModule `0x3ecC…e388` CREATE3 same-both-networks; EntryPoint `0x0000…a032` (testnet); indexer URLs (dev/prd `.smk.somnia.host/v1/graphql`); oracle deep-link pattern `prd.oracle.somnia.host/questions/{id}?view=graph`; testnet venue id `0x6797…8a28c` + "moved 3× in a week, read off a live row"; headroom formula `max(30, min(300, intervalSec*0.4))`; all 14 canon items + pool-keyed candles rider faithful to 01 §5; Fair Value constants (W=60s, 15s staleness, ≥12 samples, expectedMove 0.0015, vol floor 0.0002, tanh k≈0.798, clamp 0.05–0.95, edge floor 0.03, ceiling 0.10, trade-the-tilt rule, strike-0→`getOpeningPrices`); "8 Sep safe deadline"; volume-not-shown-in-official-app; builder codes spot-only ≤1% with EC unverified; mint-a-pair cold start.

---

## 2. Protocol behaviors that will bite, with no FR / NFR / canon coverage (priority b)

### 2.1 HIGH — The measured testnet reference anomaly: books at ~coin-flip while the underlying is already ~0.85% past the settlement reference
- **Source:** 03 §3.4 (ec-oracle-follow README, with a live-numbers table): "either testnet quotes don't track the underlying or `getOpeningPrices` isn't the actual reference; `OF_MAX_DISAGREEMENT` muzzles the bot precisely there."
- **Bite:** this is the exact venue+model combination Baku ships. If the anomaly persists: (a) Baku's |Tilt| will sit above the 0.10 disagreement ceiling on many/most windows → perpetual *sit out* (correct per FR-23, but it guts the copilot demo and SM-5's screenplay); (b) the oracle-follow **house Runner** (FR-32) won't trade for the same reason → empty strategy records; (c) FR-7's distance-to-line readout ("needs +$42 for UP") will visibly contradict the displayed odds, which reads as *our* bug to a user.
- **Gap:** no FR consequence, no Open Question, no demo-risk note anywhere. **Fix:** add an Open Question: "verify on live testnet that `getOpeningPrices` matches the oracle's actual settlement reference (compare vs `getMarketResolution.openingAnswer.numericValue` on settled rounds); decide Baku/runner behavior if book-vs-model disagreement is chronic." The verification is one indexer call per settled market.

### 2.2 HIGH — Self-match refusal + per-wallet write discipline across the product's *own* fleet of writers
- **Source:** 03 §6.2 — "the pool refuses self-matches, so the liquidity the case depends on cannot exist" (taker cases are *skipped* without a distinct counterparty wallet); nonce races between two senders on one key; wet runs sequential with 15s gaps; `claim.ts` — "one key = one bot."
- **Bite:** Masayume operates several writers: the seed-liquidity maker (§10.1.8), 1–2 house Runners (FR-32), the relayer (FR-3), the Telegram Executor, and the Vault. If the seed maker and the oracle-follow Runner share a wallet, the Runner **cannot fill against the house book** — the demo's "agent trades appear in portfolio" moment dies. If the demo-user wallet is also the seeding wallet, user bets can't fill either.
- **Gap:** NFR-7's "one signing key = one writer" covers nonce racing only; self-match refusal is nowhere. **Fix:** NFR-7 addition: "distinct wallets per economic role (maker / taker-runner / relayer / executor); a house taker must never share a wallet with the house maker whose book it crosses." Seed-liquidity sizing (Open Q6) should absorb this.

### 2.3 HIGH — Resting orders: belt-and-braces cancel (D7/D10) missing from canon; **no FR lets a user unwind a backed Take**
- **Source:** 03 §7 defect log — D7: shutdown asked the indexer what was resting and stranded last-seconds orders (logged "canceled 14" while 1 stranded); D10: an order can rest on-chain while the placing call **throws on the way back** (no order id recorded); fix = track placements locally (`cancelTracked`) + venue sweep. 01 §5 gotcha 4: an unfilled resting remainder sits "with escrow locked, invisibly."
- **Bite:** user takers are IOC (FR-9 ✓, nothing rests) — but **FR-14 backed Takes deliberately rest post-only orders**, and the maker Runner rests quotes all day. The canon (addendum §D) covers takers-send-IOC but not the resting-order hygiene the product's two resting surfaces need. And product-level: a backed Take whose order never fills has the user's escrow locked until order expiry, with **no FR affordance to cancel/unback a Take**, and no defined display of "backed, resting, unfilled" vs "backed, filled" (the `hasBet` badge covers fills only).
- **Fix:** canon additions ("track your own placements; cancel from local record then sweep; a throwing place call may still have rested"); an FR-14 consequence: unfilled backed orders are visible with their locked escrow and cancellable in one tap; Runner shutdown must cancel-tracked-then-sweep.

### 2.4 MED — The venue's per-pool **vault balance** is a fourth money pool; buys spend it first; name collides with the product's "Vault"
- **Source:** 01 §2 — "Buys escrow collateral at placement (worst case, **vault-first**: per-pool vault balance spent before wallet — the vault is a payout *fallback*, reads 0 normally)"; client tier exposes `getVaultBalance`.
- **Bite:** FR-5 (honest money display) enumerates wallet / Vault / escrowed — the venue pool-vault is missing, so when it's ever nonzero the "one spendable number" is wrong and a buy quietly spends from a pool the UI never showed. Separately, the PRD Glossary's **Vault** (EventVault) collides with the protocol's own vault term — downstream docs will confuse them.
- **Fix:** FR-5 consequence: venue vault balances read via `getVaultBalance` and folded into the labelled rows; Glossary disambiguation ("Vault (ours) ≠ the venue's per-pool vault, a payout fallback").

### 2.5 MED — One-sided/empty books: Fair Value's anchor and Parlay leg pricing have no defined behavior
- **Source:** 03 §4.3 — anchor = YES mid, **or on a one-sided book the single-quote bound** (`marketBoundUp`: an ask caps fair, a bid floors it; momentum mode *refuses* on one-sided books; noted conservative bias toward NO). Thin/one-sided books are the normal testnet state before seeding.
- **Bite:** Addendum §E simplifies to "tilt = P(up) − bookMid" — with no mid, Baku's Read and SM-5's eval have undefined input; FR-33 prices parlay legs "from live book mids" — same hole, and a fabricated mid mis-escrows the Reserve.
- **Fix:** port the `marketBoundUp` fallback + refusal semantics into addendum §E; FR-33 consequence: a leg without a two-sided book is refused at quote time (honest label), not priced from an invented mid.

### 2.6 MED — Opening price can be briefly unresolved at window open; FR-7's "frozen line" has no absent-state
- **Source:** 03 §4.4 — the opening price arrives via an oracle reference question; "resolved openings are cached forever, **unanswered ones are retried next cycle**."
- **Bite:** the hero chart's opening-price line (FR-7) and the distance-to-line readout may have no value in the first seconds of a window — exactly when a 60s-cadence user is deciding. No consequence covers the absent state; an interpolated or stale line would violate the honesty law.
- **Fix:** FR-7 consequence: "before the opening print resolves, the line and readout show an explicit pending state; they never render a guessed level."

### 2.7 MED — Fair Value model spec drops three implementation-critical guards from the source
- **Source vs addendum §E:** (a) `horizons = max(ttl/W, 0.05)` — the **0.05 floor** (prevents the final ticks dividing scale to zero) is omitted; (b) momentum admissibility gates — `ttl ≤ OF_MAX_HORIZONS × W` (default 30) AND `|r| ≥ threshold` — omitted (without them, momentum tilts long windows it should never touch); (c) the momentum-fallback rule "**clamp the TILT, not the sum**" (clamping `anchor+raw` near a bound can flip the trade to the wrong leg) — omitted. Also unstated: `fetchPrice`'s timestamp is the **oracle write time**, which is what makes the 15s staleness rule meaningful.
- **Fix:** one paragraph in §E; these are exactly the bugs a clean-room port reintroduces.

### 2.8 LOW — Fixed-strike markets can appear in lanes; the product assumes up/down everywhere
- **Source:** 01 §1 (the `strike` field supports fixed-strike markets), 03 §4.4 (fixed-strike symbol shape; strike arrives as a raw integer in an **unstated scale** — cents observed — with a scale-inference + refuse-if-ambiguous routine). Today every observed testnet market is strike-0 up/down, but nothing guarantees that through judging.
- **Bite:** FR-6's derived lanes would happily list a fixed-strike market whose hero view (opening-line framing, "vs open" copy) is wrong for it.
- **Fix:** cheap guard: v1 filters to `strike == 0` markets with a counted, disclosed exclusion — or ports the scale-inference if fixed strikes are wanted.

### 2.9 LOW — Operational hardening items measured in live testing, absent from PRD/addendum
From 03 §7 defect log and §10.5, not covered by NFR-2/NFR-7:
- **D11 shape:** an empty gas tank surfaces as viem `"Missing or invalid parameters"`, not a readable gas error (24 identical error lines before anyone checked native balance) — canon 7 says *check* gas; the *diagnosis* mapping belongs in error-handling copy.
- **D5 shape:** an unclosed SDK WebSocket holds the event loop open — bites the Runner and any script/route that instantiates the SDK with watches; cap the shutdown wait and `process.exit` explicitly.
- Order-level `expiresInSec` as a **dead-man's switch** for anything resting (crashed maker/backed-Take orders age off on their own) — canon 5 mandates expiry but not the sizing rationale (just past the requote interval).
- **RPC redundancy:** 05 §1 — DreamDEX's own reliability guidance: keep ≥2 RPCs configured and rotate on failure (testnet has two: `api.infra.testnet` + `dream-rpc`). No NFR mentions RPC failover.

---

## 3. Product-relevant opportunities named in sources, absent from scope and Open Questions (priority c)

### 3.1 MED — Markout / adverse-selection analytics: the sources' flagship "edge" methodology is not what FR-20 ships
- **Source:** 03 §8.1 + §10.8 — captured-spread vs adverse-move decomposition per fill (`netEdge(h)`), worst-decile toxicity concentration, tx-per-fill, and a verdict line ("your fills earn X bps at the touch and give back Y bps within 60s") — with the explicit instruction: "**log fills in the `TradeRow` CSV shape from day one and this tool runs as-is**," plus the binary-market extension (mark to realized settlement).
- **Gap:** FR-20's Edge tab (ROI, profit factor, expectancy, drawdown) is Yosuku-derived accounting, not this; FR-19's CSV has no shape requirement. The day-one logging decision is free now and unrecoverable later. At minimum: FR-19 consequence pinning the fill-log columns to TradeRow-compatible; markout itself can stay post-MVP on merit.

### 3.2 MED — The STT-gas assumption contradicts the product's own relayer; the sources name the pattern that removes the hurdle
- **PRD Assumption §15 / FR-2:** "[STT cannot be dripped in-app; external faucet link is the v1 path]" — stated as a capability limit. But FR-3/FR-39 already require an app-operated, STT-funded relayer; the same wallet can transfer dust STT to a new user. **Source 05 §3** documents the venue's own precedent (DreamDEX auto-buys 1 SOMI gas on first deposit) and §2 lists three alternative STT faucets (Google Cloud, Stakely, Thirdweb) beyond the single one UJ-1 links.
- **Gap:** the highest-friction moment of UJ-1 (bounce to an external faucet before first bet) is treated as immovable when the sources show two mitigations. Deserves an Open Question ("relayer STT dust-drip with the §12 anti-farm gates?"), and FR-2's faucet routing should list the fallback faucets — the official one being down during judging is a real failure mode.

### 3.3 MED — ec-doctor as the product's health check; run-gate + leak-check as the integration-test story
- **Source:** 03 §10.3–10.4 name both as direct lifts: the doctor sequence (config echo → venue resolve → wallet gas/collateral → per-market status/TTL/book) is a deploy-time and support-time diagnostic that pairs exactly with NFR-8's judge-proofing (`/dev/doctor` beside the fixture pages); the ec-test pattern (dry gate → wet gate with a distinct counterparty wallet → **open-order delta leak check** around every wet run) is a ready-made integration harness for the Runner and seed scripts, plus checks.mjs-style network-free CI invariants (§10.10: env knobs documented, status enum pinned, taker-must-IOC, headroom-gate-required, address drift, SDK floor).
- **Gap:** PRD's verification story is contract tests + fixture pages + SM-5's eval set; no runtime preflight, no integration-test approach, no CI invariants. None of this is scoped, cut, or questioned. Cheap, and each rule exists because something real broke.

### 3.4 LOW — Runner heartbeat / why-string as the strategy-card status feed
- **Source:** 03 §3.4 + §10.1 — every take logs a why-string leading with the two inputs fair value rests on (reference, vol); idle cycles emit a heartbeat (markets scanned, net/gross, per-reason skip counts, closest-to-trigger). "Essentially a ready-made agent status feed."
- **Gap:** FR-32's card shows "decision envelope + record" and FR-30 emits auditable events, but the live *why/why-not* feed — the thing that makes a house strategy trustworthy while it's idle (which, per 2.1, may be often) — isn't specified. One consequence on FR-32 captures it.

### 3.5 LOW — Loose ends worth one line each
- **Prophecy naming:** 05 §5 — the oracle explorer is "Prophecy Oracle" (chain 5031 SPA); Receipts copy can name it, and the Prophecy Social story is a judge-legible ecosystem tie.
- **Multicall3 on testnet** (`0x841b…4223`, 05 §1): free batching for the claim-plate's many reads (claimable scans across Finalized markets).
- **Explorer links:** Receipts require a tx explorer; neither document names `shannon-explorer.somnia.network` (05 §1). Trivial, but it's a Receipt dependency like the oracle host (Assumption §15 covers only the latter).
- **dreamBot-Builder-shaped EC config-gen** (05 §7 — "an EC-native equivalent would be novel"): the PRD chose house-run Vaults instead, which is a defensible direction, but the source's novelty claim is judge-relevant framing the pitch could cite ("the Builder pattern exists for spot only; we are the EC-native automation layer").
- **`getBinaryPositionPnL` / `getMarketResolution`:** 01 §4 — SDK primitives that directly serve FR-16/FR-21 (and the 2.1 verification); worth naming in the addendum so the build doesn't re-derive them.

---

## 4. Summary table

| # | Sev | Type | Finding | Lands in |
|---|-----|------|---------|----------|
| 1.1 | HIGH | error | Payout stated as 1:1 unconditionally; settlement fee must be read from chain | Glossary, FR-11, canon §D |
| 1.2 | HIGH | error | 7702 only verified on mainnet; 4337 only on testnet; v1 chain mismatch unresolved | OQ-5, FR-4, FR-11 |
| 1.3 | MED | unverified | `setSigner({walletClient})` locked despite 01's explicit "needs checking" | Addendum §A (x-check doc 02) |
| 1.4 | MED | unverified | `signRedeemAuth`/`redeemFor` (FR-3's basis) in no source doc | Addendum §H (x-check doc 02) |
| 2.1 | HIGH | behavior | Testnet books vs settlement-reference anomaly → Baku sits out everything, runner won't trade | New OQ; FR-23/32 demo risk |
| 2.2 | HIGH | behavior | Self-match refusal across house maker/taker/executor wallets kills own-liquidity fills | NFR-7, OQ-6 |
| 2.3 | HIGH | behavior | Resting-order hygiene (D7/D10) not in canon; no cancel-a-backed-Take FR | Canon §D, FR-14 |
| 2.4 | MED | behavior | Venue per-pool vault = unshown 4th money pool, vault-first spending; name collision | FR-5, Glossary |
| 2.5 | MED | behavior | One-sided books undefined for Baku anchor + parlay leg mids | Addendum §E, FR-33 |
| 2.6 | MED | behavior | Opening print can be pending at window open; frozen line absent-state | FR-7 |
| 2.7 | MED | behavior | Model spec drops horizons floor, momentum gates, clamp-the-tilt rule | Addendum §E |
| 3.1 | MED | opportunity | Markout methodology + TradeRow CSV shape from day one | FR-19/20 |
| 3.2 | MED | opportunity | Relayer STT drip / auto-buy-gas precedent contradicts the STT assumption | Assumption §15, FR-2 |
| 3.3 | MED | opportunity | ec-doctor health check; leak-check integration harness; CI invariants | NFR-8, build seq |
| 1.5–1.8, 2.8–2.9, 3.4–3.5 | LOW | — | version pin, streams pkg name, daily cadence, fixed-strike guard, ops hardening, heartbeat feed, naming/links | various |
