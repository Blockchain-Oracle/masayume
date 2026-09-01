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
| 2026-09-01 | **Invisible-in-light fix, backgrounds.** The reference's Tutorial card is `bg-neutral-900/95`, which part-14 turns to cream in light mode — taking `bg-white/20` (step dots), `border-white/[0.12]` and `hover:bg-white/[0.06]` (choice cards) with it, none of which part-14 remaps. They render white-on-cream, i.e. invisible. Same defect class as the reel's `var(--white)`, in background form, and present in the reference itself | doc 00 authority order; RESUME.md §Never write `var(--white)` | Step dots and choice-card edges are visible on cream instead of absent; dark mode byte-identical to source | Deviation — the user's 2026-09-01 ruling (invisible is not fidelity) applied to the same defect class |
| 2026-09-01 | **`text-gray-*` diverged for the Tutorial only.** The ledger row below records the gray ramp as stale-but-legible and reserves "evidence of unreadable text" as the trigger to diverge. Measured on this card: body copy `text-gray-400` = `rgb(163,163,163)` on cream at **2.36:1**, far under AA, on the one screen whose whole job is to be read. Remapped to part-14's own ladder (9.67:1 / 5.11:1 / 3.44:1) | doc 00 authority order 3–4; the row below | Onboarding prose is readable in light mode. Scoped to `.tutorial-card`; the other 811 `text-gray-*` utilities are untouched pending a reviewed global pass | Trigger the ledger itself defined |
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

**Stage 2 is complete.** `/fund` and `/claim` are not Stage 2 reads — see §`/reels` for why.

### Toast (Stage 2, done 2026-09-01)

Ported from `reference/yosuku/components/Toast.tsx`. The reference's *behaviour* is thinner than what
was already here — no portal, no live region, no swipe, and a close button with no handler (only the
card's own `onClick` dismisses, L125–127) — so the Base UI primitive stayed and took the reference's
presentation, rather than the reverse. Adopting the reference wholesale would have traded away
accessibility for a visual match.

| Element | Reference | Now | Status |
|---|---|---|---|
| Bottom-right stack, newest nearest | L69 | already the viewport's placement | **Done** |
| `rounded-xl`, `bg-neutral-900/90`, `backdrop-blur-xl` | L120 | same utilities — `bg-neutral-900/90` is the reference's own, so `part-14.css` remaps it on cream with no second rule | **Done** |
| `min-w-[280px] max-w-[400px]` | L120 | `styles/toast.css` (`design-literals` bans px in TSX); the floor drops below `sm`, where 280px would overflow the gutter | **Adapted** |
| Border tinted by type (`emerald-500/20`, `rose-500/20`, neutral) | L93–97 | `.toast-plate[data-type]` — the tint is `--profit` / `--loss` at 20% | **Done** |
| Icon coloured by type (`emerald-400`, `rose-400`, gray) | L87–91 | `text-profit` / `text-loss` / `text-ink-muted` — **the reference's hex values *are* these tokens**: `#34D399` and `#FB7185` | **Done** |
| Spring entry/exit from the right (`x: 80`, damping 22 / stiffness 300) | L116–119 | `translateX(120%)` on the starting and non-swipe ending styles, on `--ease-bounce` — Yosuku's own overshooting curve | **Adapted** — no framer-motion added for one component |
| Warning type | — | follows the same formula, so the fourth kind is not the only one whose border says nothing | **Additive** |

### Word-market board — `/markets` §02 "Just ask" (Stage 3, done 2026-09-01)

Ported from `reference/yosuku/components/WordMarketBoard.tsx` into
`web/src/features/markets/word-board/`. `.words-*` / `.wq-*` were already ported verbatim in
`yosuku/part-16.css` + `part-17.css`, **including their light-theme block**, so only three
source assumptions this venue does not share are in `styles/word-board.css`.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| §02 header "Just ask / No chart to read…" | `app/markets/page.tsx` L878–881 | `MarketsScreen.tsx`, `SECTIONS.words` | Exact | **Done** — `SectionHeader` gained the reference's `desc` slot |
| Horizon groups at 6 min / 65 min, count beside the label, empty groups dropped | L31–35, L79–82 | `@masayume/core/market/horizons.ts` | Adapted | **Done** — bands verbatim; only the third label changes, because "Later today" is false for a 1d Window closing tomorrow (observed live: a 1:00 AM close). Bands are half-open, checked in `horizons.test.ts` (4 cases) — a boundary slip would silently drop or double-list a Window |
| Card frame, odds bar, Yes/No buttons, `min-height` question, 720px type ramp | `part-16/17.css` | already ported | Exact | **Done** — verified at 390 (one column, 16px question, no x-overflow) and 1440 |
| The line in the question | `strike624(spot,'up')` L67 | `core/copy/question.ts` `wordQuestion` | **Adapted** | **Done** — the **opening print**, as `/markets` and `/reels` already use. A strike derived from spot is not the number these Windows settle against |
| Odds: `probAbove`, a client-side logistic on `(line−spot)/σ` | L22–27, L74 | `hero/useTopOfBook.ts` | **Adapted — no-fake-data** | **Done** — the reference calls it "an honest client-side odds estimate"; it is still an invented number, barred by doc 05. Prices are the top of the real book, the same reading the hero's UP/DOWN buttons show, so the two cannot disagree |
| `No` priced as `100 − yes` | L119 | `WordCard.tsx` | **Corrected** | **Done** — each side is its own contract with its own ask, so they do not sum to 100 (observed live: 38¢ / 59¢). Neither is derived from the other |
| The odds bar's fill | L109 | `WordCard.tsx` | **Adapted** | **Done** — with two independent asks there is no single probability, so the bar is the stated split `up/(up+down)` and the label says "N% implied on Yes", never "the odds". One-sided or unread book → a flat unfilled track, because an empty green fill reads as "0%, everyone says no", a claim about the market rather than about our knowledge of it |
| BTC disc (`.wq-btc`, orange radial + tilted ₿) | `part-16.css` | `.wq-generic` + `hero/asset-mark.ts` | Adapted | **Done** — the venue also lists ETH, which gets its initial on a neutral disc rather than wearing Bitcoin's colour; same rule and values as `.mh-asset-badge` |
| Template rotation across the four phrasings | `TEMPLATES[i % 4]` L73 | `wordQuestion` | **Corrected** | **Done** — keyed on the market id, not the array index. On index, every card reworded itself whenever a Window closed and the list shifted underneath it |
| Self-contained fetch of markets + spot on a 12 s poll | L51–63 | prop from `useLanesState` | **Adapted** | **Done** — the reference is self-contained so it can also stand alone; here that would put a second market stream on `/markets` (see §Subscription coordinator) |
| Yes/No hand off to the ticket | `router.push` L84 | `marketDeepLink` | **Done** — the existing deep-link grammar, as the reel uses |

Also fixed here, since the element was being edited: `MarketsScreen`'s §01 used
`aria-labelledby="section-lanes"` against a `SectionHeader` that takes no `id`, so the reference
dangled. It uses `aria-label` now, like the newer sections (was listed under §Known, not fixed).

**Open question for the user, not decided here.** The reference's §01 is a rail of *chart* cards,
so its §02 word board is the page's only plain-language surface. Our §01 `MarketRow` already
states each Window as a plain question (`plainQuestion`) and carries an odds chip pair, and there
is a "Plain words" toggle above it as well. So `/markets` now says the same Windows in words
twice, in two different card languages. Three ways out — keep both (they do differ: §01 is the
trading rail with cadence tabs and hero selection, §02 browses every lane at once), make §01's
rows chart-like to match the reference's rail, or retire the toggle now that §02 is the plain
surface. Recorded rather than chosen, because it changes reviewed work.

### First-run Tutorial (Stage 3, done 2026-09-01)

Ported from `reference/yosuku/components/Tutorial.tsx` into `web/src/features/onboarding/`.
Presentation values in `styles/tutorial.css` under the `markets-hero.css` convention.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Shows once, `localStorage` flag, Skip/backdrop/Escape all dismiss | L8, L49–59, L82–88 | `useFirstRun.ts` | Exact | **Done** — hydrates after mount, so a returning visitor never sees a frame |
| Modal: `bg-neutral-900/95`, `border-white/10`, `rounded-2xl`, bottom sheet → centred at `sm` | L96–107 | `Tutorial.tsx` + `styles/tutorial.css` | Adapted | **Done** — Base UI `Dialog` keeps the focus trap, dialog role and inert background the reference re-implements by hand; it takes the reference's presentation, as the Toast did |
| Per-step reveal (framer-motion, `y:20 → 0`, `scale:.95 → 1`, 200 ms) | L100–107 | `.tutorial-step` | Adapted | **Done** — CSS keyed on the step on Yosuku's `--ease-out`; no second animation library. Honours `prefers-reduced-motion`, which the reference does not |
| Five steps, Skip + Next, `Get started` on the last | L19–41, L171–186 | `steps.ts` | Exact shape; **rewritten prose** | **Done** — the reference describes Sui/zkLogin, sponsored gas and its on-chain Trading Balance. None is true here: step 3 says the user signs every transaction, step 4 describes the pools that *do* exist (spendable / order escrow / venue payout credit), and cadences are "whatever the venue is listing" because lanes derive from live `intervalSec` |
| Step indicators (`w-6` vermilion active, `w-2` past/future) | L160–168 | `Tutorial.tsx` | Exact | **Done** — as an `<ol>` with `aria-current="step"`; the reference's are bare divs |
| Final step: Simple/Pro choice writing `yosuku_trade_mode` | L117–129 | `TutorialChoice.tsx` | **Adapted** | **Done** — Masayume's ticket has one layout, so a literal port would ship a choice that changes nothing. The same question drives `plainWords`, the shipped preference that switches the live-Window rail between chart cards and Yes/No questions |
| Ends on Connect; picking does not close; auto-dismiss on connect | L66–79, L130–135 | `Tutorial.tsx`, `TutorialChoice.tsx` | Exact | **Done** — wagmi `address` replaces `useCurrentAccount` |
| Card wears no focus ring | — | `.tutorial-card:focus` | **Improved** | **Done** — Base UI's default initial focus lands on Close, so a welcome screen opened pointing at the way out. Focus goes to the dialog itself, ring suppressed on the container only |
| Card scrolls rather than clipping on a short viewport | — | `.tutorial-card` | **Improved** | **Done** — the closing step overflows a 390×844 phone; the reference clips it off-screen |

Two light-mode defects found here and fixed, both recorded in the decision log above: the
`text-gray-*` body copy at 2.36:1, and three `*-white` utilities that fall through part-14's
remap. **The `*-white` gap is general — check for it before porting the next dark component.**

### Subscription coordinator (Stage 2, done 2026-09-01)

`packages/markets/src/runtime/coordinator.ts` — one normalised book per market, shared by every
consumer. The SDK already ref-counts its pool watches, so the transport was never the duplicated
part; three costs sat above it, all verified in the SDK source at the pinned version:

| Cost | Evidence | Now |
|---|---|---|
| Depth forked the store's memo cache (`bookynm:<market>:<depth>` over `book:<pool>:<depth>`), so it walked the whole resting-order map once per distinct depth per pool per block | `createClient.ts:253`, `store.ts:648` | One `CANONICAL_BOOK_DEPTH` (10) read per market; consumers slice what they display. Matches the SDK default, so `useStakeQuote`'s raw book shares the same entry |
| The memo cache is keyed on a version every new head bumps, so an unchanged book arrived as a new object every block and re-rendered every consumer | `store.ts:656` | `sameBookDepth` compares the mapped value; an unchanged book holds its reading, so nothing re-renders |
| `useBook`'s `useMemo` never held — all three call sites passed a fresh object literal as `target`, so `toBookDepth` re-ran on every render, not merely every block | `OddsChips.tsx:39`, `DepthStrip.tsx:40`, `useTopOfBook.ts:27` | The hook depends on `marketId`/`poolAddress`/`decimals` as primitives and reads through `useSyncExternalStore` |

Also collapsed: `useTick` now shares one timer per interval (`react/tick-clock.ts`) instead of one
per hook — the ticker strip alone was running four unsynchronised one-second intervals.

Honesty preserved: a hydrating watch reads `null` ("…"), never an empty book nobody has read; a
dropped socket flips the reading to `stale · offline` stamped with the **last live confirmation**,
not the last time the book moved, because the coordinator advances that timestamp every block
without emitting. The value logic is pure and checked in `runtime/book-reading.test.ts` (14 cases) —
a wrong equality check would silently freeze the book on screen.

Runtime rotation and `closeRuntime` both drop every entry and its watches (`onRuntimeClose`), so a
rebuilt client never leaves a book on screen that nothing is confirming.

### `/markets` hero-as-ticket (Stage 2, done 2026-09-01)

Ported from `reference/yosuku/app/markets/page.tsx` (render from L679) over the existing
DreamDEX pipeline — a presentation change, not a data change.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| `section.page-hero.markets-hero` + 4 `.crop` marks | L686–691 | `features/markets/MarketsHero.tsx` | Exact | **Done** |
| `.hero-grid.hero-grid-mini` (1fr + 400px, `items-start` at `lg`) | L693 | same + `styles/markets-hero.css` | Exact | **Done** — measured `836px 400px` at 1440, `534px 400px` at 1024 |
| Asset badge · mono asset label | L699–700 | `hero/HeroChartHead.tsx`, `hero/asset-mark.ts` | Adapted | **Done** — ₿ on Bitcoin orange for BTC; the venue also lists ETH, which gets its initial on a neutral disc rather than another asset's mark |
| Cadence tabs, active vermilion + 1px underline, dead lane dimmed and disabled | L707–729 | `hero/HeroCadenceTabs.tsx` | Adapted | **Done** — lanes derive from live `intervalSec` (FR-6), never a fixed list; the *pinned* lane is what holds its slot and its highlight when it is between rounds |
| Headline `BTC holds above <span.text-vermilion>$X</span>?` | L731–737 | `hero/HeroQuestion.tsx` | Adapted | **Done** — the line is the **opening print**, the level these Windows actually settle against, not a strike derived from spot |
| Distance line (`$83 above the UP line` / `needs +$X for UP to win`) | L738–746 | same | Exact phrasing | **Done** — branch from `neededMove` in core, not a second comparison |
| "Settles in" + countdown, block flips vermilion when urgent | L748–759 | `hero/HeroSettlesIn.tsx` | Adapted | **Done** — urgency from `urgentAtSec(intervalSec)` rather than a flat 60 s, which would misread a 1d lane |
| `.hero-chart-canvas` | L761–763 | `hero/HeroChart.tsx` | Adapted | **Done** — lightweight-charts in a filling box; the ported raw-`<canvas>` rule is scoped away from its internals |
| `.hero-chart-foot` — The Room + `.ramp` UP bar/cents | L764–789 | `hero/HeroChartFoot.tsx` | Exact layout; honest state | **Done** — Room disabled and says it waits on Stage 3; the ramp is real top-of-book, and an empty side reads "—" with no fill (never the reference's 50% default) |
| `.hero-yesno` mobile UP/DOWN with live cents | L790–813 | `hero/HeroYesNo.tsx` | Exact | **Done** — verified 79¢/24¢ matching the lane card at 390 |
| Ticket rail (desktop) / drawer (mobile) | `Ticket624Drawer` | `ticket/TicketDock.tsx` | Adapted | **Done** — rail above 900px, drawer below; the drawer has no trigger of its own, the UP/DOWN buttons are it |
| Bet type Up/Down · **Range** | `Ticket624Drawer` L858–869 | `ticket/BetModes.tsx` | Present, disabled | **Done** — Range names `RangeReserve` (Stage 5) as the missing piece; never wired to an ordinary Up/Down order |
| **Leverage chips** | `Ticket624Drawer` L1075–1090 | `ticket/LeverageChips.tsx` | Present, disabled | **Done** — 1× is real and selected; 2×/3× say they need the prefunded reserve (Stage 5) |
| Live-now card grid below the hero | L847–875 | `MarketsScreen.tsx` → existing `CadenceLanes` | Adapted | **Done** — our lane cards under `.markets-section` |
| Tutorial | L905 | `features/onboarding/*` | Exact shape | **Done** — see §First-run Tutorial |
| `WordMarketBoard` §02 | L878–881 | `features/markets/word-board/*` | Adapted | **Done** — see §Word-market board |
| Sensei dock, `MarketRoom` | L890, L896–903 | — | — | Pending — Stage 3 |

Shell correction found in this slice: `.page-shell` reserved space for the fixed chrome and
`.page-hero` reserved it again, leaving the hero under a band of dead page. `.page-shell` now
yields that reservation to a route that leads with a `.page-hero` (`styles/shell.css`).

### `/reels` (Stage 2, done 2026-09-01)

Ported from `reference/yosuku/app/reels/page.tsx` over the same pipeline that feeds `/markets`, so a
price cannot disagree between the two. `.feed-snap` / `.feed-card` were already ported verbatim in
`yosuku/part-16.css`; the card's values live in `styles/reel.css` + `styles/reel-chrome.css` under
the `markets-hero.css` convention (source utility named above each rule), because `design-literals`
bans hex and px in TSX.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| `main.feed-snap` fixed between the chrome and the viewport bottom, `scroll-snap-type: y mandatory` | L297–301 | `reels/ReelsScreen.tsx` | Exact | **Done** — `.page-shell` yields its chrome reservation to `.reel-page`, and the Footer is hidden as the reference does on `/feed` |
| Framed portrait card ≤460px, radial-gradient ground, film grain, vermilion top hairline | L119–125 | `reels/ReelCard.tsx` + `styles/reel.css` | Exact | **Done** — values copied, including the fractalNoise data URI |
| Top meta: ₿ disc · "BTC · settles on the price" · "{cadence} round · closes HH:MM" | L128–135 | `reels/ReelHead.tsx` | Adapted | **Done** — the mark is keyed to the asset (`hero/asset-mark.ts`), and the cadence word comes from `formatCadence` because lanes here are whatever the venue lists, not a fixed 1m/5m/1h table |
| "closes in" + countdown, flipping vermilion when closing | L136–141 | same | Adapted | **Done** — urgency from `countdown`/`urgentAtSec`, not the reference's flat threshold |
| `Will BTC be above <span.vermilion>$X</span>?` | L146–150 | `reels/ReelQuestion.tsx` | Adapted | **Done** — the line is the **opening print**, as on `/markets`; the reference freezes a strike derived from spot, which a real on-chain number does not need |
| Live price + `+$83 vs line` / `−$120 vs line` | L151–159 | same | Exact phrasing | **Done** — the branch comes from `neededMove` in core, so the reel and the hero cannot disagree about who is winning |
| The chart as the card's hero | L162–169 | `reels/ReelChart.tsx` | Adapted | **Done** — the reference shares one series across all cards and gates only its rAF redraw; each Window here has its own history, so an `IntersectionObserver` gates the whole thing: only the card on screen and its two neighbours fetch a series or mount a chart |
| One-tap UP/DOWN | L179–188 | `reels/ReelCall.tsx` | Improved | **Done** — the reference links to a bare `/markets`; these use the existing deep-link grammar (`/markets?m=…&dir=…`, UX-DR21) so the side you tapped arrives selected |
| "closing. the next round is already rolling" | L173–176 | same | Exact | **Done** — shown once the Window is inside the no-entry buffer (`phase()`), which is the same rule the reference approximates with `minMintMs * 0.6` |
| Dark island — the card stays black on cream in light mode | `part-14.css:124` | `styles/reel-theme.css` | **Deviation** | **Recorded, user's call 2026-09-01** — the card follows the theme like every other surface, so `/reels` is not an island. Light values are Yosuku's own light-card treatment, lifted from `.creator-studio` (`part-01.css:131`): surface `#fffaf2`, ink `#211c18`, `.cs-line` hairline, its raised shadow. One ink triplet per theme drives every step |
| `EmptyReel` — framed holding card with three pulsing dots | L199–213 | `reels/ReelHolding.tsx` | Exact | **Done** — covers reading / no venue / between rounds |
| Swipe-up hint pill, fading after a real scroll | L338–348 | `ReelsScreen.tsx` | Exact | **Done** — including the reference's own correction (60px, not the first stray pixel) |
| Take pill (right rail, mid-card) | L320–331 | same | Present, disabled | **Done** — names the social layer (Stage 3) rather than opening onto a feed that does not exist |
| Woven community takes, `TakeReelCard`, `TakeComposer624` | L44–53, L307–314 | — | — | Pending — Stage 3 |

Two adaptations worth knowing: rounds come from **every** live cadence the venue lists (the reference
is BTC + three fixed cadences), and membership derives from `phase()` like every other surface rather
than a second copy of the entry cutoff. `useReelRounds` holds its array identity while the membership
is unchanged — recomputing it on each clock tick would remount every card's chart once a second — but
only for as long as it came from the lane set still in hand, so a refetched Window is never rendered
from the previous poll's copy.

**`/fund` and `/claim` are not Stage 2 reads.** `/fund` (reference L29–99) is a Paystack card on-ramp
that charges NGN and credits testnet DUSDC from a treasury via `/api/fund-preview`: it needs a
Paystack key and a funded treasury signer, both owner-only, and funding is outside this authorization.
`/claim` (reference) is X-OAuth account recovery — Stage 4. Both keep their honest dependency state;
neither was silently reclassified.

### `/portfolio` — market portions (Stage 2, done 2026-09-01)

Ported from `reference/yosuku/app/portfolio/page.tsx` and its `Portfolio624Section`. Only the parts
that read the market pipeline are connected here; everything else keeps a named dependency state.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| No page headline — the balance is the header | L266–268 | `portfolio/PortfolioScreen.tsx` | Exact | **Done** |
| One spendable number, every other pool named beneath it and never summed in | `BalancePlate` L46–70 | existing `balance/BalancePlate.tsx` | Adapted | **Done** — already live on `/markets` and reviewed; the rule (FR-5) is the reference's own |
| `.ledger-plate` cream frame | `part-07.css:239` | — | Deviation | **Recorded** — the frame is a fixed cream slab with its own ink and the panel inside it is theme-aware; nesting them reproduces, in reverse, the "one card, two backgrounds" defect the reference's `.plate-rows` remap exists to fix. Our plate surface is used instead |
| Open bets: status · market · countdown · stake · value | `Portfolio624Section` L431–455 | `portfolio/BetsPanel.tsx`, `portfolio/BetRow.tsx` | Adapted | **Done** — off `getOpenPositionsWithPnL`, so cost basis, mark value and unrealised PnL are the venue's own numbers, not recomputed here |
| Silent status while a bet is live (pulsing dot + countdown say it twice already) | L440 | `BetRow.tsx` | Exact | **Done** |
| Row links back to its market | — | `BetRow.tsx` | Improved | **Done** — the deep-link grammar, as on the reel |
| Leverage column (`1.0×`) | L452 | — | Deviation | **Recorded** — Stage 5; a `1×` on every row is a number pretending to be a choice |
| Claimables / "collect now" | L457–470 | existing `claims/LiveClaimPlate` | Adapted | **Done** — already live on `/claims`, mounted here as §02 |
| Settled history, receipts, equity curve, reputation, badges, CSV export | L486–512 | — | — | Pending — Stage 3 (fill projection) |
| Trader Edge link | `TraderEdgeLink` | — | — | Pending — Stage 3 |
| Creator earnings, X wallet card | L318–329 | — | — | Pending — Stage 3–4 |
| Trading Balance vault (deposit/withdraw/sweep, private withdrawal) | L51–58 | — | — | Pending — Stage 4 (`EventVault`) |
| Copy-trading desk, leverage panel | L520+, `LeveragePortfolioPanel` | — | — | Pending — Stage 5 |

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
| Toast / tx feedback | `components/Toast.tsx` (130 L) | `web/src/components/ui/toast.tsx` + `styles/toast.css` | Adapted | **Done** — see §Toast |
| First-run onboarding modal (5 steps, Skip/Next) | `components/Tutorial.tsx` (192 L) | `web/src/features/onboarding/*` | Exact shape; adapted copy | **Done** — see §First-run Tutorial |
| Sensei dock + contextual bubble | Live `yosuku.xyz/markets`; `app/api/sensei/route.ts` | `web/src/features/sensei/*` | Adapted (AI over typed read models) | Pending |
| Error boundary | `app/error.tsx` | `web/src/app/error.tsx` | Exact | Partial (exists) |

Games add exactly one navigation destination. Markets, Reels, Create, Strategies, Leaderboard,
Portfolio and More all remain.

## Route baseline

| Route | Reference | Class | Data authority | Status |
|---|---|---|---|---|
| `/` | `app/page.tsx` | Exact shell; adapted identity/protocol copy | Static + real traction | **Shell** — honest dependency state |
| `/markets` | `app/markets/page.tsx` | Adapted to DreamDEX | DreamDEX indexer + RPC | **Partial** — real lanes/book/lifecycle/ticket live, Yosuku hero-as-ticket ported (see Stage 2 above), first-run Tutorial and the §02 word board live; Room and Sensei remain Stage 3 |
| `/markets/[id]` | `app/markets/[id]/page.tsx` | Exact redirect intent | — | **Done** — redirect |
| `/reels` | `app/reels/page.tsx` | Adapted | Shared market stream | **Live** — see §`/reels` |
| `/portfolio` | `app/portfolio/page.tsx` | Adapted | Chain/indexer projection | **Partial** — money, open bets and claimables live; see §`/portfolio` |
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
| Cadence-aware market discovery | **Partial** | Real 5m/15m/1h/4h/1d lanes live, on `/markets`, in the reel, and across the §02 word board |
| Hero-as-ticket trade flow | **Partial** | Ticket + quote + guarded write live; Yosuku presentation ported |
| Reel — snap feed of live Windows | **Partial** | Market cards live off the shared stream; woven community takes are Stage 3 |
| Up/Down · stake · cash-out · claim · receipt | **Partial** | Up/Down, stake, claim, receipt live; cash-out pending |
| Range · leverage · private | Pending | Stage 5 — needs `RangeReserve` + prefunded leverage + link-private service |
| Social takes, rooms, sharing, alerts, news/ticker, X linking | Pending | Stage 3–4 |
| Trading Balance with labeled pools | **Partial** | Balance plate + labeled pools exist; `EventVault` pending |
| Positions, PnL, history, equity, reputation, badges, Trader Edge | **Partial** | Open positions with the venue's own PnL live on `/portfolio`; history, equity, reputation, badges and Trader Edge are Stage 3 |
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
