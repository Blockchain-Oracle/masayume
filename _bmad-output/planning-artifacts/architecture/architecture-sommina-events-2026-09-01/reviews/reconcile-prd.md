---
review: input-reconciliation
input: PRD + addendum (prd-sommina-events-2026-08-31)
target: ARCHITECTURE-SPINE.md (architecture-sommina-events-2026-09-01)
date: 2026-09-01
---

# Reconciliation — PRD + Addendum vs Architecture Spine

Scope of check: (a) NFR-1..10 governance; (b) addendum locked decisions §A/§B/§C/§D/§I; (c) quiet requirements outside the AD structure; (d) Open Questions the spine claims to resolve (OQ-3/5/7) against the PRD's own constraints.

Legend: **GAP** = requirement dropped or left ungoverned · **CONTRADICTION** = spine states something the PRD/addendum forbids or supersedes a locked decision without saying so · **TENSION** = both texts defensible but they collide at an edge · OK = covered.

---

## Findings (ranked)

### F-1 · GAP (high) — AD-5 resolves OQ-5 but drops FR-4's mandated funding-surface consequence

AD-5 makes session-key tap-trading a `SESSION` grant on EventVault to a browser-held ephemeral key — i.e. it adopts what the PRD calls the **fallback** path as the primary design. That is a legitimate resolution of OQ-5 (it correctly avoids unverified 7702 on chain 50312 and the spot-only operator-registry risk). But FR-4 attaches an explicit consequence to exactly this choice, and the spine nowhere carries it:

> "The fallback changes the funding surface — tap-trading money would live in the Vault, not the wallet; Portfolio/onboarding must present that honestly (FR-5's labeled-pools rule)." (FR-4)

Under AD-5, a tap-trade spends **Vault balance**, while FR-5 locks "normal bets draw from the wallet" and "the headline 'spendable' number is wallet balance." Nothing in the spine — not AD-5, not the FR-1…5 capability-map row (governed only by AD-1/2/6/13), not a convention — states that session-mode bets draw from a different pool, that enabling tap-trading now requires a Vault deposit first (a new onboarding step in UJ-2's flow), or that FR-5's labeled-pools display must reflect it. Ripple effects left unstated:

- FR-29's grant arithmetic ("at most one Strategy grant plus one Executor grant") needs restating for three grant types (presumably: at most one per type). The contract cap semantics (per-grant daily spend etc.) presumably extend to SESSION — unstated.
- FR-4's "exceeding any cap falls back to a normal wallet prompt" now means falling back to a *different funding pool* (wallet), which FR-5 requires be shown, never silently summed.
- Build-sequence coupling gets stronger: FR-4 now hard-depends on EventVault being deployed (addendum §I item 5 already sequences it after contracts — consistent, but the dependency should be named in AD-5 so epics inherit it).

**Fix:** extend AD-5 (or add a convention) with one sentence each: SESSION bets spend Vault balance; enabling tap-trading composes deposit+grant (FR-29's no-orphaned-deposit rule); FR-5's labeled-pools display is binding on the session path; grant-count rule is one-per-type.

### F-2 · GAP (high) — the judge-proofing artifacts vanished: `/dev` fixture pages and `/dev/doctor`

NFR-8 makes these hard requirements ("`/dev` fixture pages cover every card/receipt/modal state"; "a `/dev/doctor` preflight (config echo → venue resolve → wallet gas/collateral → per-market status/book) serves deploy-time and support-time diagnosis"). They also carry UJ-9 and the PRD §6 "ops/judge ring." The spine's structural seed describes `web/` routes as "quotes cache, takes, baku, stats" — no `/dev`, no doctor; the capability map has no row for them; no AD or convention mentions fixtures. These have architectural weight (fixture data must render every product surface from canned data with no chain access — which constrains how components take data, i.e. it interacts with AD-6's envelope shape), so "code-level detail" is not a safe implicit deferral. The rest of NFR-8 is well covered (zero-env law in AD-7 + conventions; the bot-kit test harness pattern in the Testing convention).

**Fix:** add `/dev/*` fixtures + `/dev/doctor` to the structural seed and a capability-map row (governed by AD-6 — components render from envelopes, so fixtures are just canned envelopes); one convention line: "every product surface renders from a fixture without chain access."

### F-3 · GAP (high) — NFR-7's sponsorship-allowlist rule and FR-3's gasless-claim flow are ungoverned

The relayer exists as an AD-8 actor, but three binding rules attached to it have no home:

1. **Per-function sponsorship allowlists validated over the whole batch** ("one unlisted call rejects the batch — this matters under 4337/7702 batching"; capital intake never sponsored) — NFR-7 + FR-3. The spine's only trace is a passing note on the Growth/landing capability-map row ("sponsorship allowlists NFR-7"); the FR-1…5 row (where gasless claims actually live) cites neither the relayer nor the allowlist rule.
2. **The gasless-claim mechanism itself** — addendum §H verifies `signRedeemAuth`/`redeemFor` (EIP-712, payout hard-pinned to owner) as the rail for FR-3 and counter-metric SM-C2. The spine never names it; without it, "relayer" is underdetermined and the SM-C2 guarantee (gasless claims pay only the owner's wallet) rests on nothing.
3. **Adversarial faucet/drip gates** — §12: "treat every sponsored or drip endpoint as adversarial… per-device + per-account gates" (the reference faucet was farmed at ~20 tx/hour). A `faucet-ops` role exists in AD-4, but the gating rule is nowhere.

**Fix:** either widen AD-8 or add an AD: "Sponsored execution: relayer submits only `redeemFor`-class calls from an explicit per-function allowlist validated over the whole batch; capital intake is never sponsored; sponsored/drip endpoints carry per-device + per-account gates."

### F-4 · GAP (medium-high) — the §D canon is bound only inside the write pipeline; its read-side rules and NFR-4's money-figure rule are dropped

AD-3 declares the 17-rule canon "binding inside this pipeline" — but the pipeline is writes. Several canon rules are **reads** and now have no governing home:

- #10 find winnings via `listBinaryMarkets({status:"Finalized"})` (settled markets vanish from `loadMarkets()`) — load-bearing for the claim plate (FR-11) and loss-synthesis (FR-18).
- #15 settlement fee read from chain (indexer → chain fallback, recycled-pool-safe) — FR-11's "never hardcoded" displayed payout.
- #17 `getCandles`/`getFills` pool-keyed → always window-scoped — also NFR-3's second sentence ("history queries are window-scoped"), which the Naming convention's `marketId` line does not cover.
- #13 never parse question text — feeds FR-6's plain-words view.
- #16 resting-order hygiene applies to **backed Takes placed from the web with the user's wallet** (FR-14: track own placements locally, cancel from local record, then sweep venue). AD-8's intent journals cover the maker Runner's half only; the web half is ungoverned.

Related NFR-4 drop: "Lossy sources drive only counts, never money figures: durable amounts come from state reads or complete logs (prefer ERC-6909 `balanceOf` state over event reconstruction), never a pruned or row-capped scan." The spine instead defers "indexer-vs-logs choice per read" as "adapter-internal… no divergence risk" — the *choice* is deferrable, but the PRD makes the *rule constraining that choice* an NFR. Deferring the decision while dropping its governing rule is not a safe deferral (a row-capped indexer scan feeding the leaderboard or claim plate is exactly the defect NFR-4 names, cf. FR-22's "partial scan flagged partial").

**Fix:** reword AD-3 to "the canon is binding on the adapter — write rules inside `Submitter`, read rules inside `MarketsProvider`, nowhere re-implemented"; add the NFR-4 money-figure rule as a data convention; give FR-14's client-side placement journal a named home (web-local store, not Postgres — it must survive AD-7's no-DB mode).

### F-5 · TENSION (medium) — AD-7's zero-env law vs FR-24's server-authoritative Daily Stop

FR-24/NFR: the Daily Stop is "per-wallet and **authoritative server-side**," enforced identically by web and the Telegram Executor ("a user stopped on web cannot keep betting from chat"). AD-7's zero-env law makes every store optional, and AD-9 degrades the stop to "per-browser with the honest scope label." Both texts are individually defensible, but the spine never scopes the degradation: as written, a production deployment without the DB would be spine-compliant while violating FR-24 and §12's safety constraint ("product requirements, not decorations"). Note the TG Executor cannot even exist meaningfully in no-DB mode (tg_links is in Postgres), so the degradation is coherent — but only if stated.

**Fix:** one sentence in AD-9: "The hosted product always runs with the DB; the per-browser degradation exists only for local zero-env judge runs, where the Executor rail is also absent."

### F-6 · CONTRADICTION (low, but must be made explicit) — spine silently supersedes the §A locked app-frame layout

Addendum §A locks: "`app/` routes · `src/core/` … `src/markets/` … `src/server/` route handlers (quotes cache, leaderboard aggregation, Baku, **relayer**) · `contracts/` · `services/runner/`." The spine ships `web/` + `packages/core|markets|db` + `services/ops` — and, substantively, **moves the relayer from a web route handler into the ops service** (AD-8). The move is almost certainly right (single-writer key discipline, NFR-7's one-key-one-writer, no house keys on Vercel — AD-4/AD-8 are better than the locked text), and pnpm-workspace `packages/*` is a refinement not a reversal. But §G's rule is "do not silently resurrect" rejected alternatives, and its mirror applies here: a locked decision may be superseded, not silently drifted from.

**Fix:** a one-line supersession note in the spine (or addendum §A) recording that the relayer moved server-route → ops actor and why.

### F-7 · GAP (low-medium) — assorted NFR clauses with no home

- **NFR-5 performance budget:** quote round-trip p95 ≤ 1.5s (plus debounce 350ms / requote 12s from §F) appears nowhere; the Deferred section's "numbers bank" entry lists only Caps/risk/Brake values. The budget is the NFR; it should be named (a Testing/CI convention line or a note that the numbers bank governs it).
- **NFR-9:** reduced-motion + dark-theme contrast as hard requirements — AD-12 covers primitive a11y; reduced-motion/visibility-gating for feed animation (also FR-12) has no line. Likely lives in DESIGN/EXPERIENCE.md; the spine should say so rather than leave NFR-9 dangling from `binds:`.
- **NFR-10:** RPC failover is present (seed text + diagram) but only as a label; "every SDK instance with watches closed with bounded shutdown wait" and "order expiry as dead-man's switch sized just past the requote interval" are unstated (the latter is half-carried by AD-3's headroom formula).
- **§12 Cost:** LLM spend bounded per-user/day with degrade-to-model-only — no home (Baku's capability-map row cites only AD-6/AD-7).
- **§A Config:** runner `DRY_RUN` flag (also FR-32's DRY_RUN consequence) unmentioned in AD-8.
- **OQ-3's other half:** AD-11 resolves the *design* half (attribution hook — correct); the PRD assigned "verify feasibility during architecture" — the spine punts verification without assigning an owner/phase. Say where it lands (build phase 1 alongside OQ-10 would do).

### F-8 · OK-with-note — §I build sequence and the demo-critical path are absent by design, but nothing hands them off

The spine (correctly) carries no sequencing; but PRD §10.1 marks FR-1…11 as "the demo-critical path" and §I is a locked de-risk ordering. Neither is referenced even in `binds`/companions, so the epics phase could legitimately order work any way it likes. AD-5 actually *changes* §I's coupling (session keys now require contracts — consistent with §I item 5, worth stating). Add one line pointing epics at §I and naming FR-1…11 as the path everything else may not break.

---

## Checklist verdicts

| Item | Verdict |
| --- | --- |
| NFR-1 | OK — AD-7 |
| NFR-2 | OK — AD-3 (but see F-4 on canon scope) |
| NFR-3 | Partial — `marketId` convention OK; window-scoped history queries dropped (F-4) |
| NFR-4 | Partial — AD-6 + zod conventions OK; money-figures-from-state rule dropped (F-4) |
| NFR-5 | Partial — push-preference safely deferred; p95 budget ungoverned (F-7) |
| NFR-6 | OK — AD-8 + AD-10 + contract designs |
| NFR-7 | Partial — AD-4 strong; sponsorship-allowlist/batch rule ungoverned (F-3) |
| NFR-8 | Partial — zero-env + test harness OK; `/dev` fixtures + doctor dropped (F-2) |
| NFR-9 | Thin — delegated to UX docs implicitly, not explicitly (F-7) |
| NFR-10 | Partial — failover present as label; shutdown/dead-man clauses unstated (F-7) |
| §A stack | OK except layout supersession + relayer move unnoted (F-6); DRY_RUN dropped (F-7) |
| §B seam | OK — AD-1 is a faithful adoption |
| §C contracts | OK — AD-5/AD-10 consistent; SESSION extension needs FR-29 restatement (F-1) |
| §D canon | Partial — bound to writes only (F-4) |
| §I sequence | Absent with no handoff (F-8) |
| Zero-env quickstart | OK — AD-7 + config convention |
| /dev fixtures | **Dropped** (F-2) |
| Seed liquidity | OK — seeder-maker actor + AD-4 + map row |
| Gasless claims (FR-3) | Partial — actor exists, mechanism + allowlist rule ungoverned (F-3) |
| Sponsorship allowlists | **Ungoverned** (F-3) |
| RPC failover | Present as label only (F-7) |
| Demo-critical path | No handoff (F-8) |
| OQ-3 | Design half OK (AD-11); verification half unowned (F-7) |
| OQ-5 | Mechanism sound; PRD-mandated funding-surface consequence dropped (F-1) |
| OQ-7 | OK — AD-7 consistent with FR-25's losable-store constraint |
