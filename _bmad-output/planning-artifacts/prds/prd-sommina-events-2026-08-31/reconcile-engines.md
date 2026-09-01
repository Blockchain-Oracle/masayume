# Reconciliation: engines / custody / backend sources vs PRD + addendum

Input: `context/12-yosuku-data-layer.md`, `context/14-yosuku-contracts-and-services.md`,
`context/15-yosuku-api-routes-and-backend.md` — checked against `prd.md` + `addendum.md`
(2026-08-31). Decided cuts (leverage, TEE, privacy, X rail, alerts, rooms, CCTP/SuiNS/Walrus/Seal,
SVI, Privy, creator self-serve, venue-LP vault) are respected and **not** re-litigated here.

Findings are ordered by severity within each section. Each carries the source location and the
PRD anchor it should attach to.

---

## A. Engine behaviors with no FR consequence (silently dropped)

### A1. Leaderboard loss-synthesis is missing — Banzuke as specified overstates everyone. **[high]**
Source: 15 §3i `/api/leaderboard` ("Synthesize losing redemptions", `resolveSettled`): nobody
redeems a losing bet (payout 0, gas-only), so an engine fed only redemption events **counts wins
and drops losses**. The reference reads the settlement price per market and fabricates the
zero-payout close the chain will never emit; unredeemed *winners* stay out until actually
claimed. The same structure holds on EC: losers never call `redeem`.
PRD: FR-26 carries FIFO/dedup/window-filter/unmatched-disclosure but not loss synthesis;
addendum F carries only "24h window, top 50, 5-min cache". Also dropped from the same route's
lessons: `meta.complete` honesty (a dropped indexer page must flag the board as partial, never
report a partial scan as fact) and oldest-first fold order. FR-26 needs consequences for all
three; FR-22 `/stats` inherits the same loss problem for any win-rate/calibration metric.

### A2. Early close (sell-to-close) has no FR, yet FR-17 depends on it. **[high]**
Source: 12 §3.2 — the three redemption kinds (settled / cashed-out-live / liquidated) are
"load-bearing"; the adapter seam (12 §5) has `buildCashOut` + `capabilities.cashOutEarly`;
unrealized PnL against the live mark only matters if you can act on it.
PRD: FR-17 labels history rows "closed early", FR-16 shows live PnL — but **no FR lets a user
close a position early** (on EC: sell outcome tokens back into the book). Either add the FR
(with its own guards: min-proceeds cap, IOC, honest "closed early at live price" labeling per
the shareCard honesty rules) or strike "closed early" from FR-17 and the UJ-5 narrative.
(Liquidated-kind drops correctly with the leverage cut.)

### A3. Parlay risk controls and Reserve economics dropped. **[high]**
Source: 14 §5 `parlay624`. Captured: escrow-full-payout, λ=0.40 floor, 12% margin, first-loss
kill, permissionless idempotent resolution, adminVoid-after-grace, claim-pays-owner. Dropped
with no FR/addendum entry:
- **Longshot rejection** (`min_combined_prob_bps`) — no minimum combined probability anywhere.
- **Aggregate exposure cap** (`max_exposure_bps` of reserve value across live tickets),
  **per-parlay payout cap**, and the **per-expiry sub-cap** (`max_expiry_locked`) controlling
  same-print correlation pileup. FR-34's "refuses if the Reserve lacks funds" is insolvency at
  quote time, not exposure management — a solvent reserve can still concentrate its whole float
  on one expiry.
- **Legs must be on future expiries at open** ("an opener can't pick known outcomes") — cheap,
  security-relevant, absent.
- **Who capitalizes the Reserve.** The source contract is a supplier share vault (suppliers earn
  losing stakes, locked funds not withdrawable). PRD §10.2 cuts "LP / be-the-house" with the
  reason "EC does not expose LP mechanics" — that reason does not apply to ParlayReserve, which
  is our own contract. If the answer is "house-seeded only, no public supply," say so; right now
  the funding model is silently unspecified while FR-34 depends on it.

### A4. App-attribution / membership rule undefined for Banzuke and /stats on a shared venue. **[high]**
Source: 15 §3i ("membership by builder code, not gas sponsorship"; protocol/desk accounts
excluded) and 12 §3.3 traction rules (separate **adoption** — external wallets — from
**capability** — your own demo/infra/runner wallets, labeled; monotonic high-water marks keyed
by definition version; volume never shown without the bettor-count denominator).
PRD: the venue is shared testnet infrastructure — other teams' trades hit the same markets.
FR-26 and FR-22 never say whether rankings/stats are venue-wide or Masayume-only, and SM-3's
"≥200 settled positions, ≥25 unique wallets" has no rule excluding (or labeling) the house
Runners' and seed-liquidity script's own activity — which will plausibly dominate the count.
Open Question 3 (builder-fee attribution) touches the mechanism but is never connected to
membership. Without this, /stats violates its own SM-C3 ("never pad with synthetic numbers")
via the house's own bots.

### A5. Display-price provenance rule dropped — undercuts the provably-fair layer. **[medium]**
Source: 12 §3.1 — spot deliberately comes from **the same feed the market settles on** ("the
more honest number"), not a generic price API; one shared stream, refcounted, backoff, hidden-tab
disconnect. PRD FR-7/FR-12 charts and FR-23's model feed never state which price source the
charts and Fair Value use. A hero chart on CoinGecko while settlement reads the venue oracle
manufactures exactly the "it's rigged" divergence UJ-3/FR-21 exist to defeat. One consequence
line on FR-7: chart + model price come from the settlement oracle's own source (or the closest
readable proxy), named in the UI.

### A6. Portfolio "no money figures from lossy sources" rule not carried. **[low]**
Source: 15 §5 — event scans with row caps may only drive *counts*, never amounts; durable money
history must come from full logs/own indexer or state, never a pruned/windowed query (12 §3.2
`history729`; strategy catalogue "objects, not events" lesson; EC equivalent: prefer ERC-6909
`balanceOf` state reads over event reconstruction). NFR-1/NFR-4 cover recomputability and
null≠0 but not this rule. Add a clause to NFR-4.

### A7. Minor engine drops (list for the PM, each one line to restore or consciously kill).
- FR-20 omits the **time-of-day edge windows / bestWindow** from `computeTraderEdge729`
  (12 §3.2) while taking everything else from the same function.
- **Open-position share framing**: `openBetShareCard` rules (conditional "IF IT LANDS" framing
  only; absolute UTC settle time, never a relative countdown that goes stale) — FR-15 covers
  Verdict/Take/Parlay cards but no honesty consequences for *open-call* cards.
- **Min-size floor at the ticket**: gotcha #6 prevents sub-lot dust, but nothing states a
  user-facing minimum stake rule (source: `MIN_STAKE`, `minQtyMicroForPremium`, probe-upward
  `quoteWithPremiumFloor`). Likely simpler on EC; still needs one consequence on FR-8.
- **Reputation tiers** (Novice/Trader/Whale/Oracle with fee/bonus %) — legacy, fine to drop,
  but it is the only "progression" mechanic in the source; FR-27 badges are binary. Conscious
  kill recommended, not silence.

---

## B. Custody / backend guarantees not captured

### B1. Runner/desk health honesty has no FR. **[high]**
Source: 15 §3e — the copy-desk showed "Copying, watching Bitcoin" for **ten days while dead**;
the fix is a product rule: liveness is **re-derived** (`now − lastTickAt < max(180s, 3×interval)`),
never a cached or self-reported "healthy", and the health surface always renders the truth.
PRD: FR-32 shows strategy records; UJ-7/FR-31 cover the *custody* consequence of a dead Runner
(permissionless crank) but nothing requires the strategy card / vault page to show live,
re-derived Runner health. A user subscribing to a dead strategy is the exact reference failure.
Add a consequence to FR-32.

### B2. Idempotency / double-execute protection on the money-moving services. **[high]**
Source: 12 §3.4 + 15 §3b/§3i — "an unconfirmed response that carries a digest is treated as
submitted; a retry could double-execute"; the private-bet desk serializes its store behind a
lock to prevent double-redeem races, proves the signer works **before** money moves, records
intent to disk before acting, and books the **actual** minted quantity from events, never the
requested one. PRD: the gasless-claim relayer (FR-3), the TG Executor (FR-37), and the Runners
(FR-32) are all retry-prone money movers, and no FR/NFR requires idempotent submission,
duplicate-command suppression (a re-sent Telegram message must not double-bet), or
actual-fill-from-receipt accounting. NFR-7's "one signing key = one writer" covers nonce racing
only. Add to NFR-2 or NFR-7.

### B3. One-agent-per-Vault vs. the Executor being a Vault client — collision unresolved. **[high]**
Source: 14 §4 / 12 §3.4 — the reference ran **two separate vault instances** precisely so the
copy-desk and the trade-from-X executor could not clobber each other's one-agent subscription.
PRD: FR-29 locks "exactly one Strategy per Vault"; §5.11 makes the Telegram Executor "a Vault
client". A user who subscribes a house Strategy *and* links Telegram either can't, or silently
kicks one agent. Options the source supports: multiple named grants per user (social_vault's
`Subscription` table supports N grants), or a second vault instance, or the Executor as a
distinct grant type. Any of these works; the PRD currently specifies a conflict.

### B4. Daily-loss circuit breaker silently became "max daily spend". **[medium]**
Source: 14 §2.4/§2.5 — the vault's rolling-24h **realized-loss** limit auto-pauses agent
activity (`CircuitBreakerTripped`) while exits stay open; `trading_vault` policies also carry
`max_daily_loss`. PRD Caps = {max stake/trade, max daily spend, max open positions} — spend ≠
loss (a strategy can churn break-even trades into the spend cap, or lose its full spend with no
loss-triggered stop). Fine as a v1 simplification, but it is a *changed guarantee* and should be
an explicit decision (Caps definition, FR-29), not a silent swap.

### B5. Sponsorship policy: whole-batch validation and key separation partially dropped. **[medium]**
Source: 14 §8 — three rules: (1) **whole-batch validation** (a batched tx is declined unless
*every* call is allowlisted — matters again under 4337/7702 batching, addendum H); (2)
asset/type pinning; (3) per-service **key separation with least privilege** (faucet key never
the deployer; the parked design doc flags operator-key contention when relay/keeper/executor
share one key). NFR-7 has per-function allowlists and one-key-one-writer (a nonce rule, not a
privilege rule). Add batch-validation and key-separation clauses to NFR-7.

### B6. Cross-surface Brake: the Daily Stop only exists "at the Ticket". **[medium]**
Source: 12 §3.2 `dailyStop` is client-local, but the reference had one betting surface. PRD has
three (web Ticket, Reels inline, Telegram). FR-24 enforces the Daily Stop "at the Ticket";
FR-37 applies only "all Ticket guards (FR-9)" to Telegram — FR-9 does not include FR-24. As
written, a tilting user stopped on web keeps betting from the group chat, and Vault Runners are
governed by spend caps, not the user's stop. State where the Daily Stop is authoritative
(server-side per wallet, checked by Executor and web alike) or explicitly scope it to the web
surface with honest copy.

### B7. Small custody/backend drops.
- **Deposit+subscribe composed in one action** (Onara outage post-mortem, 14 §8): the Vault
  onboarding flow should compose deposit and subscribe; no FR consequence. UX-level; one line
  on FR-29.
- **ERC-20 allowance UX**: 12 §3.4 — "gate on what the wallet holds *and* what is approved."
  EC trading requires tUSDC approval; UJ-1/FR-1..2 never mention the approve step, the one
  wallet prompt the "one tap" story must absorb.
- **Agent/MCP on-ramp** (15 §3i `/api/bet/build`, port-priority #4): a generic
  build-unsigned-tx surface for external agents is dropped without a scope note, in an
  "agents-first"-judged hackathon where the TG bot is the only external rail. Cheap to note as
  post-MVP in §10.2.

---

## C. Contradictions (rules and numbers)

### C1. FR-3 "sponsorship is claims/exits only" vs FR-39 sponsored waitlist joins. **[direct]**
FR-3: "The gasless path never applies to capital intake … sponsorship is claims/exits only."
FR-39: "Joining costs the user nothing (sponsored)." A waitlist join is neither a claim nor an
exit. Also note the narrowing is bigger than its stated reason: the reference sponsored the
whole bet path, takes, joins, and subscriptions, and its farmed-endpoint lesson was specifically
**never sponsor capital-intake** (pool `supply`) — not "sponsor nothing but exits." Dropping
sponsored *bets* may be right (STT-faucet friction accepted in UJ-1), but it is currently
justified by a lesson that doesn't cover it. Fix FR-3's wording to "claims/exits + explicitly
listed zero-capital actions (waitlist join)" or unsponsor the waitlist.

### C2. Parlay leg pricing: "mid" vs the source's real quote, and "server-attested" vs the claimed improvement. **[rule tension]**
FR-8 forbids midpoint estimates for tickets ("real order-book quote for the actual size, never
a midpoint estimate"); FR-33 prices parlay legs "from live book mids". The source used the
**live quote of 1.0 contract** (the digital price), not the mid (12 §3.4). Different context
(pricing against the Reserve, not filling the book) can justify mid — but say so, or use the
1-unit quote for consistency with the product's own quote discipline. Separately, FR-33 claims
the improvement over the reference ("which trusted client input"), while addendum C specifies
"CLOB mid at open **(server-attested)**" — the doc-14 improvement was reading the book
**on-chain in-tx** (possible here: the CLOB is fully on-chain); server-attested re-introduces a
trusted party and is closer to the reference's keeper-co-sign than to the advertised fix. Pick
one and describe it accurately.

### C3. Backed Takes: backing is a resting order, but the badge derives from fills. **[rule tension]**
FR-14: a backed Take "places a post-only order at the stated probability"; the `hasBet` badge
"derives from actual fills, not self-report." A resting, unfilled backed order therefore renders
as unbacked — exactly the state the feature creates. The source's gate recorded *bet placement*
atomically with the order (14 §6.2). Define backed as "verifiable resting order OR fill" (both
are on-chain-checkable) or accept and state that backing only badges after a fill.

### C4. Cadence-keyed numbers don't map to the observed cadences. **[numbers]**
Addendum F keys cost-cap buffers (1m 1.6× / 5m 1.2× / 1h 1.1×) and no-entry cutoffs (45s 1m /
15s others) to the reference's 1m/5m/1h cadences; the PRD's own glossary observes testnet
cadences **60s / 5m / 10m**. 10m has no buffer or cutoff, and "1h 1.1×" maps to nothing live.
Addendum F already says "reconcile with gotcha #9 at build" for cutoffs — extend that note to
the buffer table, or re-key both as a function of `intervalSec` (which gotcha #9 already is).

### C5. Verified consistent (no action). Numbers checked against sources and matching:
λ = 0.40 and 12 % parlay margin; venue band [1,99]% / client [2,97]%; odds clamp [1,99]¢;
quote debounce 350 ms / re-quote 12 s; leaderboard 24 h / top 50 / 5-min cache; whale ≥1000,
oracle-eye ≥70 % over ≥10 settled; caption ≤240; faucet ≤10k/call + balance-threshold no-op;
strategy fee cap 10 %; copilot 12 messages / recall ≤4 / 2–4 sentences / ~28 s; edge readout
≥5 settled rounds; profit factor null before first loss; DOWN mark = 1 − P(up); FIFO bigint
allocation; window filter on close time with prior mints as cost basis; void = both sides at
0.5 redeemed explicitly; claim time ≠ oracle print time.

---

## Summary of required PRD/addendum edits (by anchor)

| Anchor | Edit |
|---|---|
| FR-26 (+FR-22) | Add loss-synthesis, completeness flag (`complete:false` on dropped pages), oldest-first fold; define membership/attribution rule for a shared venue (A1, A4) |
| New FR (5.5) or FR-17 | Add sell-to-close early exit, or remove "closed early" everywhere (A2) |
| FR-33/34 + addendum C | Add min combined prob, aggregate/per-expiry/per-ticket exposure caps, future-expiry-only legs; state Reserve capitalization model (A3); fix mid-vs-quote and server-attested wording (C2) |
| SM-3 / FR-22 | Exclude-or-label house runner + seed-script activity; adoption vs capability; monotonic counters (A4) |
| FR-7 | Chart/model price provenance = settlement feed (A5) |
| FR-32 | Re-derived Runner health surface (B1) |
| NFR-2/7 | Idempotent submission + duplicate-command suppression for relayer/Executor/Runner; actual-fill accounting; whole-batch allowlist validation; per-service key separation (B2, B5) |
| FR-29 / §5.11 | Resolve one-agent-per-Vault vs Executor-as-Vault-client (B3); daily-spend vs daily-loss cap as explicit decision (B4); deposit+subscribe composite (B7) |
| FR-24/37 | Daily Stop authority across web + Telegram + Runners (B6) |
| FR-3 vs FR-39 | Reconcile sponsorship scope wording (C1) |
| FR-14 | Define "backed" for resting orders (C3) |
| Addendum F | Re-key buffers/cutoffs to observed cadences or `intervalSec` (C4) |
| FR-1/2, FR-20, FR-15, FR-8, §10.2 | Minor: allowance step, time-of-day windows, open-call card honesty, min-stake rule, agent API scope note (A7, B7) |
