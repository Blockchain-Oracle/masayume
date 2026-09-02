# contracts

Foundry workspace for Masayume's own contracts around DreamDEX Event Contracts.

| Contract | Status | Role |
|---|---|---|
| `EventVault` (`src/vault/`) | **Live on Shannon** `0x84Ec…CD7A` | Trading Balance + typed grants (`SESSION` / `EXECUTOR` / `STRATEGY`), owner-only withdrawal, delegated IOC execution on the venue, permissionless `crankSettle` |
| `ERC2771Forwarder` (OpenZeppelin) | **Live** `0x82bb…50d3` | The sponsored-transaction rail: a relayer submits what the owner signed; the vault sees the signer |
| `StrategyRegistry` (`src/strategy/`) | **Live** `0xAd5f…5FB4` | Who may copy-trade whom, under which caps envelope, for what fee; consent is a live vault grant |
| `ParlayReserve` (`src/parlay/`) | **Live on Shannon** `0x50Ce…C151`, supplied 5,000 tUSDC | One ticket over many Windows: legs priced off the venue's book in-transaction, the whole payout escrowed at open, settled leg by leg on the venue's resolution, claim and void pay the owner only |
| `RangeReserve` (`src/range/`) | **Built, fork-verified** (context/43); deploy waits on the owner's go | A band on one Window's closing print, inside or outside: the opening print and the asset proven through the OracleHub's key, the centre off the Window's book, the odds from the house's measured volatility, the whole payout escrowed at open, settled permissionlessly on the hub's answer |
| `MarketMakerVault` (`src/maker/`) | **Built, fork-verified** (context/44); deploy waits on the owner's go | The Earn vault as the venue's maker: a post-only YES bid and YES ask per quote under on-chain bounds, complete sets merged back for the spread, inventory settled on the venue's verdict, shares over `liquid + deployed`, withdrawals from idle capital once every closed Window is settled |
| `GameArena` | pending (Stage 6) | — |

`src/interfaces/IDreamDex.sol` declares only the venue functions the vault calls, copied from the
pinned SDK's ABIs (`@somnia-chain/markets-sdk` 0.28.1).
`src/interfaces/IOracleHub.sol` declares the slice of Somnia's OracleHub a price-basis consumer reads
(`pullNumericAnswer`, the definition structs, `questionKeyOf` / `questionIdByKey`, the scheduling quote),
checked against Shannon in context/43.

## Rules the code keeps

- **No-divert (AD-5).** Nothing takes a payout destination. `withdraw` / `withdrawPrivate` pay
  `_msgSender()`; a delegate's fills and sale proceeds land on the owner. Named test:
  `test_AD5_no_divert`.
- **Market identity (AD-10).** Storage and events carry the venue's `bytes32` market id only. The
  pool, outcome ids and settlement route are resolved from `BinaryMarketsModule.markets(id)`
  inside the transaction. Named test: `test_AD10_no_pool_address_in_storage` (unit and fork).
- **Attribution by delta.** The vault is the venue's trader. What a call moved — collateral in or
  out, outcome tokens in or out — is measured before and after the venue call and booked to the
  owner, fees included. Delegated orders are IOC only, so the vault never rests an order and
  cannot self-match.
- **Capital intake is never sponsored (NFR-7).** `deposit` and `depositAndGrant` refuse the
  forwarder; everything else may be relayed.
- **A parlay leg is priced by the book, not the opener.** `ParlayReserve.openParlay` reads each
  Window's resting book (`getBookLevels`) inside the call, prices the chosen side over the depth the
  ticket would need to hedge, recomputes the combined probability (with the same-instant correlation
  floor), and charges the floored stake. The reference took opener-supplied probabilities and named
  that its gap. `previewOpen` is the same arithmetic as a view, so a client shows the number the
  chain will charge. Golden vectors in `packages/core/src/parlay/pricing.vectors.json` are asserted
  by forge (`ParlayVectors.t.sol`) and vitest alike.
- **The maker only buys complete sets at a discount.** `MarketMakerVault.quote` rests a post-only YES bid and
  YES ask at least `minSpreadRaw` apart, inside the price band, capped per quote, per Window, in aggregate and
  in open Windows; it never takes, never sells and never quotes one side alone. The venue's `price` is the YES
  price for every kind (a `BUY_NO` at p is a YES ask at p). Named tests: `MarketMakerVault.quoting.t.sol`,
  the fork run in context/44.
- **A range round's basis is the hub's own print.** A Window's closing price is `pullNumericAnswer` on the
  question `BinaryMarketsModule.markets(id)` names — in cents, pending under one selector (`0x25cd016c`)
  until two seconds after expiry, readable for good after that. Its opening price is the same read on the
  (asset, `tradingStart`) question, found through the hub's content-addressed key; the same key proves the
  asset. Nothing of ours is scheduled. Named test: `OracleHub.fork.t.sol` (context/43).

## Commands

```sh
forge build
forge test --no-match-contract Fork         # 72 unit tests on mock venues
SHANNON_FORK_URL=<rpc> forge test --match-contract Fork -vv   # against Shannon's real contracts
```

`forge test --no-match-contract Fork` runs 118 unit tests: the range reserve adds `RangeMath` (the table, its
inverse, the band probability), `RangeVectors` (the shared golden rows), and the pricing and lifecycle suites over
`MockOracleHub` + `MockWindows`; the maker vault adds its quoting and lifecycle suites over `MockMakerVenue`
(per-Window pools with resting post-only orders and a taker `fill` knob).

The fork tests need Windows that are `Trading` at the fork block; pass `FORK_MARKET_ID=<decimal id>`
to pin one and skip the scan (context/41 for the vault run, context/42 for the parlay run, context/43 for
the hub run, which also takes `FORK_RESOLVED_MARKET_ID` and `SETTLED_QUESTION_ID`; the range run takes
`FORK_MARKET_ID` + `FORK_ASSET` and seeds a thin book itself; the maker run, context/44, prices its pair off the
live book).

## Deploy (owner-authorized)

```sh
# contracts/.env holds DEPLOYER_PRIVATE_KEY (gitignored; the same key as ~/.config/masayume/deployer.env)
set -a; source .env; set +a                  # fund DEPLOYER_ADDRESS with STT from https://testnet.somnia.network/ first
forge script script/DeployEventVault.s.sol --rpc-url shannon --broadcast --private-key $DEPLOYER_PRIVATE_KEY
forge script script/DeployStrategyRegistry.s.sol --rpc-url shannon --broadcast --private-key $DEPLOYER_PRIVATE_KEY
forge script script/DeployParlayReserve.s.sol --rpc-url shannon --broadcast --private-key $DEPLOYER_PRIVATE_KEY   # then supply it
pnpm contracts:export                        # regenerates packages/markets/src/contracts/* and addresses.masayume.json
```

Somnia charges ~20× the EVM for a creation, and forge's local simulation cannot see that: the three creations
that failed in the vault session all show `gasUsed == gas limit`. The recipe that landed the parlay reserve
(2026-09-02) takes the limit from Somnia's own `eth_estimateGas` instead —
`--skip-simulation --legacy --with-gas-price 6000000000 --gas-estimate-multiplier 105` — and keeps
`gas × price` inside the deployer's balance (the node refuses the envelope otherwise). Somnia estimated 55.4M
and the creation used 36.9M (context/42 §Live on Shannon).

Deploy order is lockstep (AD-10): deploy → commit the regenerated module → deploy ops and web
from that commit. `deployments/<chainId>.json` is the only hand-off between the two.
