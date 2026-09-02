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
