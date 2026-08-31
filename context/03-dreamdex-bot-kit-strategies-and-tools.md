# DreamDEX Bot Kit — EC strategies, LLM patterns, tooling, and deployment

Source: `reference/dreamdex-bot-kit` (cloned at `/Users/abu/dev/hackathon/sommina-events/reference/dreamdex-bot-kit`).
Scope of this doc: everything EC-relevant **outside** `packages/ec-core` and the core EC docs (those are covered in a companion doc): the five non-starter EC strategies, the ensemble/LLM strategies and examples, the ec-doctor/ec-test tooling, the testnet/mainnet test report, edge analytics, backtesting, and deployment. All `file:line` refs are relative to the repo root.

---

## 1. Repo map

```
dreamdex-bot-kit/
├── packages/
│   ├── core/              Spot CLOB SDK (TS): auth, REST, WS, execution, gotcha guards, nonce mgr
│   ├── core-py/           Python port of core
│   ├── ec-core/           Event-contracts shared lib (covered by companion doc)
│   └── backtest/          Bar-replay engine (SimPool with the live Pool surface)
├── strategies/
│   ├── starter, market-making, grid, momentum, mean-reversion, twap,
│   │   treasury, yield-optimizer        ← SPOT strategies (not our focus)
│   ├── ensemble/          Modular ensemble + optional LLM fusion (spot, but the LLM pattern is reusable)
│   ├── ec-starter/        Simplest EC taker (covered by companion doc)
│   ├── ec-maker/          Two-sided post-only maker on EC books
│   ├── ec-passive/        Patient single resting bid at a target probability
│   ├── ec-laddering-bot/  Post-only probability ladder + pre-expiry flatten
│   ├── ec-oracle-follow/  Directional taker priced off the underlying oracle feed  ★ fair-value model
│   └── ec-settlement/     Lifecycle watcher + claim sweep (redeem winners)
├── tools/edge-analytics/  Markout / adverse-selection analyzer over your own fill logs
├── advanced/batch-7702/   EIP-7702 batching technique demo
├── examples/              8 sanitized real competition bots (read-only reference)
│   ├── 01-multi-strategy-ai/      LLM decision bot over classical ensemble (OpenCode SDK)
│   └── 08-regime-multistrategy/   Drawdown-adaptive risk regimes + Binance-fed arb
├── scripts/
│   ├── ec-doctor.ts       Read-only EC preflight (venue, markets, books, balances)
│   ├── ec-test/           EC bot conformance harness (matrix, runner, leak check, E2E, report)
│   ├── railway-start.mjs  Railway worker entrypoint (STRATEGY env picks the bot)
│   ├── quickstart.mjs     Interactive .env generator (throwaway key, dry-run)
│   └── checks.mjs         Static repo-consistency checks (CI)
├── docs/                  event-contracts.md, gotchas.md, architecture.md (companion doc),
│                          tests/ec-test-report.md, railway.md, measuring-edge.md, backtesting.md
├── skills/                Agent Skills (somnia, dreamdex-bot) for AI coding agents
├── Dockerfile, railway.toml, .env.railway, .github/workflows/ci.yml
└── .env.example           Every EC knob documented (enforced by checks.mjs)
```

Root README repo table: `README.md:15-27`. Key platform facts (`README.md:119-129`): testnet = Shannon, chain `50312`, REST `https://stg.api.dreamdex.io/v0`; mainnet chain `5031`, REST `https://api.dreamdex.io/v0`. Spot contracts were upgraded June 2026 — one payable `placeOrder` entrypoint with wallet auto-pull; most `examples/` predate this (`README.md:29-46`, `examples/README.md:19-23`).

---

## 2. EC strategy comparison table

| Strategy | Role | Signal | Main knobs (env) | Claims settled? | Expiry-headroom rule |
| --- | --- | --- | --- | --- | --- |
| `ec-maker` | Two-sided **post-only maker**, every active market | Fair = YES-book mid (else 0.5) ± `MM_SPREAD` — placeholder by design | `MM_SPREAD` 0.02, `MM_QUOTE_SIZE` 5, `MM_REFRESH_MS` 10s, `MM_MAX_INVENTORY` 20, `MM_INVENTORY`, `EC_UNDERLYING` | Yes — `maybeClaim` each cycle | `minLeftSec(interval)` from ec-core, scaled to series cadence (`ec-maker/src/index.ts:105-106`) |
| `ec-passive` | **Patient buyer**: one resting post-only bid at a target probability | None — a price opinion (`EC_TARGET`); refuses to cross even when the market comes to it | `EC_SIDE` up/down, `EC_TARGET` 0.40, `EC_SIZE` 5, `EC_MAX_POSITION` 20, `EC_REFRESH_MS` 15s, `EC_MIN_LEFT_S`, `EC_UNDERLYING` | Yes — `maybeClaim` | 40% of window, floor 30s, cap 600s; `EC_MIN_LEFT_S` pins it (`ec-passive/src/index.ts:69-72`) |
| `ec-laddering-bot` | **Passive mean-reversion**: symmetric post-only rungs around the mid, one market | Oscillation of implied probability around center (mid or `GRID_CENTER`) | `GRID_LEVELS` 2, `GRID_SPACING` 0.05, `GRID_SIZE` 5, `GRID_MAX_INVENTORY` 20, `GRID_REFRESH_MS` 10s, `GRID_FLATTEN_BUFFER_MS`, `EC_MARKET`, `EC_UNDERLYING` | Yes — `maybeClaim` | **Flatten window**: inside `headroomSec(interval)*1000` of expiry it cancels all, burns paired sets, IOC-sells the excess leg (`ec-laddering-bot/src/index.ts:57-61,407-411`) |
| `ec-oracle-follow` | **Directional taker** (IOC only, buy-only) | Underlying spot vs settlement reference, over time left, against measured vol; momentum tilt fallback | `OF_EDGE` 0.03, `OF_MAX_DISAGREEMENT` 0.1, `OF_MAX_SHARES` 5, `OF_MAX_EXPOSURE` 50, `OF_COOLDOWN_MS` 30s, `OF_SENSITIVITY` 20, `OF_MOMENTUM_WINDOW_MS` 60s, `OF_MAX_HORIZONS` 30, `PRICE_FEED_URL` | Yes — `maybeClaim` | 40% of window, floor 30s, cap 300s; `OF_NEAR_EXPIRY_STOP_MS` pins it (`ec-oracle-follow/src/index.ts:97-104`) |
| `ec-settlement` | **Lifecycle watcher + claim sweep** — the exit half every other bot hands off to | On-chain status transitions; `isResolved`/`isVoided` | `EC_MARKET`, `WATCH_POLL_MS` 15s, `CLAIM=1`, `CLAIM_SCAN` 25 | This IS the claimer (`redeemHoldings`, `claimSettled`) | n/a — places no orders |

Cross-cutting behaviours all five share:
- **Dry-run first**: `DRY_RUN=true` default; a keyless dry run still reasons over live books (`createExchange({ withSigner: !loadConfig().dryRun })`, e.g. `ec-maker/src/index.ts:179`).
- **Authoritative on-chain status**, never the lagging indexer (`marketOnchain` + `isTradable` gates in every cycle).
- **Auto-claim on the trading loop**: every bot calls `maybeClaim(ctx)` at the top of each cycle — self-throttled by `AUTO_CLAIM_INTERVAL_MS`, no-op under `AUTO_CLAIM=false` (`.env.example:52-56`).
- **Interruptible sleep** (~500ms wake on SIGINT/SIGTERM) so shutdown cleanup starts immediately, not after a full refresh interval (`ec-maker/src/index.ts:65-74`).
- **Belt-and-braces shutdown cancel**: cancel from the bot's own `cancelTracked` record first (the indexer lags and can't see orders posted seconds ago — measured: 14 cancelled, 1 stranded without it), then `cancelVenueOrders` sweep (`ec-maker/src/index.ts:216-227`, `ec-laddering-bot/src/index.ts:419-429`).
- **`EC_UNDERLYING` honored uniformly** (a config saying BTC must mean BTC everywhere — enforced by `scripts/checks.mjs:228-248`).

---

## 3. Per-strategy deep dives

### 3.1 ec-maker — two-sided post-only maker (`strategies/ec-maker/src/index.ts`, 239 lines)

Per cycle (`REFRESH_MS`, default 10s), for **every** active market (`quoteOne`, `index.ts:92-169`):

1. **Gates**: `EC_UNDERLYING` filter (L93) → on-chain snapshot, `isTradable` (L94-99) → expiry headroom scaled to the series cadence (L105-106; the comment records that both live on-chain reverts observed in testing landed exactly on the expiry second of the target market, L101-104).
2. **Seed inventory once per market** via mint-a-pair (`seedInventory`, L108-111) so the SELL-YES side is collateralised — on this venue you cannot sell an outcome you don't hold.
3. **Fair value**: `fairYes()` = mid of the YES book, single side if one-sided, else 0.5 (L80-85). Deliberately a placeholder — "swap in your own signal … the plumbing around it is the point" (L23-25).
4. **Quote**: `bid = clamp(fair − MM_SPREAD)`, `ask = clamp(fair + MM_SPREAD)` (L122-125); size quantized to the venue lot grid (L117).
5. **Cancel-before-requote**: fetch own open orders on the YES symbol, cancel each, `untrackOrder` (L128-134) — never stacks duplicate levels or self-matches.
6. **Inventory cap on NET position**: past `MM_MAX_INVENTORY` net, quote only the side that unwinds (`skipBid`/`skipAsk`, L140-143). Computed *before* the dry-run branch so dry-run output matches live behaviour (L137-139).
7. **Place post-only** (`type: "post-only"`): a quote that would cross is rejected rather than taking (L156-158). Ask size is additionally capped by actual sellable inventory (`sellableSize`, L162-165) — "a short ask is better than a failed one".
8. **Log**: one `quote <sym>: bid X@p / ask Y@q (fair f)` line per market (L166-168); "no market to quote" hints throttled to once/minute with `explainEmptyScope` (L172-174, 193-199).

Shutdown: `cancelTracked` then `cancelVenueOrders`, logs `canceled N of M tracked + K swept` (L216-227). README: survived a 2h live testnet soak across 28 market rolls with zero errors (`strategies/ec-maker/README.md:4-6`); keep `MM_QUOTE_SIZE ≤ MM_INVENTORY`.

### 3.2 ec-passive — patient entry with one resting bid (`strategies/ec-passive/src/index.ts`, 264 lines)

The lesson bot: a passive order buys cheaper than a market order, at the cost of maybe not buying at all (L9-16).

Per cycle (default 15s):

1. **Pick ONE market** (`pickMarket`, L100-115): Trading on-chain, `EC_UNDERLYING` match, enough time left for a dip (`minLeftFor` = 40% of window, floor 30s, cap 600s, override `EC_MIN_LEFT_S`, L69-72), preferring the **longest** window.
2. **Window rolls**: if the chosen outcome symbol changed, reset the position count — the old bid died with its market (L148-154).
3. **Fills are ground truth**: position = sum of the wallet's own buy trades on the symbol since start (`filledPosition` via `fetchMyTrades`, L85-97), not what was ordered. Non-sell trades count because mint-a-pair fills may carry no side (L90-92).
4. **Done state**: at `EC_MAX_POSITION` shares, cancel any remaining bid and hold to resolution (L167-179).
5. **Never take**: if best ask ≤ target, do nothing — "the market came past us, staying passive" (L194-200). (An impatient variant would IOC; that's a different bot.)
6. **Keep exactly one resting bid at the target**: an order already at the right price stays put (churning cancel/replace loses queue position); strays are cancelled (L204-209).
7. **Place post-only with an order-level expiry**: `expiresInSec: max(60, 3 refresh cycles)` (L214-223) so a crashed bot's bid ages off the book on its own. A post-only that "did not rest" is a book-moved-into-us event, not a revert (L228-230).

Shutdown: `cancelTracked` + sweep on the working symbol, then report what actually filled (L240-252). README caveat worth quoting for our UX copy: getting filled "on a dip" in a binary means buying exactly when your side got less likely — **passive entry carries adverse selection** (`strategies/ec-passive/README.md:27-29`).

### 3.3 ec-laddering-bot — probability ladder + flatten (`strategies/ec-laddering-bot/src/index.ts`, 441 lines)

Passive mean-reversion on one market: buys fill on dips, sells fill on rips.

Cycle logic:

1. **Pick one market** — longest TTL, optional `EC_MARKET` pin / `EC_UNDERLYING` filter (`pickMarket`, L109-131). When nothing matches, `explainNoMarket` (L134-179) diagnoses in order: indexer has zero active binaries (wrong `NETWORK`/`VENUE_ID`) → venue scoping ate everything (set `VENUE_ID`/`OPERATOR_ID`) → nothing Trading on-chain → all past expiry. This graduated diagnosis is worth copying into any market-picker UI.
2. **Two modes by time left** (L407-411): inside `flattenBufferMs` (= `headroomSec(interval)*1000`, i.e. scaled to the series; `GRID_FLATTEN_BUFFER_MS` pins it, L57-61) → **flatten**; otherwise → **grid**.
3. **Grid mode** (`cycleGrid`, L282-357): seed inventory once; center = `GRID_CENTER` or YES mid or 0.5 (L294-300); build `GRID_LEVELS` symmetric buy rungs below / sell rungs above at `GRID_SPACING` steps (`buildRungs`, L186-193); filter rungs by net-inventory cap and sell-side inventory (`filterRungs`, L195-202); cancel stale, re-place all as post-only; heartbeat line every 30s with center, net, rungs, minutes left (L343-356).
4. **Flatten mode** (`flatten`, L222-280): cancel resting orders → **`burnSet`** the paired YES+NO back to collateral (L246-251) → **IOC-sell** the excess leg at `bestBid − 0.002` (`iocSell`, L204-220, with an on-chain balance assertion before each sell, L256-274) → if residual net remains, log "book may be one-sided; hold or redeem after settle via ec-settlement" (L277-279).
5. **On-chain balances as truth**: `readBalances` reads YES/NO outcome-token balances from the chain, net = yes − no (L87-96).

README design notes (`strategies/ec-laddering-bot/README.md`): "flatten before expiry is non-negotiable — an open grid at lock is a settlement bet, not relative value" (L17-19); keep `GRID_LEVELS × GRID_SIZE ≤ MM_INVENTORY` (L58-59); a one-way move loads the wrong side — this is relative value, not riskless (L33-36).

### 3.4 ec-oracle-follow — directional taker (deep dive in §4 for the model)

`strategies/ec-oracle-follow/src/index.ts` (545 lines) + `signal.ts` (403) + `position.ts` (87).

Three design axioms (`index.ts:9-27`, README L28-45):
- **A bearish view is BUY_NO, never SELL_YES** — a sell escrows the token sold, so no naked shorts exist; a buy-only bot needs no mint-a-pair seeding at all.
- **Direction comes from the UNDERLYING price feed, never the book** — pricing off the book you're about to cross is circular (`signal.ts:9-16`).
- **Level comes from the contract when readable** (strike or opening price), from market mid + momentum tilt when not.

The 11-step take pipeline (`takeOne`, `index.ts:187-457`):

1. On-chain status gate; clears per-market state when a market stops trading (L196-204).
2. **Near-expiry soft stop**, scaled: 40% of window, floor 30s, cap 300s (L223-227; rationale L88-104 — the venue can lock between snapshot and send, and a late IOC comes back `filled=0` with no error).
3. Sample spot, record into `SpotHistory`, compute momentum `r` over the lookback window; refuse while warming up or if the feed stalled (L229-241).
4. **Resolve the settlement reference** (`referenceFor` — fixed strike from the row, or the opening price via `getOpeningPrices` for up/down markets; see §4.4) (L243-249).
5. **Horizon-gate momentum**: only admissible when `ttl ≤ OF_MAX_HORIZONS × window` AND `|r| ≥ OF_MOMENTUM_THRESHOLD`; past the horizon the momentum *term* is muted, the market is still priced off moneyness (L250-261).
6. **Volatility measured, not assumed** — `expectedMove = max(measured ?? OF_EXPECTED_MOVE, OF_MIN_VOL)`; a hardcoded guess once priced a market the book held at 0.87 as 0.61; the floor exists because a stalled feed measures as zero vol = total certainty (L263-269).
7. **Market anchor**: YES-book mid (`marketImpliedUp`); on a one-sided book, strike mode falls back to the single-quote bound (`marketBoundUp`) while momentum mode refuses (L271-290).
8. **Leg selection by TILT sign, not `pUp > 0.5`** (L304-323): positive tilt (model more bullish than market) → YES cheap; negative → buy NO. **Opposing-leg guard**: never buy the leg opposite one already held — that just mints complete sets, locking collateral and paying two spreads; the bot sits the market out and says so once (L316-334).
9. **Disagreement ceiling** (`OF_MAX_DISAGREEMENT`, default 0.10): if |fair − market| exceeds it, refuse — a 25-cent "edge" on a liquid book almost always means the model can't see something the market can (L344-357).
10. **Edge floor** (`OF_EDGE`, default 0.03): cross only when best ask < fair − EDGE; otherwise record the closest-to-trigger market for the heartbeat (L359-385). Floor + ceiling form a **trade band**.
11. **Risk limits in DIRECTIONAL shares** (net per market ≤ `OF_MAX_SHARES`, total net ≤ `OF_MAX_EXPOSURE`, per-market cooldown) → size = min(ask size, room under both caps), quantized (L387-413) → **IOC** at `ask + 0.002` (cross a touch past the best so a shifting book still matches, L414-417, 440-448) → book only the **filled** amount (L444-456). Nothing rests, so nothing to cancel on shutdown (L533).

Every take logs a **"why" string** leading with the two inputs the fair value rests on — the settlement reference and the volatility — "because when this bot is wrong, it is almost always one of those two that was wrong first" (L420-428). Example (README L15-22):

```
DRY BUY_YES 5 BTC-...#YES @ ~0.777 (opening 63475.60 vs spot 63820.00, vol 0.056% measured,
    r +0.0020, tilt +0.040 off market 0.765, pUp 0.805, fair 0.805, ask 0.775)
```

Idle cycles emit a **heartbeat** (default 30s) summarizing: markets scanned, net/gross position (gross ≠ net ⇒ capital locked in complete sets), per-reason skip counts, the closest-to-trigger quote and the widest model-vs-market gap (L491-529). This is essentially a ready-made "agent status" feed.

**Risk accounting** (`position.ts`): YES and NO are not interchangeable risk — equal legs form a **complete set** that redeems for 1 collateral either way. `netOf = |yes − no|` is the bet; `setsOf = min(yes,no)` is riskless locked capital; limits run on net, keyed by market **symbol** (never pool address — v2 recycles pools across markets) (`position.ts:9-47`).

README honesty worth keeping in mind (`strategies/ec-oracle-follow/README.md:47-77`): the signal is a placeholder — short-window BTC momentum is one of the most arbitraged signals in existence; "the version of this strategy that makes money is a **staleness** play … a latency and attention edge against slow or absent makers, not a forecasting edge." Also a measured venue anomaly: books said ~coin-flip on markets whose underlying was already ~0.85% above the settlement reference — impossible under any driftless vol — so either testnet quotes don't track the underlying or `getOpeningPrices` isn't the actual reference; `OF_MAX_DISAGREEMENT` muzzles the bot precisely there (README L55-72 with a live-numbers table).

### 3.5 ec-settlement — watcher + claim sweep (`strategies/ec-settlement/src/index.ts`, 113 lines)

The other half of trading a binary: an outcome token only turns back into collateral at resolution.

- **Payout facts** (L13-14): winner redeems for `1 − settlement fee` (NOT 1:1); loser is 0; a **VOIDED** market refunds BOTH sides at 0.5 with no fee (which is why redemption takes an explicit outcome index).
- **Watch mode** (default): picks `EC_MARKET` or the first active market, polls `marketOnchain` every `WATCH_POLL_MS`, logs each status transition by name (`MARKET_STATUS` reverse lookup, L52), and on `isResolved || isVoided` reports the outcome and calls `redeemHoldings` (L85-101). Read-only without a `PRIVATE_KEY`.
- **Sweep mode** (`CLAIM=1`, L65-69): `claimSettled(ctx, { scan: CLAIM_SCAN })` walks recently settled markets for anything the wallet is owed. This is the common case, because **a settled market drops out of the "active" list and winnings hide** (L22-27).

---

## 4. The oracle-follow fair-value model (directly reusable for an in-app "AI/quant read")

All in `strategies/ec-oracle-follow/src/signal.ts`. This is a self-contained spot→probability engine: give it a spot feed, a settlement reference, time-to-expiry, and its own recent history, and it emits `P(up)` plus a tradable tilt vs the market. Nothing in it is bot-specific.

### 4.1 Inputs and state

- **Spot reader** — the SDK price-feed indexer serving the on-chain EMA oracle (`sdkSpotReader`, `signal.ts:43-51`; `ctx.exchange.fetchPrice(asset)` returns `{price, timestamp}` where the timestamp is the **oracle write time**, not read time). A REST fallback seam exists (`restSpotReader`, L59-71). Testnet has a bundled feed endpoint; mainnet needs `PRICE_FEED_URL` or the bot refuses to start (`index.ts:470-475`).
- **`SpotHistory`** (L82-177) — per-ASSET ring buffer (keyed by asset, not market, so history survives 5-minute window rolls), deduped on oracle timestamp, retained for `max(VOL_WINDOW_MS, 2×window)`.

### 4.2 Measured quantities

**Momentum** (`momentum()`, L159-176): the return over one lookback window `W` (default 60s),

```
r = (spot_now − spot_{now−W}) / spot_{now−W}
```

with two refusals that matter: latest sample older than `OF_MAX_SPOT_AGE_MS` (15s) ⇒ null — a stalled feed reads as "zero momentum" rather than "no data" unless you age it out explicitly; and history not reaching back a full window ⇒ null (warming up).

**Realized volatility** (`volatility()`, L128-149): from the same samples, sum squared log sample-to-sample returns divided by the **time they span**, scaled to one window:

```
σ_W = sqrt( ( Σ ln²(pᵢ/pᵢ₋₁) / Σ Δtᵢ ) × W )        (needs ≥ 12 samples)
```

Dividing by elapsed time rather than sample count is what makes this survive a slow oracle: repeated prices contribute zero to the sum but still advance the clock, and each real jump arrives carrying its whole move, so the two effects cancel (comment L117-127 — simulated against a feed 6× slower than the poll rate, this agrees with a whole-window-stride estimator to within 1% while needing one window of history instead of six). Until warm, `OF_EXPECTED_MOVE` (0.0015) stands in; `OF_MIN_VOL` (0.0002) floors it — **zero measured vol means the model is certain, the one failure direction not allowed** (`index.ts:73-76`).

### 4.3 The two models (`estimateUp`, L249-287)

Both are scored against the market's own `P(up)` — `anchorUp` = YES mid (`marketImpliedUp`, L311-317), or on a one-sided book the single-quote bound (`marketBoundUp`, L298-301: an ask caps fair value, a bid floors it — deliberately not called a mid, and the doc note at L207-211 flags the resulting conservative bias toward NO).

**Strike model** (the standalone fair value — used whenever a settlement reference resolves):

```
horizons  = max(ttl / W, 0.05)                     // lookback windows still to run; floored so the
                                                   // final ticks don't divide the scale to zero
moneyness = (spot − strike) / strike
drift     = r × sqrt(horizons)                     // momentum is diffusive, NOT ballistic
scale     = expectedMove × sqrt(horizons)          // plausible move grows with √time
z         = (moneyness + drift) / scale
P(up)     = clamp( 0.5 + 0.5·tanh( sqrt(2/π) · z ), 0.05, 0.95 )
tilt      = P(up) − anchorUp
```

Notes baked into the code:
- `tanh` with `k = √(2/π) ≈ 0.798` stands in for the normal CDF Φ — slope at zero matches φ(0), within ~0.018 of Φ over the useful range (L181-182, README L122-123). The README table (L59-62) shows the model tracking Φ to ~0.008 on live inputs.
- **Drift scales with √horizons, same as the scale**, so momentum's share of `z` stays `r / expectedMove` independent of horizon (L270-277). Linear extrapolation (`r × horizons`) would project an 8bp minute into a claimed 58% move over twelve hours and saturate the tanh on noise — "the further out the market, the more certain the model claimed to be."
- Why per-market strikes matter: two BTC markets sharing one expiry can resolve OPPOSITE ways when their strikes straddle the settlement price; a per-asset momentum number hands both the same probability and is guaranteed to misprice one (L237-246).

**Momentum model** (fallback when no reference resolves, or `OF_MODEL=momentum`):

```
anchor = clamp(anchorUp, 0.05, 0.95)
raw    = sensitivity × r                            // OF_SENSITIVITY, default 20
tilt   = sign(raw) × min(|raw|, room to the bound)  // clamp the TILT, not the sum
P(up)  = anchor + tilt
```

Clamping the tilt rather than `anchor + raw` is deliberate: clamping the result near a bound can shorten the tilt past zero and **flip the trade to the wrong leg**; capping by available room cannot change its sign (L254-262).

**Trading rule** (`Estimate` doc, L214-229): trade the sign of **tilt** (model − market), never `pUp > 0.5`. With YES at 0.75 and a bearish signal, `pUp ≈ 0.73` is still above 0.5 — the naive rule buys the leg the signal was against.

### 4.4 Resolving what the market settles against (`Reference`/`referenceReader`, L349-403)

Two kinds of binary market, only one wears its question in the symbol (README table L89-93):

| kind | symbol shape | settles against | level source |
| --- | --- | --- | --- |
| fixed strike | `BTC-6389760-04AUG26-1540` | a fixed price | the row's `strike` |
| up/down | `BTC-0-05AUG26` | its own **opening price** | oracle reference question via `client.getOpeningPrices([marketId])` |

**The trap**: reading `strike = 0` as "unreadable" makes every up/down market look unpriceable — and measured on the live venue, *every* market on operators 1 and 2 reports `strike = 0`, with operator 2 carrying the two-sided books (README L94-100). The opening price is one indexer call away; resolved openings are cached forever, unanswered ones are retried next cycle (L385-401).

**Strike scale inference** (`scaleStrike`, L329-347): the feed reports human units (63494.76) but `strike` is a raw integer in the oracle's own unstated scale (6352741 = cents). The code tries every power of ten 0..18 and keeps the candidate closest to spot in log distance; if the best is still >2× from spot it **refuses** rather than trade a fabricated number — short-dated windows are struck near the money, so the right scale is never ambiguous by more than 10×.

---

## 5. LLM-in-the-loop and ensemble patterns

### 5.1 `strategies/ensemble` — the kit's clean LLM template (spot, pattern fully portable to EC)

Pipeline per cycle (`src/orchestrator.ts:193-291`): sample mid (interval + WS pushes, L166-191) → run enabled analyzers → fuse (LLM or majority vote) → hard risk gate → IOC execution → manage one long with TP/SL.

**Analyzers** (advisory-only, each returns `{signal: BUY|SELL|HOLD, confidence 0..1, reason}`):
- Momentum: half-window average vs half-window average + breakout flag (`src/strategies/momentum.ts:19-60`).
- Mean-reversion: RSI(14) + Bollinger(20, 2σ) band touches (`src/strategies/mean-reversion.ts:20-70`).
- Grid: position of mid within the recent range — bottom quartile BUY, top quartile SELL (`src/strategies/grid.ts:19-58`).

**Prompt design** (`src/brain/prompt.ts`): a terse system prompt fixing an exact one-object JSON schema — `{"action","strategy","price","amount","stopLoss","takeProfit","confidence","reasoning"}` — with two behavioural rails: *"Prefer HOLD when signals conflict or confidence is low"* and *"SELL means sell base inventory, not short"* (L11-16). The user message is a compact snapshot: mid/bid/ask, both inventories, sample count, and one line per analyzer signal (L18-32). `temperature: 0.2` (`brain/index.ts:167`).

**Validation and gating of LLM output** — the important part (`src/brain/index.ts`):
1. **Fail-open to a deterministic decision**: no API key (unless localhost/Ollama), HTTP error, timeout (`AbortController` at `OPENAI_TIMEOUT_MS` 45s), or parse failure ⇒ `majorityVote` — never a dropped cycle, never an unguarded LLM retry loop (L150-196).
2. **Parse defensively** (`parseDecision`, L81-142): regex the first `{...}` out of the text; whitelist `action`; coerce unknown `strategy` to MOMENTUM; **fill any missing/invalid price/amount/SL/TP from the live book and config defaults**; clamp confidence into [0,1].
3. **The LLM never gets the last word** (`src/risk.ts:48-99`): `validateTrade` re-sizes the order to `maxRiskPercent` of the free balance, rejects a BUY whose stop-loss isn't below entry or take-profit above it, requires actual inventory for a SELL, and enforces the venue `minQty`. A **circuit breaker** halts everything when cumulative PnL ≤ −`maxLossPercent` of starting equity (L28-39), checked before anything else each cycle (`orchestrator.ts:197-201`).
4. **Exit thresholds**: an open long only exits on a SELL decision with `confidence ≥ 0.3`, or on TP/SL checked *before* new entries (`orchestrator.ts:216-226, 249-257`).

**Majority vote** (`brain/index.ts:26-79`): confidence-weighted sum per action; ties broken by highest single confidence, else HOLD; the winning side's highest-confidence signal donates strategy label + reason; price from the touch, size from `notionalUsdso`.

**Attribution memory** (`src/memory.ts`): JSON files under `strategies/ensemble/data/` — last 500 trades with source (`llm` vs `vote`), reasoning and confidence; per-strategy win/loss stats; last snapshot of signals + decision (L63-92). Exactly the shape of data an in-app "why did the agent do that" panel needs.

Config defaults (`src/config.ts:28-72`): loop 60s, notional 25 USDso, cross 8 bps, TP 1.2% / SL 1.0%, max risk 15% per trade, halt at −50% equity, `FEATURES_AI=false` by default (vote-only, no key needed). Backtestable via `npm run backtest -- run ensemble ...` (README L69-76); `startBacktest` swaps in a SimPool and skips WS/timers (`orchestrator.ts:99-126`).

### 5.2 `examples/01-multi-strategy-ai` — LLM agent with richer context (reference-grade)

An LLM decision bot over grid/momentum/mean-reversion/CoinGecko-sentiment signals, driven through the **OpenCode agent SDK** (spins up or connects to a local server, resolves a model from available providers with a preference ladder, `brain/index.js:31-115`). Techniques worth stealing:
- **Session rotation** every `OPCODE_SESSION_ROTATE` cycles to keep context fresh (L282-304), plus health-check + reconnect on network errors (L325-359).
- **Prompt with track record**: last 15 candles, last 10 trades, vault balances, the open position and its unrealized PnL, per-strategy win-rate history, an explicit risk section ("Circuit breaker at −X"), and the max trade size *stated in the prompt* (L196-277).
- **Robust extraction ladder**: structured output field → JSON-with-`"action"` regex from text → retry (max 2, backoff) → HOLD fallback with reason; 45s timeout race (L361-426). Every failure path degrades to HOLD, never to a trade.
- README warnings: legacy vault-first funding flow, `quoteDecimals` 6-vs-18 bug, needs modernizing (`examples/01-multi-strategy-ai/README.md:16-19`).

### 5.3 `examples/08-regime-multistrategy` — drawdown-adaptive risk regimes

The standout is `src/regime.ts` (58 lines, ships with an asserting test `src/regime.test.ts`): a three-state machine keyed on drawdown percent —

- `healthy` → all modules (grid, growth/maker, volume, pickoff-arb);
- `caution` (dd ≥ `cautionDrawdownPct`) → mute pure volume ("it burns capital");
- `defensive` (dd ≥ `defensiveDrawdownPct`) → grid + earn only;
- **2% hysteresis** on the way back up so it doesn't flip-flop at the boundary (L23-44);
- plus a per-regime **clip-size multiplier** (L52-56).

Other honest patterns per its README: modules that only *propose* orders, merged by an orchestrator; a Binance-fed mispricing taker (PickOff) as the genuine alpha module; single-nonce execution queue + watchdog + flatten-and-stop; and a warning that the log's running volume is optimistic (counts IOCs at placement assuming full fill) — **the authoritative number is the on-chain `OrderFilled` stream** (`examples/08-regime-multistrategy/README.md:8-33`).

---

## 6. ec-doctor and the ec-test harness (our smoke-test blueprints)

### 6.1 `scripts/ec-doctor.ts` — read-only EC preflight (149 lines)

`NETWORK=testnet npm run ec:doctor`. Sends no transactions. Verifies, in order:
1. Config echo: network + chain id, indexer URL, dry-run flag, **book grid** (decimals/tick/lot with `MM_TICK`/`MM_LOT` overrides), venue env (L76-83).
2. **Venue resolution**: `resolveVenue` — prints the scope, its source, and the scoped-active count; a multi-venue ambiguity error exits 1 with the message (L85-96).
3. **Wallet health for both keys** (`PRIVATE_KEY` and `TAKER_PRIVATE_KEY`): derived address, native gas balance, collateral (USDso) balance (L44-69, 98-99).
4. **Up to 12 scoped markets**: on-chain status name, TTL in minutes, and best YES bid/ask from a live book snapshot — with per-market error capture (L101-125).
5. Actionable hint when zero markets: "set VENUE_ID from a live market row" (L127-132).

Operational scar tissue: it exits explicitly because `shutdown()` races a websocket close against 3s, and an unclosed socket kept the event loop (and the process) alive after the whole report printed (L138-148 — same hang bit `post-check.ts`).

### 6.2 `scripts/ec-test/` — gated conformance harness

**`matrix.mjs`** — declarative test matrix over the six EC bots (L6-13):
- **Gate 1 (dry, no keys, 90s each)**: strips keys, asserts startup indicates dry-run and the bot either acts or explains a reasoned wait (L24-47). Negative cases: empty `VENUE_ID` must start with an inferred venue or throw an actionable multi-venue error (L49-68); a **bogus venue must report no markets AND place no orders** (inverted regex assertion, L69-86); mainnet with no price feed must fail with `No price feed configured` (L87-101).
- **Gate 2 (wet testnet, 30min each)**: `DRY_RUN=false` with real assertions — ec-maker must print a live two-sided quote (explicitly *not* the startup banner, so a bot that never quotes can't pass, L114-119); ec-starter and ec-oracle-follow run **against a counterparty ec-maker on a second wallet** so liquidity exists ("a starter that crosses nothing in 30 minutes is broken, not unlucky", L131-139); passive must rest/fill/explain; laddering must ladder/heartbeat/flatten; settlement watch + claim sweep. Two long cases carry a `minDurationMs` **floor the duration override cannot undercut** — a window roll happens on the venue's clock, not ours (L233-271, 281-289).
- **Gate 3 (mainnet micro-smoke, 120s)**: real money, so quote 0.05 shares / 0.02 rungs, hardcoded mainnet `VENUE_ID`, requires `EC_ALLOW_MAINNET=1`; must act or state why not, and exit 0 (L198-231).
- Cross-cutting (`CROSS`, L16-20): clean shutdown message, **no unhandled rejections** (applied centrally to every case so a new case can't forget it, `run-gate.mjs:47-51`), exit code 0.

**`run-gate.mjs`** — the runner (323 lines). Notable engineering:
- Spawns `npm run start -w <bot>`, captures logs, SIGTERM at duration, **SIGKILL only after a 30s grace** — 8s was killing bots mid-cleanup and recording exit 1 (L126-138).
- **Counterparty wallet discipline**: a taker case without a distinct `TAKER_PRIVATE_KEY` is *skipped loudly*, never silently run on one wallet — two senders race each other's nonce and the pool refuses self-matches, so the liquidity the case depends on cannot exist (L63-79, 183-187).
- **Open-order leak check** around every wet run: `post-check.ts` before and after, pass = **delta ≤ 0** (wallet-wide absolute counts would fail forever on one stale order); an unreadable check retries once and then **fails the case** — "a leak check that did not run is not a clean book" (L209-257). The probe inherits the case's `NETWORK`/`VENUE_ID` because it once counted testnet orders while the bot traded mainnet (L88-94).
- Artifacts: `<case>-<ts>.log` + `.json` (assertions, exit code, tx hashes, pre/post order counts) under `artifacts/` (L259-276). Gate-2 cases run sequentially with a 15s gap (parallel runs caused `nonce too low`, L299-301).

**`post-check.ts`** — one-shot JSON probe of the wallet's open orders + collateral. Uses `client.getPortfolio` (binary portfolio only) instead of `fetchOpenOrders()` with no symbol, which sweeps binary+spot+perp against 500+ symbols and times out (L20-27); exits explicitly (~4s).

**`settlement-e2e.mjs`** — the full lifecycle test: phase 1 buy into a live short window with ec-starter (auto-claim off so the later redemption is attributable), phase 2 wait `SETTLEMENT_WAIT_MS` (default 6min), phase 3 `CLAIM=1` sweep. Pass requires **traded > 0 AND sweep ran AND something redeemed** — a run where the buy never filled is "a failure to test, not a pass" (L74-86). Trades are counted from human-readable log lines, not tx hashes, because strategies never print hashes (L69-74).

**`report.mjs`** — merges the **latest** artifact per case id (filename-timestamp ordering) into `docs/tests/ec-test-report.md` between AUTO markers; merging all runs once listed the same case three times with two verdicts (L20-27).

### 6.3 `scripts/checks.mjs` — static consistency checks (CI, ~1s, no network)

Ten rules "that hold this kit together and that nothing else enforces" (L1-15): every strategy dir present in the Railway allow-list (L54-61); every `npm run x` mentioned in code/docs actually defined (L68-105); **every env knob the ec-* code reads documented in `.env.example`** (regex over `process.env.X` and helper calls, L115-135); the `MARKET_STATUS` enum matches Listed 0 → Voided 5 (an off-by-one trades a locked market, L138-145); **no EC taker uses `type: "limit"`** — must be IOC, else the unfilled remainder rests with escrow locked (sharp edge 4, L151-161); **every order-placing EC bot has an expiry-headroom gate** (sharp edge 8, L167-178); the six published contract addresses match the docs table (L181-198); markets-sdk **>= 0.23.0 hard floor** — the indexer dropped a column that 0.22 still selects, so every market read fails below it (L200-218); shared knobs like `EC_UNDERLYING` honored by the whole family or none — "half-support reads as a capability" (L228-248); every strategy has a README and every ec-* appears in `docs/event-contracts.md` (L251-266).

---

## 7. Hard facts from the test report (`docs/tests/ec-test-report.md`)

Plumbing conformance, explicitly **not** a trading-performance endorsement (L3). Run 2026-08-06/07.

**Environment as-tested** (L30-43): testnet chain 50312, venue `0x679795…8a28c`; mainnet venue `0x458b30…432d`; wallets A (primary) + B (counterparty maker). SDK note: `^0.22.0` at test time with 0.23.0 then breaking reads (`field 'fundingWindowSec' not found`); the indexer has since flipped — `checks.mjs` now enforces **>= 0.23.0** because 0.22 selects a dropped column. Moral for us: **pin the markets-sdk version deliberately and expect indexer schema drift**; venue IDs "moved three times in the first week of August" (`.env.example:41-47`).

**Results** (L18-27): Gate 1 9/9 dry; Gate 2 9/9 wet testnet, every case exit 0 and **no new open orders left**; Gate 3 6/6 mainnet smoke, each ending at zero open orders; whole mainnet gate cost ≈ **0.7 USDso** (L85). An earlier report also read 9/9 *before* four cases had any `must` and while "unknown" leak checks scored as clean — the current numbers come from assertions that failed real defects first (L23-26).

**Measured venue behaviour worth designing around:**
- ec-maker produced 26 live two-sided quotes in a 30-min testnet run (L65); oracle-follow filled `BUY_NO 5/5` and `BUY_YES 5/5` IOCs (L71); passive rested `buy 5@0.350` post-only bids and saw **3 window rolls in 5 minutes** (L67-68) — testnet runs 5m/10m (and even 60s) series; the settlement E2E redeemed **205 YES on a BTC 60s window** (L74). Laddering followed a **BTC ↔ ETH daily roll** (L70).
- Both on-chain reverts observed in live testing landed **on the expiry second** of the target market (`ec-maker/src/index.ts:101-104`) — the scaled headroom gates exist because of this.
- Gotcha-conformance table (L98-114) verified all 12 documented sharp edges live, including: reverted writes don't throw (`assertTxOk`), float prices revert on the 18-decimal venue, escrow returns to the wallet on cancel, the **taker is charged the fill price not the offer**, and claims must go through `settledMarkets()` because settled markets vanish from `loadMarkets()`.
- Defect log (L117-133), the operationally important ones: **D7** — shutdown asked the indexer what was resting and missed the last-seconds orders (ec-starter stranded 3 while logging "canceled 0"; ec-maker stranded 1 while logging "canceled 14") → fixed by tracking placements locally (`cancelTracked`) plus a sweep; **D9** — the leak check read the wrong chain and the first honest mainnet reading showed 7 stranded orders; **D10** — an order can rest on-chain while the placing call **throws on the way back** (mainnet `Missing or invalid parameters`), leaving no order id to record → belt-and-braces cancel; **D11** — an empty gas tank surfaces as `Missing or invalid parameters` (viem wrapping "insufficient balance"), 24 identical error lines before anyone checked the native balance → `placeLimit` now preflights gas; **D5** — an unclosed websocket kept a finished probe process alive forever.
- Ops notes (L77-81): run wet cases sequentially with 15s gaps (nonce races otherwise); give shutdown 30s, then the exit code means something.

---

## 8. Edge analytics and backtest

### 8.1 `tools/edge-analytics` — markout / adverse-selection methodology

Answers "does your maker actually have an edge?" from your own fills. Market-making is one inequality (Glosten–Milgrom 1985): **profit ⇔ captured spread > adverse selection** (`README.md:14-19`).

Core decomposition (`src/markout.ts:16-25`), per fill at horizon h, with `sign = +1` bought / `−1` sold:

```
capturedSpread = sign · (mid₀ − p) / mid₀          // paid at the touch
adverseMove(h) = sign · (mid_h − mid₀) / mid₀      // where the market went while you held
netEdge(h)     = capturedSpread + adverseMove(h)   // the go/no-go number
```

(all reported in bps; `markoutFill`, L70-95). `midAt` binary-searches a timestamp-sorted mid series and **refuses** anything staler than a max-staleness bound — "we never fabricate a price we didn't observe" (L41-67). A mid path proxied from a trade tape is allowed but explicitly understates adverse selection (trades print at the touch), lower-bound only (L109-121).

The report (`src/report.ts`) aggregates per horizon (default set includes 1s/10s/60s): median/mean adverse and net, **worst-decile share** of adverse drift (Pareto — live data once showed the worst 10% of fills causing >50% of drift ⇒ a toxicity filter beats a wider spread, README L100-103), and **transactions-per-fill** = (post+cancel+reduce)/fill (healthy ≈ 1–3; the sample dataset shows 14 — gas becomes first-order, L104-107). The verdict function keys off the longest horizon's median net: `net < 0` ⇒ "NEGATIVE EDGE … tuning params won't fix this; change the edge"; `txPerFill > 10` ⇒ gas warning suggesting requote-on-move-only / `reduceOrder` / EIP-7702 batching (`report.ts:129-168`).

Inputs are the kit's own `csv-logger` `TradeRow` format plus a `ts,mid` book log (README L60-90); zero runtime deps; `npm test` covers the sign conventions.

### 8.2 `packages/backtest`

Bar-by-bar replay against historical OHLCV; strategies inject a `BotFactory` receiving a `SimPool` with the **same `place`/`cancel`/`topOfBook` surface as the live `Pool`** (`packages/backtest/README.md:3-5`), so the ensemble (and anything with that seam) runs unmodified in replay: `npm run backtest -- run ensemble --symbol WETH:USDso --interval 5m --days 7 --quiet`. Internals include a synthetic/hybrid book, queue model, fill engine, markout + metrics reporting (`packages/backtest/src/…`). Spot-oriented (candles per spot symbol) — for EC we'd reuse the *pattern* (sim pool behind the live interface), not the data pipeline.

---

## 9. Deployment: Railway, Docker, CI

- **`Dockerfile`** (22 lines): `node:20-bookworm-slim`, copies `packages/ strategies/ advanced/ scripts/` plus **`.env.railway` as `.env`** (safe defaults, no secrets), `npm ci`, `CMD node scripts/railway-start.mjs`.
- **`scripts/railway-start.mjs`**: one image, many bots — `STRATEGY` env selects the workspace from an allow-list of all 15 strategies including the six `ec-*` (L15-31; enforced complete by `checks.mjs`); validates + normalizes `PRIVATE_KEY` (auto-adds `0x` for MetaMask-style exports, L33-42); spawns `npm run start -w <strategy>` and **forwards SIGTERM/SIGINT to the child** so the bots' shutdown-cancel paths actually run under Railway's stop (L75-98).
- **`railway.toml`**: DOCKERFILE builder, `restartPolicyType = "ON_FAILURE"`, max 10 retries.
- **`.env.railway`**: full safe-default knob sets per spot strategy (`STRATEGY=starter`, `NETWORK=testnet`, `DRY_RUN=true`); EC knobs live in root `.env.example` instead.
- **CI** (`.github/workflows/ci.yml`): two jobs — build the Railway worker image (if the image can't build, the one-click deploy is broken) with GHA layer cache, and `npm ci` + `npm run typecheck` + `npm run check` (the consistency rules from §6.3). Least-privilege `contents: read`, concurrency-cancel on same ref.
- **Quickstart** (`scripts/quickstart.mjs`): interactive or flag-driven `.env` generator — picks strategy/network/symbol, writes a **throwaway random key** so dry-run works instantly with a loud never-fund-this warning (L93-109).

---

## 10. What we can lift into our product

Concrete, in rough order of leverage for a consumer app + AI agents on DreamDEX ECs:

1. **The oracle-follow fair-value engine as a "Sensei"/quant-read feature.** `signal.ts` is a self-contained spot→P(up) module: measured vol (§4.2), the √-horizon strike model with the tanh-Φ approximation (§4.3), reference resolution incl. the `strike=0` → opening-price trap and scale inference (§4.4). Feed it the same SDK price feed and any market row and render: model P(up), market P(up), tilt, "needs X more edge", and the why-string inputs (reference, vol, momentum). The heartbeat/why-string format (`index.ts:420-428, 512-529`) is a ready-made explanation UI.
2. **The edge band as a product guardrail.** `OF_EDGE` floor + `OF_MAX_DISAGREEMENT` ceiling (§3.4 steps 9-10) is the honest pattern for any AI that recommends trades: recommend only when the market is a *little* cheaper than the model; when it's *wildly* cheaper, say "the model is probably missing something" instead. Same for tilt-not-pUp leg selection and the complete-sets/opposing-leg logic (`position.ts`) — our position UI should show **net, gross, and locked sets**, not shares bought.
3. **Ship ec-doctor as our health check.** §6.1's sequence (config echo → venue resolve → wallet gas/collateral → per-market status/TTL/book) is exactly a deploy-time and support-time diagnostic; the graduated `explainNoMarket` diagnosis (`ec-laddering-bot/src/index.ts:134-179`) is the empty-state copy for our market list.
4. **Embed a "strategy runner" service the railway-start way.** One container, `STRATEGY` env + allow-list + signal forwarding (§9) — our app can spawn per-user or per-market agent workers with the same pattern, and the matrix/run-gate harness (§6.2) becomes our integration test: dry gate, wet gate with a counterparty wallet, and the **open-order delta leak check** around every wet run.
5. **Copy the operational hardening wholesale**: cancel-tracked-then-sweep shutdown (indexer lag, D7/D10), gas preflight before signing (D11), interruptible sleeps, order-level `expiresInSec` so crashed agents' orders age off, explicit `process.exit` after websocket shutdown (D5), sequential writes per wallet (nonce races), scaled expiry headroom everywhere (both observed reverts were at the expiry second).
6. **The ensemble brain as our agent template**: strict one-object JSON schema + "prefer HOLD" rail, fail-open to majority vote, defensive parse with book-derived defaults, and a **post-LLM risk gate + circuit breaker that the model cannot override** (§5.1). The attribution memory (trades + per-strategy win rates + last snapshot) is the data model for an in-app agent activity feed; example 01 adds session rotation and prompts that include the agent's own track record.
7. **Regime manager for agent risk posture** (§5.3): 58 lines, tested — drawdown → healthy/caution/defensive with hysteresis and clip multipliers. Perfect fit for a user-facing "aggressive/normal/protective" agent state that de-risks automatically.
8. **Edge analytics for a trader-edge page** (§8.1): the markout decomposition + verdict gives users "your fills earn X bps at the touch and give back Y bps within 60s; net Z" plus worst-decile concentration and tx-per-fill — log fills in the `TradeRow` CSV shape from day one and this tool runs as-is. For binary markets, also mark to realized settlement (its own documented limitation).
9. **Auto-claim + claim sweep as a retention feature**: settled markets vanish from the active list so winnings hide (§3.5) — the app should run a `claimSettled`-style sweep (or surface "you have unclaimed winnings" from `settledMarkets()`), and remember: winner pays a settlement fee, voids refund both sides at 0.5.
10. **checks.mjs-style repo invariants in our CI**: every env knob documented, status enum pinned, taker-must-IOC, headroom-gate-required, address-drift, SDK version floor (§6.3) — cheap, network-free, and each rule exists because something real broke.
11. **Facts to hard-code into planning**: testnet runs 5m/10m (even 60s) windows and rolls constantly, mainnet 15m/1h; venue IDs move — read them off live market rows, never hard-code; markets-sdk floor 0.23.0 with expected indexer schema drift; the whole 6-case mainnet smoke cost ~0.7 USDso, so real-money verification is cheap.
