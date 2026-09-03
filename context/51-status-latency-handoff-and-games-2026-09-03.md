# Session record — coin status, the latency handoff, the games conversation (2026-09-03, twelfth session)

Read after context/50. Nothing in this session changed code. It (1) established where the project stands after
Stage 5, (2) handed the boot-latency question to the owner's other agent, (3) read the two game references and
mapped every doc-04 mode onto DreamDEX, and (4) listed everything still open so the next session can start on
Stage 6 from a clean instruction.

## 1. Coin status, read from Shannon at ~12:00 UTC

Everything is testnet money from the faucets. No real funds have moved at any point in this project.

| Wallet | STT | tUSDC |
|---|---|---|
| demo user `0xd357019E2c55375477802A047dB7bC1A77819358` | 0.94 | 9,947.24 |
| deployer `0xdD7ae7c43e87Fae3eaE13c23C01eCa6D5bE8Bf9a` | 43.43 | 886.39 |
| maker `0xE0fEa37ae5af4e7F25A2345254476a3B524eae9d` | 0.57 | 0 |
| leverage keeper `0xD5604E6cCf575bD690814fA4eF8E4F59E2583D7F` | 1.48 | 0 |
| private desk signer `0x8aF0208D3B3428d03E036912312cD892Da8362AF` | 1.39 | 0 |

| Contract | tUSDC inside |
|---|---|
| ParlayReserve `0x50Ce…C151` | 5,008.44 |
| RangeReserve `0x1F8d…8386` | 4,987.87 |
| MarketMakerVault `0xc904…9e79` | 5,035.94 |
| LeverageReserve `0x5484…2D23` | 5,000.59 |
| PrivateDesk `0x4D27…28bB` | 40.00 |
| EventVault, StrategyRegistry | 0 |
| retired first maker vault `0x3F6a…48cA` | 23.88 (its 24.855 inventory; settles with Windows 71513/71514/71647/71648/71649) |
| retired first private desk `0x4356…7c67` | 1.60 (a slot on Window 73121 to settle, sweep and credit) |
| retired first leverage reserve `0x0F4f…B575` | 0 |

**STT flows.** The faucet gave the deployer ≈50.5 STT in total and the demo user 1 STT. The deployer sent 1.5 STT to
each of the three actor wallets (4.5). So ≈2.7 STT went on gas across every deployment (nine creations counting the
three redeploys), every supply and every admin call. The maker spent ≈0.93 STT quoting live for an afternoon; the
keeper ≈0.02; the desk ≈0.11. The demo wallet spent ≈0.06 STT across every browser drive.

**tUSDC.** Faucet money (≤10,000 a call). 20,000 sits in the four live reserves, supplied by the deployer, which is
their admin. The demo wallet still holds a three-leg parlay in play (settle and claim from `/parlay`), 50.13 shares in
the maker vault, and one settled 2× boost to claim from `/portfolio`. The two retired contracts hold 25.48 that an
operator call brings home.

The recipe, for the next time the owner asks: `cast balance --rpc-url https://dream-rpc.somnia.network -e <addr>` and
`cast call … 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E "balanceOf(address)(uint256)" <addr>` over the roster above.

## 2. The boot latency — handed to the owner's other agent

**Owner's ruling (2026-09-03):** another agent is working on navigation and performance in a separate worktree.
This session does not touch it. When both have looked, the owner wants a conversation before anything lands.

What this session established before stopping, for whoever picks it up:

- **The measurement** is context/49 §Measured and left: every wallet- or market-scoped first figure lands 10–17 s
  after a fresh load, on every page, with the RPC answering `eth_blockNumber` in under a second, the HTML interactive
  at 1 s and every chunk down by 3.7 s. `/dev/boot` — a `force-dynamic` **server** page that awaits the indexer —
  also first-painted at +15.6 s, which points at the server or the dev toolchain, not only the browser.
- **The boot** (`packages/markets/src/provider/boot.ts`) is three reads in parallel: `syncClock` (one `getBlock`
  over the SDK's viem client), `loadCollateral` (`getErc20Metadata`), `resolveVenueId` (`listLiveBinaryMarkets`
  over the indexer, then a 100-row discovery page if the configured venue has no live rows).
- **Every other read waits for it**: `useReadingQuery` (`packages/markets/src/react/useReadingQuery.ts`) observes the
  boot's cache entry and keeps `enabled: false` until it is `ok`. So one slow boot read delays every figure on the page.
- **The SDK's public client is a single viem `webSocket` transport** (`makePublicClient` in the SDK's `client.js`),
  no HTTP fallback, with its own request timeout. Shannon's endpoint list is the SDK's chain definition
  (`dist/chains/definitions/somniaShannon.js`); `RPC_WS_URLS` in `packages/markets/src/chain.ts` is that list.
- **`MarketsProvider`** (`packages/markets/src/react/provider.tsx`) runs `probeWsUrls` in an effect after mount —
  sequential, 4 s per endpoint — and, if the first healthy index differs from the active one, calls
  `configureMarkets` again, which bumps the version, **re-keys the SDK provider and remounts everything under it**
  (`UserSessionProvider`, `MarketsBoot`, the page). `AUTO_ROTATE_RPC` is false, but this probe path is live.
- **Not yet ruled out**: the dev server (`pnpm dev`) — the walkthrough ran against it; measure once against
  `pnpm build && pnpm start` before anything else; the SDK's store hydration; the indexer's own latency on the
  venue query; the sequential probe.
- **Nothing was written.** A timing spike (`scripts/spike/boot-timing.ts`: the three reads and each WS endpoint
  under a stopwatch, from Node) was the planned first step. It does not exist.

## 3. The games conversation

The owner read this mapping and is deciding. Sources: `reference/pips` (the console: `web/src/routes/_app/games/*`,
`backend/src/services/games.ts`) and `reference/flicky` (the duel: `README.md`, `apps/contracts/sources`,
`apps/server/src`). Doc 04 is the authority; Yosuku stays the visual authority.

| Mode | In the reference | On DreamDEX | Needs |
|---|---|---|---|
| Practice | Flicky: solo vs a bot over a synthetic deck priced off live spot, no chain; the onboarding tour lives here | Same, live spot from the SDK's price feed; labelled Practice and no-stake everywhere | UI |
| Duel (Ranked, Free) | Flicky: two players swipe YES/NO through a commit-reveal deck of 3–5 live markets; every swipe mints a real position in the same PTB as `record_swipe`; a `Duel` object escrows the side-pot; a keeper posts settlement prices and premiums (Predict exposes neither on chain); higher real PnL takes the pot; ties split; MMR; tiers 1/5/10 with ≤1 per card | `GameArena` escrows the pot and places each pick as an IOC taker on the Window's book **in the same transaction** (the `LeverageGateway` pattern), holding the contracts and paying each player their own position payout at settlement plus the pot to the winner. Settlement reads the venue's finalised outcome — **no keeper-fed prices**, a real trust improvement over Flicky worth the pitch | Contract, deckmaster, matchmaker + WebSocket room, settler actor, Postgres (MMR, history), the stage UI |
| Lucky | Pips: a seeded reel deals asset, direction, payout tier; the backend scans live strikes for the one whose real ask is closest to the tier, mints it | The reel deals asset, side, tier; a scan over every live Window (assets × cadences × sides) picks the book price closest to the tier; seed and real quote shown before one Ticket order | UI + the scan; no contract |
| Range | Pips | Done — `RangeReserve` live | — |
| Moonshot | Pips: the knob — up for LONG, down for SHORT, further = bigger reach (2/3/5/10/25×); the backend solves the strike that pays that multiple | One strike per Window (the opening print), nothing to aim at. **A**: keep the aim — a one-sided band priced by the house on the RangeReserve's model (P(S_T > K) with K solved for the multiple), a small contract addition, deploy, supply; a real position. **B**: a directed Lucky — side + Window chosen, the multiple whatever the book pays; a skin over the Ticket | A: contract + UI. B: UI |
| Line Rider | Pips: local canvas arcade (ride a pip on a scrolling line; grip, combo), score leaderboard | Ported as is into a Yosuku dark island; scores in Postgres | UI + one table |
| Candle Hop | Pips: one-button flappy through candlesticks, score leaderboard | Same | UI + one table |
| `/games` hub | Pips: the console home, real plays and minigames listed separately | Yosuku's editorial selection page grouped Prediction / Duel / Arcade, with resume of an active match | UI |

**Not carried over:** Pips' 3D handheld console and its Teenage Engineering screen language (doc 04: Yosuku is the
visual authority; a live stage may be a dark island). Carried over: the mechanics, audio, haptics, achievements,
reduced-motion discipline, first-run progression.

**Dependencies to know before starting:** gasless swipes need a `SPONSOR_PRIVATE_KEY` (not supplied; without it the
session key pays from its own STT, ≈0.72 STT top-up per player at the lane's envelope); the matchmaker needs a
long-lived WebSocket process — beside the maker and keeper in `services/ops`, run locally for the demo. Flicky's
deck rule: `min(live, 5)` clamped to 3–5, soonest-settling with >10 min left — on Shannon that is 5m/15m Windows.

**Decisions pending from the owner** (asked 2026-09-03, not yet answered):
1. Order — recommended: Duel + Practice (shared swipe loop), then Lucky, then the arcade pair, then Moonshot.
2. Moonshot — A (the aim, house-priced) or B (directed Lucky). Recommended: A.
3. Ranked stake tiers — Flicky's 1 / 5 / 10 tUSDC, ≤1 per card, or the owner's own.
4. Deck rule — Flicky's, or widened to the 1h lane.
5. `GameArena` to Shannon under the standing deploy go once fork-verified, unless the owner wants to be asked.

## 4. Everything still open, in one list

The owner asked to confirm that the games are the only build left. They are the only **stage** left to build. The
rest, so nothing is forgotten:

**Build**
- Stage 6, the games — nothing beyond the 14-line placeholder pages exists (`web/src/app/games/*`); `/games/range` is
  Stage 5's.

**Design**
- The 21st.dev redesign pass on the non-leverage surfaces (owner's direction 2026-09-02; the leverage ones are done),
  including the new game screens once they exist.

**Review (owner)**
- The owner's own look at every Stage 5 surface — all the ledger's "Needs user review" rows are open.
- The seven owner decisions listed in context/50 (the shell's first-paint skeleton on `/parlay` and `/surface`; the
  dead space above the footer; the range mode's placed state without The Call; leverage and the funding gates
  vanishing in range mode; the Private control's position; the depth chart's axes; the countdown's format and colours).
- Not yet reviewed from earlier stages (RESUME §User feedback carried forward): `/stats`, `/download`, the boundary
  screens, the recovery toasts, the social and public-proof slice, `/portfolio` settled rows, `/leaderboard`, the
  Tutorial, the session-key sheet, `/strategies` when connected, `/agents`, `/claim`, the X pages, everything at 390.

**Performance (the other agent's)**
- The boot latency (§2). Stage 7's coherence pass: duplicated streams, hidden-tab work, heavy card mounting, fonts,
  motion, bundles; `PriceChart` keeping the old theme's ink after a live toggle; the reviewed global pass over the
  811 `text-gray-*` utilities in light mode.

**Owner-side inputs still pending** (each surface says what is missing; none blocks the games)
- `SPONSOR_PRIVATE_KEY` (gasless writes); `RUNNER_PRIVATE_KEY` + `STRATEGY_IDS` (the strategy runner — the owner said
  on 2026-09-03 not to worry about it); the X app credentials (`X_CLIENT_ID`, `X_SESSION_SECRET`, bearer, executor
  key); an AI key for Sensei's live reply (unverified); a Fear/Greed provider for the ticker; `/fund`'s Paystack key
  and treasury (owner-only, blocked); native mobile (blocked, no source).

**On-chain housekeeping** (demo wallet and operator)
- Settle and claim the demo wallet's three-leg parlay; claim its settled 2× boost; settle the retired maker vault's
  five Windows and withdraw its 23.88; settle, sweep and credit the retired desk's slot on Window 73121 (1.60 there;
  the lost-claim note in context/46).

**Submission** (window closes 8 Sep 2026; every one of these is owner-gated)
- Push the branch (79 commits ahead of `main`; `origin` is `github.com/Blockchain-Oracle/masayume`, `origin/main` is
  older than local `main`); merge or PR to `main`.
- Host the web app on a public URL for the judges (no Vercel config exists yet; `web/.env.local` holds the Neon
  `DATABASE_URL`, `ROOM_TOKEN_SECRET` and `PRIVATE_DESK_PRIVATE_KEY` that a deployment needs).
- Run the actors somewhere for the demo (maker, keeper, desk, and the matchmaker/settler once they exist).
- The 2–3 minute demo video; the README as the submission's front door; the optional deck; the optional SDK and
  docs feedback report (the gotcha canon in context/01 is most of it already).

**After the hackathon**
- Rotate the Neon credential (it was pasted into a chat transcript); remove the `/dev/*` tree before production;
  clear `masayume.tutorialSeen` expectations.
