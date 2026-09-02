# The OracleHub as RangeReserve's price basis — spike (2026-09-02)

Stage 5 item 2's design check, run before any contract: can a range round settle on a price the chain
itself holds? The previous session's reading ("the hub refuses reads on a question once the answer is
pushed into the module; the indexer keeps only the strike and the winner") was wrong on both counts, and
the venue's own machinery turns out to be the basis. Evidence: `contracts/test/OracleHub.fork.t.sol`
(a fork of Shannon through the public RPC) and `scripts/spike/range-oracle.ts` (read-only, against
Shannon itself, waiting for a live Window to settle).

## What the hub actually does

| Read | Result |
|---|---|
| `pullNumericAnswer(49200)` from a contract on the fork (`HubReader`) | **7657070**, `voided = false` — 76,570.70 in cents |
| Window 70489 (BTC 15m, resolved minutes earlier) → `markets(id).oracleQuestionId` = 49279 → `pullNumericAnswer` | **7685230**; the hub's `voided` equals the Window's `isVoided()` |
| A Trading Window's question (70533 → 49286) | reverts with the one selector **`0x25cd016c`** (unnamed in the SDK's ABI; "pending") |
| `questionKeyOf(rebuilt definition)` → `questionIdByKey` | the Window's own question id, for BTC; the ETH definition maps nowhere — so **the asset of a Window is decidable on-chain** through the hub's key even though the module row carries no asset |
| `getSchedulingCost(rebuilt definition)` | **0** while the Window is live (content-addressed dedup, `MAX_BINDS_PER_QUESTION` 64) |
| `scheduleQuestion{value: 0}(rebuilt definition)` from a contract (fork) | returns the Window's question id (`QuestionReused`), nothing charged |
| Live, three settled samples (49280 ETH, 49279 BTC, 49258 a third party's) | hub `numericValue` == the indexer's `OracleAnswer.numericValue`, `voided` equal, 3/3 |
| Live, Window 70535 (BTC 5m, expiry 1788356100) | pending before expiry; `isResolved()` **2 s after expiry**; `pullNumericAnswer` **7673523** (76,735.23) on the first read after that; the indexer's `closingAnswer.numericValue` the same |

Recipes: `SHANNON_FORK_URL=https://dream-rpc.somnia.network FORK_MARKET_ID=70533 FORK_RESOLVED_MARKET_ID=70489
forge test --match-contract OracleHubFork -vv` (9 s); `pnpm --filter @masayume/scripts spike:range-oracle`
(picks the soonest hub-backed Trading Window and waits; `WAIT=0` to skip; `FORK_MARKET_ID` pins).

## The venue's closing question, byte-exact

Decoded from the roll transaction `0x87d7…df84` (block 477818236, a reactivity callback into the module,
which called `getSchedulingCost` then `scheduleQuestion{value: 1.296 STT}` on the hub per Window, then bound
each market with the 0.2 STT `resolveReserve`). `debug_traceTransaction` with the `callTracer` is served by
the public RPC; `cast logs` over more than a few hundred blocks is not.

```
questionText   "What is the price of BTC in USDC at unix time 1788355800 UTC?"   (excluded from the key)
sources        six JSON sources, params = abi.encode(string url, string jsonPath, uint256 2):
               binance klines [0][4] · okx history-candles data[0][4] · bybit kline result.list[0][4]
               kucoin candles data[0][2] · gate candlesticks [0][2] · mexc klines [0][4]
               — each the 1-minute candle ending at the resolution time, the close field
validAnswers   answerType Numeric(0), no discrete outcomes, one interval [0, int256.max], numericDecimals 2
resolutionTime the Window's expiry
minAgreement 4 · subcommitteeSize 3 · subcommitteeThreshold 2
```

`contracts/test/WindowQuestion.sol` and `scripts/spike/lib/oracle-hub.ts` carry the template; the fork test
fails on a key mismatch if the venue's template moves. The oracle's own prompt log (contract `0x037b…6776`)
shows the sources as fetched and a trust-and-safety policy prompt; nothing in it is needed on-chain.

The 1-minute lanes and operator 4's "Pricefeed test" markets use a different adapter (question ids are
hashes, fixed strikes): a range reserve must accept only Windows whose `oracleAdapter` is the hub and whose
`originVenueId` is the venue it was built for — those print at the venue's scale of two decimals
(context/40 `ORACLE_PRICE_SCALE = 2`). Question 49258's `768227300` is a third party's own question on the
hub, not a venue Window.

## What this settles for `RangeReserve`

- **The basis is the Window's closing print, read from the hub by the Window's own question id.** No
  question of ours to schedule, no scheduling cost, no co-signer, no off-chain print: `markets(id)` names
  the question, `pullNumericAnswer` answers it two seconds after expiry, and the read stays available.
- **The opening print is on-chain too, without an input.** The lanes are back-to-back, so Window W's
  opening print is the answer to the (asset, `tradingStart`) closing question — rebuild that definition,
  `questionIdByKey`, `pullNumericAnswer`. A Window with no such question (a bootstrap partial, a skipped
  Window) is refused rather than guessed.
- **The asset is verifiable on-chain.** The opener declares it; the contract rebuilds the (asset, expiry)
  definition and requires the hub's key to map to the Window's question. A wrong asset cannot pass.
- **Pending has one selector; void is a flag.** Settlement waits on `0x25cd016c`, refunds on `voided`, and
  keeps a long-grace permissionless void for a question the hub never answers.
- **Scheduling our own questions stays possible** (1.296 STT each at today's oracle price, `getSchedulingCost`
  quotes it) but is not needed while rounds sit on the venue's Windows.

Not covered: what the hub returns for a question the oracle voids (`voided = true` was never observed live);
the fork test asserts the flag equals the Window's own void state, which is the rule the reserve applies.

## Realized volatility from the venue's own prints (2026-09-02)

Consecutive back-to-back Windows of operator 2, closing prints from the indexer's `OracleAnswer` rows, log returns
between neighbours, the population standard deviation per Window, then per √second:

| Series | n | σ per Window | σ per √second | annualized | max move |
|---|---|---|---|---|---|
| BTC 5m | 388 | 10.66 bps | 0.6152 bps | 34.5% | 41.5 bps |
| BTC 15m | 394 | 18.12 bps | 0.6040 bps | 33.9% | 91.6 bps |
| ETH 5m | 370 | 12.98 bps | 0.7495 bps | 42.1% | 62.9 bps |
| ETH 15m | 377 | 24.14 bps | 0.8046 bps | 45.2% | 155.5 bps |

The √time scaling holds across cadences, which is what the model assumes. Launch parameters: BTC 6200, ETH 7800
(×1e-8 per √s). Tails are fat (a 4σ move inside five minutes was observed); the 12% margin, the caps and the
near-certain / longshot refusals are the buffer. Re-measure and `setVolatility` without a redeploy.

## The reserve on a fork (2026-09-02, later)

`contracts/test/RangeReserve.fork.t.sol` against Shannon through the public RPC, `FORK_MARKET_ID=70625` (BTC 5m,
question 49301, 279 s to expiry at the fork block). Every book on the venue was empty that afternoon (the makers were
offline — `getBookLevels` returned `[]` on every Trading Window, the daily ones included), so the test first rests a
maker's YES bid and NO bid at 0.48 for 50 contracts each through the venue's own `placeBinaryOrder`.

| Step | Result |
|---|---|
| `previewBasis(70625, "BTC")` | opening print **7710551** (77,105.51) through the hub's key of the (BTC, tradingStart) definition; book centre P(up) **0.4535**; σ 6200 |
| `previewOpen(inside, ±0.05%, payout 20)` | P(inside) **0.368391**; stake **8.251959** |
| `openRange` from the opener with `maxStake = stake` | charged exactly the preview; the reserve locked 11.748041; `oracleQuestionId` 49301 on the round; the asset proof cached; no storage write equalled the market address (AD-10) |
| `settle` before the oracle | reverts `NotSettled` (the hub's `0x25cd016c` caught and read as pending) |
| `vm.warp(expiry + 6 h)`, `voidStale` by the test contract | the round `VOID`, the opener refunded to the cent, `locked` 0, `liquid` back to 5,000 |

Gas for the whole scenario on the fork: 1,220,462 (forge's report — indicative only; Somnia's schedule runs ~10× the
standard EVM, context/41). A first open on a Window rebuilds two question definitions for the hub's key; later opens on
the same Window skip the rebuild.


## Live on Shannon (2026-09-02, eighth session)

`RangeReserve` at `0x1F8dB9B0913cB09e5CfDe44Adfa7Ff22b0868386`, block 478033175, deployed by
`0xdD7ae7c43e87Fae3eaE13c23C01eCa6D5bE8Bf9a` with the parlay's recipe. Creation **60,919,875** gas (0.366 STT at
6 gwei — the two `WindowQuestion` builders make it the largest of the reserves), `setVolatility(BTC)` and
`setVolatility(ETH)` 275,924 each in the same broadcast, then `approve` 259,745 and `supply(5,000 tUSDC)` 897,978.
`deployments/50312.json` carries `rangeReserve` / `rangeReserveFromBlock` (pinned by hand to the creation block).

## The first live opens (2026-09-02, later)

The basis moves with every second left: a `range-open` capped at the quoted stake came back `requote` at +0.06%
on a 1h Window and `StakeAboveMax(5.015123, 5.000000)` at +0.3% on a 15m Window seconds after the quote. The
reference caps its mint cost with a cadence-aware buffer (`costCapBuffer`); every range open here now carries
`RANGE_STAKE_HEADROOM_BPS` (3%) over the quote — the Ticket says "up to X if the basis moves before it lands" — and
the contract charges the exact fresh stake.

With the headroom, `range-open` landed on a BTC 15m Window: round 1, stake **5.008214** for the 5.00 quoted (the
basis moved 0.16% in the seconds between), tx `0x519ef575af58d43b1097a6c409891ca6648c340f5c8b7d5cf07ab7ab6146ceda`,
**4,527,445 gas** — the `range` lane's first measurement, inside its 8M ceiling.
