# Yosuku Component Inventory (everything under `components/` except `landing/`)

> Source: `reference/yosuku/components/**` (96 files, ~18.7k LOC), read in full on 2026-08-31.
> Purpose: pick what to port to the DreamDEX Event Contracts (Somnia/EVM) rebuild.
>
> **Portability tags**
> - `pure` — presentational / self-contained; copy nearly as-is (may import trivial lib helpers or hit an internal API route you'd re-implement).
> - `adapter` — UI is sound; swap the Sui data layer (`@mysten/dapp-kit` hooks, `lib/sui/*` clients) for wagmi/viem + DreamDEX ec-core calls behind the same props/hook shape.
> - `chain-bound` — transaction orchestration is woven through the JSX; keep the layout/copy as reference, rewrite the logic.
> - `drop` — Sui-specific, legacy-generation, or not applicable to DreamDEX.
>
> **Two generations coexist in this repo.** Files marked `@ts-nocheck` (QuickBet, TradingCard, BetSidebar, PnLChart, RoundHistory, PredictionStats, InitSlotPrompt) belong to an older `RoundState`-based prototype; the current product surface is the "6-24" generation (Ticket624Drawer, Portfolio624Section, MarketCard, BetPlacedCard, TradeReceipt…). Prefer the newer generation as the design reference.

---

## Summary table

| Component | Category | Portability | One-liner |
|---|---|---|---|
| TradePanel | trading | chain-bound | Full pro betting panel: Simple/Pro modes, UP/DOWN/RANGE, strikes, leverage, privacy, daily stop |
| TradeFlow | trading | pure | Polymarket-style "+$X" flyers floating up over the chart as live trades land |
| QuickBet | trading | drop | Legacy quick YES/NO bet modal (`@ts-nocheck`, old round model) |
| TradingCard | trading | drop | Legacy round hero card: countdown bar, live chart, probability bar (`@ts-nocheck`) |
| TradeConfirmationModal | trading | adapter | Confirm-before-sign modal: direction badge, fee breakdown, payout summary |
| TradeReceipt | trading | pure | "Settlement Receipt" modal — print-shop slip with stamp, proof scale, tx links; standout piece |
| BetPlacedCard | trading | pure | "The Call" — shareable dark-island ticket for a just-placed bet with live draining countdown |
| BetSidebar | trading | drop | Legacy sticky bet sidebar (`@ts-nocheck`, old round model) |
| CashOut | trading | chain-bound | Mid-round exit list: open positions with live exit value + one-tap cash out |
| ClaimWinnings | trading | adapter | Settled-result card: honest loser state, winner hero P&L + claim button |
| Countdown | trading | pure | hh:mm:ss countdown span with urgency colour and multi-day formatting |
| SettleClock | trading | pure | Branded settlement countdown: SVG draining arc + mono digits |
| Verdict | trading | adapter | Post-settlement panel: per-position result cards + CTA into the next live round |
| WaitingState | trading | drop | Legacy "waiting for round" placeholder card |
| MarketCard | market/feed | adapter | The market feed card: canvas sparkline vs strike, live cents, UP/DOWN buttons, favourites |
| MarketRoom | market/feed | adapter | Error-boundary mount of CommentRoom for one market (gate hook + fallback sheet) |
| TakeCard | market/feed | pure | A social "take" in the feed: caption hero, call chip, backed-by-position badge |
| TakeComposer | market/feed | adapter | "Post a take" bottom sheet — price + horizon + live odds, deep-links into the bet flow |
| TakeComposer624 | market/feed | chain-bound | Newer take composer that publishes caption to Walrus + posts the call on-chain |
| TakeReelCard | market/feed | pure | Full-screen TikTok-style reel card for a take |
| StrikeCurve | market/feed | pure | SVG probability curve across strikes; click anywhere to select — drop for DreamDEX (no strikes) but reusable chart idiom |
| PriceChart | market/feed | adapter | Recharts area chart of spot+forward history with strike reference line |
| LiveBtcChart | market/feed | adapter | Self-buffering live BTC recharts chart (1s points, sessionStorage cache, pulsing live dot) |
| PriceTicker | market/feed | pure | Price span that flashes green/red with glow on each tick |
| TickerTape | market/feed | pure | Auto-scrolling coin-price + Fear/Greed tape (needs `/api/ticker`) |
| Marquee | market/feed | adapter | Site-top marquee: BTC spot, next/last bell countdown |
| NewsFeed | market/feed | pure | Editorial news front page: display-size lead story + numbered wire rows (needs `/api/crypto-news`) |
| WordMarketBoard | market/feed | adapter | Markets reworded as natural-language Yes/No questions, grouped by closing horizon — great DreamDEX fit |
| PortfolioTable | portfolio | chain-bound | Positions manager: open/settled tabs, claim-all winners, partial sell, withdraw |
| Portfolio624Section | portfolio | chain-bound | Current-venue portfolio block: positions with countdowns, history rows, receipts, copy-desk footprint |
| PnLChart | portfolio | drop | Legacy cumulative P&L recharts area (`@ts-nocheck`) |
| EquityCurve | portfolio | pure | Tiny SVG equity curve for a strategy's closed copies, liquidations marked |
| EquitySparkline | portfolio | pure | Honest cumulative-P&L sparkline; drawdowns drawn, zero baseline dashed |
| BetHistory729 | portfolio | adapter | On-chain bet history card with staked/returned/net summary + rows |
| RoundHistory | portfolio | drop | Legacy participated-rounds list (`@ts-nocheck`) |
| PredictionStats | portfolio | drop | Legacy 4-tile stats grid: trades/win rate/P&L/streak (`@ts-nocheck`, tile design reusable) |
| ReputationCard | portfolio | pure | Reputation panel: bets/wins/win-rate/streak grid + tier progress bar |
| ReputationBadge | portfolio | pure | Tier pill (Novice/Trader/Whale/Oracle) with emoji + colour config |
| BadgeDisplay | portfolio | pure | Achievements board: rank summary cell + numbered unlock cards |
| TraderEdgeLink | portfolio | pure | CSS-module banner linking to the edge/analytics report |
| portfolio/BalancePlate | portfolio | pure | "Ready to bet" hero number + two-segment proportion bar (light-theme plate) |
| portfolio/Chevron | portfolio | pure | 10px stroked SVG caret |
| portfolio/PoolRows | portfolio | pure | "Elsewhere · not spendable here" rows with `<details>` disclosure panels |
| CommentRoom | social | pure | Position-gated encrypted chat sheet — 100% presentational, all state via props |
| Comments | social | drop | localStorage-only demo comment box (superseded by CommentRoom) |
| CreatorCardStudio | social | adapter | Creator studio: pick market + strike, server renders share-card PNG, share/download/copy |
| CreatorEarningsCard | social | chain-bound | Creator-code earnings: mint code (zkLogin+passkey recovery), claimable fees, claim |
| ShareBetButton | social | pure | Popup-blocker-safe share: render PNG → native share sheet → download + X intent |
| ShareTradeButton | social | pure | Same flow for settled-trade receipt cards |
| XWalletCard | social | chain-bound | Trade-from-X wallet: bind X handle↔wallet, fund/cash out the tweet-bet ledger |
| StrategyXBar | social | adapter | Slim bar to link an X account + browse strategies on X |
| PlaybookVault | social | adapter | Seal-encrypted strategy playbook: shows REAL ciphertext, decrypt-in-browser on subscribe |
| SenseiDock | social | adapter | Floating AI-assistant orb (draining countdown ring) + slide-in chat drawer with typewriter replies |
| SenseiTape | social | adapter | Live price canvas the assistant reads from + `usePythTape` drift hook |
| SenseiTradeCards | social | chain-bound | Tap-to-trade cards inside the Sensei drawer (arm side → amount chips → place) |
| ProofRecord | social | pure | "THE RECORD" landing stats band: count-up numerals, one live spark, honesty footer |
| LiveDesk | social | chain-bound | Copy-trading desk: track record + equity curve, one-signature join, honest paused/frozen states |
| AccountSetup | money | adapter | One-time proactive trading-account setup card (sponsored-gas aware) |
| AddFunds | money | adapter | "Add money" modal: free faucet drip, buy-with-card link, cross-chain deposit row |
| CrossChainDeposit | money | adapter | CCTP USDC bridge (EVM via viem + Solana) — EVM half is already viem-based |
| TokenBalance | money | adapter | Wallet balance pill with AnimatedNumber |
| TokenFaucet | money | drop | Static links to Sui faucet/request form |
| CreditWelcome | money | pure | One-time "you're funded" celebration modal fired by a window event |
| IncognitoToggle | money | pure | "Trade privately" switch with tap-to-expand info line |
| PrivateClaims | money | drop | Private-bet ticket vault with local signature verification (Sui enclave desk) |
| InitSlotPrompt | money | drop | Legacy create-trading-account card (`@ts-nocheck`) |
| RegisterEnoki | money | drop | Registers Sui zkLogin (Google) wallets |
| WalletProvider | money | chain-bound | Root provider stack (dapp-kit + react-query) → replace with wagmi/RainbowKit |
| ParlayBuilder | parlay | chain-bound | Multi-leg parlay builder: leg rows, streak preset, stake↔payout solver, big multiplier |
| ParlaySlip | parlay | adapter | Open parlay tickets: per-leg won/lost/pending rows, claim button |
| Ticket624Drawer | parlay* | chain-bound | **The main bet ticket** (docked rail / mobile slide-over): UP/DOWN + range band drag, live quote strip, one-tap account-create/top-up flows |
| Header | chrome | adapter | App header + mobile bottom nav + balance pill + silent auto-faucet top-up |
| Footer | chrome | pure | One-link footer |
| AppStrip | chrome | pure | Dismissable thin announcement strip with rotating single line |
| ThemeToggle | chrome | pure | Sun/moon theme toggle (mirrors pre-paint `data-theme`) |
| Toast | chrome | pure | Toast context/provider: bottom-right, max 5, spring in/out, click to dismiss |
| Tooltip | chrome | pure | Hover tooltip around an Info icon (CSS-class styled) |
| Tutorial | chrome | pure | 5-step onboarding modal ending in Simple/Pro choice + connect wallet |
| Preloader | chrome | pure | GSAP once-per-session intro: letter slide, progress pill scale-up wipe |
| CustomCursor | chrome | pure | Dot + lagging ring cursor driven by `data-cursor` attributes |
| GrainOverlay | chrome | pure | `.grain` film-grain div |
| AnimatedBackground | chrome | pure | Fixed noise-texture background |
| AnimatedNumber | chrome | pure | Slot-machine number flip on value change |
| SmoothScroll | chrome | pure | Lenis smooth scrolling init |
| SectionHeader | chrome | pure | Numbered section header with live pill / cadence chips / count meta |
| DoodleStrip | chrome | pure | Fixed side gutters of hand-written crypto-slang doodles (xl+ only) |
| YosukuMark | chrome | drop | Brand logo SVG (replace with your own mark; keep the pattern) |
| ChainIcon | chrome | pure | Hand-drawn SVG chain marks (Solana/Avax/Polygon/Base/ETH) |
| icons/BitcoinIcon | chrome | pure | BTC roundel SVG |
| PriceAlerts | chrome | pure | Price-alert bell popover backed by localStorage + Notification API |
| WaitlistCard | chrome | adapter | On-chain founder waitlist with referral ranks (novel growth mechanic) |

\* Ticket624Drawer is grouped with parlay per the task brief, but it is really the primary trading surface.

---

## 1. Trading UI

### TradePanel — `components/TradePanel.tsx` (1,630 lines) — `chain-bound`
The kitchen-sink legacy-venue trade panel. Reference for interaction patterns, not for porting wholesale (Ticket624Drawer is the newer, tighter surface).
- **Props**: `oracle: OracleData`, `spotPrice?`, `forwardPrice?`, `defaultSide?: 'UP'|'DOWN'`, `initialStrike?`, `onSideChange?`, `onStrikeChange?`, `onSuccess?`, `initialMode?: 'simple'|'pro'`, `initialAmount?`.
- **State** (~25 pieces): side/leverage/amount/strikes/rangeUpperStrike, tx step machine (`idle|creating-manager|depositing|minting|success|error`), quote + retry, confirm modal, daily-stop editing, privacy mode + private tickets, buy/sell tab, Simple/Pro mode persisted in `localStorage('yosuku_trade_mode')`.
- **Data deps**: `useManager`, `useDUSDCBalance`, `useManagerBalance`, `useSviPricing`, `useVaultStats`, `useTradingVaultBalance`, `useReserveStats`, `useSmartSubmit`, `useDailyStop`, `fetchOnChainQuote/RangeQuote`, tx builders (`createManagerTx`, `depositAndMintTx`, leverage vault txs), `privateBet` lib, `useToast`.
- **Notable logic worth stealing**:
  - Closing-margin guard: blocks bets in the last 20s before expiry and re-checks at trade time (`TradePanel.tsx:58-65`, `453-457`) — prevents "mint aborts because round closed" failures.
  - Debounced (350ms) on-chain quote effect with cancel + retry counter (`:344-390`).
  - Position sizing so the FULL stake is deployed: `qty = deposit/price` with a 0.92 drift buffer (`:391-413`).
  - Ask-bounds guard (1c–99c) → "This price is too certain to bet on" (`:61-65`, `423-426`).
  - Leverage sanity: refuse when a *win* would collect less than margin (`:425`, `1297-1301`).
  - Button colour law: success is ALWAYS green, blocked states neutral grey — never let DOWN-red look like an error (`:1315-1329`).
  - Simple mode = one plain-English sentence ("Will Bitcoin be **above** $X when it closes?") with tappable price (`:795-891`).
  - Silent background auto-provisioning of the trading account so the first bet is one tap (`:212-230`).
  - Daily loss stop with localStorage-backed limit (`:1492-1532`).
- **DreamDEX mapping**: strike selection, range mode, SVI pricing, and leverage all disappear; keep Simple-mode phrasing, the quote debounce, closing guard, and button-state law.

### TradeFlow — `components/TradeFlow.tsx` (85 lines) — `pure`
Absolutely-positioned, pointer-events-none overlay that pops "+$X"/"−$X" mono badges near the chart's right edge as new trades land; buys green, sells rose.
- **Props**: `trades: TradeData[]` (any array with a stable key + type + size works).
- **Logic**: primes a `seen` set on first poll so the backlog never animates (`TradeFlow.tsx:30-35`); staggers a batch 240ms apart, caps at 8, each flyer lives 2.1s with `opacity: [0,1,1,0], y:-40` keyframe times (`:56-59`, `:72-76`).
- Direct port; feed it DreamDEX trade events.

### TradeConfirmationModal — `components/TradeConfirmationModal.tsx` (238) — `adapter`
Spring-in confirm dialog (Escape closes, backdrop click cancels).
- **Props**: `side`, `asset`, `strike`, `upperStrike?`, `amount` (micro), `quantity`, `fairPrice`, `feeBreakdown`, `onChainCost?`, `estimatedTradeCost?`, `leverage?`, `frontedAmount?`, `premiumAmount?`, `privacyMode?`, `expiry`, `onConfirm`, `onCancel`.
- `sideConfig` colour map (emerald/rose/amber per side) drives badge + CTA (`TradeConfirmationModal.tsx:33-37`). Cost row shows an "on-chain" micro-badge when the number is exact vs estimated (`:203-209`). For DreamDEX: replace fee breakdown with price-in-cents × contracts and drop leverage rows.

### TradeReceipt — `components/TradeReceipt.tsx` (494) — `pure`
The best-designed component in the repo: a settlement receipt styled as a printed slip. Warm near-black gradient card, film-grain data-URI, registration-tick corners, dotted-leader ledger rows, torn-slip perforation, rotated rubber **stamp** ("Oracle-settled" / "Cashed out" / "Liquidated"), giant settlement price ("the monument") with the exact UTC second, and a **ProofScale** axis showing strike vs settle marks (deliberately not a fabricated price path — `TradeReceipt.tsx:396-398`).
- **Props**: `trade: SettledTrade`, `onClose`, `shareSlot?: ReactNode`.
- One-spark colour system: a win carries vermilion heat (P&L, stamp glow, ember bloom); a loss is the same slip drained — no green, no red (`:7-10`, `:145-146`).
- Honesty per redemption kind via `kindMeta()` — a cash-out never claims oracle settlement (`:66-87`).
- Full a11y: focus trap, Esc, body scroll lock, focus-return to opener (`:115-141`). `motion-safe:` on every animation.
- Port as-is; swap `SUISCAN_TX` for a Somnia explorer link and the `SettledTrade` shape for your settled-fill type.

### BetPlacedCard — `components/BetPlacedCard.tsx` (172) — `pure`
"The Call" — the live sibling of TradeReceipt shown the instant a bet lands (also used as the on-image share card). `data-theme="dark"` forced-dark island, masthead + Nº, hero call line, stake → "Win if it lands" strip (vermilion), leverage caveat, **live countdown + draining progress bar** (parent owns the clock via `nowMs` prop — `BetPlacedCard.tsx:41-63`), verify link, then a full-width ShareBetButton.
- **Props**: `call: OpenBetCard`, `nowMs: number`, `actions?: ReactNode`.

### CashOut — `components/CashOut.tsx` (168) — `chain-bound`
Lists open localStorage positions for one market, quotes each's live exit value every 10s, one-tap redeem at bid. Records realized P&L into the daily stop (`CashOut.tsx:88`). Embedded mode renders inside TradePanel's Sell tab. For DreamDEX: exit = sell on the CLOB; rewrite around orderbook sell, keep the "worth X now / vs Y paid / +Δ" row anatomy.

### ClaimWinnings — `components/ClaimWinnings.tsx` (182) — `adapter`
One settled-result card. Loser: muted "Not this time" with the actual close vs your line — no false cheer (`ClaimWinnings.tsx:99-111`). Winner: emerald glow card where the **profit** (not payout) is the 2.75rem hero, ROI badge, stake→payout accounting line, claim button. Treats "already redeemed by the keeper" abort as success (`:78-92`) — same idea applies if you auto-redeem on DreamDEX.
- **Props**: `round`, `userDeposit`, `stake`, `userDirection`, `strike`, `reputation?`, `onClaimed?`.

### Countdown — `components/Countdown.tsx` (58) — `pure`
`expiryMs`, `className?`, `onExpire?`. Grey colons between white digits, orange under 5 min, "23d 00h 42m" for multi-day. Used everywhere; port first.

### SettleClock — `components/SettleClock.tsx` (91) — `pure`
Named export. `msLeft`, `totalMs?`, `label?`, `size?`. SVG ring (r=48.5, stroke 3) whose dashoffset drains linearly (900ms linear transition per tick — `SettleClock.tsx:70`); digits shrink for h:mm:ss; vermilion under 60s. Relies on CSS vars `--vermilion`, `--white`, `--ease` + `.settle-clock` classes.

### Verdict — `components/Verdict.tsx` (151) — `adapter`
After settlement: market-outcome card for non-holders, a ClaimWinnings card per held position, then the **loop CTA** — a vermilion button into the soonest next live round of the same asset with a live countdown (`Verdict.tsx:118-138`). Polls `/api/oracles` every 30s to find it. The "one close feeds the next" loop is core to the fast-round product; replicate against DreamDEX's auto-rolled successor market.

### QuickBet / TradingCard / BetSidebar / WaitingState — `drop`
Older-generation surfaces (`@ts-nocheck`, `RoundState` model). Worth skimming for isolated ideas only: TradingCard's probability bar with dual gradients (`TradingCard.tsx:151-180`), BetSidebar's full-screen colour flash on bet (`BetSidebar.tsx:204-213`) and its confidence meter (`:330-364`).

---

## 2. Market / feed UI

### MarketCard — `components/MarketCard.tsx` (366) — `adapter`
The market-list card, styled by global `.market-card` CSS (not Tailwind).
- **Props**: `oracle`, `spotPrice?`, `forwardPrice?`, `seedStrike?`, `horizonLabel?`, `isFavorite?`, `onToggleFavorite?`.
- Whole card is a `role="link"` article (keyboard accessible, `:224-240`); star button stops propagation.
- **Perf patterns worth keeping**: seeds the detail-page cache on render + on hover (`seedOracle`, `:43-47`), warms the route chunk with `router.prefetch` on first hover/pointerdown (`:79-86`), fetches price history ONCE per oracle and caches candles in a ref so 10s redraws don't refetch (`:153-210`).
- Locks the displayed strike on first price so the question text never fluctuates (`:52-66`).
- Live odds: fetches both sides' quotes every 10s and **normalizes so UP+DOWN = 100¢** (raw asks each carry spread; `:128-139`). On DreamDEX this hack is unnecessary — book prices are complementary by construction — which simplifies the card.
- Canvas sparkline drawn via shared `drawPriceLine` with verdict colouring against the strike; settled state shows "UP won / DOWN won · $close" explicitly (`:325-337`).
- Footer UP/DOWN buttons show cents and deep-link with `?strike=&side=`.

### MarketRoom — `components/MarketRoom.tsx` (101) — `adapter`
Wraps CommentRoom in a class error boundary with a designed fallback sheet showing the error string (wallet/E2E SDKs can throw unpredictably; page never full-crashes — `MarketRoom.tsx:3-9`). Data via `useCommentRoom(marketId, …)` hook; swap that hook for your chat backend.

### TakeCard — `components/TakeCard.tsx` (132) — `pure`
Feed post backed by a position. Deterministic avatar hue from address hash (`TakeCard.tsx:47-52`), call chip (▲/▼/◆ + band), caption as the display-type hero, `✓ position` vermilion badge only when backed (`:83-91`), provenance footer (storage + verify link). Type: `FeedTake { author, side 0|1|2, strikeUsd, lowerUsd?, higherUsd?, caption, backed, stakeDusdc?, cadence?, tsMs, digest }`.

### TakeComposer — `components/TakeComposer.tsx` (210) — `adapter`
Bottom sheet (spring slide-up): live preview sentence ("BTC **above** $X by 5m?"), side buttons, price input with ±500 bumpers + snap note, horizon ladder from live markets, live on-chain odds (¢ + "if right N×" multiple), amount chips — then **deep-links into the market with everything prefilled** so the actual signing happens in the proven flow (`TakeComposer.tsx:80,683`). Cheap to adapt: the odds fetch is the only chain call.

### TakeComposer624 — `components/TakeComposer624.tsx` (218) — `chain-bound`
Newer variant that actually publishes: caption → Walrus blob, call → `take_board::post_take` (sponsored). Same sheet anatomy: side (up/down/range), strike (defaults to live spot), horizon (cadence with dead ones disabled), caption with counter, "You're calling" preview, single CTA whose label doubles as the blocker message.

### TakeReelCard — `components/TakeReelCard.tsx` (115) — `pure`
The take rendered as a full-screen `.feed-card` for a snap-scroll reels feed: 30px caption fills the middle, footer CTA "Take the other side →".

### StrikeCurve — `components/StrikeCurve.tsx` (158) — `pure` (concept N/A on DreamDEX)
760×210 SVG: white probability curve across the strike grid, gradient underfill, vermilion dashed spot line, hover ghost + selected dot, click-anywhere-to-select via pointer-x → index math (`StrikeCurve.tsx:72-78`). No strikes on DreamDEX, but the pattern (curve as a tradable surface) could render the order book depth instead.

### PriceChart — `components/PriceChart.tsx` (180) — `adapter`
Recharts AreaChart, spot (white) + forward (dashed grey) with gradient fills, strike ReferenceLine in vermilion, 10s polling, manual legend row. Swap `fetchPriceHistory` for a Somnia price feed; the strike line becomes the window's opening price.

### LiveBtcChart — `components/charts/LiveBtcChart.tsx` (255) — `adapter`
Self-buffering live chart: pushes one point/sec from `useBtcPrice`, keeps 300, persists to sessionStorage (10-min cutoff) so refreshes don't blank it (`LiveBtcChart.tsx:26-45`); domain always includes the target; pulsing SVG live dot on last point (`:60-72`); stroke green/red by first-vs-last.

### PriceTicker — `components/PriceTicker.tsx` (31) — `pure`
Flash-on-tick span: compares to previous price in a ref, applies green/red drop-shadow + scale-105 for 600ms.

### TickerTape — `components/TickerTape.tsx` (114) — `pure`
30s-polled `/api/ticker` (coins + Fear/Greed); duplicated track with styled-jsx `translateX(-50%)` 30s loop, pause on hover. Skeleton shimmer while loading.

### Marquee — `components/Marquee.tsx` (115) — `adapter`
Global CSS `.marquee` triple-track. Items: BTC spot with ↑/↓, "NEXT CLOSE" countdown, "LAST CLOSE" print — the "earns its motion by carrying live signal" principle (`Marquee.tsx:8-11`). Uses `pollWhileVisible` (visibility-aware polling helper — copy that too).

### NewsFeed — `components/NewsFeed.tsx` (154) — `pure`
Editorial layout: `01`-numbered lead headline at 3-5xl display weight with hover ↗, square-endpoint vermilion rule, then numbered ruled wire rows with sentiment pills (bullish/bearish/neutral mapped to profit/loss tokens). 60s polling of `/api/crypto-news`; graceful "The wire is quiet." empty state.

### WordMarketBoard — `components/WordMarketBoard.tsx` (130) — `adapter`
**High-value for DreamDEX.** Rewords live markets as scheduled natural-language questions ("Will Bitcoin be above $X at 3:05 PM?") using 4 rotating templates (`WordMarketBoard.tsx:36-41`), groups by horizon (Closing in minutes / this hour / Later today), shows an honest client-side logistic probability (`:22-27`), odds bar, per-question countdown, Yes/No cent buttons that deep-link to the ticket. DreamDEX's "close at/above open" maps perfectly: template becomes "Will BTC close this 15-min window above $OPEN?". Styled by global `.wq-*`/`.words-*` classes (need porting or re-skinning).

---

## 3. Portfolio / stats

### PortfolioTable — `components/PortfolioTable.tsx` (589) — `chain-bound`
Legacy-venue positions manager. Keep the UX skeleton:
- Trading-balance card with Withdraw + legacy sweep at top (`PortfolioTable.tsx:490-524`).
- **Claim-all winners** banner pinned above tabs so unclaimed money is never hidden (`:525-542`), "⚡ gas-negative" affordance.
- Open/Settled segmented tabs with counts; Open sorted soonest-expiry-first, Settled most-recent-first (`:118-137`) — "the core findability fix".
- Row anatomy: direction icon roundel, strike, status chip (live countdown / "Awaiting oracle" spinner / Won/Lost), quantity + unrealized P&L %, context-sensitive button (Sell / Claim / Close) — no button at all for settled losers (`:396-398`).
- Expandable partial-sell row with qty input + MAX (`:427-479`).
- Loading gate waits for the *manager* too, killing the "No positions" flicker (`:165-176`).

### Portfolio624Section — `components/Portfolio624Section.tsx` (585) — `chain-bound`
The current-venue portfolio block; denser, plate-style (`plate-rows` + hover `Crosshairs` corners, `:575-585`).
- Account discovery cached per address (`readAccountCache`) to skip a second discovery waterfall (`:208-219`).
- Position rows: pulsing dot + band label ("BTC over $64,100"), countdown, qty, leverage ×, then per-state right side: winner = "won ≈ X" + quiet "collect now" (keeper auto-collects; `:454-468`); loser = "Close · no payout" button.
- History rows: "paid X DUSDC", relative time, **Receipt ↗** button opening TradeReceipt with the true expiry resolved lazily (`:136-150`), Suiscan link.
- Claim errors translated to human language ("Already paid out. The auto-payout got here first." — `:288-297`); withdraw re-reads the exact integer balance at click time (`:301-332`).
- Auto-opens the receipt for a just-claimed order once its redeemed row lands (`pendingReceiptRef`, `:152-158`).

### EquityCurve — `components/EquityCurve.tsx` (39) — `pure`
240×44 SVG polyline of cumulative P&L across closed copies, area fill at 10% opacity, liquidation dots, end dot; colour tokens fall back through `--gain → --profit → literal` (`EquityCurve.tsx:21-24`).

### EquitySparkline — `components/EquitySparkline.tsx` (119) — `pure`
The "striking honest visual": cumulative net curve with a dashed **zero baseline** ("the honesty datum"), vermilion above zero with gradient fill, muted white below (a loss is a fact, not a scare — `EquitySparkline.tsx:104-112`), ring-highlighted current dot, `useId`-scoped gradient, aria-label narrating the current position. Props: `points: {t, cum}[]`, `width?`, `height?`.

### BetHistory729 — `components/BetHistory729.tsx` (93) — `adapter`
Chain-read history card; shows a real error state instead of pretending empty when the read fails (`BetHistory729.tsx:3-7,33-40`). Stat trio (Staked/Returned/Net with tone) + 8 rows of per-market net. `Stat` sub-component is a reusable tile.

### ReputationCard / ReputationBadge / BadgeDisplay — `pure`
- ReputationCard (108): 2×2 stat grid, payout-bonus/fee rows, animated progress-to-next-tier bar (framer width animation).
- ReputationBadge (35): `TIER_CONFIG` record → coloured pill; compact variant.
- BadgeDisplay (82): rank cell (`earned/total` at 5xl) + vermilion progress bar + numbered unlock cards (locked at 45% opacity).

### TraderEdgeLink — `components/TraderEdgeLink.tsx` + `.module.css` — `pure`
CSS-module banner: left vermilion edge bar that scales up on hover, pill CTA with sliding arrow, `:global([data-theme="light"])` overrides, `prefers-reduced-motion` handled (`TraderEdgeLink.module.css:53-55`). Good template for module-CSS theming.

### portfolio/BalancePlate — (103) — `pure`
The one number the page exists for: "Ready to bet" hero (wallet + account combined, because a sponsored bet spends either — `BalancePlate.tsx:2-7`), a two-segment proportion bar instead of a four-cell datasheet (`:79-87`), colour-tied legend `Leg`s, open/settled counts, primary CTA switching "Get test DUSDC" ↔ "Add money". Hard-coded light-plate palette (#E04D26 on cream).

### portfolio/PoolRows — (103) — `pure`
"Elsewhere · not spendable here" rows — money that is real but can't be bet is listed by name, never merged into the headline (`PoolRows.tsx:2-8`). Rows with controls become `<details>` disclosures with rotating Chevron. Pool type: `{id, label, note, amountDusdc, blockedReason?, action?}`.

### PnLChart / RoundHistory / PredictionStats — `drop` (legacy)
PredictionStats' 4-tile anatomy (icon roundel + label + toned value: Trades/Win Rate/P&L/Streak `3W`) is a nice pattern to re-implement against DreamDEX fills.

---

## 4. Social / creator

### CommentRoom — `components/CommentRoom.tsx` (240) — `pure` ⭐
Fully presentational bottom-sheet/modal chat — every side effect arrives via props, so it ports untouched.
- **Props**: `callLabel`, `gate: 'connect'|'locked'|'joinable'|'joining'|'joined'`, `comments: RoomComment[]`, `onClose`, `onJoin?`, `onPost?`, `onBet?`, `busy?`, `error?`, `connectSlot?: ReactNode`.
- Gate-state screens each with a haloed `StateIcon`: connect → "A private room, per market."; locked → "Skin in the game unlocks the room." + bet CTA; joinable → "Your position's verified." (`CommentRoom.tsx:157-188`).
- Bespoke `RoomMark` SVG (locked speech bubble), auto-scroll on new messages, 280-char composer with Enter-to-send, verified-signature shield per message, deterministic avatar hues.
- For DreamDEX social: gate on "holds a position in this market" via a token-balance check.

### Comments — `drop` (localStorage demo; CommentRoom supersedes it).

### CreatorCardStudio — `components/CreatorCardStudio.tsx` (545) — `adapter`
Two-panel studio: left = market-window picker (3 cadence buttons), strike ladder + custom input, betting-closes / published-by info; right = live PNG preview rendered by `/api/creator-card/preview` (debounced 320ms, request-id guarded — `CreatorCardStudio.tsx:182-223`), caption block, Share/Download/Copy actions. Share writes the PNG to the clipboard then opens an X intent (`:260-283`); stale-line guard re-fetches when the round closed under you (`:230-239`). Gate ladder (connect → checking → error → no code → link X) as a single `gate` object (`:300-346`). Styled by `cs-*` global classes.

### CreatorEarningsCard — `components/CreatorEarningsCard.tsx` (402) — `chain-bound`
Creator-code lifecycle: not-a-creator pitch card → dark earnings card with claimable balance hero, "Create a card" CTA, claim button, ownership/recovery/payout footer. The zkLogin+passkey recovery machinery (`:99-192`) is Sui-specific; on EVM a creator code is just an address/registry entry. Keep the honesty copy: "Yosuku never holds this money" (`:7-10`).

### ShareBetButton / ShareTradeButton — (116/107) — `pure`
The canonical **popup-blocker-safe** share flow: decide native-share vs intent *synchronously inside the click gesture*, pre-open `about:blank` for the intent tab, then render the PNG async and either hand it to `navigator.share({files})` or download + navigate the pre-opened tab (`ShareBetButton.tsx:42-54`). `useOptionalToast` wrapper degrades outside the provider (`:18-24`). Swap the card-render lib functions.

### XWalletCard — `components/XWalletCard.tsx` (679) — `chain-bound`
Bet-by-tweet wallet card. Enormous amount of hard-won edge-case handling documented inline: Enoki session-expiry detection before writes (`XWalletCard.tsx:87-105`), two-click reauth to dodge popup blockers (`:107-123`), the **wallet-mismatch hard stop** (funding a wallet the X account doesn't route to = stranded money; names the right wallet, offers one-click switch — `:284-317`, `:433-476`), balance vs coin-objects distinction (`:177-208`), fund/cash-out flows. If you build any social-relay betting, read this file's comments first.

### StrategyXBar — (129) — `adapter`
Slim bar: X mark, linked-state copy, Link/Connect/Browse-on-X buttons. Simple fetch + signPersonalMessage link flow.

### PlaybookVault — (221) — `adapter`
Sealed strategy playbook. Signature move: shows the **actual first 130 bytes of ciphertext** (HEAD-fetched from storage) under a fade mask instead of a fake blurred placeholder (`PlaybookVault.tsx:46-62`, css `:187-194`), because "a lock icon over a blurred div would be theatre". States: creator-compose → sealed → opened (`Decrypted on your device`). styled-jsx with light-theme overrides. On EVM: Lit Protocol or similar would back it.

### SenseiDock — `components/SenseiDock.tsx` (337) — `adapter`
Floating assistant orb replacing a countdown pill: SVG draining ring around the brand mark, urgent state <60s, rotating teaser bubbles that invite a tap 3 times then rest (`SenseiDock.tsx:157-176`), opened via `sensei:open` window event or `?sensei=1` (nav-link intercept for same-page clicks — `:78-101`). Drawer: pinned live-market meter strip (spot, drift, countdown with drain bar) over a SenseiTape chart, chat with word-by-word `Typewriter` reveal + caret (`:41-58`), contextual follow-up chips derived from the reply text (`chipsFor`, `:60-67`), starter prompts, restlessness detection (4+ asks in 3 min → tilt cue sent to the API — `:180-183`), trade cards appear only after a read is given (`:317-321`). Backend = one `/api/sensei` POST with market snapshot. Very portable to a DreamDEX AI-agent category entry.

### SenseiTape — (109) — `adapter`
Exports `usePythTape(active, cadence)` (poll settlement feed while open, compute drift over the cadence window with honest actual-span reporting — `SenseiTape.tsx:24-37`) and the canvas chart drawn with the same `drawPriceLine` used everywhere (verdict colours vs the UP line; rAF animation unless reduced-motion).

### SenseiTradeCards — (253) — `chain-bound`
Three nearest markets as minimal cards: tap UP/DOWN to arm → amount input + additive chips → Place. Real per-side logistic odds and payout multiple on each button (`SenseiTradeCards.tsx:31-39`); sizing uses the same probability that's displayed (`:106-116`); three funding paths in one tap (first-bet-creates-account / top-up-and-bet / plain mint, `:118-144`); error classifier maps venue aborts to human copy (`:150-162`); disabled until the balance has actually loaded (`:84-92`).

### ProofRecord — (150) — `pure`
Landing "THE RECORD" band: mono masthead + live ping, 4 facts in hairline-divided columns, ease-out count-up kicked by IntersectionObserver at 0.35 threshold (`ProofRecord.tsx:14-31,53-62`), clamp() display numerals, only the live stat gets vermilion + spark underline, honesty footer ("EVERY FIGURE VERIFIABLE ON …"). Props: `liveMarkets`, `players` (nullable → em-dash).

### LiveDesk — `components/LiveDesk.tsx` (922) — `chain-bound`
Copy-trading desk join/manage surface. UX laws stated at top (`LiveDesk.tsx:10-16`): one decision after "join?" (the amount), one signature (deposit+subscribe in one tx), no dead ends (inline faucet chip), living "Copying · watching Bitcoin" moment-after, decision-moment honesty. Notable machinery:
- Track-record card: win-rate lead number + EquitySparkline + Won/Lost/Net trio, derived entirely from on-chain events with settle↔trade matching (`:193-224`).
- Keeper heartbeat polled from the keeper itself so a dead keeper can't vouch for itself (`:281-308`).
- Truth-telling banners: stale-agent reconnect, underfunded-balance ("the desk is skipping every one. Top up to about X"), cap-below-typical-cost (`:614-652`) — each computed from the keeper's real gate mirrored exactly (`:62-75`).
- Dev-only `?desk-preview=fresh|joined` forced states, compiled out of prod (`:77-102`).
- Reusable primitives at bottom: `AmountRow` (big figure + unit + hint + additive chips), `RiskModePicker` (3-radio guarded/balanced/active), `CapsEditor`, `RecordStat` (`:822-922`).

---

## 5. Money / onboarding

### AccountSetup — (99) — `adapter`
Proactive one-time setup card; sponsor-aware copy ("Gas is on us" vs "a little SUI gas"); "Skip it, and it simply happens during your first trade instead." On DreamDEX likely becomes a USDso approve step.

### AddFunds — (154) — `adapter`
Esc/scroll-locked modal: copyable address row, three routes stacked — free faucet drip (`/api/faucet`), "Buy with a card →" link, CrossChainDeposit row — success state swaps to "Trade from wallet →". Faucet + testnet framing ("play chips, not real money") maps directly to Somnia testnet USDso.

### CrossChainDeposit — `components/CrossChainDeposit.tsx` (412) — `adapter`
CCTP burn-and-mint deposit. **The EVM half is already viem** (`createPublicClient/createWalletClient`, `ensureChain` with 4902 add-chain fallback `:184-204`, exact-amount approvals only `:245-254`); Solana half via dynamic `@solana/web3.js` import. Background-job model: burn hash persisted to localStorage so a 19-minute wait survives refresh (`:92-99`), 6s polling until delivered, non-blocking. Renders nothing until the relayer is confirmed reachable (`:290-294`). Product notes at `:13-33` are worth reading (fast chains first, wait stated before commit).

### TokenBalance — (29) — `adapter`
Coins icon + AnimatedNumber + unit pill.

### CreditWelcome — (98) — `pure`
Listens for `window` CustomEvent `yosuku:credited` with `firstTime: true`; celebratory spring modal (rotating sparkle badge), auto-dismisses in 8s ("it's a moment, not a wall"). Routine top-ups use a toast instead. Pair with Header's auto-faucet.

### IncognitoToggle — (71) — `pure`
Single switch (not a two-pill), spring thumb, tappable (i) that expands an inline explanation (works on touch, unlike hover tooltips — `IncognitoToggle.tsx:12-16`).

### PrivateClaims — (312) — `drop` (enclave-desk specific)
If you build privacy: note the design — verify every claim on sight rather than making the user press verify (`PrivateClaims.tsx:45-47`), Back up / Restore JSON as primary actions, unverified claims block cash-out with an explanation.

### InitSlotPrompt / RegisterEnoki / TokenFaucet — `drop`
### WalletProvider — (41) — `chain-bound`
Root stack: QueryClientProvider → SuiClientProvider → RegisterEnoki → dapp-kit WalletProvider with autoConnect. Replace wholesale with WagmiProvider + RainbowKit/ConnectKit + react-query.

---

## 6. Parlay + the main ticket

### ParlayBuilder — `components/ParlayBuilder.tsx` (745) — `chain-bound`
Two-column: leg builder plate (numbered `LegRow`s with bell picker, UP/DOWN, strike dropdown, live per-leg %) + sticky ticket with the **5xl multiplier as the headline** ("lottery framing", `ParlayBuilder.tsx:356-373`), correlation-adjustment badge, stake↔payout **solver toggle** ("Set stake" / "Set payout", `:386-401`), per-leg breakdown, honest footnote ("The instant one leg settles against you, the ticket is dead"). One-tap "BTC close streak" preset filling 3 soonest bells (`:131-143`). Debounced 400ms combined quote keyed on a stable leg signature (`:179-217`). Stable-`prev`-reference guard against effect loops (`:145-159`). DreamDEX has no native parlay, but stacking successive 15-min windows with client-side multiplied odds is a strong hackathon feature; the whole UI ports, the escrow needs your own contract or off-book bookkeeping.

### ParlaySlip — (169) — `adapter`
Ticket cards: layered header (n-leg streak + StatusPill "In play · 1/3"), multiplier + stake→payout, per-leg rows with won/missed/countdown, vermilion claim CTA, dead tickets dimmed at 60% opacity.

### Ticket624Drawer — `components/Ticket624Drawer.tsx` (1,291) — `chain-bound` ⭐ (primary reference for your bet flow)
Docked desktop rail / mobile slide-over ticket.
- **Props**: `market`, `side` (preselected by the tap — "the user's tap IS the choice"), `sessionId` (fresh-ticket vs rollover-preserving reset, `Ticket624Drawer.tsx:227-242`), `spot`, `series` (live price series drawn in-ticket), `mobileOpen`, `fundWith: 'btc'|null`, `onClose`.
- Mode toggle Up/Down vs Range. Range = draggable band over an axis (pointer capture + keyboard arrows + Home, aria-slider semantics — `:291-334`, `:932-960`), width presets scaled per cadence (`:65-67`), ±$5 nudge / recenter buttons.
- Stake is **user-owned**: empty input + additive chips (+1/+5/+20), never pre-filled; venue's payout-quantity parameter is derived from the stake so "you bet X" is exactly what they typed (`:254-259`, `:340-364`).
- Quote strip: Current cost / Return / Max loss trio + status line ("Live market odds" ↔ "Estimated until you connect" ↔ friendly quote error) + "% chance" (`:1097-1116`).
- **Blocker system**: one derived `blocker` string doubles as the disabled CTA label — closing / too-certain / connect / enter bet / below min / add-X-more (`:423-468`). Button colour by side (profit green / loss red / vermilion for range).
- One-signature paths: `placeFirst` (create account + fund + bet), `placeTopUp` (deposit shortfall + bet), plain `place`; buffered-need computation so a barely-covering balance doesn't abort on odds drift (`:365-382`); dry-run probe supplies real odds even in states the plain quote can't serve (`:355-415`).
- Private route fails **closed** — never silently falls back to a public bet (`:530-566`).
- On success swaps the whole ticket for BetPlacedCard + Portfolio / Place-another actions.
- DreamDEX mapping: strike/range/leverage/private go away; quote = read book best ask for side; the blocker system, stake-owned input, session reset semantics, and success handoff all port.

---

## 7. Chrome / utility

### Header — `components/Header.tsx` (432) — `adapter`
Global-CSS-styled header + **mobile floating pill bottom nav**. Nav arrays with a derivation guarantee: mobile "More" overflow = PRIMARY minus bottom-bar items + SECONDARY, so nothing is ever unreachable on a phone (`Header.tsx:75-88`, `:216-223`). Balance pill shows one combined total, dims (never blanks) while half-loaded (`:302-315`); wallet menu with account/wallet split. **Auto-faucet**: connected wallet ≤1 USD triggers a silent drip with per-address localStorage cooldown; first-ever credit fires the CreditWelcome event, later ones a quiet toast; declines are a toast, never a forced modal (`:153-210`). `yosuku:open-funds` window event opens AddFunds from anywhere (`:146-151`). Nav comments record dead-end-slot removal decisions (`:37-45`).

### Toast — (130) — `pure`
`ToastProvider` + `useToast()` → `toast(message, type?, duration?)`. Bottom-right stack, max 5, spring x-slide in/out with `AnimatePresence mode="popLayout"`, whole toast clickable to dismiss, per-type icon/colour/border maps (`Toast.tsx:81-97`). Port first — nearly every component imports it.

### Tooltip — (30) — `pure`
Hover-state span around an Info icon; bubble styled by global `.tooltip-*` classes; `position: top|bottom`. (Touch contexts use the IncognitoToggle tap-info pattern instead.)

### Tutorial — (192) — `pure`
5-step first-run modal (localStorage `yosuku_tutorial_seen`), progress dashes, Skip always visible, Esc + backdrop close ("Never trap the user"), final step = Simple/Pro **view choice written to the same localStorage key TradePanel reads** (`Tutorial.tsx:62-72`) + ConnectButton; auto-dismisses the moment a wallet connects on the last step (`:74-79`).

### Preloader — (181 + module.css) — `pure`
GSAP once-per-session (sessionStorage) intro: letters slide in via overflow-hidden char frames, fake 3-step progress on a giant pill, pill scales ×7 as the wipe, `mix-blend-mode: difference` logo. Needs `gsap` + `@gsap/react`.

### CustomCursor — (72) — `pure`
Dot (fast lerp 0.55) + ring (slow lerp 0.18) following the mouse; `[data-cursor="hover"|"up"]` closest-ancestor detection toggles ring classes. The `data-cursor` attribute convention is used on ~every interactive element in the app.

### AnimatedNumber — (45) — `pure`
300ms flip: keyed motion.div slides new value up. Note: exit animation never actually plays (no AnimatePresence) — minor known wart.

### SmoothScroll — (27) — `pure` — Lenis with autoRaf, duration 1.2, custom easing.
### SectionHeader — (47) — `pure` — numbered index + title + live pill + cadence chips/meta (global `.section-*` classes).
### AppStrip — (95) — `pure` — dismissable one-line strip; sets `documentElement.dataset.strip` so CSS offsets collapse when absent (`AppStrip.tsx:51-59`); starts hidden to avoid a flash.
### ThemeToggle — (37) — `pure` — mirrors pre-paint `data-theme` into state on mount; SSR-safe placeholder until mounted.
### GrainOverlay / AnimatedBackground — (5/10) — `pure` — film-grain layers (CSS class / inline data-URI noise SVG).
### DoodleStrip — (100) — `pure` — hand-font crypto-slang words in fixed side gutters, xl-only, aria-hidden. Taste call.
### YosukuMark — (47) — `drop` (brand) — but copy the pattern: single-source SVG mark, `currentColor` figure + token-coloured accent dot, decorative-by-default a11y.
### ChainIcon — (85) — `pure` — drawn chain marks with real brand colours; add a Somnia mark.
### PriceAlerts — (136) — `pure` — bell popover: above/below toggle, target input, Notification-permission request, localStorage alerts via `lib/priceAlerts`.
### WaitlistCard — (135) — `adapter` — on-chain founder list: joined state shows tier badge + rank + copyable referral link; referral param parsed from `?ref=`; leaderboard top-5. Novel growth mechanic worth re-implementing on Somnia.
### Footer — (11) — `pure`.

---

## Design system notes

**Colour tokens** (CSS vars in globals; Tailwind classes reference them):
- `--vermilion: #E04D26` (+ `vermilion-d` darker hover) — THE accent. The "one-spark" rule: one vermilion element per composition (TradeReceipt:7-10, ProofRecord:132-133, EquitySparkline:10-12). Vermilion = conviction/live/brand, **not** win-green.
- Profit/loss: `--profit`/`new-mint` `#34D399`, `--loss`/`off-red` `#FB7185` (legacy comps also use `#F43F5E`). Amber = RANGE side. `new-blue`/`off-blue` in legacy comps.
- Dark ground: near-blacks `#0a0a0a–#0e0e11`; cards `bg-white/[0.02–0.06]` with `border-white/[0.06–0.12]` hairlines. Premium cards use the **warm radial gradient** `radial-gradient(130% 90% at 50% -10%, #16110c 0%, #0d0a08 46%, #080605 100%)` (TradeReceipt, BetPlacedCard, TakeCard, CommentRoom, TakeComposer624 — one visual family).
- Light theme: cream `#FBF7EE`/`#FFFDF8`, ink `#1A1612`, muted `#6B6353`, hairline `#C9BFA6` (BalancePlate, XWalletCard, PoolRows hard-code these).
- **Dark islands**: share-grade cards force `data-theme="dark"` on their wrapper so they keep light-on-dark ink even in cream light mode, matching the PNG export (BetPlacedCard.tsx:67-73).

**Typography**: `font-display` (Sora-like) for headings/heroes — weights 700–850, tracking −0.02 to −0.06em; `font-mono` for every number, label, and eyebrow — micro-labels at 8–11px, UPPERCASE, `tracking-[0.14–0.28em]`; `tabular-nums` on all figures; `font-jp` (glyphs) and `font-hand` (doodles) as flavour. Hero numbers use `clamp()` sizing.

**Motion patterns**:
- framer-motion springs for modals/sheets: `{type:'spring', damping:20-32, stiffness:280-350}`; entries `y:18-20, scale:0.94-0.97`.
- `AnimatePresence` + `height:0→auto` for inline disclosures (strike dropdowns, partial-sell rows).
- CSS keyframes with **`motion-safe:` prefix** for the receipt choreography (backdrop fade → card rise → stamp press at `--ease-bounce` → late label reveal, TradeReceipt.tsx:93-101); `prefers-reduced-motion` checked in JS for Sensei/tape.
- Live-ness idioms: `animate-ping` double-dot for live markers; draining bars `transition-[width] duration-1000 ease-linear`; SVG ring dashoffset drains (SettleClock, SenseiDock); count-ups via rAF ease-out cubic on IntersectionObserver (ProofRecord).
- GSAP only in the Preloader; Lenis for page scroll; typewriter word-reveal for AI replies.

**Toast/tooltip conventions**: one Toast context at the root; `toast(msg, 'success'|'error'|'info')`; components render error copy inline *and* toast it; `useOptionalToast` try/catch wrapper where the provider may be absent. Tooltips are hover-only on desktop; touch surfaces use tap-to-expand info lines instead.

**Error-honesty conventions** (repeated everywhere; adopt them):
- Human-mapped errors (`humanizeTxError`, `friendlyMintAbort`, `friendlyWalletError`, `friendlyVault624Error`) with a `<details>technical details</details>` escape hatch.
- "Already claimed/auto-collected" aborts treated as success, refresh + show settled.
- Failed reads keep last-good values and *say* they failed — never render 0 for money you couldn't read (Portfolio624Section.tsx:309-313, Ticket624Drawer.tsx:188-192).
- Disabled CTA label IS the reason (blocker-string pattern).

**Mobile/PWA considerations**: floating pill bottom nav + derived More overflow; bottom sheets `rounded-t-3xl` that become centered modals at `sm:`; `max-h-[88–92dvh]` + `env(safe-area-inset-bottom)` padding on sheets/composers; drawer ticket = fixed slide-over on mobile, docked static rail on `lg:`; snap-scroll `.feed-card` reels; `pollWhileVisible` visibility-aware polling; sessionStorage chart buffers so navigation doesn't blank charts; hover-prefetch of route chunks.

**Global-CSS dependency warning**: many components (MarketCard, Header, Marquee, WordMarketBoard, SectionHeader, SenseiDock, Tooltip, CreatorCardStudio, LiveDesk light overrides) are styled by classes in `app/globals.css`, not Tailwind utilities. Porting them requires bringing those class blocks (or re-skinning). Components using styled-jsx (`PlaybookVault`, `PrivateClaims`, `TickerTape`) and CSS modules (`TraderEdgeLink`, `Preloader`) are self-contained.

---

## Top 15 components worth porting first

1. **Toast** — universal dependency; everything else imports `useToast`. Zero chain coupling.
2. **Ticket624Drawer** (as the layout/UX blueprint for your DreamDEX ticket) — the tap-is-the-choice preselect, user-owned stake input with additive chips, blocker-as-CTA-label system, quote strip, and one-signature funding paths are exactly the flow a CLOB market needs; DreamDEX actually *simplifies* it (no strikes/leverage/private).
3. **MarketCard** — the feed workhorse: canvas sparkline vs the line, live cents on UP/DOWN buttons, prefetch-on-hover, settled "UP won" verdict. On DreamDEX the odds normalization hack disappears.
4. **BetPlacedCard + ShareBetButton** — the shareable moment after a bet; social loop = hackathon demo gold; popup-safe share flow is fiddly to get right and already solved.
5. **TradeReceipt** — the settlement receipt is the most memorable visual in the app and is pure; judges will remember it. Swap the explorer link + trade type.
6. **Countdown + SettleClock** — every fast-round surface needs them; trivial ports.
7. **WordMarketBoard** — natural-language question board maps 1:1 to DreamDEX's "close above open?" windows; instantly makes the product consumer-readable.
8. **Header** (+ CreditWelcome) — nav, combined-balance pill, and the silent auto-faucet/first-credit celebration make testnet onboarding feel magic.
9. **TradeConfirmationModal** — small, and the sideConfig colour system keeps buy flows consistent.
10. **Portfolio624Section row anatomy** (with TradeReceipt hookup) — open positions with countdowns, "won ≈ X · collect now", history rows with Receipt buttons; rewrite reads against DreamDEX fills/redemptions.
11. **TradeFlow** — cheap, pure, and makes the chart feel alive with real activity.
12. **EquitySparkline + EquityCurve** — honest P&L visuals for portfolio and any leaderboard/strategy angle.
13. **CommentRoom (+ MarketRoom boundary)** — fully presentational position-gated chat; a "bettors-only room" is a distinctive social-prediction feature.
14. **Tutorial** — first-run mental model + Simple/Pro choice wiring; pure.
15. **ParlayBuilder/ParlaySlip** — if you want a differentiating feature: window-streak parlays over successive DreamDEX expiries, with the multiplier-hero ticket UI already designed.

Honourable mentions: **ProofRecord** (landing credibility band), **SenseiDock/SenseiTape** (if entering the AI-agent category — the drawer + market-snapshot-to-LLM pattern is ready), **CrossChainDeposit** (EVM half is already viem; CCTP to Somnia if applicable), **Marquee/TickerTape** (ambient liveness), **WaitlistCard** (on-chain referral waitlist as a growth mechanic).
