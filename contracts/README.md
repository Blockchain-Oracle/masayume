# Masayume contracts

Foundry workspace for Masayume’s Solidity contracts around DreamDEX Event Contracts on Somnia. Start with the [contract guide](https://docs.masayume.app/builders/contracts) for the user-facing explanation and authority model.

## Shannon deployment snapshot

The [deployment record](deployments/50312.json) and [generated application manifest](../packages/markets/src/addresses.masayume.json) agree for **Somnia Shannon testnet, chain 50312**. All ten Masayume contract addresses below returned nonempty code in a read-only RPC check on **5 September 2026 at block 480,250,668**. The collateral returned **Test USDC (`tUSDC`), 6 decimals**; network fees use **STT**.

See the [main README’s contract table](../README.md) for full addresses and explorer links. Code presence does not establish source-bytecode equivalence, current permissions, reserve balances or running services.

| Contract | Purpose |
| --- | --- |
| [EventVault](src/vault/EventVault.sol) | Trading Balance, typed `SESSION` / `EXECUTOR` / `STRATEGY` grants and owner withdrawals |
| ERC2771Forwarder (OpenZeppelin) | Relays calls signed by the user; EventVault sees the original signer |
| [StrategyRegistry](src/strategy/StrategyRegistry.sol) | Strategies, runner identity, subscription consent and creator fees |
| [ParlayReserve](src/parlay/ParlayReserve.sol) | Multi-Window tickets with the whole payout reserved at opening |
| [RangeReserve](src/range/RangeReserve.sol) | Inside/Outside tickets on a Window’s closing price |
| [MarketMakerVault](src/maker/MarketMakerVault.sol) | Supplier shares and bounded market-making inventory |
| [LeverageReserve](src/leverage/LeverageReserve.sol) | Financed venue positions, cash-out, settlement and knock-outs |
| [PrivateDesk](src/private/PrivateDesk.sol) | Private-mode balances, trade slots and desk-controlled pool operations |
| [GameArena](src/games/GameArena.sol) | Duel commitments, real market picks, side pots and player credits |
| [SeasonPrizePool](src/games/SeasonPrizePool.sol) | Admin-controlled season prize escrow and payout |

Upstream addresses are pinned separately in [addresses.pinned.json](../packages/markets/src/addresses.pinned.json) for Somnia Markets SDK **0.28.1**. They matched the installed SDK during the same review. [IDreamDex.sol](src/interfaces/IDreamDex.sol) declares the venue interfaces these contracts use; [IOracleHub.sol](src/interfaces/IOracleHub.sol) declares the oracle reads needed for price-based settlement.

## Build and test

Run these commands from the **repository root**. Install Foundry for Solidity work. The [Foundry configuration](foundry.toml) selects Solidity 0.8.30, optimizer, via-IR and Cancun.

Initialize the contract dependencies if they are missing from a fresh clone:

```sh
git submodule update --init --recursive
```

Build and run the non-fork suites:

```sh
forge build --root contracts
pnpm contracts:test
```

`contracts:test` runs `forge test --root contracts --no-match-contract Fork`. These suites cover contract rules with local fixtures and mock venues. Shared pricing and caps vectors also live in [packages/core](../packages/core/src) and are checked by Vitest. Use the test output for current totals.

### Fork checks

Fork suites read Shannon state into Foundry’s local execution environment. They do not broadcast transactions, but they require a working RPC and market state that fits the selected scenario. Without `SHANNON_FORK_URL`, the fork test bodies return early; a green result alone does not prove that a live integration was exercised.

For example, run the EventVault fork suite:

```sh
SHANNON_FORK_URL='https://dream-rpc.somnia.network' \
  forge test --root contracts --match-contract EventVaultForkTest -vv
```

Read the selected test’s setup before running another suite:

| Suite | Market inputs |
| --- | --- |
| [EventVault](test/EventVault.fork.t.sol) | Optional `FORK_MARKET_ID` pins a Trading Window instead of scanning |
| [ParlayReserve](test/ParlayReserve.fork.t.sol) | Optional `FORK_MARKET_IDS` pins two comma-separated decimal ids |
| [RangeReserve](test/RangeReserve.fork.t.sol) | Required `FORK_MARKET_ID`; `FORK_ASSET` must match the Window, defaults to BTC |
| [MarketMakerVault](test/MarketMakerVault.fork.t.sol), [LeverageReserve](test/LeverageReserve.fork.t.sol), [PrivateDesk](test/PrivateDesk.fork.t.sol) | Required `FORK_MARKET_ID` for a suitable Trading Window |
| [GameArena](test/GameArena.fork.t.sol) | `FORK_MARKET_IDS` containing at least three Trading Windows |
| [OracleHub](test/OracleHub.fork.t.sol) | `FORK_MARKET_ID`, `FORK_RESOLVED_MARKET_ID` and `SETTLED_QUESTION_ID` select the relevant cases |

Market ids are decimal strings in these environment variables. Remaining time, liquidity, venue and oracle readiness matter; some suites create liquidity only inside the local fork. A passing fork test does not prove that the public app can fill the same trade now.

## Contract rules to preserve

- **Owner payouts and bounded grants.** EventVault withdrawals pay the owner, and delegated fills remain the owner’s positions. Grant caps, actor and expiry are enforced on-chain. See `test_AD5_no_divert` in [EventVault.trading.t.sol](test/EventVault.trading.t.sol).
- **Market identity.** Persist the venue’s `bytes32` market id and resolve pools and settlement routes from the venue. See `test_AD10_no_pool_address_in_storage` in the same suite.
- **Measured execution.** EventVault and GameArena account for collateral and outcome tokens by before/after deltas. Delegated EventVault orders are immediate-or-cancel (IOC); they cannot leave resting orders.
- **Direct funding.** EventVault capital intake uses `_directSender()` and rejects the trusted forwarder, including deposits and credited balances. Sponsorship is not a way around token funding approval.
- **Payout backing.** Parlay and Range reserve the full ticket payout at opening. Parlay prices legs from the book; Range settles on the OracleHub’s closing answer for the Window, with the hub’s opening answer and asset identity used to establish the band’s basis.
- **Maker and leverage accounting.** Maker shares track idle plus deployed capital. Leverage fronts capital into actual venue positions and repays the reserve from their proceeds. Withdrawal availability and losses depend on those positions; neither mechanism promises a fixed return.
- **Explicit operator authority.** PrivateDesk’s operator can credit pooled funds and sees the relationship between an owner and a slot; this is not anonymity. SeasonPrizePool’s admin chooses recipients and payout timing, and may recover the remainder. Its `endsAtSec` does not automatically distribute prizes.

## ABI and address maintenance

The application consumes generated ABIs and the per-chain address manifest, not Foundry’s `out/` directory directly. After an intentional contract or deployment-record change:

```sh
forge build --root contracts
pnpm contracts:export
```

[export.mjs](export.mjs) reads Forge artifacts and [deployments](deployments), then regenerates `packages/markets/src/contracts/*.abi.ts` and `addresses.masayume.json`. This changes files; it does not deploy a contract. Review the generated diff alongside the Solidity and deployment record. Optional artifacts are skipped when absent, so confirm that the intended contract’s artifact was built.

Deployment scripts live in [script](script). A deployment is a separate operator action: review constructor parameters and roles, estimate gas against the selected network, preserve the resulting deployment record, export matching artifacts, then release web and ops from the same source revision. An address change does not update an already deployed bundle or worker.

Use the [contract reference](https://docs.masayume.app/builders/contracts), [SDK integration map](https://docs.masayume.app/builders/dreamdex-sdk) and [acceptance ledger](../docs/implementation/acceptance-2026-09-06.md) for reviewed interfaces and dated transaction evidence. Original fork investigations remain local, ignored research notes. Their funding amounts and gas estimates are historical observations, not current operating values.
