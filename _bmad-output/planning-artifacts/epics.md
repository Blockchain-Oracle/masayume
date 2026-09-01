---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-sommina-events-2026-08-31/prd.md
  - _bmad-output/planning-artifacts/prds/prd-sommina-events-2026-08-31/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-sommina-events-2026-09-01/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-sommina-events-2026-09-01/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-sommina-events-2026-09-01/EXPERIENCE.md
---

# Masayume - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Masayume, decomposing the requirements from the PRD, UX Design contract, and Architecture spine into implementable stories. Ordering follows the PRD addendum §I build sequence: the demo-critical path first. Story ACs cite the governing contracts. **Citation legend:** FR-n / NFR-n / UJ-n / OQ-n / SM-n / PRD §n → the PRD; addendum §A–§J → the PRD addendum; canon #n → the 17-rule gotcha canon (addendum §D); AD-n → the architecture spine (whose Consistency Conventions also define the named conventions: DB-ownership, parlay-math, Approvals, Time); UX-DRn → this document's UX Design Requirements; DESIGN.md §… / EXPERIENCE.md §… → the UX spines; AR-n → this document's Additional Requirements. **Personas** (from PRD §3.3): Dayo — crypto-curious first-timer; Ada — feed-native tap-trader; Tunde — DeFi skeptic; Maria — tilt-prone bettor; Kenji — data-driven trader; Lara — parlay rider; Sam — cautious delegator; Nia — Telegram-native bettor.

## Requirements Inventory

### Functional Requirements

- FR-1: Wallet connect with one-click Somnia Shannon network setup; wrong-chain state blocks all writes honestly.
- FR-2: In-app tUSDC faucet; zero-STT detection before signing with fallback faucet routing; allowance absorbed into first-bet flow.
- FR-3: Gasless claim path (signRedeemAuth → relayer pays gas, payout to owner only); sponsorship = claims/exits + listed zero-capital actions only.
- FR-4: Session-key tap-trading behind an explicit capability-receipted grant; popup-free within caps; revocable; expires; Vault-funded surface presented honestly.
- FR-5: Honest money display — one wallet-spendable headline; labeled pool rows (Vault, order escrow, venue payout credit); last-good + stale on failed reads.
- FR-6: Live market browser with cadence lanes derived from live intervalSec; between-rounds placeholders; volume/trade count on every row; plain-words view; strike-0 filter with counted disclosure.
- FR-7: Hero market chart-as-ticket: frozen opening line (explicit pending state), settlement-basis price source named, urgency countdown, distance readout, top-of-book depth, deep links ?m=&dir=.
- FR-8: Stake-first ticket with real-book quotes for actual size (never midpoint), odds ¢/$1 clamp, admissibility band, min-stake floor, balance-scaled chips, visibly stale quotes.
- FR-9: Guarded order placement — IOC + re-quote at click + cadence-scaled cost cap; no-entry buffer with auto-advance; on-chain status gate; receipt checked.
- FR-10: Verdict moment — 正夢/逆夢/void stamps, Receipt attached, one-tap share.
- FR-11: Claim-all plate — sweeps finalized incl. voids (both sides), batched per chain support, sum net of on-chain settlement fee, persistent until claimed.
- FR-12: Vertical snap Reels feed of live markets + takes; settle-in-place; visibility-gated work; first-use swipe hint.
- FR-13: Inline tap-to-bet from Reels with full ticket guards; take-the-other-side pre-fill.
- FR-14: Take composer — side+confidence+window+caption ≤240; backed = post-only order at stated probability (cross absorbed and re-offered); backed-resting vs backed-filled provable states; resting escrow visible + cancelable; expired-unfilled honest terminal state.
- FR-15: Share cards + dynamic OG images; open-position cards use conditional IF-IT-LANDS framing + absolute UTC only.
- FR-16: Open positions with live PnL (DOWN mark = 1−P(up)); settled-unclaimed shows claimable; keyed by marketId.
- FR-17: Honest history labels — settled at oracle / closed early / voided; claim time ≠ print time; unmatched rows skipped and counted.
- FR-18: FIFO realized PnL in bigint; split redemptions grouped; only fully-closed rows in net; losses synthesized from finalized markets.
- FR-19: CSV export summing to displayed totals; fill log in TradeRow-compatible shape from day one.
- FR-20: Edge analytics — ROI, win rate, profit factor (null before first loss), expectancy, drawdown, streaks, equity curve, time-of-day buckets, payoff shape, ≥5-settled readout gate, client-side provenance note.
- FR-21: Per-round Receipts — fill tx(s), settlement tx, Oracle Graph deep link; audit affordance everywhere; degrades to raw tx links.
- FR-22: Un-fakeable /stats — provenance query per metric, calibration chart, adoption-vs-capability split with published house wallets, partial-scan labeling, live-activity feed.
- FR-23: Baku quantitative Read — side or sit-out + one honest reason + the disproving risk; snapshot-grounded numbers only; band violations = sit out; stale feed = blind state; one-sided book = single-quote bound; act-on-it card.
- FR-24: The Brake — tilt detection (tunable defaults), Daily Stop per-wallet server-authoritative across all betting surfaces, midnight-local reset, honest refusal labels.
- FR-25: Baku memory — real prior-session facts only; failures degrade to memory-less Reads.
- FR-26: Banzuke — FIFO over deduped events oldest-first, loss synthesis, window filter on close time, unmatched disclosed, partial labeled, house excluded/labeled, You row pinned.
- FR-27: Badges — on-chain-derivable criteria only, no admin fiat, min-sample win-rate badges, win rate never ranks.
- FR-28: Vault deposit/withdraw — owner-only withdraw, no beneficiary parameter anywhere, add-only creditFor.
- FR-29: Delegated grants per Vault — Strategy + Executor + Session types, independent in-contract Caps, deposit+subscribe composed, instant pause with positions remaining the user's.
- FR-30: No-divert agent trading — compromised runner key can at worst open in-cap positions for rightful owners; auditable events.
- FR-31: Permissionless settlement crank; liveness never becomes custody.
- FR-32: House strategy runners — decision envelope + real-fill records, DRY_RUN mode, re-derived health, why/why-not feed with idle heartbeats.
- FR-33: Parlay builder — live combined odds from on-chain book read at open, correlation surcharge (asset/oracle OR expiry union), margin, min-combined floor, one-sided-book refusal, future-expiry legs only.
- FR-34: Pre-funded payout escrow ≥ max payout; refusals at quote on insolvency or risk caps (aggregate, per-ticket, per-expiry); house-seeded Reserve v1.
- FR-35: Permissionless idempotent leg resolution; first-loss instant kill naming the leg; claim pays owner; grace-period void refund.
- FR-36: Telegram account linking via signed proof; CAN/CANNOT capability receipt; identity never from message content.
- FR-37: Bet by message — confirm-before-execute with window/odds/cost; all ticket guards + Daily Stop; idempotent dedup (no double-bet); cap refusals name the cap; verdict postbacks with Receipt.
- FR-38: Landing — live ticking market, manifesto, stack table, custody-rail proof diagram, observer-safe rendering, real-tx proof links.
- FR-39: On-chain waitlist — sponsored one-signature join, rank, Founder badges (first 100), on-chain referral attribution.
- FR-40: Close a position early — real-proceeds quote, IOC with min-proceeds cap, "closed early at live price" label, honest no-exit state.
- FR-41: EC MCP server + agent API — external agents read markets/quotes and receive unsigned txs through the one chain port; no key custody. (Added by Abu's decision 2026-09-01, resolving OQ-9.)

### NonFunctional Requirements

- NFR-1: Chain-truth integrity — no DB authoritative for chain state; server stores hold social/copilot/ops data only.
- NFR-2: Write-path safety — status gate, receipt checks, expiry always set, dust prevented, idempotent money movers, actual-fill accounting; 17-rule canon binding.
- NFR-3: Identity keying — marketId/symbol everywhere, never pool address; window-scoped history queries.
- NFR-4: Data hygiene — zod at money boundaries, null≠0 last-good, TTL+dedup caches, visibility-gated polling, lossy sources drive counts only.
- NFR-5: Performance & liveness — quote p95 ≤1.5s; push-preferred (Data Streams/reactivity) with polling floor; on-screen-only animation; reduced motion.
- NFR-6: Liveness never becomes custody — permissionless fallbacks, exits stay open, time-gated refunds.
- NFR-7: Key & secret handling — server-side LLM keys, one key one writer, per-service key separation, distinct wallets per economic role, whole-batch allowlist validation, capital intake never sponsored.
- NFR-8: Judge-proofing & verification — zero-env run, /dev fixtures, /dev/doctor, per-claim tx proofs, honest-limitations README, dry/wet/leak-check harness, network-free CI invariants.
- NFR-9: Accessibility — honest-state discipline as a11y, reduced motion, contrast floors.
- NFR-10: Operational resilience — ≥2 RPCs rotate-on-failure, error-diagnosis mapping, bounded watch shutdown, dead-man order expiry.

### Additional Requirements

- AR-1 Architecture paradigm binding: hexagonal around one chain port; AD-1..AD-16 govern all stories (dependency direction, two-lane Submitter, integer numbers incl. bps probabilities, wallet-per-role, unified Vault grants, Reading<T> envelope, optional-Postgres degradation table, single ops service of single-writer actors, Daily Stop service topology, on-chain market identity, attribution hook, two token surfaces, one error map, I/O boundary, claim protocol, SIWE + internal auth).
- AR-2 No starter template: brownfield-adjacent scaffold exists (web/ = Next 16.3.4 + React 19.2.8 + Tailwind v4); Epic 1 Story 1 converts the repo to the pnpm-workspace monorepo seed (packages/core, packages/markets, packages/db, services/ops, contracts/) rather than greenfield-generating.
- AR-3 Contracts: Foundry; EventVault (typed grants), ParlayReserve (risk caps, in-tx book read), Waitlist; generated addresses module; lockstep deploy ordering; invariant-named forge tests; shared golden vectors with core (parlay math, caps.simulate).
- AR-4 Ops service (Railway): actors = seeder-maker, oracle-follow runner, relayer, TG executor (grammY), settlement-watcher/claim-sweeper, Stop service, watchdog (TG admin alerts); local intent journals; why-string logging.
- AR-5 Deployment: web → Vercel; ops → Railway; Neon Postgres (optional local / required prod); env via zod-parsed env.ts with baked testnet defaults; both testnet RPCs configured.
- AR-6 Verification infra: CI network-free invariants script (status enum, taker-IOC, headroom, address/SDK drift, AD-3/AD-14 greps, event-ABI pool-address check); integration harness dry gate → wet gate (distinct counterparty wallet) → open-order delta leak check; quote-path p95 perf smoke.
- AR-7 Build-phase-1 empirical checks (PRD OQ-10 + AD-10): verify getOpeningPrices vs oracle settlement reference on settled rounds; pin the venue's canonical on-chain market id field.
- AR-8 Submission deliverables (PRD §10.3): demo video + /demo route, /pitch route, SDK feedback report, honest-limitations README, seed-liquidity script, seeded house Takes.

### UX Design Requirements

- UX-DR1: Implement the two token surfaces (AD-12): Tailwind v4 @theme primitives (colors/spacing/radius/type from DESIGN.md frontmatter) + tokens.css component-tier custom properties; CI grep bans raw DESIGN literals in components.
- UX-DR2: Load the four-face type stack (Archivo, Instrument Sans, IBM Plex Mono, Noto Serif JP via next/font) with the numbers law: every money/odds/countdown/hash figure in Plex Mono tabular-nums.
- UX-DR3: Build the honest-state machine components: loading / stale-last-good (staleness tick, never 0) / empty-with-explanation / blocked-with-reason (blocker as CTA label) / error (on-brand boundary copy) — as shared primitives all surfaces consume.
- UX-DR4: Ticket component per DESIGN.md anatomy: side segments (profit/loss washes), stake input (empty on hero, pre-filled on context entries), quick chips ¼/½/¾/Max, quote strip with requoting tick, blocked-CTA labeling, 52px CTA.
- UX-DR5: Verdict stamp system: 正夢 gold / 逆夢 neutral ink / 無効 muted with romaji+translation sublines, −4° press, stamp-hero type; P&L figure beside the stamp carries the only green/rose.
- UX-DR6: Cream Receipt object: cream in dark mode, gold strip, dotted-leader mono ledger rows, perforated stub edge, the app's single drop shadow, "Only you can cash out." footer, "Don't trust it. Click it." caption on every tx link.
- UX-DR7: Capability receipt component: CAN/CANNOT ruled columns, struck-through mono verbs, "No such function." kill-line — shown at every delegated-power grant.
- UX-DR8: Custody-rail proof diagram (animated SVG, observer-safe): sealed withdraw door, struck-through verbs, attack packet dying at the seal — reused on landing, strategy cards, TG linking.
- UX-DR9: Reel card + snap feed: 460px portrait cards, gold-dim live hairline, settle-in-place verdict swap, first-use swipe hint, off-screen work stopped.
- UX-DR10: Chrome: price ticker (32px, direction ticks, freeze-with-tick on stale), floating pill bottom-nav with safe-area clearance, Baku dock (gold dot only when a Read is ready), global Claim-all plate (gold-wash, collapses to pill badge).
- UX-DR11: Balance plate + pool rows (venue payout credit rename), Banzuke single-column ledger rows with pinned You row, achievement badge chips with tap-to-see-criterion.
- UX-DR12: Parlay slip: mono leg ledger, escrow line on gold-wash with verify link, first-loss strike + 逆夢 slip stamp.
- UX-DR13: Strategy card: info-dot health (re-derived), why/why-not mono log, worked-example sizing sentence, Caps editor.
- UX-DR14: Countdown component: tabular mono, gold under 60s with the one-glow law, "Settling…" at zero, SVG ring variant.
- UX-DR15: Voice/microcopy contract: EXPERIENCE.md's Do/Don't strings and named strings (error boundary, Brake talk-down, blind state, backed terminal state, composer permanence) implemented as a copy module, not inline literals.
- UX-DR16: Accessibility floor: 44px targets, focus rings (gold 2px), color-independence (side/PnL/badges always carry words), screen-reader verdict/claim announcements, reduced-motion variants.
- UX-DR17: Toasts (neutral success, echo-never-only-record), wrong-network banner with one-tap switch, session-key manager chip ("tap-trading on") + settings surface.
- UX-DR18: Share-card renderer (1200×630 + 1080×1920) and dynamic OG route per DESIGN spec; open-call conditional framing.
- UX-DR19: /demo scrolly walkthrough (tx-proof grid, embedded video) and /pitch keyboard deck route (no live-data imports).
- UX-DR20: /dev/* fixture pages covering every card/receipt/modal state from canned data + /dev/doctor preflight surface.
- UX-DR21: Deep-link grammar (?m=&dir=, /reels?m=, /waitlist?ref=) with dead-window successor resolution; retired routes redirect.
- UX-DR22: Telegram bot conventions: confirm-before-execute message shapes, capability receipt on link, verdict postbacks with Receipt links, honest refusals naming caps/stops.

## FR Coverage Map

| FR | Epic | | FR | Epic | | FR | Epic | | FR | Epic |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-1 | 1 | | FR-11 | 1* | | FR-21 | 4 | | FR-31 | 6 |
| FR-2 | 1 | | FR-12 | 2 | | FR-22 | 4 | | FR-32 | 6 |
| FR-3 | 8 | | FR-13 | 2 | | FR-23 | 5 | | FR-33 | 7 |
| FR-4 | 6 | | FR-14 | 2 | | FR-24 | 5 | | FR-34 | 7 |
| FR-5 | 1 | | FR-15 | 2 | | FR-25 | 5 | | FR-35 | 7 |
| FR-6 | 1 | | FR-16 | 3 | | FR-26 | 3** | | FR-36 | 8 |
| FR-7 | 1 | | FR-17 | 3 | | FR-27 | 3 | | FR-37 | 8 |
| FR-8 | 1 | | FR-18 | 3 | | FR-28 | 6 | | FR-38 | 4 |
| FR-9 | 1 | | FR-19 | 3 | | FR-29 | 6 | | FR-39 | 4 |
| FR-10 | 1 | | FR-20 | 3 | | FR-30 | 6 | | FR-40 | 3 |
| FR-41 | 9 | | | | | | | | | |

\* FR-11 ships wallet-gas in Epic 1; the gasless upgrade is Epic 8. ** FR-26 sits in Epic 3 because the Banzuke shares the ledger/fold engine (file-churn rule). *(Epic 9 otherwise carries no FRs: beyond FR-41 it delivers NFR-8's judge ring, UX-DR19/20, and AR-8's submission deliverables.)*

## Epic List

### Epic 1: The Golden Path — connect, bet, settle, claim
A first-time wallet goes from zero to a claimed win in one sitting (UJ-1): connect + network, faucet, cadence lanes, hero chart-as-ticket, guarded stake-first betting, the Verdict moment, and the Claim-all plate — end-to-end on live testnet. Includes the foundation seed (monorepo conversion, token surfaces, chain port, core engines) and the build-phase-1 empirical verifications (OQ-10 reference basis, AD-10 on-chain id field).
**FRs covered:** FR-1, FR-2, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11

### Epic 2: The Feed — Reels & Takes
Users scroll live windows like a feed, bet inline without leaving it, post backed Takes that rest as real orders, and share stamped outcome cards (UJ-2). Includes the optional-Postgres bootstrap and SIWE identity (first wallet-keyed server writes).
**FRs covered:** FR-12, FR-13, FR-14, FR-15

### Epic 3: Money Truth — Portfolio, History, Edge & the Banzuke
Users see honest accounting of everything they've done: live PnL, labeled history, FIFO realized PnL with loss synthesis, CSV export, edge analytics, early exit, and the leaderboard built on the same engine (UJ-5). Consolidated because Banzuke and portfolio share the ledger/fold core (file-churn rule).
**FRs covered:** FR-16, FR-17, FR-18, FR-19, FR-20, FR-26, FR-27, FR-40

### Epic 4: The Proof Layer — Receipts, Stats, Landing & Waitlist
Anyone — especially a skeptic (UJ-3) — can audit every settlement to the oracle's own graph, verify every stat on-chain, absorb the pitch on the landing page, and join the on-chain waitlist.
**FRs covered:** FR-21, FR-22, FR-38, FR-39

### Epic 5: Baku & the Brake
Users get a quantitative Read that knows when to say "sit out," a Brake that catches tilt, and a Daily Stop that holds across every betting surface (UJ-4). Includes the minimal ops-service bootstrap (Stop service + authed internal HTTP) and the fair-value model wiring.
**FRs covered:** FR-23, FR-24, FR-25

### Epic 6: Vaults, Agents & Tap-Trading
Users delegate within hard caps under the no-divert guarantee: EventVault with typed grants, house strategy runners with live why-feeds, permissionless cranking, and popup-free session-key betting (UJ-7, part of UJ-2). Includes the seeder/maker actor (live books) and the ops watchdog.
**FRs covered:** FR-4, FR-28, FR-29, FR-30, FR-31, FR-32

### Epic 7: Streak Parlays
Users compose multi-leg all-or-nothing tickets priced from the on-chain book, with the payout escrowed at open and honest first-loss kills (UJ-6). ParlayReserve contract + builder + slip.
**FRs covered:** FR-33, FR-34, FR-35

### Epic 8: The Chat Rail & Free Claims
Users bet from Telegram through the bounded Executor with a capability receipt (UJ-8), get Verdict postbacks, and claim winnings gas-free through the relayer (AD-15 claim protocol). Grouped because executor, relayer, and settlement watcher share the ops actor infrastructure.
**FRs covered:** FR-3, FR-36, FR-37

### Epic 9: The Judge Ring & Submission
A judge clones, runs with zero env, and absorbs the whole story in ten minutes (UJ-9): /dev fixtures + doctor, /demo scrolly, /pitch deck route, seed-liquidity + seeded-takes scripts, honest-limitations README, SDK feedback report, CI invariants, and demo-video support.
**FRs covered:** FR-41 (plus NFR-8, UX-DR19/20, AR-8 submission deliverables)

## Epic 1: The Golden Path — connect, bet, settle, claim

*Goal as stated in the Epic List (canonical). Realizes UJ-1; includes the foundation seed and the two empirical verifications (OQ-10, AD-10).*

### Story 1.1: Boot the monorepo and run with zero env

As a judge (or new contributor),
I want to clone the repo and run the app with zero configuration,
So that evaluating Masayume never stalls on setup.

**Acceptance Criteria:**

**Given** a fresh clone with pnpm installed
**When** I run install + dev
**Then** the workspace resolves packages/core, packages/markets, packages/db, services/ops, contracts/, and web/ per the spine's structural seed (AD-1 layer map)
**And** web/ boots against Somnia Shannon testnet using baked defaults from a zod-parsed env.ts with no .env present (AD-7 zero-env law, NFR-8).

**Given** the dependency rules in the spine
**When** CI runs the network-free invariants script
**Then** it fails on any import of @somnia-chain/markets-sdk outside packages/markets (AD-1), any writeContract/sendTransaction outside packages/markets (AD-3), and any banned wagmi read-hook in product code (AD-14)
**And** the pinned SDK version 0.28.1 and module addresses are asserted against drift.

### Story 1.2: Design foundation — tokens, type, honest-state primitives

As a user,
I want every screen to speak one visual and behavioral language,
So that the product reads as calm, precise, and honest from the first paint.

**Acceptance Criteria:**

**Given** DESIGN.md's frontmatter tokens
**When** the two token surfaces are built
**Then** primitives land in Tailwind v4 @theme (theme.css) and component-tier tokens in tokens.css custom properties mirroring the `components:` block (AD-12, UX-DR1)
**And** a CI grep fails on any raw DESIGN hex/px literal in component code.

**Given** the four-face type stack loaded via next/font
**When** any money figure, Odds, countdown, address, or hash renders
**Then** it renders in IBM Plex Mono with tabular-nums — the numbers law (UX-DR2); stamps render in Noto Serif JP with romaji + translation sublines.

**Given** the honest-state machine (UX-DR3) and voice contract (UX-DR15)
**When** shared primitives (loading / stale-last-good / empty / blocked / error, toasts, buttons, inputs, badges) are built
**Then** blocked controls render the blocker as their label, stale data keeps last-good with a staleness tick (never 0), empty states explain themselves, the error boundary uses the named copy, and all contract strings live in one copy module — not inline literals
**And** accessibility floor holds: 44px targets, gold focus rings, color-independence, reduced-motion variants (UX-DR16, NFR-9)
**And** the app chrome ships: floating pill bottom-nav with safe-area clearance and the numbered-section header rhythm (UX-DR10, DESIGN Layout).

### Story 1.3: The chain port — reads, watches, lifecycle

As a user,
I want every market number on screen to be live, venue-scoped, and honestly stale when the chain is unreachable,
So that what I see is always chain truth or labeled as aging.

**Acceptance Criteria:**

**Given** packages/markets wrapping SDK 0.28.1
**When** MarketsProvider serves live markets, books, prices, and positions
**Then** every read crosses the port as Reading<T> ({ok,value,asOf,stale} — AD-6), keyed by branded MarketId (NFR-3), scoped by venueId read off a live market row (canon #8), with both testnet RPCs configured rotate-on-failure (NFR-10)
**And** watches feed a TanStack Query v5 cache watch-first with visibility-gated polling fallback; a killed network flips reads to stale without zeroing values.

**Given** core/lifecycle
**When** phase(market, now) is computed
**Then** it returns the single enum (upcoming | pendingOpeningPrint | trading | noEntryBuffer | locked | settledUnclaimed | finalized | voided) used by every surface (AD-1), with the no-entry buffer from the headroom formula (canon #9)
**And** `now` derives from a chain-offset-corrected clock (offset sampled against block time at sync), never raw device time — a skewed client must not bet into locked Windows or refuse tradeable ones
**And** nextWindow(market) resolves successor Windows for auto-advance and dead-deep-link redirects; when no successor exists (cadence retired), the Ticket parks in "Between rounds" keeping Side + Stake and dead deep links redirect to /markets with a one-line note.

### Story 1.4: Protocol verification spike

As the builder,
I want the two undocumented protocol facts pinned against live testnet before features depend on them,
So that Baku's model basis and our contracts' market identity are facts, not guesses.

**Acceptance Criteria:**

**Given** settled markets on the live venue
**When** getOpeningPrices is compared against getMarketResolution.openingAnswer.numericValue across ≥20 settled rounds (PRD OQ-10)
**Then** the match/mismatch result and observed book-vs-reference behavior are written to context/ as a dated note (the reference-basis note downstream stories cite), and the Fair Value model's reference source is chosen from evidence
**And** if disagreement is chronic, the demo-risk noted on FR-23 is escalated to Abu with the measured data.

**Given** the venue contracts (BinaryMarketsModule / OutcomeToken6909)
**When** the canonical on-chain market identifier field is verified (AD-10 candidate: the id under yesId/noId)
**Then** the exact field is pinned in the addresses/identity module with the MarketId bijection owned by packages/markets
**And** the finding is recorded for the contract stories (Epic 6/7) whose storage keys depend on it.

### Story 1.5: Connect, fuel, and approve without a manual

As Dayo (crypto-curious, MetaMask, no Somnia history),
I want to connect, add the network, get test funds, and approve spending in guided taps,
So that I reach my first bet without reading documentation.

**Acceptance Criteria:**

**Given** a wallet with no Somnia Shannon configured
**When** I tap Connect
**Then** I reach a connected right-chain state in ≤2 prompts (FR-1) via RainbowKit with the custom somniaShannon chain, wagmi scoped to wallet session only (AD-14)
**And** on the wrong chain, the wrong-network banner names the fix with a one-tap switch while every write control renders blocked-with-reason (UX-DR17).

**Given** a connected wallet with no tUSDC
**When** the app offers the Faucet and I tap it
**Then** tUSDC mints via a client-signed call to the venue's token faucet (≤10,000/call — ungated by us, zero-env-safe) and the balance updates without reload (FR-2); every faucet refusal (venue cap, balance-threshold no-op, dry faucet) renders blocked-with-reason, never a silent no-op
**And** gas sufficiency is checked as balance ≥ estimated cost with a safety factor — not merely nonzero — before any signing, routing shortfalls to STT faucets with fallbacks listed, never a raw revert (FR-2, AD-13's error map translating the out-of-STT trap).

**Given** my first bet needs an ERC-20 allowance
**When** the first-bet flow runs
**Then** the approval is absorbed into it with one honest sentence — never a surprise mid-flow signature — per the spine's Approvals convention (one law for every spender; a later bet exceeding the remaining allowance absorbs the re-approval the same way, pre-checked before send) (FR-2).

### Story 1.6: Browse live windows by cadence

As a user,
I want live markets grouped into cadence lanes with real volume showing,
So that I can pick my rhythm and see the venue is alive.

**Acceptance Criteria:**

**Given** live venue markets
**When** /markets renders
**Then** lanes derive from live intervalSec values (never hardcoded), an empty lane shows "Between rounds" with the next start (copy scales from seconds up to a day), my cadence choice stays pinned, and every row shows live volume + trade count (FR-6)
**And** fixed-strike Markets are excluded with a counted disclosure (this is FR-6's strike-0 filter — one filter, two names); the persistent price ticker renders per UX-DR10 with direction ticks and freeze-with-tick on stale.

**Given** the plain-words view
**When** I toggle it
**Then** each Market restates as a yes/no question derived from asset + intervalSec + opening price (never parsed question text) with Yes/No taps deep-linking into the Ticket (FR-6); a Market in pendingOpeningPrint renders pending phrasing ("waiting for the opening print"), never an invented level
**And** deep links ?m=&dir= reproduce hero + side state; a dead-window link resolves to its successor with a one-line note (UX-DR21).

### Story 1.7: The hero market — chart as ticket

As a user,
I want the featured window as a live chart I can bet from directly,
So that reading the market and acting on it are one motion.

**Acceptance Criteria:**

**Given** a live market in the hero
**When** the chart renders
**Then** the opening line is frozen once printed; before the print resolves, line and distance readout show an explicit dashed pending state — never a guessed level (FR-7)
**And** the chart and model read the settlement-basis price source (per the 1.4 spike) and the UI names that source; top-of-book depth shows for both sides.

**Given** the countdown
**When** less than 60s remains
**Then** digits and ring turn gold with the one-glow law; at zero it reads "Settling…" — never negative, never frozen (UX-DR14)
**And** the distance readout states what movement each side needs ("needs +$42 for UP").

### Story 1.8: Place a guarded bet from the stake-first Ticket

As a user,
I want to enter a stake and get exactly the deal I was shown or a named refusal,
So that betting never surprises me.

**Acceptance Criteria:**

**Given** the Ticket per UX-DR4 (empty Stake on hero; balance-scaled chips; quote strip)
**When** I enter a Stake
**Then** cost/contracts/payout derive from a real order-book quote for my actual size — never a midpoint (FR-8)
**And** odds render in ¢/$1 clamped to [1,99]; quotes debounce ~350ms, requote ~12s, and are visibly stale otherwise
**And** a thin or one-sided book renders "no liquidity at this size" blocked state, and a partial-depth quote names the fillable size — never a fabricated quote
**And** entry blocks honestly outside the admissibility band (edges inclusive: admissible iff 2% ≤ p ≤ 97%, pinned by a golden test), below the min-stake floor, during pendingOpeningPrint, or inside the no-entry buffer — with the blocker as the CTA label.

**Given** I confirm the bet
**When** the Submitter's order lane runs (AD-3)
**Then** it gates on on-chain status===1, re-quotes at click, and sends IOC with expireTimestampNs from the headroom formula
**And** cost caps at fresh-quote × the interval-scaled buffer (clamped to its endpoint values outside the interpolation range — never extrapolated below 1×), so a worse fill is impossible
**And** the receipt is checked (assertTxOk), intent journals before send, outcomes book from actual fills, and a send that times out with no digest is never auto-retried — the pipeline reconciles via nonce/open-order scan first (FR-9, NFR-2, AD-3)
**And** the Daily Stop gate step runs in the pipeline (allow-all until Epic 5's Stop service exists — the seam is present from day one), and the order-attribution hook (builder tag, no-op v1) sits in the lane per AD-11
**And** in the buffer, the Ticket auto-advances to the next window keeping Side + Stake (FR-9).

### Story 1.9: The Verdict moment

As a user,
I want settlement to arrive as an unambiguous stamped verdict,
So that a win feels like 正夢 and a loss is a fact, not a scare.

**Acceptance Criteria:**

**Given** my market settles while I watch
**When** the Verdict renders
**Then** win stamps 正夢 in gold, loss stamps 逆夢 in neutral ink, void stamps 無効 with "no reliable print — both sides pay 0.5"; romaji + translation sublines always present; the P&L figure beside the stamp carries the only green/rose (FR-10, UX-DR5)
**And** the Verdict card carries the Receipt links and a one-tap share affordance; screen readers announce the Verdict (UX-DR16)
**And** a wallet holding both Sides of one settling Market gets one card stamping the net PnL, with both legs listed — never simultaneous win and loss cards.

### Story 1.10: Claim everything in one tap

As Kenji,
I want one plate that sweeps every claimable payout including voids,
So that winnings never sit stranded.

**Acceptance Criteria:**

**Given** finalized markets for my wallet
**When** the Claim-all plate computes
**Then** core/claims enumerates claimables via listBinaryMarkets Finalized discovery (canon #10) — wallet redeemables and, once the Vault exists, Vault credits as distinctly labeled withdrawal rows (AD-1) — includes voids as both-side redemptions rendered as one row with two states, and shows the sum net of the on-chain settlement fee read at execution time (FR-11, canon #15)
**And** the plate surfaces globally when nonzero, collapses to a pill badge elsewhere, and persists a claim badge until claimed.

**Given** I tap Claim all
**When** redemptions submit (wallet-gas in this epic; batching per chain support)
**Then** each redemption uses explicit outcomeIdx (canon #11), receipts are checked, and the success card is the cream Receipt object per UX-DR6 with settlement tx + Oracle Graph links
**And** multi-item claiming is honest about being one signature per redemption: a progress list ("claiming 2 of 4") with per-item outcomes, never one collapsed verdict
**And** the gasless upgrade (FR-3, AD-15) replaces the signing loop in Epic 8 without changing this surface's per-item contract.

### Story 1.11: One honest number for my money

As a user,
I want one spendable figure with every other pool labeled beneath it,
So that I always know what I can bet and where the rest lives.

**Acceptance Criteria:**

**Given** the balance plate (UX-DR11)
**When** it renders
**Then** the headline shows wallet-spendable funds only, rendered in data-hero mono; labeled rows show Vault, order escrow, and venue payout credit (the renamed venue per-pool vault balance, shown when nonzero with its spent-first note) — never silently summed (FR-5)
**And** a failed read keeps last-known-good at full ink with an "as of" tick — never 0, never a lying spinner (AD-6)
**And** a buy that would spend the venue payout credit first is reflected in the quote's funding note (FR-5).

## Epic 2: The Feed — Reels & Takes

*Goal as stated in the Epic List (canonical). Realizes UJ-2; the optional Postgres and SIWE identity bootstrap here.*

### Story 2.1: Server identity and the optional store

As a user,
I want my server-side actions bound to my wallet and the app to survive having no database,
So that social features are mine alone and judges can still run everything.

**Acceptance Criteria:**

**Given** packages/db (Drizzle + Neon)
**When** the takes table ships
**Then** the schema file names web as its single writer (DB-ownership convention), stores bigints as text, and the app boots and runs with the DB absent — takes degrade to an empty-with-explanation feed (AD-7)
**And** the exhaustive degradation table is started in code as a checked registry (a schema table without a degradation row fails CI).

**Given** SIWE sign-in (AD-16)
**When** I authenticate
**Then** a signed message yields an httpOnly session; every wallet-keyed write verifies session wallet = target wallet; unauthenticated writes are refused with honest copy
**And** the session survives refresh and expires per config
**And** switching wallet accounts mid-session invalidates wallet-keyed queries and prompts re-sign-in — no surface renders one wallet's data under another's session.

### Story 2.2: Scroll the Reels

As Ada,
I want full-screen live windows and community takes snapping past,
So that markets feel like a feed, not a terminal.

**Acceptance Criteria:**

**Given** /reels (UX-DR9)
**When** I scroll
**Then** cards snap one-per-viewport (460px portrait, gold-dim live hairline), a first-time swipe hint shows until my first real scroll, and off-screen cards do zero animation and zero polling (FR-12, NFR-5)
**And** a market settling on-screen swaps the card in place to its Verdict state with the stamp.

**Given** the feed interleave
**When** takes exist
**Then** Take cards render between Market cards with caption, call chip, and backed badge; with no DB the feed is Market-cards-only and honest about it
**And** /reels?m= opens the feed at that market's card (UX-DR21).

### Story 2.3: Bet without leaving the feed

As Ada,
I want to tap UP/DOWN on any card and bet right there,
So that acting on a take is faster than doubting it.

**Acceptance Criteria:**

**Given** a live market card in the feed
**When** I tap a side
**Then** the inline Ticket opens pre-filled (context-carrying entry per the stake-prefill rule) and every FR-8/FR-9 guard applies identically — same Submitter lane, no second path (FR-13, AD-3)
**And** a card in its no-entry buffer shows "Between rounds" with the next window pre-armed — the tap is never dead.

**Given** someone's take card
**When** I tap "take the other side"
**Then** the Ticket opens pre-filled with the opposing Side of the same Window (FR-13); if that Window has settled or died, the tap resolves to its successor with the one-line note (the nextWindow rule), never a dead Ticket.

### Story 2.4: Post a Take that IS liquidity

As a user,
I want my call to be a post — optionally backed by a real resting order,
So that conviction is visible and matchable.

**Acceptance Criteria:**

**Given** the composer (FR-14)
**When** I post a Take (side + confidence + window + caption ≤240)
**Then** the permanence note is visible, the Take is stored via my SIWE session, and unbacked takes are visibly distinct
**And** backing places a post-only order at my stated probability through the order lane; a PostOnlyWouldCross rejection is absorbed and re-offered (crossing price or adjusted level) — never surfaced as an error (canon #14).

**Given** the composer targets a live Window
**When** that Window is inside its no-entry buffer or locked
**Then** backing is refused (or warned "this order will expire unmatched") — no escrow round-trips on a doomed post.

**Given** a backed resting order
**When** it rests, fills partially or fully, or expires
**Then** the badge shows the provable state — BACKED·RESTING hollow / BACKED·FILLED solid, each with a verify link; a partial fill renders BACKED·FILLED with filled and still-resting amounts both visible
**And** resting escrow is visible to me and cancelable in one tap (tracked-then-sweep per canon #16), and expired-unfilled shows "call stood, money never matched" (FR-14).

### Story 2.5: Share the moment

As a user,
I want stamped share cards and live link unfurls,
So that outcomes travel with proof attached.

**Acceptance Criteria:**

**Given** a Verdict, Take, or (later) Parlay outcome
**When** I share
**Then** a server-rendered card (1200×630 and 1080×1920) carries the stamp vocabulary, the figure in mono, and the Receipt link (FR-15, UX-DR18); the renderer reads chain data only through the port (AD-14)
**And** a render whose chain read fails with no prior good value falls back to a branded numberless card at HTTP 200 — never an error image, never an invented number
**And** open-position cards use strictly conditional IF-IT-LANDS framing with absolute UTC settle times — never win language or relative countdowns (FR-15).

**Given** a market/take URL
**When** it unfurls
**Then** the OG image shows live probability at render; a settled target renders its Verdict state, not a dead live-card (UX-DR21).

## Epic 3: Money Truth — Portfolio, History, Edge & the Banzuke

*Goal as stated in the Epic List (canonical). Realizes UJ-5.*

### Story 3.1: One ledger, one fold

As a user,
I want my entire trading history assembled once and folded one way,
So that every money surface agrees with every other.

**Acceptance Criteria:**

**Given** MarketsProvider.getLedger(wallet) (AD-1)
**When** history is assembled
**Then** it is the only history feed — complete, deduplicated, oldest-first, window-scoping handled internally per canon #10/#17 — and no surface composes its own history query
**And** the core/pnl fold does FIFO lot-matching in bigint with proportional cost allocation, groups split redemptions, counts only fully-closed rows toward net, and synthesizes losses from finalized markets (losers emit no redemption event — FR-18)
**And** golden tests cover FIFO, loss synthesis, void handling, and unmatched-row skip-and-count (testing convention)
**And** the ledger interface is built to merge a second event source (EventVault beneficiary-attributed events, per AD-1) — Epic 6 plugs it in without changing the fold's contract; the interface and fold types accept it from day one.

### Story 3.2: Open positions with live truth

As Kenji,
I want my open positions marked against the live book,
So that unrealized PnL is real, not hopeful.

**Acceptance Criteria:**

**Given** open positions keyed by marketId (FR-16, NFR-3)
**When** the portfolio renders
**Then** uPnL = (mark − entry) × qty with DOWN marks as 1 − P(up), served as Reading<T> envelopes; a Market whose book goes empty or one-sided keeps the last-good mark with a stale tick (or shows "no live mark") — never an invented mid
**And** a settled-but-unclaimed position shows as claimable — moved out of live PnL and into the Claim-all plate.

### Story 3.3: History that tells the truth, exportable

As Kenji,
I want labeled history and a CSV that sums to what I see,
So that my records survive scrutiny and my own spreadsheet.

**Acceptance Criteria:**

**Given** closed rows (FR-17)
**When** history renders
**Then** rows are labeled settled-at-oracle / closed-early / voided; settledAtMs and expiryMs are distinct fields never conflated; unmatched rows are skipped and counted, never guessed into totals.

**Given** CSV export (FR-19)
**When** I export
**Then** every visible column plus tx hashes exports; the re-imported CSV sums to the displayed totals; fill logging uses the TradeRow-compatible shape from day one.

### Story 3.4: Exit early at the live price

As a user,
I want to sell an open position back into the book,
So that live PnL is actionable, not decorative.

**Acceptance Criteria:**

**Given** an open position with bid depth
**When** I close early (FR-40)
**Then** real proceeds are quoted for my actual size (FR-8 discipline), the order goes IOC with a min-proceeds cap through the order lane, and the history row labels "closed early at live price"
**And** a partial IOC fill books a closed-early row for the filled quantity while the remainder stays open and says so — the user is never told a position fully closed when it didn't
**And** with no bid depth I get the honest "no exit right now — your position still settles at expiry" state, never a fake quote.

### Story 3.5: Know your edge

As Kenji,
I want analytics that refuse to flatter me,
So that I learn what my trading actually is.

**Acceptance Criteria:**

**Given** /portfolio/edge (FR-20)
**When** it renders from the one fold's output
**Then** ROI, win rate, profit factor (null before the first loss, rendered as an em-dash — "does not invent"), expectancy, max drawdown, streaks, equity curve, time-of-day gain/loss buckets, and payoff shape display; the one-sentence readout refuses pattern claims with fewer than 5 settled rounds
**And** the page states its client-side provenance ("calculated in your browser — redeeming doesn't erase the ledger").

### Story 3.6: The Banzuke

As a user,
I want a leaderboard of exact realized PnL that can't be gamed,
So that rank means something.

**Acceptance Criteria:**

**Given** the same core fold (FR-26)
**When** the Banzuke computes
**Then** ranking uses FIFO over deduplicated events oldest-first, losses synthesized, window filter on close time with prior mints as cost basis, unmatched redemptions counted and disclosed, partial scans labeled partial
**And** house wallets are excluded or HOUSE-labeled per the published registry (AD-4), the You row pins regardless of rank, and rows render per UX-DR11's single-column ledger.

### Story 3.7: Badges no admin can grant

As a user,
I want badges that are provable facts,
So that flair is evidence.

**Acceptance Criteria:**

**Given** badge criteria (FR-27)
**When** badges compute and render
**Then** every criterion derives from public on-chain data with no admin-grant path; win-rate badges require and display their minimum settled sample ("70% · 14 settled"); win rate alone never ranks anything
**And** tapping a badge shows its criterion and the earning data (UX-DR11).

## Epic 4: The Proof Layer — Receipts, Stats, Landing & Waitlist

*Goal as stated in the Epic List (canonical). Realizes UJ-3 and UJ-9's proof needs.*

### Story 4.1: Receipts you can hand a skeptic

As Tunde,
I want every settled round to carry its full proof chain,
So that I can try to prove it's rigged — and fail.

**Acceptance Criteria:**

**Given** any settled position (FR-21)
**When** its Receipt renders
**Then** it carries entry fill tx(s), settlement tx, and the Oracle Graph deep link (prd.oracle.somnia.host per-question graph view), and the "audit this settlement" affordance appears on every Verdict and history row
**And** all URLs build through core/urls (one module, consumed by web + ops alike), and an unreachable oracle explorer degrades to raw tx links labeled as degraded.

**Given** the cream Receipt object
**When** it renders anywhere
**Then** it renders exactly per UX-DR6 / DESIGN.md §Components Receipt — one source of truth for its anatomy — with "Don't trust it. Click it." on every tx link.

### Story 4.2: Stats nobody can fake

As a judge,
I want every traction number paired with the query that produced it,
So that the metrics are checkable, not claimed.

**Acceptance Criteria:**

**Given** /stats (FR-22)
**When** metrics render
**Then** each metric shows its value plus the provenance query string returned as data by MarketsProvider (AD-14 — the page renders the GraphQL query text, never executes it), with adoption separated from capability: house wallets published and labeled, headline counts external-only (AD-4 registry)
**And** loss-inclusive accounting applies to every rate (FR-18's synthesis via the one fold), incomplete scans label the affected metric partial, and the calibration chart states its sample size.

**Given** the live-activity feed
**When** settlements and claims occur
**Then** rows appear with click-throughs to their txs, keeping the page visibly alive during judging.

### Story 4.3: A landing page that proves as it pitches

As a visitor,
I want the thesis, the trust story, and live reality on one page,
So that I understand Masayume before connecting anything.

**Acceptance Criteria:**

**Given** / (FR-38)
**When** it renders
**Then** the hero shows a real ticking market (no fake numbers anywhere), the manifesto and "composed, not bolted on" stack table render, and every proof claim links a real tx
**And** the custody-rail proof diagram ships as the flagship visual, exactly per UX-DR8 (its anatomy and reuse surfaces live there — one source of truth)
**And** every section renders even with animations/observers failed — a screenshot never catches a blank section (FR-38).

### Story 4.4: Join the waitlist on-chain

As a visitor,
I want to join with one free signature and climb by referring,
So that my early support is verifiable demand, not an email.

**Acceptance Criteria:**

**Given** the Waitlist contract (deployed via the addresses-module lockstep, AD-10)
**When** I join (FR-39)
**Then** the join takes one signature and shows my on-chain #rank; in this epic the join is user-gas with an honest note ("sponsored joins arrive with the relayer") — the sponsored path is an Epic 8 AC (the FR-3 allowlist's named zero-capital action, gated per device and per account per AD-15), because house-key sponsorship requires the ops relayer that does not exist yet
**And** the contract refuses self-referral (ref ≠ sender) and duplicate joins (already-joined renders the existing rank, never a raw revert)
**And** the first 100 get the Founder badge, referral attribution is on-chain-derivable via /waitlist?ref=, and the empty/unconnected state explains what signing proves (UX-DR11).

## Epic 5: Baku & the Brake

*Goal as stated in the Epic List (canonical). Realizes UJ-4; the minimal ops service boots here.*

### Story 5.1: The Fair Value model

As a user,
I want a live quantitative Read computed from the Market's own settlement basis,
So that Baku's numbers are model output, never vibes.

**Acceptance Criteria:**

**Given** core/fair-value (addendum §E; basis per Story 1.4's reference-basis note in context/)
**When** the model computes for a live window
**Then** it produces P(up) via the vol/momentum/tanh pipeline with all guards: horizons floor 0.05, staleness refusal >15s, vol floor, momentum admissibility gates, clamp-the-tilt fallback, one-sided-book single-quote bound (marketBoundUp)
**And** floats stay internal — the snapshot serializes integers/bps (AD-2) with tilt, band state (edge floor / disagreement ceiling), and time left
**And** golden tests pin the constants and refusal behaviors.

### Story 5.2: The ops service and the Stop that holds everywhere

As Maria,
I want my daily loss limit enforced no matter which surface I bet from,
So that a stop is a stop.

**Acceptance Criteria:**

**Given** services/ops boots (AD-8) with the Stop service and authed internal HTTP (bearer + HMAC, AD-16)
**When** any of the five betting entry points submits (AD-9)
**Then** the AD-3 order-lane Stop gate calls checkAndReserve(wallet, cost) — one atomic UPDATE with the limit guard, zero rows = refused — before send (the Epic 8 executor path consumes this same service in-process)
**And** /api/stop/check requires the SIWE session wallet to equal the target wallet (AD-16) — nobody burns another wallet's headroom
**And** the reservation reconciles to actual booked cost after the order lands: released on revert/miss, adjusted down on partial fill — spent is never decremented by user action, only reconciled to booked reality (AD-9)
**And** a stop-check that errors or times out while a stop may exist fails closed: the bet blocks with "can't verify your Daily Stop" — never fail-open
**And** daily_stops stores (wallet, limit, spent, tz, resetAt); the IANA tz auto-captures at the wallet's first signed-in session (UTC before one exists); the midnight-local reset computes server-side from that column; spent = Σ booked cost from fills; UI labels it "total staked today".

**Given** the Stop settings surface (FR-24)
**When** I configure my stop
**Then** I can edit the limit (shipped default per addendum §F), opt out behind explicit-confirmation friction, and see/correct my captured timezone; the Ticket shows my stop headroom whenever a stop is set (DESIGN.md §Components Ticket).

**Given** the stop is hit (FR-24)
**When** I try to bet anywhere
**Then** every entry surface refuses with "Daily Stop hit. Betting reopens at midnight." — the disabled control looks disabled and says why
**And** with no DB, the stop degrades to client-local with the honest scope label (AD-7).

### Story 5.3: Ask Baku

As a user,
I want a Read that names a side or tells me to sit out — and lets me act in one tap,
So that the copilot is useful and honest in the same breath.

**Acceptance Criteria:**

**Given** the Baku dock and chat sheet (UX-DR10), streaming via AI SDK v7 + Gateway with the model string in env
**When** I ask about a live window (FR-23)
**Then** the Read is a side or sit-out + one honest reason + the risk that proves it wrong, 2–4 sentences, grounded in the live snapshot — the LLM never outputs a number absent from it (SM-5's eval set asserts this)
**And** band violations return sit-out, a stale feed returns the blind-state copy, a one-sided book anchors to the single-quote bound, and a side-naming Read renders the act-on-it card into a pre-filled Ticket (all guards apply).

**Given** cost controls (PRD §12; AD-7 degrade-closed; spend tracked in the web-written llm_budgets table)
**When** the per-user daily LLM budget exhausts or no DB/key exists
**Then** Baku falls to model-numbers-only with the honest line ("numbers only today — the explainer is resting")
**And** any LLM/gateway error or timeout degrades to the same model-numbers-only state — the Read surface never hangs or errors.

### Story 5.4: The Brake and the memory

As Maria,
I want Baku to notice I'm chasing and remember me across sessions,
So that the copilot protects me with real history.

**Acceptance Criteria:**

**Given** tilt signals (FR-24; defaults from addendum §F)
**When** the tilt signals fire — loss streak + stake escalation + rapid-fire prompting
**Then** the Brake replaces the Read with the talk-down ("You're chasing. Model says no edge here. Sit this window out.") and the detection thresholds are config, not constants.

**Given** baku_memory (FR-25; web-written, wallet-keyed via SIWE)
**When** a returning user asks
**Then** Reads may reference prior sessions only from facts that exist in the store — real history, never invented
**And** memory failures degrade silently to memory-less Reads; no-DB runs are memory-less by construction.

## Epic 6: Vaults, Agents & Tap-Trading

*Goal as stated in the Epic List (canonical). Realizes UJ-7 and part of UJ-2 (tap-trading).*

### Story 6.1: The EventVault contract

As a user,
I want a Vault whose code cannot pay anyone but me,
So that delegation is structural, not promised.

**Acceptance Criteria:**

**Given** contracts/EventVault (AD-5, AD-10; Foundry)
**When** it ships
**Then** deposits are ledgered per user; withdraw pays only the owner (no beneficiary parameter exists anywhere); creditFor is add-only
**And** grants are typed STRATEGY | EXECUTOR | SESSION with independent Caps (maxStakePerTrade, maxDailySpend bucketed by UTC day, maxOpenPositions) and expiry; any delegate tx exceeding a Cap reverts; revocation is one call
**And** a depositAndGrant entrypoint composes deposit + grant atomically in one tx (the "no orphaned state" promise is contract-level, not UI choreography)
**And** crankSettle is permissionless (FR-28, FR-29, FR-31)
**And** storage and events carry only the canonical on-chain market id pinned in 1.4 — never pool addresses (forge test test_AD10_no_pool_address_in_storage)
**And** the no-divert property is a named forge test (test_AD5_no_divert: a compromised delegate key can at worst open in-Cap positions for rightful owners — FR-30), and deploy regenerates the addresses module in lockstep
**And** the venue's treatment of contract-originated orders is verified against live testnet before any vault order ships — including self-match behavior between two subscribers of the same vault (AD-3's delegated-route verification) — with findings recorded beside Story 1.4's notes in context/.

### Story 6.2: Delegate from the app

As Sam,
I want to deposit, set caps, subscribe, and verify — in one coherent flow,
So that trusting a strategy takes minutes, not faith.

**Acceptance Criteria:**

**Given** /vaults (FR-29 UX)
**When** I subscribe to a Strategy
**Then** deposit + grant compose into one action via depositAndGrant (no orphaned state), the Caps editor shows the worked-example sizing sentence at my chosen size, and the capability receipt renders exactly per UX-DR7 before my one signature
**And** the EventVault spender's first ERC-20 approval absorbs into this flow per the spine's Approvals convention — never a surprise mid-flow signature
**And** every vault write flows through submitTx (AD-3's second lane — journal, simulate, assertTxOk, error map), pause is instant with open positions remaining mine, and my Vault balance appears in the balance plate's labeled rows (FR-5).

### Story 6.3: Tap-trading on a session key

As Ada,
I want to arm tap-trading once and bet popup-free within caps,
So that the feed feels like a feed, not a signing ceremony.

**Acceptance Criteria:**

**Given** the SESSION grant (FR-4, AD-5)
**When** I enable tap-trading
**Then** the flow composes deposit + grant in one action via depositAndGrant, shows the capability receipt (scope, Caps, expiry), and stores the ephemeral viem key in IndexedDB
**And** while armed, Tickets and chips size against Vault balance, labeled "betting from your Vault"; bets sign popup-free through the same order lane (Stop gate included — AD-9 entry point 4); a tap exceeding Caps or Vault funds falls back to a normal wallet prompt
**And** concurrent tabs serialize session-key sends behind a single-writer lock (Web Locks) — one key, one writer (NFR-7)
**And** a cleared IndexedDB with a live on-chain grant is detected as grant-without-key: the manager offers revoke or re-key, taps fall back to wallet prompts, and "tap-trading on" never lies.

**Given** the session-key manager (UX-DR17)
**When** session mode is active
**Then** the Ticket carries the "tap-trading on" chip, the manager shows scope/caps/spend/expiry, and revoke is one tap (one vault call); the grant expires on its own.

### Story 6.4: Live books from the house maker

As a user,
I want every demo window to have a real two-sided book,
So that quotes exist and bets can fill.

**Acceptance Criteria:**

**Given** the seeder/maker actor in ops (AD-4, AD-8; distinct maker wallet)
**When** it runs against live windows
**Then** it quotes both sides with zero inventory via mint-a-pair economics (rest Buy UP @ p + Buy DOWN @ 1−p), sized per the seed-liquidity model, with post-only requoting absorbing PostOnlyWouldCross (canon #14), order expiry as dead-man's switch, tracked-then-sweep shutdown (canon #16), own intent journal, and why-string logging every cycle
**And** DRY_RUN exercises the full loop without spending; the maker wallet never crosses its own book (NFR-7 self-match rule — takers use distinct wallets).

### Story 6.5: The Oracle-Follow house strategy

As Sam,
I want a house strategy with a live decision feed and a real record,
So that I can judge it by evidence while it runs.

**Acceptance Criteria:**

**Given** the oracle-follow Runner in ops (FR-32; model from 5.1; distinct runner wallet trading via its STRATEGY grants)
**When** it trades for subscribers
**Then** every position's beneficiary is the subscriber by construction (FR-30), Caps pre-checked only via core/caps.simulate (cross-tested against the forge golden vectors — AD-5), fills booked from EventVault events (the delegated route's fill source — AD-3), and every action emits an auditable event linkable from the subscriber's portfolio
**And** the strategy card shows the decision envelope, record from real fills (txs linked), and the live why/why-not feed — idle cycles emit heartbeats ("scanned 6 markets, closest trigger 0.8¢ away"), never liveness theater (UX-DR13); heartbeats/why-strings persist to the ops-written runner_heartbeats table (durability only — AD-7)
**And** delegated positions flow into the one ledger (AD-1's vault event source): the subscriber's portfolio, Edge, CSV, and Banzuke show them, the Claim-all plate shows settled Vault credits as labeled withdrawal rows, and the Epic 3 golden tests extend to cover vault-attributed events.

### Story 6.6: Liveness never becomes custody

As Sam,
I want settlement to work with every house service dead,
So that my funds depend on code, not uptime.

**Acceptance Criteria:**

**Given** a subscriber position in a finalized market and all ops actors stopped
**When** anyone calls crankSettle (FR-31)
**Then** outcomes settle and credit the recorded owners permissionlessly, and the app exposes the crank affordance on stuck positions
**And** a registered Runner that has never ticked renders "never started" — a distinct state from alive, dead, and status-unknown (no health formula ever computes on a null lastTick)
**And** runner health on cards is re-derived at render from live ops data over internal HTTP (DB rows are durability only — AD-7): alive = now − lastTick < max(180s, 3×interval); ops unreachable renders "status unknown — ops offline", never alive (FR-32)
**And** the watchdog actor alerts the admin Telegram channel when any actor's heartbeat stalls past threshold (AD-8).

## Epic 7: Streak Parlays

*Goal as stated in the Epic List (canonical). Realizes UJ-6.*

### Story 7.1: One parlay math, two runtimes

As a user,
I want the slip's preview and the contract's escrow to be the same arithmetic,
So that the payout I'm shown is the payout that locks.

**Acceptance Criteria:**

**Given** core/parlay-math (AD-2, parlay-math convention)
**When** combined probability, stake floor, and max payout compute
**Then** all inputs/outputs are integers (price-grid units and bps), the correlation surcharge fires on the union trigger (same-asset/oracle OR same-expiry) with the λ floor, margin applies, and rounding favors the Reserve per-operation
**And** a checked-in golden-vector file is asserted byte-identical by vitest (core) and forge (contract) — "favors the Reserve" is a test assertion.

### Story 7.2: The ParlayReserve contract

As Lara,
I want my parlay's max payout locked in escrow the moment I open it,
So that a win can never be short-paid.

**Acceptance Criteria:**

**Given** contracts/ParlayReserve (FR-34, FR-35; AD-10)
**When** a parlay opens
**Then** the full max payout escrows in the same tx (named forge invariant: escrow ≥ max payout for every live ticket)
**And** leg prices are read from the on-chain book inside the opening tx and recorded on the ticket; every leg must be future-expiry; legs must reference distinct Markets (opposing or duplicate legs on one Market revert — the surcharge and escrow math assume independence)
**And** opens whose quotes breach minCombinedProbBps, aggregate exposure, per-ticket, or per-expiry caps revert with the cap named (the builder refuses the same breach at quote time — Story 7.3)
**And** leg resolution is permissionless and idempotent from each Market's settlement print; the first losing leg sweeps escrow instantly; claim pays the ticket's stored owner
**And** a void leg (both sides pay 0.5) voids the whole Parlay — stake refunded, escrow released — pinned in-contract and shown honestly on the slip
**And** a print that never lands is refundable after grace by ANYONE via voidAfterGrace(ticketId) — permissionless, so refunds never depend on admin liveness (NFR-6; adminVoid remains as an earlier-exit courtesy)
**And** storage/events carry only the canonical Market id (AD-10); the Reserve is house-seeded (FR-34) with the funding script in ops tooling.

### Story 7.3: Build a slip

As Lara,
I want to compose legs and see honest combined odds before I commit,
So that the ticket I open is the ticket I understood.

**Acceptance Criteria:**

**Given** /parlays (FR-33; UX-DR12)
**When** I add 2+ legs
**Then** the builder prices from live books through the port, shows combined probability with the surcharge applied, and solves Stake ↔ max payout
**And** it refuses at quote time with the reason named: below the combined floor ("this stops being a bet and starts being a lottery ticket"), one-sided/empty leg book ("we won't invent a mid"), reserve cap breach, past-expiry leg, duplicate Market ("one leg per market")
**And** opening flows through submitTx, absorbing the ParlayReserve spender's first approval per the Approvals convention; the slip renders the escrow line on gold-wash with its verify link: "your payout is already locked in the contract."

### Story 7.4: Watch it live or die honestly

As Lara,
I want my slip to advance leg by leg and die instantly when a leg loses,
So that hope is never manufactured.

**Acceptance Criteria:**

**Given** an open slip
**When** each leg's market settles
**Then** legs tick resolved in place; the first losing leg kills the slip instantly, strikes the leg that killed it, and stamps the slip 逆夢 (FR-35, UX-DR12)
**And** a winning slip's claim pays out from escrow with the Receipt attached; the permissionless resolve/claim affordances render on stuck slips (NFR-6); grace-void refunds surface honestly.

## Epic 8: The Chat Rail & Free Claims

*Goal as stated in the Epic List (canonical). Realizes UJ-8 and FR-3's gasless claims.*

### Story 8.1: Gasless claims through the relayer

As Dayo,
I want to claim winnings without holding gas,
So that an empty STT tank never strands my money.

**Acceptance Criteria:**

**Given** the relayer actor in ops (AD-15; distinct relayer key)
**When** the Claim-all plate submits claims
**Then** the plate sends per-item intents {marketId, outcomeIdx, minPayoutBaseUnits, redeemAuth} with the EIP-712 digest binding all fields (signRedeemAuth/redeemFor — payout hard-pinned to owner, FR-3)
**And** the relayer re-validates each against its own chain read before spending gas, executes per item — idempotent and journaled — and returns per-item results; the plate's rendering contract is Story 1.10's (per-item outcomes, both plate and relayer computing from the same core/claims)
**And** a fee flip between signing and execution surfaces as "fee changed — re-sign" with a one-tap per-item re-sign, never an unexplained failure loop
**And** with the relayer unreachable, the plate falls back to the Story 1.10 wallet-gas path with an honest note — winnings are never stranded on an ops outage
**And** the sponsorship policy validates the whole batch against the per-function allowlist (one unlisted call rejects it), gates ride the ops-written sponsor_gates table (per device and per account, degrade closed), and capital intake is never sponsored (NFR-7)
**And** the sponsored waitlist join (Story 4.4's deferred path) goes live through this same relayer and allowlist.

### Story 8.2: Link Telegram with a receipt, not a leap of faith

As Nia,
I want linking my Telegram to show exactly what the bot can and cannot do,
So that I delegate with my eyes open.

**Acceptance Criteria:**

**Given** the TG bot (grammY, long-polling, in ops) and my wallet
**When** I link (FR-36)
**Then** the binding is a wallet signature over my TG id + nonce (identity never from message content — AD-16), stored in tg_links (ops-written), and requires an EXECUTOR grant on my Vault (deposit + grant composed if none exists)
**And** the capability receipt renders in-chat: CAN bet within caps from Vault balance; CANNOT withdraw, change caps, or pay anyone else — with "No such function." (UX-DR22)
**And** /unlink exists; a relink to a different wallet overwrites only after a fresh signed proof, with the previous wallet notified — a stale binding never bets from the wrong Vault
**And** with no DB, linking refuses honestly and the rail shows as disabled (AD-7).

### Story 8.3: Bet by message

As Nia,
I want `bet 5 btc up` to become a guarded, confirmed, capped bet,
So that chat betting is as safe as the app.

**Acceptance Criteria:**

**Given** a linked user (FR-37)
**When** I send a bet command
**Then** the bot echoes window, odds, and exact cost and requires confirmation before executing through the same order lane (all FR-9 guards + the in-process Stop check — AD-9 entry point 5)
**And** confirmations expire (~30s), bind to their command id, and re-echo when the fresh cost exceeds the echoed cost's buffer — a stale confirm never executes at silently worse terms, and an interleaved command never executes the wrong bet
**And** a re-sent/duplicated message can never double-bet (idempotent by message identity; booked size from actual fills); refusals name the specific Cap, stop, unfunded-Vault, or expired/revoked-grant state ("your grant expired — re-link in the app") with the fixing link.

### Story 8.4: Verdicts come to the chat

As Nia,
I want my bets' outcomes posted back with proof,
So that the loop closes where I live.

**Acceptance Criteria:**

**Given** the settlement-watcher actor (AD-8)
**When** a linked user's market finalizes
**Then** it emits the internal settlement event and the executor posts the Verdict to the chat — stamp vocabulary, P&L, and the Receipt link built via core/urls (UX-DR22)
**And** the watcher resumes from a persisted cursor and backfills finalizations missed during downtime (idempotency makes catch-up safe — no Verdict silently never arrives)
**And** postbacks are idempotent per (user, market) and degrade silently if the user blocked the bot.

## Epic 9: The Judge Ring & Submission

*Goal as stated in the Epic List (canonical). Realizes UJ-9.*

### Story 9.1: Fixtures and the doctor

As a judge (or developer),
I want every UI state visible from canned data and a one-look health check,
So that nothing requires live luck to evaluate or debug.

**Acceptance Criteria:**

**Given** /dev/* (NFR-8, UX-DR20)
**When** I browse fixtures
**Then** every card, receipt, stamp, modal, and state-machine state renders from canned data with no DB and no wallet — including the rare ones (void, partial-scan, degraded receipt, stop-hit, ops-offline)
**And** /dev/doctor runs the preflight — config echo, venue resolve, RPC health, wallet gas/collateral (when connected), per-market status/book, ops health over internal HTTP — each row honest about what it could not check.

### Story 9.2: CI that enforces the spine; a harness that proves the loop

As the builder,
I want the invariants machine-checked and the money loop integration-proven,
So that drift dies in CI, not in the demo.

**Acceptance Criteria:**

**Given** the CI invariants script (network-free)
**When** it runs
**Then** it asserts: status enum pinned, taker-IOC, headroom gate, SDK version + address drift, AD-3/AD-14 greps (no writeContract/fetch/wagmi-read outside the port), time-suffix convention, event-ABI pool-address check, degradation-table completeness
**And** the integration harness runs dry gate → wet gate against a distinct counterparty wallet → open-order delta leak check around every wet run, plus the quote-path p95 ≤ 1.5s smoke (NFR-5).

### Story 9.3: Seed the demo world

As the demo operator,
I want scripted liquidity and disclosed house social content,
So that no judge ever sees an empty book or a dead feed.

**Acceptance Criteria:**

**Given** ops tooling (PRD §10.3)
**When** seed scripts run
**Then** the seed-liquidity script quotes both sides across live windows per the sizing model (wallet-per-role — never crossing house takers), and the seeded-takes script posts backed Takes from disclosed house accounts labeled per FR-22's registry
**And** both are idempotent, DRY_RUN-capable, and journaled.

### Story 9.4: The demo and the pitch, in-product

As a judge who won't watch a video,
I want the whole story absorbable in-app,
So that evaluation fits my attention.

**Acceptance Criteria:**

**Given** /demo (UX-DR19)
**When** I scroll it
**Then** the numbered walkthrough alternates copy and captures, embeds the demo video, and renders the "Every claim is a transaction" tx-proof grid — every link real
**And** /pitch renders the deck as a route — keyboard nav (← → space), dot navigation, zero live-data imports (it can never break during judging) — carrying the future-vision and sustainability slides (mainnet path, builder-fee readiness, "the Builder pattern exists for spot only; we are the EC-native automation layer").

### Story 9.5: The honest README and the feedback report

As the hackathon submission,
I want the repo to sell itself the way the product does — with proofs and honest limits,
So that Technical and Presentation judging read conviction, not claims.

**Acceptance Criteria:**

**Given** the README (NFR-8)
**When** it ships
**Then** it opens with the one-line pitch, the proven-on-chain section (every claim → real tx), the zero-env quickstart, the sponsor-stack table, and the honest-limitations section (testnet-only, known rough edges, OQ-10 findings)
**And** the SDK & docs feedback report compiles addendum §J plus everything logged during the build (submission bonus)
**And** the submission checklist (video link, repo, deck) is complete per the hackathon brief — the OQ-9 line reads "decided 2026-09-01: shipped as Story 9.6."

### Story 9.6: The agent on-ramp — MCP server and unsigned-tx API

As an external developer (or any MCP-capable AI assistant),
I want to read Event Contract markets and receive ready-to-sign transactions through Masayume's adapter,
So that the primitive is usable by developers and outside agents — not only inside the app.

**Acceptance Criteria:**

**Given** the published MCP server package (FR-41)
**When** an MCP client adds its one config line
**Then** the assistant can list live Markets (with phase), quote a Stake, build unsigned order/redeem txs, and enumerate claimables — every response derived through packages/markets (AD-1, AD-14; one more consumer of the port, nothing else changes)
**And** no tool ever holds or requests a private key: writes return as unsigned calls for the caller to sign (the bot-kit build* pattern) — custody stays with the caller.

**Given** the build-unsigned-tx HTTP route
**When** an agent that brings its own signing calls it
**Then** it returns the same unsigned calls with the same guards (status gate, headroom expiry, min-stake floor) pre-applied, and refuses malformed requests with named reasons
**And** the README's developer section documents both on-ramps ("one line in any MCP client and an assistant can trade"), and /demo shows an assistant reading a market and producing a caller-signed bet.
