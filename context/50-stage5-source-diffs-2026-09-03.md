# Stage 5 ports diffed against the reference source (2026-09-03)

Six read-only agents each took one Stage 5 surface and compared our port with the reference's source, rule by rule:
copy, element order, the Tailwind utility quoted above every CSS rule against the value the rule writes, states,
breakpoints. Their reports arrived after the browser review (context/49) had been committed. This file keeps every
finding, marked **fixed** (commit after b8e620d, the same day), **recorded** (a deviation the ledger now carries, or a
row corrected) or **open** (a structural or product change that is the owner's call). Reference paths are under
`reference/yosuku/`, ours under `web/src/`.

Three things every agent reported: the shared design-system blocks (`.section-head`, `.page-title`, `.container`,
the `--gray-*` and `--vermilion` values) diff clean against the reference's `globals.css`; the CSS modules are
faithful transcriptions with a handful of colour-family and margin slips; the drift is in the **frame** each page is
mounted into and in the **states** (loading, empty, placed), not in the cards.

## Across surfaces — the shell (open)

- **The first paint is a skeleton bar.** `/parlay`, `/earn` and `/surface` wrap the whole page in a `ReadingBoundary`
  on one chain read, so the hero and the static sections wait for it; the reference renders them at once and lets one
  panel say it is loading (`app/earn/page.tsx` L222–224). **Fixed on `/earn`** (the hero renders immediately, the
  vault panel says "loading the vault…"); `/parlay` and `/surface` still wait — open, the same change applies.
- **Dead space above the footer.** The reference neutralises the global `.footer { margin-top: 120px }` on short
  pages (`[&_.footer]:mt-0`, earn page.tsx L309–313) and keeps the footer inside `main`; ours puts the footer in the
  shell with `.page-shell { padding-bottom: 96px }` on top, so `/parlay` shows ~312px against the reference's 152 and
  `/earn` ~216 against 22. Open — a shell decision, not a page's.
- **The reference's `pt-[120px]` over a 92px chrome leaves 28px of air** that `/strategies` and `/agents` add back and
  `/parlay` and `/surface` did not. **Fixed** (both).
- **Page-level loading and empty states use the app's design system** (`LoadingState`, `EmptyState`) while the in-page
  states keep the reference's grammar (`.sf-box-empty`). Open — a pattern decision recorded here.
- **Money truncates where the reference rounds** (`formatBaseUnits` by contract; `toFixed`/`toLocaleString` in the
  reference), one cent low at most. Recorded — the project's no-float-money rule; the ledger's number-formatting row.
- **Countdown**: the reference paints digits white and separators grey, turns orange under five minutes, zero-pads
  minutes and renders "1d 00h 42m"; ours is one uniform string in the accent colour at the cadence's threshold and
  "26:42:11". Open — a shared component; visible on daily Windows.
- **`text-gray-*` in light mode**: ours flips to the warm `#7C7466`, the reference's compiled utility stays neutral
  `#737373` on cream. Recorded — a consequence of the CSS-module convention the ledger already carries.

## /parlay (diff-parlay, 24 items)

| # | Finding | Status |
|---|---|---|
| 1 | The whole page behind one chain read (`ParlayScreen.tsx` L20–24) | open — see the shell |
| 2 | "Insufficient tUSDC" on the place button when the amount field is empty or the reserve is paused: `hasEnough` needed a quote (`ParlayTicket.tsx` L55); the reference falls back to the typed stake (`ParlayBuilder.tsx` L220) and reads "Build your parlay" | **fixed** |
| 3 | The amber "Pick a strike for every leg to price the parlay." plate and its quote gate (`ParlayBuilder.tsx` L333, L162) are missing; a leg with its print pending fires the chain call and gets a red failure | open |
| 4 | ~160px of extra dead space above the footer | open — the shell |
| 5 | The hero 28px higher than the reference's (`pt-[120px]`) | **fixed** |
| 6 | Slip leg names carry the cadence ("BTC 5m UP · $97.2k" vs "BTC UP · $97.2k") | recorded |
| 7 | An added 9px "line" label beside the strike (`LegRow.tsx` L104–111) | recorded |
| 8–9 | Connect sub-copy and empty-state body truth-corrected ("Any wallet on Somnia Shannon", "Stack 2 or 3 Windows.") | recorded |
| 10–11 | Preset toast as warning not error (unreachable); success toast neutral per the house colour law | recorded |
| 12–15 | Countdown size, internals, urgency colour, format | open — shared component |
| 16 | `.pl-side--up/down[aria-pressed]` fills quoted as `emerald-500/15` / `rose-500/15` but written with the 400-step tokens | **fixed** — the 500 hexes |
| 17 | `.pl-err` quoted `rose-500/10` + `/20`, written with `--loss` (400) | **fixed** |
| 18 | `.pl-quote-err:hover` quoted `rose-300`, written with `--loss` (darker) | **fixed** — `#FDA4AF` |
| 19 | The wallet hint missing while the balance loads (the reference prints "Wallet: 0.00") | **fixed** — "Wallet: … tUSDC" (never a fake zero) |
| 20 | The slip shows a skeleton row where the reference shows nothing | recorded — an improvement |
| 21 | A requote surfaces as the red error plate; the reference has no requote path | recorded |
| 22–24 | `min-height: 12px` on `.pl-profit`, the dashed void dot, ARIA additions | recorded |

## /games/range and the Ticket's range mode (diff-range, 18 items + 6 verified)

| # | Finding | Status |
|---|---|---|
| 1 | The placed state is a sentence and two links; the reference renders `BetPlacedCard` for a range (band, stake, return, expiry, digest, Portfolio / Place another, the settle footnote) — our dir mode renders The Call | open — The Call needs a range variant |
| 2 | "Pick a Window to price a band." on the Ticket, which has no picker; the reference shows the strip with dashes and "Enter an amount to quote" | **fixed** — "Enter an amount to quote." |
| 3 | No "Release to price this range." while dragging; the CTA read "Quoting…" with nothing quoting | **fixed** |
| 4 | Quote strip: three columns Current cost / Return / Max loss and an integer "N% chance" in the reference; ours You pay / You win / Pays 31.6% inside plus the headroom | recorded — the house grammar (§RangeReserve) |
| 5 | Leverage vanishes in range mode; the reference keeps the chips and `placeRangeMint624` takes `lev` | open — `RangeReserve` prices bands without leverage; the ledger now says so |
| 6 | The connect card, the "First bet sets you up" note and the top-up panel vanish in range mode (`Ticket.tsx` L282) | open |
| 7 | The ledger said the Private refusal sentence renders in range mode; the control is hidden there (as the reference hides its block) | ledger corrected |
| 8 | Spot truncated to whole dollars before the band is built (`printToUsd`) | **fixed** (cents, context/49) |
| 9 | 32px under the band against the reference's 16 (`mb-4` inside a `gap-4` column) | **fixed** |
| 10 | `ticket.css` L9–18 quotes `mb-3` and sets no margin | recorded in the comment |
| 11 | Tooltips read the long aria-labels; the reference titles are "Move range $5 lower" / "Recenter range" | **fixed** |
| 12 | The band resets on a mode toggle (draft state lives in the body that unmounts); the mode does not reset on a fresh card tap as the reference's does (L232) | open |
| 13 | Stake chips and the over-balance guard used wallet + venue credit; the reserve pulls from the wallet by allowance | **fixed** — spendable only |
| 14 | No toast on a range open from the Ticket (the reference: "Range bet placed: $X to $Y") | **fixed** |
| 15 | "to" in the CTA, an en dash in the placed line | **fixed** (placed line); the slip keeps its dash |
| 16 | The CTA's vermilion glow, 4px radius, `py-3 text-sm` (L1252) vs the shared 52px `lg` button | open — ticket-wide |
| 17 | `role="radio"` with both `aria-checked` and `aria-pressed`; no roving tabindex | **fixed** (aria-pressed dropped; the CSS keys on aria-checked) |
| 18 | Ledger row L811 stale ("Present, disabled — Range names RangeReserve as the missing piece") | ledger corrected |

Verified faithful: band copy word for word; preset and centre maths integer for integer; drag physics; keyboard set;
every `range-band.css` value against its utility; the recorded deviations present as described.

## /earn (diff-earn, 30 items)

| # | Finding | Status |
|---|---|---|
| 1 | The hero ~92px too low: `.page-shell:has(> .page-hero)` misses a grandchild, so the shell and the hero both reserve the chrome | **fixed** — the shell selector takes a first-child hero one level down |
| 2 | ~216px void above the footer (the reference's `[&_.footer]:mt-0` cannot reach a footer in the shell) | open — the shell |
| 3 | `min-height: 100vh` twice | **fixed** |
| 4 | Nested `<main>` | **fixed** (context/49) |
| 5 | Loading replaces the whole page; the reference renders everything with the panel saying "loading the vault…" | **fixed** |
| 6 | The panel's loading branch was unreachable | **fixed** with 5 |
| 7 | Error replaces the page; the reference has no error path | recorded — better |
| 8 | The not-deployed holding screen is additive | recorded |
| 9 | Ten rules quote a named Tailwind size utility and copy only the font-size, inheriting `line-height: 1.6` (the amount field 6px taller, the position figure 18px of extra leading) | **fixed** — each rule carries its utility's line-height |
| 10 | The right-hand tag tracks 0.22em; the reference's is 0.18em | **fixed** |
| 11–13 | Money, share price and the delta chip truncate where the reference rounds | recorded — the shell note |
| 14 | Unselected quick chips may lose their border to source order (`border: transparent` after `earn-chip`'s border) | **fixed** — the module no longer sets a transparent border; confirmed in the browser |
| 15 | The amount input loses its focus-visible ring (`outline: none` unlayered) | **fixed** — `outline: none` only for `:focus:not(:focus-visible)` |
| 16 | The typed amount is cleared before the transaction resolves; the reference clears on success | **fixed** |
| 17 | A screen reader announces "1000000" (`sr-only` span of `oneUnit`) | **fixed** — removed |
| 18–19 | Max hover 200ms vs 150; quick chips transition colour only vs `transition-all` | **fixed** |
| 20 | The status message sits below §02; the reference puts it under the cards | **fixed** |
| 21 | Two position notes (deployed capital, unsettled Window) with no ledger row | recorded |
| 22 | `useAnyExpired` read two Windows | **fixed** (context/49) |
| 23 | Light-mode grays warm vs neutral | recorded — the shell note |
| 24–30 | Recorded deviations confirmed present (labels, sparkline dropped, meta, "Withdraw N idle", §02, the paused banner, no reserve handlers) | — |

Housekeeping: the docstrings' source line ranges are stale (`VaultPanel.tsx` L14, `SupplyCards.tsx` L22, L90).

## /surface (diff-surface, 25 items)

| # | Finding | Status |
|---|---|---|
| 1 | 28px of page headroom missing (`pt-[120px]`) | **fixed** |
| 2 | Page-level loading/empty in the app's idiom, the in-page states in the reference's | open — the shell note |
| 3 | Tiles four across from 1024, the reference from 768 | **fixed** — 768, with the face stepped to 20px between 768 and 900 so a $77,842.39 print fits |
| 4 | §01 carries a `desc` the reference's does not | **fixed** — removed |
| 5 | The countdown tile in Plex Mono (`numbers` utility) beside three display-face figures | **fixed** — the tile's face is inherited |
| 6 | §02's depth plot has no axis, gridlines or x labels; the reference's `drawIvLine` draws them on both charts and §04 keeps them | open |
| 7 | §02 and §03 descs run 158 and 134 characters against the reference's 87/88/56 | **fixed** — shortened to the reference's register |
| 8 | §04 rows carry a hairline the reference's do not | **fixed** |
| 9 | A staggered entrance and a 500ms grow the reference's page does not have | **fixed** — removed |
| 10 | `.sf-row-stake` quoted `text-gray-300`, written `--white` | **fixed** |
| 11 | The term chart's label gutter 40px against `padL 44` | **fixed** |
| 12 | `.sf-params` quotes `mt-2` and sets none (the ladder's gap stands in) | comment corrected |
| 13 | §03's beyond-the-book rows dropped the ATM rung's `bg-vermilion/[0.06]` wash | **fixed** |
| 14 | The term chart box 200px against the reference's 180 (the x labels' row) | recorded |
| 15 | The crumb root linked `/markets`; the reference's links `/` | **fixed** |
| 16 | `white-space: nowrap` and a 19px face below 640 on the tile figure | recorded |
| 17 | Axis labels one gray step brighter than the reference's `rgba(255,255,255,0.35)` | open |
| 18 | The custom cursor fires on the crumb, chips, dots and rows; the reference's page sets `data-cursor` on nothing | open |
| 19 | Chip transition 200ms vs 150 | open (minor) |
| 20 | §02 carries a level-count meta the reference's does not | recorded |
| 21 | A settlement-basis footnote under §04 the reference does not have | recorded |
| 22 | Two dead classes (`sf-ttable`, `sf-depth-side--bids`) | open (housekeeping) |
| 23 | `overflow: hidden auto; overflow-x: auto` | **fixed** |
| 24 | The ladder's group label "Buy " with a trailing space | open |
| 25 | The chip row split into two `role="group"`s | recorded |

## The Ticket's Private option, the claims list, the panel (diff-private, 37 items)

| # | Finding | Status |
|---|---|---|
| 1 | The pressed Private tile lost the reference's `bg-vermilion/[0.12] text-vermilion` (L1196) | **fixed** |
| 2 | Over the cap the chosen Private tab greyed itself to 35% while staying the route | **fixed** — the chosen option is never disabled; the CTA names the cap |
| 3 | The control sits above side and stake; the reference's Public/Private sits directly above the CTA (L1180–1219) | open — structural |
| 4 | Route-control geometry inherits `.tk-modes` (radius, padding, border, fill) rather than the private control's | recorded |
| 5 | The retry link reuses `.tk-control-label` (tracking, colour, no hover) | open (minor) |
| 6 | One committed frame of "Private mode is not available right now: not ready" between the deployment resolving and the probe firing | **fixed** — probing until the first answer |
| 7 | Range: the option is hidden with the reference's sentence as its title; the reference throws at place time | recorded (ledger corrected) |
| 8 | The quote block vanished at zero stake; Public shows a prompt and the reference a strip of dashes | **fixed** — the prompt line |
| 9 | Quote labels are the house grammar (four rows) not the reference's three columns | recorded |
| 10 | CTA "Buy UP privately for <cost>" vs "Bet UP privately →" | recorded |
| 11 | `PRIVATE.cta.buy("")` rendered "Buy  privately for" | **fixed** |
| 12–13 | Note and budget-box copy match the reference | — |
| 14 | The add-funds box sits after the quote rows; the reference's is directly under the control | open — structural |
| 15 | Chips: the reference's exact title | — |
| 16 | Two open bets on different BTC 4h Windows read as identical rows (the Window replaced the strike) | **fixed** — the row names the close time |
| 17 | The "when" label froze (the store dedupes unchanged text; `Date.now()` at render) | **fixed** — a 15 s tick |
| 18 | An unread pinned key parks every row on "Checking" forever | open |
| 19 | "X tUSDC came home" row for a credited claim without a payout | recorded |
| 20–22 | U+2212 for a loss, thousands grouping, a fixed status pair | open (minor) |
| 23–25 | Empty-state sub, the warn line's rotation clause, the restore's third outcome | recorded |
| 26 | Restore dedupes against every owner's claims in the browser | open |
| 27–28 | Head, actions, foot, CSS: verbatim (three deliberate additions) | — |
| 29 | `.tk-priv-box` / `.tk-priv-line` quote `-mt-2 mb-4` and declare no margins | comments corrected |
| 30 | `.vault-btn-private` quotes `emerald-700`, which appears nowhere in the reference; Revoke renders green | open |
| 31 | `.tk-priv-box-action` adds `cursor: not-allowed` beyond `disabled:opacity-50` | recorded |
| 32 | The ledger said the reference sums the private balance into a pool row; the reference computes it and never renders it | ledger corrected — additive |
| 33 | The pool row (desk + vault bucket) and the panel's Balance cell (desk only) can disagree | open |
| 34 | The trust and correlation paragraphs ride `.vault-loading` | open (minor) |
| 35 | `approvalNote` never renders; a first-time depositor is not told about the second signature on the panel | open |
| 36–37 | Dead copy; fixtures lack the note states | open (housekeeping) |

## The leverage chips, the boost card, The Call, the portfolio rows (diff-leverage, 27 items)

| # | Finding | Status |
|---|---|---|
| 1 | The disabled chip title claimed "not deployed" on a live reserve capped below the chip | **fixed** — its own sentence |
| 2 | A painted "Leverage" label the reference carries only as `aria-label` | **fixed** — removed; the chips sit right-aligned as the reference's |
| 3 | The share text drops the multiple (`My call: ${band} (2×)`) | **fixed** |
| 4 | The knock-out sentence is exact, then extended with `card.how`; the ledger described a different addition | ledger corrected |
| 5 | The Call's caveat exact on screen and in the PNG | — |
| 6 | The ledger contradicts itself on the PNG line | ledger corrected |
| 7 | The private-bet title exact | — |
| 8 | Four dead copy strings (`strip.terms`, `strip.line`, `strip.guard`, `notDeployed`) | **fixed** — removed |
| 9 | The CTA names the multiple; the reference's never does | recorded |
| 10 | Chip geometry and states exact | — |
| 11 | The selected chip drew two rings (the idle border under the highlight's) | **fixed** |
| 12 | The chips no longer share the "Bet amount" row with the quick amounts | recorded |
| 13 | Lock precedence puts "not deployed" ahead of "private" | open (minor) |
| 14 | No invented numbers on the boost card | — |
| 15 | The reference's three quote cells are not all present; the ledger names a `LeverageStrip` that no longer exists | ledger corrected |
| 16–17 | Two CSS comments quote utilities their rules do not paint (`.boost-k` colour token; `.tk-lev-note` margins) | comments corrected |
| 18 | Display figures at 800 where the reference's screen type is 700 | **fixed** |
| 19 | Fact labels borrow the heading token, not the quote-cell token | recorded |
| 20 | Colours are the reference's | — |
| 21 | The meter on the ticket is pinned to the entry state | recorded |
| 22 | The portfolio row's multiple moved inline and turned vermilion; boosted rows end on Cash out, plain rows on a P&L | open — for the user |
| 23 | "Yours now" as recorded | — |
| 24 | The ledger row compares against `LeveragePortfolioPanel`, defined in the reference but never mounted | ledger corrected |
| 25 | The multiple never rounded | **fixed** — one decimal, as `fmtLeverage` |
| 26 | A boost skips the funding pre-check (gas and collateral) | open |
| 27 | The price-band refusal is generic at 2× | open (minor) |
