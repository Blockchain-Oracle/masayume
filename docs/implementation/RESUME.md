---
title: Resume point — read this first
status: working handoff
updated: 2026-09-01
---

# Resume point

Start here, then read `parity-ledger.md`. The authority package is
`docs/architecture/yosuku-source-led-migration/` (read in its documented order).

## Where we are

Branch **`feat/yosuku-source-led-shell`** off `main` (`497b43a`). **Stage 2 is complete.**

| Commit | What |
|---|---|
| `1658ffc` | Stage 0–1 — source-led Yosuku shell, identity, 42 public routes |
| `cd35292` | Stage 2 — shared read runtime + isolated signing sessions |
| `2ad9237` | Ledger record of the signing architecture |
| `0c12f98` | Stage 2 — `/markets` hero-as-ticket |
| `315ddf0` | Stage 2 — one subscription coordinator for the live book |
| `24ec4e2` | Stage 2 — `/reels` on the shared market stream |
| `ac416b1` | Stage 2 — Portfolio's market portions |
| *(this)* | Stage 2 — Toast presentation; Stage 2 closed |

Everything is green: `pnpm typecheck`, `pnpm invariants` (12/12), `pnpm test` (32),
`pnpm build` (51 routes). Dev server: `pnpm dev` → `http://localhost:3000` (`/` → `/markets`).

**Never touch or commit** the untracked `context/screens/` and `prompt.md`. They are the user's.

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

## The next slice: Stage 3

Per `05-migration-and-agency-handoff.md`. The four things `/markets` and `/reels` are now visibly
waiting on, all with their slots already on the page:

1. **The Room** (`MarketRoom`) — `hero/HeroChartFoot.tsx` renders it disabled and names Stage 3.
2. **The Sensei dock** — contextual bubble ("Coin-flip?" / "Up or down?"), live-only behaviour that
   source-reading misses; see the plan's §Verified facts.
3. **The first-run Tutorial** — a 5-step modal (Skip/Next), also live-only.
4. **The word-market board** (`WordMarketBoard`).

Then the fill projection, which unblocks the largest pending set at once: settled history and
receipts on `/portfolio`, the equity curve, PnL, stats, reputation, badges, `/portfolio/edge`
(Trader Edge), and `/leaderboard`. `portfolio/BetsPanel.tsx` names it as what it waits on.

Also Stage 3: Takes woven into the reel (`ReelsScreen.tsx` renders the composer pill disabled and
says so), rooms/comments, sharing, alerts, news/ticker, and the real `/status`, `/docs`,
`/how-it-works`, `/demo`, `/pitch`.

**Honesty constraints that keep applying** (doc 05 §No fake-data, doc 00 §No-substitution):
never an invented odd, balance, fill or payout; loading and unavailable are valid states; a
capability that is not connected keeps its control and says what is missing.

## Known, not fixed

- `PriceChart.client.tsx` reads its colours from CSS vars *at mount*, so toggling the theme leaves
  the chart line in the old theme's ink until the next reload. Pre-existing; worth fixing when
  Stage 7 touches motion and performance. It now affects `/reels` as well as `/markets`.
- `MarketsScreen.tsx` uses `aria-labelledby="section-lanes"`, but `SectionHeader` takes no `id`, so
  the reference dangles. Newer sections use `aria-label` instead. One-line fix, not made mid-slice.

## Open blockers (unchanged)

- **Native mobile — Blocked.** No native source exists. Responsive web/PWA is authoritative.
- **Masayume X account — owner-only.** Architecture supports it; live creation needs the user.
- **`/fund` — owner-only.** The reference's on-ramp needs a Paystack key and a funded treasury
  signer; funding is outside this authorization. `/claim` is X-OAuth recovery, Stage 4. Neither was
  reclassified; both keep their dependency state.
- Nothing may be pushed, deployed, published or funded without separate authorization.

## User feedback carried forward

- 2026-09-01: reviewed the running shell — "looks good", colours "getting there".
- **Not yet reviewed by the user:** `/markets` hero-as-ticket, `/reels`, `/portfolio`, the toast.
  The user asked not to be shown browser automation and said they will flag UI problems themselves —
  so these four went in verified by typecheck, invariants, tests and build, not by inspection.
