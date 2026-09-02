# contracts

Foundry workspace for Masayume's own contracts around DreamDEX Event Contracts.

| Contract | Status | Role |
|---|---|---|
| `EventVault` (`src/vault/`) | **Written, fork-verified, not deployed** | Trading Balance + typed grants (`SESSION` / `EXECUTOR` / `STRATEGY`), owner-only withdrawal, delegated IOC execution on the venue, permissionless `crankSettle` |
| `ERC2771Forwarder` (OpenZeppelin) | deployed alongside the vault | The sponsored-transaction rail: a relayer submits what the owner signed; the vault sees the signer |
| `StrategyRegistry`, `ParlayReserve`, `RangeReserve`, `MarketMakerVault`, `GameArena` | pending (Stages 4–6) | — |

`src/interfaces/IDreamDex.sol` declares only the venue functions the vault calls, copied from the
pinned SDK's ABIs (`@somnia-chain/markets-sdk` 0.28.1).

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

## Commands

```sh
forge build
forge test                                  # 34 unit tests on a mock venue
SHANNON_FORK_URL=<rpc> forge test --match-contract Fork -vv   # against Shannon's real contracts
```

The fork test needs a Window that is `Trading` at the fork block; pass `FORK_MARKET_ID=<decimal id>`
to skip the scan (see `context/41-eventvault-fork-verification-2026-09-02.md` for a run).

## Deploy (owner-authorized)

```sh
# contracts/.env holds DEPLOYER_PRIVATE_KEY (gitignored; the same key as ~/.config/masayume/deployer.env)
set -a; source .env; set +a                  # fund DEPLOYER_ADDRESS with STT from https://testnet.somnia.network/ first
forge script script/DeployEventVault.s.sol --rpc-url shannon --broadcast --private-key $DEPLOYER_PRIVATE_KEY
forge script script/DeployStrategyRegistry.s.sol --rpc-url shannon --broadcast --private-key $DEPLOYER_PRIVATE_KEY
pnpm contracts:export                        # regenerates packages/markets/src/contracts/* and addresses.masayume.json
```

Deploy order is lockstep (AD-10): deploy → commit the regenerated module → deploy ops and web
from that commit. `deployments/<chainId>.json` is the only hand-off between the two.
