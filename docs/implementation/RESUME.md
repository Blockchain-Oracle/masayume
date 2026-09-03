---
title: Resume point — read this first
status: working handoff
updated: 2026-09-03
---

# Resume point

Start here, then read `parity-ledger.md`. The authority package is
`docs/architecture/yosuku-source-led-migration/` (read in its documented order).

## Where we are

Branch **`feat/yosuku-source-led-shell`** off `main` (`497b43a`). **Stages 2 and 3 are closed. Stage 4 is live
on Shannon (`EventVault`, the forwarder, `StrategyRegistry` — §Stage 4 records what the user has and has not
reviewed). Stage 5 is in progress (2026-09-02, seventh session): item 1, `ParlayReserve` + `/parlay`, is live on Shannon;
items 2, 3 and 4 — `RangeReserve`, `MarketMakerVault` and `LeverageReserve` — are **live on Shannon and supplied**
(deployed 2026-09-02, eighth session, on the owner's standing go; §Stage 5 has the addresses); item 5, `PrivateDesk`
and the Ticket's Private option, is **live on Shannon too** (2026-09-03, ninth session, `0x4D27…28bB` after a security
redeploy). The user has
not yet reviewed any Stage 5 surface. Item 6, `/surface`, is **built and inspected in a browser** (2026-09-03, tenth
session; context/48) — every Stage 5 item is done. **The browser review of every Stage 5 surface ran on 2026-09-03
(eleventh session; context/49)**: a parlay, an earn supply, a 2× boost placed from the pages with the demo wallet, the
Ticket's every state, the tour at two widths in both themes; ten defects, nine fixed (§Stage 5 item 7 below), the
boot's ten-to-seventeen-second latency measured and left. **Twelfth session (2026-09-03, context/51): no code; the
coin status read from Shannon, the boot latency handed to the owner's other agent (it works in a separate worktree —
do not touch performance or navigation here until the owner says both have looked), the two game references read
and every doc-04 mode mapped onto DreamDEX, five decisions put to the owner. Next: Stage 6 (doc 04) once the owner
answers context/51 §3's five decisions — the games are the only stage left to build; context/51 §4 is the complete
list of everything else open.** The 21st.dev redesign pass on the other surfaces (the leverage ones are done) and the
user's own look at Stage 5 (the ledger's Needs-user-review rows are all still open) follow.

| Commit | What |
|---|---|
| `1658ffc` | Stage 0–1 — source-led Yosuku shell, identity, 42 public routes |
| `cd35292` | Stage 2 — shared read runtime + isolated signing sessions |
| `2ad9237` | Ledger record of the signing architecture |
| `0c12f98` | Stage 2 — `/markets` hero-as-ticket |
| `315ddf0` | Stage 2 — one subscription coordinator for the live book |
| `24ec4e2` | Stage 2 — `/reels` on the shared market stream |
| `ac416b1` | Stage 2 — Portfolio's market portions |
| `99d2623` | Stage 2 — Toast presentation; Stage 2 closed |
| `3943222`, `d488471` | Reel light-mode fix, then the card made theme-following |
| `f451f38` | Stage 3 — first-run Tutorial |
| `aa3b3b8` | Stage 3 — `/markets` §02 word-market board |
| `9de0a01` | Stage 3 — §01 as the reference's chart card |
| `c43819a` | Stage 3 — Sensei on Claude, honest without a key |
| `9f86edc` | Stage 3 — the Room, position-gated over a real store |
| `6f45a88` | Sensei's model as a setting |
| `4f442d5` | Stage 3 — the fill projection: history, equity, Trader Edge, leaderboard |
| `9a76900` | Stage 3 — takes, share cards, alerts, news, status, docs, how-it-works, demo, pitch |
| `04ce0eb` | Stage 3 — the share cards as an X banner with a QR stub (user's call) |
| `5597738` | Stage 3 — `/stats`, `/download`, error recovery; Stage 3 closed |
| `a970be7` | Stage 4 — `EventVault` contract, fork-verified on Shannon (context/41) |
| `bb1180a` | Stage 4 — the vault in the chain port: reads, second write lane, the order route's third dimension |
| `cd069c7`, `ec32a7e` | Stage 4 — seams for the parallel slices; caps golden vectors beside `simulateCaps` |
| `58ed635` | Stage 5 — `ParlayReserve` contract, port, `/parlay` from source, fork-verified; deployed and supplied on Shannon, the adapter driven live (context/42) |
| `9dfacae` | Stage 5 — the OracleHub spike (context/43), `RangeReserve` contract, port, the Ticket's Range mode and `/games/range`, fork-verified on Shannon; not deployed |
| `15c2dda` | Stage 5 — `MarketMakerVault` contract, port, the maker actor and `/earn` from source, fork-verified on Shannon (context/44); not deployed |
| `38f5e65` | Stage 5 — `LeverageReserve` contract, port, the Ticket's live leverage, the portfolio's boosts, the keeper, fork-verified on Shannon (context/45); not deployed |
| `8679953` | Stage 5 — `RangeReserve`, `MarketMakerVault` and `LeverageReserve` deployed and supplied on Shannon; the module regenerated |
| `0879bf7` | Stage 5 — the boost stake-first and the reserve redeployed at `0x5484…2D23`; the leverage surfaces redesigned with 21st.dev; range headroom; the actors load the collateral |
| `893779a` | Stage 5 — `/surface` on the venue's book (structure, depth, slippage ladder, term structure); `@masayume/core/surface`, `useBooks`; the crossed-book finding (context/48) |
| `9a2637f` | Stage 5 — the maker vault books the venue's exact escrow (its lazy refund panicked the first vault) and is redeployed at `0xc904…9e79`; the maker lane measured |
| `5f54e5e` | Stage 5 — `PrivateDesk` contract (the budget, the slot, the pool between), fork-verified on Shannon; the desk's resumable open and cash-out in the port (context/46) |
| `cc4490e` | Stage 5 — the private route's surfaces from source; the desk in `/api/private/*`; `PrivateDesk` deployed on Shannon at `0x4356…7c67` |
| `5f54e5e`…`9f07642` | Stage 5 — `PrivateDesk` after two reviews, redeployed at `0x4D27…28bB`; the resumable authorisation; the live drive (context/46) |
| `ce17add` | Stage 5 — every reading query waits for the boot (the portfolio alerts and the hidden faucet card, found in a browser) |
| `724209a` | Stage 5 — the private open's guard is read after the signature (the desk refused a 12 s-old quote twice; the 15m book moves a sixth in three seconds) |
| `b8e620d` | Stage 5 — the browser review: every Stage 5 surface driven with the demo wallet (a parlay, an earn supply, a 2× boost); nine defects fixed, the ETH bands priceable, the vault exit settling every closed Window (context/49) |
| `9298d9c` | Stage 5 — the ports diffed against the reference source by six agents (context/50); the cheap exact-replication misses fixed across all six surfaces; six ledger rows corrected |

Everything is green: `pnpm typecheck`, `pnpm invariants` (14/14, 0 warnings), `pnpm test` (151),
`forge test --no-match-contract Fork` (173), `pnpm build`.

**The live actors** (`pnpm --filter @masayume/ops start` with `DRY_RUN=0 MAKER_PRIVATE_KEY=… LEVERAGE_KEEPER_PRIVATE_KEY=…`,
keys in `~/.config/masayume/market-maker.env` / `leverage-keeper.env`) ran on Shannon on 2026-09-02: the maker quoted
and merged live, the keeper watches the leverage reserve. `spike:live-windows` lists Trading ids; `spike:stage5-live`
drives a boost and a band through the adapters and measures the lanes. Dev server: `pnpm dev` → `http://localhost:3000` (`/` → `/markets`). **To drive a surface in a real browser with the demo wallet**, use the scripted-wallet driver in context/47 (Playwright over the installed Chrome, the key in Node, `personal_sign` and `eth_sendTransaction` handled) and run it under `caffeinate -i` — this Mac sleeps mid-run otherwise. The Claude Chrome extension was not connected on 2026-09-03 (checked again in the eleventh session). The scratchpad recipe from context/49 (`driver.mjs`, `lib.mjs`, one script per pass) is the fastest restart.

**Never touch or commit** the untracked `context/screens/` and `prompt.md`. They are the user's.

**`/dev/*` is scaffolding.** The user keeps it only to eyeball fixtures quickly and will remove the whole
tree before production — never link it from the app, never treat a `/dev` mount as the feature shipping.

**Local state, not in the repo**: `web/.env.local` (gitignored) holds the user's Neon
`DATABASE_URL` and a random `ROOM_TOKEN_SECRET`. The temporary local `masayume_room_dev` database
used to verify the Room on 2026-09-01 has been dropped. **The Neon credential was pasted into a
chat transcript** — worth rotating in the Neon console once the hackathon is over.

## Facts you do not need to re-derive

- **Pin verified**: `reference/yosuku` HEAD == `origin/main` == `3c56ef52b78dae28cc198495f753480292f6a5ad`, zero drift.
- **Provenance cleared**: the user owns / has permission for Yosuku source. Port source, CSS,
  tokens and assets **verbatim** — do not rebuild from screenshots or memory.
- **Design system is already ported**: `web/src/styles/yosuku/part-01..18.css`, split from
  `app/globals.css` at brace-depth-zero, concatenation verified byte-identical. Regenerate the
  split rather than hand-editing a part. Most Yosuku classes you will need already exist —
  **grep the parts before writing any new CSS.** `/reels`' `.feed-snap` and `.feed-card` were
  already in `part-16.css`; the toast's emerald/rose were already `--profit` / `--loss`.
- **The pattern for porting a card**: the reference writes everything as inline Tailwind
  arbitrary values, and `design-literals` bans hex and px in TSX. So the values go into a CSS
  module with the source utility string named above each rule (`markets-hero.css`, `reel.css`,
  `toast.css`) and the TSX carries semantic class names.
- **Invariants matter**: no file over 400 lines under `web/src`, `packages`, `services`,
  `scripts` — **including `.css`** (`reel.css` had to be split); no raw hex or `px` literals in
  TS/TSX under `web/src/{app,components,features,providers}`, *including inside comments*.
  Run `pnpm invariants` before claiming done.

## The read pipeline, after the coordinator

`packages/markets/src/runtime/coordinator.ts` holds **one normalised book per market**, derived once
at `CANONICAL_BOOK_DEPTH`, fanned out only when the resting liquidity or the connection actually
moved. Three things it fixed are worth not re-introducing:

- **Never ask the live store for a second depth.** Its memo cache is keyed on the depth
  (`bookynm:<market>:<depth>` over `book:<pool>:<depth>`), so each distinct depth makes it walk the
  whole resting-order map again, per pool, per block. `useBook` has no `depth` argument on purpose —
  slice what you display out of the reading.
- **The store's version bumps every block**, so an unchanged book still arrives as a new object every
  block. `sameBookDepth` is what stops that re-rendering every consumer.
- **Do not pass an inline object to a data hook.** All three old `useBook` call sites built
  `{ marketId, poolAddress, decimals }` fresh each render, so the memo inside never held.

`useTick` shares one timer per interval (`react/tick-clock.ts`). The SDK already ref-counts its pool
watches, so the transport was never the duplicated part — do not rebuild that layer.

## Stage 3 — in progress

Per `05-migration-and-agency-handoff.md`. Four slots were waiting on `/markets` and `/reels`.
**All four are done.** What each needed, kept because it explains the shape of what is there:

1. ~~**The word-market board**~~ — **done**, `/markets` §02, and §01 is now the reference's chart
   card (`Market624Card`) on the user's call, so the two sections speak different languages the way
   the reference's do. Both invented numbers are gone: the `probAbove` logistic is the book's real
   asks, the spot-derived `strike624` line is the opening print.
2. ~~**The Sensei dock**~~ — **done, and provider-agnostic** (revised 2026-09-02 on the user's
   call). Runs on the Vercel AI SDK 7; `AI_MODEL` picks the model, default
   `anthropic/claude-opus-5`. The whole surface runs with no credential at all — ring, teaser,
   drawer, meter, tape and trade cards read the market stream the page already holds — and with
   none set the route says so **and names the variable that would fix it**. Set any one of:
   a direct key (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`),
   `AI_GATEWAY_API_KEY`, or `AI_BASE_URL` + `AI_API_KEY` for anything OpenAI-shaped. See the
   ledger's §Sensei's model layer for the resolution order and what the abstraction cost.
   **The live reply is still the one thing unverified** — no credential on this machine.
3. ~~**The Room**~~ — **done and live on Neon** (the user supplied a `DATABASE_URL` on
   2026-09-02; schema self-applied, round-trip verified against it). `packages/db` is real
   (postgres.js, one table), and the gate is the server's: a wallet must prove its address by
   signature *and* hold a position on that market, both checked in `api/room/join`. Without a
   `DATABASE_URL` the Room opens and says it is not connected on this deployment. 14 checks over
   the live endpoints, including a valid signature from a wallet with no position getting 403.
   **Two things to know**: comments are stored in the clear and the server can read them, so the
   badge says "bettors only" and not the reference's "Bettors only · Encrypted"; and the gate is
   *narrower* than the reference's `has_bet` — a wallet that redeemed a settled Window loses that
   Room.

4. ~~**Takes, sharing, alerts, news, status, docs, how-it-works, demo, pitch**~~ — **done 2026-09-02**,
   split across six forks and the main session; every piece has a ledger section (§Takes, §Sharing,
   §Alerts, §News and ticker, §Status, §Public proof). Things worth knowing before touching any of it:
   - **Takes** are rows in `packages/db` (`takes` table, applied by the shared `ensureSchema`) whose
     verifiable spine is the wallet's `personal_sign` over `takeMessage()` in `features/takes/protocol.ts`.
     The route stores the caption **exactly as signed** and refuses one it would have had to normalise —
     the composer normalises before signing. `backed` is the Room's `holdsPosition` read at post time.
     `GET /api/takes` answers `{ configured:false, takes:[] }` with no store, never an error. Verified by
     a scratch script signing with the demo wallet (12 checks); one real take from `0xd357…9358` is in
     the store ("endpoint check — …") — delete it from `takes` if it should not stay in the reel.
   - **Share cards** (`features/share/`): `canvas.ts` is the drawing kit both PNGs use; it reads
     `--share-*` tokens off `share-card.css`, and `font()` builds canvas font strings, so no hex or px
     lives in TSX. `/dev/share` renders every export as an `<img>` — the way to look at a card.
     **Redesigned 2026-09-02 on the user's call** (the one surface exempt from source-led replication):
     a 1600×900 X banner whose perforation runs vertical, with a stub (`stub.ts`) carrying a QR to
     `https://masayume.app`, the site and `@masayume_app` — brand constants in `copy.ts`, given by the
     owner. QR via `qrcode-generator`. **Where they show in the app**: The Call is the ticket body in the
     `/markets` hero from the moment a fill confirms (`ticket/Ticket.tsx` → `PlacedCall`), Earned Heat is
     "Share card ↗" on every Verdict receipt (`LiveVerdict`, and `/portfolio` settled rows via
     `HistoryReceipt`). `PlacedCall` snapshots the Window at mount because `useTicket` auto-advances in
     the no-entry buffer while the bet state stays.
   - **Alerts** fire only while a tab is open (browser-side evaluator in `AppProviders`); the popover
     says so. Placement in the hero foot is ours and awaits the user's eye.
   - **`/status`** is the probe; a stale last-good reading is reported as a failed probe on purpose.
   - **`/demo`** and **`/pitch`** read `/api/leaderboard` live; a cold board takes ~35 s and both show a
     reading state until it lands.
   - **`/news`** exists because the feed and its RSS route survived in the pinned source; the page is the
     reference's own from `93d09c1^`. Nav entry in the More menu.

5. ~~**The fill projection**~~ — **done 2026-09-02**, and it unblocked the whole pending set at
   once: settled history with receipts, the equity curve, PnL, stats, reputation, badges and CSV on
   `/portfolio`; `/portfolio/edge`; `/leaderboard`. One derivation (`packages/core/src/projection/`)
   replays a wallet's indexed fills and complete-set router actions into one ledger per Window and
   settles each by the chain's rule; `listWalletHistory` / `useWalletHistory` is the port read;
   `readVenueBoard` runs the same replay venue-wide for the board's server route. **No database, no
   credential.** Read the ledger's §Fill projection before touching any of it — it records the three
   venue facts the code depends on: a sell beyond inventory is a collateral-backed short (the wallet
   ends up holding the complement, and the SDK's own PnL engine drops it); redemptions through the
   settlement contract leave no per-wallet indexer record (claim state is read from live balances);
   the indexer pages at 1,000 and the busiest wallet is past both caps (the reading pages five deep
   and says `complete: false` beyond). Verified against chain balances on 89 settled markets across
   four active wallets before any UI was written (`pnpm --filter @masayume/scripts
   spike:fill-projection-verify`); `spike:fill-projection-live` reads one wallet end to end.

6. ~~**`/stats`, `/download`, error recovery**~~ — **done 2026-09-02** (two forks + the main session). Worth knowing:
   - **`/stats`** rides on the board's scan: `packages/markets/src/provider/scan.ts` is the shared venue scan,
     `traction.ts` derives wallets / calls / cash-outs / staked / windows / an hourly curve / 30 recent rows from
     the same fills, and `/api/traction` answers from `readBoard()`'s three-minute cache. **Scope is 24h** and
     an incomplete scan labels every figure a floor (ledger §Traction). A cold read measured 66 s; both scan
     routes now allow 120 s. Live numbers on 2026-09-02: 69 wallets, 438 calls (one per taker order, not per fill row), 16,325 tUSDC staked.
   - **`/download`** is the PWA surface: `web/public/manifest.webmanifest` + `web/public/icons/*` (rendered
     from the mark with rsvg-convert), `features/install/useInstallPrompt.ts` (installed / prompt / ios /
     manual), the reference's phone frame around a **real capture** at `web/public/app/bet-screen.png` —
     re-capture it at a 390×844 viewport (2×) whenever the markets page changes materially. Native stays
     Blocked and the meta list says so.
   - **Error recovery**: `packages/markets/src/submitter/recovery.ts` + `features/recovery/WriteRecovery.tsx`
     reconcile every unresolved journaled intent when a session starts and tell the user (landed / reverted /
     absent / unverifiable after 24h / still checking). Order records now carry `pool` and `marketId`.
     `app/error.tsx` uses the reference's words again; `app/global-error.tsx` is new and additive.

## Stage 4 — in progress

**The contract (`contracts/src/vault/`)** — `EventVault` ports Yosuku's `trading_vault.move` buckets
(available / private / grant budget), owner-only exits with no destination parameter anywhere, three typed
grants (`SESSION` / `EXECUTOR` / `STRATEGY`) with independent caps (per-trade, UTC-day, open positions, price)
and one-call revocation, delegated **IOC-only** execution placed by the vault itself and attributed by balance
delta, permissionless `crankSettle`, and a per-owner per-Window **storage tally** (`VaultTally`) because
Shannon's RPC caps `eth_getLogs` at 1,000 blocks. Sponsored calls come through OpenZeppelin's
`ERC2771Forwarder`; deposits refuse it. No admin, no pause. 37 forge tests + the shared caps vectors; the fork
test (`SHANNON_FORK_URL=… FORK_MARKET_ID=<decimal> forge test --match-contract Fork`) filled, delegated,
voided, cranked and withdrew against the real venue — numbers in `context/41-…`. Things worth knowing:
- **via-IR caches `block.timestamp` inside a test frame across `vm.warp`** — assert against
  `vm.getBlockTimestamp()`, not `block.timestamp`, after a warp in the same function.
- The fork clock is frozen at the fork block; pick a Window that is `Trading` *at that block* (ids near the
  fork's newest markets, not the live indexer's), and `FORK_MARKET_ID` skips a slow scan.
- A local fork is `anvil --fork-url https://dream-rpc.somnia.network --port 8546 --chain-id 50312`; the venue
  also runs 1-minute Windows. On a fork: hold the clock (`anvil_setBlockTimestampInterval 0`) or the makers'
  short-lived resting orders expire within ~20 s and every IOC reverts `ImmediateOrCancelNoFill`; fund
  *fresh* keys by impersonating the OracleHub (`cast send --unlocked`) before any read — Anvil caches an
  account it once saw empty; deploy with `DEPLOY_TAG=anvil` so the record never becomes a real one. Details in
  context/41.
- `contracts/export.mjs` (`pnpm contracts:export`) is the only bridge to the app: ABIs one entry per line into
  `packages/markets/src/contracts/*.abi.ts`, deployments into `addresses.masayume.json`. Nothing else reads
  `out/` or `deployments/`.

**The port** — `@masayume/core/vault` (types, `simulateCaps` mirroring `placeFor` check for check, golden
vectors `caps.vectors.json` asserted by forge and vitest), `@masayume/markets/vault` (deployment resolution
with a local-fork env override, two-multicall reads, the tx lane's vault intents, the order lane's
`route: wallet | vault | vault-grant`, the tally as the history's second seat with `SettledRound.source`).
Every read and write says **"EventVault is not deployed on this network yet"** until a deployment exists.

**The surfaces (parallel forks, 2026-09-02)** — each ran its own gates and never touched another's files;
every on-chain path shows its not-deployed state today:
- **Trading Balance** (`web/src/features/vault/`): the `/portfolio` block restored from the reference's own
  history (`1a36ffa^` L416–466), the plate's vault row, open vault bets under Your bets, vault rounds in history
  ("via Trading Balance", a crank instead of a proof link), vault credits on `/claims`; `/dev/vault`.
- **Session-key tap trading + the sponsor rail** (`web/src/features/session/`, `sessions/session-key.ts`,
  `vault/sponsor.ts`, `/api/sponsor`): an ephemeral key in IndexedDB per owner, the enable sheet with caps and
  the capability receipt (one signature via `depositAndGrant`), the chip and manager, `navigator.locks` as the
  single writer, grant-without-key recovery, the forwarder relay with its allowlist and gates, the key pays
  where no `SPONSOR_PRIVATE_KEY` runs (≈0.72 STT top-up at the lane's envelope — measure `placeFor` once
  deployed and cut it); the Ticket's Wallet / Trading Balance route control; `/dev/session`.
- **The X rail** (`web/src/features/x/`, `/api/x/*`, `@masayume/core/x`, `packages/db` x tables, the `x-relay`
  actor): OAuth 2.0 + PKCE, an HMAC session (`X_SESSION_SECRET` required, as the reference), the ported signed
  link/unlink messages with a 5-minute TTL, the deterministic grammar with refusals (tested), `/trade-from-x`
  and `/claim` truth-corrected, receipts of every status, the relay that polls mentions and executes through
  `submitOrder` route `vault-grant` under an `x-executor` session; everything names its missing variable;
  `/dev/x`. The live account, credentials and posting stay with the owner.
- **Strategies and agents** (`contracts/src/strategy/StrategyRegistry.sol`, `@masayume/core/strategies`,
  `@masayume/markets/strategies`, the `strategy-runner` ops actor, `web/src/features/strategies/`): publish /
  subscribe (vault `depositAndGrant` then registry `subscribe`, two signatures, said so) / unsubscribe, the
  momentum model and record scoring tested, runner heartbeats and fills in `packages/db`, health derived at
  render; `/strategies` and `/agents` ported; `/dev/strategies`. Env: `RUNNER_PRIVATE_KEY`, `STRATEGY_IDS`,
  `RUNNER_INTERVAL_MS`, `DRY_RUN`, `STRATEGY_RUNNER_ADDRESS`. Deploy with
  `forge script script/DeployStrategyRegistry.s.sol` after the vault (its record merges into the same
  `deployments/<chainId>.json`).
- **The adapter, driven on the fork** (`scripts/spike/vault-fork.ts`, `vault-fork-read.ts`): deposit, an owner
  order from the balance (0.616), a grant, a delegated order (0.413) booked to the owner, void, a third-party
  crank, the balance sheet and the vault seat's round — all through the real lanes. Recorded in context/41 and
  the ledger.

**Deployed on Shannon 2026-09-02** (owner's go; deployer `0xdD7a…Bf9a`, key in `~/.config/masayume/deployer.env`
and the gitignored `contracts/.env`): `EventVault` `0x84Ec824D89ee78d5728545CE0B40EC968aa7CD7A`, forwarder
`0x82bb75b8aE663abC73308Ce42ca00d701cFb50d3`, block 477731559 — `contracts/deployments/50312.json`, module
regenerated and committed (7192f02). Somnia charges ~10× the EVM for calls and ~20× for creations; deploy
with limits from Somnia's own `eth_estimateGas` (context/41 §Live on Shannon). `StrategyRegistry` `0xAd5f37B0f3d0f6030B9d9c0f4985AFb184A85FB4` (block 477738374, 22.7M gas) followed. The
deployer keeps ~0.36 STT; the demo user `0xd357…9358` holds 1 STT (the faucet funds one wallet a day). The
live adapter run and the exits all passed on Shannon (ledger decision log, context/41 §Live on Shannon).

**Was waiting on the owner (done 2026-09-02):** a funded deployer key (STT from https://testnet.somnia.network/) and the go to run
`forge script script/DeployEventVault.s.sol --rpc-url shannon --broadcast --private-key …`, then
`pnpm contracts:export` and a commit of the regenerated module (AD-10 lockstep). Until then nothing on-chain in
Stage 4 is verified live; the fork run is the evidence.

**User review 2026-09-02 (end of the fourth session):** the portfolio plate was wrong — it was our dark
`/markets` panel, not Yosuku's cream ledger plate — and is now the reference's, verbatim
(`web/src/features/markets/portfolio/plate/`; ledger decision log). `/trade-from-x` is an island without the
shell (`ShellChrome`, `ISLAND_ROUTES`). The header hangs under the ticker when the strip is dismissed (a
reference defect). The user's standing rule, restated hard: **replicate from the reference SOURCE, and read
it before anything else** — a recorded deviation on a surface he looks at is still a failure. He said
"everything is looking okay so far" after these fixes.

**Not yet looked at by the user:** the session-key sheet and manager on the Ticket, `/strategies` publish
flow when connected, `/agents`, `/claim`, the X pages beyond the first screen, everything at 390.
Still pending from the owner: the X app credentials (`X_CLIENT_ID`, `X_SESSION_SECRET`, bearer token,
executor key) and a `SPONSOR_PRIVATE_KEY`; a `RUNNER_PRIVATE_KEY` + `STRATEGY_IDS` to run the strategy
runner; STT for the demo user's own live runs (it holds 1 STT).

## Stage 5 — in progress

**1. `ParlayReserve` + `/parlay` — built 2026-09-02 (fifth session), fork-verified; deployed on Shannon and
supplied on the owner's go (sixth session, same day).** Read the ledger's §ParlayReserve first; the decisions
and the reference-vs-ours tables are there. What is where:
- `contracts/src/parlay/` — `IParlayReserve` (vocabulary), `ParlayMath` (pure: VWAP, the same-instant
  correlation floor, the ceiling-rounded stake floor), `ParlayPricing` (the venue seam: `previewOpen`,
  `previewLegPrice`, params, pause, admin), `ParlayReserve` (supply/withdraw shares, `openParlay`,
  `resolveLeg`, `claim`, views with `parlaysOf` paging). 25 forge tests over a per-Window mock
  (`test/mocks/MockWindows.sol` — the one-market `MockVenue` cannot price two legs) plus the shared golden
  vectors (`ParlayVectors.t.sol` ↔ `packages/core/src/parlay/pricing.test.ts` over `pricing.vectors.json`).
  `forge test --no-match-contract Fork`: 72 pass. Fork: `SHANNON_FORK_URL=… FORK_MARKET_IDS=<a>,<b> forge test
  --match-contract ParlayReserveFork -vv` (context/42).
- **Leg pricing is the book's, in-transaction** (the reference's named gap, closed): UP takes the YES asks,
  DOWN takes the YES bids inverted, cost-weighted over `max(priceDepthRaw, maxPayout)` contracts, rounded up;
  thinner than that refuses `ThinBook`. So a bigger payout gets a worse price on a thin book — by design.
- `@masayume/core/parlay` (types, `quoteParlay`, `maxPayoutForStake`), `@masayume/markets/parlay`
  (deployment with `PARLAY_RESERVE_ADDRESS` fork override, `getParlayReserveState`, `listParlaysOf`,
  `previewParlayOpen`, `quoteParlayOnchain`, `submitParlayTx`, `submitParlayOpen` → `parlayId` + `requote`),
  `ParlayIntent` on the tx lane, a `parlay` gas lane (6M; on Shannon a two-leg open measured 3,919,971 and a crank 125,421), a `requote` diagnosis kind,
  `useParlayReserve` / `useMyParlays` hooks, `SubmitterSession.contracts` exposed for the spike.
- `web/src/features/parlay/` — the reference's page, builder and slip from source; `components/shell/SectionHead.tsx`
  is the reference's own `SectionHeader` verbatim (use it for the next ported page); `/dev/parlay` fixtures.
  **Not seen in a browser** — verified by typecheck, invariants (0 warnings), 99 vitest, 72 forge, build.
- `scripts/spike/parlay-fork.ts` (`pnpm --filter @masayume/scripts spike:parlay-fork`) drives the adapter on a
  fork: supply → chain quote → open → slip read → warp + void → crank → refund. Env in its header. **Ran 2026-09-02**
  on an Anvil fork of Shannon that already held the live reserve (no `DEPLOY_TAG=anvil` deploy needed any more;
  `anvil_setBalance` the house to cover the parlay lane's 0.43 STT envelope, `SKIP_FAUCET=1` because the deployer
  holds tUSDC): a 5.00 stake for 17.88 over UP 0.371 × DOWN 0.673 on two Windows sharing an instant, the void
  refunding the stake to the cent. `LIVE=1 SKIP_FAUCET=1 HOUSE_KEY=…` then ran it against Shannon itself — the
  results are in context/42 §Live on Shannon.
- **Live on Shannon (2026-09-02, the owner's go):** `ParlayReserve` `0x50Ced768C80d499bA4FB956C7DF0c2beB078C151`,
  block 477800945, creation tx `0xb4ee…ed72`, 36,937,142 gas at 6 gwei. Somnia's own `eth_estimateGas` said
  55,405,713 and forge's local simulation 3.3M, so the broadcast that landed was
  `forge script … --broadcast --skip-simulation --legacy --with-gas-price 6000000000 --gas-estimate-multiplier 105`
  — the limit taken from Somnia's estimate and kept inside the deployer's 0.358 STT (the node refuses an envelope
  the balance cannot cover). Then `approve` (259,745 gas) and `supply(5,000 tUSDC)` (898,941 gas) from the
  deployer, which is also the reserve's `admin`. `deployments/50312.json` carries `parlayReserve` /
  `parlayReserveFromBlock`, `pnpm contracts:export` regenerated the module, all five gates pass on it. The user
  approved the four parlay review rows in the ledger (no admin void, the Settle pill, the Paid row, the reserve
  line). The user then topped the deployer up to 50 STT from the faucet; it also holds ~5,000 tUSDC.

**2. `RangeReserve` + the Ticket's Range mode + `/games/range` — built and fork-verified 2026-09-02 (seventh
session); deploy waits on the owner's go.** Read context/43 and the ledger's §RangeReserve first. What is where:
- `contracts/src/interfaces/IOracleHub.sol` (the hub slice: `pullNumericAnswer`, the definition structs, the key
  reads); `contracts/src/range/` — `IRangeReserve` (vocabulary), `RangeMath` (the Φ table in 0.05 steps, its
  inverse, √, the band probability, the floored stake), `WindowQuestion` (the venue's closing-question template,
  byte-exact), `RangePricing` (the seams: venue guard, asset proof and opening print through the hub's key, the book
  centre, the model, params, volatility, pause, admin), `RangeReserve` (shares, `openRange`, `settle`, `voidStale`,
  `claim`, views). Tests: `RangeMath.t.sol`, `RangeVectors.t.sol` (12 rows generated by an independent Python
  mirror), `RangeReserve.pricing.t.sol`, `RangeReserve.lifecycle.t.sol` over `MockOracleHub` + `MockWindows`
  (`addWindowAt`, adapter and venue knobs) — `forge test --no-match-contract Fork`: **100** pass. Fork:
  `SHANNON_FORK_URL=… FORK_MARKET_ID=<decimal> FORK_ASSET=BTC forge test --match-contract RangeReserveFork -vv`
  (seeds a thin book itself); `OracleHub.fork.t.sol` for the hub alone.
- **The basis is the hub's own print** (context/43): `markets(id).oracleQuestionId` → `pullNumericAnswer`, cents,
  pending under `0x25cd016c` until two seconds after expiry, readable for good after (the sixth session's "not
  readable post-settlement" was wrong). The opening print and the asset come through the hub's content-addressed
  key of the rebuilt definition. Only Windows of the pinned venue on the hub adapter are accepted (two-decimal prints).
- **The odds are the house's**: normal return over the seconds left, σ per asset set by `setVolatility` (launch: BTC
  6200, ETH 7800 ×1e-8 per √s, measured from the venue's own closing prints — context/43 §Realized volatility),
  centred where the Window's book puts the market (Φ⁻¹ of P(up) over 20 contracts a side). Thin, wide or decided
  books refuse. **With the venue's makers offline (every book empty on 2026-09-02) the page refuses `ThinBook` until
  they return** — the parlay has the same dependency.
- `@masayume/core/range` (types, the mirror, `quoteRange`, `maxPayoutForStake`), `@masayume/markets/range`
  (deployment with `RANGE_RESERVE_ADDRESS` override, `getRangeReserveState`, `listRangesOf`, `previewRangeBasis`,
  `previewRangeOpen`, `quoteRangeOnchain`, `submitRangeTx`, `submitRangeOpen` → `roundId` + `requote`),
  `RangeIntent` on the tx lane, a `range` gas lane (8M, **not measured on Shannon yet**), `useRangeReserve` /
  `useMyRanges` hooks, `range-reserve.abi.ts` exported.
- `web/src/features/range/` — the reference's range body (`BandControl`, `range-band.css`, `useRangeDraft` with the
  presets scaled per cadence), the Ticket's range mode (`RangeTicketBody`; `BetModes` is live where the reserve is
  deployed), `/games/range` on the parlay page's frame (`RangeScreen`, `RangeBuilder`, `RangeTicket`, `RangeSlip`,
  `RangeCard`), fixtures on `/dev/range`. **Not seen in a browser** — verified by typecheck, invariants (0
  warnings), 120 vitest, 100 forge, build. Five ledger rows are flagged "Needs user review" (the pricing model, the
  page's frame, the chart band not drawn, the OUTSIDE side and the slip's pills).
- **Live on Shannon (2026-09-02, eighth session):** `RangeReserve` `0x1F8dB9B0913cB09e5CfDe44Adfa7Ff22b0868386`,
  block 478033175, creation **60,919,875** gas (0.366 STT at 6 gwei — the two definition builders), `setVolatility`
  275,924 each; `approve` 259,745, `supply(5,000)` 897,978; admin = deployer. **Found live:** the basis moves every
  second, so a cap equal to the quote never lands on a short lane; every range open now carries a 3% headroom
  (`RANGE_STAKE_HEADROOM_BPS`, context/43). **Measured live:** a range open **4,527,445** gas, its settle **290,312**,
  its claim **94,078** (`range` lane 8M holds); round 1 on the 1h BTC lane won inside its band and paid 17.13 on 5.01.

**3. `MarketMakerVault` + the maker actor + `/earn` — built and fork-verified 2026-09-02 (seventh session, same
day); deploy waits on the owner's go.** Read context/44 and the ledger's §MarketMakerVault first. What is where:
- `contracts/src/maker/` — `IMarketMakerVault`, `MakerGateway` (the venue seam: resolve by market id, post-only
  rest, pull live + expired orders, merge, redeem, collect credit), `MarketMakerVault` (shares, `quote`, `pull`,
  `merge`, `settle`, views incl. `unsettledExpired`, `windowsAt` paging). `IDreamDex.sol` grew `cancelOrder`,
  `cancelExpiredOrders`, `getOwnOpenOrders`, `getOrder`, `mergeCompleteSet` and `placeBinaryOrder`'s
  `(bool, uint128)` return (the mocks return it now). Tests: `MarketMakerVault.quoting.t.sol`,
  `MarketMakerVault.lifecycle.t.sol` over `MockMakerVenue` (per-Window pools with resting orders, a `fill` knob,
  the module + ERC-6909 in one) — `forge test --no-match-contract Fork`: **118** pass. Fork:
  `SHANNON_FORK_URL=… FORK_MARKET_ID=<decimal> forge test --match-contract MarketMakerVaultFork -vv` (prices its
  pair off the live book).
- **The venue's `price` is the YES price for every order kind** (context/44): a `BUY_NO` at p rests as a YES ask
  at p and escrows `one − p`. Post-only orders that would cross are refused (`PostOnlyWouldCross`).
- `@masayume/core/maker` (types, the flow arithmetic, `pairAround` and the grids — 8 vitest),
  `@masayume/markets/maker` (deployment with `MARKET_MAKER_VAULT_ADDRESS` override, reads, `readPoolTop`, the
  lane), `MakerIntent` on the tx lane, a `maker` gas lane (8M, **unmeasured**), hooks, `market-maker-vault.abi.ts`.
- `services/ops/src/actors/market-maker/` — the actor (`MAKER_PRIVATE_KEY`, `MM_HALF_SPREAD_RAW` 15000,
  `MM_QUOTE_SIZE` 5, `MM_REFRESH_MS` 45000, `MM_QUOTE_TTL_SEC` 180, `MM_REQUOTE_TICKS` 3, `MM_ASSETS`,
  `MM_INTERVALS` 300,900,3600; **dry-run unless `DRY_RUN=0`**): settles what the venue settled, merges pairs,
  quotes around the book's mid on the tick grid, requotes only when the fair moved. Registered in `main.ts`.
- `web/src/features/earn/` — the reference's page from source (hero + live panel, §01 supply and position) plus
  §02 the Windows table (additive, flagged); fixtures on `/dev/earn`. **Not seen in a browser** — typecheck,
  invariants (0 warnings), 128 vitest, 118 forge, build.
- **Live on Shannon (2026-09-02, eighth session):** `MarketMakerVault` `0xc904F38f38eF96E8741C7D9218a7899504B99e79`,
  block 478055022, creation **48,373,981** gas, maker set, supplied 5,000. (The first vault, `0x3F6a…48cA`, panicked
  on the venue's lazy refund of an expired quote — context/44 — and was drained to its 24.855 of inventory, which
  settles with Windows 71513/71514/71647/71648/71649: `settle` each, then the deployer's 24.977587 shares withdraw
  the rest.) The maker key is `0xE0fEa37ae5af4e7F25A2345254476a3B524eae9d` (`~/.config/masayume/market-maker.env`).
  **Measured live:** quote 526,880, pull 325,500, merge 1,018,744 (`maker` lane 8M holds); the actor quoted, was
  filled and merged live; ~0.0034 STT a transaction, ~0.5 STT an hour at a 45 s refresh over six Windows.


**4. `LeverageReserve` + the Ticket's live leverage + the portfolio's boosts + the keeper — built and fork-verified
2026-09-02 (eighth session); deploy waits on the owner's go.** Read context/45 and the ledger's §LeverageReserve first.
What is where:
- `contracts/src/leverage/` — `ILeverageReserve`, `LeverageMath` (pure: the book walks, the terms behind a fill, the
  line), `LeverageGateway` (the venue seam: resolve by market id, IOC buy/sell by delta, redeem, the book reads,
  `sizeForStake` / `previewOpen`), `LeverageReserve` (shares, `open`, `close`, `knockOut`, `settle`, views incl.
  `markOf`, `openPositions`, `unsettledExpired`, `positionsOf` paging). `IDreamDex.sol` grew `getOrderBookParameters`.
  Tests: `LeverageReserve.open.t.sol`, `LeverageReserve.lifecycle.t.sol` over `MockLeverageVenue` (a walkable book that
  IOC takers consume), `LeverageVectors.t.sol` over the shared `sizing.vectors.json` — `forge test --no-match-contract
  Fork`: **154** pass. Fork: `SHANNON_FORK_URL=… FORK_MARKET_ID=<decimal> forge test --match-contract
  LeverageReserveFork -vv`; `pnpm --filter @masayume/scripts spike:live-windows` lists the ids that are Trading now.
- **A boost is a knock-out certificate** (context/45): the reserve fronts `(L−1)·stake` for a flat premium, buys the
  contracts off the book as a taker, holds them, and is repaid first at settlement, cash-out or the permissionless
  knock-out under `fronted × maintenance`. The stake is charged from the fill: `stake + fronted − premium == cost`.
  A fairly priced boost with no knock-out would be a no-op on a binary payoff — the knock-out is the product.
- `@masayume/core/leverage` (types, the mirror — 13 vitest over the vectors), `@masayume/markets/leverage` (deployment
  with `LEVERAGE_RESERVE_ADDRESS` override, reads, the chain quote, `submitLeverageOpen` with the requote guard),
  `LeverageIntent` on the tx lane, a `leverage` gas lane (8M, **unmeasured**), hooks, `leverage-reserve.abi.ts`.
- `web/src/features/leverage/` — the strip, the quote and write hooks, the portfolio rows; `ticket/LeverageChips.tsx`
  live; `Ticket.tsx` branches on the multiple; The Call and its PNG carry the reference's caveat; `/dev/leverage`.
  **Not seen in a browser.** Ledger rows flagged for review: the model itself, wallet-only funding, the strip's
  numbers, the multiple on boosted rows only, the row's health words, the unpaid knock-out.
- `services/ops/src/actors/leverage-keeper/` — dry-run unless `DRY_RUN=0`; `LEVERAGE_KEEPER_PRIVATE_KEY`, `LK_REFRESH_MS`.
- **Live on Shannon (2026-09-02, eighth session):** `LeverageReserve` `0x5484fF06F4B6a8108fABb2511385985D933a2D23`,
  block 478043822, creation **55,407,083** gas; `approve` 259,745, `supply(5,000)` 897,933; admin = deployer. (The
  first deploy, `0x0F4f…B575`, took `open(quantity, maxStake)`; its first live open reverted `StakeAboveMax` when a
  maker moved the ask mid-send, so the open became stake-first with a quantity floor and the reserve was
  redeployed — context/45.) The keeper key is `0xD5604E6cCf575bD690814fA4eF8E4F59E2583D7F`
  (`~/.config/masayume/leverage-keeper.env`, 1.5 STT). **Measured live:** a 2× open on the 15m BTC lane
  **5,071,986** gas, the keeper's knock-out of the same position **1,367,150** (`leverage` lane 8M holds); the
  position was knocked out at the line 509 s before expiry, the reserve repaid, the owner paid 1.26 of a 10 stake.
- **Redesigned with 21st.dev on the user's call (2026-09-02, later):** `features/leverage/BoostCard.tsx` (the strip
  became a breakdown card), `KnockoutMeter.tsx`, `components/data/Odometer.tsx` (a rolling figure that settles on
  the exact reading), the chips' sliding highlight; `motion` added to the web app; `.21st/design.json` carries the
  project's tokens and the decision. Fixtures on `/dev/leverage`. Same colours and type; layout and motion are ours.

**5. `PrivateDesk` + the Ticket's Private option + the claims list — built, fork-verified and live on Shannon
2026-09-03 (ninth session).** Read context/46 and the ledger's §PrivateDesk first. What is where:
- `contracts/src/private/` — `IPrivateDesk` (vocabulary), `PrivateGateway` (the venue seam: resolve by market id, the
  stake-first `sizeForStake` with the escrow clamped to the stake, IOC buy, redeem, admin, the pinned `desk`),
  `PrivateDesk` (the owner's `deposit` / `allow` / `depositAndAllow` / `revoke` / `withdraw`; the desk's
  `chargeToPool(owner, amount, key)` → `fundSlot(slot)` → `mintInSlot(slot, market, side, minQuantity)`; the
  permissionless `settleSlot`; `sweepSlotToPool(slot)` → `creditFromPool(owner, amount, key)`). Tests:
  `PrivateDesk.budget.t.sol`, `PrivateDesk.lifecycle.t.sol` over `MockLeverageVenue` — `forge test
  --no-match-contract Fork`: **173** pass, including "after the charge no log names the owner". Fork:
  `SHANNON_FORK_URL=… FORK_MARKET_ID=<decimal> forge test --match-contract PrivateDeskFork -vv`.
- **Nothing on chain names the owner and the slot together**, and **the desk keeps no record**: the slot id and the
  two opaque keys derive from the owner's own authorisation signature (`deriveSlotKeys`), so an open or cash-out that
  lost its reply is sent again and resumes from `chargedOf` / `slotOf` / `creditedOf`. What remains visible is amount
  and timing (the charge and the slot's funding seconds apart) — every surface says "harder to link back to you — not
  anonymous". The claim is an EIP-712 ticket signed by the desk key the contract pins, verified in the browser.
- `@masayume/core/private` (types, `privateOpenMessage`, the schemas, the EIP-712 types — 7 vitest),
  `@masayume/markets/private` (deployment with `PRIVATE_DESK_ADDRESS` override, reads, the owner's `PrivateIntent`s on
  the tx lane, a `private` gas lane, `deriveSlotKeys`, `signPrivateClaim` / `verifyPrivateClaim` — 4 vitest, and the desk:
  `createDeskClient`, `openPrivateBet`, `cashOutPrivateBet`, `deskHealth`), hooks `usePrivateDesk` / `usePrivateBudget`.
- `web/src/features/private/` — the Ticket's Private option on the route control (third button, disabled with the
  reason), `usePrivateTicket` (readiness, budget, the desk's quote, the `privBlocker` ladder, top-up-and-bet as one
  action), `PrivateQuoteRows` / `PrivateNote` / `PrivateCta`, `PrivateClaims` (the reference's component with its CSS:
  verify on sight, back up, restore, cash out), `PrivateBalancePanel` (the plate's Private pool row panel), the desk's
  server half `desk.server.ts` (`PRIVATE_DESK_PRIVATE_KEY`, in `web/.env.local`), `/api/private/{status,open,cashout}`;
  fixtures on `/dev/private`. **Driven end to end in a browser on 2026-09-03** — context/47: the faucet, top-up-and-bet, a mint refunded on the spot, an open (8.163 contracts for 1.999935), The Call, the claims list, back-up, cash-out 68 s after the close (+6.16), withdraw; two fixes came out of it (`ce17add`, `724209a`). Ledger rows flagged for review: the trust model (a key, not a
  TEE), the third option on the control, the claims list mounted on the pool row, the panel's trust sentences.
- **Live on Shannon (2026-09-03):** `PrivateDesk` `0x4D27115c4eff6536bf0D009ACeBf339AA02128bB`, block 478433921,
  creation **36,654,926** gas (the first deploy `0x4356…7c67` accumulated credits per key — the security reviewer's
  high finding, a double credit across desk instances — and was replaced; it still holds two open slots on Window
  73121 to settle, sweep and credit the deployer with the desk key, context/46); admin = deployer; the desk signer `0x8aF0208D3B3428d03E036912312cD892Da8362AF`
  (`~/.config/masayume/private-desk.env`, 1.5 STT). `pnpm --filter @masayume/scripts spike:private-live` drives it
  through the real adapter (`HOUSE_KEY` the owner, `PRIVATE_DESK_PRIVATE_KEY` the desk, `WAIT=1` to settle).
  **Measured live:** charge 278,380, fund 454,255, mint 1,917,880; settle 487,256, sweep 249,887, credit 268,553; the
  owner's withdraw 85,992 (`private` lane 4M). Two bets ran end to end (a 4h Window still open; a 15m Window settled, lost,
  the dust home); the same authorisation re-sent resumed without a second charge; a claim presented twice answered
  "done". **One slot (`0x7de3…7f78`, Window 73121) holds 8.4 + 1.6 with no claim anywhere** — the first run's output pipe
  never drained — the operator can `settleSlot` after the bell, then sweep and credit the deployer (context/46 §The lost claim).
  The code-reviewer agent's five findings were fixed the same session (a resumable pending authorisation instead of a
  re-sign after `unknown`; the allowance shortfall as a re-allow; no silent flip off Private over the cap; "done" never
  fabricates a loss; the backup validated row by row).

**6. `/surface` — built and inspected in a browser 2026-09-03 (tenth session); nothing to deploy.** Read context/48
and the ledger's §`/surface` first. What is where:
- `@masayume/core/surface` — `bookStructure` / `impliedUp` (a crossed book — bid ≥ ask — has no mid and no spread;
  the ask stands in), `cumulativeDepth` / `depthBounds`, `slippageLadder` (a stake ladder 1…250 walked over the asks
  with `walkBudget` / `walkQuantity`, the payout after the fee), `termPoints` / `termBand` — 13 vitest.
- `@masayume/markets/react` — `useBooks` (several markets' books on one `useSyncExternalStore` subscription over the
  coordinator), `useBookParams`, `useSettlementFee`.
- `web/src/features/surface/` — the reference's page structure with the venue's content: `SurfaceChips`, §01
  `BookReadout` (four tiles), §02 `DepthChart` (SVG step areas), §03 `SlippageLadder`, §04 `TermStructure` (`TermChart`
  + rows); `surface-page.css` carries the reference's values with the source utility above each rule; fixtures on
  `/dev/surface`. **Inspected in Chrome headless at 1280 and 390, both themes, live and on the fixtures** — three
  things the live page said that the fixtures could not (the crossed book, the lot printing as 0, the print wrapping
  in its tile at 390) are fixed and recorded in context/48.
- `scripts/spike/book-cross-probe.ts` (`spike:book-cross`) — the contract's book and the store's side by side; they
  agreed level for level; the 5m book crosses for a block or two while the maker re-lays its 200/330/460 ladder near
  the close.
- Not done: the hero's top-of-book and the rail's cards do not name a crossed book (they show two takeable prices,
  which is true); the ladder reads the canonical ten levels only; `/surface` is not in the nav (nor in the reference's).

**7. The browser review — 2026-09-03 (eleventh session).** Read context/49 first. What it changed:
- `features/range/presets.ts` — the band presets follow the asset's price (the reference's BTC dollars carried by
  price ratio to `PRESET_ANCHOR_USD`; a nice-step centre grid; cents under $10k). ETH was unpriceable before it.
  `useRangeDraft` exposes `unit`, `decimals`, `axisHalf`; `BandControl` and both tickets format on the grid.
- `features/earn/useEarnWrites.ts` — the withdraw settles every closed Window the vault names, not the first;
  `EarnScreen` reads every Window it shows through the new `useMarketsLite` (`getMarketsLite`, no opening prints) —
  one round for the table's labels and the unsettled note; `SupplyCards` prints "wallet …" while the sheet reads;
  `earn-page.css` gives `.ea-cards` an explicit column so a phone does not overflow; the page's own `<main>` is a
  `<div>` (also `/leaderboard`, `/claim`, `/stats` — the shell owns the landmark).
- `components/ui/button.tsx` — `nativeButton` is false whenever `render` is given (an anchor); the Base UI console
  error on every mobile load is gone.
- `projection/badges.ts` — LP Provider is the reference's `plpBalance > 0` on the maker vault's shares;
  `RecordSection` passes them; the label "Needs the Earn vault" only where none is deployed.
- `share/CallPlacedCard.tsx` — the unit line precedes the boost caveat; `RangeTicketBody` — the headroom line is a
  caption, not a `<dl>` row (it was squeezing "You pay" onto two lines).
- **Measured, not fixed**: every wallet- or market-scoped read lands 10–17 s after a fresh load (the plate, the
  hero, the 2× chip, the earn labels) with one Chrome and nothing else running; the RPC answers in under a second
  and the main thread is busy for under half a second in total, so it is waiting, not working. context/49
  §Measured and left has the table and the candidates. Take it before the redesign pass.
- **For the user's eye**, unchanged: the Sensei ring over the Ticket's bottom-right corner at 1280×900; the plate's
  "0.00 · Get test tUSDC" for the first sixteen seconds (the reference's own); the 1× quote's "Cost 3.18 · Max loss
  4.99 · Buy UP for 4.99"; Set-stake parlays charging less than typed when odds lengthen.
- **Process**: six Explore agents diffed the ports against the reference source (their reports: context/50; the
  cheap exact-replication misses fixed in the same session, the structural ones listed for the user). A `git checkout
  main` hit the working tree under the live dev server at 10:48:20 — not the agents, which had finished and each deny
  running git; source unknown. Every agent prompt now forbids git state changes; check `git reflog -1` after a batch.
- **The source diffs (context/50)**, applied the same day in a second commit: the exact-replication misses that were
  cheap and unambiguous — the parlay's "Insufficient tUSDC" on an empty field (the reference reads "Build your
  parlay"), the 28px of headroom on `/parlay` and `/surface`, the three colour-family slips, the earn hero mounted
  92px too low (the shell's `:has(> .page-hero)` missed a grandchild; the hero now renders at once with the panel
  saying "loading the vault…"), ten earn rules that had lost their utilities' line-heights, the input's focus ring,
  the amount cleared before the tx landed, the surface tiles' breakpoint, its entrance animation and §01 desc, the
  countdown tile's face, the Private tile's vermilion, the chosen Private tab greying at 35% over the cap, the
  probing flash, the empty private quote block, the claims row naming its Window's close time and ticking, the
  leverage chips' false "not deployed" title on a capped reserve, the painted "Leverage" label, the share text's
  multiple, the chip's double ring, the 800 weights, the unrounded multiple. **Open, for the owner**: the shell's
  first-paint skeleton on `/parlay` and `/surface`, the dead space above the footer (a shell decision), the range
  mode's placed state (no Call), leverage and the funding gates vanishing in range mode, the private control's
  position, the depth chart's missing axes, the countdown's format and colours. All listed with status in context/50.
- **Left on chain by the review** (demo wallet): a 3-leg parlay in play (4h leg closes 14:00 UTC — settle and claim
  from `/parlay` when it lands), 50.13 shares in the maker vault, a 2× boost on a 5m Window that has since settled
  (settle from `/portfolio`).

Remember Somnia's gas schedule when deploying (context/41 §Live on Shannon) and the faucet's one wallet a
day. Deploy nothing without the owner's go.

## Stage 6 — research complete; build not started

The executable proposal is `docs/architecture/yosuku-source-led-migration/06-game-architecture.md`; the evidence,
library/provenance check, ABI composition proof and production boot timings are in
`context/52-games-research-2026-09-03.md`. It recommends folders under one `/games` layout; Practice → arcade →
Lucky → GameArena/ops → Duel → Moonshot A; direct `ws` in the long-lived ops service; no new browser game/state
library; atomic GameArena IOC + pick recording (ABI/fork composition is confirmed, GameArena gas/fork testing is
still required); one unified leaderboard with game/friends/season sections; and a separate prefunded
`MoonshotReserve` rather than changing the live Range contract. Owner decisions remain stake/card caps, deck policy,
Moonshot A, directional follows, season prizes, Free-Duel economics and whether the standing Shannon deploy go
covers the new custody contract. No Stage 6 product or contract code was written in the research pass.

The parallel production measurement found fast Next HTML (about 307 ms shell; 2–26 ms route TTFB) but 1.1–5.5 s
combined boot reads and roughly 20.8 s to useful Markets content in the sampled browser reload. The first fix is not
“more cache”: instrument, split the global boot by dependency, restore rejected query errors, correct loading/empty
states, then add allowlisted IndexedDB persistence and Portfolio critical/deferred tiers. See
`docs/architecture/performance-read-architecture-2026-09-03.md`. The owner-reported signed-in Portfolio retry storm
was not reproduced in the disconnected measurement and still needs a wallet-scoped trace.

Doc 04 is the authority; `reference/pips` and `reference/flicky` supply the mechanics; Yosuku stays the visual
authority. **Read context/51 §3 first**: the per-mode mapping onto DreamDEX (GameArena places each pick as an IOC
taker in the same transaction and settles on the venue's finalised outcome, so no keeper-fed prices; Lucky is a
seeded scan over the live Windows; Moonshot is a decision; the arcade pair ports as is into a dark island), the two
dependencies (no `SPONSOR_PRIVATE_KEY` yet; the matchmaker needs a long-lived WebSocket process beside the ops actors),
and the **five decisions the owner has not yet answered** (order, Moonshot A/B, stake tiers, deck rule, the deploy go).
Today `web/src/app/games/*` holds 14-line `CapabilityPending` placeholders; only `/games/range` is real (Stage 5).
The coin status as of 2026-09-03 is context/51 §1; the boot-latency findings and the handoff to the owner's other
agent are context/51 §2.

**Also open:** Fear/Greed on the ticker still waits on a provider. `/social` keeps its shell. Lifecycle alerts
have no reference source.

**Honesty constraints that keep applying** (doc 05 §No fake-data, doc 00 §No-substitution):
never an invented odd, balance, fill or payout; loading and unavailable are valid states; a
capability that is not connected keeps its control and says what is missing.

## Never write `var(--white)` on a surface that does not flip

Yosuku's light theme works by **remapping `--white` to `#141210`**, so every `text-white` it wrote
for dark mode becomes readable ink on cream. That is fine everywhere the surface flips with the
theme — and exactly backwards on a surface that does not.

The first cut of `reel.css` used `color: var(--white)` while the card stayed black in light mode
(the reference's dark island). Result: the question, the countdown and the live price rendered
near-black ink on a near-black card. The literal `rgba(255,255,255,…)` steps in the same file were
fine; only the token broke, which is why *half* the card went missing rather than all of it.
**None of typecheck, invariants, tests or build can catch this** — contrast is not a type error.

`/reels` is no longer an island: on the user's call (2026-09-01) the card follows the theme, using
Yosuku's own light-card values from `.creator-studio` (`part-01.css:131`). `reel-theme.css` holds
one ink triplet per theme and every step in `reel.css` is `rgb(var(--reel-ink-rgb) / <alpha>)`
carrying the reference's own alpha — so a future theme change is one triplet, not eleven literals.

Two things that deliberately do **not** take that token: `.reel-take` and `.reel-hint-pill` sit on
vermilion in both themes, so their ink is a literal `#fff`; `.reel-hint-arrow` sits on the *page*,
so it takes `var(--color-ink)`.

### The same rule for backgrounds and borders — and the gap that causes it

**Three components in a row have now hit this**, so treat it as expected, not as bad luck.
part-14.css remaps the `*-white` utilities and the dark chips for light mode, but its ladder has
**holes**, and anything that falls through renders white-on-cream or black-on-cream:

- `bg-white/20` — the ladder stops at `/10` (Tutorial step dots)
- `border-white/[0.12]`, `hover:bg-white/[0.06]` — arbitrary values not in its lists (Tutorial)
- `.mc-spark .strike-tick` — an `rgba(5,5,5,0.7)` chip with no light rule at all (§01 card)

The reference has each of these defects too; its own cards flip to cream the same way. Each was
fixed scoped, in the component's own CSS file, with values taken from part-14's own ladder rather
than picked by eye. **Before porting the next dark component, grep its `*-white` utilities and any
dark-ground chip against part-14.** Do not hand-edit `part-14.css` — regenerate the split instead.

The gray ramp is the second half of this. `text-gray-*` does not follow the light theme at all (the
recorded Tailwind-4 `@config` finding). The ledger reserved "evidence of unreadable text" as the
trigger to diverge, and the Tutorial produced it: body copy at **2.36:1** on cream. Remapped for
that card only. **A reviewed global pass over the other 811 `text-gray-*` utilities is still open.**

`PriceChart.client.tsx` reads its CSS vars off **its own container** rather than
`document.documentElement`, which is what lets any card hand the chart surface-appropriate ink.
Behaviour is unchanged everywhere else (verified: on `/markets` the container inherits the root's
value, and a clean load draws dark-on-cream).

## Known, not fixed

- The venue's `getOpenPositionsWithPnL` (the open-bets rows) clamps a sell beyond inventory to zero and
  drops the complement, so an open **short** shows as no position until the Window settles, when the
  projection books it correctly. Recorded in the ledger; the open rows keep the venue's numbers.
- `/api/leaderboard` takes ~35 s cold (a venue-wide scan of two days of fills, fees per market, router
  actions per wallet), then serves from a 3-minute in-memory cache. Fine for one process; a
  multi-instance deploy would recompute per instance until the deferred DB projection exists.

- `PriceChart.client.tsx` reads its colours at *mount*, so toggling the theme leaves the chart line
  in the old theme's ink until the next reload. Pre-existing, and unrelated to the container change
  above. Confirmed in the browser: a clean load is correct in both themes; only a live toggle is
  stale. Worth fixing when Stage 7 touches motion and performance.

## Open blockers (unchanged)

- **Native mobile — Blocked.** No native source exists. Responsive web/PWA is authoritative.
- **Masayume X account.** The handle is `@masayume_app` and the site `masayume.app` (given by the user
  2026-09-02; constants in `features/share/copy.ts`). Live posting and X OAuth linking stay Stage 4 and
  owner-authorized.
- **`/fund` — owner-only.** The reference's on-ramp needs a Paystack key and a funded treasury
  signer; funding is outside this authorization. `/claim` is X-OAuth recovery, Stage 4. Neither was
  reclassified; both keep their dependency state.
- Nothing may be pushed, deployed, published or funded without separate authorization.

## User feedback carried forward

- 2026-09-01: reviewed the running shell — "looks good", colours "getting there".
- 2026-09-01: flagged the reel card reading wrong in light mode. Correct on both counts — the text
  was invisible (the `--white` remap above), and the card's darkness was unwanted. **Decision: the
  reel card follows the theme.** Recorded as a deviation in the ledger. Verified in the browser at
  both themes after the change.
- 2026-09-02: reviewed `/dev/share` — ruled the share card the one surface we may redesign our own way,
  gave the X handle `@masayume_app` and the site `masayume.app`, asked for a QR to the app and an X-sized
  banner instead of the tall card. Said again that `/dev` is temporary. Asked where the cards live in the
  real app (answered above under Share cards). Feedback on the work so far: positive.
- **Not yet reviewed by the user:** `/stats`, `/download`, the boundary screens, the recovery toasts; the whole social and public-proof slice (the woven reel and the
  composer, The Call after a fill, the share button on receipts, the alert bell in the hero foot,
  `/news`, `/status`, `/docs`, `/how-it-works`, `/demo`, `/pitch`), and before it `/portfolio` (settled
  rows, §03 "Your record", the Trader Edge link), `/portfolio/edge`, `/leaderboard`, the toast, the
  Tutorial. Decisions flagged for the user in the ledger's log: the alert bell's placement; `/news`
  restored from the reference's history; `/docs` linking the GitHub repo; the pitch's drawn Somnia mark. Two placements are
  ours and flagged in the ledger's decision log for review: reputation/badges/equity/CSV mounted under
  `/portfolio` §03 (the reference computes them there but its pinned JSX never mounts them), and
  reputation without the reference's per-tier bonus/fee percentages (no contract pays either). The
  fill-projection surfaces were inspected in the browser at 1280 and 390 in both themes via
  `/dev/history` before commit. The Tutorial *was*
  inspected in the browser at both themes and at 390 before commit — a brand-new modal on a
  flipping surface is the exact bug class the four gates miss, and that check is what caught the
  two light-mode defects above. The user's `masayume.tutorialSeen` was left unset, so it opens on
  their next visit to `/markets`. The user asked not to be shown routine
  browser automation and said they will flag UI problems themselves — so those went in verified by
  typecheck, invariants, tests and build. Inspect the browser when they *do* flag something: this
  bug was invisible to all four gates.
