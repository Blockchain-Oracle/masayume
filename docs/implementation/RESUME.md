---
title: Resume point — read this first
status: working handoff
updated: 2026-09-01
---

# Resume point

Start here, then read `parity-ledger.md`. The authority package is
`docs/architecture/yosuku-source-led-migration/` (read in its documented order).

## Where we are

Branch **`feat/yosuku-source-led-shell`** off `main` (`497b43a`). **Stage 2 is complete; Stage 3 is
underway — all four `/markets` slots are closed: the Tutorial, the §02 word board, the §01 chart
card, Sensei and the Room.**

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
| *(this)* | Stage 3 — the Room, position-gated over a real store |

Everything is green: `pnpm typecheck`, `pnpm invariants` (12/12), `pnpm test` (41),
`pnpm build` (55 routes). Dev server: `pnpm dev` → `http://localhost:3000` (`/` → `/markets`).

**Never touch or commit** the untracked `context/screens/` and `prompt.md`. They are the user's.

**Local dev state, not in the repo** (created 2026-09-01 to verify the Room, both safe to delete):
a Postgres database `masayume_room_dev` on the local instance, and `web/.env.local` pointing at it
with a throwaway `ROOM_TOKEN_SECRET`. `dropdb masayume_room_dev && rm web/.env.local` removes both;
the Room then reverts to its honest "not connected" state.

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
2. ~~**The Sensei dock**~~ — **done**, on Claude (`claude-opus-5`). The whole surface runs with no
   credential: ring, teaser, drawer, meter, tape and trade cards all read the market stream the page
   already holds, and with no key the route returns the reference's own 503 wording, which the dock
   says in the thread. **Set `ANTHROPIC_API_KEY` in `web/.env.local`** (documented in
   `.env.example`, never `NEXT_PUBLIC_`) and it lights up with no code change. **The live reply is
   the one thing unverified** — no key exists on this machine and spending the user's credential
   uninvited was not this agent's call; the request shape is checked by the SDK's types. First run
   with a key should confirm a reply arrives, the typewriter fires, and the style rules hold.
3. ~~**The Room**~~ — **done.** `packages/db` is real now (postgres.js, one table, schema applies
   itself), and the gate is the server's: a wallet must prove its address by signature *and* hold a
   position on that market, both checked in `api/room/join`. Set `DATABASE_URL` (and
   `ROOM_TOKEN_SECRET` where there is more than one instance); without it the Room opens and says
   it is not connected on this deployment. Verified against a local Postgres — 14 checks over the
   live endpoints, including a valid signature from a wallet with no position getting 403.
   **Two things to know**: comments are stored in the clear and the server can read them, so the
   badge says "bettors only" and not the reference's "Bettors only · Encrypted"; and the gate is
   *narrower* than the reference's `has_bet` — a wallet that redeemed a settled Window loses that
   Room.

**Next: the fill projection**, which unblocks the largest pending set at once: settled history and
receipts on `/portfolio`, the equity curve, PnL, stats, reputation, badges, `/portfolio/edge`
(Trader Edge), and `/leaderboard`. `portfolio/BetsPanel.tsx` names it as what it waits on.

Also Stage 3: Takes woven into the reel (`ReelsScreen.tsx` renders the composer pill disabled and
says so), rooms/comments, sharing, alerts, news/ticker, and the real `/status`, `/docs`,
`/how-it-works`, `/demo`, `/pitch`.

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

- `PriceChart.client.tsx` reads its colours at *mount*, so toggling the theme leaves the chart line
  in the old theme's ink until the next reload. Pre-existing, and unrelated to the container change
  above. Confirmed in the browser: a clean load is correct in both themes; only a live toggle is
  stale. Worth fixing when Stage 7 touches motion and performance.

## Open blockers (unchanged)

- **Native mobile — Blocked.** No native source exists. Responsive web/PWA is authoritative.
- **Masayume X account — owner-only.** Architecture supports it; live creation needs the user.
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
- **Not yet reviewed by the user:** `/portfolio`, the toast, the Tutorial. The Tutorial *was*
  inspected in the browser at both themes and at 390 before commit — a brand-new modal on a
  flipping surface is the exact bug class the four gates miss, and that check is what caught the
  two light-mode defects above. The user's `masayume.tutorialSeen` was left unset, so it opens on
  their next visit to `/markets`. The user asked not to be shown routine
  browser automation and said they will flag UI problems themselves — so those went in verified by
  typecheck, invariants, tests and build. Inspect the browser when they *do* flag something: this
  bug was invisible to all four gates.
