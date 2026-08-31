# `@somnia-chain/markets-sdk` — API Reference (v0.28.1)

> Compiled 2026-08-31 from the shipped npm tarball extracted at
> `reference/markets-sdk/package/` (README.md, package.json, `src/`, and the compiled
> `dist/*.d.ts` declarations). Every claim cites a file path inside that directory.
> **0.28.1 is the latest published version** (npm registry, published 2026-08-21).
> The README links `docs/*.md` guides but the tarball ships NO `docs/` directory —
> those live only in the GitHub repo (`github.com/somnia-chain/somnia-markets`,
> `packages/sdk`). What follows is derived from the shipped types, which are
> exhaustively documented inline.

---

## 1. Install, peer deps, entry points

```sh
pnpm add @somnia-chain/markets-sdk viem   # npm / yarn / bun equivalents work
```

From `package/package.json`:

- **Version**: `0.28.1`. ESM only (`"type": "module"`), `sideEffects: false`.
- **Peer deps**: `viem ^2` (required); `react >=18` (optional — only for `/react`);
  `@somnia-chain/reactivity ^0.2.1` (optional — only for `/reactivity`).
- **Exports map** (subpaths):

| Import | What it is | Types file |
|---|---|---|
| `@somnia-chain/markets-sdk` | Core: `SomniaMarkets`, all types, ABIs, helpers, query keys | `dist/index.d.ts` |
| `@somnia-chain/markets-sdk/react` | `SomniaMarketsProvider` + all `use*` hooks | `dist/react.d.ts` |
| `@somnia-chain/markets-sdk/chains` | viem `Chain` defs for every Somnia network + bridge | `dist/chains/index.d.ts` |
| `@somnia-chain/markets-sdk/reactivity` | Re-export of `@somnia-chain/reactivity` (optional peer) | `dist/reactivity/index.d.ts` |
| `@somnia-chain/markets-sdk/native` | `createNative(client)` — the `somnia_*` JSON-RPC namespace + session txs | `dist/native/index.d.ts` |

Other `@somnia-chain/*` packages on npm (registry search, 2026-08-31):
- `@somnia-chain/reactivity` 0.2.1 — event-driven apps SDK (the optional peer).
- `@somnia-chain/reactivity-contracts` 0.2.1 — Solidity package for the same.
- `@somnia-chain/streams` 0.12.2 — Somnia streams SDK with reactivity support.
- `@somnia-chain/viem-session-account` 0.1.0 — viem account/wallet client for Somnia session transactions.
- There is **no** `@somnia-chain/deployments` package on npm (a README example comment
  mentions it, but addresses are baked into this SDK — see §2.3).

---

## 2. Constructor & configuration

### 2.1 Creating an exchange

`new SomniaMarkets(config)` is the single entry point; the engine tier
(`exchange.client`, `exchange.trader`) is only reachable through it — never
constructed separately (`src/index.ts:30`, `dist/unified/exchange.d.ts:95`).

```ts
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const exchange = new SomniaMarkets({
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql",   // testnet indexer
  chain: somniaShannon,                                    // chainId 50312
  wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",   // optional with SDK chains (see below)
  addresses: SOMNIA_TESTNET_ADDRESSES,
  // signer — any ONE of: privateKey | account | walletClient (all optional; reads work without)
});
await exchange.loadMarkets();
```

**Testnet vs mainnet values** (README.md lines 34–52; `dist/chains/definitions/*.js`):

| | Testnet (Shannon) | Mainnet |
|---|---|---|
| `indexerUrl` | `https://dev.smk.somnia.host/v1/graphql` | `https://prd.smk.somnia.host/v1/graphql` |
| `chain` | `somniaShannon` (id **50312**, "Somnia Testnet", native STT) | `somniaMainnet` (id **5031**, native SOMI) |
| `wsRpcUrl` | `wss://api.infra.testnet.somnia.network/ws` (alias `wss://dream-rpc.somnia.network/ws`) | `wss://api.infra.mainnet.somnia.network/ws` |
| HTTP RPC | `https://api.infra.testnet.somnia.network` (alias `https://dream-rpc.somnia.network`) | `https://api.infra.mainnet.somnia.network` |
| `addresses` | `SOMNIA_TESTNET_ADDRESSES` | `SOMNIA_MAINNET_ADDRESSES` |
| Explorer | `https://shannon-explorer.somnia.network` | `https://explorer.somnia.network` |
| Collateral | tUSDC `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` (**6 decimals**, faucet-capable) | `0x00000022dA000002656c64D9eA6011ea952D008A` (USDso-family, **18 decimals**) |

Other chains in `/chains` (`dist/chains/index.d.ts`): `somniaElwood` (50313),
`hidekiTestnet` (50383, 10 ms blocks), `somniaLocal` (anvil 31337); plus
`somniaChains`, `getSomniaChain(id)`, `isSomniaChainId(id)`, `ChainId`, and re-exported
viem `defineChain`/`Chain`. Bridge exports (Hyperlane warp routes, dev/test only) ride
the same entry (`dist/chains/index.d.ts:1`, README lines 175–179).

`wsRpcUrl` is **optional when `chain` comes from `/chains`** — every SDK chain
definition carries `rpcUrls.default.webSocket`. viem's own `somniaTestnet` does not,
so with a ws-less chain it stays required and the first chain touch throws
`NotConfiguredError` (`dist/config.d.ts:222-232`). There is **no HTTP fallback** — the
WebSocket is the single chain transport, opened lazily on first chain I/O (an
indexer-only exchange never opens one).

### 2.2 `ClientConfig` / `SomniaMarketsConfig` (full field list)

From `dist/config.d.ts:190-281` and `dist/unified/exchange.d.ts:14`:

```ts
type SomniaMarketsConfig = ClientConfig &
  Pick<TraderConfig, "privateKey" | "account" | "walletClient">;

interface ClientConfig {
  indexerUrl: string;                       // required. Envio/Hasura GraphQL HTTP endpoint
  indexerHeaders?: Record<string, string>;  // e.g. Hasura admin secret — SERVER ONLY (needed for count* aggregates)
  signal?: AbortSignal;                     // client-wide abort for indexer reads (not per-request)
  chain: Chain;                             // required. viem chain
  wsRpcUrl?: string;                        // chain WS RPC; optional if chain carries a webSocket URL
  fees?: FixedFees;                         // default DEFAULT_FEES = { maxFeePerGas: 60 gwei, maxPriorityFeePerGas: 0n }
  addresses?: SomniaMarketsAddresses;       // protocol contracts (below)
  priceFeed?: PriceFeedConfig;              // required only for watchPrice/fetchPrice* methods
  debug?: (e: DebugEvent) => void;          // opt-in structured tracing sink
}
```

Fixed-fee doctrine (`dist/config.d.ts:156-182`): the SDK **never estimates gas or
fees**. `DEFAULT_FEES = { maxFeePerGas: 60_000_000_000n, maxPriorityFeePerGas: 0n }`
and `DEFAULT_GAS = 10_000_000n` (values in `dist/config.js:20-34`). Every write
accepts a per-call `gas` override.

### 2.3 `SomniaMarketsAddresses` and the baked-in constants

Interface at `dist/config.d.ts:5-122`; concrete values in `dist/addresses.js`:

| Field | Testnet | Mainnet | Needed by |
|---|---|---|---|
| `binaryModule` | `0x3ecC694Cef705358864a646142ac17A90E29e388` | same | trader writes (redeem/finalize), `getMarketOnchain`, hub reads |
| `binaryPoolImpl` | `0x82A1FcdaA2daC2fC7D5f9909D43E68021eE966FD` | same | display only |
| `binarySettlement` | `0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23` | same | `redeemDirect`/`claimOwed`/`getSettlement` |
| `clobFactory` | `0xb2BE8EE02F96379DB75f01802384593EBa9bfF04` | same | /system diagnostics fallback |
| `collateral` (alias `testUsdc`) | `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` (tUSDC 6dp) | `0x00000022dA000002656c64D9eA6011ea952D008A` (18dp) | faucet, balances |
| `collateralRouter` | `0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C` | same | native/Permit2 mint & redeem paths |
| `marketCreator` | `0x138CfA6b80475b8c03d7E468b2442278E51e645a` | `0xfe81C4e8EfFb7df27Eb21881f80AF2BF8DCF0c39` | live-tail discovery watch |
| `marketCreatorFactory` | `0xE6bEE93cE87c9E6e62aCb621caa7832EE47b4F6B` | same | market-machinery admin |
| `marketsCore` | `0x2802504314685D89bF6C992CA5a8e7cC78bc0294` | same | operator/venue admin |
| `oracleHub` | `0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b` | same | oracle reads/writes |
| `fakeOracle` | (unset in constants) | — | demo `resolve`/`voidMarket` |
| `operatorPermissionsRegistry` | (unset in constants) | — | stop orders / operator grants |
| `lend` | `SOMNIA_TESTNET_LEND` | `SOMNIA_MAINNET_LEND` | `client.lend` (SomniaLend Aave-v3 fork) |

All addresses are optional — features degrade per-method with a clear
`NotConfiguredError` when a needed address is missing (`dist/errors.d.ts:55-78`).

### 2.4 Price feed

`SOMNIA_TESTNET_PRICE_FEED = { url: "https://price-feed.dev.oracle.somnia.host/v1/graphql", quote: "USDC" }`
(`dist/config.js:12-15`). One Hasura endpoint serves every tracked asset (BTC, ETH, …);
`wsUrl` is derived from `url` (https→wss) when omitted. **Set `quote`** — the feed
indexes several quotes per base and matching both double-counts candle buckets
(`dist/config.d.ts:129-154`). Prices are 1e18-scaled (`PRICE_FEED_DECIMALS = 18`,
`dist/priceFeed/types.d.ts`). No mainnet price-feed constant ships in this version.

### 2.5 Debugging

`debug: consoleDebugSink()` renders an indented span tree; `debugCollector()`
captures for tests; the event shape maps 1:1 onto OpenTelemetry (README lines 251–309;
exports at `src/index.ts:66`).

---

## 3. Browser wallet as signer (viem WalletClient / wagmi) — VERIFIED SUPPORTED

The SDK accepts three signer sources, checked in this order of capability
(`dist/trade.d.ts:13-34`, `dist/txSend.d.ts:1-40`):

```ts
interface TraderConfig {
  walletClient?: WalletClient;      // browser/wagmi wallet over an injected provider
  account?: Account | Address;      // local viem account (privateKeyToAccount)
  privateKey?: `0x${string}`;       // SDK derives the account
  publicClient?: PublicClient;      // optional read client; defaults to the SDK's WS client
  decimals?: number;                // default 6
  gas?: bigint;                     // default 10_000_000n
}
```

- With `privateKey`/local `account`: the SDK signs locally with fixed fees and a
  locally-tracked nonce and sends via Somnia's `realtime_sendRawTransaction` —
  send + confirm in **one round-trip**, zero pre-send RPCs (`dist/somniaMarketsClient.d.ts:1830-1838`).
- With `walletClient`: the write goes **through the wallet** (user confirmation popup)
  and the SDK confirms the receipt off its newHeads subscription (README line 166:
  "In the browser, pass a `walletClient`"). Falls back to `eth_sendRawTransaction` +
  receipt wait when realtime is unsupported (`dist/txSend.d.ts`, `resolveSigner`).

**The wagmi/browser recipe** — construct once for public reads, bind the wallet on
connect via `setSigner` (`dist/unified/exchange.d.ts:180-188`):

```tsx
// exchange.ts — module-level singleton, no signer yet
export const exchange = new SomniaMarkets({
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
  chain: somniaShannon,
  addresses: SOMNIA_TESTNET_ADDRESSES,
});

// on wallet connect (wagmi: useWalletClient())
const { data: walletClient } = useWalletClient();
useEffect(() => {
  exchange.setSigner(walletClient ? { walletClient } : {}); // {} disconnects → read-only
}, [walletClient]);

// then anywhere:
await exchange.createOrder("BTC-95000-31DEC26/USDC#YES", "limit", "buy", 10, 0.62);
console.log(exchange.walletAddress); // the authenticated address, or undefined
```

`setSigner` replaces the trader every authenticated verb resolves against; live
watches and market data are unaffected. Authenticated methods throw
`SignerRequiredError` (naming the method) when no signer is bound
(`dist/errors.d.ts:79-94`). The raw tier works the same way:
`exchange.client.createTrader({ walletClient })`.

For account-abstraction / relayer flows, every placement has a `build*` twin that
returns `UnsignedCall`s (`{ to, data, value, description }`) instead of sending:
`buildPlaceOrder`, `buildPlaceSpotOrder`, `buildPlacePerpOrder`,
`buildDepositMargin`, `buildPlacePerpStopOrder`, … (`dist/trade.d.ts:1659-1833`,
`dist/writer.d.ts:52-108`).

---

## 4. Tier 1 — the `SomniaMarkets` exchange (ccxt-shaped, human units)

Source: `dist/unified/exchange.d.ts` (816 lines — every method below is verbatim from it).

Verb conventions: `fetch*` = one-shot round-trip; `watch*` = streaming (each `await`
resolves on the NEXT change of that channel, served from the local store);
`create*`/`cancel*` = writes that resolve once **mined**. Every struct carries the raw
native payload under `.info`.

### Properties
- `exchange.client: SomniaMarketsClient` — the raw engine tier (§5).
- `exchange.trader: Trader` — lazy getter; throws without a signer (§6).
- `exchange.markets: Record<string, UnifiedMarket>`, `exchange.symbols: string[]` — populated by `loadMarkets()`.
- `exchange.has` — capability map (all flags `true`).
- `exchange.walletAddress: Address | undefined`.
- `setSigner(signer)`, `close(): Promise<void>` (releases every watch; instance stays usable for one-shot fetches).

### Markets & precision
| Method | Signature | Notes |
|---|---|---|
| `loadMarkets` | `(reload?: boolean) => Promise<Record<string, UnifiedMarket>>` | Call once before anything symbol-based. Reads each binary pool's tick/lot grid from chain. Uses `client.listRegistryMarkets()`, which **excludes finalized binary series** (dead markets don't get symbols) — `dist/markets.d.ts:456-465`. |
| `fetchMarkets` | `() => Promise<UnifiedMarket[]>` | Array form of loadMarkets. |
| `market` | `(ref: string) => Tradable` | Resolves symbol / tradable symbol / pool address / market id / BinaryMarket address to a `Tradable`. |
| `priceToPrecision` | `(ref, price: number) => number` | Snaps to tick grid, **rounds down**, clamps binary prices inside (0,1). Throws `InvalidInputError` if a binary pool's grid could not be read (no silent guessing). |
| `amountToPrecision` | `(ref, amount: number) => number` | Snaps to lot grid, rounds down. Same throw semantics. |

Symbols: markets are `BASE/QUOTE` (`SOMI/USDC`) or `ASSET-STRIKE-EXPIRY/QUOTE`
(`BTC-95000-31DEC26/USDC`, intraday: `BTC-…-03JUL26-0930/USDC`); binary outcome
**tradables** append `#YES` / `#NO`. Collisions get a `-XXXX` suffix from the market
id's trailing hex (`dist/unified/symbols.d.ts`). A NO tradable views everything
through the 1−p lens (prices, sides, and OHLC high/low swap).

### Market data
| Method | Signature |
|---|---|
| `fetchOrderBook` | `(ref, limit?) => Promise<UnifiedOrderBook>` — one-shot chain read, head-fresh |
| `fetchTrades` | `(ref, since?, limit?) => Promise<UnifiedTrade[]>` — indexer, newest first |
| `fetchOHLCV` | `(ref, timeframe?, since?, limit?) => Promise<UnifiedOHLCV[]>` — `[ms,o,h,l,c,vol]` oldest first; timeframes 1m 5m 15m 1h 4h 1d |
| `fetchTicker` | `(ref) => Promise<UnifiedTicker>` — rolling 24h from hourly candles; perp tickers add markPrice/indexPrice/fundingRate/openInterest |
| `fetchStatus` | `() => Promise<{ status: "ok"\|"connecting"\|"error", updated, info: TailStatus }>` |
| `fetchPrice` | `(asset) => Promise<UnifiedPrice \| null>` — EMA oracle feed (needs `priceFeed`) |
| `fetchPriceOHLCV` | `(asset, timeframe?, since?, limit?) => Promise<UnifiedOHLCV[]>` — 1m/1h/1d; `vol` = oracle update count, NOT trade volume |

### Account (need signer or `account`)
| Method | Signature | Notes |
|---|---|---|
| `fetchBalance` | `() => Promise<UnifiedBalances>` | ERC-20s key by currency code; binary outcome holdings key by **tradable symbol** (`bal["…#YES"].total`). `free === total` (escrow lives in pools). |
| `fetchOpenOrders` | `(ref?, limit?) => Promise<UnifiedOrder[]>` | `limit` applies **per venue** (default 200) — an unscoped call can return up to 3×limit. |
| `fetchOrders` | `(ref?, since?, limit?, params?: { offset? }) => Promise<UnifiedOrder[]>` | All lifecycle statuses, newest first, true offset paging. |
| `fetchMyTrades` | `(ref?, since?, limit?) => Promise<UnifiedTrade[]>` | `since` in **ms**. Pages the unified fill tape until `limit` resolvable rows. |
| `fetchPortfolioAnalytics` | `(timeframe: "1d"\|"7d"\|…, params?) => Promise<PortfolioAnalytics>` | Spot-scoped equity curve / PnL buckets / MWRR, computed client-side. |

### Realtime (each `await` resolves on the next change)
| Method | Signature |
|---|---|
| `watchOrderBook` | `(ref, limit?) => Promise<UnifiedOrderBook>` |
| `watchTrades` | `(ref, limit?) => Promise<UnifiedTrade[]>` |
| `watchOrders` | `(ref, limit?) => Promise<UnifiedOrder[]>` — MY orders (authenticated); detect fills by status flip |
| `watchMyTrades` | `(ref, limit?) => Promise<UnifiedTrade[]>` |
| `watchPrice` | `(asset) => Promise<UnifiedPrice>` — needs `config.priceFeed` |

Usage pattern (`dist/unified/exchange.d.ts:487-533`):

```ts
while (true) {
  const book = await exchange.watchOrderBook("SOMI/USDC", 5); // resolves on next book change
  const [bestBid] = book.bids[0] ?? [];
}
```

### Trading (writes; resolve once mined)
| Method | Signature | Notes |
|---|---|---|
| `createOrder` | `(ref, type: "limit"\|"market", side: "buy"\|"sell", amount: number, price?: number, params?: CreateOrderParams) => Promise<UnifiedOrder>` | Works for every market kind. `market` computes crossing limit ± `params.slippage` (default 1%) and sends IOC. **Price/quantity are tick/lot-aligned before send** (buy price down, sell price up, quantity down) — read `price`/`amount` back from the result. Sub-lot quantity throws `InvalidInputError`. NO prices are NO probabilities (complement handled internally). The full `PlaceOrderResult` (receipt, orderId, fills) rides on `order.info`. |
| `cancelOrder` | `(id, ref) => Promise<{ id, symbol, status: "canceled", info }>` | Throws if the cancel didn't land. |
| `createStopOrder` | `(ref, type, side, amount, triggerPrice, price?, params?: { triggerDirection? }) => Promise<UnifiedStopOrder>` | Spot only. Trigger aligns AWAY from the mark. |
| `fetchOpenStopOrders` | `(ref?) => Promise<UnifiedStopOrder[]>` | |
| `cancelStopOrder` | `(id, ref) => Promise<{...}>` | Refunds the SOMI keeper payment. |
| `mintSet` | `(ref, amount: number) => Promise<{ hash, info }>` | `amount` collateral → `amount` YES + `amount` NO. |
| `burnSet` | `(ref, amount) => Promise<{ hash, info }>` | Complete set back to collateral. |
| `redeem` | `(ref, amount) => Promise<{ hash, info }>` | Post-resolution; module-routed by marketId. |

`CreateOrderParams` (`dist/unified/exchange.d.ts:20-38`): `timeInForce?: "GTC"|"IOC"|"FOK"|"PO"`,
`postOnly?: boolean`, `slippage?: number` (default 0.01), `builder?: Address`,
`builderFeeBpsTimes1k?: bigint` (needs a prior `approveBuilder` opt-in on the pool).

### Perp-specific (unified)
`fetchFundingRate(ref)`, `fetchFundingRateHistory(ref, since?, limit?)` (since-as-cursor
paging), `fetchPositions(refs?)`, `depositMargin(ref, amount)`, `withdrawMargin(ref, amount)`
— `dist/unified/exchange.d.ts:703-762`.

### Throw vocabulary
Every SDK failure is a subclass of `SomniaMarketsError` (`dist/errors.d.ts`):
`InvalidInputError` (caller bug, never retry), `NotConfiguredError` (missing
address/URL), `SignerRequiredError`, `IndexerError` (**always** "request failed",
never "no rows" — empty results are `[]`/`null`), `RpcError` (transport; retryable),
`ContractRevertError` (branch on `e.errorName` — the decoded Solidity error, e.g.
`InsufficientBalance`, `ExpiredOrderMustBeCancelled`; may be `undefined` for unknown
selectors). Reverts are decoded on every path including mined-but-reverted receipts.

---

## 5. Tier 2 — `exchange.client` (`SomniaMarketsClient`, bigint-exact)

Source: `dist/somniaMarketsClient.d.ts` (1868 lines). Three read tiers: **live store**
(`getLive*`, synchronous, needs a watch), **chain** (`eth_call`, head-fresh, no watch),
**indexer** (history/aggregates, lags slightly). Addresses are lowercased strings;
money is raw integers (bigint from chain, decimal strings from the indexer).

### 5.1 Watches & live store

| Method | Signature / notes |
|---|---|
| `watchMarket(pool)` | `Promise<WatchHandle>` — hydrates snapshot (market row + fills + full resting book) then streams events. Ref-counted; `handle.stop()` releases (idempotent); short linger absorbs remounts. Resolves once reads are live. |
| `watchMarkets(opts?: { discover? })` | Whole-protocol tail. `discover: true` also watches MarketCreator + BinaryMarketsModule creation events so new markets join live (needs `addresses.marketCreator`). |
| `watchUser(user)` | Hydrates one account's order/fill **history** (one indexer fetch). Live attribution only happens inside watched markets. |
| `getWatchStatus(pool)` | `"unwatched" \| "hydrating" \| "live"` (`dist/liveTail.d.ts:25`) |
| `subscribeLive(listener)` | Fires after every batch of store changes; returns unsubscribe. The React hooks subscribe to exactly this. |
| `getLiveStatus()` / `isTailing()` | `TailStatus` = `{ mode: "init"\|"tailing", snapshotBlock, lastBlock, headBlock, wsConnected, watchCount }` (`dist/store.d.ts:36-55`) |
| `stopLive()` | Tear down all watches/subscriptions/timers; store keeps last (stale) state. |
| `getLiveMarkets()` | `LiveMarket[]` (= `Market[]`), synchronous, memoized |
| `getLiveMarketByPool(pool)` / `getLiveMarketByAddress(addr)` | one market, or null |
| `getLiveFills(pool, { limit? })` | newest first; default 40, store keeps ~400/pool |
| `getLiveUserFills(pool \| null, user, { limit? })` | default 50 |
| `getLiveUserOrders(pool, user, { limit? })` | every lifecycle state; filter `status === "Open"` |
| `getLiveBinaryOrderBook(pool, { depth? })` | 4-sided `BinaryOrderBook`, default depth 10, zero round-trips |
| `getLiveBinaryOrderBookByMarket(marketId, { depth? })` | **recycle-safe**: returns an EMPTY book when `marketId` is no longer the pool's current binding |
| `getLiveSpotOrderBook(pool, { depth? })` | 2-sided, default depth 12 |
| `getLiveFundingUpdates(pool, { limit? })` | perp funding settlements, oldest first |

Reconnect doctrine: no polling anywhere; a dropped socket heals via reconnect +
chain backfill of missed blocks (README "How the live feed works"; `dist/liveTail.d.ts:158-163`).

### 5.2 Quotes & derived analytics (live store + cached chain reads)

| Method | Notes |
|---|---|
| `quoteBinaryOrder({ pool?\|marketId?, side: BinarySide, quantity: bigint, depth? })` → `BinaryOrderQuote` | Synchronous market-order preview: `avgPrice`, `cost`, `filledQuantity`, `wouldRest`, `levelsConsumed`, `slippageVsMid` (`dist/derivedReads.d.ts`). |
| `quoteBinaryStake({ side: "BUY_YES"\|"BUY_NO", stake: bigint, slippageBps?, … })` → `Promise<BinaryStakeQuote \| null>` | "Bet $50 on Up" → shares + protective limit + escrow; feeds straight into `trader.placeOrder({ …, orderType: ORDER_TYPE.MARKET })`. `null` = nothing fillable. Default cushion 300 bps / 10 ticks. |
| `quoteBinarySell({ side: "SELL_YES"\|"SELL_NO", quantity, … })` → `Promise<BinarySellQuote \| null>` | Unwind preview; `null` = no bid to cross (disable the Sell button). |
| `getBinaryBookParams(pool)` → `Promise<BinaryBookParams>` | `{ tickSize, minQuantity, lotSize }` bigints; one `eth_call`, cached per pool for the client's lifetime (`dist/orders.d.ts:214-232`). |
| `getMarketStats24h({ pool?\|marketId? })` → `Promise<MarketStats24h>` | 24h volume/trades/change from 1h candles. |
| `getBinaryPositionPnL(account, marketId)` → `Promise<BinaryPositionPnL>` | `{ balanceYes, balanceNo, costBasis, avgCost, markValue, unrealizedPnl, realizedPnl }` — all raw bigints, avg-cost basis incl. mint/merge folds. |
| `getOpenPositionsWithPnL(account)` → `Promise<OpenPositionPnL[]>` | Batched PnL for ALL open binary positions (bounded round-trips, no N+1). Each entry = `BinaryPositionPnL & { market: PortfolioMarket }`. |
| `getClaimable(account)` → `Promise<ClaimablePosition[]>` | Redeemables across settled markets, shaped for `trader.redeemMany({ entries })`. Winners × (1 − settlementFee); voided pay amount/2. |

### 5.3 Price feed (needs `config.priceFeed`)

`watchPrice(asset)` / `watchPrices(assets)` → `PriceWatchHandle`; `getPriceStatus(asset)`;
`subscribePrices(listener)` (separate store from `subscribeLive`); `getLivePrice(asset)`,
`getLivePrices(assets)`, `getLivePriceTicks(asset, { limit? })` (default 100, keeps ~1000),
`getLivePriceFeedInfo(asset)`; one-shots: `fetchPriceFeedInfo`, `fetchPrice`,
`fetchPrices(assets?)` (omit = all tracked assets), `listPriceFeeds()`,
`fetchPriceHistory(asset, { limit?, from?, to? })`,
`fetchPriceCandles(asset, "M1"|"H1"|"D1", opts?)` (`dist/somniaMarketsClient.d.ts:403-489`).

### 5.4 Market reads (indexer)

| Method | Signature |
|---|---|
| `listMarkets(opts?)` | `{ marketType?: "SPOT"\|"PERP"\|"BINARY", limit? (50), offset? }` → `Market[]`, newest first |
| `listRegistryMarkets()` | non-binary + **live** (non-finalized) binary series, paged to exhaustion — what `loadMarkets` uses |
| `countMarkets(opts?)` | server-side count — needs privileged `_aggregate` role (**server-only**, via `indexerHeaders`) |
| `getMarket(id)` | PK: bytes32 marketId (binary) / pool address (spot, perp) → `Market \| null` |
| `getMarketByPool(pool)` | by-pool lookup → `Market \| null` |
| `listBinaryMarkets(opts?: BinaryMarketFilter & { limit? })` | pre-narrowed `BinaryMarket[]`, newest first |
| `listLiveBinaryMarkets(filter?: LiveBinaryMarketsFilter)` | `expiry > now`, **soonest-to-expire first**, paginated (`limit` default 50, `offset`) |
| `listPastBinaryMarkets(opts?: PastBinaryMarketsOptions)` | `expiry ≤ now`, most-recently-expired first, `limit`+`offset` |
| `countBinaryMarkets(opts: BinaryMarketFilter & { phase: "live"\|"past", nowSec? })` | server-side count (**server-only** `_aggregate`) |
| `listBinaryVenueIds()` | distinct `{ operatorId, venueId }` pairs — filter options without fetching markets |
| `listBinaryAssets()` | distinct asset symbols |
| `getBinaryMarket(id)` | by bytes32 marketId → `BinaryMarket \| null` |
| `getBinaryMarketByAddress(marketAddress)` | by BinaryMarket contract address (newest first for recycled addresses) |
| `getMarketFees(id)` | `MarketFees \| null` — frozen fee config + venue attribution (`dist/markets.d.ts:543-562`) |
| `getMarketStatusHistory(marketId)` | `MarketStatusUpdate[]` oldest-first — `{ oldStatus, newStatus, blockNumber, timestamp, txHash }` |
| `listSpotMarkets` / `getSpotMarket` / `listPerpMarkets` / `getPerpMarket` | kind-narrowed equivalents |
| `getOpeningPrices(marketIds)` | `Record<marketIdLower, string \| null>` — batch reference-question (opening) prices, one pair of round-trips |
| `getBookTops(marketIds)` | `Record<marketIdLower, BookTop>` — batch best bid/ask/mid (YES terms, raw); empty-book markets absent |

`BinaryMarketFilter` (`dist/markets.d.ts:407-439`): `operatorId?`, `venueId?`, `asset?`,
`intervalSec?` (900|3600|14400|86400), `status?: BinaryMarketStatus`, `search?`
(case-insensitive ilike over asset+question), `creator?`,
`orderBy?: "newest"|"closingSoon"|"volume"|"tradeCount"`.

### 5.5 Candles, fills, orders (indexer)

| Method | Signature |
|---|---|
| `getCandles(poolAddress, intervalSeconds, { limit? (500), from?, to? })` | `Candle[]` oldest-first; intervals `CANDLE_INTERVALS = [60, 300, 900, 3600, 14400, 86400]` (`dist/candles.d.ts`) |
| `getFills(pool, opts?: FillsOptions)` | `FillRow[]` newest first; `{ limit? (50), offset?, since?, until? }` |
| `getUserFills(account, opts?: FillsOptions & { pool? })` | fills as maker OR taker |
| `countUserFills(account, opts?)` | server-side count (bounded public-role fallback) |
| `getOpenOrders(owner, opts?: Omit<OrdersOptions,"status">)` | `OpenOrder[]` — currently open, newest first (indexer lags; prefer live/chain in loops) |
| `getOrders(owner, opts?: OrdersOptions)` | `OrderRow[]` — ALL statuses + fill progress + `cancelReason` + amend linkage |
| `countOrders(owner, opts?)` | server-side count |
| `listSweepableOrders(opts?)` | expired-but-still-resting orders (keeper work list), longest-overdue first |
| `getOutcomeBalances(account, marketAddress)` | indexed `{ yes, no }` strings — display-grade; gate writes with chain reads |
| `getPortfolio(account, opts?: PortfolioOptions)` | `Portfolio` = `{ account, positions, openOrders, trades }` in one round-trip (§7.4) |
| `getSpotPortfolio` / `getPerpPortfolio` / `getSpotStopOrders` / `listPerpStopOrders` / `listPerpOrderHistory` | spot/perp equivalents |
| `getSyncStatus(chainId)` | `IndexerSyncStatus \| null` — indexer height vs chain |
| `getRouterActions(account, opts?)` | RouterMinter redeem/mint/merge history |
| `listProtocolFees` / `listBuilderFees` / `listSettlementFees` / `listBuilderApprovals` / `getVaultPayoutFallbacks` | fee/credit histories |

### 5.6 Chain reads (head-fresh, no watch needed)

| Method | Notes |
|---|---|
| `getBinaryOrderBook(pool, { depth? (10), decimals? (6) })` | 4-sided book from the contract |
| `getSpotOrderBook(pool, { depth? (12) })` | spot/perp shared OrderBook base |
| `getOrderOnchain(pool, orderId)` | read your own writes; `null` = no ACTIVE order under that id |
| `getOwnOpenOrdersOnchain(pool, owner)` | `bigint[]` order ids at head (impersonates via eth_call sender) |
| `getAllOpenOrdersOnchain(pool, { isBid, maxCount? (100), cursor? })` | paged per-order book detail; loop while `hasMore` |
| `getMarketOnchain(marketId: Hex)` | full `MarketOnchain` wiring + state (§7.3). Takes bytes32 **marketId**, not an address (0.13 breaking change). Needs `addresses.binaryModule`. |
| `getPoolCreator(pool)` / `getFreePools(creator, collateral)` / `getPoolBindings(pool)` / `getPool(address)` | pool-recycling introspection |
| `getErc20Balance(token, account)` / `getErc20Metadata(token)` / `getErc20Allowance(token, owner, spender)` | plain ERC-20 |
| `getOutcomeBalance({ outcomeToken, account, id })` | ERC-6909 `balanceOf(account, id)` — the authoritative outcome balance |
| `getBalances(queries, account)` | batch ERC-20 + ERC-6909 in one fan-out, positionally aligned |
| `getVaultBalance({ vault, owner, token })` / `getManualVaultMode` / `getAutoPullRequirement` | pool-vault reads |
| `getMaxBuilderFeeBpsTimes1k(pool)` / `getBuilderApproval(ref)` / `getEffectiveBuilderApproval(ref)` | builder-fee gates |
| `getStopOrderSomiPayment(registry)` / `getPerpStopOrderSomiPayment` / `getUnclaimedPerpStopSomi` / `getPerpStopOrder` | stop-registry reads |
| `getNativeBalance(addr)` / `getHeadBlock()` / `getContractMeta(addr, { proxy? })` / `getSystemInfo()` | diagnostics |
| `getViemClient()` | the undecorated viem `PublicClient` sharing the SDK's WebSocket — for your own contracts (viem error contract, not SDK-decoded) |
| Perp suite | `getPerpState`, `getPerpPosition`, `getMarginAccount`, `getAccountHealth`, `getLiquidationPrice`, `getBankruptcyPrice`, `getPerpLeverage`, `getPerpPositionAnalytics`, `listPerpPositionAnalytics`, `getMaxPerpOrderSize`, `previewPerpOrderMargin`, `previewPerpClosePnl`, `previewPerpLiquidationPrice`, `getPerpSideHolders`, `getPerpRiskParams`, `getPerpHealthSnapshot`, `getEffectiveImfBps`, `getPerpSystemConfig`, `getInsuranceFundState`, `getLiquidationEngineConfig`, `listPerpPoolStatuses`, `listTradeablePerpPools`, `isPerpPoolRegistered`, … (`dist/somniaMarketsClient.d.ts:1084-1480`) |

### 5.7 Factories & namespaces

- `createTrader(traderConfig)` → `Trader` (§6).
- `createOperatorAdmin` / `createOracleHubAdmin` / `createGovernanceAdmin` /
  `createMarketCreatorAdmin` — operator/oracle machinery (registration, venues,
  series, rolls) — `dist/somniaMarketsClient.d.ts:1840-1867`. Directory reads:
  `listOperators`, `getOperator`, `listVenues`, `getVenue`, `countOperators`,
  `countVenues`, `listMarketCreators`, `getMarketCreator`, `listOracleAdapters`,
  `listSeries`, `listOracleQuestions`, `getOracleQuestion`, oracle-hub economics
  (`getSchedulingCost`, `quoteCreateMarketValue`, `earmarkedOf`, `creditOf`,
  `resolveReserve`, …), `encodeBinaryVenueFeeParams`, `getMaxVenueFeeBps`.
- `client.lend` — SomniaLend namespace (Aave v3 fork): `listReserves()`,
  `getAccount(addr)`, `createLender()`; needs `addresses.lend`
  (`dist/somniaMarketsClient.d.ts:94-105`, `dist/lend/client.js`).

---

## 6. Tier 3 — `exchange.trader` (raw writes, bigint units)

Source: `dist/trade.d.ts` (2008 lines). Built via `client.createTrader(config)` or the
exchange's lazy `trader` getter. **Every write awaits its receipt** and resolves to
`TxResult = { hash, receipt }`; placements resolve to
`PlaceOrderResult = TxResult & { orderId?: bigint, fills: OrderFill[] }`.

### `ORDER_TYPE` (`dist/trade.d.ts:246-255`)
```ts
const ORDER_TYPE = {
  LIMIT: 0,          // NormalOrder — fill what crosses, rest remainder
  FILL_OR_KILL: 1,
  MARKET: 2,         // ImmediateOrCancel
  POST_ONLY: 3,
} as const;
// also: SELF_MATCHING_OPTION = { CANCEL_TAKER: 0, CANCEL_MAKER: 1 }
```

### Binary trading
```ts
await trader.placeOrder({
  pool,                    // BinaryPool address
  side: "BUY_YES",         // BinarySide: BUY_YES | SELL_YES | BUY_NO | SELL_NO
  price: 620_000n,         // YES price, raw collateral units per whole token (0.62 × 10^6)
  quantity: 10_000_000n,   // outcome tokens, raw (10 × 10^6)
  orderType: ORDER_TYPE.LIMIT,   // optional
  expireTimestampNs,       // optional — DEFAULTS TO THE MARKET'S EXPIRY on binary (not 50y!)
  builder, builderFeeBpsTimes1k, // optional routing attribution
  autoApprove: true,       // default — approves escrow token if allowance short
});
// → { hash, receipt, orderId?, fills: OrderFill[] }
```
`OrderFill` = `{ takerOrderId, makerOrderId, quantityFilled, takerRemainingQuantity,
makerRemainingQuantity, fillPrice }` (all bigint) — `dist/trade.d.ts:43-59`.

| Method | Params → Result | Notes |
|---|---|---|
| `placeOrder` | `PlaceOrderParams` → `PlaceOrderResult` | binary YES/NO |
| `cancelOrder` | `{ pool, orderId, gas? }` → `TxResult` | spot + binary |
| `reduceOrder` | `{ pool, orderId, newQuantityRemaining }` | shrink in place, keeps queue priority; expired orders revert (`ExpiredOrderMustBeCancelled`) |
| `cancelOrders` | `{ pool, orderIds[] }` → `CancelOrdersResult` | batch, **best-effort** (skips dead ids; `outcomes[i].cancelled`) |
| `reduceOrders` | `{ pool, reductions[] }` | batch, **atomic** (first invalid entry reverts all) |
| `cancelExpiredOrders` | `{ pool, orderIds[] }` | permissionless keeper drain |
| `sweepExpiredAtLevel` | `{ pool, isBid, price, maxCount }` | permissionless level sweep |
| `approveBuilder` | `{ pool, builder, maxFeeBpsTimes1k }` | per-pool opt-in; 0 revokes |
| `mintSet` | `{ pool, amount, collateral?, autoApprove? }` | collateral → equal YES+NO |
| `burnSet` | `{ pool, amount, outcomeToken?, autoApprove? }` | complete set → collateral |
| `redeem` | `{ marketId: Hex, amount, outcomeIdx? (0=YES,1=NO), market?, operatorId?, venueId?, module?, autoApprove? }` | module-routed; keyed by **marketId** |
| `redeemMany` | `{ entries: [{ marketId, outcomeIdx, amount }], … }` | batch claim, all-or-nothing — pair with `client.getClaimable` |
| `signRedeemAuth` / `redeemFor` | EIP-712 gasless-redeem: owner signs, relayer submits, payout hard-pinned to owner |
| `redeemDirect` / `claimOwed` | low-level BinarySettlement paths (raw ERC-6909 outcomeId) |
| `mintSetNative` / `mintSetPermit2` / `redeemNative` | CollateralRouter paths (native wrap / Permit2 pull); need `addresses.collateralRouter` |
| `faucet` | `{ amount?, testUsdc? }` | mints TestUSDC; **default 10,000 × 10^decimals** (`dist/testnet.js:32`). Testnet only. |
| `resolve` / `voidMarket` | `{ market, outcomeIdx }` / `{ market }` | FakeOracle demo resolver only (needs `addresses.fakeOracle`) |
| `pokeOracle` / `voidExpired` / `finalizeMarket` / `syncSettlement` / `releasePool` | permissionless settlement keepers — poke FIRST (full payout), void is the 1/N fallback |
| `getSettlement(marketId)` | `SettlementRecord \| null` — payout vector, backing, fee (`dist/trade.d.ts:1244-1274`) |
| `clearApprovalCache(token?, spender?)` | forget cached approvals |

### Spot / perp / stops / vault / margin (present but secondary for a binary app)
`placeSpotOrder`, `placeSpotOrders` (batch, non-payable), `placePerpOrder`,
`amendOrder` / `amendOrders` (cancel+replace atomically; **SpotPool/PerpPool only — a
BinaryPool reverts `UseBinaryPlacement`**), `depositMargin`, `withdrawMargin`,
`setPerpLeverage`, `pokeFunding`, `placeSpotStopOrder`, `placePerpStopOrder` (with
OCO `pair` + `intent: "opening"`), `linkPerpStopOrders`, `cancelStopOrder`,
`cancelPerpStopOrder(s)`, `claimPerpStopSomi`, `withdrawVault`, `depositVault`,
`depositVaultNative(For)`, `setManualVaultMode`, `setOperatorApprovalForPool`,
`setOperatorApprovalGlobal`, and `build*` unsigned twins — all in `dist/trade.d.ts:1424-1981`.

---

## 7. Type definitions (the ones a front-end will live in)

### 7.1 `Market` union (`dist/markets.d.ts:8-313`)

```ts
type MarketType = "SPOT" | "PERP" | "BINARY";
type Market = SpotMarket | PerpMarket | BinaryMarket;   // discriminated on marketType
function isBinaryMarket(m: Market): m is BinaryMarket;  // + isSpotMarket, isPerpMarket

type BaseMarket = {
  id: string;                    // PK, lowercased: bytes32 marketId (binary) / pool address (spot, perp)
  marketType: MarketType;
  poolAddress: Address;          // TIME-VARYING for binary (recycled pools!) — see nonce
  lastPrice: string | null;      // raw; binary ≈ YES probability × 10^quoteDecimals
  lastTradeAt: string | null;    // unix seconds
  cumulativeBaseVolume: string;  // raw decimal string
  cumulativeQuoteVolume: string;
  tradeCount: string;
  baseDecimals: number;
  quoteDecimals: number;         // PER-VENUE: 6 (tUSDC testnet) vs 18 (USDso) — always format with this
  createdAtTimestamp: string;
};

type BinaryMarket = BaseMarket & {
  marketType: "BINARY";
  marketId: Hex;                 // == id
  marketAddress: Address;        // the BinaryMarket clone contract
  yesTokenId: string;            // ERC-6909 position ids (uint256 decimal strings)
  noTokenId: string;
  collateral: Address;
  asset: string;                 // e.g. "BTC"
  question: string;              // display text
  status: BinaryMarketStatus;    // event-derived — derive live state from tradingStart/expiry too
  oracleQuestion: string | null;
  oracleQuestionId?: string | null;
  strike: string;                // raw, oracle price scale
  tradingStart: string;          // unix seconds
  expiry: string;                // unix seconds
  winningOutcome: number | null; // 0 YES, 1 NO; null until Resolved / non-one-hot vector
  payoutNumerators?: string[] | null;   // Oracle v2 vector; denominator below
  payoutDenominator?: string | null;    // 10_000_000
  resolvedAtBlock / resolvedAtTimestamp: string | null;
  createdByTx: Hex | null;
  creator?: Address | null;
  voided: boolean;
  backing: string;               // live pool backing; reads 0 once finalized → use netBacking
  nonce?: string | null;         // pool's market nonce — (poolAddress, nonce) disambiguates
  finalized?: boolean | null;
  netBacking?: string | null;    // authoritative post-finalize backing
  context?: Hex | null;          // opaque creator metadata bytes
  intervalSec?: string | null;   // 900|3600|14400|86400 (indexer-derived from window)
  interval?: string | null;      // "15m"|"1h"|"4h"|"24h" (SDK-derived label, render-ready)
  operatorId?: number | null;
  venueId?: Hex | null;          // bytes32 hex
};

type BinaryMarketStatus =        // dist/store.d.ts:25
  "Listed" | "Trading" | "Locked" | "Settling" | "Resolved" | "Voided" | "Finalized";
// "Finalized" is INDEXER-DERIVED (backing swept to BinarySettlement) — no on-chain enum member.
```

`SpotMarket` adds `baseToken/quoteToken/baseSymbol/quoteSymbol/baseIsNative/tickSize/lotSize/minQuantity/markPrice/rawMidpoint/markPriceUpdatedAt/stopRegistry`.
`PerpMarket` adds those plus `marginBank/initialMarginBps/fundingRate/cumulativeFundingPerUnit/indexPrice/fundingWindowSec (28800)/fundingIntervalSec (300 testnet)/openInterest/…`.

### 7.2 `UnifiedMarket` (`dist/unified/structs.d.ts:9-64`)

```ts
interface UnifiedMarket {
  id: string;                 // native market id
  symbol: string;             // "SOMI/USDC" | "BTC-95000-31DEC26/USDC"
  type: "spot" | "swap" | "binary" | "categorical";
  base: string; quote: string; settle?: string;
  active: boolean;            // false once trading is impossible
  contract: boolean;          // true only for perps
  precision: { price: number; amount: number };  // decimal places from tick/lot grids
  limits: { amount: { min?: number } };
  outcomes?: { symbol: string; label: "YES"|"NO"; index: number }[];  // binary only
  info: Market;               // the raw native row
}
```

Other unified structs (same file): `UnifiedOrderBook` (`{ symbol, bids: [price,amount][], asks, timestamp?, info? }`),
`UnifiedTrade`, `UnifiedOrder` (`status: "open"|"closed"|"canceled"|"expired"`; **`info`
carries the native row / full `PlaceOrderResult` incl. receipt**), `UnifiedStopOrder`,
`UnifiedBalance(s)` (`{ free, used, total }`), `UnifiedOHLCV` (`[ms,o,h,l,c,vol]`),
`UnifiedTicker`, `UnifiedFundingRate`, `UnifiedPosition`, `UnifiedPrice`, `TIMEFRAMES`.

### 7.3 `MarketOnchain` (`dist/markets.d.ts:686-734`)

```ts
interface MarketOnchain {
  marketAddress: Address; outcomeToken: Address;   // ERC-6909 singleton
  yesId: bigint; noId: bigint;
  pool: Address; nonce: bigint;                    // (pool, nonce) = this market's slice
  collateral: Address;
  status: number;   // 0 Listed · 1 Trading · 2 Locked · 3 Settling · 4 Resolved · 5 Voided
  backing: bigint;  // falls back to settlement net backing post-finalize
  finalized: boolean; expiry: bigint; decimals: number;
  winningOutcome: number;  // meaningful only when isResolved
  isResolved: boolean; isVoided: boolean;
}
```

### 7.4 Portfolio & fills

`Portfolio = { account, positions: PortfolioPosition[], openOrders: PortfolioOrder[], trades: PortfolioTrade[] }`
(`dist/binary/portfolio.d.ts:160-169`); `PortfolioPosition = { market: PortfolioMarket, outcomeIndex, tokenId, balance }`;
`OutcomeBalances = { yes: string, no: string }`; `PortfolioOptions = { ordersLimit? (200), tradesLimit? (50), since? }`.
`FillRow` (`dist/fills.d.ts:42-109`): `{ id, market, pool, fillPrice, quantity, quoteQuantity,
maker, makerSide, taker, takerSide, kind, takerIsBid, takerOrder, timestamp, txHash }` —
binary-only fields null on spot/perp; prefer `takerOrder.side` over the denormalized `takerSide`.
Live-store rows `LiveFill` / `LiveOrder` / `LiveFundingUpdate` are in `dist/store.d.ts:72-216`.
`OpenOrder` / `OrderRow` / `BookTop` / `BinaryOrderBook` / `SpotOrderBook` /
`BinaryBookParams` / `OnchainOrder` / `SweepableOrder` are in `dist/orders.d.ts`.
`Candle` (raw decimal strings, `dist/candles.d.ts`).

### 7.5 Sides, ids, and units (`dist/store.d.ts`, `dist/ids.d.ts`, `dist/units.d.ts`)

```ts
type BinarySide = "BUY_YES" | "SELL_YES" | "BUY_NO" | "SELL_NO";
type BinaryFillKind = "DIRECT_YES" | "DIRECT_NO" | "MINT_A_PAIR" | "BURN_A_PAIR";
type OrderStatus = "Open" | "Closed" | "Filled" | "Cancelled" | "Expired";
const DECIMALS = 6;                     // fallback only — use per-market quoteDecimals
const ORDER_KIND_SIDE: BinarySide[];    // on-chain OrderKind → side
function sideOfKind(kind): BinarySide;  // the ONLY authoritative side source (v2)
function fillKind(takerSide, makerSide): BinaryFillKind;

// ERC-6909 outcome-id scheme: id = (pool << 72) | (nonce << 8) | idx
function outcomeId(...); function decodeOutcomeId(id); function marketKey(id); // id >> 8

// units
function toHuman(raw, decimals?): number;        function toHumanString(raw, decimals?): string;
function fromHuman(human, decimals?): bigint;
function priceToProbability(rawPrice, decimals?): number;   // YES price ↔ 0–1 prob
function probabilityToPrice(probability, decimals?): bigint;
function upProbability(rawYes, decimals): number | null;    function upPercent(...): number | null;
function balanceFloor(raw, decimals?): number;   // sell-safe display floor
// unified-tier grid math: toRaw, snapToGrid (direction/clamp/strict), toHumanNum,
// precisionFromStep — dist/unified/structs.d.ts:355-445
// quotes kernels: estimateMarketOrder, fillsWithinSlippage, bookMidPrice — dist/unified/quotes.d.ts
```

---

## 8. React hooks — `@somnia-chain/markets-sdk/react`

Source: `dist/react.d.ts`, `dist/hooks.d.ts`. Provide the **client** (not the exchange)
once; the pool-keyed data hooks **watch automatically while mounted** (ref-counted, so
ten components on one pool share one subscription).

```tsx
import { SomniaMarketsProvider, useLiveBinaryOrderBookByMarket, useWatchMarket,
         useIndexerQuery, usePortfolio } from "@somnia-chain/markets-sdk/react";

<SomniaMarketsProvider client={exchange.client}>
  <App />
</SomniaMarketsProvider>

function MarketPage({ market }: { market: BinaryMarket }) {
  const status = useWatchMarket(market.poolAddress);        // "unwatched"|"hydrating"|"live"
  const book   = useLiveBinaryOrderBookByMarket(market.id); // recycle-safe, zero RTT
  const fills  = useLiveFills(market.poolAddress, 20);
  const { data: candles } = useCandles(market.poolAddress, 3600, { limit: 24 });
  // …
}
```

| Hook | Signature | Watches? |
|---|---|---|
| `SomniaMarketsProvider` | `{ client, children }` | — |
| `useSomniaMarketsClient()` | → `SomniaMarketsClient` (throws without provider) | — |
| `useWatchMarket(pool?)` | → `WatchStatus` | yes |
| `useWatchUser(user?)` | → `void` (hydrates history) | yes |
| `useLiveStatus()` / `useIsTailing()` | `TailStatus` / `boolean` | — |
| `useLiveFills(pool?, limit?)` | `LiveFill[]` | yes |
| `useLiveUserFills(pool \| null, user?, limit?)` | `LiveFill[]` | yes (when pool given) |
| `useLiveUserOrders(pool?, user?, limit?)` | `LiveOrder[]` | yes |
| `useLiveMarketByPool(pool?)` | `LiveMarket \| null` | yes |
| `useLiveMarketByAddress(addr?)` | `BinaryMarket \| null` | **no** (reads what others hydrated) |
| `useLiveBinaryOrderBook(pool?, depth?)` | `BinaryOrderBook` | yes |
| `useLiveBinaryOrderBookByMarket(marketId?, depth?)` | `BinaryOrderBook` (empty once stale) | yes |
| `useLiveSpotOrderBook(pool?, depth?)` | `SpotOrderBook` | yes |
| `useLiveMarkets()` | `LiveMarket[]` (store view) | no |
| `useLiveFundingUpdates(pool?, limit?)` | `LiveFundingUpdate[]` oldest-first | yes |
| `useWatchPrice(asset?)` | `PriceFeedStatus` | yes (price feed) |
| `useLivePrice(asset?)` | `LivePrice \| null` | yes |
| `useLivePriceFeedInfo(asset?)` | `PriceFeedInfo \| null` (doesn't re-render as price ages) | yes |
| `useLivePriceTicks(asset?, limit?)` | `PricePoint[]` | yes |
| `useIndexerQuery(fn, deps)` | `IndexerQueryState<T> = { data, loading, error, refetch }` — generic async read with abort of superseded requests | no |
| `usePortfolio(account?, opts?)` | `IndexerQueryState<Portfolio>` | no |
| `useMarkets(opts?)` | `IndexerQueryState<Market[]>` | no |
| `useCandles(pool?, intervalSeconds, opts?)` | `IndexerQueryState<Candle[]>` | no |
| `useFundingRateSeries(pool?, intervalSeconds, { from, to, limit? })` | funding chart read (poll + live nudge; **from/to must be render-stable**) | partial |
| `useMarketFees(marketId?)` | `IndexerQueryState<MarketFees \| null>` | no |
| `useOperators` / `useMarketCreators` / `useOracleAdapters` | directory reads | no |
| `useLendReserves()` / `useLendAccount(account?)` | SomniaLend reads | no |

### TanStack Query / SWR integration (README lines 200–238)

Do **not** wrap `useLive*` hooks in a query cache (they read a push-fed store). Async
reads go into your query library with `exchange.client.*` as `queryFn` and the exported
**key factories** as `queryKey` — from the root entry (`dist/queryKeys.d.ts`):
`QUERY_KEY_SCOPE = "somnia-markets"`, `marketsKey`, `portfolioKey`, `candlesKey`,
`marketFeesKey`, `operatorsKey`, `marketCreatorsKey`, `oracleAdaptersKey`,
`syncStatusKey`, `maxVenueFeeBpsKey`, `marketOnchainKey`.

```tsx
const { data } = useQuery({
  queryKey: candlesKey(pool, 60, { limit: 500 }),
  queryFn: () => client.getCandles(pool, 60, { limit: 500 }),
  refetchInterval: 15_000,
});
// invalidate after a write:
queryClient.invalidateQueries({ queryKey: portfolioKey(account) });
```

---

## 9. Exported ABIs (root entry — `src/index.ts:148-166`)

| Export | From | Use |
|---|---|---|
| `erc6909Abi`, `binarySettlementAbi` | `dist/readsAbi.d.ts` | outcome-token balances (`balanceOf(owner,id)`), `setOperator`, settlement views |
| `binaryModuleReadAbi`, `binaryModuleWriteAbi` | `dist/moduleAbi.d.ts` | BinaryMarketsModule (finalizeMarket/releasePool/free-pool views) |
| `oracleHubAbi`, `oracleHubEventsAbi` | `dist/machineryAbi.d.ts` | OracleHub keepers/verifiers |
| `binaryPoolWriteAbi`, `spotPoolWriteAbi`, `perpPoolWriteAbi` | `dist/tradeAbi.d.ts` | hand-encoding placements |
| `orderBookEventsAbi` | `dist/eventsAbi.d.ts` | OrderPlaced/Rested/Cancelled/Expired/Reduced/Filled — decode receipts with the SAME signatures the SDK/indexer use |
| `ORDER_KIND` (Record<BinarySide, number>), `UnsignedOrder`, `UnsignedCall` | `dist/writer.d.ts` | |
| `lendPoolAbi`, `lendUiPoolDataProviderAbi`, `lendGatewayAbi`, `lendDebtTokenAbi` | `dist/lend/lendAbi.d.ts` | SomniaLend |

---

## 10. Gotchas & version notes

Verified in this package (0.28.1):

1. **Pools are recycled → key everything by `marketId`.** `poolAddress` is a
   time-varying 1:1 binding (one pool serves successive markets, never concurrently);
   `(poolAddress, nonce)` disambiguates and encodes the ERC-6909 outcome ids
   (`dist/markets.d.ts:251-261`). Use `getLiveBinaryOrderBookByMarket` /
   `useLiveBinaryOrderBookByMarket` so a stale page renders an empty book, not the
   successor market's liquidity (`dist/somniaMarketsClient.d.ts:251-266`).
2. **`loadMarkets()` hides finalized markets.** The unified registry sweep excludes
   finalized binary series (they accumulate without bound); resolve dead markets by
   id/pool via the raw tier (`dist/markets.d.ts:456-465`). Also: binary tick/lot grids
   are read from the pool **once at load** — call `loadMarkets(true)` after a pool is
   recycled mid-session (`dist/unified/exchange.d.ts:216-236`).
3. **Testnet collateral is 6-dec tUSDC; mainnet is 18-dec.** Never hard-code 6 —
   format with the row's `quoteDecimals` (`dist/markets.d.ts:30-36`,
   `dist/binary/portfolio.d.ts:50-55`; addresses in `dist/addresses.js`).
4. **`faucet()` mints 10,000 × 10^decimals by default** (`dist/testnet.js:32`);
   `FaucetParams.amount` can override. (The on-chain per-call cap itself is not
   visible from the SDK — treat 10k tUSDC as the working amount.)
5. **Receipt lives on `order.info`.** Unified writes return human structs; the native
   `PlaceOrderResult` (receipt, orderId, fills) is under `.info`
   (`dist/unified/structs.d.ts:138-139`, exchange `createOrder` docs).
6. **Tick/lot snapping is automatic in `createOrder`** (buy price down, sell price up,
   quantity down — never against you), so what was placed can differ from what you
   asked by one tick/lot: read `price`/`amount` back from the returned order. Note
   `priceToPrecision` always rounds **down** regardless of side, so for sells the two
   paths can differ by one tick (`dist/unified/exchange.d.ts:580-599`).
7. **Reverts throw `ContractRevertError` with `errorName`** on every path — send-time,
   simulation, and mined-but-reverted receipts (the SDK replays the call to recover
   the reason). Branch on `errorName`, never message text; keep a fallback arm since
   `errorName` can be `undefined` (`dist/errors.d.ts:152-208`). *(The team's note that
   this became throw-on-revert in 0.23 is consistent with, but not datable from, the
   package.)*
8. **Binary order expiry defaults to the MARKET's expiry, not 50 years** —
   `0 < expireNs <= pool.marketExpiryNs` is enforced (`OrderExpiryBeyondMarket`); a
   past value reverts `OrderAlreadyExpired`. Spot/perp default is ~50y GTC
   (`dist/trade.d.ts:120-132, 281-295`).
9. **Expired spot orders don't auto-refund escrow** — anyone can reclaim via
   `cancelExpiredOrders` / `sweepExpiredAtLevel`; find them with
   `client.listSweepableOrders` (`dist/trade.d.ts:288-295`, `dist/orders.d.ts:391-431`).
10. **Indexer reads throw on failure; empty always means "no rows"** — never treat
    `IndexerError` as not-found (`dist/errors.d.ts:96-128`). Server-side `count*`
    methods need the privileged Hasura `_aggregate` role via `indexerHeaders` —
    **server-only, never in a browser client** (`dist/config.d.ts:193-200`).
11. **`fetchOpenOrders` limit is per venue** (up to 3× rows unscoped), and on spot the
    same variable caps `pendingStopOrders` in the underlying portfolio read
    (`dist/unified/exchange.d.ts:345-372`).
12. **Indexed `status` on a BinaryMarket is event-derived** — the timestamp-implicit
    Listed→Trading→Settling transitions emit no events, so derive the live trading
    state from `tradingStart`/`expiry` between events (`dist/markets.d.ts:188-194`).
    `"Finalized"` is indexer-derived and supersedes Resolved/Voided.
13. **YES/NO side attribution comes from `BinaryOrderPlaced.kind`** via
    `sideOfKind` — `userData` is opaque MM bookkeeping since v2; the old
    `kindOf(isBid, userData)` is gone (0.13.0 breaking, `src/index.ts:426-428`).
14. **`getMarketOnchain` takes the bytes32 `marketId`**, not the BinaryMarket address
    (0.13.0 breaking; a 20-byte address is rejected loudly) (`dist/markets.d.ts:747-756`).
15. **No HTTP RPC fallback** — the WebSocket is the only chain transport; watches heal
    themselves via reconnect + backfill, but a permanently broken WS URL breaks all
    chain reads/writes (`dist/config.d.ts:222-232`).
16. **Wallet-client writes go through the wallet UI** (one confirmation per tx,
    including auto-approve legs); local-key writes are one round-trip via
    `realtime_sendRawTransaction` with automatic fallback when the node lacks it
    (`dist/txSend.d.ts`). Batch verbs (`placeSpotOrders`, amend) are non-payable —
    native-base sells there fund from a pre-deposited vault balance.
17. **Call `exchange.close()`** when done to release watches; two exchange instances
    never share sockets or state (`dist/unified/exchange.d.ts:70-74`).
18. **Prices in raw YES terms everywhere in the raw tier** — `lastPrice`, book levels,
    candles, fills are raw collateral units per whole outcome token (≈ probability ×
    10^quoteDecimals); NO sides are derived as `1 − yesPrice`. Convert with
    `priceToProbability` / `probabilityToPrice`.
19. Items from the team's prior version notes **not independently verifiable** from
    this tarball (no changelog ships): "0.23 revert-throw", "0.24 lot sizing",
    "0.28 tick snapping". The behaviors themselves (throwing reverts, lot alignment,
    tick snapping) are all present and documented above as they exist in 0.28.1 —
    which is what matters for new code. GitHub Packages hosted ≤0.19.0; 0.20.0+ is
    public npm (README lines 23–25).

---

## Files read (all under `reference/markets-sdk/package/`)

`README.md`, `package.json`, `src/index.ts`, `src/react.ts`, `src/testnet.ts`,
`dist/config.d.ts`, `dist/config.js`, `dist/addresses.d.ts`, `dist/addresses.js`,
`dist/unified/exchange.d.ts`, `dist/unified/structs.d.ts`, `dist/unified/symbols.d.ts`,
`dist/somniaMarketsClient.d.ts` (full), `dist/trade.d.ts` (full), `dist/markets.d.ts`,
`dist/orders.d.ts`, `dist/store.d.ts`, `dist/hooks.d.ts`, `dist/react.d.ts` (via src),
`dist/liveTail.d.ts`, `dist/binary/portfolio.d.ts`, `dist/fills.d.ts`,
`dist/candles.d.ts`, `dist/errors.d.ts`, `dist/units.d.ts` (declarations),
`dist/queryKeys.d.ts` (declarations), `dist/testnet.d.ts`, `dist/testnet.js`,
`dist/txSend.d.ts`, `dist/writer.d.ts` (key shapes), `dist/derivedReads.d.ts` (key
shapes), `dist/priceFeed/types.d.ts` (key shapes), `dist/chains/index.d.ts`,
`dist/chains/definitions/*.js`, `dist/lend/client.js` (constants).
