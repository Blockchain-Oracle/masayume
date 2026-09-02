# MarketMakerVault on Shannon's real contracts — fork verification (2026-09-02)

Stage 5 item 3: the Earn vault. The reference's `/earn` supplied a venue-run house vault that took the
other side of every bet ("Earn the spread"); DreamDEX has no house — the other side is the order book — so
Masayume's vault IS the maker. `contracts/src/maker/` (`IMarketMakerVault`, `MakerGateway`,
`MarketMakerVault`), 25 unit tests over `MockMakerVenue` (`forge test --no-match-contract Fork`: 118 pass),
and `contracts/test/MarketMakerVault.fork.t.sol` against a fork of Shannon through the public RPC.

## What the vault is allowed to do

One quote is one call: a YES bid and a YES ask, post-only, `askYes − bidYes ≥ minSpreadRaw`, both inside
`[minPriceRaw, maxPriceRaw]`, at most `maxQuantityRaw` a side, on a Trading Window with `minTimeLeftSec`
left, expiring no later than the Window. The ask is a NO buy in the venue's terms, so the vault only ever
buys; a double fill is a complete set bought for `one − spread`, merged back for `one`. It cannot take, cannot
sell what it holds, cannot quote one side alone, and its capital per Window, in aggregate and in Windows is
capped. One key (`maker`) may quote and pull; pull after expiry, merge and settle are anyone's.

**The venue's price is the YES price for every order kind.** A `BUY_NO` at `price` rests as a YES ask at
`price` and escrows `one − price` a contract. Found the hard way: the first fork run quoted a "NO bid at 0.63"
and the venue escrowed 3.70 for ten contracts, not 6.30. The range fork test's book seeding had the same
misreading (a NO buy at 0.48 rested as a YES ask at 0.48, not 0.52) and was corrected with it.

**A post-only order that would cross is refused** (`PostOnlyWouldCross`, `0x7cf05fcb`): a flat 0.48 bid on
the 4h ETH Window crossed its 0.405 ask. The actor prices from the live top of book on the tick grid
(`pairAround` in `@masayume/core/maker`), never inside a tighter book than the vault's own spread allows — it
rests behind the inside instead.

## What the venue did (Window 70978, ETH 4h, question on operator 2's venue, 10,662 s to expiry)

| Step | Result |
|---|---|
| `quote(70978, bid 0.311, ask 0.337, 10 a side)` from the maker key | both rested (`getOwnOpenOrders` = 2); escrow **9.74** = 0.311×10 + (1 − 0.337)×10; `deployedOf` 9.74; no market address in storage (AD-10) |
| A taker `BUY_NO` IOC at YES price 0.311, then `BUY_YES` IOC at 0.337 | the vault's bid and ask were the best on the book; it was handed **10 YES and 10 NO** |
| `merge(70978)` by a third party | 10 pairs burned through `mergeCompleteSet`, **10.00** back; credit collected into the wallet in the same call; share price **1.000052** (the 0.26 spread on 5,000) |
| A second `quote` at the same pair, then `pull` by the maker | 2 orders cancelled, **9.74** back to the cent; `deployedOf` 0; book: out 19.48 / back 9.74 / merged 10.00 |

Gas for the whole scenario on the fork: 2,019,455 (forge's report — indicative only; Somnia's schedule runs
~10× the standard EVM, context/41). Settlement (`settle`) could not run on a fork — the oracle does not answer
there — and is covered by the unit suite (won, lost, void, the dead ask drained through `cancelExpiredOrders`).

## Accounting that holds

- `balanceOf(vault) == liquid` after every call: every venue return (cancel refund, merge, redemption) is
  collected from the pool's credit into the wallet in the same transaction (`_collect`).
- Per Window the book is a flow: `escrowOut − escrowBack − merged − payout`, floored, is what the venue still
  holds for the vault (resting escrow plus filled inventory at cost); the same sum signed is the realized
  result once settled. Total value = `liquid + Σ deployed` over open Windows — never a spread before it is
  realized, never a mark of unpaired inventory.
- A withdrawal is refused while any open Window is past expiry and unsettled (`UnsettledWindow`), so no
  supplier exits ahead of a loss the crank has not booked; the crank is permissionless and the page sends it
  first. Withdrawals draw on `liquid` only; what is deployed comes back as Windows settle.

## Not covered

- Live on Shannon: the deploy (`DeployMarketMakerVault.s.sol`; the maker key via `MAKER_ADDRESS`), the supply,
  the actor (`services/ops/src/actors/market-maker`, dry-run by default, `MAKER_PRIVATE_KEY`, `DRY_RUN=0`) and the
  `maker` gas lane's measurement wait on the owner's go.
- Maker fees: the venue charges `makerFeeBpsTimes1k` on fills; the fork run's merge returned exactly 10.00 for
  10 pairs and the escrow matched the prices, so at today's parameters the fee did not show in these figures.
  The book's flow accounting absorbs any fee as cost either way.


## Live on Shannon (2026-09-02, eighth session)

`MarketMakerVault` at `0x3F6a9D3DF15134328b4928bAf39d41647A8E48cA`, block 478033625, deployed by
`0xdD7ae7c43e87Fae3eaE13c23C01eCa6D5bE8Bf9a` with `MAKER_ADDRESS=0xE0fEa37ae5af4e7F25A2345254476a3B524eae9d` (a key
made for the actor, `~/.config/masayume/market-maker.env`, funded 1.5 STT from the deployer). Creation
**47,192,303** gas, `setMaker` 241,256, then `approve` 259,745 and `supply(5,000 tUSDC)` 898,239.

## The actor's first live cycles (2026-09-02, later)

With `DRY_RUN=0`, `MM_QUOTE_SIZE=5` and the maker key, the actor's first cycles on the live venue: quotes rested on
four Windows across the 5m/15m/1h lanes, both sides were hit on two of them and the actor merged 5 complete sets
on each (`maker-merge`), pulled and requoted Window 71513 around a moved fair (0.1215 → 0.106 / 0.137 × 5). The
vault after: liquid 4,981.82, deployed 18.18, four Windows open. One `maker-merge` receipt timed out in viem's
wait and was logged `unknown`; the `maker` lane's gas is read off the receipts, not yet tabulated. The actor's
boot lacked `loadCollateral()` (found on this run, fixed).

## The venue's lazy refund, and the redeploy it forced (2026-09-02, later)

The actor's requote on Window 71513 was refused `Panic(17)`. The trace: inside `placeBinaryOrder` the venue first
transferred 4.565 tUSDC *to* the vault — the escrow of the vault's own earlier quote on that pool, expired by its
TTL and refunded lazily inside the owner's next placement (expired orders leave `getOwnOpenOrders`, so a `pull`
finds nothing to cancel) — and only then took the 0.37 escrow. `MakerGateway._rest` measured the escrow as a
cash delta, which went negative and underflowed. The gateway now books the venue's exact escrow
(`quantity × price`, or `quantity × (one − price)` for a NO buy — the figure the fork verified to the unit) and
whatever came back beyond it as that Window's `escrowBack`; `quote` collects the credit and nets it against the
new escrow. `MockMakerPool.setLazyRefunds` models it; `test_quote_booksTheVenuesLazyRefundOfAnExpiredQuote`
pins it (forge 156).

The vault was redeployed at `0xc904F38f38eF96E8741C7D9218a7899504B99e79` (block 478055022, creation 48,373,981
gas, maker set, supplied 5,000). The first vault (`0x3F6a…48cA`) had its quotes pulled on all six Windows and
its idle 4,950.805 withdrawn to the deployer; 24.855 of filled inventory (YES on 71514, 71513, 71649, 71647; NO on
71648) settles with those Windows — `settle` each (anyone), then the deployer's remaining 24.977587 shares
withdraw the rest.

| The `maker` lane, live | Gas |
|---|---|
| `quote` (a pair of post-only orders) | **526,880** |
| `pull` (two cancels) | **325,500** |
| `merge` (5 complete sets) | **1,018,744** |
| creation | 47,192,303 / 48,373,981 |

The actor spent ~0.0034 STT per transaction at the network's base fee; at a 45 s refresh over six Windows the
maker key drains about 0.5 STT an hour.
