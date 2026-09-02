# LeverageReserve on Shannon's real contracts — fork verification (2026-09-02)

Stage 5 item 4: the prefunded, capped leverage model. The reference's Ticket (`ticket624.core.ts`,
`Ticket624Drawer.tsx`) sizes a boost as `stake·L / price` contracts, pays `quantity − stake·(L−1)` on a win
and warns "L× can knock out before expiry"; its two reserve modules (`underwrite.move`, `margin.move`) front
the rest of the notional for a premium and, in the margin desk, liquidate at a maintenance line. On DreamDEX the
reserve is the venue's taker: `contracts/src/leverage/` (`ILeverageReserve`, `LeverageMath`, `LeverageGateway`,
`LeverageReserve`), 34 unit tests over `MockLeverageVenue` plus the shared sizing vectors (`forge test
--no-match-contract Fork`: 154 pass), and `contracts/test/LeverageReserve.fork.t.sol` against a fork of Shannon
through the public RPC.

## What a boost is here

A knock-out certificate on the venue's own contracts. The owner stakes `s` at `L×`; the reserve fronts
`(L−1)·s`, keeps a premium of `premiumBps` on it, and buys `(s + fronted − premium) / price` contracts off
the resting book as an IOC taker, holding them as its own hedge. Its claim is repaid first out of whatever the
contracts fetch: at settlement (redeem through the module), at the owner's cash-out (an IOC sell at the bids),
or at the knock-out anyone may trigger once the book's mark for the position is under `fronted ×
maintenanceBps`. The owner's loss is never more than the stake; the reserve's is the gap between the line and
what the book pays, bounded by public caps (per position, per Window, aggregate exposure, open positions,
entry band, minimum time left). The stake is charged from the actual fill: `stake + fronted − premium ==
cost` exactly (`LeverageMath.terms`), so a cheaper fill than the walk is a smaller stake, never a hidden
remainder.

**Why a knock-out and not just a front.** With the loss capped at the stake and no knock-out, a fairly priced
boost on a binary payoff collects exactly what the same stake collects at 1× — the price already is the
leverage — so the multiple would be cosmetic or a subsidy. The knock-out is what makes it a different contract:
a bigger win if the side lands *and* the position was never marked under the line, at the cost of a
path-dependent way to lose. That is the reference's Ticket, made explicit.

## What the venue did (Window 70978, ETH 4h, ~5,000 s to expiry, live makers at 0.679 / 0.707)

| Step | Result |
|---|---|
| `sizeForStake(70978, UP, 10, 2×)` | 27.157 contracts at 0.707 for 19.199999; stake **9.999999**, fronted **10.00**, premium **0.80**; win if right **17.157** |
| `open` by the owner | charged exactly the stake; the reserve holds 27.157 YES; `liquid` 4,990.80 (front out, premium in); no pool or market address in storage (AD-10) |
| `markOf` at the resting 0.679 bid | mark **18.4396**, line **12.00**, not knockable; a stranger's `knockOut` refused `StillHealthy` |
| Maintenance raised over the mark (the reference's own proof-script move — a fork cannot move a live maker's bids) | knockable |
| `knockOut` by a stranger | sold 27.157 into the live bids for **18.4396**: reserve repaid **10.00**, owner **8.4396**, the stranger nothing; `liquid` 5,000.80 |
| Second open, DOWN 2× on 10 | 59.81 NO at 0.321 |
| `vm.warp` past expiry + settlement window, the venue's permissionless `voidExpired`, then `settle` | payout **29.9065** (half a contract each): reserve repaid 9.999986, owner **19.9065** |
| House withdraws | **5,001.599998** — the two premiums, whole |

Gas for the whole scenario on the fork: 7,009,831 (forge's report — indicative only; Somnia's schedule runs
~10× the standard EVM, context/41). A resolved settlement could not run on a fork (the oracle does not answer
there); the unit suite covers won, lost and void, the knock-out at the line, on a gapped book (the shortfall is
the reserve's loss) and on a thin book (partial: the position stays live with a smaller claim).

## Accounting that holds

- `balanceOf(reserve) == liquid` after every call: the venue's refunds and credits are collected in the same
  transaction (`_collect`); the escrow the venue takes for the IOC beyond the fill comes straight back.
- `outstanding == Σ fronted` over LIVE positions; `totalValue == liquid + outstanding` — the front at cost, the
  premium as income the moment it is charged, a loss the moment an exit recovers less than the claim.
- A withdrawal is refused while a LIVE position is past its Window's expiry (`UnsettledPosition`), so no
  supplier exits ahead of a loss the crank has not booked; withdrawals draw on `liquid` only.
- Every exit pays `owner`, never the caller: the knock-out is permissionless and unpaid.

## Not covered

- Live on Shannon: the deploy (`DeployLeverageReserve.s.sol`), the supply, the keeper
  (`services/ops/src/actors/leverage-keeper`, dry-run by default, `LEVERAGE_KEEPER_PRIVATE_KEY`, `DRY_RUN=0`) and
  the `leverage` gas lane's measurement wait on the owner's go.
- The premium is the reference's flat 8% of the fronted amount; the reserve's real exposure is gap risk at the
  line, which this does not model. The rate is a param to set from observed knock-out shortfalls.
- Venue taker fees: the fill's cost is measured by delta, so a fee would land in the stake; none showed at
  today's parameters.


## Live on Shannon (2026-09-02, eighth session)

`LeverageReserve` at `0x0F4f2C66917D03D2B31c3c5730E6Fae28d9BB575`, block 478033747, deployed by
`0xdD7ae7c43e87Fae3eaE13c23C01eCa6D5bE8Bf9a` with the parlay's recipe. Creation **55,456,358** gas, then `approve`
259,745 and `supply(5,000 tUSDC)` 897,933. The keeper key is `0xD5604E6cCf575bD690814fA4eF8E4F59E2583D7F`
(`~/.config/masayume/leverage-keeper.env`, 1.5 STT from the deployer).

## The first live open, and the redeploy it forced (2026-09-02, later)

The first live `open` on Window 71513 (BTC 1h) reverted `StakeAboveMax(10.961455, 9.999925)`: the quote saw the
ask at 0.208, a live maker moved it to 0.228 in the seconds between the send and the block, and a fixed 92-contract
size implied a stake over the cap. On a book that requotes every few seconds a stake-first product has to fix the
stake and let the quantity float. The open is now `open(marketId, outcomeIdx, stake, leverageBps, minQuantityRaw)`:
the reserve sizes the boost at execution off the live book (what `stake + fronted − premium` buys, on the venue's
lot), buys it, charges the stake the fill implies — never more than `stake`, the lot's dust and a cheaper fill
refunded in the same call — and refuses a fill under the caller's `minQuantityRaw` (the Ticket sends 95% of the
size it quoted, the reference's own 8% sizing cushion made explicit). A venue fee that pushed the implied stake
over the typed one is refused (`StakeAboveMax`) rather than charged. The first reserve
(`0x0F4f2C66917D03D2B31c3c5730E6Fae28d9BB575`) was drained by its one supplier and replaced by
`0x5484fF06F4B6a8108fABb2511385985D933a2D23` (block 478043822, creation 55,407,083 gas, supplied 5,000).

| Live on Shannon, the new reserve | Result |
|---|---|
| `open(71603, UP, 10, 2×, ≥95% of 47.22)` on the BTC 15m lane, live makers on the book | position 1: 44.859 contracts, stake **9.999818**, fronted 9.999819, premium 0.799986; **5,071,986 gas** — the `leverage` lane's first measurement, inside its 8M ceiling |
| `markOf(1)` at the resting bids | mark 17.858881 against a line of 11.999782, not knockable |

| The keeper's `knockOut(1)` at 20:56 UTC, 509 s before the Window's expiry — the BTC 15m YES had fallen from the 0.428 entry toward the line | sold 44.859 into the live bids for **11.259609**: reserve repaid **9.999819**, owner paid **1.259790**, position `KNOCKED_OUT`; tx `0x357c1fa1604dd89a4aa594eab369424b006f2d880d585c03fd81face0103d9e9`, block 478047104, **1,367,150 gas** — the exit side of the `leverage` lane, sent by the keeper key `0xD560…3D7F` |

The reserve's `liquid` after: 5,000.799985 — its 5,000 back plus the premium; the boost cost its owner 8.74 of a
9.9998 stake, exactly the reference's "it can knock out before close". Shannon produces ~10 blocks a second
(measured over 6,000 blocks), which is why a fixed size cannot survive the seconds between a quote and its block.

The keeper (`services/ops/src/actors/leverage-keeper`, `LEVERAGE_KEEPER_PRIVATE_KEY`, `DRY_RUN=0`) watches the
live reserve; its first live cycle was that knock-out. Its first live run found that neither it
nor the maker actor loaded the collateral before their first read (`loadCollateral()` — the spike's boot did);
both now do.
