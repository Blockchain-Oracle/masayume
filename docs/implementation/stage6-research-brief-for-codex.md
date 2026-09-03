---
title: Stage 6 research and architecture brief (for Codex)
status: owner's instruction, 2026-09-03
---

You are the research and architecture lead for **Stage 6 of Masayume: the first-class games**. Masayume is a
consumer prediction app on DreamDEX Event Contracts (Somnia Shannon testnet), built by porting Yosuku's product
verbatim and adding games whose mechanics come from two of the owner's earlier hackathon winners, PIPS and Flicky.
Stages 0–5 are built and live. Stage 6 is the only stage left to build, and nothing has been written for it. Your job
in this pass is **research and architecture, not product code**: study the references with your fidelity skill, study
this repo's existing architecture, check every library you would use, and come back with an architecture the owner and
the builder can execute slice by slice. You are also holding the boot-latency investigation in parallel (section 8).

Work in your own worktree. Never change git state in the owner's working tree (no `git checkout`, `stash`, `reset`
there), never touch the untracked `prompt.md` or `context/screens/`, and never push, deploy, publish or fund anything.
Commit your documents to your branch as you go.

## 1. Read these first, in this order

1. `context/README.md` — the research index and the ten DreamDEX ground rules.
2. `docs/architecture/yosuku-source-led-migration/README.md`, then `00` → `05`. **`04-game-system.md` is the
   authority for Stage 6**: product placement, the route family, the mode-truth table, the shared game model, the
   duel lifecycle, GameArena's responsibilities, pick execution, commit-reveal, scoring, matchmaking, actors, recovery,
   audio/motion/accessibility, and the completion definition. Read `05` for the definition of done, the verification
   policy (tests are not a deliverable; proportionate checks only) and the decision-log and handoff formats.
3. `docs/implementation/RESUME.md` — where everything stands, the facts you must not re-derive, the invariants.
4. `docs/implementation/parity-ledger.md` — the games rows (grep `/games`) and the Stage 4/5 sections for the
   patterns you will reuse (§EventVault grants, §LeverageReserve's gateway, §RangeReserve's model, §Fill projection).
5. `context/51-status-latency-handoff-and-games-2026-09-03.md` — the mode-by-mode mapping already drafted, the five
   decisions the owner has not answered, the coin status, and the boot-latency handoff (section 8 below).
6. `context/01-dreamdex-event-contracts.md` (the protocol canon and the 14 gotchas), `context/02-markets-sdk-api.md`
   (the SDK), `context/43-oraclehub-range-basis-spike-2026-09-02.md` (the hub's prints), `context/45-…leverage…`
   (the IOC-in-transaction pattern and its live gas), `context/49` (the browser review), `context/50` (the source diffs).

## 2. The references, and what to take from each

Yosuku is the **visual authority** (`reference/yosuku`, pinned at `3c56ef5`): the shell, typography, spacing, motion,
the editorial language of every menu. The games are an additive destination inside that shell; a live game stage may be
a dark immersive island (as `/reels` and `/trade-from-x` are). PIPS' 3D handheld console and its Teenage Engineering
screen language are **not** carried over. Yosuku has no games of its own, so the game screens are ours to design in its
language — this is the one place you are expected to design, not transcribe.

**PIPS** (`reference/pips`) contributes selection, first-run progression, customisation, audio/haptics, achievements,
presence and the individual game mechanics. Study with your fidelity skill, screen by screen and state by state:
- `web/src/routes/_app/games/index.tsx` (the hub), `lucky.tsx`, `moonshot.tsx`, `range.tsx`, `line-rider.tsx`,
  `candle-hop.tsx`; the engines `web/src/components/game/rideEngine.ts`, `flapEngine.ts`, `Chart.tsx`,
  `GameLeaderboardOverlay.tsx`, `MinigameBoard.tsx`.
- `web/src/routes/_app/menu/*` — achievements, customize, deposit, history, leaderboard, settings, stats, username,
  withdraw — and which of these Masayume already has as product surfaces (`/portfolio`, `/leaderboard`,
  `/portfolio/edge`, the balance plate, the session-key manager).
- `web/src/lib/sound.ts`, `haptics.ts`, `achievements.ts`, `presence.tsx`, `shareCard.ts`, `demo.ts`.
- `backend/src/services/games.ts` (`resolveLucky`, `resolveMoonshot`, the strike scan), `plays.ts`, `rng.ts` (the
  seed), `leaderboard.ts`, `achievements.ts`, `stats.ts`; `backend/prisma/schema.prisma`; `backend/src/workers/*`.

**Flicky** (`reference/flicky`) contributes the PvP lifecycle, commit-reveal, real-PnL scoring, matchmaking,
settlement and recovery. Study:
- `README.md` (the whole duel walkthrough, the adaptive deck rule, the scoring formula, the modes, the design
  decisions and their trust trade-offs), `docs/prd.md`, `docs/e2e-flow.md`, `docs/season-prizes.md`,
  `docs/zklogin-sponsored-gas-plan.md`.
- `apps/contracts/sources/duel.move` — the state machine, escrow, `record_swipe`, `settle_card`, `finalize`, the
  `*_free` variants, `refund_duel`, `claim_reveal_timeout`; `apps/contracts/tests`.
- `apps/server/src/deckmaster.ts`, `card-source.ts`, `keeper.ts`, `indexer.ts`, `mmr.ts`, `season.ts`, `sponsor.ts`,
  `ws/` (matchmaking, rooms, presence, chat), `duels-api.ts`, `leaderboard-api.ts`.
- `apps/web/src/routes/game/*` — `home`, `practice`, `pvp`, `play`, `active-duel`, `duel-view`, `rank`, `history`, `chat`.

Cite a file path and line range for every claim you make about a reference. Where PIPS or Flicky did something because
of Sui or DeepBook Predict that DreamDEX does not need (keeper-fed settlement prices, the strike ladder, PTBs, zkLogin,
the SUI→dUSDC swap), say so and say what replaces it.

## 3. The repo's architecture you must build on, not beside

- `packages/core` — pure domain (schemas, `Reading<T>`, units, the reserves' pricing mirrors with golden vectors).
  The shared game model from doc 04 belongs in `packages/core/src/games`.
- `packages/markets` — the chain port: one shared **read runtime** (`runtime/read-runtime.ts`, no signer ever
  exposed), one `SubmitterSession` per signing actor (`sessions/`), typed transaction lanes with gas envelopes,
  `withReading` staleness, `useReadingQuery` gated on the boot, the book **coordinator** (one normalised book per
  market, never a second depth), `react/` hooks. Every reserve has `deployment.ts` (generated addresses + fork
  override), reads over multicall, and `submit*` writes with requote guards.
- `contracts/` — Foundry. The pattern: an interface (`I*`), a **gateway** that is the venue seam (`LeverageGateway`,
  `PrivateGateway`: resolve by market id, IOC buy/sell as a taker, redeem, book reads), the product contract on top,
  mocks (`MockWindows`, `MockLeverageVenue` with a walkable book), unit tests, one `*Fork.t.sol` against Shannon,
  `export.mjs` → ABIs + `deployments/50312.json`. No admin beyond the reserves' `admin`, no pause on the vault.
  `EventVault` has typed grants `SESSION` / `EXECUTOR` / `STRATEGY` with caps; doc 04's `GAME_SESSION` grant is
  either a fourth type or a profile of one of these — decide.
- `packages/db` — postgres.js on Neon, `ensureSchema` self-applies; tables today: room comments, takes, the X tables,
  strategy runner heartbeats/fills.
- `services/ops` — long-running actors (`market-maker`, `leverage-keeper`, `strategy-runner`, `x-relay`), one key
  each, `DRY_RUN` unless `DRY_RUN=0`, registered in `main.ts`. The matchmaker, deckmaster and settler live here.
- `web/` — Next app router; `features/<surface>/`; `components/shell` (`SectionHead` is the reference's own);
  `styles/yosuku/part-01..18.css` is Yosuku's design system split verbatim (**grep the parts before writing CSS**);
  `design-literals` bans hex and px in TSX, so values go in a CSS module with the source utility quoted above each
  rule; 400-line cap on every file. `motion` is already a dependency. The Ticket (`features/markets/ticket`) already
  places, cashes out and shares; the session key + sponsor rail (`features/session`, `/api/sponsor`) is the gasless
  path, **but no `SPONSOR_PRIVATE_KEY` has been supplied** — today the session key pays from its own STT.
- Existing social surfaces to reuse rather than duplicate: `/leaderboard` (a venue-wide fill projection, ~35 s cold,
  3-minute cache), the Room (signature + position gate), takes, share cards (`features/share`, the X banner), the
  X rail (linked handles), reputation/badges (`projection/badges.ts`).
- DreamDEX facts that shape every design: markets are Up/Down **Windows** per asset per cadence (5m, 15m, 1h, 4h,
  1d) with **one strike, the opening print**; prices are YES probabilities and every order is priced in YES terms;
  takers are IOC, makers post-only; settlement is finalised on chain and positions (ERC-6909) are redeemed with an
  explicit outcome; voids pay 0.5 both sides; the indexer lags seconds so writes gate on the on-chain status; there is
  no REST; the venue id moves; tUSDC is 6 dp; Somnia charges ~10× the EVM for calls and ~20× for creations
  (context/41); the hub's prints settle Windows (context/43). Live gas from Shannon for the closest analogues: a 2×
  boost open 5.07M, a parlay open 3.9M, a private mint 1.9M.

## 4. What the architecture must answer

For each of the eight routes (`/games`, `/practice`, `/duel`, `/lucky`, `/range` (done), `/moonshot`, `/line-rider`,
`/candle-hop`), the complete user flow from entry to every terminal state, in Yosuku's shell, with the economic
boundary stated exactly as doc 04's mode-truth table demands. Then, specifically:

1. **Lucky.** The seeded reel (asset, side, payout tier), the scan over every live Window for the book price closest
   to the tier, the seed's auditability (server seed, client seed, commitment, what the player can verify), the real
   quote shown before the order, cash-out at the live bid, the win/lose moment, streaks and the leaderboard entry.
2. **Duel, Ranked and Free.** The `GameArena` Solidity design: state machine, side-pot escrow, commit-reveal deck,
   each pick placed as an IOC taker **in the same transaction** on the venue (confirm the composition against the
   real ABI before promising it — doc 04 forbids turning an assumption into copy), positions held by the arena and
   each player's payout returned at settlement, per-card settlement on the venue's finalised outcome (no keeper-fed
   prices), `finalize`, ties, voids, partial picks, reveal timeout, no-show, refund, the free variant, events
   sufficient to reconstruct a match. The deckmaster's selection policy and where reveal material lives. The
   matchmaker: queue keys, rating bands widening with wait, MMR (which rating system and why). The realtime layer:
   where the WebSocket process runs (beside the ops actors; Next on a serverless host cannot hold sockets), the
   room protocol, presence, chat, reconnect from chain + DB state. The lockup view with live per-card PnL. The
   settler (permissionless call, who runs it for the demo). Gas per swipe on Shannon, sponsored and unsponsored.
3. **Practice.** The synthetic deck priced off live spot, the bot, the tour, and the guarantee that nothing in it
   ever looks like a wallet position, payout, opponent or leaderboard result.
4. **Moonshot.** Give both options with numbers: **A** keeps the aim — a one-sided target priced by the house on the
   RangeReserve's model (P(S_T > K) with K solved for the multiple; write the math, the contract delta on
   `contracts/src/range`, the deploy and supply cost), a real position settled by the hub's print; **B** is a
   directed Lucky over the book. Recommend one.
5. **Line Rider and Candle Hop.** The port plan for `rideEngine.ts` / `flapEngine.ts` into a Yosuku dark island, the
   score tables, the honest stance on unverifiable local scores, reduced motion, pause when hidden.
6. **The leaderboard and the social layer** — the owner's emphasis. Rankings across the whole product: global, per
   game, per arcade game (PIPS' `FullLeaderboardDTO` shape), streaks, presence ("who is playing now"), **friends**
   (how a player follows others — by handle, wallet, or linked X — and sees their rankings), handles and usernames
   (PIPS' onboarding; Yosuku's creators), seasons and a prize pool (Flicky's `season`), a share card after a win.
   Decide how this fits the existing fill-projection `/leaderboard`: one board with sections, or a games board beside
   it. Recommend, with the data authority for every number (chain receipts vs Postgres vs ephemeral).
7. **The hub and shared game surfaces.** `/games` grouped Prediction / Duel / Arcade, resume of an active match on
   return, and which of profile, achievements, customisation, funding, history, settings and withdrawal are the
   existing product surfaces and which are new.
8. **Data.** Exactly what lives in Postgres (profiles, handles, settings, MMR, achievements, history projection,
   arcade scores, rooms, queue), what is chain truth (arena events and receipts), what is ephemeral. A schema
   proposal (tables, keys, indexes) in the `ensureSchema` style, idempotency keys namespaced by match id, and how
   the game history joins the existing fill projection.
9. **Libraries.** For every candidate — WebSocket server (ws, uWebSockets, socket.io, a hosted relay), swipe gestures,
   canvas/animation, audio, haptics, rating math, randomness, state machines, the Solidity side — check the current
   documentation (Context7 or the source), version, licence and bundle cost, and prefer what the repo already has.
   Say what you rejected and why.
10. **Actors, keys and gas.** Every new signer, one key per writer, `DRY_RUN` first, funding in STT, where each runs
    for the demo, and the sponsor question (with and without a `SPONSOR_PRIVATE_KEY`).
11. **Security.** The arena's threat model: deck front-running, reveal griefing, escrow safety, reentrancy through
    the venue, stuck matches, the free tier as a spam vector; the fork-test plan; the deploy cost on Somnia.
12. **Sequence.** Dependency-ordered slices, each gate-green (`pnpm typecheck`, `pnpm invariants`, `pnpm test`,
    `forge test`, `pnpm build`) and committable on its own, with the files each slice owns so several agents can build
    in parallel without touching one another's files; the acceptance statement per mode from doc 04's completion
    definition; what the 2–3 minute demo video shows.
13. **Decisions for the owner**, each with your recommendation: the five in context/51 §3 (order, Moonshot A/B,
    stake tiers, deck rule, the deploy go) and any you add.

## 5. Rules that bind the design

- **No fake data, ever** (doc 05 §No fake-data): no invented odds, balances, fills, payouts, opponents, leaderboard
  activity or settlements. Loading and unavailable are valid states. Practice and arcade are valid only because
  their no-stake nature is explicit on every screen.
- **Source-led where a source exists**: Yosuku's shell and components verbatim; PIPS and Flicky mechanics faithfully,
  with every departure named and justified.
- **Real positions or none**: a ranked pick is a real DreamDEX position; "pick locked" is shown only once the receipt
  state exists.
- **The existing runtime is the runtime**: one read runtime, one signer per actor, `Reading<T>`, the coordinator,
  the tx lanes, the generated addresses module (AD-10 lockstep). Do not propose a second market stream or a second
  balance.
- The invariants: no file over 400 lines, no hex or px in TSX, pnpm, `pnpm invariants` clean.

## 6. What to deliver

1. `docs/architecture/yosuku-source-led-migration/06-game-architecture.md` — the architecture, in the shape of
   section 4, with a decision log in doc 05's format and an implementation sequence.
2. `context/52-games-research-<date>.md` — the research record: every reference file read with paths and the
   findings, every library checked with the version and the source of truth, every DreamDEX/SDK composition you
   verified (and how — read-only spikes against Shannon are allowed; no writes), and the boot-latency findings.
3. A short handoff note in `docs/implementation/RESUME.md` under "Stage 6 — not started", pointing at both.
4. Proposed additions to `docs/implementation/parity-ledger.md` for the games rows (do not rewrite existing rows).

Every claim carries evidence. Where you are uncertain, say so and give the experiment that would settle it. Where a
choice is the owner's, put it in the decisions list with your recommendation rather than deciding silently.

## 7. Things already decided that you should not reopen

Yosuku is the visual authority; the games are additive; the eight routes are the route family; ranked scoring is real
PnL from receipts with no speed bonuses or UI multipliers; the side-pot and the underlying positions are separate
ledgers; `RangeReserve` is live and `/games/range` is built; the reserves' gateway pattern is how a contract talks to
the venue; deployments to Shannon follow the owner's standing go for gate-green, fork-verified slices unless the owner
says otherwise for GameArena.

## 8. The boot latency, held in parallel

You are also holding the performance investigation. `context/51 §2` records what was established and what was not:
every wallet- or market-scoped first read lands 10–17 s after a fresh load in dev (`context/49 §Measured and left`),
the boot is three reads in parallel gated in front of every other read, the SDK's public client is one viem
WebSocket transport, `MarketsProvider` probes the WS endpoints sequentially after mount and rebuilds the runtime
(remounting the tree) if the healthy index differs, and `/dev/boot` — a server page — also first-painted at +15 s.
**Measure against `pnpm build && pnpm start` before anything else** to rule out the dev toolchain, then the three
reads and each endpoint under a stopwatch from Node, then the browser. Report findings in the research record. Do not
change the boot path in this pass; the owner wants a conversation once both investigations have looked.
