# Protocol verification — reference basis & market identity (Story 1.4)

**Verdict:** the oracle settles up/down markets on its own median print, which the price feed's **EMA** tracks within a median 0.46 bps (spot 0.68 bps; worst boundary 2.62 vs 4.17 bps) over 40 settled rounds across 5m/15m/1h/4h/24h — `PRICE_BASIS = ema`, `ORACLE_PRICE_SCALE = 2` (cents), `getOpeningPrices` agreed with the reference answer 40/40, the "closes at or above open" rule held 40/40, and **no escalation** (0/40 rounds off by more than 5 bps).
**Identity:** the venue keys a market by its bytes32 `marketId` (small sequential integers, e.g. 65305 — the `BinaryMarketsModule.markets()` key and the indexer PK); the settlement singleton keys the same market by `marketKey = yesId >> 8 = (uint160(pool) << 64) | nonce`, verified 10/10 (5 live + 5 finalized) — contracts store `marketId` only and re-derive pool/nonce/outcome ids in-tx from the module record.

Pinned in `packages/markets/src/identity.ts`. Read-only spike; scripts in `scripts/spike/` (`pnpm --filter @masayume/scripts spike:reference | spike:pin-id | spike:roll-gap`). Venue `0x679795a0…a28c`, Somnia Shannon (50312), run 2026-09-01 08:27 UTC.

## What downstream stories must know

- **Chart / distance readout (1.7):** the opening line is the oracle's reference print (`getOpeningPrices`, 2-decimal cents). Draw the live line from the feed's `ema` series (`raw.ema`, 1e18-scaled) and label the source as "Prophecy oracle median · feed EMA". Both feed series stay within 5 bps of every print observed; spot is noisier by ~0.2 bps median.
- **Fair Value model (5.1):** anchor moneyness on the EMA (what settles); note that realized volatility computed on the EMA is smoothed — if σ looks too low, compute σ on `raw.price` ticks and moneyness on `raw.ema`, and say so in the model note.
- **Verdict (1.9):** winner is exactly `closing ≥ opening` (40/40); the closing answer lands a median **2 s after expiry** (max 3 s), so "Settling…" is a seconds-long state on this venue.
- **Claims (1.10) and contracts (Epics 6/7):** `getSettlement(marketKey(yesId))` is the redemption record; `finalized` is false on live markets and true on every finalized row sampled, and its `(pool, nonce)` matches the module record. Persist `marketId`; never a pool address (AD-10).
- **Lanes / between-rounds (1.6):** windows are back-to-back — `ROLL_GAP_SEC = 0` for 5m/15m/1h (next `tradingStart` == previous `expiry`). A gap > 0 is a skipped window (4 of 66 on the 5m series, one of 6902 s), not a roll delay; a series' first market can be a bootstrap partial (298 s / 898 s intervals appear in the indexer's `intervalSec`), so group lanes by the snapped `interval` label.
- **Demo risk (OQ-10):** books are not chronically at coin-flip — the last traded P(up) sat on the winning side in 19/27 rounds with a mean |P(up) − 0.5| of 0.23. The real thinness signal is that **13 of 40 sampled rounds had no trade at all** (mostly 5m), which is what the house maker (6.4) and seed script (9.3) exist to fix.
- **Cadences on this venue** at run time: live 5m/15m/1h/4h; 24h series exist in history.

## reference-basis output

| market | asset | cadence | open (oracle) | Δspot | Δema | exact | close (oracle) | Δspot | Δema | exact | winner | sign ok | last P(up) | lag s |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0x0000…ff2b | ETH | 5m | 2461.25 | +0.50 | -2.62 | none | 2458.76 | -1.85 | +1.23 | ema@+6s | DOWN | ✓ | 0.75 | 2 |
| 0x0000…ff2a | BTC | 5m | 78199.30 | +1.43 | -0.12 | none | 78126.71 | -3.86 | -0.45 | none | DOWN | ✓ | — | 2 |
| 0x0000…ff1c | ETH | 5m | 2463.32 | +0.73 | -0.46 | ema@+5s | 2461.25 | +0.50 | -2.62 | none | DOWN | ✓ | — | 1 |
| 0x0000…ff1b | BTC | 5m | 78298.43 | -0.05 | -1.66 | none | 78199.30 | +1.43 | -0.12 | none | DOWN | ✓ | — | 1 |
| 0x0000…ff0c | ETH | 5m | 2462.01 | -0.18 | +0.36 | none | 2463.32 | +0.73 | -0.46 | ema@+5s | UP | ✓ | — | 2 |
| 0x0000…ff0b | BTC | 5m | 78296.36 | -0.33 | +0.24 | none | 78298.43 | -0.05 | -1.66 | none | UP | ✓ | — | 2 |
| 0x0000…fefd | BTC | 5m | 78565.21 | +0.08 | -0.53 | none | 78296.36 | -0.33 | +0.24 | none | DOWN | ✓ | — | 2 |
| 0x0000…fefe | ETH | 5m | 2470.39 | +2.97 | +2.01 | ema@-9s | 2462.01 | -0.18 | +0.36 | none | DOWN | ✓ | 0.66 | 2 |
| 0x0000…feeb | BTC | 15m | 78618.75 | +0.02 | +0.00 | ema@-2s | 78298.43 | -0.05 | -1.66 | none | DOWN | ✓ | — | 2 |
| 0x0000…febb | ETH | 15m | 2470.14 | +0.50 | +0.47 | ema@+5s | 2472.00 | +1.15 | +0.90 | ema@-12s | UP | ✓ | — | 2 |
| 0x0000…feba | BTC | 15m | 78598.24 | +1.12 | +1.07 | none | 78618.75 | +0.02 | +0.00 | ema@-2s | UP | ✓ | 0.66 | 2 |
| 0x0000…fe8e | ETH | 15m | 2474.52 | +1.35 | +0.27 | ema@-2s | 2470.14 | +0.50 | +0.47 | ema@+5s | DOWN | ✓ | 0.44 | 1 |
| 0x0000…fe8d | BTC | 15m | 78755.70 | +0.99 | -0.35 | none | 78598.24 | +1.12 | +1.07 | none | DOWN | ✓ | 0.36 | 1 |
| 0x0000…fe60 | BTC | 15m | 78713.31 | -0.66 | -0.85 | none | 78755.70 | +0.99 | -0.35 | none | UP | ✓ | — | 2 |
| 0x0000…fe61 | ETH | 15m | 2473.26 | +0.95 | +0.42 | ema@-5s | 2474.52 | +1.35 | +0.27 | ema@-2s | UP | ✓ | — | 2 |
| 0x0000…fe32 | BTC | 15m | 78722.80 | -0.48 | -0.35 | none | 78713.31 | -0.66 | -0.85 | none | DOWN | ✓ | — | 2 |
| 0x0000…fe31 | ETH | 1h | 2471.39 | -1.17 | -0.72 | spot@-9s | 2472.00 | +1.15 | +0.90 | ema@-12s | UP | ✓ | 0.66 | 2 |
| 0x0000…fe30 | BTC | 1h | 78722.80 | -0.48 | -0.35 | none | 78618.75 | +0.02 | +0.00 | ema@-2s | DOWN | ✓ | 0.42 | 2 |
| 0x0000…fd7a | ETH | 1h | 2484.01 | +0.02 | -0.07 | spot@+0s | 2471.39 | -1.17 | -0.72 | spot@-9s | DOWN | ✓ | — | 2 |
| 0x0000…fd79 | BTC | 1h | 79163.03 | -0.98 | -0.31 | none | 78722.80 | -0.48 | -0.35 | none | DOWN | ✓ | — | 2 |
| 0x0000…fcc3 | ETH | 1h | 2469.17 | +0.92 | -1.22 | ema@+6s | 2484.01 | +0.02 | -0.07 | spot@+0s | UP | ✓ | 0.72 | 2 |
| 0x0000…fcc2 | BTC | 1h | 78707.30 | +0.68 | -0.83 | none | 79163.03 | -0.98 | -0.31 | none | UP | ✓ | 0.82 | 2 |
| 0x0000…fc0c | ETH | 1h | 2471.76 | -0.67 | -0.66 | spot@+9s | 2469.17 | +0.92 | -1.22 | ema@+6s | DOWN | ✓ | 0.74 | 2 |
| 0x0000…fc0b | BTC | 1h | 78662.50 | +0.07 | +0.07 | none | 78707.30 | +0.68 | -0.83 | none | UP | ✓ | 0.69 | 2 |
| 0x0000…fc0a | ETH | 4h | 2471.76 | -0.67 | -0.66 | spot@+9s | 2472.00 | +1.15 | +0.90 | ema@-12s | UP | ✓ | 0.59 | 2 |
| 0x0000…fc09 | BTC | 4h | 78662.50 | +0.07 | +0.07 | none | 78618.75 | +0.02 | +0.00 | ema@-2s | DOWN | ✓ | 0.51 | 2 |
| 0x0000…f923 | ETH | 4h | 2467.07 | +0.36 | +0.38 | spot@-8s | 2471.76 | -0.67 | -0.66 | spot@+9s | UP | ✓ | 0.76 | 2 |
| 0x0000…f922 | BTC | 4h | 78549.49 | +2.09 | +1.33 | spot@-34s | 78662.50 | +0.07 | +0.07 | none | UP | ✓ | 0.16 | 2 |
| 0x0000…f5c7 | ETH | 4h | 2482.46 | -3.48 | -1.56 | none | 2467.07 | +0.36 | +0.38 | spot@-8s | DOWN | ✓ | 0.44 | 2 |
| 0x0000…f5c6 | BTC | 4h | 78898.22 | -1.11 | +0.38 | none | 78549.49 | +2.09 | +1.33 | spot@-34s | DOWN | ✓ | 0.70 | 2 |
| 0x0000…f1e0 | ETH | 4h | 2467.15 | +0.26 | -0.35 | spot@-1s | 2482.46 | -3.48 | -1.56 | none | UP | ✓ | 0.81 | 1 |
| 0x0000…f1df | BTC | 4h | 78564.49 | +0.12 | -0.37 | none | 78898.22 | -1.11 | +0.38 | none | UP | ✓ | 0.56 | 1 |
| 0x0000…e5e2 | BTC | 24h | 77695.76 | -2.17 | +0.02 | none | 78549.49 | +2.09 | +1.33 | spot@-34s | UP | ✓ | 0.73 | 2 |
| 0x0000…e5e3 | ETH | 24h | 2417.84 | -4.17 | +0.64 | none | 2467.07 | +0.36 | +0.38 | spot@-8s | UP | ✓ | 0.98 | 2 |
| 0x0000…d524 | BTC | 24h | 78244.50 | -1.22 | -1.23 | none | 77695.76 | -2.17 | +0.02 | none | DOWN | ✓ | 0.92 | 2 |
| 0x0000…d525 | ETH | 24h | 2457.62 | +0.14 | -0.22 | ema@+2s | 2417.84 | -4.17 | +0.64 | none | DOWN | ✓ | 0.88 | 2 |
| 0x0000…c5b7 | ETH | 24h | 2442.64 | +1.00 | +0.92 | spot@+4s | 2457.62 | +0.14 | -0.22 | ema@+2s | UP | ✓ | 0.90 | 2 |
| 0x0000…c5b6 | BTC | 24h | 77840.02 | +0.15 | +0.23 | none | 78244.50 | -1.22 | -1.23 | none | UP | ✓ | 0.94 | 3 |
| 0x0000…b74b | BTC | 24h | 80273.30 | -0.41 | -0.53 | none | 77840.02 | +0.15 | +0.23 | none | DOWN | ✓ | 0.02 | 2 |
| 0x0000…b74c | ETH | 24h | 2511.46 | +0.53 | -0.23 | ema@+1s | 2442.64 | +1.00 | +0.92 | spot@+4s | DOWN | ✓ | 0.38 | 2 |

Δ columns: basis-point distance of the feed tick at-or-before the boundary from the oracle print. "exact" = the nearest feed tick (±60 s) whose spot or EMA equals the print to the cent, with its offset from the boundary.

- rounds analysed: 40 (5m, 15m, 1h, 4h, 24h)
- getOpeningPrices == openingAnswer.numericValue: 40/40
- exact feed match at a boundary — spot: 16/80, ema: 21/80
- median |Δ| at the tick at-or-before the boundary — spot: 0.68 bps, ema: 0.46 bps
- max |Δ| — spot: 4.17 bps, ema: 2.62 bps
- winner == (closing ≥ opening): 40/40
- median resolve lag after expiry: 2 s
- book vs outcome — last traded P(up) on the winning side: 19/27; mean |P(up) − 0.5| = 0.232
- PRICE_BASIS = ema · ORACLE_PRICE_SCALE = 2 · no escalation: 0/40 rounds off by > 5 bps on the ema basis

## pin-market-id output

| market | phase | marketId (dec) | marketKey (dec) | decode(yesId).pool == pool | decode(yesId).nonce == nonce | decode(yesId).idx == 0 | encode(pool,nonce) == {yesId,noId} | marketKey == yesId>>8 == marketKey(noId) | indexer yes/noTokenId == chain | indexer pool == chain | indexer nonce == chain | module.markets(marketId) == chain | settlement finalized | settlement (pool,nonce) == chain | settlement finalized == onchain.finalized |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0x0000…ff19 | live | 65305 | 2429392453473325105819150916351910448507711831473053251256975360090 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | — | ✓ |
| 0x0000…ff1a | live | 65306 | 7525681933675083252622571423162675887961920304113294670746164920404 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | — | ✓ |
| 0x0000…ff38 | live | 65336 | 15255081136919856037990843963300984111639228082097331317625635995731 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | — | ✓ |
| 0x0000…ff39 | live | 65337 | 3151516939678081086629642187656580734326325969892806729293868564558 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | — | ✓ |
| 0x0000…fee9 | live | 65257 | 10221734706750589761944390816493939947220321128248031678783377375267 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | — | ✓ |
| 0x0000…ff2b | finalized | 65323 | 23701063026255178465992127876971511962883830613181158414052709367885 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 0x0000…ff2a | finalized | 65322 | 7870256008126499428086951500824592374676744011887029141165930709087 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 0x0000…ff1c | finalized | 65308 | 15255081136919856037990843963300984111639228082097331317625635995730 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 0x0000…ff1b | finalized | 65307 | 3151516939678081086629642187656580734326325969892806729293868564557 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 0x0000…ff0c | finalized | 65292 | 23701063026255178465992127876971511962883830613181158414052709367884 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

- MARKET_ID_FIELD = marketId — bytes32, the BinaryMarketsModule.markets() key and the indexer primary key; values are small sequential integers
- SETTLEMENT_KEY = marketKey(yesId) = yesId >> 8 = (uint160(pool) << 64) | nonce — what BinarySettlement.getSettlement() takes; derived in-tx from module.markets(marketId).yesId, never stored
- marketId ≠ marketKey; contracts store bytes32 marketId only and re-derive pool/nonce/outcome ids from the module record
- all identity checks passed (the ✗ on live rows is the expected not-yet-finalized settlement record; it matches `onchain.finalized`)

## roll-gap output

| cadence | n gaps | min s | median s | max s | gaps > 0 |
| --- | --- | --- | --- | --- | --- |
| 5m | 66 | 0 | 0 | 6902 | 4 |
| 15m | 19 | 0 | 0 | 0 | 0 |
| 1h | 4 | 0 | 0 | 0 | 0 |

- ROLL_GAP_SEC = 0 for 5m / 15m / 1h (windows are back-to-back); a gap > 0 is a skipped window, not a roll delay. 4h and 24h series had too few past rows in the 100-row sample to measure.
