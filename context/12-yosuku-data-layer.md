# Yosuku `lib/` — Data & Domain Layer Reference

Source: `reference/yosuku/lib` (89 files, ~17.6k lines). Next.js 16 consumer front-end for a
prediction-market venue (DeepBook Predict on Sui testnet). Purpose of this doc: catalog every
module, extract the chain-agnostic domain logic (markets, positions, PnL, leaderboard, alerts,
parlays, leverage, strategies, portfolio), and mark what is portable to Somnia / DreamDEX Event
Contracts vs what needs an adapter vs what to drop.

**Critical context for reading this codebase**: it contains **two generations** stacked on top of
each other:

1. **Legacy "oracle era" (4-16 venue)** — markets are "oracles" with a strike grid, priced by an
   SVI vol surface served by a REST indexer (`predict-server`). Files: `predictApi.ts`,
   `predictClient.ts`, `sviPricing.ts`, `pnlCalculator.ts`, `useRounds.ts`, `roundHelpers.ts`,
   `hooks.ts`, `leaderboardEngine.ts`. Reads come from HTTP; pricing is computed client-side from
   SVI params.
2. **Current "6-24 / 7-29 era"** — markets are rolling per-cadence `ExpiryMarket` objects
   (1m/5m/1h BTC windows) selling **cash-or-nothing range digitals** with native leverage.
   There is **no indexer**; market discovery, spot, quoting, positions, and history are all read
   from chain (GraphQL events + gRPC simulation). Quotes are obtained by **dry-running the exact
   mint transaction** and reading the emitted `OrderMinted` event. Files: `predict624Client.ts`,
   `ticket624.core.ts`/`ticket624.ts`, `settledTrade.ts`, `history729.ts`, `leaderboard624.ts`,
   `settlement.ts`, `vault624Client.ts`.

The current era's *shape* (short cadenced Up/Down windows, prices = probabilities in (0,1),
oracle settlement, order-based positions) maps almost 1:1 onto DreamDEX Event Contracts. Most of
the domain math ports directly; only the transport (Sui PTB/gRPC/GraphQL → EVM
calls/events/viem) changes.

---

## 1. Architecture / layering

```
┌────────────────────────────────────────────────────────────────────────┐
│ UI (app/, components/)                                                 │
│   TradePanel · Ticket624Drawer · Portfolio · Leaderboard · Feed · Room │
└──────────────┬─────────────────────────────────────────────────────────┘
               │ React hooks (client boundary)
┌──────────────▼─────────────────────────────────────────────────────────┐
│ HOOK LAYER                                                             │
│  useRounds, sui/hooks.ts (useOracles/usePositions/…), useAccount624,   │
│  useMintQuote624, useMoney, useBell624, useBtcPrice, usePoll,          │
│  useDailyStop, useCommentRoom, leverageHooks, parlayHooks              │
└───────┬───────────────────────────┬────────────────────────────────────┘
        │ pure domain logic         │ tx builders + submit
┌───────▼───────────────┐   ┌───────▼────────────────────────────────────┐
│ DOMAIN (chain-free)   │   │ CLIENT LAYER (chain-specific)              │
│ predict624Math        │   │ predict624Client (mint/redeem/quote PTBs)  │
│ ticket624.core sizing │   │ predictClient (legacy), tradingVaultClient │
│ pnlCalculator         │   │ vault624Client, leverageClient,            │
│ leaderboardEngine/624 │   │ parlayClient, strategyClient, takeBoard,   │
│ traderEdge729         │   │ comments, claim, creatorCode/-Recovery     │
│ badges, dailyStop     │   │ useSmartSubmit ── sponsor.ts (gas station) │
│ marketLine, sviPricing│   └──────┬─────────────────────────────────────┘
│ parlay odds math      │          │
│ shareCard renderers   │   ┌──────▼─────────────────────────────────────┐
│ schemas (zod)         │   │ TRANSPORT                                  │
└───────────────────────┘   │ modernClients: gql (GraphQL reads/events)  │
                            │            + grpc (simulate = quote, exec) │
                            │ jsonRpc (multi-node fallback), predictApi  │
                            │ (REST indexer, legacy), /api/* routes      │
                            │ (oracles, spot, quote, leaderboard, claim) │
                            └──────┬─────────────────────────────────────┘
                                   │
        Sui fullnode (GraphQL/gRPC) · predict-server REST · Pyth Hermes ·
        Walrus (blob storage) · Seal (threshold encryption) · Onara (gas
        sponsor) · Circle CCTP · localStorage (per-browser state)
```

Key structural rules the codebase enforces (worth copying):

- **One mint builder, one ABI.** Every path that opens a position (web ticket, first-bet PTB,
  top-up PTB, BTC-funded bet, server route, MCP) funnels through `buildMintTx` /
  `buildCreateFundAndMint624` in `predict624Client.ts`. A duplicated copy of the mint chain
  rotted once (BTC path, `btcOnramp.ts:299-303`) and the rule is now explicit.
- **Pure core / React shell split.** `ticket624.core.ts` (no React, importable from route
  handlers) vs `ticket624.ts` (`'use client'`, hooks, re-exports the core). Same for
  `mint624.ts` (server-safe builder that *captures* the tx instead of submitting,
  `mint624.ts:1046-1069`).
- **Quotes are dry-runs of the real transaction**, never client-side estimates
  (`quoteMint624`, `predict624Client.ts:915`). Estimates abort on-chain (`EMintCostAboveMax`)
  because short-cadence probabilities move too fast.
- **Boundary validation with zod** on every money-path fetch (`schemas.ts`) — bad records are
  dropped, never crash `BigInt()`.
- **Null ≠ zero** for balance reads: a failed read returns `null` and callers keep last-good
  (`fetchAccountBalanceMicro624`, `predict624Client.ts:1102-1131`; `privateBudget.ts:886-895`).
- **Visibility-aware polling** everywhere (`usePoll.ts`, `hooks.ts:9-41`) and **TTL + in-flight
  dedup caches** for hot endpoints (`cachedFetch`, `predict624Client.ts:192-206`).

---

## 2. File-by-file table

Portability legend: **P** = portable as-is (chain-agnostic), **A** = needs adapter (logic
portable, transport is Sui), **S** = Sui-specific (rewrite against EVM or drop), **D** = drop
(legacy/unused for the port).

### Market / round model

| File | Purpose | Port | Key exports |
|---|---|---|---|
| `hooks/useRounds.ts` | Poll all markets every 15s; split active/settled | **A** | `useRounds(): {allOracles, active, settled, loading, refetch}` |
| `roundHelpers.ts` | Strike-grid snapping, countdown formatting, localStorage positions, market grouping | **P** (grid+time) | `defaultStrike`, `nearestStrike`, `generateDisplayStrikeGrid`, `getTimeRemaining`, `formatCountdown`, `groupOraclesByTimeframe`, `LocalPosition` store |
| `marketLine.ts` | Canonical strike line: explicit → previous settlement → reference price → grid fallback | **P** | `getCanonicalMarketLine`, `previousSettledOracle`, `normalizeMarketStrike`, `MarketLine{strike,source}` |
| `sui/predict624Math.ts` | Lot quantization (0.01-unit lots) | **P** | `positionQuantityMicro624`, `quantizePositionQuantity624`, `POSITION_LOT_MICRO_624` |
| `sui/sviPricing.ts` | SVI vol-surface pricing: binary price = N(d2), range price, IV smile, fee breakdown | **P** (math) / **D** if DreamDEX has book prices | `computeSviPrice`, `computeRangePrice`, `impliedVolAnnual`, `sviSmile`, `computeFeeBreakdown` |
| `sui/onchainQuote.ts` | Client wrapper for exact server-side quote (`/api/yosuku/quote`) | **A** | `fetchOnChainQuote`, `fetchOnChainRangeQuote` → `{mintCost, redeemPayout}` |
| `sui/pnlCalculator.ts` | Mark-to-market unrealized PnL + FIFO realized PnL timeline | **P** | `computePositionPnL`, `computeRealizedPnL`, `PositionPnL`, `RealizedTrade` |
| `sui/settlement.ts` | Authoritative settlement read (Option<u64> probe) + win predicate | **A** (predicate **P**) | `readSettlementPrice`, `isWinningRange` |
| `sui/settledTrade.ts` | Join mint+redeem order rows into one settled-trade record | **P** | `SettledTrade`, `joinSettledTrades` |
| `sui/history729.ts` | Durable per-expiry money ledger read from chain + rollup | **A** (rollup **P**) | `fetchExpiryHistory`, `summarise`, `ExpiryHistoryRow` |
| `sui/schemas.ts` (+ test) | Zod validation of untrusted server data on the money path | **P** | `RawOracleSchema`, `QuoteSchema`, `RawPositionSchema`, `TradeSchema`, `parseList`, `parseOne` |
| `sui/predictApi.ts` | REST client for legacy indexer (oracles/prices/SVI/positions/trades/vault/manager) | **A**/**D** | `fetchOracles`, `fetchLatestSvi`, `fetchManagerPositions`, `fetchManagerPnL`, 25+ types (`OracleData`, `SviParams`, `ManagerPositionSummary`, …) |
| `sui/oracleCache.ts` | Module-level market-state cache for instant detail-page paint | **P** | `cacheOracleState`, `seedOracle`, `getCachedOracleState` |
| `sui/onchainSpot.ts` | Read BTC spot directly off the settlement oracle object | **S** (concept **A**) | `readOnchainSpot(): {usd, tsMs}` |
| `sui/bell624.ts` | "Next bell" countdown + last settlement print for chrome surfaces | **A** | `useBell624`, `fetchRecentPrints624`, `fmtBell624` |
| `sui/queries.ts` | Legacy re-export shim + DUSDC/PLP balance reads + formatting | **A**/**D** | `fetchDUSDCHeldMicro`, `formatDUSDC`, `parseDUSDCToMicro` |
| `predictionContract.ts` | Legacy constants/types + naive prob estimate + reputation tiers | **P** (tiers) / **D** rest | `estimateProb`, `getReputationData`, `computeTier`, `TIERS` |

### Core trading clients (current venue)

| File | Purpose | Port | Key exports |
|---|---|---|---|
| `sui/predict624Client.ts` | THE venue client: market discovery, spot, tick math, mint/redeem/deposit/withdraw tx builders, dry-run quoting, account discovery, order-event feeds | **S** (shapes/semantics **A**) | `PREDICT624` consts, `usdToTick`/`tickToUsd`, `fetchMarkets624`, `pickMarket624`, `inferCadence624`, `fetchSpot624`, `fetchPythHistory624`, `buildMintTx`, `buildCreateFundAndMint624`, `buildTopUpAndMint624`, `buildRedeemSettledTx`, `quoteMint624`, `quoteOddsCents624`, `probeCombinedMint624`, `fetchAccountBalanceMicro624`, `findWrapperId624`, `fetchOpenPositions624`, `fetchAccountOrders624`, `fetchMarketState624`, `Market624`, `Position624`, `OrderRow624`, `MintQuote624` |
| `sui/ticket624.core.ts` | Pure ticket machinery: stake→qty sizing, strike snapping, admissibility, cost-cap buffers, place/first-bet/top-up orchestration, friendly abort mapping | **P** (mostly!) | `qtyForStake`, `winForQty`, `minQtyMicroForPremium`, `strike624`, `ticks624`, `rangeTicks624`, `RANGE_PRESETS`, `MIN_STAKE`, `estProb`, `costCapBuffer`, `minMintMs`, `entryProbAdmissible`, `placeMint624`, `placeRangeMint624`, `placeFirstBet624`, `placeTopUpAndBet624`, `friendlyMintAbort`, `isStaleBundleError`, account/total caches |
| `sui/ticket624.ts` | React half: `useAccount624` (wrapper discovery, balances, deposits, one money figure), `useMintQuote624` (debounced live quote loop) | **A** | `useAccount624`, `useMintQuote624`, re-exports core |
| `sui/mint624.ts` | Server-safe mint builder (captures the tx from `placeMint624`) | **A** | `buildMint624` |
| `sui/predictClient.ts` | Legacy 4-16 PTB builders (mint/redeem/range/LP/claim-all crank) | **D** | `depositAndMintTx`, `redeemAllPermissionlessTx`, `supplyLpTx`, … |
| `sui/modernClients.ts` | GraphQL+gRPC transport backbone + JSON-RPC compat shim + build-sign-execute | **S** | `gql`, `grpc`, `readClient`, `simulateReturnU64s`, `buildSignExecute` |
| `sui/jsonRpc.ts` | Multi-node JSON-RPC failover | **S** (pattern **P**) | `suiJsonRpc` |
| `sui/network.ts` | Single network switch (testnet/mainnet), all addresses/endpoints, `PREDICT_LIVE` gate | **A** (pattern) | `NET`, `SUI_NETWORK`, `PREDICT_LIVE`, `NetworkConfig` |
| `sui/constants.ts` | Address/type constants + scaling (1e9 float, 6dp quote, ±inf sentinels) | **A** | `FLOAT_SCALING`, `DUSDC_MULTIPLIER`, `NEG_INF`/`POS_INF`, `MODULES` |
| `backendUrl.ts` | Resolver backend URL resolution (no prod guessing) | **P** | `getResolverBackendUrl` |

### Position tracking, portfolio, leaderboard

| File | Purpose | Port | Key exports |
|---|---|---|---|
| `positionStorage.ts` | localStorage position log (legacy YES/NO shape) | **P** | `savePosition`, `getUserPositions`, `StoredPosition` |
| `tradingAccount.ts` | Pure snapshot combining all money pools into one view | **P** | `computeTradingAccountSnapshot` |
| `portfolio/useMoney.ts` | "Every place this user's money is, in one shape" — spendable + labelled pools with exits | **A** | `useMoney(): Money{readyToBetDusdc, pools[], …}`, `Pool` |
| `traderEdge729.ts` (+ test) | Trader analytics from settled ledger: ROI, win rate, profit factor, expectancy, drawdown, streak, time-of-day windows, equity curve, plain-words readout | **P** | `computeTraderEdge729`, `TraderEdge729`, `EdgeWindow729` |
| `leaderboardEngine.ts` (+ test) | Exact realized-PnL leaderboard: dedupe, FIFO lot-matching, call grouping, window filtering, streaks — all bigint | **P** | `computeLeaderboard`, `LeaderboardMint`, `LeaderboardRedeem`, `LeaderboardRanking` |
| `leaderboard624.ts` | Leaderboard for order-feed venues (position_root grouping, no lot math) | **P** | `computeLeaderboard624`, `AccountOrders624`, `Ranking624` |
| `leaderboardStats.ts` | Legacy local-storage leaderboard (volume/profit/accuracy) | **D** (formatters **P**) | `getLeaderboard`, `formatAddress`, `formatVolume` |
| `badges.ts` | Achievement badges from position summaries | **P** | `computeBadges` (first_trade, 3-streak, LP, whale ≥1000, oracle 70%/10) |
| `dailyStop.ts` | Client-side daily loss limit (localStorage, midnight reset) + hook | **P** | `useDailyStop`, `recordPnl`, `getTodayLoss`, `setDailyStop` |
| `csvExport.ts` | Positions → CSV with proper escaping + download | **P** | `positionsToCSV`, `downloadCSV` |

### Social / agent features

| File | Purpose | Port | Key exports |
|---|---|---|---|
| `sui/takes.ts` | Social posts ("takes") stored on Walrus; content-addressed, cached forever | **A** | `Take`, `writeTake`, `readTakes`, `normalizeCaption`, `TAKE_MAX_CAPTION` |
| `sui/takeBoard.ts` | On-chain discovery event for takes + feed hydration | **A** | `buildPostTakeTx`, `fetchTakes`, `FeedTake` |
| `xLink.ts` | Signed link/unlink messages binding X account ↔ wallet | **P** | `xLinkMessage`, `xUnlinkMessage` |
| `sui/xHandle.ts` | Wallet → X handle resolution, cached+deduped | **A** | `resolveXHandle(s)`, `xProfileUrl` |
| `claimOAuth.ts` | X OAuth2 PKCE helpers + HMAC-signed session cookie (server-only) | **P** | `signSession`, `readSession`, `genVerifier`, `codeChallenge`, `SESSION_TTL_MS` |
| `sui/claim.ts` | Claim tweet-funded auto-account: Seal-unseal withdraw key, sweep funds | **S** | `unsealAccountKey`, `recoverFundsToWallet`, `fetchClaimAccount` |
| `sui/strategyClient.ts` | Strategy exchange: catalogue from objects, copy-trade events, realized PnL join, scoring/ranking, share text, subscribe/list tx builders | **A** (scoring **P**) | `fetchStrategies`, `fetchAgents`, `rankStrategies`, `strategyScore`, `StrategyCard`, `CopyTrade`, `buildSubscribeTx`, `buildListStrategyTx`, `PRESETS`, `describeSpec`, `codenameFromAddress` |
| `sui/strategySealClient.ts` | Seal-encrypted playbook capsules on Walrus, paywalled by on-chain subscription | **S** | `sealPlaybook`, `readPlaybook`, `blobIdFromU256`, `capsuleIsLive` |
| `sui/memoryMarketClient.ts` | Agent memory as tradable asset (MemoryPass), Seal decrypt, provenance badges | **S** (provenance copy **P**) | `fetchAllMemoryListings`, `buildBuyPassTx`, `readMemory`, `provenanceOf` |
| `memwal.ts` | Server-only agent memory (MemWal/Walrus), never-throws recall/remember | **A** | `recallMemories`, `rememberFact` |
| `sui/roomDelegate.ts` | Per-user Ed25519 messaging delegate (zkLogin workaround), persisted | **S** | `getRoomDelegate`, `useRoomDelegate` |
| `sui/comments.ts` | Position-gated encrypted market rooms (Seal + Sui Stack Messaging) | **S** (gating concept **A**) | `checkHasBet`, `buildJoinRoomTx`, `ensureMarketRoom`, `postComment`, `fetchComments`, `joinRoom` |
| `sui/useCommentRoom.ts` | Room gate state machine (connect→locked→joinable→joining→joined) | **A** (states **P**) | `useCommentRoom` |
| `sui/traction.ts` | Honest on-chain traction metrics (sponsored-user adoption vs capability), monotonic high-water marks | **A** | `fetchTraction`, `TractionStats` |
| `sui/waitlist.ts` | On-chain waitlist + referral-weighted leaderboard | **A** | `fetchWaitlist`, `buildJoinTx`, `fetchWaitlistLeaderboard`, `FOUNDER_CUTOFF` |
| `sui/creatorCode.ts` | Creator fee attribution (BuilderCode owned by creator, protocol-enforced payout) | **A** (concept) | `buildCreateCreatorCodeTx`, `claimableFeesMicro`, `buildClaimCreatorFeesTx`, `findCreatorCode` |
| `sui/creatorRecovery.ts` (+ test) | zkLogin + passkey 1-of-2 multisig recovery for creator codes | **S** | `creatorController`, `buildRegisterCreatorRecoveryTx`, `recoverCreatorPasskey` |

### Money rails

| File | Purpose | Port | Key exports |
|---|---|---|---|
| `sponsor.ts` | Onara gas-station client; digest recovery on "unconfirmed"; near-miss policy refusal parsing | **S** (pattern **A**) | `getSponsorStatus`, `submitSponsored` |
| `sui/useSmartSubmit.ts` | ONE submit path: sponsored-first, wallet fallback, gas-coin pinning for concurrency, doomed-popup avoidance | **S** (pattern **A**) | `useSmartSubmit(): {submit, submitAs, sponsorReady}` |
| `walletExecution.ts` | Retry-once wrapper, skips user rejections | **P** | `executeWithRetry` |
| `sui/useWalletSigner.ts` | dapp-kit wallet → SDK `Signer` adapter (Ed25519/secp256k1/zkLogin) | **S** | `useWalletSigner` |
| `sui/useCreatorMultisigSubmit.ts` | Sponsored multisig submit (zkLogin or passkey partial sig) | **S** | `useCreatorMultisigSubmit` |
| `cctp.ts` | Multichain USDC deposits (Circle CCTP V1), source-chain config + keeper protocol | **A** (EVM side reusable) | `SOURCE_CHAINS`, `suiAddressToBytes32`, `TOKEN_MESSENGER_ABI`, `notifyKeeper`, `pollDeposit`, `humanWait` |
| `cctpSolana.ts` | Solana depositForBurn instruction (Anchor, PDAs, buffer-free) | **A** | `buildDepositForBurnIx`, `solPdas`, `suiAddressToSolanaPubkey` |
| `sui/btcOnramp.ts` | hBTC→quote swap folded into the bet PTB (atomic "bet with Bitcoin") | **S** (seam concept **A**) | `appendBtcSwap`, `buildBetWithBtc`, `buildFundAccountFromBtc` |
| `sui/tradingVaultClient.ts` | Trading Balance vault PTBs: deposit/withdraw/private/agent budgets/leverage open/credit | **S** | 25+ builders, `TRADING_VAULT_EVENTS` |
| `sui/vault624Client.ts` | Copy-trade + trade-from-X vaults: deposit/withdraw/subscribe with risk caps, ledger reads via simulation, per-desk event feed | **S** (risk model **P**) | `VAULT624`, `VAULT624_TWEET`, `buildJoinDesk624`, `buildEnableTweetTrading624`, `fetchLedger624`, `fetchSub624`, `fetchRisk624`, `fetchVaultTrades624`, `VAULT624_ERRORS`, `friendlyVault624Error` |
| `privateBet.ts` | Private bets via enclave desk: signed auth message, bearer claims, local ticket store, export/import backup | **A** (protocol **P**) | `openPrivateBet`, `cashOutPrivateBet`, `withdrawPrivateBalance`, `verifyClaim`, `exportClaims`/`importClaims`, `openAuthMessage`, `MIN_PRIVATE_STAKE` |
| `sui/privateBudget.ts` | Allowance vault: user's money, desk gets revocable allowance, null-vs-zero reads | **S** (model **P**) | `buildFundPrivateBudgetTx`, `buildRevokePrivateBudgetTx`, `fetchPrivateBudget` |
| `sui/leverageClient.ts` | Underwriting-reserve leverage: escrow→fill, permissionless settle, health math, reserve stats | **A** (health math **P**) | `requestOpenBinaryTx`, `settleTx`, `computeLeverageHealth`, `computeReserveStats`, `supplyPositionValue`, `PositionData`, `LeverageHealth` |
| `sui/leverageHooks.ts` | Reserve stats / my positions / my orders (chain+local merge) / live health | **A** | `useReserveStats`, `useMyPositions`, `useMyOrders`, `useLeverageHealth` |
| `leverageLocal.ts` | Local pending-order cache (24h TTL, dedupe by digest) | **P** | `loadLocalLeverageOrders`, `recordLocalLeverageOrder` |
| `sui/parlayClient.ts` | Parlay pricing (joint prob, correlation surcharge, house margin) + open/resolve/claim builders | **P** (math) / **S** (tx) | `quoteParlay`, `openParlayTx`, `resolveLegTx`, `claimParlayTx`, `ParlayQuote`, `decodeParlayStatus` |
| `sui/parlayHooks.ts` | My parlay tickets from events + object reads, live leg status | **A** | `useMyParlays` |

### Alerts, shares, misc UI infrastructure

| File | Purpose | Port | Key exports |
|---|---|---|---|
| `priceAlerts.ts` | localStorage price alerts + matching + Web Notifications | **P** | `addAlert`, `checkAlerts`, `requestNotificationPermission`, `sendNotification` |
| `favorites.ts` | localStorage favorite-market set | **P** | `loadFavorites`, `toggleFavorite` |
| `hooks/useKeyboardShortcuts.ts` | Key→action map, ignores form fields | **P** | `useKeyboardShortcuts` |
| `hooks/usePoll.ts` | Visibility-aware polling (hook + non-hook forms) | **P** | `usePoll`, `pollWhileVisible` |
| `hooks/useBtcPrice.ts` | ONE shared Pyth Hermes SSE stream, refcounted, backoff+jitter, hidden-tab disconnect | **P** | `useBtcPrice(): {price, change24h, connected, …}` |
| `shareCard.ts` | Settled-trade PNG receipt (1200×1500 canvas), honesty rules per redemption kind | **P** | `renderTradeShareCard`, `buildTradeTweetText`, `fmtPnl`, `tradeBandLabel`, `fmtLeverage` |
| `openBetShareCard.ts` | Open-position "The Call" PNG + tweet text (conditional framing only) | **P** | `renderOpenBetShareCard`, `buildCallTweetText`, `callBandLabel`, `OpenBetCard` |
| `charts/canvasChart.ts` | Canvas chart system: candles, price line w/ verdict mode + strike line, sparkline, equity curve, probability chart, theme-aware ink, stick-figure duel | **P** | `drawPriceLine`, `drawCandles`, `drawSparkline`, `drawEquityCurve`, `drawProbabilityChart`, `priceHistoryToCandles`, `setupCanvas`, `drawDuel` |
| `theme.ts` | Dark/light theme with first-frame init script | **P** | `initTheme`, `toggleTheme`, `THEME_INIT_SCRIPT` |
| `errorMessages.ts` | Raw tx error → actionable copy | **P** (patterns need EVM equivalents) | `humanizeTxError` |
| `animation/useSpring.ts` | Physics spring with velocity inheritance + clamp; two-follower live-price pattern | **P** | `useSpring`, `useLivePrice` |
| `audio/audioUtils.ts` | PCM16 encode/decode for Gemini Live voice | **P** | `createBlob`, `decodeAudioData`, `decode` |
| `sui/hooks.ts` | Legacy hook suite over `predictApi` (oracles, balances, vault stats, protocol stats, leaderboard fetch) | **A**/**D** | `useOracles`, `useDUSDCBalance`, `useTradingVaultBalance`, `useVaultStats`, `useLeaderboard`, `getPositionDirection` |

---

## 3. Deep dives

### 3.1 Market / round model

**Market shape (current venue)** — `Market624` (`predict624Client.ts:133-151`):

```ts
interface Market624 {
  id: string;            // market object id
  expiry: number;        // ms epoch — the "bell"
  minsOut: number;
  cadence: '1m'|'5m'|'1h';
  windowMin: number;     // trading window = expiry − created (≈ 3× cadence)
  tickSize: number;      // 1e9-scaled USD per tick (1e7 = $0.01)
  admissionTickSize: number; // strike grid ($1)
  maxLeverage1e9: number;    // 3e9 = 3×
}
```

**Cadence classification** is derived from expiry alignment, exact by construction
(`inferCadence624`, `predict624Client.ts:172-174`):

```ts
expiryMs % 3_600_000 === 0 ? '1h' : expiryMs % 300_000 === 0 ? '5m' : '1m';
```

This directly maps to DreamDEX's 15m/1h windows: `expiry % 3_600_000 === 0 ? '1h' : '15m'`.

**Market selection**: `pickMarket624({minMinutes:3.5, maxMinutes:11, cadence})`
(`predict624Client.ts:270-281`) — soonest market inside a mintable window, cadence as a *soft*
filter. The mintable window exists because too-close-to-expiry the probability collapses and the
venue refuses to price (see admissibility below). Port the concept: don't offer entry into a
window whose remaining time is under a cadence-dependent cutoff (`minMintMs`,
`ticket624.core.ts:119-123`: 45s for 1m markets, 15s otherwise).

**Positions are ranges with sentinels.** A position is `[lowerTick, higherTick)`;
`lower = 0` means −∞ (a DOWN/UNDER bet), `higher = 2^30−1` means +∞ (UP/OVER), both finite =
RANGE. The full open range is rejected on-chain (`predict624Client.ts:47-54, 664-667`).
Direction extraction is repeated in three places with the same rule
(`pnlCalculator.ts:737-748`, `settledTrade.ts:985`, `hooks.ts:549-556`):

```ts
dir = lower is −inf ? 'DOWN' : higher is +inf ? 'UP' : 'RANGE'
```

**Tick math** (`predict624Client.ts:115-127`): `usdToTick(usd) = round(usd) * 100n` ($0.01 grid,
$1 admission grid), `tickToUsd(t) = t/100`. All probabilities and leverage are 1e9 fixed-point
(`FLOAT_SCALING_624`). DreamDEX prices being probabilities in (0,1) means the same descale
pattern applies — just with whatever fixed-point the contract uses.

**The strike line** (the market's question). Two mechanisms:

1. `strike624(spot)` (`ticket624.core.ts:194-206`) — snap spot to a **$100 grid**, same line for
   both sides. The comment documents two real bugs this fixed: per-side snapping made the two
   sides price to a 147c book, and a spot±$20 line rewrote the question on every refresh. Rule to
   keep: *the line is a function of the market, not of when you looked*, and both sides ask the
   same question.
2. `getCanonicalMarketLine` (`marketLine.ts:347-385`) — priority order for choosing a line:
   explicit strike → **previous settlement price of the same asset** (the "last close" is the
   natural line for an Up/Down window — DreamDEX 15m windows likely settle vs. open/lock price,
   so this is directly relevant) → live reference price → grid fallback. Returns the source so UI
   can label it.

**Countdown / time helpers** (`roundHelpers.ts:207-251`): `getTimeRemaining` returns *total*
hours; `formatCountdown` is day-aware (≥1d → `23d 00h 42m`, <1d → `HH:MM:SS`, <1h → `MM:SS`).
Portable verbatim.

**Grouping**: `groupOraclesByTimeframe` (`roundHelpers.ts:269-291`) buckets markets into
expiringSoon (≤15m) / nextHour / later — a direct fit for a 15m/1h lane UI.

**Spot price**: two sources, deliberately the *settlement* feed rather than a generic price API —
`fetchSpot624`/`fetchPythHistory624` (`predict624Client.ts:321-365`) reads the same Pyth feed the
market settles on ("the more honest number", `onchainSpot.ts:900-902`), with a 3s TTL cache.
`useBtcPrice` (`hooks/useBtcPrice.ts`) is the UI-grade live stream: **one module-level SSE**
connection to Pyth Hermes shared by all consumers via refcount, exponential backoff with jitter
capped at 30s, and disconnect on hidden tab. This file is 100% portable and directly usable for
Somnia (same Hermes endpoint, add the ETH feed id).

**Quoting — the core pattern to port.** There is no price formula in the client; the quote is a
**simulation of the exact order transaction**, reading the venue's own emitted event:

- `quoteMint624` (`predict624Client.ts:915-956`): build the real mint with *uncapped* guards
  ("a quote must never abort on cost, it is only reading a price"), simulate, read `OrderMinted`:

  ```
  cost   = net_premium + (trading_fee − fee_incentive_subsidy + builder_fee) + penalty_fee
  entryProb = entry_probability / 1e9
  financed floor = entryValue − netPremium ;  win = qty − floor
  ```

- `quoteOddsCents624` (`predict624Client.ts:981-1040`): **display odds as cents per $1 payout**
  = `round(allInCost / quantity * 100)`, clamped to [1,99]. This is exactly a probability price
  and is the number to show on an Up/Down board. It also *funds the account inside the simulated
  tx* so the quote describes a placeable bet even for an empty account.
- `probeCombinedMint624` (`predict624Client.ts:849-901`): for users with no account yet, dry-run
  the combined create+fund+mint PTB with a fixed probe size and read the real entry probability —
  then size the real bet from it.
- `quoteWithPremiumFloor` (`ticket624.core.ts:433-445`): if the venue refuses to even *price*
  a size below its minimum premium, probe upward (×3 per attempt, ≤5 attempts) until it prices,
  then re-size exactly from the returned probability. Solves the "need prob to size, need size to
  get prob" chicken-and-egg.

On EVM this whole family becomes `eth_call`/`staticcall` of the order-placement function (or a
dedicated quoter view on the DreamDEX order book), decoding the same fields from the simulated
event/return values. The *discipline* — never estimate, always simulate the real call with
uncapped slippage guards, and derive display odds as cost-per-unit-payout — ports unchanged.

**Stake-first sizing** (`ticket624.core.ts:129-158`) — users enter a stake; the venue parameter
is a payout quantity:

```ts
qty  = quantize(stake · lev / prob)                       // qtyForStake
win  = qty · (1 − prob·(1 − 1/lev))                       // winForQty (payout minus financed floor)
minQty = ceil(1.02 · lev / prob)  rounded up to lot       // clears the 1-unit min-premium floor
```

**Admissibility** (`ticket624.core.ts:163-179`): the venue only prices entry probabilities in
[1%, 99%]; the client uses [2%, 97%] (`MIN_ENTRY_PROB`/`MAX_ENTRY_PROB`) "so the odds can drift
while someone signs". A deep-ITM side near expiry becomes inadmissible — expect the same on any
oracle-settled short window and gate the UI accordingly.

**The place-bet guard** (`placeMint624`, `ticket624.core.ts:363-417`): re-quote at the moment of
click, then submit with ONE user-legible cap — `maxCost = min(balance, freshCost ×
costCapBuffer(cadence))` where the buffer is cadence-scaled (`1m: 1.6, 5m: 1.2, 1h: 1.1`,
`ticket624.core.ts:351`) because short markets move more during the ~10s a human takes to approve
a wallet popup. The user still pays the exact measured cost; the cap only absorbs sign-time
movement. `maxProb` is left at protocol max because a second guard duplicated the first and
"was sniping signers mid-popup". Port this verbatim as slippage handling.

**Live quote loop** (`useMintQuote624`, `ticket624.ts:937-1025`): debounce input 350ms, re-quote
every 12s, keep showing the previous quote while a refresh loads (only a change of *bet identity*
blanks it), read spot/band/leverage from refs so a 5s spot poll doesn't tear the effect down.

**SVI pricing (legacy but reusable math)** — `sviPricing.ts`. Binary price
`P(settle > K) = N(d2)` with `d2 = −(k + w/2)/√w`, `k = ln(K/F)`,
`w(k) = a + b(ρ(k−m) + √((k−m)² + σ²))` (`computeSviPrice`, lines 475-498); range price =
difference of two digitals (`computeRangePrice`); implied vol read back off the same surface
(`impliedVolAnnual`, `sviSmile`) — lets a probability venue render a real vol smile/term
structure. Fee model (`computeFeeBreakdown`, lines 622-653):
`fee = max(baseFee·√(p(1−p)), minFee) + baseFee·utilMult·(liability/balance)²` — a Bernoulli
spread plus utilization surcharge; a good default AMM-ish fee model if DreamDEX pricing needs a
client-side estimate.

**Settlement** (`settlement.ts`): the winner predicate is pure and portable
(`isWinningRange`, lines 907-918): `settle ≥ lower && (higher == +inf || settle < higher)` —
lower-inclusive, upper-exclusive. The read half documents a trap worth remembering on any venue:
a live market can carry a non-null "settlement-ish" field (it tracks spot), so *only* an explicit
optional/flag distinguishes settled from live (lines 850-855).

### 3.2 Position tracking & portfolio

**Three layers of position truth**, from fastest to most durable:

1. **Local echo** (`roundHelpers.ts:67-114`, `positionStorage.ts`, `leverageLocal.ts`,
   `privateBet.ts` tickets) — localStorage records written at submit time for instant UI, with
   claimed-flags and TTL cleanup. Merged with chain data and dropped once the chain confirms
   (`useMyOrders` matching logic, `leverageHooks.ts:1205-1223`).
2. **Event-derived open positions** (`fetchOpenPositions624`, `predict624Client.ts:1282-1302`):
   open = minted events minus any `*_redeemed` event for the same `(marketId, orderId)`.
   The event feed row shape is `OrderRow624` (`predict624Client.ts:1305-1323`): kind
   (`order_minted` | `settled_order_redeemed` | `live_order_redeemed` |
   `liquidated_order_redeemed`), ticks, qty, leverage, entry prob, net premium, payout,
   settlement price, digest. **The three redemption kinds are load-bearing** — settled at oracle
   vs cashed out early at live price vs liquidated — and every downstream surface (receipts,
   share cards, PnL) must label them honestly.
3. **Durable ledger** (`history729.ts`): per-expiry summary rows
   `{grossPaidMicro, grossReceivedMicro, feesMicro, openCount, netMicro, expiryMs}` read from the
   account's own storage. Two properties the file header calls out: it **survives redemption**
   (position rows get deleted when claimed; an auto-claiming keeper makes "read the positions
   table" show winners as "no bets") and it is **not an event index** (which prunes on a rolling
   window). On an EVM chain the equivalent is either a contract-side per-user aggregate, or your
   own indexer over full historical logs — do *not* build portfolio history on a pruned/windowed
   log query. `summarise` (lines 1126-1140) rolls up totals, counting **only fully-closed rows
   toward net** — "unsettled expiries have received=0 by definition, so folding them in would
   read as a loss on every open position."

**Settled-trade join** (`settledTrade.ts:968-1004`): match `order_minted` + `*_redeemed` on
orderId → `SettledTrade{dir, lowerUsd/higherUsd (null = infinite side), stakeMicro=netPremium,
qtyMicro, leverageX, payoutMicro, pnlMicro = payout − stake, settlementUsd, settledAtMs (claim
time!), expiryMs (oracle time, resolved separately), digests, kind}`. Unmatched redeems are
*skipped, never guessed*. Note the field-comment discipline: `settledAtMs` is when the claim tx
landed, NOT the oracle print time; renderers must not conflate them (lines 946-953).

**Unrealized PnL** (`pnlCalculator.ts:756-804`): mark price from the pricing surface (SVI here;
on DreamDEX, the live book mid or last trade), `uPnL = (mark − entry) · qty`,
`uPnL% = (mark − entry)/entry · 100`; DOWN mark = `1 − P(above)`; RANGE mark =
`P(above lower) − P(above higher)`. **Realized PnL timeline** (lines 813-848): sort trades by
time, FIFO-queue mint costs per `(market, strike, direction)` key, on each redeem shift a cost
and emit `{timestamp, pnl, cumPnl}` — feeds the equity chart.

**One money figure** — the portfolio's core UX decision, implemented twice:

- `useAccount624` (`ticket624.ts:734-927`): `totalDusdc = wallet + trading account`, but with
  `totalReady` (both halves read) and `totalUnknown` (nothing live *and* nothing cached) so the
  UI never asserts a half-loaded sum; last confirmed total is cached per owner
  (`readTotalCache`/`writeTotalCache`, `ticket624.core.ts:96-110`) and shown while loading.
  Account ids are deterministic → cached forever and hydrated synchronously
  (`readAccountCache`, lines 68-90) which removed ~4.3s of per-navigation discovery.
- `useMoney` (`portfolio/useMoney.ts`): the generalization. Returns the one honest spendable
  number (`readyToBetDusdc` = pools one signature can spend) and every *other* pool as a
  labelled row `Pool{label, note (what it's for + who can move it), amountDusdc (null ≠ 0),
  action | blockedReason}`. It deliberately does NOT sum segregated pools "because money in the
  X ledger cannot be bet on the web" — showing them as one number would be a lie. Port this
  shape directly (wallet balance / in-contract balance / any bot-budget pool).
- `computeTradingAccountSnapshot` (`tradingAccount.ts:88-112`): pure combiner —
  `yosukuBalance = tradingAccountValue + private + (leverageLocked + leverageEquity) + agentAllocation`,
  `normalOpenValue = accountValue − available`. Portable as-is.

**Trader analytics** (`computeTraderEdge729`, `traderEdge729.ts:313-398`) from settled ledger
rows only:

```
wins/losses:   netMicro > 0 / < 0 (per settled expiry)
netDusdc, stakeDusdc, feesDusdc
roiPct        = net / stake · 100          (null if no stake)
winRatePct    = wins / (wins+losses)       (null if none)
profitFactor  = grossProfit / grossLoss    (null before first loss — "does not invent")
expectancy    = net / settledRounds
avgWin/avgLoss
maxDrawdown   = max(peak − cumulative) over chronological equity walk
bestWinStreak
equity[]      = [{atMs, valueDusdc}] starting at (null, 0)
windows       = 4 local-time-of-day buckets (00-06/06-12/12-18/18-24) with count/wins/net
bestWindow    = most-profitable populated window
readout       = one honest sentence (needs ≥5 settled rounds before claiming a pattern)
```

Undated rows stay in totals but are excluded from time windows (pinned by test,
`traderEdge729.test.ts:460-467`). Entirely chain-free — port unchanged, feeding it rows built
from DreamDEX settlement events.

**Leaderboard engines** — two, both pure and both worth porting:

- `computeLeaderboard` (`leaderboardEngine.ts:567-678`) — the *exact* engine for venues with
  global mint/redeem feeds. Pipeline: dedupe events by `event_digest` (fallback composite key) →
  sort by time → build FIFO lot queues per position key `(manager, oracle, expiry, strike,
  is_up)` → for each redeem, allocate against lots **in bigint** with proportional cost
  (`allocate`, lines 554-560: `cost = lotCost · qty / lotQty` — no float drift) → window-filter
  on redeem time (mints outside the window still supply cost basis!) → group split redemptions
  of one market call into one "call" (`callKey` = owner+market+expiry+strike+side) → per owner:
  `pnl = Σpayout − Σcost`, `roi = pnl·10000/cost /100`, winRate over calls, streak counted only
  across *settled* calls, `volume = Σcost`. Tie-break sort: pnl → roi → tradeCount → owner.
  Unmatched redemptions are counted and reported, never assumed cost 0.
- `computeLeaderboard624` (`leaderboard624.ts:968-1040`) — the engine for account-scoped order
  feeds: group rows by `position_root_id` into `Root{premium, payout, hasMint, redeemed,
  settled, lastRedeemMs}`; a ranked "call" requires both a mint in the fetched window and a
  redeem inside the time window; same ranking fields as above. Simpler (no partial-lot math)
  because the feed links closes to their mint. **For DreamDEX, this is the one to start from**:
  orderId ≈ position_root_id, `OrderFilled`/`Settled` events ≈ the rows.

**Badges** (`badges.ts:1053-1110`): first_trade (any position), Hot Streak (3 consecutive wins
counted from most recent settled), LP Provider (LP balance > 0), Whale (volume ≥ 1000),
Oracle (win rate ≥ 70% with ≥ 10 settled). **Reputation tiers** (`predictionContract.ts:2307-2345`):
Novice/Trader/Whale/Oracle by (minBets, minWinRate) with fee/bonus percentages and progress to
next tier. Both pure.

**Daily stop** (`dailyStop.ts`): per-browser max daily loss. `recordPnl(delta)` accumulates net
realized PnL under a `YYYY-M-D` key (auto-resets at local midnight); `getTodayLoss()` returns
`max(0, −net)`; `useDailyStop` polls every 15s and exposes `stopHit = limit !== null && todayLoss
≥ limit` — the trade panel refuses new entries when hit. Call `recordPnl` at cash-out and at
settlement claim. Fully portable, and a genuinely good feature for a 15m-cadence market.

**CSV export** (`csvExport.ts`): straightforward; note proper quote-escaping and blob download.

### 3.3 Social / agent features

**Takes** (skin-in-the-game posts): two-part design worth keeping —

- *Content* on cheap durable storage (`takes.ts`): a small JSON (`Take{v, author, kind, dir,
  strike/band, marketId, orderId (the proof-of-position), stake, caption ≤240, expiryMs, ts}`)
  PUT to Walrus (30-epoch retention); content-addressed so identical takes dedupe and the read
  cache is *forever* (`takes.ts:90-93`). On Somnia: IPFS/Arweave/S3 or even calldata — the
  interface is just `writeTake → blobId`, `readTakes(blobIds)`.
- *Discovery* on-chain (`takeBoard.ts`): `post_take(blobId, marketId, orderId, side, strikeUsd)`
  emits `TakePosted`; the feed reads the event stream, renders the verifiable spine (author,
  backing order id, side, strike, digest → `backed` badge when orderId ≠ 0) and hydrates
  captions best-effort — a missing blob still renders from on-chain fields. On EVM this is a tiny
  contract with one event, or even just an indexed log from your main contract.

**X account linking** (`xLink.ts` + `claimOAuth.ts` + `xHandle.ts`): wallet↔handle binding via a
signed plain-text message (`xLinkMessage` — human-readable on purpose, the wallet prompt names
the action); server session = HMAC-signed cookie carrying the OAuth-verified `authorId` (never
client-supplied; no default secret — refuses to run without one, `claimOAuth.ts:350-364`);
`resolveXHandle` caches wallet→handle lookups for the page lifetime, and **does not cache
failures** ("a failed lookup is NOT proof of unclaimed"). The unlink message explicitly states
funds are unaffected. All portable (the on-chain HandleRegistry becomes a mapping contract or a
DB row).

**Claim flow** (`claim.ts`): tweet-funded auto-accounts are claimed by proving handle ownership
(tweet "@yosuku0 claim <wallet>"), after which only the bound wallet can decrypt the account's
withdraw key (Seal, gated on the on-chain binding) and sweep funds. Sui/Seal-specific; on EVM
the equivalent is a custodial relayer with a signature-gated `claim(handleProof, wallet)`.

**Strategies / copy-trading** (`strategyClient.ts`) — the model:

- A `Strategy` = agent address + hard risk caps (max leverage, max margin) + sub fee +
  optional Seal-encrypted playbook + optional memory pointer. Subscribers pay the fee and grant
  the agent a bounded allowance over their own vault balance; **every position the agent opens
  is owned by the subscriber and force-pays them on exit** ("no-divert") — the creator can never
  touch funds. This custody invariant is the whole product and must be reproduced in any port.
- Strategy *logic* is DATA, not code (`StrategySpec{preset: momentum|reversion, lookback,
  thresholdBps}`, lines 39-66) so an attested engine stays attestable; `describeSpec` renders it
  as one honest sentence.
- Catalogue is read from **objects, not events** (lines 625-676) — the event index is a rolling
  window and silently emptied the page; objects are the source of truth for "what exists".
  (EVM parallel: enumerate from contract state / a subgraph, not from a bounded `eth_getLogs`
  window.)
- Performance: `CopyTraded` events → per-strategy volume/capital/distinct subscribers/lastActive;
  realized PnL joins copy events → margin `OrderRequested` → `PositionOpened` → `Closed`/
  `Liquidated` through digest and order/position ids (lines 475-535), producing
  `StrategyExit{ts, margin, returned, pnl, liquidated}` for equity curves.
- **Scoring** (`strategyScore`, lines 182-198) — portable heuristic:
  `12·copyTrades + 10·distinctSubs + 6·subs + 5·capitalCopied + 2·volumeCopied + 14·hasMemory +
  8·hasCapsule + recencyBonus(12 − daysSinceActive) + (realized: 20·pnl + 8·wins − 4·losses −
  12·liquidations)`. Agent leaderboard is ranked by capital entrusted + executed trades,
  **deliberately not win-rate** ("a vanity metric", lines 744-749).
- `codenameFromAddress`/`glyphFromAddress` (lines 926-944): deterministic human name + glyph per
  address; `xHandle.ts` replaces the codename with the real bound handle where one exists —
  "an unclaimed agent should look unclaimed".

**Seal capsules** (`strategySealClient.ts`, `memoryMarketClient.ts`): paywalled content =
ciphertext on Walrus + on-chain `seal_approve` policy that key servers dry-run before releasing
shares (the four assertions ARE the paywall). Notable durability lesson repeated in both files:
a 5-epoch blob expired and 18 paying readers lost access — *storage retention is owed work*, and
`capsuleIsLive` (HEAD probe) gates every "Read" button because an expired blob is
indistinguishable from a never-written one. Provenance is a plain address comparison against the
attested enclave key (`provenanceOf`), with honest buyer-facing copy for both states. The Seal
mechanics are Sui-specific (Lit Protocol or a TEE-held key would be EVM equivalents), the product
logic (paywall = on-chain readable policy; provenance = attested key comparison) ports.

**MemWal** (`memwal.ts`): server-only agent memory, namespaced per user, and **never throws** —
memory enriches when present, never blocks the assistant. Good pattern for any bot memory.

**Rooms / comments** (`comments.ts`, `useCommentRoom.ts`, `roomDelegate.ts`): position-gated
per-market chat. Architecture:

- Gate: `bet_registry::record(marketId)` is **folded into every bet PTB** (atomic with the mint —
  the flag only sets if the bet lands; `predict624Client.ts:605-623`) and `has_bet(user, market)`
  is the read the room checks. Quotes exclude the record call so a foreign package outage can't
  blank the odds board (`withRoomsGate: false`, line 655-661).
- Membership/messaging: encrypted group via Seal + a messaging SDK + relayer. zkLogin signatures
  are rejected by that stack, so each user gets a persisted **Ed25519 delegate keypair** that
  does all messaging while the real wallet remains the gate identity (`roomDelegate.ts`).
- `useCommentRoom` drives the state machine `connect → locked → joinable → joining → joined`,
  with an important product fix: the round you clicked is not always the round you bet (tickets
  auto-roll near expiry), so the gate checks `[marketId, ...alsoTry]` and the room joined is the
  market the gate actually cleared (lines 827-837).
- Portable pieces: the gate concept (record-on-bet → `hasBet` view), the state machine, and
  `joinRoom`'s idempotency handling (an "already present" abort is success, lines 766-777).
  The Seal/relayer stack itself should be replaced (or dropped for a hackathon; a plain
  websocket room gated by `hasBet` gets 90% of it).

**Traction** (`traction.ts`) — honest metrics engine; even if not ported, the rules are worth
keeping: separate **adoption** (distinct external wallets whose gas you sponsored, minus your own
infra wallets, minus farm wallets that only did pool actions) from **capability** (your own demo
runs, labeled); walk *full* history not a window (a backward-walking cap makes cumulative counts
go *down*); volume rides on the same tx walk as the user count so the two can't disagree; volume
is never shown without the bettor-count denominator; cumulative counters hold a localStorage
high-water mark keyed by definition version (`monotonic`, lines 1782-1812).

**Waitlist** (`waitlist.ts`): on-chain signed joins; referral-weighted rank = referrals DESC then
join order ASC, computed from `Joined{who, referrer, position}` events; top 100 = Founders.
Trivially portable to an EVM contract with one event.

**Creator economics** (`creatorCode.ts`): creators mint a fee-attribution object **owned by their
own wallet**; the bet path re-stamps the creator code before *every* mint so "the creator whose
call prompted THIS bet is the one paid, not whoever recruited the user months ago"
(`predict624Client.ts:442-465, 668-671`); fees settle protocol-side and only the owner can claim
("the creator's cut never passes through Yosuku"). If DreamDEX has any referral/affiliate fee
field on orders, the same last-writer-before-order attribution model applies.

### 3.4 Money rails

**Gas sponsorship** (`sponsor.ts` + `useSmartSubmit.ts`) — the app's single submit path:

1. Try sponsored: build tx, set sponsor as gas owner, **pin one random gas coin from the sponsor
   pool** so concurrent sponsored txs don't collide on the whole coin set
   (`pickSponsorGasPayment`, `useSmartSubmit.ts:195-215`), sign the **finished bytes** (letting
   the wallet re-resolve replaced the sponsor with the sender — lines 249-257), POST to the
   sponsor for co-sign+execute.
2. On failure, classify: a MoveAbort or user rejection is surfaced immediately ("don't make the
   user sign a SECOND doomed popup"); only *sponsor-side* issues fall through to wallet-paid gas,
   with a clean rebuild via the **tx factory** (callers pass `() => Transaction`, never a built
   tx). The remembered `lastSponsorFailure` is appended to the wallet-path "no gas" error so the
   user sees the real first cause (lines 296-317).
3. `submitAs(signer, factory)`: sponsored-only submit for delegate keypairs that hold no gas.
4. Decline messages: the sponsor returns every policy's verdict; `nearestPolicyRefusal`
   (`sponsor.ts:51-56`) filters out "move call not allowed" (policies that simply don't cover the
   call) and surfaces the near-miss; the console always gets the untruncated verdict list; an
   "unconfirmed" response that carries a digest is treated as submitted (retry could
   double-execute, lines 80-84).

On Somnia: this whole layer maps to ERC-4337 paymaster / a relayer service. Keep the structure —
sponsored-first with transparent fallback, factory-based rebuilds, doomed-popup avoidance,
`walletOnly` escape hatch for calls you know the policy won't match — and swap the transport.

**Deposit/withdraw + one-signature composites.** The venue account is a deposit-based balance
(like DreamDEX's likely deposit/withdraw model). The high-value composites, all single-signature:

- `buildCreateFundAndMint624` (`predict624Client.ts:709-783`): create account + deposit + first
  bet + share, atomically — "a brand-new user goes connect → one tap → first bet, gas-free."
  Cost is bounded by the deposit; the whole tx reverts if it can't fit, so funds are never
  stranded.
- `buildTopUpAndMint624` (lines 792-837): deposit only the shortfall + bet, when balance < stake.
- `placeFirstBet624`/`placeTopUpAndBet624` (`ticket624.core.ts:517-681`): the orchestration —
  deposit = stake × cadence buffer capped at wallet, probe the real entry probability with the
  combined dry-run, size qty from it, cap cost at the deposit/post-deposit balance.
- Dual money pools: Sui holds funds as coin objects AND an address balance; `spendDusdc`
  (`predict624Client.ts:541-551`) covers both. EVM has no such split (ERC20 balance is one
  number), so this complexity disappears — but the *gate on what the wallet holds, not how it is
  stored* comment (`ticket624.ts:880-886`) is a good reminder to check allowance + balance
  together.

**Cross-chain deposits** (`cctp.ts`, `cctpSolana.ts`): burn USDC on a source chain naming the
destination address; Circle attests after finality; a keeper submits the receive so the user
never needs destination gas. Client protocol: `notifyKeeper(domain, txHash)` fire-and-forget,
`pollDeposit` → `unknown | pending{etaSeconds} | failed | delivered{digest}`; `cctpConfigured()`
hides the card entirely when no keeper is wired ("a burn with no keeper behind it leaves USDC
stranded"). Chains are ordered fast-first and finality times are shown honestly (`humanWait` —
"users forgive a wait they were told about"). For Somnia, the EVM source-chain half
(approve + `depositForBurn`) is directly reusable if CCTP supports the chain; otherwise this
becomes your bridge widget with the same status-machine UI.

**BTC on-ramp** (`btcOnramp.ts`): a swap **as a seam inside the bet tx** — hBTC in, quote asset
out, deposit + mint in the same atomic tx; failure reverts everything so "the Bitcoin never left
the wallet". The file holds NO copy of the mint chain (delegates to `buildCreateFundAndMint624`).
EVM equivalent: multicall [swap → deposit → placeOrder] through a router. Drop unless needed.

**Vaults**:

- `tradingVaultClient.ts` — a "Trading Balance": fund once, then trades/cashouts/leverage/agent
  budgets debit/credit the same account. Includes agent allocations with hard caps
  (`allocateAgentBudgetTx`: maxTrade, maxLeverageBps, maxDailyLoss, expiry) and credit paths so
  a cash-out lands in the trading balance in the same tx as the redeem
  (`redeemPositionToTradingBalanceTx`, `predictClient.ts:1639-1674`).
- `vault624Client.ts` — the copy-trade vault. Per-user ledger inside one shared vault; subscribe
  binds ONE agent under caps (`buildSubscribe624`: maxMargin, maxLeverage, maxTotalExposure,
  maxOpenPositions, maxDailySpend); agent has **no funds-out path**; settle is permissionless
  and force-credits the owner; withdraw pays `msg.sender` only. Abort codes are a stable API
  (`VAULT624_ERRORS`, lines 72-84: "no active subscription", "over your leverage cap", …) with
  `friendlyVault624Error` mapping. Two separate vault instances keep the copy-desk and
  trade-from-X products from clobbering each other's one-agent subscription (lines 52-66).
  The event-feed reader queries **transactions that touched the vault object** rather than the
  package-scoped event index, because events carry no vault field and the index prunes
  (lines 497-560) — then filters trades by desk agent, joins settles via order ids, and keeps
  deposits only for users the desk traded for (lines 648-669). The risk-cap model and the
  "desk record must be provably this desk's" filtering are the portable parts.

**Leverage** (`leverageClient.ts` + `leverageHooks.ts` + `leverageLocal.ts`): the reserve is the
counterparty — trader posts margin, reserve fronts the rest and charges an upfront premium;
**trader has no debt (max loss = margin)**; open is escrow→keeper-fill (cancel reclaims margin);
close is a permissionless 3-step (redeem → withdraw → settle) that always force-pays the owner.
Health math (`computeLeverageHealth`, lines 921-958) is pure and portable:

```
debt            = fronted
maintenance     = max(0.02, debt × 10%)
requiredRepay   = debt + maintenance + keeperFee(0.01)
healthBps       = redeemValue / requiredRepay × 10000
status: > 11000 safe · ≤ 11000 watch · ≤ 10000 liquidatable · null unknown
equity          = redeemValue − debt
```

`redeemValue` comes from the live redeem quote (`useLeverageHealth` → `fetchOnChainQuote`).
Note the current venue also has **native leverage in the mint itself** (`leverage1e9` parameter:
financed floor, win pays `qty − floor`, liquidation emits `liquidated_order_redeemed`) — if
DreamDEX has margin/leverage natively, the ticket-side sizing (`qtyForStake`, `winForQty`) is
what you need; the underwriting reserve is only for venues without native leverage.

**Parlays** (`parlayClient.ts`) — the odds math is pure gold for a hackathon feature and fully
portable (lines 1408-1473):

```
p_i        = per-leg fair win prob = live quote of 1.0 contract (the digital price)
raw        = Π p_i
combined   = correlated (≥2 legs share an oracle/asset)
             ? max(raw, λ · min_i p_i)          λ = 0.40 correlation floor
             : raw
fixPayout: stake = ceil(maxPayout · combined · (1 + margin))       margin = 12%
fixStake:  maxPayout = floor(stake / (combined · (1 + margin)))
multiplier = maxPayout / stake                                     (the big ×N)
```

Rounding directions are chosen so the reserve is never short (ceil the stake, floor the payout).
Contract model: reserve pre-funds `maxPayout` into ticket escrow at open (can never be short);
legs resolve permissionlessly the moment each window settles; first losing leg kills the ticket;
all-won claim force-pays the owner. On DreamDEX: legs = Up/Down positions across different 15m/1h
windows; same-asset-same-window legs are perfectly correlated → the λ-floor surcharge (or just
forbid same-window legs).

**Private bets** (`privateBet.ts` + `privateBudget.ts`): privacy = someone else submits your bet.
Funding is non-custodial: stake sits in the user's own allowance vault (`private_budget`:
deposit + allocate in ONE tx so "money in but desk can't touch it" can't happen; withdraw is
owner-only and needs no desk cooperation; revoke leaves the balance). The desk returns an
**enclave-signed bearer claim** (`ticketHex` + `signatureHex`) that IS the position's ownership
proof — the desk keeps no owner records; cash-out presents only the claim ("sending owner would
be theatre — the desk reads the owner out of the signature"); `verifyClaim` checks the signature
locally against the pinned enclave key; `exportClaims`/`importClaims` handle the
lost-browser risk, with existing-claims-win merge so a stale backup can't roll a cashed-out
ticket back to open. The auth message (`openAuthMessage`, lines 564-580) is deliberately
human-readable and must remain byte-identical to the server's verifier. `MIN_PRIVATE_STAKE`
documents deriving the product minimum from the venue minimum + desk fee headroom (lines
550-559). This whole protocol is chain-agnostic; only the desk's execution layer changes.

### 3.5 Alerts / shares / UI infrastructure

**Price alerts** (`priceAlerts.ts`): `PriceAlert{id, asset, targetPrice, direction, createdAt,
triggered}` in localStorage. Matching (`checkAlerts`, lines 933-951): for each untriggered alert
with a known current price, `above: price ≥ target`, `below: price ≤ target`; triggered alerts
are marked (fire-once) and returned for notification. Delivery = Web Notifications API with
permission request. Wire it to the `useBtcPrice` stream on a poll. Fully portable; extend `asset`
to ETH.

**Share cards** — offscreen-canvas PNG renderers, no server:

- `shareCard.ts` (settled receipt, 1200×1500 @2x): PnL as the giant focal number; **hard honesty
  rules** in the header (lines 10-17): oracle-settled label + settlement price only for
  `settled_order_redeemed` with a real print; `live_order_redeemed` says "CASHED OUT · LIVE
  PRICE"; liquidations muted; the oracle *second* only asserted when the real `expiryMs` is
  held (claim time ≠ print time); no fabricated sparklines; win = brand heat, loss = drained ash
  ("never green, never red"). Real tx digests on the card + "verify on explorer".
  `buildTradeTweetText` builds the matching post text from the same fields.
- `openBetShareCard.ts` ("The Call", for open positions): input `OpenBetCard{kind, dir/band,
  stakeDusdc, winDusdc, lev, expiryMs, digest}`; return framed **conditionally only** ("→ WIN",
  "IF IT LANDS"); leverage > 1 always carries the knockout caveat; settle time is the absolute
  UTC second (never a relative countdown that goes stale when shared).
  Both are portable with a palette/name swap and explorer-link change.

**Charts** (`charts/canvasChart.ts`): DPR-aware canvas setup; `priceHistoryToCandles` (time
buckets, carry-forward `flat` candles rendered as neutral doji dashes — "the price held, it
didn't go green and it didn't vanish"); `drawPriceLine` with **verdict mode** (line paints green
above the strike / red below via two clipped passes — the chart answers "who's winning right
now"), dashed strike line with a left-anchored pill, range-band shading, right-axis price labels,
theme-aware ink resolved from each canvas's *own surface luminance* (a dark card inside light
mode keeps light ink; cached per canvas per theme, lines 1172-1262); `drawEquityCurve` with
dashed zero baseline (feed `traderEdge729.equity`); `drawProbabilityChart` (0-100% with dashed
50% line — directly the Up-probability chart for DreamDEX); `drawSparkline`; and `drawDuel` — a
purely decorative UP-vs-DOWN stick-fighter animation riding the price line whose attacker
follows the tick direction and whose hit numbers scale with the real recent move. All portable.

**Springs** (`animation/useSpring.ts`): fixed-substep integration (stable under tab stutter),
overshoot clamp ("a spring that rings past the value is rendering a trade that never happened"),
rest detection, and **velocity inheritance** (retarget never resets `v`, so same-direction ticks
compound into visible acceleration). `useLivePrice` = the two-follower pattern (stiff dot +
loose line; the gap between them reads as speed; `intensity` drives glow). Portable, and the
right way to animate a live probability/price number.

**Polling/perf infra**: `usePoll`/`pollWhileVisible` (visibility-aware; the header documents the
cost of not having it: a backgrounded tab burned ~130 RPC round-trips/min); `cachedFetch` TTL +
in-flight join (`predict624Client.ts:184-206`); `useKeyboardShortcuts` (ignores inputs);
`theme.ts` (first-frame init script, stored → OS → dark). `errorMessages.ts` +
`friendlyMintAbort` (`ticket624.core.ts:261-310`) are the error-UX layer: every raw failure maps
to one actionable sentence, unmapped ones log the raw and attach a tiny `(ref: fn code)` tag so
a screenshot is diagnosable; `isStaleBundleError` detects an old tab running a stale bundle
(resolution-level type errors) and schedules exactly one reload — but pointedly does NOT match
generic "resolution failed" strings that wrap ordinary aborts.

### 3.6 What the tests pin down

- `predict624Math.test.ts` — lot rounding: stake-derived quantities snap to the 0.01 lot
  (`2/0.55 → 3.64`), every output divides the lot evenly (venue admission), 0/NaN → 0.
- `schemas.test.ts` — the money-path boundary: numeric strings coerce; a non-numeric/null
  required field drops the record (not the list, not a crash); quote schema rejects NaN/negative/
  null costs ("a bad spend cap is dangerous"); position quantity stays BigInt-safe; parseList
  returns `[]` on non-arrays.
- `leaderboardEngine.test.ts` — ranks by realized PnL ignoring open mint spend; FIFO partial
  closes without float drift (bigint proportional allocation: pnl 0.55 / volume 0.65 on a
  1.5-unit close over two lots); split redemptions of one call group into one trade; duplicate
  events dedupe; closes outside the window are excluded; a redeem without a matching mint
  produces NO ranking (counted as unmatched instead).
- `traderEdge729.test.ts` — settled-only stats (open rows counted separately), exact
  roi/profit-factor/expectancy/drawdown/streak on a known sequence; profit factor is null before
  the first loss ("does not invent"); undated rows stay in totals but out of time windows.
- `creatorRecovery.test.ts` — zkLogin public-key flag stripping is verified cryptographically
  (candidate must derive the connected address) and fails closed on mismatch.

The pattern across all five: **tests guard money-path invariants and honesty rules**, not
rendering. Port the first four suites nearly verbatim against the re-implemented modules.

---

## 4. Port plan: reusable-as-is / needs-adapter / drop

### Reusable as-is (copy the file, minimal edits)

Domain math & engines: `predict624Math`, `ticket624.core` sizing/guard half (`qtyForStake`,
`winForQty`, `minQtyMicroForPremium`, `strike624`/`ticks624`, `costCapBuffer`, `estProb`,
`entryProbAdmissible`, `MIN_STAKE`, `friendlyMintAbort` skeleton), `pnlCalculator`,
`settledTrade.joinSettledTrades` + `SettledTrade`, `history729.summarise`,
`leaderboardEngine`, `leaderboard624`, `traderEdge729`, `badges`, `dailyStop`,
`tradingAccount`, `marketLine`, `roundHelpers` (grid + time), `parlayClient` math
(`quoteParlay`), `leverageClient` health math, `sviPricing` (if you want client-side
smiles/fees), `predictionContract` reputation tiers, `settlement.isWinningRange`.

UI infra: `usePoll`, `useKeyboardShortcuts`, `useBtcPrice` (add ETH feed), `priceAlerts`,
`favorites`, `theme`, `animation/useSpring`, `charts/canvasChart`, `shareCard`,
`openBetShareCard`, `csvExport`, `walletExecution`, `positionStorage`, `leverageLocal`,
`oracleCache` (as a generic market-state cache), `schemas` (re-point field names), `claimOAuth`,
`xLink`, `backendUrl`.

### Needs an adapter (keep the interface/logic, swap the transport)

- **Everything that reads chain state**: market discovery (`fetchMarkets624`), spot
  (`fetchSpot624` → Pyth Hermes REST works on any chain), balances, open positions/order feeds
  (`fetchOpenPositions624`/`fetchAccountOrders624` → contract events via viem/wagmi or a
  subgraph), settlement state (`fetchMarketState624`), durable history (`fetchExpiryHistory` →
  your own indexer or contract aggregates).
- **Everything that writes**: the tx-builder families become viem `writeContract` call
  descriptors; the composites (create+fund+mint, top-up+mint, redeem-and-credit) become
  multicalls or purpose-built contract functions.
- **Quoting**: `quoteMint624`/`quoteOddsCents624`/`probeCombinedMint624` become
  `eth_call` simulations (or a quoter view on the DreamDEX book). Keep: uncapped guards in the
  quote, cost = all-in including fees, odds = cost per unit payout, probe-upward for the min-size
  floor, fresh-quote-at-click with the cadence-scaled cost cap.
- **Submit path**: `useSmartSubmit` → paymaster/relayer-first with wallet fallback; keep the
  factory pattern, failure classification, and gas-cause chaining.
- **Hooks**: `useAccount624` (becomes "deposit balance + wallet balance + allowance" with the
  same `totalReady`/`totalUnknown`/cached-total discipline), `useMintQuote624`, `useRounds`,
  `useBell624`, `useMoney`, `parlayHooks`, `leverageHooks`.
- **Social**: takes (swap Walrus → IPFS/S3, take-board event → tiny contract or log),
  `xHandle`/claim-session (server routes), strategy catalogue/scoring (swap event/object reads),
  private-bet protocol (desk API stays; signature scheme → EIP-191/EIP-712), waitlist,
  creator attribution (if the venue has a referral field), traction (subgraph queries).
- `network.ts` — keep the single-switch pattern with a `PREDICT_LIVE`-style capability gate.

### Drop (Sui-only or legacy)

`modernClients`, `jsonRpc`, `predictClient` (legacy 4-16 PTBs), most of `predictApi`/`queries`/
`sui/hooks.ts` (legacy REST era — but keep the *type* shapes `ManagerPositionSummary`,
`ManagerPnLData` as UI contracts if convenient), `useWalletSigner`, `useCreatorMultisigSubmit`,
`creatorRecovery` (passkey+zkLogin multisig — replace with plain EOA/passkey wallets),
`roomDelegate` + Seal messaging internals of `comments`, `strategySealClient`/`memoryMarketClient`
Seal mechanics, `claim.ts` unseal path, `btcOnramp`, `cctpSolana` (unless Solana deposits are in
scope), `onchainSpot` (replaced by reading DreamDEX's own oracle), `leaderboardStats` (legacy),
`sponsor.ts` Onara specifics, `memwal` (unless the bot keeps memory), `audio/audioUtils` (unless
the voice assistant is ported).

---

## 5. Proposed chain-adapter interface

The UI + domain layer above needs exactly this surface. One implementation per chain
(`SuiPredictAdapter` for reference, `DreamDexAdapter` for Somnia); everything in sections 3.1-3.5
consumes only these types.

```ts
// ── domain types (chain-neutral, already used by the pure modules) ──

type Cadence = '15m' | '1h';
type Dir = 'up' | 'down';

interface EventMarket {
  id: string;                 // market/window identifier (bytes32 or id)
  asset: 'BTC' | 'ETH';
  cadence: Cadence;
  openMs: number;             // window open (lock price time)
  expiryMs: number;           // the bell — oracle settlement time
  linePrice: number | null;   // the strike/lock price the window settles against
  status: 'upcoming' | 'active' | 'pending_settlement' | 'settled';
  settlementPrice: number | null;
  maxLeverageX: number;       // 1 if none
  minStake: number;           // quote units
}

interface Quote {
  entryProb: number;          // 0..1 — the Up (or side) probability = price
  costPerUnit: number;        // all-in cost per 1 unit of payout (≈ entryProb + fees)
  allInCost: number;          // for the requested qty: premium + fees (+ penalty)
  winAmount: number;          // payout on a win, after any financed floor
  raw?: unknown;              // adapter-private (simulated event, etc.)
}

interface OpenPosition {
  marketId: string;
  orderId: string;
  dir: Dir | 'range';
  lower: number | null;       // null = −inf
  higher: number | null;      // null = +inf
  qty: number;                // max payout, quote units
  stake: number;              // net premium paid
  entryProb: number;
  leverageX: number;
  openedAtMs: number;
}

// Matches lib/sui/settledTrade.ts — feeds receipts, share cards, PnL, leaderboards
interface ClosedTrade { /* SettledTrade, with kind: 'settled'|'cashed_out'|'liquidated' */ }

// Matches lib/sui/history729.ts — feeds traderEdge, portfolio totals
interface LedgerRow { /* ExpiryHistoryRow */ }

// ── the adapter ──

interface MarketsProvider {
  // discovery + prices
  listMarkets(): Promise<EventMarket[]>;                       // ← fetchMarkets624 + useRounds
  getMarket(id: string): Promise<EventMarket | null>;          // ← fetchMarketState624
  spot(asset: string): Promise<{ usd: number; tsMs: number }>; // ← fetchSpot624 (settlement feed!)
  spotHistory(asset: string, limit: number): Promise<{ usd: number; tsMs: number }[]>;
  subscribeSpot(asset: string, cb: (p: number) => void): () => void;  // ← useBtcPrice stream
  recentSettlements(limit: number): Promise<{ marketId: string; priceUsd: number; expiryMs: number }[]>;

  // quoting — MUST be a simulation of the real order, uncapped guards (see §3.1)
  quote(p: { marketId: string; dir: Dir; qty: number; leverageX: number;
             lower?: number; higher?: number; account?: string }): Promise<Quote | { error: string }>;
  quoteOddsCents(p: { marketId: string; dir: Dir }): Promise<{ cents: number; entryProb: number } | { error: string }>;

  // account / balances (null = read failed; NEVER 0 on failure — §3.2)
  getAccount(owner: string): Promise<{ exists: boolean; depositBalance: bigint | null }>;
  walletBalance(owner: string): Promise<bigint | null>;

  // writes — return call descriptors the submitter executes; composites are single-signature
  buildOpen(p: { marketId: string; dir: Dir; qty: bigint; leverageX: number;
                 maxCost: bigint; lower?: bigint; higher?: bigint }): TxRequest;
  buildDepositAndOpen(p: { deposit: bigint; /* + open params */ }): TxRequest;   // ← buildTopUpAndMint624
  buildCashOut(p: { marketId: string; orderId: string; minPayout: bigint }): TxRequest;
  buildClaim(p: { marketId: string; orderId: string }): TxRequest;               // ← redeem settled
  buildClaimAll(positions: { marketId: string; orderId: string }[]): TxRequest;  // ← the crank
  buildDeposit(amount: bigint): TxRequest;
  buildWithdraw(amount: bigint, to: string): TxRequest;

  // history — feeds the pure engines unchanged
  openPositions(owner: string): Promise<OpenPosition[]>;       // ← fetchOpenPositions624
  orderFeed(owner: string, limit: number): Promise<OrderRowLike[]>;  // ← fetchAccountOrders624
  closedTrades(owner: string, limit: number): Promise<ClosedTrade[]>; // ← joinSettledTrades(feed)
  ledger(owner: string): Promise<LedgerRow[]>;                 // ← fetchExpiryHistory
  globalOrderFeed(windowMs: number): Promise<AccountOrders624Like[]>; // leaderboard input

  // meta
  explorerTx(hash: string): string;
  explorerAccount(addr: string): string;
  friendlyError(raw: string): string;                          // ← friendlyMintAbort mapping
  capabilities: { leverage: boolean; range: boolean; cashOutEarly: boolean; sponsor: boolean };
}

interface Submitter {  // ← useSmartSubmit
  submit(build: () => TxRequest, opts?: { walletOnly?: boolean }): Promise<{ hash: string; sponsored: boolean }>;
}
```

Wiring for the Somnia port:

- `quote`/`quoteOddsCents` → `eth_call` the DreamDEX order-book fill (or a quoter), decode the
  fill price; `cents = round(costPerUnit × 100)` clamped [1,99]. Since DreamDEX prices *are*
  Up-probabilities in (0,1), `entryProb = price` for Up and `1 − price` for Down.
- `orderFeed`/`closedTrades` → contract event logs (`OrderPlaced`/`OrderFilled`/`Settled`/
  `Claimed`); positions are ERC-6909 outcome tokens, so `openPositions` can also read
  `balanceOf(owner, tokenId)` directly — more robust than event reconstruction (the codebase's
  own lesson: events prune, state doesn't — `strategyClient.ts:625-639`).
- `ledger` → either a settled-trades rollup (group `ClosedTrade` by market and sum, then feed
  `summarise`/`computeTraderEdge729`), or a subgraph aggregate.
- Everything downstream — the ticket sizing, the leaderboard, trader edge, badges, daily stop,
  share cards, alerts, parlays math, charts — consumes these types and runs unmodified.

Finally, the defensive patterns to carry over regardless of implementation detail: zod-validate
every external payload on the money path; `null ≠ 0` for failed balance reads with last-good
retention; TTL + in-flight-dedup caches on hot endpoints; visibility-aware polling; simulate the
real transaction for every quote; one mint builder shared by web/server/bot; monotonic
high-water marks for cumulative public metrics; and honesty rules on every user-facing artifact
(receipts, share cards, traction numbers) enforced in code, not copy.
