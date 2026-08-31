# DreamDEX Event Contracts — Protocol & Developer Model

> Synthesised from the official docs (mirrored at `reference/dreamdex-docs/`, esp. `developers/event-contracts*` and `trading/event-contracts*`) and the bot-kit `packages/ec-core` source (`reference/dreamdex-bot-kit/packages/ec-core/src/`). Verified as of 2026-08-29.

## 1. What an Event Contract is

Binary **Up/Down markets on crypto prices** (BTC, ETH; 15-minute and 1-hour rolling windows today) trading on the same fully on-chain CLOB engine as DreamDEX spot, via a separate contract family.

- The question each window asks: *does the asset close the window at or above its **opening price**?* There are no preset strikes ("strike 0" = up/down vs open; the row's `strike` field also supports fixed-strike markets in the protocol).
- **Prices are Up (YES) probabilities in (0, 1) USDso.** Buy Up at 0.60 → pay 0.60/contract; a winning contract redeems for exactly **1 USDso**. Down price ≡ `1 − Up price`.
- **Zero fees** on dreamDEX: maker, taker, and settlement fees are all 0 (protocol supports them; venue sets 0). Winners redeem 1:1 today — but read the fee from chain, don't assume (see `ec-core/settlement.ts`).
- Fully collateralised, no leverage, no liquidations; max loss = stake.
- Markets **die on schedule and respawn**: each window has a hard expiry and the venue auto-rolls a successor.

## 2. Contract family (per market)

| Piece | Role |
|---|---|
| `BinaryMarketsModule` | Registry + user entry point. `markets(marketId)`, routes complete-set mint/merge and redemptions. Only address a market trusts as settler. |
| Market contract | Per-window lifecycle state (window, resolution, winning outcome). |
| Pool (order book) | Per-window CLOB; owns all escrow. **Pools are recycled across windows** — never key state by pool address; key by `marketId` (bytes32) or symbol. `(poolAddress, nonce)` identifies one generation. |
| `OutcomeToken6909` | One shared **ERC-6909** singleton for ALL markets. Up/Down positions are token *ids* (`yesId`/`noId`), not ERC-20s. |

### Lifecycle (on-chain `MarketStatus` enum)
```
Listed(0) → Trading(1) → Locked(2) → [Settling(3) — never observable] → Resolved(4) | Voided(5)
```
- Only **Trading(1)** accepts orders (mint/merge live too). Locked: cancels still work.
- Resolved: winners redeem 1 USDso each (− settlement fee, 0 on dreamDEX). Voided: **both sides redeem at 0.5** (no fee) — happens if no reliable settlement price within the settlement window.
- Status is time-derived on-chain; **the indexer lags by seconds → gate every write on `getMarketOnchain(marketId).status === 1`**, never the indexed status.
- Indexer terminal status for settled binaries is the string `"Finalized"` (resolution auto-finalizes; `Resolved` filter returns empty).

### One book, two sides — four fill paths
| Crossing pair | Path |
|---|---|
| Buy Up × Sell Up | direct token↔collateral swap |
| Buy Down × Sell Down | direct |
| Buy Up × Buy Down | **mint-a-pair** — pool mints a fresh Up/Down pair from the two buyers' combined collateral (cold-start: no seller/MM needed; you can quote BOTH sides with zero inventory: rest Buy Up @ p + Buy Down @ 1−p) |
| Sell Up × Sell Down | burn-a-pair — both positions burn, each seller paid |

### Escrow & complete sets
- **Buys** escrow collateral at placement (worst case, vault-first: per-pool vault balance spent before wallet — the vault is a payout *fallback*, reads 0 normally).
- **Sells** escrow outcome tokens — no naked shorts; you can only sell what you hold. `mintCompleteSet`: 1 collateral → 1 Up + 1 Down; `mergeCompleteSet` reverses.
- Refunds/proceeds settle to the **wallet**. Cancel returns exact escrow; a taker is charged the fill price, not its limit price.

### Settlement rail
- Oracle-driven, keeperless: settlement question scheduled on the **OracleHub** at creation with gas pre-reserved; Somnia's on-chain reactivity delivers the oracle answer to the hub's callback → module resolves + finalizes in the same flow → redemption opens immediately.
- Permissionless backstops: `pokeOracle(questionId)` pulls a posted answer; after the settlement window, anyone can call `voidExpired()` → void, both sides 0.5. Funds can never strand.
- **Auditable resolutions**: each market row carries `oracleQuestionId`; deep-link `https://prd.oracle.somnia.host/questions/{oracleQuestionId}?view=graph` shows the whole pipeline (sources, values, median, quorum). *The docs explicitly suggest surfacing this in any UI built on ECs — cheap, high-value feature.*

## 3. Addresses & networks

Protocol core is CREATE3 → **identical addresses on testnet & mainnet**:

| Contract | Address |
|---|---|
| BinaryMarketsModule | `0x3ecC694Cef705358864a646142ac17A90E29e388` |
| MarketsCore | `0x2802504314685D89bF6C992CA5a8e7cC78bc0294` |
| BinarySettlement | `0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23` |
| OutcomeToken6909 | `0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9` |
| OracleHub | `0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b` |
| CollateralRouter | `0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C` |
| CLOBFactory / BinaryPoolImpl / MarketCreatorFactory | `0xb2BE8EE02F96379DB75f01802384593EBa9bfF04` / `0x82A1FcdaA2daC2fC7D5f9909D43E68021eE966FD` / `0xE6bEE93cE87c9E6e62aCb621caa7832EE47b4F6B` (from ec-core `addresses.ts`) |

Per-network (from `ec-core/addresses.ts` + `config.ts`):

| | Testnet (Shannon) | Mainnet |
|---|---|---|
| chainId | **50312** | 5031 |
| Gas token | **STT** | SOMI |
| Collateral | **tUSDC `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E`, 6 decimals**, on-demand faucet | USDso `0x00000022dA000002656c64D9eA6011ea952D008A`, **18 decimals** |
| RPC | `https://api.infra.testnet.somnia.network` (bot-kit also uses `https://dream-rpc.somnia.network`) | `https://api.infra.mainnet.somnia.network` |
| WS RPC | `wss://api.infra.testnet.somnia.network/ws` | `wss://api.infra.mainnet.somnia.network/ws` |
| Indexer (GraphQL) | `https://dev.smk.somnia.host/v1/graphql` | `https://prd.smk.somnia.host/v1/graphql` |
| VENUE_ID (moves! read off a live market row) | `0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c` | `0x458b30c2d72bfd2c6317304a4594ecbafe5f729d3111b65fdc3a33bd48e5432d` |
| marketCreator | `0x5Ce69567dB39C8fBAd7e048bEfdbcCdfE67B44e6` | `0x62627805965705Cc303A7F6282DD5059921980aD` |
| tick / lot (raw) | measured ~no constraint (tick 1e3, lot 1 used by kit) | both **1e15** (= 0.001 probability / 0.001 contract) |

**Decimals landmine**: testnet 6dp vs mainnet 18dp (10^12 apart). Always derive scale from collateral `decimals()`; nothing reverts if you get it wrong.

**Testnet collateral faucet**: `faucet(uint256)` on tUSDC credits `msg.sender`, capped at **10,000 tUSDC per call** (`FaucetCapExceeded` beyond). SDK: `exchange.trader.faucet()`. No faucet page needed. Gas: STT from Somnia faucet (testnet.somnia.network).

## 4. Developer surface

**The HTTP API covers spot only — Event Contracts have NO REST endpoints.** The developer surface is `@somnia-chain/markets-sdk` (TS, npm, use ≥ 0.28.0) + the chain itself (indexer GraphQL behind the SDK). No API rate limits; snapshot once and stay current from on-chain events (SDK live watches do this).

Three tiers (you use all):
| Tier | Reach | For |
|---|---|---|
| Unified | `exchange.*` | Trade by symbol in human units (`loadMarkets`, `fetchOrderBook`, `createOrder`, `cancelOrder`, `fetchOpenOrders`, `fetchMyTrades`, `mintSet`, `burnSet`, `fetchTicker`, precision helpers, watch*) |
| Client (reads) | `exchange.client.*` | On-chain truth + indexer history: `getMarketOnchain`, `listLiveBinaryMarkets`, `listBinaryMarkets({status:"Finalized"})`, `listPastBinaryMarkets`, `countBinaryMarkets`, `getBinaryBookParams`, `getOutcomeBalance`, `getErc20Balance`, `getVaultBalance`, `getCandles`, `getFills`, `getUserFills`, `getMarketResolution`, `getOpeningPrices`, `getBinaryPositionPnL`, `getMarketFees`, `getViemClient` |
| Trader (writes) | `exchange.trader.*` | Raw bigint writes: `placeOrder` (side: BUY_YES/SELL_YES/BUY_NO/SELL_NO, price in YES terms, `expireTimestampNs`), `cancelOrder`, `redeem` (explicit `outcomeIdx` — required for voids), `faucet`, mint/merge |

Constructor: `new SomniaMarkets({ indexerUrl, chain, wsRpcUrl, addresses, privateKey?, priceFeed? })`. `priceFeed` = the UNDERLYING BTC/ETH spot + EMA feed (`SOMNIA_TESTNET_PRICE_FEED` bundled; **testnet-only today** — mainnet needs your own URL). Needed only by `fetchPrice`/`watchPrice`; a market's own book price is a probability (circular as a directional signal).

Symbols look like `BTC-0-12AUG26-1600/USDso` with outcomes `…#YES` / `…#NO` (outcome 0 = YES/Up, 1 = NO/Down). Market rows carry typed `asset` ("BTC"|"ETH"), `intervalSec`, `strike`, `expiry`, `tradingStart`, `venueId`, `operatorId`, per-market volume (`cumulativeQuoteVolume`, `cumulativeBaseVolume`, `tradeCount`, `lastPrice`, `lastTradeAt`) and `oracleQuestionId`. **Never parse question text** — wording changes; fields don't. Volume ranking is server-side: `orderBy: "volume" | "tradeCount" | "closingSoon" | "newest"`.

History surface (survives settlement — fills, orders, candles all kept): `listPastBinaryMarkets` (newest-expired first, filter venue/asset/cadence, paginate), `getMarketResolution` (compare `openingAnswer.numericValue` vs `closingAnswer.numericValue` + lifecycle `events`), `getBinaryPositionPnL(account, marketId)`, candles at 60/300/900/3600/14400/86400s. **`getCandles`/`getFills` are keyed on the POOL (recycled!) — always scope `{from: m.tradingStart, to: m.expiry}` / `{since, until}`.**

## 5. The gotcha canon (each verified by DreamDEX in real testing)

1. **Gate on on-chain status** (`getMarketOnchain(...).status === 1`); indexer lags seconds.
2. **Know how a revert reaches you**: SDK writes sign with fixed fees, skip simulation. ≥0.23 unified writes throw decoded revert errors; `trader.*` writes resolve WITHOUT checking `receipt.status` → check it (`assertTxOk` pattern). Unified results carry the receipt on `order.info` (`(order.info as PlaceOrderResult).receipt`) — `order.receipt` is always undefined.
3. **Float prices**: ≥0.28 unified verbs snap price/amount to the venue grid. Below that, `(0.05).toFixed(18)` lands 3 wei off-grid → `InvalidPrice` (only 0.25/0.5/0.75 survive). For exact control convert in tick/lot integer space and use `trader.placeOrder` with bigints (ec-core `placeLimit` does this).
4. **IOC vs resting is a decision**: unfilled limit remainder rests with escrow locked, invisibly. Takers send IOC.
5. **Order expiry is mandatory**: `expireTimestampNs` (ns!, future, ≤ market expiry; 0 reverts `OrderAlreadyExpired`). Use it as a dead-man's switch just past your requote interval.
6. **Lot grid**: `amountToPrecision` reads pool lot from 0.24; sub-lot floors to 0 silently — skip 0-size orders. Raw-tier params: quantize yourself.
7. **Reconcile against the wallet; check balance before signing**: escrow leaves/returns to wallet; underfunded bots revert every cycle burning gas (`ERC20InsufficientBalance` buy / `InsufficientBalance()` sell). Check native gas too (0 gas → viem "Missing or invalid parameters").
8. **Scope to the venue**: one deployment hosts several venues side-by-side in the indexer; filter by `venueId` (and note venue ids MOVED 3× in a week — read off a live market row when empty).
9. **Expiry headroom**: skip windows about to close; scale headroom to cadence (`max(30, min(300, intervalSec*0.4))` — ec-core `headroomSec`).
10. **`loadMarkets()` hides settled markets** (registry sweep skips finalized binaries) → find winnings via `listBinaryMarkets({venueId, status:"Finalized"})`; sort by `expiry` locally (server sorts newest-created).
11. **Winnings are claimed, not received**: redeem explicitly; losing redeem succeeds paying 0; voided → redeem BOTH sides (0.5 each, no winner to infer → explicit `outcomeIdx` via trader tier).
12. **Pools recycled → key by `marketId`**; per-market outcome ids change per generation (`nonce`).
13. **Don't parse question text** — use `asset` + `intervalSec` fields.
14. **PostOnlyWouldCross reverts and throws** (both tiers) — routine on a quoting loop; catch → requote.

## 6. ec-core (bot-kit) — the reference wrapper worth mirroring

`reference/dreamdex-bot-kit/packages/ec-core/src/` — thin opinionated wrapper over markets-sdk. Its module map (all worth reading before we write our own server-side client):

| File | Gives you |
|---|---|
| `addresses.ts` | Bundled deployments (above) + env overrides |
| `config.ts` | `loadConfig()` env→config, endpoints, tick/lot defaults, `makeChain()` viem chain (STT/SOMI symbol) |
| `exchange.ts` | `createExchange({withSigner})` → `{exchange, config, canTrade}`; `assertTxOk`; `shutdown` (WS socket can hold event loop open — cap the wait) |
| `markets.ts` | `activeMarkets` (venue-scoped; throws if live markets span venues and no VENUE_ID), `marketOnchain`, `isTradable`, `outcomeSymbols`, `snapshot` (top-of-book), `toRawUnits`/`quantize` (float-safe lot snapping), `settledMarkets` (Finalized scan, expiry-sorted), `explainEmptyScope` (diagnosable empty states), `MARKET_STATUS` |
| `orders.ts` | `placeLimit` (tick/lot integer conversion → raw trader tier; funds preflight incl. gas; expiry capping; tracks rested orders), `sellableSize`, `netPosition` (YES−NO = real directional risk; complete set is riskless), `cancelTracked`+`cancelVenueOrders` (shutdown hygiene — indexer can't see your freshest orders), `minLeftSec`/`headroomSec` |
| `inventory.ts` | `seedInventory` — faucet top-up (testnet) + `mintSet` so SELLs are collateralised |
| `settlement.ts` | `settlementFeeBps` (indexer → chain fallback; recycled-pool-safe), `estimatePayout` (SDK `estPayoutFor`; guards unresolved `winningOutcome=0` trap), `claimableOutcomes`, `redeemOutcome` (explicit idx) |
| `claim.ts` | `maybeClaim` — in-loop throttled sweep (NOT a timer: two senders on one key race nonces — also why one key = one bot) |
| `gotchas.ts` | `assertProbability` (catches 62 vs 0.62), `clampProbability` (0.01–0.99 for derived prices), `assertTradable`, `assertInventoryForSell`, `noPrice` |

SDK re-exports worth knowing: `probabilityToPrice`, `priceToProbability`, `fromHuman`, `toHuman`, `isBinaryMarket`, `estPayoutFor`, `marketKey`, ABIs (`binaryModuleReadAbi`, `binaryModuleWriteAbi`, `binarySettlementAbi`, `erc6909Abi`, `oracleHubAbi`), `SOMNIA_TESTNET_PRICE_FEED`.

## 7. Product-relevant implications (my notes)

- **A consumer app = SDK client tier + wallet writes.** No REST for ECs means our frontend/server must run the SDK (server routes or a thin backend) against the indexer + RPC. Browser-wallet signing needs checking in the SDK (see `02-markets-sdk-api.md`); worst case we build order calldata via exported ABIs + viem/wagmi.
- **Two-sided quotes with zero inventory** (Buy Up p / Buy Down 1−p) — lets us seed liquidity/"house lines" cheaply, and makes social "I call Up at 60%" posts executable as resting orders.
- **The oracle deep-link** (`prd.oracle.somnia.host/questions/{id}?view=graph`) = free "provably fair" receipts per round.
- **Volume/tape data is on every market row** — official app doesn't even show volume (their FAQ admits it) → analytics is an open niche.
- **Claim UX matters**: users WILL leave winnings stranded (docs stress it). Auto-claim sweep = obvious product win.
- **Zero fees** + no rate limits + sub-second chain = the venue is genuinely suited to a fast tap-to-trade consumer loop on testnet.
