# DreamDEX Platform — Spot CLOB, Contracts, HTTP API, WebSocket, Builder Fees, Bot Kit

> Scope: everything in the DreamDEX docs **except** Event Contracts (covered in `01-dreamdex-event-contracts.md`).
> Sources are the local docs mirror `reference/dreamdex-docs/` (live at https://docs.dreamdex.io, append `.md` to any page URL for markdown) and the bot kit `reference/dreamdex-bot-kit/`.
> Somnia network facts, faucets, the official app review, Bot Builder, oracle explorer, and hackathon extras are in `05-somnia-network-and-ecosystem.md`.

## 1. What DreamDEX is (positioning)

Source: `reference/dreamdex-docs/welcome/readme.md`, `welcome/why-dreamdex.md`, `trading/trading.md`.

- **Fully on-chain spot CLOB on Somnia** ("the Agentic L1"). The order book lives at smart-contract level; matching, settlement, and position updates are atomic on-chain. No centralized matching engine, no private sequencer.
- **Zero fees**: 0% maker / 0% taker on every pair. Funded by yield on resting capital (USDso backing yield ~3.3% is paid to active market makers, not kept by the protocol).
- **Gas sponsorship on SOMI and stablecoin pairs** (SOMI↔USDso, USDC.e↔USDso in the app); elsewhere users pay gas in native SOMI.
- **USDso-native settlement**: every pair quotes against USDso, a Frax-backed stablecoin (1:1 FraxUSD via LayerZero, redeemable for USDC).
- **Agents-first**: native MCP server, `AGENTS.md`/`SKILL.md`, CCXT bindings, REST + WebSocket, and Somnia **reactivity** (contracts/strategies react to book events in the same block, no polling).
- **Explicit invitation to build on top**: "Third-party apps are welcome to build on top of our book and keep the spread for themselves." A builder-codes/fee-rebate program exists (see §10).
- Copyright: DreamDEX S.A. (Panama). Landing page (https://www.dreamdex.io) shows live stats: ~$59.5M 30-day volume, 12.9K traders, 3.2M orders filled, $1.2M TVL, 4 CLOB markets (fetched 2026-08-31).

**Roadmap** (`welcome/roadmap.md`): now = v1.0 spot foundations → next = **builder-codes / fee-rebate program** (apps that route flow get paid) → perpetuals (six-stage liquidation waterfall, published rulesets) → yield-bearing trader collateral (lend idle margin via dreamDEX lending, instant recall) → sub-10ms matching engine (targeted Q4 2026) → MEV-resistant fair ordering → transaction-level privacy. Note: the HTTP API trading page already documents perp hooks (`fundingSource: "marginBank"`, `POST /v0/account/margin/deposit`) — perps are being wired in (`developers/http-api/trading.md`).

## 2. Environments and base URLs

Source: `reference/dreamdex-docs/developers/http-api.md`, `developers/developers.md`.

| Environment | Chain ID | REST base | WS public feed | Primary RPC |
|---|---|---|---|---|
| Mainnet (Somnia) | `5031` | `https://api.dreamdex.io/v0` | `wss://api.dreamdex.io/v0/ws/public` | `https://api.infra.mainnet.somnia.network/` |
| Testnet (Somnia Shannon) | `50312` | `https://stg.api.dreamdex.io/v0` | `wss://stg.api.dreamdex.io/v0/ws/public` | `https://api.infra.testnet.somnia.network/` |

- The `/v0` path segment is **part of the base URL**; omitting it 404s.
- The HTTP API only *prepares* unsigned transactions — you sign and broadcast to a Somnia RPC yourself. Keep backup RPCs configured (PublicNode `https://somnia.publicnode.com`, Ankr, Stakely, Validation Cloud) and fail over on error (`developers/developers.md`).

## 3. Spot markets and contract specifications

Source: `reference/dreamdex-docs/developers/contracts/contract-specifications.md`, `developers/http-api/market-data.md`.

All spot pairs quote against **USDso**. Symbols are `BASE:QUOTE` with exact casing (`SOMI:USDso`, not `SOM:USD`).

**Mainnet (5031) SpotPools:**

| Pair | SpotPool | tickSize | lotSize | minQuantity |
|---|---|---|---|---|
| SOMI:USDso (native) | `0x035De7403eac6872787779CCA7CCF1b4CDb61379` | 0.0001 | 0.01 | 1 |
| USDC.e:USDso | `0x47fD2f18426f67106DBaC82F6d21D446c5F2120b` | 0.0001 | 0.01 | 1 |
| WBTC:USDso | `0x25bfF6B7B5E2243424F38E75de7ab03C0522a5EA` | 0.1 | 0.00001 | 0.0001 |
| WETH:USDso | `0xa936da11B57b50A344e1293AAaE5232885ea2bDE` | 0.01 | 0.0001 | 0.001 |

**Testnet (Shannon, 50312) SpotPools:** SOMI:USDso `0x259fD6559214dd5aD3752322426eA9F9fABEFff4`, WBTC:USDso `0x3605f28aA7C50e7441211e77Cb0762d49539326C`, WETH:USDso `0xD180195da5459C7a0DEA188ed61216ec43682b50` (no USDC.e on testnet).

- Parameters are admin-tunable snapshots — always read live values from `GET /v0/markets` or on-chain `getPoolParams()`.
- On-chain params are **raw integer units** (`value × 10^decimals`). Orders with price not a multiple of `tickSize`, quantity not a multiple of `lotSize`, or below `minQuantity` **revert** (`InvalidPrice` / `InvalidQuantity` / `QuantityBelowMinimum`). `minQuantity` is the #1 cause of a rejected first order (`trading/common/order-types.md`).
- **Native SOMI** is tracked under the sentinel `NATIVE_TOKEN = 0x28f34DeFd2b4CB48d9eE6d89f2Be4Bc601694c00` (not `address(0)`, which silently returns 0 balances). Native-base **buys** need tx gas limit **≥ 5,000,000** or they revert with `InsufficientGasForPayout` — simulate with the same gas limit you broadcast (`developers/contracts/contract-specifications.md`, `functions.md`).
- **Testnet funds** (`developers/quick-start.md`): STT gas from https://testnet.somnia.network/ or the Google Cloud faucet; test tokens (SOMI, WBTC, WETH; all 18 decimals) from faucet contract `0x89Ebc05dE83aB9752B95030218BB10A542b96B7C` via `requestTokens(address[],uint256[])`; USDso by selling a token on a live testnet market or via Simple Swap's `/simple/debug` in-app faucet.

## 4. Matching, order types, and rejection semantics

Source: `reference/dreamdex-docs/trading/readme-1/spot.md`, `trading/common/order-types.md`.

- **Price-time priority (PTP)**: best price first, then earliest at that price. Matching+settlement are atomic inside the placement tx.
- **Order lifecycle events**: `OrderPlaced` (accepted) → `OrderRested` (residual entered book) → `OrderFilled` (per fill leg) → `OrderCancelled`/`OrderExpired`/`OrderReduced`/`OrderAmended`. Check receipt logs — `status: 1` proves acceptance, not a fill.
- **Order types** (contract enum `OrderType`): `0` NormalOrder (GTC), `1` FillOrKill, `2` ImmediateOrCancel, `3` PostOnly. "Market orders" are IOC with an aggressive limit price — a price of `0` never crosses and fills nothing.
- **Self-trade prevention** (`SelfMatchingOption`): `0` CancelTaker (default), `1` CancelMaker. Self-trading is never permitted.
- **Rejection = revert** (post "order-rejection upgrade"): IOC-no-fill (`ImmediateOrCancelNoFill`), FOK-unfillable (`FillOrKillNotFillable`), PostOnly-would-cross (`PostOnlyWouldCross`), self-match cancel-taker (`SelfMatchCancelTaker`), already-expired (`OrderAlreadyExpired`) all **revert the transaction** with custom errors (use `catch (bytes)`, not `catch Error(string)`). Old integrations that treated "status 1 + no logs" as rejection must branch on the revert instead. The batch surface (`placeOrders`) instead returns per-order `bool[]` + an `OrderRejected` event, so one dead rung doesn't kill a ladder (`developers/contracts/functions.md`).
- `expireTimestampNs` is **nanoseconds** since epoch and must be strictly future — no "no expiry" sentinel.

## 5. Funding model: auto-pull / auto-deliver vs manual vault

Source: `reference/dreamdex-docs/developers/contracts/functions.md` (Auto-pull and auto-deliver), `developers/http-api/vault.md`.

- **Default (wallet funding / auto-pull)**: `placeOrder` pulls the worst case `principal + max(makerFee, takerFee) + builderFee` straight from your wallet (ERC-20 `transferFrom` after a one-time approval, or `msg.value` on native pools) and auto-delivers proceeds/refunds back to the wallet. No deposit step. Supports **all** order types including resting GTC/PostOnly. Read exact wallet spend with `getAutoPullRequirement()`. If delivery fails, funds fall back to a vault credit (`PayoutFallbackToVault` event).
- **Manual vault mode (opt-in per pool)**: `setManualVaultMode(true)`, then `deposit(token, amount)` / `depositNative()`, trade against the vault, `withdraw()` yourself. Used by MMs/HFT. Each order captures its delivery mode at placement.
- One entrypoint for everything: `placeOrder` (funding decided by the flag, not the function). The old `placeTakerOrderWithoutVault` **no longer exists**.
- HTTP equivalent: `fundingSource: "wallet"` (default) or `"vault"` on the prepare-order request.

## 6. On-chain contract surface (summary)

Source: `reference/dreamdex-docs/developers/contracts/functions.md`, `types.md`, `events.md`, `errors.md`.

**SpotPool / OrderBook — order management:**
- `placeOrder(isBid, userData, price, quantity, expireTimestampNs, orderType, selfMatchingOption, builder, builderFeeBpsTimes1k) payable → (bool success, uint128 orderId)` — `success` is now always `true` (rejections revert).
- `cancelOrder(orderId)` (reverts `OrderIdMismatch` if terminal, `IncorrectSender` if not owner), `reduceOrder(orderId, newQtyRemaining)` (keeps queue priority; expired orders must be cancelled instead).
- **Batch**: `placeOrders(PlaceOrderRequest[]) → (bool[] successes, OrderId[] ids)` (best-effort per order; hard validation errors revert whole batch; **non-payable** so no native msg.value auto-pull), `cancelOrders(OrderId[]) → bool[]` (best-effort skip-stale), `reduceOrders(...)` (atomic all-or-nothing).
- **Amend**: `amendOrder(AmendOrderRequest) → newOrderId` — atomic cancel+replace, returns a **new** id, re-enters the **back** of the price-time queue; `alwaysPlace` opts into upsert if old order is already gone (`AmendOldOrderGone` otherwise); no-gap guarantee (`AmendReplacementFailed` reverts the whole thing). `amendOrders` re-ladders atomically. Amend is non-payable (native replacements need manual vault funding).
- **Operator variants**: `placeOrderFor` / `cancelOrderFor` / `reduceOrderFor` + batch/amend `...For` variants — see §8.
- **Permissionless cleanup**: `cancelExpiredOrders(OrderId[])`, `sweepExpiredAtLevel(isBid, price, maxCount)`.

**Vault**: `deposit`, `depositNative`, `withdraw`, `getWithdrawableBalance(owner, token)` (use `NATIVE_TOKEN` sentinel for SOMI), `getOwnLockedBalance()`, `getLockedTokenBreakdown()` (pool-wide solvency reconciliation, eth_call only in practice), `setManualVaultMode(bool)` / `getManualVaultMode(user)`, `getAutoPullRequirement(owner, isBid, price, quantity, builderFeeBpsTimes1k)`.

**Market data views**: `getOrder(orderId)`, `getOwnOpenOrders()` (caller-scoped!), `getBookLevels(isBid, numLevels)`, `getPoolParams() → (base, quote, makerFeeBpsTimes1k, takerFeeBpsTimes1k, tickSize, minQuantity, lotSize)` (note: maker precedes taker here, reversed vs the `SpotPoolParameters` struct), `getOrderBookParameters()`, `getAllOpenOrdersOffChain(isBid, maxCount, cursor)` (eth_call only, `msg.sender` must be zero), `convertToQuoteAtPriceCeil()`.

**Mark price (EMA)**: pool emits `MarkPriceUpdated` with an **EMA-smoothed midpoint** (the stop-trigger feed) plus the raw `(bestBid+bestAsk)/2` (UI/indexer use only — never a trigger feed). `getMidpointEmaParameters()` / `getMidpointEmaState()`. Current mainnet values on all four pools: `updateIntervalSec = 1`, `emaSmoothingAlpha = 0.2` (2e17, 1e18-scaled) — at most one step/second, each step moving 20% toward the raw mid.

**Quantizing** (`functions.md#getpoolparams`): do integer math only; snap bid prices down / ask prices up to tick, floor quantity to lot, enforce minQuantity; use `parseUnits`-style string scaling, never floats.

**Key events** (`events.md`): order lifecycle (above) plus `OrderRejected` (batch-path rejections, indexed reason enum), `OrderCancelledSelfMatch`, `PayoutFallbackToVault`, `MarkPriceUpdated`, `BuilderApproved` / `BuilderFeeCharged` / `MaxBuilderFeeUpdated`, `ManualVaultModeUpdated`, `NativeDeposit`/`NativeWithdraw`, and stop-order events (§7).

**Error decoding** (`errors.md`): revert data = `selector || abi.encode(args)`; decode with `cast decode-error` / `cast 4byte`. Most common preflight selectors: `0xf5e39c1f IncorrectSender` (eth_call without `from`, or unauthorized operator) and `0xcf479181 InsufficientBalance` (free vault balance doesn't cover principal+fees). Empty `0x` revert = out-of-gas, not a book decision.

## 7. Stop orders (SpotStopOrderRegistry)

Source: `reference/dreamdex-docs/trading/readme-1/stop-orders.md`, `developers/contracts/contract-specifications.md`.

- Conditional stop-loss / take-profit / breakout orders per spot market. Pending orders sit in the registry; when the pool's **EMA-smoothed mark price** crosses the trigger, **Somnia on-chain reactivity** fires them as **IOC** orders (never resting; unfilled remainder discarded; one-shot).
- `createPendingOrder(PendingOrderWithTrigger) payable` — requires `msg.value` to equal `somiPaymentPerOrder()` **exactly** (default 0.1 SOMI; refunded on cancel, consumed on trigger; over/underpayment reverts `InsufficientSomiPayment`). LIMIT type needs a tick-aligned `limitPrice` (≤ trigger for stop-sells, ≥ trigger for stop-buys); MARKET type requires `limitPrice = 0` and applies the registry's `slippageToleranceBps` (default 500 = 5%) to the mark at trigger time. Trigger operators: `0` GTE, `1` LTE.
- **No token escrow** — a point-in-time balance check at creation; if collateral is gone at trigger the placement fails gracefully (`PendingOrderTriggered(success=false)`) and the order is removed. `cancelPendingOrder` refunds SOMI (falls back to `claimSomi()` balance if transfer fails). Registry dormancy: `NoActiveSubscription` reverts creation; `cancelInertOrders` recovers funds if the reactivity subscription is removed.
- Defaults per registry (admin-tunable, read live): `slippageToleranceBps=500`, `somiPaymentPerOrder=0.1 SOMI`, `minStopDistanceBps=0`, `gasBufferBps=5000`.
- **Registry addresses** — mainnet: SOMI `0x68c8f6fb1EA19A28F25358Ff00b8Ed8E1216df30`, USDC.e `0xD53E3F3b73513F2147377ef8f573f649cF60100c`, WBTC `0xed32F048D6a47923D38eCeD868d6f8b0eB4852bd`, WETH `0x9653a7355849B7691802A6AA49fDe18eF5ba633d`. Testnet: SOMI `0xEb97349Aa62A68507c0bE535eD88B0d028a47E1e`, WBTC `0x53d5B2b0791b3992a1F3b5e0b0277Ee2e08B7aaD`, WETH `0xf822D4Cb94902d667c9650e702aA5f096cc7598F`.
- This is the platform's flagship demo of **Somnia reactivity as product infrastructure** — the same primitive available to hackathon dApps (see `05-somnia-network-and-ecosystem.md` §3).

## 8. Operators & session keys (OperatorPermissionsRegistry)

Source: `reference/dreamdex-docs/trading/readme-1/operators.md`, `developers/contracts/spot-router.md`, `reference/dreamdex-bot-kit/docs/session-keys.md`.

The split-key model: approve another key/contract to trade **on your behalf without custody**. Fills, cancels, refunds always settle to the **owner**, never the operator; deposits/withdrawals/approvals stay owner-scoped. Revocation is immediate.

**Per-selector grants** (each independent):

| Capability | Function | Selector |
|---|---|---|
| Place | `placeOrderFor` | `0x80054449` |
| Cancel | `cancelOrderFor` | `0xe37b444b` |
| Reduce | `reduceOrderFor` | `0x364c2587` |

- Batch variants reuse the same grants (no separate batch selector). `amendOrderFor`/`amendOrdersFor` require **both** cancel + place grants.
- `placeOrderFor` additionally admits protocol system contracts via an owner-managed allowlist; cancel/reduce are per-user approval **only**.

**Registry addresses:**

| Contract | Mainnet (5031) | Testnet (50312) |
|---|---|---|
| `OperatorPermissionsRegistry` | `0xE7a190736B6024a4DbafadC04E283075877005ce` | `0x15C7e8CE38F021c5b45d098AaD788f63090bF20A` |
| `SpotPoolRegistry` | `0xB601bc1099B040E4882089D94690F7C38AF4CCD2` | `0x07A29A0A086Bc8262a9320db93E603eE13D57962` |

**Grant scopes**: `setOperatorApprovalGlobal(operator, bytes4[] selectors, bool)` covers **every pool in the SpotPoolRegistry including future ones**; `setOperatorApprovalForPool(pool, ...)` scopes to one pool; `setOperatorDenialForPool(...)` is a kill switch that trumps both. Resolution rule: `isApproved = NOT perPoolDenied AND (perPoolApproved OR (globalApproved AND poolRegistered))`. Verify with `pool.isOperatorAuthorized(owner, operator, selector)` or `registry.isGloballyApproved(...)`.

**Custody patterns**: (a) auto-pull mode — operator's `placeOrderFor` pulls from the *owner's wallet* (owner sets the ERC-20 allowance) and delivers back to it; (b) cold-fund/hot-operator — owner enables manual vault mode and pre-funds the vault, operator trades against it, only the owner can withdraw. The bot kit ships `scripts/operator-setup.ts` and every strategy switches to operator mode just by setting `OWNER_ADDRESS` + operator `PRIVATE_KEY` (`dreamdex-bot-kit/docs/session-keys.md`; verified live on mainnet per that doc). Caveat: `getOwnOpenOrders()` is caller-scoped, so an operator sees none of the owner's orders — track your own order ids.

This is directly relevant to our hackathon UX: a web app can be granted place/cancel as an **operator/session key** so users don't sign every order, without ever being able to withdraw. The SpotRouter itself is just an operator (below).

## 9. Simple Swap & SpotRouter (multi-hop swaps)

Source: `reference/dreamdex-docs/trading/readme-1/simple-swap.md`, `developers/contracts/spot-router.md`.

- **Simple Swap** is the consumer one-click Uniswap-style card in the app, live on mainnet and testnet. Uses a Privy smart wallet; first swap requires a one-time **Approve Router** UserOp (global operator grant), then single-confirmation swaps. Slippage presets (default 0.5%), deadline presets (default 30m). Routing is deterministic: `X↔USDso` direct, `X↔Y` as `X→USDso→Y` (only USDso-paired pools exist). Limit tab is "coming soon" — the router is taker-only.
- **SpotRouter** contract — recommended on-chain entry for aggregators/3rd-party swap UIs. Pure orchestrator: each leg calls `pool.placeOrderFor(...)`; pools auto-pull from and auto-deliver to the *caller's wallet*; the router never custodies funds. Addresses: mainnet `0x780672aDA90Ed7cf2C3E8B70DBa87A19d584c8B0`, testnet `0x0aA7c584074d2EA5B623772F97928baD23915ba8` (plus the two registries in §8).
- **Caller prerequisites**: (1) one-time global operator approval of the router for `placeOrderFor`; (2) per-pool ERC-20 allowance for each leg's input token; (3) native input: `msg.value` must equal the input **exactly**.
- **Functions**: `swapExactIn(SwapExactInParams)` (IOC-style legs; `minOutputAmount` guard), `swapExactOut` (FOK legs; `maxInputAmount` guard), quotes `quoteMarketExactIn` (use this for "what would I get now?" UIs — natural book walk, max 64 levels/leg), `quoteExactIn` (priceLimit-pinned), `quoteExactOut`, `quoteExactOutRequiredInput` (returns the exact `maxInputAmount` — for native exact-out it's the *only* value that works), `maxLegs()` (default 8). Every entrypoint has a `…WithBuilder` twin (§10).
- **Quote → swap recipe**: quote with zeroed legs → take `legs[i].worstFillPrice`, inflate by slippage, tick-align away from user → set `minOutputAmount = quoted × (1 − slippageBps/1e4)` → submit. Native sentinel `0x28f34DeFd2b4CB48d9eE6d89f2Be4Bc601694c00`; native only as leg-0 input or final output.
- **Errors**: fine-grained (`RouterNotApprovedAsOperator`, `LegPlacementRejected(legIndex, reason)` with the pool's raw revert inside, `InsufficientOutput`, `DeadlineExpired`, …) with a recommended UX copy table in the doc. `LegPlacementRevertedWithoutReason` = child-frame OOG, raise gas, don't call it "no liquidity".
- Events: `SwapExecuted(caller, inputToken, outputToken, amountIn, amountOut)`; builder-attributed swaps also emit `SwapAttributed(caller, builder, rate)` (fee amount is in the leg-0 pool's `BuilderFeeCharged`).
- A self-contained agent skill exists: `dex-spot-router-interaction` in https://github.com/somnia-chain/somnia-skills.

## 10. Builder fees / builder codes (how an app earns from routed flow)

Source: `reference/dreamdex-docs/developers/http-api/builder-fees.md`, `developers/contracts/functions.md#builder-codes`, `developers/contracts/spot-router.md#builder-attribution`.

Mechanics — this is the monetization path for any front-end we build on the spot surface:

1. **User approves the builder once per pool**: `approveBuilder(builder, maxFeeBpsTimes1k)` (or HTTP `POST /v0/markets/{symbol}/builder/approve`, which returns the unsigned tx). Rates are in `BPS_TIMES_1K` units (1 bp = 1000). `0` revokes.
2. **Orders are tagged**: `placeOrder(..., builder, builderFeeBpsTimes1k)` — the fee is charged **per fill, on top of** the (zero) protocol fee, in quote for bids / base for asks, and **credited to the builder's vault balance** on that pool (`BuilderFeeCharged` event). Auto-pull sizes the pull as `principal + max(makerFee, takerFee) + builderFee`.
3. **Cap**: protocol-wide per pool via `getMaxBuilderFeeBpsTimes1k()`; cap `0` disables (`BuilderCodesNotSupported`). Docs state builder codes are **live on mainnet with cap `100000` (= 100 bps = 1%)**; one page says testnet cap is `0` while others say the cap is `100000` on both networks — **read the cap at runtime per pool**, don't trust either constant (`functions.md` contains both statements).
4. **Effective rate** = `min(userApproval, protocolCap)` — `getEffectiveBuilderApproval(user, builder)` / HTTP `GET .../builder/approval` returns both `approved` and `effective`.
5. **Collecting**: fees sit as withdrawable vault balance per pool per token — read with `getWithdrawableBalance(builder, token)` (native = sentinel address) or `GET .../vault/balance`, withdraw with `withdraw(token, amount)` or `POST .../vault/withdraw`.
6. **Routed swaps**: SpotRouter `…WithBuilder` entrypoints charge the fee **once, on leg 0 only**, against the leg-0 pool in that leg's input token; user approval is read on the leg-0 pool. Quote with the same builder rate you'll swap with (rate 0 overstates output).
7. Stop orders also carry `builder`/`builderFeeBpsTimes1k` fields in `PendingOrderWithTrigger`, validated at trigger time.

**Event Contracts caveat**: builder codes are documented only on the spot surface (SpotPool, SpotRouter, spot stop registry). The EC docs (`trading/event-contracts*`, `developers/event-contracts/*`) never mention builder attribution — EC markets run through the separate BinaryMarketsModule stack. Treat builder fees as **spot-only unless verified on-chain against the EC pool**. The roadmap's broader "builder-codes / fee-rebate program" (rebates for routing flow) is listed as *next* (`welcome/roadmap.md`).

## 11. HTTP API

### 11.1 Authentication (SIWE → JWT)

Source: `reference/dreamdex-docs/developers/http-api/authentication.md`, `developers/quick-start.md`.

Flow (private endpoints only; market data is public):
1. `GET /v0/auth/nonce` → `{ nonce }` (single-use, expires in 5 minutes).
2. Build an **ERC-4361 (Sign-In with Ethereum)** message containing that nonce, domain `api.dreamdex.io`, and the **chain ID of your target env** (5031 or 50312); sign with the wallet.
3. `POST /v0/auth/login` `{ message, signature }` → `{ token, expiresAt }` (JWT, valid **1 hour**, `expiresAt` in Unix ms).
4. Send `Authorization: Bearer <token>`.

No refresh endpoint — re-run nonce→sign→login before expiry (bot kit refreshes 3 minutes early; re-login is a signature, no gas). Auth error names: `invalid_nonce`, `invalid_signature`, `domain_mismatch`, `chain_id_mismatch`, `unauthorized`, `wallet_not_allowed` (403).

### 11.2 Endpoint map

Sources: `developers/http-api/market-data.md`, `trading.md`, `vault.md`, `builder-fees.md`, `wallets.md`, `portfolio.md`.

**Public market data:**

| Endpoint | Purpose / notes |
|---|---|
| `GET /v0/markets` | All pairs with `contract` (pool), `base`/`quote` addresses, decimals, tickSize/lotSize/minQuantity — canonical market discovery |
| `GET /v0/currencies` | Supported currencies |
| `GET /v0/orderbooks?symbols=A&symbols=B` | Depth. **Only** this query form (`/markets/{symbol}/orderbook` 404s). Repeated `symbols=` keys, *not* comma-separated (comma form silently returns `[]`). Unknown symbols → `400 invalid_param` with `context.invalid_symbols` |
| `GET /v0/tickers?symbols=…` | 24h OHLCV stats; omit symbols for all markets |
| `GET /v0/markets/{symbol}/trades` | Recent trades newest-first (public; `trades:read_any` scope adds maker/taker addresses) |
| `GET /v0/markets/{symbol}/tickers` | Per-market 24h ticker |
| `GET /v0/markets/{symbol}/candles` | OHLCV candles; page backwards with `endTime` (ms) + `limit` |
| `GET /v0/markets/{symbol}/volume` | Volume over `[since, until)`; `until` defaults to 30 min ago (ingestion latency), range ≤ 40 days; scaled + raw figures |

**Authenticated trading (all "prepare" endpoints return an unsigned tx `{to, data, value, chainId}` you sign & broadcast):**

| Endpoint | Purpose / notes |
|---|---|
| `POST /v0/markets/{symbol}/orders` | Prepare order. Body: `type` (limit/market), `side`, `price`, `amount`, `walletAddress`, `fundingSource` (`wallet` default / `vault`; perps will use `marginBank`), `orderType` (GTC/IOC/FOK/postOnly), optional `builder`. Validation: `invalid_price` (tick), `invalid_amount` (lot/min). Response includes an `approval` field **only when** more ERC-20 allowance is needed. Market buys are priced off best ask + `slippageBps` (default 5%) |
| `GET /v0/markets/{symbol}/orders/{id}` | Order status, fill progress, tx hash |
| `POST /v0/markets/{symbol}/orders/{id}/reduce` | Prepare reduce to `newQuantityRemaining` |
| (cancel) | Prepare cancellation of an open order (same pattern; also `dreamdex order cancel` CLI / on-chain `cancelOrder`) |
| `GET /v0/markets/{symbol}/orders?status=…&cursor=…` | List my orders (open/closed/canceled/expired/rejected), cursor-paged |
| `GET /v0/orders?symbols=…` | My orders across markets |
| `GET /v0/markets/{symbol}/trades/mine` | My fills (taker or maker), newest-first |
| `GET /v0/trades?symbols=…` | My fills across markets, each tagged with symbol |
| `GET /v0/markets/{symbol}/trades/{address}` | Privileged: any wallet's fills; needs `trades:read_any` scope; `[since,until)` ≤ 40 days; `as=maker|taker` filter |

**Vault:**

| Endpoint | Purpose |
|---|---|
| `POST /v0/markets/{symbol}/vault/approve` | Prepare ERC-20 `approve(pool, amount)` (targets the **token**). Native: returns HTTP 200 with body `null` → skip to deposit |
| `POST /v0/markets/{symbol}/vault/deposit` | Prepare vault deposit |
| `POST /v0/markets/{symbol}/vault/withdraw` | Prepare vault withdrawal |
| `GET /v0/markets/{symbol}/vault/balance` | Withdrawable base+quote balances (abstracts the native sentinel) |

**Builder fees:** `GET .../builder/max-fee` (protocol cap), `POST .../builder/approve` (prepare approveBuilder tx), `GET .../builder/approval` (approved + effective rate).

**Wallets (privileged, `wallet:read_any` scope; for operators/aggregators):** `GET /v0/wallets/{wallet}/balance` (wallet + vault balances across all markets, pinned to one block; `blockNumber` param), `GET /v0/wallets/{wallet}/volume` (per-market maker+taker volume over `[since,until)` ≤ 40 days), `GET /v0/wallets/{wallet}/smart-wallets` (maps a login EOA → Privy smart wallet(s), including counterfactual ones; dreamDEX keys on-chain activity by smart wallet while users authenticate with the EOA — important when reconciling app users to on-chain data).

**Portfolio:** `GET /v0/portfolio?timeframe=24h|7d|30d|all` — cumulative trading-PnL series (`equity` starts at 0; final point = total PnL), per-bucket + total PnL, MWRR, volume, "fees saved vs CEX". Computed **from fills only** (mark-to-market vs USDso=1 USD); deposits/withdrawals invisible; native token excluded; bucket-aligned grid (1h/6h/1d steps) with `asOf` marking series end. Own-wallet only (from bearer token), no special scope.

### 11.3 Error handling

Source: `developers/http-api/error-handling.md`.

Uniform shape `{ status, name, description }` + `Error-Name` header; `name` is stable for programmatic handling. Classes: validation 400 (`missing_field`, `invalid_param`, `invalid_amount` (lot), `invalid_price` (tick), `invalid_order_type`/`invalid_fund_source` (incompatible fundingSource+orderType combo), `invalid_interval`, …), auth 401/403, 404 (`market_not_found`, `order_not_found`), server 500/503 (`internal_error`, `rpc_unavailable`, `not_implemented`). Retry guidance (`developers/developers.md`): retry timeouts/5xx/`rpc_unavailable` with exponential backoff + jitter (base ~500 ms, cap ~30 s); never retry 4xx; re-query receipts before re-broadcasting txs.

## 12. WebSocket API

Source: `reference/dreamdex-docs/developers/websocket-api/real-time-feed.md`, `operations.md`, `errors.md`.

Endpoints: `wss://api.dreamdex.io/v0/ws/public` (mainnet), `wss://stg.api.dreamdex.io/v0/ws/public` (testnet).

**Channels** (subscribe → `subscribed` confirmation → `snapshot` → incremental `update`s):

| Channel | Params | Snapshot / updates |
|---|---|---|
| `orderbook` | `{"symbols": [...]}` | Full aggregated book (bids desc, asks asc), then changed levels; `quantity: "0"` removes a level. All prices/quantities are decimal **strings** |
| `ohlcv` | `{"symbol", "timeframe"}` (`1m`,`5m`,`15m`,`1h`,`4h`,`1d`) | Recent candles, then forming-candle updates (same timestamp = replace) |
| `trades` | `{"symbols": [...], "limit"}` | Recent trades then per-trade updates (market-wide, **no account attribution**) |
| `order` | `{"orderId"}` (per-order) | Order state snapshot then updates; statuses `open`/`partial`/`filled`/`cancelled` (expired surfaces as cancelled). **There is no account-wide order/fills channel** — track per orderId, or reconcile via REST/receipt logs for taker loops |

**Operational rules**: ping `{"operation":"ping"}` at least every 30 s (60 s idle timeout); close codes 1000/1001/4001 (4001 = slow consumer → reconnect + resubscribe). **No sequence numbers or resume** — every reconnect is a cold start: backoff, re-subscribe (fresh snapshots), re-fetch orders/balances over REST. A silent gap is indistinguishable from a quiet market, so periodically reconcile against REST/chain.

**REST-over-WebSocket** (`operations.md`): call any OpenAPI operation over the socket via `{id, operation, params, bearerToken, payload}` → `{id, status, errorName?, payload}` (out-of-order responses correlated by `id`; e.g. `getMarkets`, `prepareOrder`). Concurrent request limit 100/connection (`too_many_requests`). Subscription errors: `unknown_channel`, `subscription_failed`, `unsubscribe_failed`, `not_subscribed`.

## 13. Libraries, CLI, agent tooling

Source: `reference/dreamdex-docs/developers/libraries/ccxt.md`, `developers/quick-start.md`.

- **CCXT** (alpha, not on npm): `npm install github:somnia-chain/ccxt#add-dreamdex-exchange` → `new ccxt.dreamdex({walletAddress, privateKey})`. Supports fetchMarkets/Ticker/OrderBook/Trades/OHLCV, createOrder (**returns unsigned tx** — you sign+broadcast), fetchOrder(s)/OpenOrders, cancelOrder, fetchBalance (`params.symbol` required), vaultApprove/Deposit/Withdraw; `ccxt.pro.dreamdex` gives watchOrderBook/watchTrades/watchOHLCV. TS/JS only so far.
- **dreamDEX CLI**: `go install github.com/somnia-chain/somnia-dex-cli/cmd/dreamdex@latest`; `dreamdex login`, `markets`, `vault approve/deposit`, `order place/list/get/cancel`, `watch order` — handles SIWE + signing (`DREAMDEX_PRIVATE_KEY` for headless).
- **Agent skills**: https://github.com/somnia-chain/somnia-skills — `dex-operator-trading` (split-key recipe), `dex-spot-router-interaction` (router ABIs + error map). Plus a native MCP server and `AGENTS.md`/`SKILL.md` per the welcome pages.

## 14. Earn (SomniaLend integration)

Source: `reference/dreamdex-docs/trading/earn.md`.

- **Earn tab** (mainnet only, app.dreamdex.io/earn) is a supply-only surface over **SomniaLend** (https://app.somnialend.finance/) — the ecosystem lending protocol. Supply SOMI (auto-wrapped), USDso, USDC.e, WETH, WBTC from the **smart wallet** balance (not spot vaults); variable per-block APY from utilization; withdraw anytime subject to un-borrowed liquidity. First ERC-20 supply bundles approval+deposit in one confirmation.
- Lending txs are **not gas-sponsored** — keep native SOMI in the smart wallet; the app warns against supplying 100% of SOMI.
- Deposits go into shared SomniaLend pool contracts (dreamDEX is just a front-end surface) — a live example of the "build a surface over another protocol and keep the user relationship" pattern the platform encourages.

## 15. Collateral Yield Algorithm (maker rewards)

Source: `reference/dreamdex-docs/trading/common/yield-algorithm.md`, `trading/common/fees.md`.

- Rewards **resting open interest**, not fills. Per-second score = `quantity × W × seconds` where `W = e^{-(P_order − P_mid)²/(2σ²)}` — Gaussian proximity to the **instantaneous** book mid (`(bestBid+bestAsk)/2`, *not* the EMA mark price). σ is per-market in raw on-chain price units.
- A fixed operator-funded reward pool per settlement run is split pro-rata by accumulated score (per maker, per side). Payout is a *share*, not a fixed APR; annualizing needs off-chain inputs (pool size, cadence, σ translation).
- Qualifying: order must rest (IOC/FOK residuals and filled aggressors earn nothing); a two-sided book must exist (empty side → nobody accrues); no minimum size, no dwell requirement, no early-cancel penalty (accrued score is kept).
- 1σ away ≈ 0.607 weight, 2σ ≈ 0.135. Settlement is an idempotent operator batch job (direct ERC-20 transfers); history viewable via API/UI.
- Fees page (`fees.md`) is marked Work in Progress; gas-cost table has TODOs.

## 16. Bot kit operational lore (worth stealing for any 24/7 service)

Source: `reference/dreamdex-bot-kit/docs/` (`24-7-operations.md`, `getting-started.md`, `backtesting.md`, `measuring-edge.md`, `railway.md`), `advanced/batch-7702/`.

- **Kit layout**: npm workspace `@dreamdex-bot-kit/core` + six TS strategies (starter, market-making, grid, momentum, mean-reversion, twap; plus ensemble/treasury/yield-optimizer in backtest) and Python variants; everything defaults to `NETWORK=testnet`, `DRY_RUN=true`.
- **JWT refresh**: refresh ~3 min before `expiresAt`; direct-contract bots don't need the JWT at all.
- **Nonce management**: local allocator + backpressure + resync-on-"nonce too low" (`NonceManager` in `packages/core/src/nonce.ts`); fire-and-forget submission for throughput (don't await receipts in the hot loop). Fixed-gas bots must stay on ERC-20 pairs (native-buy 5M gas floor).
- **Fills from chain, not REST**: `/v0/trades` can stall — read `OrderFilled` logs (≤1000-block `getLogs` chunks), match taker/maker order ids against your own `OrderPlaced` ids; `fillPrice × quantityFilled` = quote notional.
- **WS discipline**: ping every 30 s, reconnect + replay subscriptions, periodically reconcile the book against on-chain `getBookLevels` (stale-quote detection).
- **Gas**: keep a SOMI reserve with a halt threshold; EIP-1559 when supported; ~20% headroom.
- **Backtesting** (`packages/backtest`): bar-by-bar replay of any strategy over REST OHLCV candles with a synthetic book (`npm run backtest -- review --symbol WETH:USDso --days 7`); models IOC/FOK/PostOnly/GTC, fees, optional queue position; no historical CLOB, no gas.
- **Measuring edge** (`measuring-edge.md`): captured spread vs adverse selection mark-outs, transactions-per-fill as the forgotten gas metric, break-even notional `N > t·g/(E·1e-4)`, and DreamDEX's extra term — **presence yield** from the yield algorithm (band compliance ≠ profitability).
- **Railway deploy** (`railway.md`): one-click worker template https://railway.com/deploy/pE6EIF; pairs with the hosted **dreamBot Builder** (app.dreamdex.io/dreambot-builder) which generates the env block; private key only ever pasted into Railway variables.
- **EIP-7702 batching** (`advanced/batch-7702/README.md` + `contracts/DreamDexVolumeBatch7702.sol`): an EOA temporarily adopts contract code (type-4 tx) and runs multiple pool actions atomically in one signature/one gas payment — the demo does IOC buy → IOC sell of the exact realized balance delta (partial-fill safe), using wallet auto-pull, ~2.3M gas, verified live on Somnia mainnet (so **Somnia accepts type-4/EIP-7702 transactions** — needs viem ≥ 2.30). Key subtlety: self-sponsored authorizations must be signed at **nonce + 1** (`executor: "self"` in viem), otherwise the tx "succeeds" with zero logs. Relevant to us for gasless/one-click UX: approve+place (or multiple actions) in a single click without a smart-wallet stack.

## 17. Security, audits, risks

Source: `reference/dreamdex-docs/security/audits.md`, `security/risks.md`.

- **Hacken audit (April 2026), complete & published**: spot core — `OrderBook`, `SpotPool`, `SpotStopOrderRegistry`, `ERC20Vault`, libraries (`PriorityIndex`, `OrderIndexManager`, `PerUserOrderIndex`, `LinkedList`, `Common`); covered matching, lifecycle, vault accounting, fee model, mark-price emission, reactivity integration. Report: https://hacken.io/audits/somnia/ (specific engagement page: `sca-somnia-dreamdex-dream-dex-apr2026`).
- **USDso swap contract**: separate **Sherlock** audit (in progress per docs).
- **Risks** to disclose in any product we ship on top: smart-contract risk; Somnia network dependency; **SpotPool and SpotStopOrderRegistry are upgradeable beacons controlled by the protocol owner**; admin-tunable parameters (tick/lot/min, fee rates, registry settings) can change; liquidity/price risk on thin books.

## 18. Hackathon-relevant takeaways (commentary)

- The **spot surface is a second integration target** beyond ECs: zero fees + sponsored gas on core pairs + SpotRouter make "swap into collateral" (e.g., USDC.e→USDso before buying EC contracts) a one-tx UX we can embed. Note EC testnet collateral is **tUSDC with an on-demand faucet**, not USDso (`developers/event-contracts/contracts-and-addresses.md`), so the swap story is a mainnet story.
- **Operator/session keys** give a real answer to "how does a consumer app trade without prompting for every order" on the spot side; the EC surface has its own flow (see teammate's file), but the registry pattern is the platform-blessed one.
- **Builder codes** are the platform-blessed monetization for routed spot flow (up to 1% per fill, paid to our vault) — but likely **not available on EC markets** (undocumented there); verify on-chain before promising revenue.
- The **portfolio endpoint** (`/v0/portfolio`) and **volume endpoints** are ready-made for analytics features (PnL cards, leaderboards) without building an indexer — but they cover **spot**, keyed by smart wallet; EC analytics need the EC recipes/SDK.
- WS has **no account-wide fills channel** and no resume — any real-time UI needs per-order subscriptions plus REST/chain reconciliation; design for cold-start resubscribes.
- The docs are GitBook with an **`?ask=` query API** (`GET https://docs.dreamdex.io/<page>.md?ask=<question>&goal=<goal>`) — usable at build time for quick doc lookups (footer of every mirrored page).
