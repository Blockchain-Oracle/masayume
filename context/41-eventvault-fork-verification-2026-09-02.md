# EventVault on Shannon's real contracts — fork verification (2026-09-02)

Story 6.1's build-phase check: how DreamDEX treats orders that originate from a contract, run
against a local Anvil fork of Shannon at block 477647519 (`contracts/test/EventVault.fork.t.sol`,
`FORK_MARKET_ID=69641`, a 15-minute Window with ~14 minutes left at the fork timestamp).

## What the venue did

| Step | Result |
|---|---|
| `EventVault.place` — owner buys YES, IOC at 0.99 limit, 5,000 raw (5 lots) | filled in full; **2,170** raw charged → effective **0.434** |
| pool credit for the vault after the fill | **0** — the limit-minus-fill refund came back to the wallet balance, not as pool credit |
| `EventVault.placeFor` — a STRATEGY actor buys NO from its budget, IOC | filled in full; **2,975** raw → effective **0.595**; budget debited exactly that; position booked to the owner |
| `vm.warp` past `expiry + settlementWindow`, then `market.voidExpired()` (permissionless) | market voided |
| `EventVault.crankSettle(owner, id)` from a third party | `module.redeem` burned both sides through the vault's operator approvals; **5,000** raw credited = ½ × (5,000 + 5,000) |
| `EventVault.withdraw(all)` | paid the owner in full; no `sweep` needed |
| storage writes during the whole run | none equal to the pool address (AD-10) |

## What it settles

- **A contract can trade on the pool.** `placeBinaryOrder` has no EOA gate; escrow is pulled from
  `msg.sender` (the vault), fills mint ERC-6909 to `msg.sender`.
- **Balance-delta attribution is exact.** Spend = cash before − cash after, including the pool's
  per-owner credit in "cash" in case a refund ever lands there (it did not here).
- **Self-match cannot occur** between two owners of the same vault: delegated and attended orders
  are IOC only, so the vault never has a resting order to match against. Story 6.1's open
  question is closed by construction, not by venue behaviour.
- **Redemption route.** `BinaryMarketsModule.redeem(operatorId, venueId, marketId, idx, amount)`
  with `originOperatorId` / `originVenueId` read off `markets(id)` pays `msg.sender`. The vault sets
  the module and `module.settlement()` as ERC-6909 operators once, at construction.
- **YES 0.434 + NO 0.595 = 1.029** on this book at this size: the spread plus taker fees. The
  quote kernel's `maxCostBase` remains the right pre-check figure for the vault route.
- The venue also runs **1-minute Windows** (ids 69639/69640 here) beside the 5m/15m/1h/4h lanes.

## Not covered

- A resolved (non-void) settlement on the fork — the oracle callback does not run in a fork;
  the void path exercised the same `redeem` route. Unit tests cover the winner/loser split.
- Live gas figures: forge's gas report on a fork is indicative only (`place` ≈ 1.18M total for the
  whole scenario including deploys).
