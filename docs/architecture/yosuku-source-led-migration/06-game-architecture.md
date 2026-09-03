---
title: Stage 6 game architecture
status: proposed for owner decisions
date: 2026-09-03
visual_authority: Yosuku at 3c56ef52b78dae28cc198495f753480292f6a5ad
mechanic_references: PIPS at fe8f6963972ca18fc9db0fd9ee4db389e6293ee8 and Flicky at 56054baeb0c7f8ef6e039ebb0eed2b04e4f59388
---

# Stage 6 game architecture

## Outcome

Build one `/games` family in the existing shell, not a parallel app. Keep the eight folders already present: they give each mode its own loading/error boundary and lazy bundle while one `app/games/layout.tsx` owns the game profile, settings, active-match resume and dark-stage frame. A dynamic `[game]` route would add a resolver without reducing code or URLs.

The economic boundary is fixed by the authority table: Practice and the arcade pair never create positions; Free Duel has no side-pot but its market picks still spend real tUSDC; Ranked Duel adds a separately escrowed side-pot; Lucky uses one real IOC order; Range is the live `RangeReserve`; Moonshot A is a separately prefunded real house position; Moonshot B is a normal book order (`04-game-system.md:37-50`).

PIPS separates real-money games from arcade modes and persists the selected game/presence (`reference/pips/web/src/routes/_app/games/index.tsx:44-78`, `reference/pips/web/src/routes/_app/games/index.tsx:142-195`). Flicky demonstrates one engine for free and staked PvP, with commit-reveal and real position scoring (`reference/flicky/apps/contracts/sources/duel.move:4-42`). Masayume takes those mechanics, not either reference's visual system.

## System boundary

```text
web/features/games                  Yosuku-native routes and focused client stages
  │ typed intents/read models
packages/core/src/games             pure lifecycle, score, rating and protocol schemas
  │                                  no React, wallet, RPC or database
packages/markets/src/games          GameArena/venue reads, writes, receipts and gas lane
  │                                  shared market runtime/coordinator only
contracts/src/games/GameArena.sol   ranked/free match and economic truth
  │ venue ABI + OracleHub
DreamDEX / GameArena events         fills, positions, outcomes, side-pot authority
  │ indexed projections
packages/db/src/schema-games.ts     profiles, follows, settings, history, MMR, arcade scores
  │ HTTP snapshot + WebSocket deltas
services/ops/src/games              deckmaster, matchmaker room and permissionless settler
```

`GameArena` can atomically buy a position and record a pick: the real pool ABI exposes `placeBinaryOrder` without an EOA constraint (`contracts/src/interfaces/IDreamDex.sol:55-86`), the existing gateway resolves the pool in-transaction and measures cash/token deltas around an IOC (`contracts/src/vault/VenueGateway.sol:54-103`), and the Shannon fork already proved a contract receives the ERC-6909 fill (`context/41-eventvault-fork-verification-2026-09-02.md:19-30`). This confirms composition, not gas; the new path still needs a fork test and one live measurement before product copy says “gasless” or quotes speed.

Use a fourth EventVault grant kind, `GAME_SESSION`, rather than disguising it as `SESSION`. Its signed scope is `player + matchId + arena + allowed marketIds + total budget + per-pick cap + max YES-price/slippage + expiresAt`; it cannot withdraw, change beneficiary, queue another player or settle to another address.

## Shared lifecycle and surfaces

The shared lifecycle is `idle → readiness → queued → matched → committed → revealed → picking → locked → settling → finalized`, with cancel, queue expiry, no-show, reveal refund, partial-pick forfeit, unknown-confirmation reconciliation and reconnect branches (`04-game-system.md:67-95`). Represent it as discriminated unions and pure transition functions in `packages/core`, not component booleans.

`/games` groups Prediction / Duel / Arcade and shows only real availability. It restores `activeMatchId` from chain/DB before offering a new queue. Profile, balance, funding, Portfolio/history, Leaderboard and identity stay shared product surfaces; Stage 6 adds game settings, achievements, avatar accent, streak and presence. PIPS' menu similarly combines balance, profile/statistics, leaderboard/history, customization and settings (`reference/pips/web/src/routes/_app/menu/index.tsx:23-70`, `reference/pips/web/src/routes/_app/menu/index.tsx:194-226`).

Every live stage provides: back to Games; mode/economic label; sound/haptics/reduced-motion controls; reconnect state; persistent transaction refusal/unknown context; and result/history/share actions. PIPS applies sound, haptics and reduced-motion settings immediately (`reference/pips/web/src/routes/_app/menu/settings.tsx:12-45`) and keeps one app-shell presence connection (`reference/pips/web/src/lib/presence.tsx:9-33`); use those interaction rules through Masayume's own shell.

## Route flows

### `/games`

Entry resolves profile/settings, active match and safe last-good summaries independently. Loading uses card skeletons, not instructions to click. Terminal states are selection, resume, signed-out readiness, dependency unavailable with stale summaries, or no eligible live prediction games. The active match always wins over a fresh selection (`04-game-system.md:10-20`).

### `/games/practice`

Start → optional tour → deterministic 3–5-card synthetic deck from the shared live spot stream → swipe/pointer/keyboard choice → bot choice → explanatory score → replay/exit. A stale or absent spot pauses the next card; it never substitutes a price. There is no wallet position, payout, opponent, MMR, streak or leaderboard write. The route says “Practice · no stake” throughout, as required (`04-game-system.md:155-159`). Flicky's product walkthrough separates solo practice from PvP (`reference/flicky/README.md:41-80`).

### `/games/duel`

Readiness shows the difference between Free (“no match stake; each market pick still costs tUSDC”) and Ranked (“market picks plus side-pot”), wallet funds, game grant and gas payer. Queue → widening rating search → match found → committed/revealed deck → one confirmed IOC pick per card → lockup with receipt-derived live PnL → per-card settlement → final result → claim/share/rematch/history.

Terminal/recovery rules:

- leave before pairing: remove queue entry; no money moved;
- creator/join timeout: refund the deposited side-pot to its owner;
- durable reveal material unavailable: refuse join; if failure follows join, refund both pots rather than punish players for operator failure;
- one player misses the pick deadline: existing underlying positions remain theirs, but the incomplete player forfeits only the side-pot; both incomplete means split/refund;
- voided card: each side gets DreamDEX's real 0.5 redemption and PnL uses that payout;
- all cards settle: greater sum of real `payout - actualCost` wins the pot; tie splits it, with deterministic one-unit dust to the creator;
- settler absent or confirmation unknown: any caller resumes by `matchId`; payout addresses are immutable.

Flicky stores players, stake, deck hash, per-player swipes and per-card settlement progress in one duel object (`reference/flicky/apps/contracts/sources/duel.move:123-159`) and emits reconstructable create/join/swipe/settle/final events (`reference/flicky/apps/contracts/sources/duel.move:161-220`). Its settlement needs keeper-fed prices because its venue lacks a public settlement read (`reference/flicky/apps/contracts/sources/duel.move:15-32`); Masayume instead reads DreamDEX's finalized payout vector and redeems through the module (`contracts/src/interfaces/IDreamDex.sol:31-50`).

### `GameArena`

States: `WAITING`, `ACTIVE_UNREVEALED`, `PICKING`, `SETTLING`, `FINALIZED`, `REFUNDED`, `FORFEITED`. Store match id, tier, immutable players/beneficiaries, side-pot per player, deck hash/size, deadlines, revealed market ids, actual fill quantity/cost for each pick, settlement payout, completion bitmap and claimable credits.

`createMatch` deposits creator pot and commitment; `joinMatch` deposits equal challenger pot; `revealDeck` checks canonical `keccak256(chainId, arena, matchId, policyVersion, serverSeed, clientSeeds, cards)`; `placePick` validates caller/turn/card/market/deadline, transfers a capped max cost, resolves the current pool, places IOC, measures actual cost and ERC-6909 quantity, refunds unused max cost and records the receipt in the same transaction. Zero fill reverts; partial fill succeeds only above `minQuantity` and records the truth. The existing gateway establishes the required IOC/delta pattern (`contracts/src/vault/VenueGateway.sol:82-119`).

`settleCard` requires the underlying market resolved/voided, redeems the arena-held outcome quantity, assigns the exact payout to the player credit and records `payout - cost`. `finalize` is permissionless after every card is terminal; it allocates only the side-pot. `claimCredit` is pull-based and non-reentrant. Pause may block new matches/picks but never reveal, settle, refund or claim.

Events: `MatchCreated`, `MatchJoined`, `DeckRevealed`, `PickFilled`, `CardSettled`, `MatchFinalized`, `MatchRefunded`, `CreditClaimed`. Every event includes `matchId`; economic events include player, marketId, card index, quantity, cost/payout and transaction-local idempotency key. No pool address is persisted.

### `/games/lucky`

Commit server seed before the reel; collect a public client seed; reveal after the player accepts the draw. Derive `HMAC-SHA256(serverSeed, clientSeed | wallet | nonce | policyVersion)` and map unbiased bytes to asset, side and target multiplier. Scan eligible normalized Windows, quote both sides from the shared coordinator, and choose the live fillable quote closest to `1 / targetMultiplier`; show seed commitment, selected Window, side, actual quote, estimated quantity, slippage and gas payer before signature. The commitment proves the draw was not changed; it does not prove market eligibility, so persist the candidate-set hash and policy version too.

The order uses the existing Ticket write/receipt/cash-out/claim path. Result is pending, win, lose, void, cashed-out, refused or confirmation-unknown; streak and leaderboard update only from a verified receipt/settlement. PIPS chooses seeded asset/side/tier and then searches a real mintable quote (`reference/pips/backend/src/services/games.ts:286-369`); its bounded quote cache and live-market checks are short-lived (`reference/pips/backend/src/services/games.ts:39-53`, `reference/pips/backend/src/services/games.ts:98-162`). DreamDEX replaces its strike scan with a Window-and-book scan.

### `/games/range`

Keep the built route and live `RangeReserve`: choose Window and band → preview exact house probability/stake → sign → in play → permissionless settle → won/claim, lost, void/refund or stale/unavailable. The reserve prices from opening print, book centre and volatility (`contracts/src/range/RangePricing.sol:13-22`, `contracts/src/range/RangePricing.sol:136-167`) and pays only from prefunded capacity (`contracts/src/range/RangeReserve.sol:74-128`). Stage 6 adds the shared game chrome/history only; it must not fork the range data source.

### `/games/moonshot`

Option A preserves PIPS' direction-and-reach mechanic; option B is cheaper but collapses into Lucky. PIPS exposes direction/reach as its own resolver (`reference/pips/backend/src/services/games.ts:371-469`). Recommend **A**, behind owner approval and a new `MoonshotReserve` in `contracts/src/range` so the already-live `RangeReserve` ABI/storage is not mutated.

For desired gross multiple `M` and margin `m`, target win probability is `p = 1 / (M × (1 + m))`. With the existing basis, `z(K) = zOf(K, openingPrint, σ√τ)` and `μ = Φ⁻¹(centerQ)`: UP solves `1 - Φ(z(K) - μ) = p`; DOWN solves `Φ(z(K) - μ) = p`. Use bounded integer binary search over positive prints and the existing CDF/probit table, then display the solved target and exact contract quote. The current Range math defines `σ√τ`, `zOf`, CDF/probit and house-margin stake (`contracts/src/range/RangeMath.sol:33-95`).

Contract delta: new above/below round type; reuse `RangePricing`'s proven asset/opening/book basis; store target, probability and basis; prefund max payout; settle from the same OracleHub close; expose preview/open/settle/claim, caps, pause-with-exits and golden TS/Solidity vectors. Option B needs no contract: draw side/Window and place one IOC at the real book multiple.

Numbers are estimates until `eth_estimateGas`: comparable Shannon creations were 55.4M and 60.9M gas, while Range supply was 897,978 gas (`context/45-leveragereserve-fork-verification-2026-09-02.md:72-74`, `context/43-oraclehub-range-basis-spike-2026-09-02.md:112-115`). Budget 50–70M creation gas (0.30–0.42 STT at 6 gwei), 1.2M for approve+supply, and an 8M open lane; fork-test and estimate before deployment. Liquidity is a product choice, not gas: recommend the same 5,000 tUSDC pilot cap only if the owner wants equal Range/Moonshot capacity.

### `/games/line-rider` and `/games/candle-hop`

Port the deterministic math from `rideEngine.ts` / `flapEngine.ts`, not the reference skin, into pure `packages/core/src/games/arcade` engines. Render with Canvas 2D at device-pixel ratio, fixed simulation timestep and interpolated draw; pointer/Space controls; pause on `visibilitychange`; reduced motion removes shake/parallax and offers a calmer speed. Line Rider keeps grip/combo phases (`reference/pips/web/src/routes/_app/games/line-rider.tsx:14-99`); Candle Hop keeps its one-button flight lifecycle (`reference/pips/web/src/routes/_app/games/candle-hop.tsx:15-122`). Both references expose title/play/result and leaderboard states (`reference/pips/web/src/routes/_app/games/line-rider.tsx:113-195`, `reference/pips/web/src/routes/_app/games/candle-hop.tsx:170-212`).

Scores are Postgres product state, explicitly “arcade score · not on-chain.” The server accepts input trace, engine version, duration and score, replays deterministic runs where practical, rejects impossible envelopes and rate-limits submissions. It still cannot prove an untrusted browser was not modified; public boards label scores “server-checked,” and prize money must not depend on them without an authoritative server-run simulation.

## Matchmaking, realtime and reconnect

Run one `ws` server inside `services/ops`, beside—not inside—the Next request lifecycle. Authenticate the HTTP upgrade with a short-lived wallet-signed room token; validate every message with core schemas; cap payload/rate; ping/pong; drop slow clients; room keys are `chainId:arena:matchId`. Messages are `hello`, `snapshot`, `queue.join/leave`, `match.found`, `presence`, `pick.pending/confirmed`, `settlement.progress`, `reaction`, `chat`, `resync` and typed `error`. Only snapshots/events from chain and Postgres can change economic UI.

Queue keys are `mode:tier:region`; records are wallet, rating, queuedAt, connection id and client seed commitment. Use transparent Elo: 1,000 initial, K=48 for first ten verified matches, then K=24; no update for refunds/void-only matches. Search ±100 rating, widen by 50 every 15 seconds to ±400, then oldest compatible opponent. This is easier to explain and test than Glicko-2 for the first small pool. Flicky also keeps queue/room memory ephemeral and reconstructs from chain after restart (`reference/flicky/apps/server/src/ws/matchmaking.ts:1-22`) and uses wait-sensitive MMR pairing (`reference/flicky/apps/server/src/ws/matchmaking.ts:171-237`).

The deckmaster selects 3–5 distinct live Windows with verified trading state, supported asset, acceptable spread/depth, enough pick headroom and settlement inside the match horizon. Recommend 15m first, then 1h only when fewer than three qualify; do not include 5m until live timing proves the full swipe/signature path fits. Persist encrypted reveal material before publishing the commitment, plus a second recoverable copy; no durable reveal means no join. Flicky's deck source selects safe soonest-settling markets (`reference/flicky/apps/server/src/deckmaster.ts:273-313`) and derives deterministic seed material (`reference/flicky/apps/server/src/deckmaster.ts:354-390`).

On reconnect: authenticate → fetch GameArena by match id → load DB projection/cursor → replay missing chain events → send one snapshot → subscribe deltas. WebSocket sequence numbers are advisory; chain log identity `(chainId, txHash, logIndex)` and DB event id provide idempotency.

## Data and social architecture

Postgres additions in `schema-games.ts`:

| Table | Key and authority-critical fields | Indexes |
|---|---|---|
| `game_profiles` | `wallet` PK, unique normalized handle, optional linked X/profile id | handle, updated |
| `game_follows` | `(follower_wallet, followed_wallet)` PK | followed, created |
| `game_settings` | wallet PK, sound/haptics/reduced-motion/customization | updated |
| `game_matches` | `(chain_id, arena, match_id)` PK, mode/tier/status/deck commitment/chain cursor | player/status, updated |
| `game_players` | match key + wallet PK, rating before/after, completion | wallet/created |
| `game_cards` | match key + card index PK, market id, policy version, settlement | market id |
| `game_picks` | match/player/card PK, tx hash/log index/order receipt/cost/quantity/payout | tx hash, wallet |
| `game_rating_events` | terminal match + wallet PK, delta and formula version | wallet/created |
| `game_achievements` | wallet + achievement key PK, evidence type/id | unlocked |
| `game_arcade_scores` | score id PK, wallet/mode/score/engine/trace hash/validation | mode/score DESC |
| `game_seasons` / `game_season_entries` | season id; wallet score/rank; optional chain prize receipt | status, rank |
| `game_share_artifacts` | result id PK, storage URL/hash/version | wallet/created |

Chain events/receipts own matches, fills, costs, payouts, side-pot and settlement. Postgres owns profiles, follows, settings, MMR, achievements and arcade scores; its match/history rows are rebuildable projections. Queue, presence, typing and reactions are process memory with TTL. Namespace commands `game:<chainId>:<arena>:<matchId>:<action>:<player>:<card>`; database event inserts use chain log identity. Join existing fill history on chain id + tx hash + log index/order id, never wallet/time guesses.

Use one `/leaderboard` with tabs Overall, Prediction games, Arcade, Friends and Seasons; the Games hub embeds only previews. PIPS keeps global PnL, per-game PnL and arcade best-score boards and returns them in one parallel read (`reference/pips/backend/src/services/leaderboard.ts:1-6`, `reference/pips/backend/src/services/leaderboard.ts:25-167`). “Friends” is new Masayume scope: follow a canonical wallet profile, discovered by handle, wallet or verified linked X; it is not claimed as reference parity.

MMR/streak rows update only after a verified terminal match. Presence says “playing now” from TTL heartbeats, never a fabricated count. Seasons snapshot verified rating/PnL events; prizes require a separately funded on-chain pool and receipt. Flicky's server board uses MMR plus season eligibility (`reference/flicky/apps/server/src/leaderboard-api.ts:1-105`), and its prize contract escrows then distributes/recoveries funds (`reference/flicky/apps/contracts/season/sources/prize_pool.move:4-18`, `reference/flicky/apps/contracts/season/sources/prize_pool.move:41-184`). Until Masayume has that contract, seasons are recognition only.

After a verified win, generate a fixed portrait share card with mode, opponent handle, score/PnL, market proof ids and result URL; no balance or unverifiable claim. Flicky's card is a fixed PNG artifact with relative duel identity and result statistics (`reference/flicky/apps/web/src/components/duel-share-card.tsx:11-23`, `reference/flicky/apps/web/src/components/duel-share-card.tsx:41-113`).

## Libraries

| Concern | Decision |
|---|---|
| Rooms | Add direct `ws@8.21.3` (MIT) to ops. Small explicit protocol; HTTP-upgrade auth and heartbeat are documented. Reject Socket.IO 4.8.3 and hosted relay: extra protocol/dependencies or external authority are not needed. |
| Swipe | Existing `motion@12.43.0` plus Pointer Events and keyboard. Reject `@use-gesture/react@10.3.1`; one axis/threshold does not justify another runtime. |
| Arcade | Canvas 2D + `requestAnimationFrame`; pure fixed-step engine. Reject Phaser 4.2.1, Matter 0.20.0 and Pixi 8.20.1: no scene graph/physics engine is required. |
| Audio/haptics | Web Audio API service and `navigator.vibrate` best effort. Reject Howler 2.2.4 and `web-haptics` 0.0.6 initially; settings/support checks are small and platform support remains the real limit. |
| Rating/randomness | Pure versioned Elo + Node/Web Crypto SHA-256/HMAC/secure bytes. No package. |
| Lifecycle | Discriminated unions/reducers in core. Reject XState 5.32.6 initially: persisted actor snapshots are projections, never chain authority, and the extra runtime is unnecessary for one protocol. Reconsider only if three independent invoked actors cannot be expressed safely. |
| Solidity | Existing Foundry + OpenZeppelin; reuse the proven gateway/delta pattern. No new Solidity package. |

PIPS and Flicky have no repository-level reusable license at the pinned commits; Flicky's README says `TBD` (`reference/flicky/README.md:162-164`) although individual Move files declare Apache-2.0 (`reference/flicky/apps/contracts/sources/duel.move:1-2`). Treat both as behavior references: independently implement mechanics and do not copy unlicensed UI/engine/server source.

## Actors, keys, gas and security

Matchmaker/presence has no signer. Deckmaster uses no user-fund key; if commitment submission is delegated, give it one `DECKMASTER_PRIVATE_KEY` restricted to that function. Settler uses one `GAME_SETTLER_PRIVATE_KEY` for permissionless progress. Sponsor uses the existing `SPONSOR_PRIVATE_KEY` policy rail. Each writer has its own `SubmitterSession`, nonce queue and journal; every ops actor starts `DRY_RUN` unless `DRY_RUN=0`.

Without a sponsor, the player's wallet/session key pays every pick and the UI shows the STT requirement before queueing. With a sponsor, only allowlisted arena calls within the grant/caps are paid; sponsorship failure falls back only with explicit player consent. First gas ceilings: arena create/join 8M, pick 8M, settle/finalize 4M, then replace with fork/live p95 + margin. Existing live analogues are a 2.56M vault IOC and 5.07M leverage open (`context/41-eventvault-fork-verification-2026-09-02.md:68-71`, `context/45-leveragereserve-fork-verification-2026-09-02.md:89-96`). Fund signer envelopes, not guessed average gas.

Threat controls: canonical commit domain prevents cross-chain/arena replay; both client seeds prevent the server choosing after seeing one player; durable reveal + join gate prevents lost-secret lock; deadlines make griefing terminal; checks-effects-interactions, `nonReentrant`, pull credits and immutable beneficiaries protect escrow; pool/module addresses resolve by market id in-transaction; pick caps and per-player/card uniqueness stop overspend/replay; free queue uses signed identity, one active queue/match, rate limits and cooldowns; chat is rate-limited, room-scoped and escaped. Fork tests cover malicious venue callbacks, partial/zero IOC, wrong pool/venue, expired/void Windows, duplicate settlement, reveal mismatch/timeouts, tie dust, both forfeit branches and payout conservation.

## Dependency-ordered implementation slices

1. **Core + schema:** `packages/core/src/games/**`, `packages/db/src/schema-games.ts`; lifecycle, Elo, commitment vectors and tables. Gate: core/db typecheck + focused pure tests.
2. **Shared web shell:** `web/src/app/games/layout.tsx`, hub/profile/settings/history/achievements components; honest placeholders remain for unfinished modes. Gate: mobile/desktop/reduced-motion review.
3. **Practice:** pure deck/bot plus swipe stage, live spot only. Acceptance: full entry/tutorial/result/replay/reconnect-free no-stake flow.
4. **Arcade pair:** core engines, Canvas stages, server-checked score API and boards. Acceptance: pause/resume/result/history and explicit off-chain score truth.
5. **Lucky:** audited draw/eligibility service plus existing Ticket lane. Acceptance: commitment/candidate hash/quote before sign through cash-out or settlement/history.
6. **GameArena:** interface/gateway/contract/mocks/vectors/fork test, then ABI/deployment adapters. No UI promise or deployment until atomic pick and gas are proven.
7. **Ops/realtime:** direct `ws`, room token, queue, deck durability, indexer projection and settler. Acceptance: process restart and browser reconnect reconstruct an active match.
8. **Duel UI:** Practice stage reused for Free/Ranked, lockup, result, credit claim/share. Acceptance: every terminal/recovery state in this document.
9. **Moonshot A:** only after owner approval; reserve, vectors, fork, deploy/supply, adapter and route. B is the fallback if contract/liquidity is rejected.
10. **Social/seasons/coherence:** unified leaderboard/friends/presence/share, route-level lazy bundles, hidden-tab audit and 2–3 minute demo path.

Slices own the listed directories; the contract agent does not edit game UI, ops does not edit contracts, and UI does not create market reads outside the shared port. Each committable slice runs applicable `pnpm typecheck`, `pnpm invariants`, `pnpm test`, `forge test` and `pnpm build`. A mode is accepted only when entry, onboarding, truth boundary, active lifecycle, terminal result, history, reconnect and failure work (`04-game-system.md:210-212`).

Demo: enter Games → Practice tutorial → Lucky commitment and real quote → ranked queue/match → one atomic confirmed pick → receipt-derived lockup → permissionless settle/result/share → arcade score labeled off-chain → leaderboard/friends. Do not wait live expiry on camera; use a previously verified completed match and show its transaction links.

## Owner decisions

Answered by the owner on 2026-09-03 (fourteenth session).

1. **Order — ANSWERED: context/51's, not this document's.** Practice and the Duel stage are built together
   (they share the swipe loop), carrying `GameArena` and the ops/realtime work with them; then Lucky, then the
   arcade pair, then Moonshot. Risk and the demo spine both land first. Slices 1, 2, 6, 7, 8 of the list above
   therefore run before 3, 4, 5, and slice 3 (Practice) merges into slice 8's stage.
2. **Moonshot — OPEN, under discussion.** See §Moonshot: the deployed `RangeReserve` parameters admit every
   rung of the 2/3/5/10/25x ladder, so option A does not require a new contract as this document assumed.
3. **Ranked tiers — ANSWERED: Flicky's.** Free plus 1 / 5 / 10 tUSDC side-pots, per-card order cap 1 tUSDC.
4. **Deck policy — taken as recommended** (owner did not object): 3-5 distinct 15m Windows, widening to 1h;
   5m only after measured end-to-end headroom.
5. **`GameArena` deployment — ANSWERED: the standing Shannon go covers it.** Once unit-green, fork-verified and
   gas-proven, the arena deploys and is supplied without a further ask, as the five Stage 5 contracts were.
   The proof gates are not waived: no deployment without the atomic-pick fork test and a measured gas envelope.
6. **Friends — taken as recommended:** directional follows, no approval handshake.
7. **Seasons — taken as recommended:** recognition only; no prize copy until a funded prize contract exists.
8. **Free Duel — taken as recommended:** no side-pot, real capped market orders; Practice is the no-money mode.

## Moonshot — what the deployed parameters allow

This document costed option A as "a small contract addition, deploy, supply". Reading the live contract against
its deployment script (2026-09-03) shows that is wrong, and the correction is worth recording.

A Moonshot is a one-sided bet: for LONG, P(close > K), with K solved so the round pays the chosen multiple M.
`RangeReserve` already prices exactly that as a band whose far edge saturates. `RangeMath.cdfE6` returns
`P_ONE` at |z| >= 4, so `bandProbE6(opening, K, farPrint, ...)` is `1 - Phi(z_K - mu)` = P(close > K); a SHORT is
the mirror band `(nearZeroPrint, K)`. Both satisfy `_price`'s `lowPrint > 0 && highPrint > lowPrint` guard.

The strike is closed-form, not a search. Stake is `maxPayout * p * (1 + margin)`, so `M = 1 / (p * (1 + margin))`
and therefore `p = 1 / (M * (1 + margin))`. `RangeMath.probitE4` already inverts Phi -- it is there for the
book centre -- so `z_K = probitE4(centerQE6) + probitE4(P_ONE - p)` and K follows from `zOf` read backwards.

Against `DeployRangeReserve.launchParams()` (`marginBps` 1200, `minProbRaw` 20_000, `maxPayoutCap` 500e6,
`maxExpiryLocked` 1000e6, `one` 1e6), the admissible multiples are:

| Multiple | Implied p | Inside `minProbRaw` (0.02)? |
|---|---|---|
| 2x | 0.446 | yes |
| 3x | 0.298 | yes |
| 5x | 0.179 | yes |
| 10x | 0.089 | yes |
| 25x | 0.036 | yes |
| ceiling | 0.020 | ~44.6x, where `LongShot` begins |
| floor | 0.893 | ~1.12x, where `Underpriced` begins |

Every rung of the PIPS ladder is already priceable by the contract that is live and supplied on Shannon. What A
actually costs is the knob UI and a solver mirrored in `@masayume/core/range`; what it does not cost is a
contract, a deployment or new liquidity.

The real constraint is `maxExpiryLocked` = 1000 tUSDC of contingent liability per expiry. A 25x round at the
500 tUSDC payout cap locks roughly 482 tUSDC of house money, so two such rounds exhaust one expiry's budget.
That is a liquidity and per-round-cap question for the owner, not an engineering one, and it is tunable through
`setParams` without a redeploy.

## Decision log

| Date / owner | Evidence | Rule / proposal | User-visible consequence | Approval |
|---|---|---|---|---|
| 2026-09-03 / architecture | `04-game-system.md:22-50` | Keep all eight routes nested; Games is one grouped global destination | Every mode is discoverable without eight top-level tabs | Existing authority |
| 2026-09-03 / architecture | DreamDEX ABI and fork proof cited above | Use atomic arena IOC + record, pending fork/gas proof | “Locked” appears only after one receipt | Needs implementation proof |
| 2026-09-03 / architecture | Range model and PIPS Moonshot evidence cited above | Recommend separate MoonshotReserve option A | Real target/multiple, new funded contract | Owner pending |
| 2026-09-03 / architecture | PIPS/Flicky license evidence cited above | Reimplement behavior; copy no unlicensed code | Same mechanics in Yosuku language | Required provenance rule |
| 2026-09-03 / architecture | Existing product leaderboard + PIPS board shape | One leaderboard with game/friends/season sections | One identity and ranking home | Owner pending |
| 2026-09-03 / owner | Session 14 answers | Build order is context/51's: Practice + Duel first, arena and realtime with them | The pitch-defining mode exists earliest; arcade and Lucky follow | Approved |
| 2026-09-03 / owner | Session 14 answers | Ranked tiers Free + 1/5/10 tUSDC, per-card cap 1 tUSDC | A deck cannot spend more than its tier | Approved |
| 2026-09-03 / owner | Session 14 answers | The standing Shannon go covers `GameArena` once fork- and gas-proven | The arena is live without a further ask; proof gates unchanged | Approved |
| 2026-09-03 / claude | `DeployRangeReserve.launchParams`, `RangeMath.cdfE6`/`probitE4` | Moonshot A needs no new contract: a saturated band on the live `RangeReserve` prices every rung 2x-25x | The aim mechanic survives with no new deployment or liquidity | Owner pending |
