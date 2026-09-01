---
title: Resume point — read this first
status: working handoff
updated: 2026-09-01
---

# Resume point

Start here, then read `parity-ledger.md`. The authority package is
`docs/architecture/yosuku-source-led-migration/` (read in its documented order).

## Where we are

Branch **`feat/yosuku-source-led-shell`** off `main` (`497b43a`):

| Commit | What |
|---|---|
| `1658ffc` | Stage 0–1 — source-led Yosuku shell, identity, 42 public routes |
| `cd35292` | Stage 2 (part) — shared read runtime + isolated signing sessions |
| `2ad9237` | Ledger record of the signing architecture |
| `d0dd6f5` | Resume point |
| *(this)* | Stage 2 — `/markets` hero-as-ticket |

Everything is green: `pnpm typecheck`, `pnpm invariants` (12/12), `pnpm test` (18),
`pnpm build` (51 routes). Dev server: `pnpm dev` → `http://localhost:3000` (`/` → `/markets`).

**Never touch or commit** the untracked `context/screens/` and `prompt.md`. They are the user's.

## Facts you do not need to re-derive

- **Pin verified**: `reference/yosuku` HEAD == `origin/main` == `3c56ef52b78dae28cc198495f753480292f6a5ad`, zero drift.
- **Provenance cleared**: the user owns / has permission for Yosuku source. Port source, CSS,
  tokens and assets **verbatim** — do not rebuild from screenshots or memory.
- **Design system is already ported**: `web/src/styles/yosuku/part-01..18.css`, split from
  `app/globals.css` at brace-depth-zero, concatenation verified byte-identical. Regenerate the
  split rather than hand-editing a part. Most Yosuku classes you will need already exist
  (`.hero-chart`, `.hero-chart-head`, `.cadence-chip`, `.ramp`, `.hero-yesno`, `.crop`, …) —
  **grep the parts before writing any new CSS.**
- **Gold/Archivo theme is deleted**, not layered. `web/src/styles/bridge.css` maps the semantic
  names old components use onto Yosuku values and holds no colour of its own.
- **Invariants matter**: no file over 400 lines under `web/src`, `packages`, `services`,
  `scripts`; no raw hex or `px` literals in TS/TSX under `web/src/{app,components,features,providers}`
  — *including inside comments*. Run `pnpm invariants` before claiming done.

## Done last session: `/markets` hero-as-ticket

The hero is now the page — question, chart and ticket as one object, with the lanes below as the
way to change it. Verified in the browser at 390 / 768 / 1024 / 1440, light and dark, no console
errors and no horizontal overflow. Full parity table in `parity-ledger.md` §`/markets`
hero-as-ticket. New surfaces: `features/markets/MarketsHero.tsx`, `features/markets/hero/Hero*`,
`features/markets/ticket/{BetModes,LeverageChips}.tsx`, `styles/{markets-hero,ticket}.css`.

Three adaptations worth knowing before you touch it:

- **The line is the opening print.** Yosuku derives a strike from spot; these Windows settle at or
  above the opening print, so that is what the headline asks about. Real on-chain number, not a
  derived one.
- **Cadence tabs come from live lanes.** `groupIntoLanes` forbids a hardcoded cadence list (FR-6),
  so the tab row is whatever is live plus the pinned lane, which keeps its slot and its highlight
  while it is between rounds.
- **The ramp and UP/DOWN prices are real top-of-book** (`hero/useTopOfBook.ts`). An empty side is
  "—" with no fill; the reference's 50% default would be an invented odd.

Range and leverage are rendered, disabled, naming Stage 5 as what they wait on. The Room is
rendered, disabled, naming Stage 3.

**Known, not fixed (pre-existing, not from this slice):** `PriceChart.client.tsx` reads its colours
from CSS vars *at mount*, so toggling the theme leaves the chart line in the old theme's ink until
the next reload. Worth fixing when Stage 7 touches motion and performance.

## The next slice: one subscription coordinator (finishes Stage 2)

The hero surfaced the cost of per-route reads: `/markets` alone mounts `useLanes`, `useMarket`,
`useOpeningPrice`, `useChartSeries` (history + live asset price) and `useBook` — and every lane
card mounts its own `useBook` on top. React Query dedupes by key, but nothing normalises the
readings or dedupes the *subscriptions* by market/account.

Build the coordinator in `packages/markets/src/runtime/`: normalise market / book / candle /
lifecycle / account readings once, fan out to subscribers, dedupe by market and account key. The
read runtime from `cd35292` is where it belongs — it already owns the shared clients and caches
and has no signer to worry about.

Then, still in Stage 2:

- Connect `/reels`, `/fund`, `/claim` and Portfolio's market portions to the same pipeline.
- Port Yosuku's Toast presentation (currently ours; functional and themed).

Then Stages 3→7 exactly as `05-migration-and-agency-handoff.md` sequences them. The first Stage 3
items that `/markets` is now visibly waiting on: the Room (`MarketRoom`), the Sensei dock, the
first-run Tutorial, and the word-market board — all four have their slots on the page already.

**Honesty constraints that keep applying** (doc 05 §No fake-data, doc 00 §No-substitution):
never an invented odd, balance, fill or payout; loading and unavailable are valid states; a
capability that is not connected keeps its control and says what is missing.

## Open blockers (unchanged)

- **Native mobile — Blocked.** No native source exists. Responsive web/PWA is authoritative.
- **Masayume X account — owner-only.** Architecture supports it; live creation needs the user.
- Nothing may be pushed, deployed, published or funded without separate authorization.

## User feedback carried forward

- 2026-09-01: reviewed the running shell — "looks good", colours "getting there".
- Flagged that the markets surface still needs work → done, hero-as-ticket ported. **Not yet
  reviewed by the user.** Show them `/markets` before treating the presentation as settled.
