---
title: Resume point — read this first
status: working handoff
updated: 2026-09-02
---

# Resume point

Start here, then read `parity-ledger.md`. The authority package is
`docs/architecture/yosuku-source-led-migration/` (read in its documented order).

## Where we are

Branch **`feat/yosuku-source-led-shell`** off `main` (`497b43a`). **Stage 2 is complete; Stage 3 is
nearly closed — all four `/markets` slots (Tutorial, §02 word board, §01 chart card, Sensei, the Room),
the fill projection (history, equity, PnL, reputation, badges, CSV, `/portfolio/edge`, `/leaderboard`),
and now the social and public-proof slice: takes woven into the reel, the two share cards, price alerts
with a live evaluator, `/news`, `/status`, `/docs`, `/how-it-works`, `/demo` and `/pitch`.**

| Commit | What |
|---|---|
| `1658ffc` | Stage 0–1 — source-led Yosuku shell, identity, 42 public routes |
| `cd35292` | Stage 2 — shared read runtime + isolated signing sessions |
| `2ad9237` | Ledger record of the signing architecture |
| `0c12f98` | Stage 2 — `/markets` hero-as-ticket |
| `315ddf0` | Stage 2 — one subscription coordinator for the live book |
| `24ec4e2` | Stage 2 — `/reels` on the shared market stream |
| `ac416b1` | Stage 2 — Portfolio's market portions |
| `99d2623` | Stage 2 — Toast presentation; Stage 2 closed |
| `3943222`, `d488471` | Reel light-mode fix, then the card made theme-following |
| `f451f38` | Stage 3 — first-run Tutorial |
| `aa3b3b8` | Stage 3 — `/markets` §02 word-market board |
| `9de0a01` | Stage 3 — §01 as the reference's chart card |
| `c43819a` | Stage 3 — Sensei on Claude, honest without a key |
| `9f86edc` | Stage 3 — the Room, position-gated over a real store |
| `6f45a88` | Sensei's model as a setting |
| `4f442d5` | Stage 3 — the fill projection: history, equity, Trader Edge, leaderboard |
| `9a76900` | Stage 3 — takes, share cards, alerts, news, status, docs, how-it-works, demo, pitch |
| `04ce0eb` | Stage 3 — the share cards as an X banner with a QR stub (user's call) |
| *(this)* | Stage 3 — `/stats`, `/download`, error recovery; Stage 3 closed |

Everything is green: `pnpm typecheck`, `pnpm invariants` (12/12), `pnpm test` (58),
`pnpm build`. Dev server: `pnpm dev` → `http://localhost:3000` (`/` → `/markets`).

**Never touch or commit** the untracked `context/screens/` and `prompt.md`. They are the user's.

**`/dev/*` is scaffolding.** The user keeps it only to eyeball fixtures quickly and will remove the whole
tree before production — never link it from the app, never treat a `/dev` mount as the feature shipping.

**Local state, not in the repo**: `web/.env.local` (gitignored) holds the user's Neon
`DATABASE_URL` and a random `ROOM_TOKEN_SECRET`. The temporary local `masayume_room_dev` database
used to verify the Room on 2026-09-01 has been dropped. **The Neon credential was pasted into a
chat transcript** — worth rotating in the Neon console once the hackathon is over.

## Facts you do not need to re-derive

- **Pin verified**: `reference/yosuku` HEAD == `origin/main` == `3c56ef52b78dae28cc198495f753480292f6a5ad`, zero drift.
- **Provenance cleared**: the user owns / has permission for Yosuku source. Port source, CSS,
  tokens and assets **verbatim** — do not rebuild from screenshots or memory.
- **Design system is already ported**: `web/src/styles/yosuku/part-01..18.css`, split from
  `app/globals.css` at brace-depth-zero, concatenation verified byte-identical. Regenerate the
  split rather than hand-editing a part. Most Yosuku classes you will need already exist —
  **grep the parts before writing any new CSS.** `/reels`' `.feed-snap` and `.feed-card` were
  already in `part-16.css`; the toast's emerald/rose were already `--profit` / `--loss`.
- **The pattern for porting a card**: the reference writes everything as inline Tailwind
  arbitrary values, and `design-literals` bans hex and px in TSX. So the values go into a CSS
  module with the source utility string named above each rule (`markets-hero.css`, `reel.css`,
  `toast.css`) and the TSX carries semantic class names.
- **Invariants matter**: no file over 400 lines under `web/src`, `packages`, `services`,
  `scripts` — **including `.css`** (`reel.css` had to be split); no raw hex or `px` literals in
  TS/TSX under `web/src/{app,components,features,providers}`, *including inside comments*.
  Run `pnpm invariants` before claiming done.

## The read pipeline, after the coordinator

`packages/markets/src/runtime/coordinator.ts` holds **one normalised book per market**, derived once
at `CANONICAL_BOOK_DEPTH`, fanned out only when the resting liquidity or the connection actually
moved. Three things it fixed are worth not re-introducing:

- **Never ask the live store for a second depth.** Its memo cache is keyed on the depth
  (`bookynm:<market>:<depth>` over `book:<pool>:<depth>`), so each distinct depth makes it walk the
  whole resting-order map again, per pool, per block. `useBook` has no `depth` argument on purpose —
  slice what you display out of the reading.
- **The store's version bumps every block**, so an unchanged book still arrives as a new object every
  block. `sameBookDepth` is what stops that re-rendering every consumer.
- **Do not pass an inline object to a data hook.** All three old `useBook` call sites built
  `{ marketId, poolAddress, decimals }` fresh each render, so the memo inside never held.

`useTick` shares one timer per interval (`react/tick-clock.ts`). The SDK already ref-counts its pool
watches, so the transport was never the duplicated part — do not rebuild that layer.

## Stage 3 — in progress

Per `05-migration-and-agency-handoff.md`. Four slots were waiting on `/markets` and `/reels`.
**All four are done.** What each needed, kept because it explains the shape of what is there:

1. ~~**The word-market board**~~ — **done**, `/markets` §02, and §01 is now the reference's chart
   card (`Market624Card`) on the user's call, so the two sections speak different languages the way
   the reference's do. Both invented numbers are gone: the `probAbove` logistic is the book's real
   asks, the spot-derived `strike624` line is the opening print.
2. ~~**The Sensei dock**~~ — **done, and provider-agnostic** (revised 2026-09-02 on the user's
   call). Runs on the Vercel AI SDK 7; `AI_MODEL` picks the model, default
   `anthropic/claude-opus-5`. The whole surface runs with no credential at all — ring, teaser,
   drawer, meter, tape and trade cards read the market stream the page already holds — and with
   none set the route says so **and names the variable that would fix it**. Set any one of:
   a direct key (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`),
   `AI_GATEWAY_API_KEY`, or `AI_BASE_URL` + `AI_API_KEY` for anything OpenAI-shaped. See the
   ledger's §Sensei's model layer for the resolution order and what the abstraction cost.
   **The live reply is still the one thing unverified** — no credential on this machine.
3. ~~**The Room**~~ — **done and live on Neon** (the user supplied a `DATABASE_URL` on
   2026-09-02; schema self-applied, round-trip verified against it). `packages/db` is real
   (postgres.js, one table), and the gate is the server's: a wallet must prove its address by
   signature *and* hold a position on that market, both checked in `api/room/join`. Without a
   `DATABASE_URL` the Room opens and says it is not connected on this deployment. 14 checks over
   the live endpoints, including a valid signature from a wallet with no position getting 403.
   **Two things to know**: comments are stored in the clear and the server can read them, so the
   badge says "bettors only" and not the reference's "Bettors only · Encrypted"; and the gate is
   *narrower* than the reference's `has_bet` — a wallet that redeemed a settled Window loses that
   Room.

4. ~~**Takes, sharing, alerts, news, status, docs, how-it-works, demo, pitch**~~ — **done 2026-09-02**,
   split across six forks and the main session; every piece has a ledger section (§Takes, §Sharing,
   §Alerts, §News and ticker, §Status, §Public proof). Things worth knowing before touching any of it:
   - **Takes** are rows in `packages/db` (`takes` table, applied by the shared `ensureSchema`) whose
     verifiable spine is the wallet's `personal_sign` over `takeMessage()` in `features/takes/protocol.ts`.
     The route stores the caption **exactly as signed** and refuses one it would have had to normalise —
     the composer normalises before signing. `backed` is the Room's `holdsPosition` read at post time.
     `GET /api/takes` answers `{ configured:false, takes:[] }` with no store, never an error. Verified by
     a scratch script signing with the demo wallet (12 checks); one real take from `0xd357…9358` is in
     the store ("endpoint check — …") — delete it from `takes` if it should not stay in the reel.
   - **Share cards** (`features/share/`): `canvas.ts` is the drawing kit both PNGs use; it reads
     `--share-*` tokens off `share-card.css`, and `font()` builds canvas font strings, so no hex or px
     lives in TSX. `/dev/share` renders every export as an `<img>` — the way to look at a card.
     **Redesigned 2026-09-02 on the user's call** (the one surface exempt from source-led replication):
     a 1600×900 X banner whose perforation runs vertical, with a stub (`stub.ts`) carrying a QR to
     `https://masayume.app`, the site and `@masayume_app` — brand constants in `copy.ts`, given by the
     owner. QR via `qrcode-generator`. **Where they show in the app**: The Call is the ticket body in the
     `/markets` hero from the moment a fill confirms (`ticket/Ticket.tsx` → `PlacedCall`), Earned Heat is
     "Share card ↗" on every Verdict receipt (`LiveVerdict`, and `/portfolio` settled rows via
     `HistoryReceipt`). `PlacedCall` snapshots the Window at mount because `useTicket` auto-advances in
     the no-entry buffer while the bet state stays.
   - **Alerts** fire only while a tab is open (browser-side evaluator in `AppProviders`); the popover
     says so. Placement in the hero foot is ours and awaits the user's eye.
   - **`/status`** is the probe; a stale last-good reading is reported as a failed probe on purpose.
   - **`/demo`** and **`/pitch`** read `/api/leaderboard` live; a cold board takes ~35 s and both show a
     reading state until it lands.
   - **`/news`** exists because the feed and its RSS route survived in the pinned source; the page is the
     reference's own from `93d09c1^`. Nav entry in the More menu.

5. ~~**The fill projection**~~ — **done 2026-09-02**, and it unblocked the whole pending set at
   once: settled history with receipts, the equity curve, PnL, stats, reputation, badges and CSV on
   `/portfolio`; `/portfolio/edge`; `/leaderboard`. One derivation (`packages/core/src/projection/`)
   replays a wallet's indexed fills and complete-set router actions into one ledger per Window and
   settles each by the chain's rule; `listWalletHistory` / `useWalletHistory` is the port read;
   `readVenueBoard` runs the same replay venue-wide for the board's server route. **No database, no
   credential.** Read the ledger's §Fill projection before touching any of it — it records the three
   venue facts the code depends on: a sell beyond inventory is a collateral-backed short (the wallet
   ends up holding the complement, and the SDK's own PnL engine drops it); redemptions through the
   settlement contract leave no per-wallet indexer record (claim state is read from live balances);
   the indexer pages at 1,000 and the busiest wallet is past both caps (the reading pages five deep
   and says `complete: false` beyond). Verified against chain balances on 89 settled markets across
   four active wallets before any UI was written (`pnpm --filter @masayume/scripts
   spike:fill-projection-verify`); `spike:fill-projection-live` reads one wallet end to end.

6. ~~**`/stats`, `/download`, error recovery**~~ — **done 2026-09-02** (two forks + the main session). Worth knowing:
   - **`/stats`** rides on the board's scan: `packages/markets/src/provider/scan.ts` is the shared venue scan,
     `traction.ts` derives wallets / calls / cash-outs / staked / windows / an hourly curve / 30 recent rows from
     the same fills, and `/api/traction` answers from `readBoard()`'s three-minute cache. **Scope is 24h** and
     an incomplete scan labels every figure a floor (ledger §Traction). A cold read measured 66 s; both scan
     routes now allow 120 s. Live numbers on 2026-09-02: 69 wallets, 438 calls (one per taker order, not per fill row), 16,325 tUSDC staked.
   - **`/download`** is the PWA surface: `web/public/manifest.webmanifest` + `web/public/icons/*` (rendered
     from the mark with rsvg-convert), `features/install/useInstallPrompt.ts` (installed / prompt / ios /
     manual), the reference's phone frame around a **real capture** at `web/public/app/bet-screen.png` —
     re-capture it at a 390×844 viewport (2×) whenever the markets page changes materially. Native stays
     Blocked and the meta list says so.
   - **Error recovery**: `packages/markets/src/submitter/recovery.ts` + `features/recovery/WriteRecovery.tsx`
     reconcile every unresolved journaled intent when a session starts and tell the user (landed / reverted /
     absent / unverifiable after 24h / still checking). Order records now carry `pool` and `marketId`.
     `app/error.tsx` uses the reference's words again; `app/global-error.tsx` is new and additive.

**Next**: Stage 4 (`EventVault` and the Unified Trading Balance, embedded session trading and the
gas-sponsorship policy, the strategy registry/runner and agent/creator surfaces, X OAuth linking and the
mention rail — the live X account itself needs the owner). Fear/Greed on the ticker still waits on a
provider. `/social` (the reference's internal marketing-content board) is untouched and keeps its shell.
Lifecycle alerts have no reference source.

**Honesty constraints that keep applying** (doc 05 §No fake-data, doc 00 §No-substitution):
never an invented odd, balance, fill or payout; loading and unavailable are valid states; a
capability that is not connected keeps its control and says what is missing.

## Never write `var(--white)` on a surface that does not flip

Yosuku's light theme works by **remapping `--white` to `#141210`**, so every `text-white` it wrote
for dark mode becomes readable ink on cream. That is fine everywhere the surface flips with the
theme — and exactly backwards on a surface that does not.

The first cut of `reel.css` used `color: var(--white)` while the card stayed black in light mode
(the reference's dark island). Result: the question, the countdown and the live price rendered
near-black ink on a near-black card. The literal `rgba(255,255,255,…)` steps in the same file were
fine; only the token broke, which is why *half* the card went missing rather than all of it.
**None of typecheck, invariants, tests or build can catch this** — contrast is not a type error.

`/reels` is no longer an island: on the user's call (2026-09-01) the card follows the theme, using
Yosuku's own light-card values from `.creator-studio` (`part-01.css:131`). `reel-theme.css` holds
one ink triplet per theme and every step in `reel.css` is `rgb(var(--reel-ink-rgb) / <alpha>)`
carrying the reference's own alpha — so a future theme change is one triplet, not eleven literals.

Two things that deliberately do **not** take that token: `.reel-take` and `.reel-hint-pill` sit on
vermilion in both themes, so their ink is a literal `#fff`; `.reel-hint-arrow` sits on the *page*,
so it takes `var(--color-ink)`.

### The same rule for backgrounds and borders — and the gap that causes it

**Three components in a row have now hit this**, so treat it as expected, not as bad luck.
part-14.css remaps the `*-white` utilities and the dark chips for light mode, but its ladder has
**holes**, and anything that falls through renders white-on-cream or black-on-cream:

- `bg-white/20` — the ladder stops at `/10` (Tutorial step dots)
- `border-white/[0.12]`, `hover:bg-white/[0.06]` — arbitrary values not in its lists (Tutorial)
- `.mc-spark .strike-tick` — an `rgba(5,5,5,0.7)` chip with no light rule at all (§01 card)

The reference has each of these defects too; its own cards flip to cream the same way. Each was
fixed scoped, in the component's own CSS file, with values taken from part-14's own ladder rather
than picked by eye. **Before porting the next dark component, grep its `*-white` utilities and any
dark-ground chip against part-14.** Do not hand-edit `part-14.css` — regenerate the split instead.

The gray ramp is the second half of this. `text-gray-*` does not follow the light theme at all (the
recorded Tailwind-4 `@config` finding). The ledger reserved "evidence of unreadable text" as the
trigger to diverge, and the Tutorial produced it: body copy at **2.36:1** on cream. Remapped for
that card only. **A reviewed global pass over the other 811 `text-gray-*` utilities is still open.**

`PriceChart.client.tsx` reads its CSS vars off **its own container** rather than
`document.documentElement`, which is what lets any card hand the chart surface-appropriate ink.
Behaviour is unchanged everywhere else (verified: on `/markets` the container inherits the root's
value, and a clean load draws dark-on-cream).

## Known, not fixed

- The venue's `getOpenPositionsWithPnL` (the open-bets rows) clamps a sell beyond inventory to zero and
  drops the complement, so an open **short** shows as no position until the Window settles, when the
  projection books it correctly. Recorded in the ledger; the open rows keep the venue's numbers.
- `/api/leaderboard` takes ~35 s cold (a venue-wide scan of two days of fills, fees per market, router
  actions per wallet), then serves from a 3-minute in-memory cache. Fine for one process; a
  multi-instance deploy would recompute per instance until the deferred DB projection exists.

- `PriceChart.client.tsx` reads its colours at *mount*, so toggling the theme leaves the chart line
  in the old theme's ink until the next reload. Pre-existing, and unrelated to the container change
  above. Confirmed in the browser: a clean load is correct in both themes; only a live toggle is
  stale. Worth fixing when Stage 7 touches motion and performance.

## Open blockers (unchanged)

- **Native mobile — Blocked.** No native source exists. Responsive web/PWA is authoritative.
- **Masayume X account.** The handle is `@masayume_app` and the site `masayume.app` (given by the user
  2026-09-02; constants in `features/share/copy.ts`). Live posting and X OAuth linking stay Stage 4 and
  owner-authorized.
- **`/fund` — owner-only.** The reference's on-ramp needs a Paystack key and a funded treasury
  signer; funding is outside this authorization. `/claim` is X-OAuth recovery, Stage 4. Neither was
  reclassified; both keep their dependency state.
- Nothing may be pushed, deployed, published or funded without separate authorization.

## User feedback carried forward

- 2026-09-01: reviewed the running shell — "looks good", colours "getting there".
- 2026-09-01: flagged the reel card reading wrong in light mode. Correct on both counts — the text
  was invisible (the `--white` remap above), and the card's darkness was unwanted. **Decision: the
  reel card follows the theme.** Recorded as a deviation in the ledger. Verified in the browser at
  both themes after the change.
- 2026-09-02: reviewed `/dev/share` — ruled the share card the one surface we may redesign our own way,
  gave the X handle `@masayume_app` and the site `masayume.app`, asked for a QR to the app and an X-sized
  banner instead of the tall card. Said again that `/dev` is temporary. Asked where the cards live in the
  real app (answered above under Share cards). Feedback on the work so far: positive.
- **Not yet reviewed by the user:** `/stats`, `/download`, the boundary screens, the recovery toasts; the whole social and public-proof slice (the woven reel and the
  composer, The Call after a fill, the share button on receipts, the alert bell in the hero foot,
  `/news`, `/status`, `/docs`, `/how-it-works`, `/demo`, `/pitch`), and before it `/portfolio` (settled
  rows, §03 "Your record", the Trader Edge link), `/portfolio/edge`, `/leaderboard`, the toast, the
  Tutorial. Decisions flagged for the user in the ledger's log: the alert bell's placement; `/news`
  restored from the reference's history; `/docs` linking the GitHub repo; the pitch's drawn Somnia mark. Two placements are
  ours and flagged in the ledger's decision log for review: reputation/badges/equity/CSV mounted under
  `/portfolio` §03 (the reference computes them there but its pinned JSX never mounts them), and
  reputation without the reference's per-tier bonus/fee percentages (no contract pays either). The
  fill-projection surfaces were inspected in the browser at 1280 and 390 in both themes via
  `/dev/history` before commit. The Tutorial *was*
  inspected in the browser at both themes and at 390 before commit — a brand-new modal on a
  flipping surface is the exact bug class the four gates miss, and that check is what caught the
  two light-mode defects above. The user's `masayume.tutorialSeen` was left unset, so it opens on
  their next visit to `/markets`. The user asked not to be shown routine
  browser automation and said they will flag UI problems themselves — so those went in verified by
  typecheck, invariants, tests and build. Inspect the browser when they *do* flag something: this
  bug was invisible to all four gates.
