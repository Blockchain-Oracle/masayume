---
title: Masayume PRD Addendum
status: final
created: 2026-08-31
updated: 2026-09-01
---

# PRD Addendum — Masayume

*Technical decisions, rejected alternatives, and reference detail that belongs downstream (architecture, UX, build) rather than in the PRD narrative. Sources: `context/` docs (cited per section); locked decisions from `context/30-ideas-and-direction.md`.*

## A. Locked technology decisions (direction doc, 2026-08-31)

| Area | Decision | Rationale / notes |
|---|---|---|
| Chain access | `@somnia-chain/markets-sdk` **pinned exactly at 0.28.1** | Indexer schema drift vs SDK floor is real; no REST API exists for EC. Client tier for reads/watches, trader tier for writes, unified tier where walletClient signing fits. |
| Wallet | **wagmi v2 + RainbowKit**, custom `somniaShannon` chain (SDK ships the chain def); `useWalletClient` → `exchange.setSigner({ walletClient })` | **Privy rejected**: murky legacy/new API mix for custom-chain embedded wallets + origin-locked app keys — the exact class of setup that broke the reference product's judge quickstart (their Enoki keys were origin-locked). Adapter stays thin so Privy can be added post-hackathon. |
| Copilot LLM | **Vercel AI SDK (`ai` v7) + AI Gateway** (v7 is the current major — verified 2026-09-01; the locked decision named v6, superseded as a version-currency update, same stack); model string `anthropic/claude-opus-5` in env (swappable one-liner); `streamText` + `useChat`; key server-side only | Quant layer computes the numbers; LLM explains and enforces the Brake. |
| App frame | **Next.js App Router monorepo**: `app/` routes · `packages/core/` pure engines (sizing, PnL, leaderboard, parlay math — ported from the reference lib, tested) · `packages/markets/` the ONE chain adapter · web server routes (takes, Baku, stats provenance, OG render) · `contracts/` Foundry (EventVault, ParlayReserve, Waitlist) · `services/ops/` all house-key actors incl. the relayer and strategy runners (architecture AD-8 moved the relayer out of web server routes — nonce discipline needs a long-running single writer) | Clean-fork principle: port engines, own the architecture. Layout refined by the architecture spine (authoritative). |
| Persistence | **No database for chain truth**; small KV/Postgres only for Takes / Baku memory / ops | The reference product's proven pattern. |
| Config | `VENUE_ID` explicit in env with ec-core's empty-scope explainer; zero-env judge quickstart with hardcoded testnet fallbacks; DRY_RUN flags on the runner | Venue ids moved 3× in a week — read off a live market row when in doubt. |

## B. Chain-adapter seam (from `12-yosuku-data-layer.md` §5)

Interfaces `MarketsProvider` (reads/watches) and `Submitter` (writes) wrap the SDK behind one seam; domain types `EventMarket`, `Quote`, `OpenPosition`, `ClosedTrade`, `LedgerRow`. Everything above the seam is chain-agnostic and unit-testable; the seam is also where a second venue would plug in post-hackathon.

## C. Contract designs (EVM equivalents from `14-yosuku-contracts-and-services.md`)

- **EventVault** (no-divert): per-user ledger; `subscribe(agent, caps)` with caps = {maxStakePerTrade, maxDailySpend, maxOpenPositions}; `agentTradeFor` with beneficiary hard-wired (no beneficiary parameter); owner-only withdraw paying `msg.sender`; permissionless `crankSettle`; add-only `creditFor`. Attestation simplification: owner-set operator key + EIP-712 per-action sigs (digest over exact params, nonce + TTL) instead of TEE.
- **ParlayReserve**: escrow full max payout at open; stake floor recomputed on-chain: combined = Π p_i with correlation floor `max(raw, λ·min_i p_i)` (λ and margin: numbers bank §F; trigger = same-asset/same-oracle **or same-expiry** — union, reconciling the source's same-expiry rule with the asset-correlation case), rounding favors reserve; risk caps: `minCombinedProbBps` (longshot rejection), `maxExposureBps` aggregate across live tickets, per-ticket payout cap, `maxExpiryLocked` per-expiry sub-cap; legs must be future-expiry at open; permissionless idempotent leg resolution reading each market's settlement print; first-loss sweeps escrow; claim pays the ticket's stored owner; `adminVoid` refunds stake after grace. **Leg pricing: read from the on-chain book inside the opening tx** (the CLOB is fully on-chain — no server attestation, no trusted client input; recorded on the ticket for post-hoc audit). **Capitalization: house-seeded only in v1** — no public supply side.
- **Waitlist**: ~30-line contract, gas-sponsored joins, referral attribution, Founder = first 100.
- Positions ride **OutcomeToken6909** (one ERC-6909 singleton, `yesId`/`noId` per market); **BinaryMarketsModule** `0x3ecC694Cef705358864a646142ac17A90E29e388` (CREATE3, same address both networks).

## D. Protocol gotcha canon (binding; from `01-dreamdex-event-contracts.md`)

1. Gate every write on on-chain `status === 1` (indexer lags seconds).
2. `assertTxOk` every trader-tier write (receipts don't self-check).
3. Prices must land on-grid (float → `InvalidPrice` below 0.28).
4. Takers send IOC — unfilled limit remainders rest with escrow locked.
5. `expireTimestampNs` mandatory: ns, future, ≤ market expiry.
6. Sub-lot sizes floor to 0 silently — prevent at quote time.
7. Check collateral AND native gas before signing; reconcile against wallet.
8. Scope everything by `venueId`.
9. Expiry headroom `max(30, min(300, intervalSec*0.4))` — observed reverts land on the expiry second.
10. Find winnings via `listBinaryMarkets({venueId, status:"Finalized"})` (settled markets vanish from `loadMarkets()`).
11. Redeem explicitly with `outcomeIdx`; voids → redeem BOTH sides (0.5 each).
12. Key by `marketId`, never pool (recycled).
13. Never parse question text — use `asset` + `intervalSec`.
14. `PostOnlyWouldCross` is routine — catch → requote.
15. **Read the settlement fee from chain** (`settlementFeeBps`, indexer → chain fallback, recycled-pool-safe; `estimatePayout`) — winners redeem `1 − fee`, not 1:1; zero fees is a venue *setting*, not protocol.
16. **Resting-order hygiene** (for the two resting surfaces — backed Takes and the maker Runner): track placements locally; a placing call that throws may still have rested an order; cancel from the local record *then* sweep the venue; never trust the indexer alone for what's resting at shutdown.
17. `getCandles`/`getFills` are pool-keyed — always scope `{from: tradingStart, to: expiry}`.

## E. Fair Value model (from `03-dreamdex-bot-kit-strategies-and-tools.md`, ec-oracle-follow)

- Momentum `r` over W = 60s window; refuse if latest sample >15s stale or history short.
- Realized vol `σ_W = sqrt((Σ ln²(pᵢ/pᵢ₋₁)/Σ Δtᵢ)×W)`, ≥12 samples; warm-up default expectedMove 0.0015; vol floor 0.0002 (zero vol = disallowed certainty).
- `horizons = max(ttl/W, 0.05)` — the 0.05 floor is load-bearing (prevents the final ticks dividing scale toward zero); `z = (moneyness + r·√horizons) / (expectedMove·√horizons)`; `P(up) = clamp(0.5 + 0.5·tanh(0.798·z), 0.05, 0.95)`; `tilt = P(up) − anchor`.
- **Anchor**: YES-book mid; on a one-sided book, the single-quote bound (`marketBoundUp`: an ask caps fair, a bid floors it; momentum mode *refuses* on one-sided books — conservative bias toward NO is known and accepted).
- Momentum admissibility gates: only when `ttl ≤ OF_MAX_HORIZONS × W` (default 30) AND `|r| ≥` threshold — without them momentum tilts long windows it should never touch. Momentum fallback: **clamp the TILT, not the sum** (clamping `anchor+raw` near a bound can flip the trade to the wrong leg). The price feed's timestamp is the *oracle write time* — that's what makes the 15s staleness rule meaningful.
- Trade band: edge floor 0.03; disagreement ceiling 0.10 ("a 25-cent edge means the model can't see something"). Trade the sign of tilt, never `pUp > 0.5`. Strike 0 = up/down vs opening price (`getOpeningPrices`; opening prints can lag — retry, cache resolved openings forever).
- Brake extras: regime manager (drawdown → healthy/caution/defensive, 2% hysteresis, per-regime clip multiplier); circuit breaker the LLM cannot override; `netOf = |yes−no|`, `setsOf = min(yes,no)` (show net, gross, locked sets); opposing-leg guard (buying the opposite leg just mints sets, paying two spreads).

## F. Numbers bank (defaults ported from the reference; tune during build)

- Sizing/quotes: 0.01-unit lots; venue price band [1%,99%], client [2%,97%]; quote debounce 350ms; re-quote every 12s; odds display clamp [1,99]¢. Cost-cap buffers and no-entry cutoffs are **functions of `intervalSec`**, not hardcoded cadences (the reference's 1m/5m/1h table doesn't map to observed testnet 60s/5m/10m): buffer ≈ interpolate(1.6× @60s → 1.1× @1h); no-entry cutoff = gotcha #9's headroom formula `max(30, min(300, intervalSec*0.4))` — one rule, both uses.
- Parlay: λ = 0.40; margin 12%; risk caps (`minCombinedProbBps`, `maxExposureBps`, per-ticket payout cap, `maxExpiryLocked`) — set values during contract work.
- Brake tilt-detection defaults (tunable; FR-24): loss streak ≥3 consecutive settled losses AND next stake ≥1.5× the losing-streak average; restless signal ≥4 Baku prompts within 3 minutes; regime manager from §E governs Runner clip-sizing. Daily Stop: user-set, shipped default 100 tUSDC/day on testnet, opt-out allowed with friction (explicit confirmation), reset midnight user-local, authoritative server-side per wallet.
- Strategy market (future): fee cap 10%.
- Copilot: last 12 messages; memory recall ≤4; response 2–4 sentences; timeout ~28s. The reference's proven Sensei system prompt (quoted in full in `context/15-yosuku-api-routes-and-backend.md`) is the starting artifact for Baku's prompt — port, then adapt voice to PRD §7.
- Leaderboard: 24h window, top 50, 5-min cache; badges — whale ≥1000 volume, oracle-eye ≥70% win over ≥10 settled.
- Faucet/anti-farm: venue cap 10k tUSDC/call; per-device + per-account gates; balance-threshold no-op (reference used >3 balance → no-op).
- Caches: markets ~15s, price ~5s TTL, in-flight dedup, visibility-gated polling.
- Session cookie 30d; takes caption ≤240 chars.

## G. Rejected alternatives (with rationale — do not silently resurrect)

- **Privy embedded wallets** — see §A Wallet. Revisit post-hackathon behind the adapter.
- **TEE/enclave attestation** — proves little in testnet judging; EIP-712 per-action sigs give the bounded-power story.
- **Leverage/margin desk** — second product; EC's capped-risk design is the selling point.
- **Full privacy / private bets** — link-reduction only, per the reference's own admission.
- **X (Twitter) rail at launch** — OAuth review friction + infra cost; Telegram delivers the same bounded-executor story inside the hackathon's own community; X can reuse the Executor later.
- **SVI pricing / strike-curve math** — EC prices ARE probabilities; the whole layer vanishes.
- **CCTP/Solana/BTC onramps, SuiNS, Walrus/Seal, zkLogin** — Sui-specific rails with no Somnia counterpart needed.

## H. Somnia/DreamDEX facts the implementation leans on

- Chain: Shannon testnet 50312 (gas STT), mainnet 5031 (SOMI). Collateral: tUSDC `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` (6dp, faucet ≤10k/call) / USDso 18dp — derive decimals from chain (10^12 landmine).
- Indexer GraphQL: `https://dev.smk.somnia.host/v1/graphql` (testnet) / prd for mainnet. Oracle explorer deep link: `https://prd.oracle.somnia.host/questions/{oracleQuestionId}?view=graph`.
- Venue id (testnet, Aug 2026): `0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c` — it moves; read from a live market row.
- Gasless options: `signRedeemAuth`/`redeemFor` (EIP-712 gasless redeem, payout hard-pinned to owner — **verified in doc 02**, SDK 0.28.1); ERC-4337 EntryPoint v0.7 `0x0000000071727De22E5E9d8BAf0edAc6f37da032` on **testnet** (+ account factory); EIP-7702 type-4 accepted on **mainnet only as verified** (bot-kit batch-7702) — do not design testnet flows on 7702 without verifying chain 50312 (PRD OQ-5); `build*` verbs return unsigned calls for AA. `setSigner({ walletClient })` and the `/reactivity` subpath (re-export of `@somnia-chain/reactivity`; `@somnia-chain/streams` is the separate streams SDK): all verified in doc 02. Multicall3 on testnet `0x841b8199E6d3Db3C6f264f6C2bd8848b3cA64223` — free batched reads for the claim-plate's Finalized-market scans.
- Mint-a-pair cold start: quote BOTH sides with zero inventory (rest Buy UP @ p + Buy DOWN @ 1−p) — this is the seed-liquidity script's core.
- Somnia Data Streams / SDK `/reactivity` subpath — candidate for push-based live UI ("uses the chain's signature feature" judging angle; NFR-5 prefers push where supported).
- Builder codes: live on spot (≤1%), EC attribution unverified — tag order flow so it can be added. (Pitch framing moved to PRD §10.3.)
- Receipt link targets: tx explorer `shannon-explorer.somnia.network` (testnet); oracle explorer is named **"Prophecy Oracle"** — Receipts copy can name it. SDK primitives serving FR-16/FR-21 directly: `getBinaryPositionPnL`, `getMarketResolution` (also the OQ-10 verification tool). Two testnet RPCs known (`api.infra.testnet…` + `dream-rpc…`) — NFR-10's failover pair.

## I. Build sequence (de-risk ordering from the direction doc — not a cut list)

1. Scaffold, chain adapter, markets loop end-to-end on testnet (bet → settle → claim).
2. Reels, portfolio, receipts/stats, leaderboard.
3. Baku (quant + LLM + Brake).
4. Contracts (EventVault, ParlayReserve, Waitlist) — Foundry-tested + reviewed.
5. Runners + session-key tap-trading + Telegram executor rail.
6. Polish, honest-limitations README, zero-env check, seed-liquidity script.
7. Submission artifacts: demo video, deck (`/pitch`), SDK feedback report.

## J. SDK & docs feedback report — collected material

Already observed (grow this list during build): binary rows carry no tickSize/lotSize for `amountToPrecision`; indexer schema drift vs SDK floor; receipt-on-`info` trap (unified-tier receipts live on `order.info`); venue-id churn (3× in a week).
