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

## Learned while driving the TypeScript adapter on Anvil (later the same day)

- **The venue reverts an empty IOC** with `ImmediateOrCancelNoFill()` (selector `0xd48c4403`) instead of
  returning quietly. The vault lets it surface; the adapter maps it to `no-liquidity`; the mock venue and
  the caps vectors model it.
- **A fork's book dies in seconds.** Makers rest with dead-man's-switch expiries just past their requote
  interval, so once Anvil's clock is ~20 s past the fork block the resting orders are expired and every IOC
  finds nothing. Hold the clock: `anvil_setBlockTimestampInterval 0` is accepted (a mined block keeps the
  previous timestamp), or run the whole scenario inside a forge test frame where time does not move.
- **Anvil caches an account it saw empty.** Accounts read before they were funded stay "insufficient
  funds" for signed sends even after `anvil_setBalance`; fund *fresh* keys first (impersonate a real
  funded address — the OracleHub holds STT — and `cast send --unlocked`), then read.
- **The SDK's read client stalls viem's `waitForTransactionReceipt`** on the fork (a mined approve was
  reported timed out after 90 s); the vault writer polls `getTransactionReceipt` directly instead.
- Adapter reads verified on the fork: `getVaultSnapshot` (deposit visible), `getVaultHoldings`,
  `getBalanceSheet.vaultBase`, `listWalletHistory` (empty, complete) — `scripts/spike/vault-fork-read.ts`.
  The write path through the adapter (`scripts/spike/vault-fork.ts`) waits on the receipt-poll change.

## Live on Shannon (2026-09-02, later)

Deployed by `0xdD7ae7c43e87Fae3eaE13c23C01eCa6D5bE8Bf9a`: `ERC2771Forwarder` at
`0x82bb75b8aE663abC73308Ce42ca00d701cFb50d3`, `EventVault` at `0x84Ec824D89ee78d5728545CE0B40EC968aa7CD7A`
(block 477731559). What Shannon taught that the fork could not:

- **Somnia's gas schedule is ~10× the standard EVM for calls and ~20× for creations.** The forwarder creation
  used 10.8M gas (local replay 735k); the vault 47M (Somnia's own `eth_estimateGas` said 70.5M; local ~3.2M).
  Three creations failed first because forge's *local* estimate (×1.3, then ×2) is nowhere near — every
  failed receipt shows `gasUsed == gas limit`. Deploy with explicit limits from Somnia's `eth_estimateGas`
  (`cast rpc eth_estimateGas '{"from":…,"data":<creation bytecode>}'`) and mind the up-front envelope:
  the node refuses a tx whose `gas × maxFeePerGas` exceeds the balance (`insufficient balance, data: "0x03"`),
  so use `--legacy --gas-price 7000000000` and a tight limit when the balance is small.
- Somnia supports the Cancun opcodes: the venue's own pool bytecode carries PUSH0, MCOPY and TLOAD, so keep
  `evm_version = "cancun"` (OpenZeppelin 5.7 needs `mcopy` anyway).
- Measured calls: faucet 253,138; approve 259,745; first `deposit` 688,494; a vault IOC `place` 2,562,772;
  `grant` ran out of gas at a 2,000,000 limit (a struct push is many cold slots). Ceilings in
  `packages/core/src/constants/gas.ts`: `vault` 4M, `vault-order` 6M. At 6 gwei that is thousandths of an STT
  per write; the app's envelope (`ceiling × 60 gwei × 1.2`) is what a signing key must hold.
- `forge create` swallows flags that follow `--constructor-args`; put the constructor arguments last.
- The adapter on Shannon (`LIVE=1 scripts/spike/vault-fork.ts`, the deployer as owner and actor): deposit,
  an owner UP from the Trading Balance filled at 0.167, a STRATEGY grant, a delegated DOWN from it, and an
  over-cap order refused by `simulateCaps` before any signature ("would spend 536.84 against a per-trade cap
  of 500.00"); the crank ran after the oracle settled the Window (see the ledger for the tail).

## Not covered

- A resolved (non-void) settlement on the fork — the oracle callback does not run in a fork;
  the void path exercised the same `redeem` route. Unit tests cover the winner/loser split.
- Live gas figures: forge's gas report on a fork is indicative only (`place` ≈ 1.18M total for the
  whole scenario including deploys).
