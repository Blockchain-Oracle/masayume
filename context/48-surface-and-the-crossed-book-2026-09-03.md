# `/surface` on the venue's book, and the book that crossed (2026-09-03)

Stage 5 item 6. The reference's page (`reference/yosuku/app/surface/page.tsx`) reads Predict's parametric SVI
volatility surface back off Sui: the smile across strikes, a strike ladder, the ATM term structure. DreamDEX prices
every Window on a live order book and exposes no such model, so doc 03 §Surface keeps the route and its analytical
density and swaps the content for the venue's real structures. What the page reads now, all off the shared read
runtime (no new port method, no new query):

| Reference section | Ours | Source |
|---|---|---|
| §01 readout — forward, ATM IV, time to expiry, live markets | the opening print (and the spot against it), the UP mid with bid and ask under it, the spread as cents and as a share of the mid, the countdown with the phase word | `useBook` (the coordinator's one entry per market), `useOpeningPrice`, `useOracleSpot`, `phase` |
| §02 the smile (canvas) | cumulative depth on the UP book, both sides on one price axis, the mid marked | `cumulativeDepth` / `depthBounds` (`@masayume/core/surface`) over the same reading, as SVG |
| §03 the strike ladder | a stake ladder — 1 / 5 / 10 / 25 / 50 / 100 / 250 — each walked over the asks exactly as an IOC taker fills (`walkBudget` / `walkQuantity`, the arithmetic the reserves mirror on chain): average price, slippage against the top, contracts, payout after the settlement fee, whether the visible book could fill it | `slippageLadder`; the pool's lot from `useBookParams`, the fee from `useSettlementFee` — the payout column waits for the fee rather than assuming zero |
| §04 the term structure (ATM IV by days) | every live Window of the asset on its own book, nearest close first: the curve of UP prices (mid where both sides rest), then the same Windows as rows — clock, print, UP, DOWN, spread, depth | `useBooks` (new: `useBook` over a list, one `useSyncExternalStore` subscription) → `termPoints` |

Selection is the reference's: asset pills, one chip per live Window of the asset; the focal Window resets to the
nearest when the asset changes. Kept by market id rather than index so a Window that closes and leaves the lane
set drops the surface to the next one instead of onto a different Window by position.

## The book that crossed

The first live load, at 10:08:20 on the 5m BTC Window with 1:59 left, showed **12 levels, best bid 87¢ over best
ask 78¢**, 1,980 contracts a side, and the page printed a spread of −8.4¢. Fifteen seconds later the same Window had
6 levels at 78¢ / 81¢ and 990 a side; thirty seconds later, bid 94¢ over ask 94¢ by a tenth of a cent and 1,520 a
side. A matching engine cannot rest a crossed book by accident, so before deciding how the page should treat it:

- The SDK's live store already drops expired makers by wall clock (`store.js` `bookLevels`: "an event-sourced book
  … must apply the wall-clock cutoff itself, or it shows dead liquidity"), mirroring the contract's `getBookLevels`,
  which skips them on chain. So dead orders were not the cause on either side.
- `pnpm --filter @masayume/scripts spike:book-cross` reads the contract's book and the store's book side by side, three
  passes six seconds apart, on the BTC lanes up to 15m. **They agreed level for level in every pass** (chain offset
  −0.7 to −1.0 s). The book is a symmetric maker ladder — **200 / 330 / 460 contracts a level on both sides** — re-laid
  whole every few seconds; in the last two minutes of the 5m Window the fair moved 97¢ → 70¢ → 76¢ across the three
  passes. 990 is one ladder (200+330+460); 1,980 is two; 1,520 is one and two-thirds of another.

So the crossing the page caught is that ladder mid-requote, on chain, for a block or two: the orders did not match
each other (they cannot both be live and matchable; self-match rules or the requote's own ordering keep them
apart), and a taker fills at the ask regardless. Not verified: whose orders they are — the client's book read
carries no owner per level. What the page does with it (`bookStructure.crossed`, bid ≥ ask):

- §01: the UP tile shows the **ask** (what buying costs) with "bid 87¢ over ask 78¢ — crossed"; the spread tile reads
  **crossed** with the sentence above. No mid is printed.
- §02: no mid marker; the word where the marker would be. The stacks overlap, which is the picture.
- §03: unchanged — the ladder walks the asks, which is what a taker does.
- §04: the point takes the ask (basis "ask · crossed book" in its title); the row's spread column says crossed.

A touching book (bid = ask) counts as crossed: there is no width to call a spread.

The hero's `useTopOfBook` and the rail's cards read the same book and would show the same 78¢ UP / 13¢ DOWN pair for
a few seconds in the same moment. They print what buying each side costs, which stays true; they were left alone.

## Two other things the live page said that the fixtures could not

- **"sized to the venue's lot of 0 contracts"** — the lot is 0.001 contracts on these pools, and the contracts
  formatter truncates at two places. `lotText` prints the lot to the base unit.
- **The print wrapped in its tile at 390** ("$77,794.8 / 7") — Sora at 24px needs ~130px and a two-column tile row at
  390 leaves 125. Under 640 the face is 19px, and the four-across row starts at 1024 rather than the reference's 768,
  which would have left the same 127px.

## Gates

typecheck · invariants 0/0 · vitest **165** (13 new over `@masayume/core/surface`: structure incl. crossed and
touching, depth, slippage incl. an exhausted stake and the fee, term incl. hydrating/stale/failed) · build (`/surface`
and `/dev/surface` static). Inspected in Chrome headless at 1280 and 390, both themes, live and on `/dev/surface`:
no console errors; the cream theme reads correctly throughout (every ink is a `--gray-*` var or `--white`, both of
which flip; the boxes take part-14's light steps by hand).

## Not done here

- `useTopOfBook` / `DepthStrip` do not name a crossed book (they show two takeable prices, which is true).
- The ladder reads the coordinator's canonical ten levels; a stake past them says "beyond the visible book" rather
  than reading deeper.
- Yosuku's `/surface` is not linked from its header either; ours stays reachable by URL and from `/docs` if the user
  wants it in the nav.
