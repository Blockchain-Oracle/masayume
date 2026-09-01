---
title: Resume point — read this first
status: working handoff
updated: 2026-09-01
---

# Resume point

Start here, then read `parity-ledger.md`. The authority package is
`docs/architecture/yosuku-source-led-migration/` (read in its documented order).

## Where we are

Branch **`feat/yosuku-source-led-shell`** off `main` (`497b43a`). Three commits:

| Commit | What |
|---|---|
| `1658ffc` | Stage 0–1 — source-led Yosuku shell, identity, 42 public routes |
| `cd35292` | Stage 2 (part) — shared read runtime + isolated signing sessions |
| `2ad9237` | Ledger record of the signing architecture |

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

## The next slice: port `/markets` to Yosuku's hero-as-ticket

This is the user's stated priority and the highest-value remaining work. The data pipeline
underneath is **already real and correct** — this is a presentation port, not a data change.

**Current state:** `/markets` renders our own layout (numbered `01 · Live windows`,
`02 · The window`, `03 · Your call`). The user has seen it and confirmed the shell/colours are
"getting there", but the markets presentation itself must become Yosuku's.

**Reference:** `reference/yosuku/app/markets/page.tsx` (908 lines) — the render begins ~line 678.
Structure to reproduce:

```
section.page-hero.markets-hero  (+ .crop tl/tr/bl/br corner marks)
  .container > .hero-grid.hero-grid-mini   (desktop: 1fr + 400px rail)
    .hero-chart
      .hero-chart-head
        asset badge (₿) · mono asset label
        cadence tabs — active is vermilion with a 1px underline; a lane between
          rounds stays in place, dimmed and disabled, so the row never shifts under a tap
        h2  "BTC holds above <span.text-vermilion>$77,800</span>?"
        distance line — "$83 above the UP line" / "needs +$X for UP to win"
        right: "Settles in" + countdown (whole block flips vermilion under 60s)
      .hero-chart-canvas          ← keep our lightweight-charts PriceChart here
      .hero-chart-foot            ← "The Room · bettors only" + .ramp UP bar/cents
      .hero-yesno                 ← mobile UP/DOWN buttons with live cents
    ticket rail (desktop) / drawer (mobile)
```

**What we already have to feed it** (all real, all working — reuse, do not rewrite):
`web/src/features/markets/` — `useLanes`, `hero/` (PriceChart, CountdownBlock, DistanceReadout,
OraclePrice), `ticket/` (useQuote, usePlaceBet, useTicket), `lanes/useLanes`, `verdict/`.

**Honesty constraints for this slice** (doc 05 §No fake-data, doc 00 §No-substitution):
- The **RANGE tab** and **leverage chips** are Yosuku parity and must be *present*, but
  `RangeReserve` and the prefunded leverage model are Stage 5. Render them **disabled with a
  truthful explanation** — do not omit them, and do not wire them to ordinary Up/Down.
- **The Room** is Stage 3 (Postgres + realtime). Keep the control, give it an honest state.
- Never show an invented odd, balance, fill or payout. Loading and unavailable are valid states.

## After that, still in Stage 2

- One subscription coordinator: normalise market/book/candle/account readings once and fan out,
  instead of per-route queries. Deduplicate by market/account key.
- Connect `/reels`, `/fund`, `/claim` to the same pipeline.
- Port Yosuku's Toast presentation (currently ours; functional and themed).

Then Stages 3→7 exactly as `05-migration-and-agency-handoff.md` sequences them.

## Open blockers (unchanged)

- **Native mobile — Blocked.** No native source exists. Responsive web/PWA is authoritative.
- **Masayume X account — owner-only.** Architecture supports it; live creation needs the user.
- Nothing may be pushed, deployed, published or funded without separate authorization.

## User feedback carried forward

- 2026-09-01: reviewed the running shell — "looks good", colours "getting there".
- Flagged that the markets surface still needs work (this is the slice above).
