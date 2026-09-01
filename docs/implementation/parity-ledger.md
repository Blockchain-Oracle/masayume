---
title: Masayume working parity ledger
status: working record
authority: docs/architecture/yosuku-source-led-migration/01-reference-parity-manifest.md
reference_commit: 3c56ef52b78dae28cc198495f753480292f6a5ad
pin_verified: 2026-09-01 — reference/yosuku HEAD == origin/main == pinned commit, 0 commits drift
---

# Working parity ledger

The manifest in `01-reference-parity-manifest.md` defines the **minimum** surface. This file tracks
implementation against it. Rows are added to, never weakened or removed.

**There are no approved user-visible exclusions.** `Pending` means "not yet built in the dependency
order", never "optional" or "cut".

## Status vocabulary

| Status | Meaning |
|---|---|
| `Done` | Meets the route definition-of-done in `05-migration-and-agency-handoff.md` |
| `Shell` | Resolves in the correct Yosuku shell with honest dependency/unavailable states; capability not yet connected |
| `Partial` | Real data/writes connected for part of the surface |
| `Pending` | Not started; sequenced in a later stage |
| `Blocked` | A genuine external dependency is missing; blocker + resolution recorded |

## Decision log

| Date | Decision | Reference | User-visible consequence | Approval |
|---|---|---|---|---|
| 2026-09-01 | Pin confirmed at `3c56ef5`; upstream fetched, zero drift | doc 00 §Pinned reference basis | None — no version mixing | Verified, no approval needed |
| 2026-09-01 | Yosuku source, CSS, tokens and assets reused verbatim | doc 00 §Source and provenance gaps item 2 | Exact visual fidelity | **User approved** (owns/has permission) |
| 2026-09-01 | `globals.css` split into <400-line modules, values byte-identical; `design-literals` rescoped for ported presentation | repo invariants vs doc 02 §Source-led shell | None — split verified by concatenation diff | **User approved** |
| 2026-09-01 | Native mobile remains `Blocked` | doc 00 §Source and provenance gaps item 1 | `/download` native buttons show a truthful blocked state | Architecture default |
| 2026-09-01 | **Truth correction** — AppStrip advertised "Yosuku is on iOS". Masayume has no native build, so the claim would be false. Mechanism kept (it owns `--appstrip`, which every fixed offset derives from); copy is now "Masayume installs as a web app" / "Somnia testnet — test funds only", both true | doc 00 allowed deviation 4 | Strip promises an installable PWA, which exists, instead of an iOS app, which does not | Deviation class pre-approved |
| 2026-09-01 | Brand mark is Masayume's own glyph (crescent + vermilion point), not the Yosuku celebrant figure | doc 00 §Allowed changes 1 — "brand substitution changes the mark and name, not the design grammar" | Different logo; identical drawing grammar, footprint and colour law | Deviation class pre-approved |
| 2026-09-01 | Ticker driven by real DreamDEX asset prices + next close, not Yosuku's `/api/ticker`. Fear/Greed omitted while no provider is configured | doc 05 §No fake-data; ledger row "news/ticker" | Real figures only; the FNG cell returns when a real provider is connected | Recorded, pending row |
| 2026-09-01 | Invariant rescope was **approved but not needed** — the CSS split kept every part under the cap and ported components carry no literals, so `design-literals` and `file-length` pass unmodified | repo invariants | Guardrails remain fully strict on all code | Approval unused |
| 2026-09-01 | Light mode in the reference is partially stale: `tailwind.config.ts` maps `gray-*` to CSS vars but there is no `@config` directive, so under Tailwind 4 its 811 `text-gray-*` utilities compile to static dark-ramp hex and do not follow `[data-theme="light"]`. Verified live on yosuku.xyz (`--gray-400` = `#5e574b` while `text-gray-500` renders `#737373`). Rendering remains legible, so the port reproduces source behaviour rather than diverging | doc 00 authority order 3–4 | None today; recorded so it is a deliberate choice, not an unnoticed bug | Fidelity preserved; revisit only with evidence of unreadable text |


## Signing and authority (doc 02 §Signing and authority architecture)

| Requirement | Destination | Status |
|---|---|---|
| Shared read-only runtime, no mutable account or signer | `packages/markets/src/runtime/read-runtime.ts` | **Done** — `setSigner`/`signerAddress`/`requireTrader` removed; `.trader` unreachable; `configureMarkets`/`ensureMarkets` return `void` so the exchange object is never handed out |
| Endpoint rotation cannot change signing authority | same | **Done** — rotation rebuilds reads only |
| `SubmitterSession` per account + chain + authority | `packages/markets/src/sessions/submitter-session.ts` | **Done** — owns its own SDK instance, signer passed at construction, `setSigner` never called |
| Sessions do not multiply sockets | same | **Done** — no `wsRpcUrl`; SDK opens a socket only when configured, so subscriptions stay on the one shared runtime |
| Own nonce queue (one key, one writer) | `packages/markets/src/sessions/nonce-queue.ts` | **Done** — serialised; a rejection does not stall the queue (targeted check) |
| Own journal, attribution, stop gate | `packages/markets/src/submitter/create.ts` | **Done** — bound to one account |
| Authority types enumerated | `packages/markets/src/sessions/authority.ts` | **Done** — 9 roles, delegated ones marked |
| Disposed on disconnect / account switch / chain switch / expiry / revocation | `packages/markets/src/react/session.tsx` | **Done** — new wallet client disposes and rebuilds; disposed sessions reject |
| Grant policy per session (`SESSION_TRADE`, `X_EXECUTOR`, …) | `EventVault` | Pending — Stage 4; the session already carries the authority it will be scoped by |

Remaining Stage 2 work: normalise market/book/candle readings once for all routes behind one
subscription coordinator, and port Yosuku's `/markets` presentation (hero-as-ticket, Room,
Ticket with Range and leverage) onto the existing real pipeline.

---

## Product shell

| Element | Reference evidence | Destination | Class | Status |
|---|---|---|---|---|
| Root layout, metadata, providers | `app/layout.tsx` | `web/src/app/layout.tsx` | Exact | **Done** |
| Pre-paint theme (no dark flash) | `lib/theme.ts` `THEME_INIT_SCRIPT` | `web/src/lib/theme.ts` | Exact | **Done** — verified light + dark |
| Global design system | `app/globals.css` (5,849 L) | `web/src/styles/yosuku/part-01..18.css` | Exact | **Done** — 18 modules, concatenation verified byte-identical |
| App strip | `components/AppStrip.tsx` (95 L) | `web/src/components/shell/AppStrip.tsx` | Exact; **truth-corrected copy** | **Done** |
| Marquee (price tape) | `components/Marquee.tsx` | `web/src/components/shell/Marquee.tsx` | Adapted — real DreamDEX prices + next close | **Done**; Fear/Greed cell pending a real provider |
| Desktop header + More menu | `components/Header.tsx` (432 L) | `web/src/components/shell/header/{Header,HeaderAccount,nav-items,useFloatingMenus}` | Exact structure; wallet adapted to wagmi | **Done** |
| Mobile floating pill bottom nav | `components/Header.tsx` `MOBILE_NAV` | `web/src/components/shell/header/MobileBottomNav.tsx` | Exact + Games | **Done** — verified at 390px |
| Footer / grain / custom cursor | `Footer.tsx`, `GrainOverlay.tsx`, `CustomCursor.tsx` | `web/src/components/shell/*` | Exact; cursor honours reduced-motion + coarse pointer | **Done** |
| Theme toggle | `components/ThemeToggle.tsx` (37 L) | `web/src/components/shell/ThemeToggle.tsx` | Exact | **Done** |
| Toast / tx feedback | `components/Toast.tsx` (130 L) | `web/src/components/ui/toast.tsx` (existing) | Adapted | **Partial** — functional + themed; Yosuku presentation pending (Stage 2) |
| First-run onboarding modal (5 steps, Skip/Next) | Live `yosuku.xyz/markets` 2026-09-01 | `web/src/features/onboarding/*` | Exact; adapted copy | Pending |
| Sensei dock + contextual bubble | Live `yosuku.xyz/markets`; `app/api/sensei/route.ts` | `web/src/features/sensei/*` | Adapted (AI over typed read models) | Pending |
| Error boundary | `app/error.tsx` | `web/src/app/error.tsx` | Exact | Partial (exists) |

Games add exactly one navigation destination. Markets, Reels, Create, Strategies, Leaderboard,
Portfolio and More all remain.

## Route baseline

| Route | Reference | Class | Data authority | Status |
|---|---|---|---|---|
| `/` | `app/page.tsx` | Exact shell; adapted identity/protocol copy | Static + real traction | **Shell** — honest dependency state |
| `/markets` | `app/markets/page.tsx` | Adapted to DreamDEX | DreamDEX indexer + RPC | **Partial** — real lanes/book/lifecycle/ticket live; needs Yosuku presentation |
| `/markets/[id]` | `app/markets/[id]/page.tsx` | Exact redirect intent | — | **Done** — redirect |
| `/reels` | `app/reels/page.tsx` | Adapted | Shared market stream | **Shell** — honest dependency state |
| `/portfolio` | `app/portfolio/page.tsx` | Adapted | Chain/indexer projection | **Shell** — honest dependency state |
| `/portfolio/edge` | `app/portfolio/edge/page.tsx` | Adapted | Real fills incl. losses/voids | **Shell** — honest dependency state |
| `/leaderboard` | `app/leaderboard/page.tsx` | Adapted | DB projection from verified outcomes | **Shell** — honest dependency state |
| `/earn` | `app/earn/page.tsx` | Adapted via `MarketMakerVault` | Masayume contract | **Shell** — honest dependency state (Stage 5) |
| `/strategies` | `app/strategies/page.tsx` | Adapted | `StrategyRegistry` + DB | **Shell** — honest dependency state (Stage 4) |
| `/agents` | `app/agents/page.tsx` | Adapted | Registry + fill projection | **Shell** — honest dependency state (Stage 4) |
| `/parlay` | `app/parlay/page.tsx` | Adapted via `ParlayReserve` | Masayume contract | **Shell** — honest dependency state (Stage 5) |
| `/surface` | `app/surface/page.tsx` | Adapted — real DreamDEX structures, not SVI | DreamDEX book/term structure | **Shell** — honest dependency state (Stage 5) |
| `/trade-from-x` | `app/trade-from-x/page.tsx` | Adapted | X provider + `EventVault` grant | **Shell** — honest dependency state (Stage 4) |
| `/claim` | `app/claim/page.tsx` | Adapted to DreamDEX redemption | Chain receipts | **Partial** — `/claims` implemented |
| `/fund` | `app/fund/page.tsx` | Adapted | Faucet + approval/deposit | Partial (faucet exists) |
| `/waitlist` | `app/waitlist/page.tsx` | Adapted | `Waitlist` contract or DB | **Shell** — honest dependency state |
| `/stats` | `app/stats/page.tsx` | Adapted | Chain-derived + labeled off-chain | **Shell** — honest dependency state |
| `/docs` | `app/docs/page.tsx` | Exact structure; adapted facts | Static | **Shell** — honest dependency state |
| `/creators` | `app/creators/page.tsx` | Adapted | DB profiles + on-chain receipts | **Shell** — honest dependency state |
| `/creator/studio` | `app/creator/studio/page.tsx` | Adapted | Authenticated studio + registry | **Shell** — honest dependency state |
| `/creator/recover` | `app/creator/recover/page.tsx` | Adapted | Signed-wallet recovery | **Shell** — honest dependency state |
| `/studio` | `app/studio/page.tsx` | Adapted | DB/object storage | **Shell** — honest dependency state |
| `/how-it-works` | `app/how-it-works/page.tsx` | Exact structure; adapted facts | Static | **Shell** — honest dependency state |
| `/demo` | `app/demo/page.tsx` | Real behavior; no invented economics | Real connected data | **Shell** — honest dependency state |
| `/pitch` | `app/pitch/page.tsx` | Exact grammar; adapted claims | Real evidence only | **Shell** — honest dependency state |
| `/download` | `app/download/page.tsx` | Web/PWA exact | Static | **Shell** — honest dependency state |
| `/status` | `app/status/page.tsx` | Adapted | Read-time dependency health | **Shell** — honest dependency state |
| `/social` | `app/social/page.tsx` | Adapted | Postgres + realtime | **Shell** — honest dependency state |
| `/native-auth` | `app/native-auth/page.tsx` | Web auth adapted | — | **Shell** — honest dependency state |
| `/bell` | `app/bell/page.tsx` | Exact redirect intent | — | **Done** — redirect |
| `/pool` | `app/pool/page.tsx` | Exact redirect intent | — | **Done** — redirect |
| `/beta` | `app/beta/page.tsx` | Exact redirect intent | — | **Done** — redirect |
| `/markets-live` | `app/markets-live/page.tsx` | Exact redirect intent | — | **Done** — redirect |

`/dev/*` in Yosuku are internal design-review utilities. They are **not** a mock-data deliverable and
never justify fabricated public data.

## Additive game routes

| Route | Responsibility | Class | Status |
|---|---|---|---|
| `/games` | Yosuku-native selection + active-session return | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/duel` | Ranked/Free PvP prediction duel | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/practice` | Labeled no-stake tutorial loop | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/lucky` | Randomized live-market mode, auditable selection | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/range` | Range market backed by `RangeReserve` | Additive | **Shell** — honest dependency state |
| `/games/moonshot` | PIPS-derived; economic nature stated plainly | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/line-rider` | PIPS-derived arcade | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/candle-hop` | PIPS-derived arcade | Additive | **Shell** — honest dependency state (Stage 6) |

## Feature families

Tracked separately so the route table cannot hide a missing capability.

| Family | Status | Notes |
|---|---|---|
| Cadence-aware market discovery | **Partial** | Real 5m/15m/1h/4h/1d lanes live |
| Hero-as-ticket trade flow | **Partial** | Ticket + quote + guarded write live; Yosuku presentation pending |
| Up/Down · stake · cash-out · claim · receipt | **Partial** | Up/Down, stake, claim, receipt live; cash-out pending |
| Range · leverage · private | Pending | Stage 5 — needs `RangeReserve` + prefunded leverage + link-private service |
| Social takes, rooms, sharing, alerts, news/ticker, X linking | Pending | Stage 3–4 |
| Trading Balance with labeled pools | **Partial** | Balance plate + labeled pools exist; `EventVault` pending |
| Positions, PnL, history, equity, reputation, badges, Trader Edge | Pending | Stage 3 |
| Earn, parlays, strategies, creators, agents, playbooks, assistant | Pending | Stage 4–5 |
| Faucet, account setup, recovery, smart-wallet session, revocation | **Partial** | Faucet live; rest Stage 4 |
| Status, traction, docs, demo, pitch, download, error recovery | Pending | Stage 3 |
| Game selection, progress, achievements, stats, matchmaking, MMR, sound/haptics | Pending | Stage 6 |

## Visual contract

Ported from source, not approximated: light ground `#F4EEE3`, dark ground `#050505`, ink `#141210`,
vermilion `#E04D26`, profit `#34D399`, loss `#FB7185`; Sora display / Inter body / JetBrains Mono data
/ Noto Serif JP editorial; grain, crop marks, torii rhythm, numbered headers, ticker, editorial
italics; source spacing, borders, radii, shadows, breakpoints, easings; reduced motion; no theme flash.

The superseded gold/Archivo theme is removed, not layered over.

## Responsive contract

Inspected at 390 / 768 / 1024 / 1440 (source breakpoints govern). Mobile keeps the compact header and
persistent floating pill bottom nav. Reels stays phone-proportioned on large screens. Trading controls
become sheets/drawers per source. Desktop adds density without reordering the workflow.

## State contract

Every surface accounts for: identity (signed out → connecting → first run → linked → returning →
recovery → revoked); money (unfunded → insufficient → grant required → funded → pending withdrawal);
reads (loading → live → stale last-good → empty → disconnected → unavailable); market (upcoming → live
→ between rounds → near expiry → suspended → expired → settled → voided); trade (quote loading → quote
moved → confirmation → submitted → fill/partial → rejected → unknown → claimable → redeemed);
social/agent; and game lifecycle.

No invented data is used to demonstrate any of these. Loading and unavailable are valid product states.
