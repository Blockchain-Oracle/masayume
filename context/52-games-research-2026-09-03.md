# Stage 6 games and boot-latency research — 2026-09-03

Status: read-only research and proposed architecture. No contract/product game code, deploy, funding, push or main-checkout mutation occurred.

## Authority and revision check

- Yosuku: `reference/yosuku` at `3c56ef52b78dae28cc198495f753480292f6a5ad`; visual shell authority.
- PIPS: `reference/pips` at `fe8f6963972ca18fc9db0fd9ee4db389e6293ee8`; mechanics reference.
- Flicky: `reference/flicky` at `56054baeb0c7f8ef6e039ebb0eed2b04e4f59388`; duel/realtime reference.
- Stage authority: `docs/architecture/yosuku-source-led-migration/04-game-system.md:10-50` fixes placement, routes and economic truth; `:52-110` fixes shared model/lifecycle/arena duties; `:114-195` fixes receipt, settlement and recovery boundaries.
- Implementation authority: `docs/architecture/yosuku-source-led-migration/05-migration-and-agency-handoff.md:101-117` keeps Stage 6 complete and Stage 7 separate; `:119-156` defines route completion and no-fake-data.

Provenance finding: neither pinned PIPS nor pinned Flicky has a repository-level `LICENSE`, `COPYING` or `NOTICE`. Flicky's README says `License: TBD` (`reference/flicky/README.md:162-164`); its duel Move file alone has an Apache-2.0 SPDX header (`reference/flicky/apps/contracts/sources/duel.move:1-2`). Architecture may reproduce behavior from independent analysis but must not copy their unlicensed UI, engines or server code.

## Reference-product inspection

This was a source/state inspection, not a claim that either reference can be copied verbatim.

### PIPS findings

| Source inspected | Evidence and transferable behavior |
|---|---|
| `web/src/routes/_app/games/index.tsx` | Selection explicitly separates real trading games from arcade and persists selection/presence (`:44-78`, `:142-195`). |
| `web/src/routes/_app/games/lucky.tsx` | States cover deal, amount/quote, confirmation, playing, cash-out and result; Masayume takes the lifecycle, not the console skin. |
| `web/src/routes/_app/games/moonshot.tsx` | Direction/reach/multiple is a distinct game rather than ordinary Up/Down; the backend is the authority for its solved target. |
| `web/src/routes/_app/games/range.tsx` | Band selection, live quote, held position, cash-out and result are one flow; Masayume's already-live Range route remains the implementation authority. |
| `web/src/routes/_app/games/line-rider.tsx` | Grip/combo engine with title/play/result/leaderboard states (`:14-99`, `:113-195`). |
| `web/src/routes/_app/games/candle-hop.tsx` | One-button flight lifecycle plus title/play/result/leaderboard (`:15-122`, `:170-212`). |
| `web/src/components/game/rideEngine.ts` | Pure-ish timestep/state mechanic can be independently reimplemented in core; no Three.js requirement. |
| `web/src/components/game/flapEngine.ts` | Deterministic obstacle/score loop can be independently reimplemented; score validation needs engine version/input trace. |
| `web/src/components/game/Chart.tsx` | Canvas/SVG presentation is coupled to PIPS skin; do not port its look. |
| `GameLeaderboardOverlay.tsx`, `MinigameBoard.tsx` | Lightweight overlay/board hierarchy is useful; reuse Masayume's existing leaderboard components. |
| `web/src/routes/_app/menu/index.tsx` | Profile statistics, balance, customize, leaderboard/history/settings and achievements share one identity (`:23-70`, `:194-226`). |
| `web/src/routes/_app/menu/settings.tsx` | Sound, haptics and reduced motion update immediately (`:12-45`). |
| `web/src/lib/haptics.ts` | One support/setting-gated haptics service, no-op when unavailable (`:1-26`). |
| `web/src/lib/presence.tsx` | One session-long presence connection at app-shell scope (`:9-33`). |
| `web/src/lib/sound.ts` | Centralized audio vocabulary with explicit setting; Masayume should implement a smaller Web Audio service, not copy the large sound bank. |
| `web/src/lib/achievements.ts` | Client vocabulary maps stable achievement keys; unlock authority belongs on the server/receipt projection. |
| `web/src/lib/shareCard.ts` | Result artifact generation is a separate function, not an incidental screenshot. |
| `backend/src/services/games.ts` | Bounded quote cache and eligibility checks (`:39-53`, `:98-162`); Lucky derives seeded asset/side/tier and selects a live quote (`:286-369`); Moonshot resolves direction/reach separately (`:371-469`). |
| `backend/src/services/rng.ts` | Server randomness is centralized; Masayume strengthens this with commit + client seed + candidate-set hash. |
| `backend/src/services/plays.ts` | Play lifecycle/history and settlement projection are server records around chain truth; do not treat DB status as settlement authority. |
| `backend/src/services/leaderboard.ts` | Global PnL, per-game PnL and arcade best scores are distinct; all boards can be read in parallel (`:1-6`, `:25-167`). |
| `backend/src/services/achievements.ts`, `stats.ts` | Server-side unlock/stat aggregation avoids trusting browser counters. |
| `backend/prisma/schema.prisma` | User/play/score/achievement relations inform the proposed Postgres tables; Masayume uses postgres.js/`ensureSchema`, not Prisma. |

PIPS README confirms its real games mint/redeem actual positions while arcade games are score-only (`reference/pips/README.md:13-23`), and its architecture uses HTTP/SSE, workers and Postgres around chain truth (`reference/pips/README.md:78-98`). DeepBook-specific strike ladders, manager objects, PTBs, Privy signing, Pyth layering and DUSDC bootstrap do not transfer (`reference/pips/README.md:25-76`). DreamDEX substitutes live Windows/books, GameArena, the existing wallet/session rail, OracleHub finalization and tUSDC.

### Flicky findings

| Source inspected | Evidence and transferable behavior |
|---|---|
| `README.md` | Commit-reveal, adaptive 3–5 card deck, real-position lifecycle and free/staked modes (`:17-38`, `:41-80`, `:84-108`). |
| `docs/prd.md` | Product state vocabulary and duel expectations; implementation facts were cross-checked against code. |
| `docs/e2e-flow.md` | End-to-end create/join/reveal/swipe/settle/recovery sequence; Sui transactions/zkLogin are non-transferable. |
| `docs/season-prizes.md` | Season recognition and funded-prize concerns are separate; Masayume must not promise a pool before one exists. |
| `docs/zklogin-sponsored-gas-plan.md` | Sponsor policy, not “gasless” copy, is the transferable concern; Masayume uses its existing session/sponsor rail. |
| `apps/contracts/sources/duel.move` | Lifecycle/two-tier truth (`:4-42`), stored deck/picks/settlement (`:123-159`), reconstructable events (`:161-220`), reveal/refund/forfeit branches. |
| `apps/contracts/tests/*` | Adversarial lifecycle examples informed the proposed Foundry matrix; no Move test code is reused. |
| `apps/server/src/deckmaster.ts` | Safe soonest-expiring market selection (`:273-313`) and deterministic seed derivation (`:354-390`). |
| `apps/server/src/card-source.ts` | Card data is normalized behind a source seam; Masayume's seam must consume the shared market runtime/coordinator. |
| `apps/server/src/keeper.ts`, `indexer.ts` | Idempotent event projection and resumable settlement are useful; keeper-fed prices are removed because DreamDEX exposes final settlement. |
| `apps/server/src/mmr.ts` | Versioned rating updates and match-derived evidence; Masayume recommends simpler transparent Elo for the first pool. |
| `apps/server/src/season.ts` | Response labels prize escrow only when configured; otherwise season is display-only (`:1-42`). |
| `apps/contracts/season/sources/prize_pool.move` | Explicit escrow, one-shot distribution and recovery (`:4-18`, `:41-184`); Masayume needs a separately approved Solidity equivalent before prize claims. |
| `apps/server/src/sponsor.ts` | Sponsored operations are allowlisted and bounded; keys remain server-only. |
| `apps/server/src/duels-api.ts`, `leaderboard-api.ts` | Snapshots/own-rank are HTTP reads; MMR and season eligibility are separate fields (`leaderboard-api.ts:1-105`). |
| `apps/server/src/ws/matchmaking.ts` | Queue/room memory is ephemeral with chain recovery (`:1-22`), wait-sensitive rating pairing (`:171-237`), safe requeue on deck failure (`:252-320`) and a bounded handshake timeout (`:323-363`). |
| `apps/server/src/ws/chat.ts` | Persistent global chat and ephemeral room reactions are separate and rate-limited (`:1-16`, `:38-154`). |
| `apps/server/src/ws/protocol.ts`, `handlers.ts`, `match-clock.ts`, `practice.ts`, `oracle-stream.ts` | Typed messages, room routing, countdown, practice and price events inform the proposed explicit `ws` protocol; none may determine economic truth. |
| `apps/web/src/routes/game/{home,practice,pvp,play,active-duel,duel-view,rank,history,chat}.tsx` | Complete route states include selection, queue, active resume, lockup/result, ranking, history and chat; Masayume nests these as components within two routes rather than copying Flicky's route tree. |
| `apps/web/src/components/duel-share-card.tsx` | Fixed portrait PNG result artifact and relative player identity (`:11-23`, `:41-113`). |

Flicky's contract records a DeepBook order id after a position mint and needs keeper-fed settlement price/premium (`reference/flicky/apps/contracts/sources/duel.move:15-40`). DreamDEX instead lets GameArena be the IOC taker and ERC-6909 holder, then read finalized payout vectors/redeem. Flicky's Sui shared object, PTB, Predict account, zkLogin and SUI→dUSDC funding are explicitly not ported.

### “Friends” gap

Neither inspected reference contains a durable friends graph. PIPS has profiles/presence and Flicky has opponent/global social surfaces, but claiming friends as copied parity would be false. Proposed Masayume scope is a directional `game_follows` edge keyed by canonical wallet profile, discoverable by unique handle, wallet or verified linked X identity; Friends leaderboard is a filtered view of verified boards.

## DreamDEX/Somnia composition verification

1. The checked-in ABI declares `IBinaryPool.placeBinaryOrder` public and returns success/order id; IOC is order type 2 (`contracts/src/interfaces/IDreamDex.sol:55-86`).
2. `VenueGateway` resolves market/pool/token ids from the module inside the transaction, approves the pool, measures cash/token balances, places IOC and returns actual deltas (`contracts/src/vault/VenueGateway.sol:54-119`).
3. `LeverageReserve` already transfers user stake, calls the gateway IOC and books the actual fill in one transaction (`contracts/src/leverage/LeverageReserve.sol:90-142`).
4. The Shannon EventVault fork proved contracts can trade and receive ERC-6909 fills; there is no EOA gate (`context/41-eventvault-fork-verification-2026-09-02.md:19-30`).
5. Therefore atomic GameArena `placePick` is ABI-compatible. Remaining unknowns are GameArena-specific gas, reentrant/malicious venue behavior, per-card bookkeeping and real partial-fill semantics; settle with unit + Shannon fork tests before copy.
6. DreamDEX market resolution uses a payout vector and module redemption (`contracts/src/interfaces/IDreamDex.sol:31-50`); GameArena does not need a trusted price keeper.
7. Range's current model derives `σ√τ`, CDF/probit and margin-adjusted stake (`contracts/src/range/RangeMath.sol:33-95`) from a Window's opening print, live book centre and public volatility (`contracts/src/range/RangePricing.sol:13-22`, `:136-167`). That is a valid basis for a separate one-sided Moonshot reserve.
8. No Shannon writes were made. Moonshot deployment cost is estimated from measured Range/Leverage creations, not presented as measured GameArena/Moonshot gas.

## Current-library check

Checked 2026-09-03 with Context7 resolution + official project docs, installed manifests and `npm view`. Registry unpacked size is recorded only as a packaging comparison, **not** a minified browser bundle measurement.

| Candidate | Version / license / registry unpacked | Finding |
|---|---|---|
| Existing Motion | 12.43.0 / MIT / already shipped | Keep for card transform/result motion; new browser cost 0. |
| Browser Pointer Events + Canvas + Web Audio + Web Crypto | platform / no package | Sufficient for one-axis swipes, two simple arcade loops, sounds and commitments; new browser cost 0. |
| `ws` | 8.21.3 / MIT / 151 kB, server-only | Recommend direct ops dependency. Official README documents authenticated HTTP upgrade, ping/pong heartbeat and broadcast: `github.com/websockets/ws`. |
| Socket.IO | 4.8.3 / MIT / 1.42 MB plus engine/parser deps | Reject for first slice; automatic rooms/reconnect do not outweigh another protocol when snapshots already reconcile. |
| `@use-gesture/react` | 10.3.1 / MIT / 37 kB plus core | Reject; Pointer Events + Motion implement the required threshold/velocity axis. |
| `web-haptics` | 0.0.6 / MIT / 65 kB | Reject initially; it cannot create unsupported platform vibration. One setting-gated adapter is smaller. |
| Howler | 2.2.4 / MIT / 318 kB | Reject; short synthesized/cached effects need no codec abstraction. |
| XState | 5.32.6 / MIT / 2.29 MB | Reject initially. Official docs support actor snapshot persistence, but restored effects require idempotency; chain/DB snapshots remain authority. Use pure unions/transitions, revisit if actor composition materially outgrows them. |
| Phaser | 4.2.1 / MIT / 112.5 MB | Reject; two small 2D loops need no full engine. |
| Matter.js | 0.20.0 / MIT / 927 kB | Reject; the reference mechanics use purpose-built equations/collision bounds. |
| PixiJS | 8.20.1 / MIT / 74.3 MB | Reject; Canvas 2D is adequate and avoids another render tree. |
| Existing OpenZeppelin/Foundry | checked-in / existing | Keep reentrancy, safe transfer and test/deploy stack; new dependency cost 0. |

TanStack Query 5.102.8 is already installed. Current official docs confirm: query functions must reject/throw for error state; `skipToken` automatically disables a query; IndexedDB persistence can be implemented with a custom persister and `idb-keyval`. Sources checked through Context7: `github.com/tanstack/query` query-functions, skipToken core, and `persistQueryClient` docs. This supports typed error restoration, dependency-specific gates and safe allowlisted persistence—not wrapping everything in another cache.

Next 16 documentation checked through Context7 confirms `loading.tsx`/Suspense streaming, production Link prefetching and `useReportWebVitals` in a narrow client component. XState persistence and `ws` auth/heartbeat were checked only to make an informed accept/reject decision; neither browser state dependency is being added in this pass.

## Production boot/read measurement

### Method

1. `pnpm build`, then `pnpm start -- --hostname 127.0.0.1 --port 3017`.
2. Curl production routes repeatedly with `time_starttransfer`.
3. Run `pnpm --filter @masayume/scripts spike:boot-timing` three times per `BOOT_WS_INDEX`. The diagnostic configures the existing runtime and times clock, collateral and venue concurrently (`scripts/spike/boot-timing.ts:18-65`).
4. Reload `/markets` in a real browser and sample shell/meaningful-content state.

Build baseline: compilation 5.3 s; TypeScript 10.5 s; 72 pages generated in 1.8 s. `/markets` TTFB: 26 ms first, about 2 ms next; `/portfolio`: 5 ms first, about 2 ms next. These rule out Next's static server response as the main wait.

### Boot results

| WS index | Run | Total | Clock | Collateral | Venue |
|---:|---:|---:|---:|---:|---:|
| 0 | 1 | 5,457 ms | 4,141 | 4,141 | 5,455 |
| 0 | 2 | 1,158 ms | 1,157 | 1,156 | 544 |
| 0 | 3 | 2,579 ms | 2,579 | 2,578 | 791 |
| 1 | 1 | 4,917 ms | 1,915 | 1,915 | 4,914 |
| 1 | 2 | 1,124 ms | 1,124 | 1,122 | 510 |
| 1 | 3 | 1,170 ms | 1,170 | 1,169 | 590 |

Both endpoints succeeded. The paired clock/collateral times reveal one shared SDK/WS startup path; venue/indexer occasionally dominates near five seconds. A URL swap alone does not address either component.

### Browser result

The production static shell appeared at about 307 ms. The Markets hero then displayed the false empty instruction “Pick a Window above to read it here” while lane data was unresolved. Useful BTC/ETH market content appeared at about 20.8 seconds on the sampled reload. This confirms a client boot/provider/query cascade after fast HTML. The browser was disconnected, so the owner's signed-in Portfolio `Try again` storm was not reproduced; exact wallet-query attribution remains unknown.

### Root-cause ranking

1. `useReadingQuery` gates every non-boot query on combined clock/collateral/venue success (`packages/markets/src/react/useReadingQuery.ts:18-53`). Independent public/indexer work waits for the slowest boot fact.
2. The root provider mounts wallet, query, RainbowKit, Markets, boot, session, alerts and recovery around every page (`web/src/providers/AppProviders.tsx:21-45`). The browser's additional ~15 seconds after boot needs milestone/query instrumentation.
3. `ReadingErr` is resolved data, so TanStack sees transport failure as query success (`packages/markets/src/react/useReadingQuery.ts:36-54`, `packages/markets/src/provider/reading.ts:17-36`). Normal retry/error/previous-data behavior cannot work.
4. `MarketsProvider` probes only socket open after mount and may rebuild/re-key the SDK provider (`packages/markets/src/react/provider.tsx:8-30`); endpoint probes are sequential (`packages/markets/src/runtime/read-runtime.ts:143-183`).
5. Portfolio history and position families fan out together and history polls through the generic market interval. This likely explains the owner's repeated section retries but was not independently timed while signed in.

### Proposed order, no implementation in this pass

1. Add milestones for runtime configured, first SDK request, first indexer request, clock/collateral/venue, lane first success and Portfolio critical sections; add Web Vitals without wallet identifiers.
2. Split boot into dependency-specific cached facts. Let independent public lane reads begin before chain clock/collateral; keep writes gated on exact live truth.
3. Restore rejected-promise semantics for first-load infrastructure failures; retain last-good data as explicit stale UI.
4. Replace the false Markets empty copy with a skeleton while unresolved, a named no-live-Windows empty state after successful empty, and a persistent error after failure.
5. Persist only safe successful metadata/settled history through IndexedDB, scoped by build/schema/chain/venue/wallet; never quotes, books, mutations or authority.
6. Render Portfolio identity/balance/open/claimable first; defer settled history/analytics and isolate section failures.
7. Add JSON-RPC health probes and centralized read failover; split global providers by route only after mapping alert/recovery guarantees.

Detailed proposal: `docs/architecture/performance-read-architecture-2026-09-03.md`. The diagnostic remains useful and intentionally does not change the boot path.

## Decisions and unresolved experiments

- Recommend implementation order: Practice, arcade, Lucky, arena/ops, Duel, Moonshot A. Owner approval pending.
- Recommend Moonshot A in a new `MoonshotReserve`, not an in-place Range upgrade. Owner/liquidity/deploy approval pending.
- Recommend Free + 1/5/10 tUSDC side-pots, 1 tUSDC per-card order cap; owner amounts pending.
- Recommend 3–5 distinct 15m Windows, widen to 1h; 5m only after measured headroom. Owner pending.
- Recommend directional follows and one unified Leaderboard with game/friends/season tabs. Owner pending.
- GameArena deploy is not authorized by this research pass. Required experiment: unit conservation/adversarial suite, live-ABI fork composition, `eth_estimateGas`, then explicit deploy interpretation.
- Required performance experiment: signed-in trace with query-family timestamps and request counts; do not infer the Portfolio culprit from one disconnected browser.
