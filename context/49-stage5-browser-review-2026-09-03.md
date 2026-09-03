# The Stage 5 surfaces reviewed in a browser (2026-09-03)

Every Stage 5 surface except the private route (context/47) and `/surface` (context/48) had been verified by gates
only — "not seen in a browser" on `/parlay`, `/games/range` and the Ticket's range mode, `/earn`, the leverage chips,
the boost card, The Call with a boost and the portfolio's boost rows. This is the review the resume notes asked for
first, run against the dev server (`pnpm dev`, port 3000) and the live contracts on Shannon with the demo wallet
`0xd357…9358`. Ten defects came out of it; nine are fixed in the same commit, one (the boot's latency) is measured
and left for its own session. The numbers below are from the run.

## How it was driven

The Claude Chrome extension was still not connected, so the driver is context/47's: Playwright (`playwright-core`
from the npx cache) launching the installed Chrome headed, the demo key in Node behind an EIP-1193 provider on
`window.ethereum`, `personal_sign` and `eth_sendTransaction` signed by viem, everything else passed to the RPC,
persistent profiles so the Tutorial's dismissal survives, all under `caffeinate -i`. Three passes:

1. **The tour** — `/parlay`, `/games/range`, `/earn`, `/surface`, `/markets`, `/portfolio` at 1280×900 and 390×844,
   light and dark: full-page captures, `scrollWidth` against `clientWidth`, every console error.
2. **The Ticket's states** — a 5 tUSDC stake on UP at 1×, 2×, 3×, in Range mode, on Private; every disabled
   control's `title` read back.
3. **The flows, on chain** — a three-leg parlay, a supply and withdraw on `/earn`, a 2× boost and its portfolio row,
   a band on ETH. Transactions from the demo wallet (all Shannon, 6 gwei):

| Flow | Transactions | What landed |
|---|---|---|
| Parlay | `approve` `0xdf9d…f3dd`, `openParlay` `0xb0b1…4b9c` | UP on BTC 15m, 1h and 4h; the ticket quoted 5.00 → 171.70 at 34×, the chain charged **3.92** for the same 171.70 because the odds had lengthened to 44× between quote and open (Set-stake mode fixes the payout and lets the stake float down — by design, ledger §ParlayReserve). Slip: "3-leg streak · In play · 0/3 · 43.8×". |
| Earn | `approve` `0x60cc…84e7`, `supply(50)` `0xfb91…46df`, `settle` `0x0729…ae15` | 50.13 shares at 0.9973; the share price printed 0.9969 after the settle. **The withdraw never went out** — see finding 2. |
| Leverage | `approve` `0x2b89…513e`, `open` `0x7f6b…6268` | 2× UP on BTC 5m for 4.99 (the lot took a cent), The Call "BTC OVER $77,628 · YOU STAKE 4.99 → WIN IF IT LANDS 16.42 ✦", the portfolio row "LIVE · 2× BOOSTED · Staked 4.99 · Yours now 3.07 · Cash out". |
| Range | none | Refused before a signature — finding 1. |

Six Explore agents were spawned in parallel to diff each surface's port against the reference source; their reports
are in context/50. **A `git checkout main` hit the shared working tree at 10:48:20** (nine seconds before the parlay's
approve was signed), which emptied the Stage 5 directories on disk and put the dev server on the wrong tree for four
minutes; the branch was checked back out, nothing was lost, and the flow completed on JavaScript already in the tab.
The agents were suspected first, but all six had finished by 10:41 and each states it ran no git command at all; the
source is not established (another session on this machine, or a terminal). The precaution stands anyway: every agent
prompt on this repo forbids git commands that change state, and `git reflog -1` is checked after any agent batch.

## Findings

| # | Where | What the page did | Cause | Fix |
|---|---|---|---|---|
| 1 | `/games/range`, the Ticket's Range mode | On ETH every band was refused "Too close to certain or impossible": ETH 4h "Balanced" spanned $2,186–$2,600, thirteen standard deviations of a two-hour move. | The reference's presets are BTC dollars (±$15/30/55, a $5 centre grid) and the port scaled them by √time only. On ETH at $2.4k the same dollars are thirty times wider in relative terms; at 5m ETH's σ√T is about $3, so even "Tight" (±$15) was a certainty. | `presets.ts` carries the reference's dollars to an asset by its price ratio to the level they were tuned at (`PRESET_ANCHOR_USD` 77,000) and snaps the centre grid to the nearest nice step; BTC keeps ±$15/30/55 on a $5 grid to the dollar, ETH gets ±$0.40/$1.00/$1.80 on a $0.20 grid, edges print in cents where the asset trades under $10k. Verified: ETH 1h Balanced ±$3.80 now prices at **3.0× · 29.7% inside**, the same odds band as BTC's. |
| 2 | `/earn` withdraw | "Withdraw all" was refused by the vault: `UnsettledWindow(0x…1180e)`; the page had sent one `settle` and then stopped. | The vault names one closed Window at a time and four were closed at once; the write path settled the first and withdrew. The screen's own "a Window has closed" note read only the first two open Windows (`useAnyExpired` called `useMarket` twice — hooks cannot loop). | `useEarnWrites.withdraw` asks `unsettledExpired()` again after every settle, up to sixteen; the screen reads every Window it names in one round (`useMarketsLite`). |
| 3 | `/earn` §02 | Every row said "… · N quotes" for the first ten seconds and then resolved one row a second. | Each row's `useMarket` fetched the market and its opening print separately; the print fetch serialised. | `getMarketsLite(ids)`: the rows in one `Promise.all`, no prints (a label needs none). All ten resolve together. |
| 4 | `/earn` §01 | "wallet 0.00 tUSDC" for ten seconds while the balance sheet was still reading — a wallet holding 10,006. | `walletBase ?? 0n`. | "wallet …" until the sheet lands; Max disabled; Supply says it is still reading. |
| 5 | `/earn` at 390 | The supply card was 438 px wide on a 390 viewport, clipped by the shell: "wallet 0.0", "MAX tU", one quick amount. | `.ea-cards` had no column template below `md`, so the implicit `auto` track took the card's max-content width (the input's intrinsic size). | `grid-template-columns: minmax(0, 1fr)` at the base. `scrollWidth` 384 = viewport. |
| 6 | `/earn`, `/leaderboard`, `/claim`, `/stats` | Two `<main>` landmarks: the shell's `main.page-shell` and the page's own, ported from reference pages that have no shell. | Verbatim port of the reference's `<main>`. | `<div>`; the shell owns the landmark. |
| 7 | The Ticket, Range mode | "You pay" and "You win" wrapped onto two lines. | The 3% headroom line ("up to 5.15 tUSDC if the basis moves before it lands") sat in the `<dl>` as a row with an empty `<dt>`; its width took the value column and squeezed the labels. | A right-aligned caption under the rows. |
| 8 | `/portfolio` and `/earn` at 390 | Two console errors per load: Base UI "expected a native `<button>`". | `Button render={<Link>}` renders an anchor without telling Base UI. | `nativeButton` defaults to false whenever `render` is given. No console errors on the page afterwards. |
| 9 | `/portfolio` §03 badges | "LP Provider — NEEDS EARN (STAGE 5)" with the Earn vault live. | `computeBadges` had no source. | The reference's rule, `plpBalance > 0` (`lib/badges.ts` L48–52): the wallet's maker-vault shares; locked with the dependency named only where no vault is deployed. The demo wallet's 50.13 shares unlock it. |
| 10 | The Call with a boost | "tUSDC" sat alone under the caveat, orphaned from its figures. | The unit line (ours) rendered after the reference's caveat. | The unit line follows the wager strip; the caveat follows it, where the reference puts it (`BetPlacedCard.tsx` L123–127). |

Also fixed on the way: `snapOffset` clamped negative offsets to zero once it took a grid (found in the rewrite, not in
the browser); `/dev/earn` fixtures carry a market map.

## Measured and left: every wallet-scoped read lands ten to seventeen seconds after load

On a fresh load the first figure that needs the wallet or a market arrives late, consistently, with one Chrome and
nothing else running:

| Page | What | Landed at |
|---|---|---|
| `/portfolio` | the plate's real balance (0.00 and "Get test tUSDC" before it — the reference's own loading treatment, ported verbatim) | +15.9 s |
| `/earn` | "wallet …" → 9,947.24; the ten Window labels | +17.1 s; +16.1 s |
| `/markets` | the hero's question; the 2× chip enabled | +15.5 s; +16.6 s |
| `/parlay`, `/games/range` | "Loading markets…" → the Window list | ≈ 12 s |
| `/dev/boot` | the page's first paint that a script could read | +15.6 s |

The RPC answers `eth_blockNumber` in under a second and no fetch to it appears in the page's resource timings (the
SDK reads over its WebSocket), the HTML is interactive at 1 s and every chunk is down by 3.7 s. Where the time goes is
not established; the long-task probe on `/markets` (verify2) is the first data point. Candidates: the WebSocket probe
(`probeWsUrls`, sequential, 4 s per endpoint, then a rebuild of the runtime that restarts every read), dev-mode
bundles, the SDK's store hydration. context/47 measured the faucet card "within 3 s" a day earlier, so something moved.
Worth its own session before the redesign pass; it is what a reviewer feels first on every page.

## For the user's eye (not changed)

- **The Sensei ring covers the Ticket's bottom-right corner at 1280×900** — the CTA's right end, the boost card's
  caveat, the Range mode's "Place RANGE … →". context/47 noted the bubble; the ring itself overlaps live figures.
  The reference's Sensei sits bottom-right too, but its Ticket is a drawer; ours lives in the hero. A layout decision.
- The plate's "0.00 · Get test tUSDC" for the first sixteen seconds is the reference's own (`BalancePlate.tsx` L55,
  L75, `totalUnknown ? '0.00'`); doc 05's "loading is a valid state" would have it say so instead.
- The 1× ticket shows "Cost 3.18 · Max loss 4.99 · Buy UP for 4.99": the SDK sizes the quantity at a protective limit
  and the book fills it cheaper; the escrow is the cap. True, and reads oddly beside a typed 5.
- Set-stake parlays charge less than typed when odds lengthen between quote and open (5.00 → 3.92 here).
- On `/games/range` the picker offered only 4h and 1d Windows at xx:59 — every shorter lane was inside its no-entry
  buffer at the hour; not a defect, but a reviewer at the wrong minute sees an empty-looking game.
- The install strip alternates "Somnia testnet — test funds only" and "Masayume installs as a web app" with a
  crossfade; a capture mid-fade shows only "Get it ›".
- The ledger's **Needs user review** rows for Stage 5 are all still open; nothing in this pass approves them.

## Not covered

The parlay ticket's settle and claim (the ticket is in play; its 4h leg closes at 14:00 UTC); a range round placed
end to end (the ETH band now prices; the flow was not re-run with a signature); the boost's cash-out and knock-out from
the row; dark-theme flows (the tour covered dark statics only); the private route (context/47 has it).
