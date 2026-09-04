# Review round one — 2026-09-04

Twenty-first session. The owner walked the hosted app and spoke a review (the transcript is the session's
first message); the plan that came out of it is `~/.claude/plans/fuzzy-hatching-pretzel.md`, approved in
full. This note records what the review found, what was decided, and what shipped. The domain
`masayume.app` was bought and attached to Vercel on the same day; as of this note it still points at
Namecheap's default nameservers, so the public site waits on the owner's nameserver switch.

## 1. What the owner decided

- **The 45 deviation rows: keep**, all of them ("I actually approve of everything"). The ledger's markers
  now read `Approved (owner, 2026-09-04)`; `needs-user-review-2026-09-04.md` is marked decided and kept.
- **Moonshot: option A** — a saturated band on the live `RangeReserve`, no new contract (doc 06 §Moonshot).
- **Deal-headroom: rule D** — the arena's card-life floor holds for the whole pick window (context/54 §5).
- **Six routes removed**, decided on what each really is in the Yosuku source (read for the first time this
  session, not from the manifest's summary): `/social` is an internal marketing copy board (`noindex`,
  `content.json`); `/waitlist` a pre-launch founder waitlist; `/creators` the X creator guide; `/creator/studio`
  and `/creator/recover` a card studio earning a builder fee Event Contracts do not have (context/05 §9);
  `/studio` a passphrase-gated founder posting tool. The owner: "we remove it. When we start writing our
  documentation, these are things that will go into our docs for sure." That intent is a memory note.
- **One money rail.** The Add-money modal's "Buy with a card" and "Deposit from another chain" rows and the
  `/fund` page are gone; the modal is the mint and nothing else. The account menu's dead `/claims` link went too.
- **Your bets** takes Yosuku's own portfolio spec (§Section 4): one plate, `Open | History` tabs, eight rows
  a page with a pager — chosen over a headed table.

## 2. What shipped (each its own commit, gate-green)

| Commit | What |
|---|---|
| `424386d` | The Add-money modal has one rail; `/fund`, the card and bridge rows, the dead `/claims` link removed; `AccountGate` imports `OPEN_FUNDS_EVENT` instead of redeclaring it |
| `bbfcff2` | The six routes removed; Build loses Create, Explore's Community folds into Proof; the drawer holds 26 |
| `9c68f62` | The portfolio's Add money opens the modal in place (`openFunds()`), not `/markets` |
| `8032136` | The Room remembers its join for the token's hour (`room-session.ts`: memory + `localStorage`, expiry beside it; read back on mount; cleared on 401) |
| `572dac2` | `TUsdcMark` — the collateral's own disc on the money pill and the mint button |
| `ea91aaa` | The Ticket's chips say "Leverage" beside them; enabled boosts carry a one-line title |
| `95e0551` | Game settings are Flicky's centred menu plate (`.du-modal`, the two sliders in one well, 80dvh cap), not a full-viewport sheet |
| `511f4b0` | Rule D: `dealHeadroomSec` adds `pickWindowSec` (390s → 570s); `DECK_POLICY_VERSION` 4 |
| `d8200cd` | The ledger: 45 rows approved, nine new decision rows |
| `cbbdfbf` | The hub's ladder plate uses the season line when a season exists (it said "no season" under the Season 1 banner) |
| `6729cca` | Your bets: `BetsPanel` with tabs, the `.bets-plate` frame, `usePager` + `Pager` (also under `/games/history`); vault and leverage lists became item hooks; rows wrap to two lines under 640px |

**Not changed, on purpose:** the "Between rounds" lane the owner saw is the reference's own cadence
placeholder (`useLanes.ts`, `part-06.css`) — a pinned cadence with no live Window — not the bet button and
not settlement.

## 3. Verified, and how

- The gate on every commit (`pnpm typecheck && pnpm invariants && pnpm test`, 310 tests), `pnpm build` before
  the deploy.
- chrome-devtools at 390px: the settings plate (centred, scrolling inside itself), the trimmed navigation drawer.
- The scripted-wallet driver (context/47's recipe, kept in the scratchpad) with the demo wallet at 390px: the
  tUSDC mark on the pill and the mint button; **Add money opens the modal on `/portfolio` with the URL
  unchanged**; the `Open | History` tabs render. The first run hit a Somnia RPC outage (both public endpoints
  502 for ~40 minutes; every ops actor logged "head unreadable"), so the rows and the Room were re-run once the
  chain answered — see §5.

## 4. Deployed

- **Ops on Fly** (`fly deploy --config services/ops/fly.toml --dockerfile services/ops/Dockerfile .` from the
  root — the documented invocation; from inside `services/ops` it fails): rule D is live; `/health` answers.
- **Web on Vercel production** (`vercel deploy --prod --yes` from the root, where `.vercel/project.json` lives).
- `main` pushed to the private remote.
- **The X rail's own side is ready:** a new role key `x-executor` (`~/.config/masayume/x-executor.env`,
  `0xFf3e…02E5`, unfunded until the first live mention) set as `X_EXECUTOR_ADDRESS` on Vercel (production +
  preview) and staged on Fly with `X_EXECUTOR_PRIVATE_KEY`; `X_SESSION_SECRET` set on Vercel. What remains is
  the owner's: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI` (web) and `X_BEARER_TOKEN`, `X_ACCOUNT_ID`,
  optionally `X_USER_ACCESS_TOKEN` + `X_POSTING_ENABLED` (Fly). X's API is pay-per-use for new developers
  (~$0.005 per post read); the relay's `since_id` polling reads only new mentions.

## 5. The games and the agent — built in parallel

Four builders ran in their own worktrees (Lucky, the arcade pair, Moonshot A, the AI-agent preset), each on
the planners' file-level designs (`~/.claude/plans/fuzzy-hatching-pretzel-agent-aplan-games-*.md` and
`…-aplan-agents-*.md`). Two things interrupted them and cost nothing: a network drop (every builder cut
mid-step, resumed from its intact worktree) and the account's usage limit (the same, once it lifted).

### Moonshot A — merged (`fb426e1`), live-previewed

Four commits (`c9ef31d` the solver + golden vectors, `b2bfcad` the chain's quote, `5991e7a` the page,
`b47f994` the rung caps and the expiry's budget). `packages/core/src/range/moonshot.ts` solves the strike in
closed form (`z_K = μ + Φ⁻¹(1−p)` for LONG, `μ + Φ⁻¹(p)` for SHORT) and nudges it a cent at a time until
`rungHolds` — `floorStake × M ≤ payout`, a base unit stricter than `probRaw ≤ target` at some rungs and
provably enough at every whole-unit payout. The band is LONG `[K, 4×opening]`, SHORT `[1, K]`; a round's
kind is read back from its shape (`classifyRangeBand`), nothing stored. `moonshot.vectors.py` mirrors the
contract's packed CDF independently; `MoonshotVectors.t.sol` pins `RangeMath` to the 24 rows; a 400-case
sweep keeps every rung × direction × horizon × centre inside the reserve's bounds. The page is the Range
frame with Pips' ten-rung aim ladder, the ticket the contract's own quote, the product caps (25× ≤ 100, 10×
≤ 200 tUSDC payout) and "this expiry can still lock N of 1,000".

**Live, read-only** (`pnpm --filter @masayume/scripts spike:moonshot`): on ETH's 4h Window (`79585`, ~50 min
left) a 5× LONG solved to $2,463.86, and the reserve's own `previewOpen` returned `probRaw 178,391 ≤ 178,571`
and pays **5.005×** — the solver and the contract agree. BTC's 4h Window was refused `WindowDecided(…, 984500)`:
the book already prices it at 98%, and the reserve will not open a band on a decided Window — the honest
refusal the page shows for such a Window. The connected page at 390/320 in both themes: the Window plate,
Pips' ten-rung ladder, the ticket refusing BTC's decided 4h honestly ("Too close to certain or impossible").
Not yet done: a live 1 tUSDC round from `/games/moonshot`.

### The arcade pair — merged (`2b89fd6`)

Four commits (`1a979ae` engines, `fa7773b` canvases, `3d56359` the score API + boards, `9fc094f` cues,
haptics, reduced motion). `packages/core/src/games/arcade/`: a 640×360 field at 60 Hz, xorshift32 from an
8-hex seed, `ride.ts` and `flap.ts` written without `Math.sin/exp/pow` so browser and server agree bit for
bit, compact traces with `envelopeCheck`, `replayRide`/`replayFlap`. `POST /api/games/arcade/score` replays
the trace and **refuses any score the replay does not reproduce** (a tampered claim over an honest trace
fails); runs over the 30-minute replay budget are refused outright rather than accepted as
"envelope-checked" — an envelope is a bound, and a ten-minute ride's bound would top every board. Scores are
"arcade score · server-checked · not on-chain"; posting rides the duel room token, so a deployment with an
arena but no `GAME_ROOM_PUBLIC_URL` plays but cannot post, and says so. The calm ramp is a recorded, tagged
option that reduced motion pre-ticks. The HOW TO no longer claims "the live price line" or "verified against
the tape". The builder's browser pass: both games at 390/320 in both themes, the over plate on a 160px screen
at 320, flat frame time. Not yet done here: a posted score against the database and the tampered-score 422.

### The AI-agent preset — merged (`1e3f189`)

Six commits (`a3d1c98` the spec, `718b333` `packages/brain`, `081ccde` `strategy_decisions`, `4259b47` the
runner's agent scan, `f46e439` the API + the dry read, `55c5e70` the studio and the card). The design held:
`AgentSpec { preset: "agent", persona ≤ 600, posture, cadences }` beside the momentum encoding (byte-identical,
tested); `gateAgentVerdict` in the fixed order with the posture table; `packages/brain` holds the model
resolver (Sensei re-exports it) and `readAgentVerdict` — `generateObject`, low reasoning, one retry, a 20 s
deadline the read races itself rather than trusting the abort signal alone, fail-closed to hold with the
failure named; one read per Window a quarter of the way in, under `AGENT_MAX_CALLS_PER_HOUR` (60); every read
a row in `strategy_decisions`, shown on the card as "◈ agent memory" and in the drawer. `POST
/api/strategies/preview` is the studio's **Dry read** (1 per 10 s per IP, 60/h). No key → the heartbeat names
the variable and holds; never a fabricated decision. 46 new tests. Two deviations worth knowing: the card's
instinct line is a one-liner (the two-sentence `describeSpec` made a twelve-line column at 390px; it stays in
the studio, the drawer and the metadata), and `lostTodayBase` is the worst per-subscriber loss today, since the
daily cap is per subscriber. Ops needs `AI_MODEL` + a key on Fly and the agent's id in `STRATEGY_IDS`; the
Dockerfile copies `packages/brain`. Owner note from the builder: the strategies studio and card captions have
been dark-styled since Stage 4 and are near-invisible in the light theme — a pre-existing surface, not touched.

### Lucky — merged (`e863a42`)

Five commits (`9a52f60` policy, `532f5c8` table, `2031de2` the server's commit/reveal/scan + five routes,
`469cb20` the reels and the deal card, `40fa815` verdicts, history, streak). The server seed is persisted at
commit (a Vercel route keeps nothing between requests; the commitment the browser saw is what binds it),
revealed against the client seed through the pinned HMAC (`node:crypto` and WebCrypto agree on a golden
digest), mapped to asset/side/rung, then the eligibility scan quotes both sides at the stake and the chooser
takes the fillable quote closest to `1/M`; the deal card carries the proof and a browser-side "check it", the
live quote, and one tap through `usePlaceBet`. A failed venue read is `venue-unreadable`, not `no-window` — a
defect the read-only spike caught. Void is neither win nor loss for streaks; cashed-out is unverified. The
scan's socket RPC reads could not be exercised tonight (the outage); not yet done: a live spin with the demo
wallet, the phone-width pass.

Merges were textual only: `catalog.ts` (each mode's row), `schema-games.ts` (the arcade's columns beside
Lucky's table). Gate on the merged main: 54 files, 809 tests, invariants clean; `pnpm build` green.

## 6. Shipped, and what the venue would not let me verify tonight

- `main` pushed; **web on Vercel production** (`masayume-9qtkdwf17…`, aliased to `masayume.app` and the
  vercel.app URL); **ops on Fly** rebuilt with `packages/brain` and the staged X executor key applied. The
  hub lists all seven modes LIVE; `/games/lucky`, `/games/line-rider`, `/games/candle-hop`, `/games/moonshot`,
  `/strategies` and `/games/history` were looked at connected at 390/320 in both themes.
- **The maker was out of gas.** Its STT had burned down to 0.558 under its 0.576 write envelope, so it refused
  every quote and settle since the outage — the venue's thin books were ours. It got 6 STT from the deployer
  (`0xE0fE…ae9d` now 6.55 STT); it burns several STT a day on settle cranks, so this recurs.
- **The venue itself is degraded after the RPC outage:** at 19:23 UTC the live lanes held only the 1d and 4h
  Windows plus two 1h Windows still `pendingOpeningPrint` twenty minutes in; no 5m or 15m Windows existed at
  all. The maker's cadences are 5m/15m/1h, so `quoted 0` is honest; Lucky cannot deal; a Room needs a position
  a ticket cannot open ("Waiting for the opening print", "No liquidity at this size"). Not verified live, for
  that reason: the Room's remembered join (unit-tested instead), a Lucky spin, an arcade score posted against
  the database, a Moonshot round, an agent dry run with a key. The scripted-wallet driver in the scratchpad
  has scenarios ready for each (`SCENARIO=room|lucky|pages`).
- The RPC outages also showed a rough edge worth a later slice: the SDK's websocket reconnects print raw
  `ErrorEvent` objects into the ops log, drowning the actors' own lines.

## 6b. The venue came back, and two of the five live checks passed

Around 21:00 UTC the 1h Windows were trading again and the maker (refuelled) quoted them (`quoted 2`).
With the scripted demo wallet at 390px:

- **Lucky, live.** Stake 1 → SPIN → dealt BTC · DOWN · 2× (commitment, both seeds, nonce 1, policy v1,
  three candidate Windows hashed; the browser's own check agreed) → one tap → the approval and the order
  (`0x9b9e…21f0`) → "Sent, no receipt yet" → the history row reconciled from the wallet's own fills:
  **2.036 contracts, 0.908 tUSDC charged, `pending`** until the Window closes.
- **The Room's remembered join, live.** A real UP call on BTC 1h (0.90 tUSDC, `Buy UP for 0.99`) unlocked the
  Room; **one** `personal_sign` to join; the sheet closed and reopened into the thread with no prompt and no
  join button; a full page reload and reopen — still joined, still one signature in the wallet's log.

Still pending live: a posted arcade score, a Moonshot round, an agent trade (no agent strategy is published yet).

## 7. The domain went live, and the X rail is one portal step from working

- **`masayume.app` resolves to Vercel** (the owner switched the nameservers; `ns1/ns2.vercel-dns.com`).
  `https://masayume.app/api/status` answers healthy, `/games` renders — the site is public.
- **The room's own name:** `room.masayume.app` is a CNAME in Vercel DNS to `masayume-ops.fly.dev`, and Fly has
  the certificate request (`fly certs add`); once issued, `GAME_ROOM_PUBLIC_URL` becomes
  `wss://room.masayume.app` on Vercel and Fly and the web is redeployed. Fly's own recommendation is A/AAAA
  records to its anycast IPs; the CNAME is being validated first.
- **The owner's X credentials** (the developer portal's API key + secret, OAuth 2.0 client id + secret, the
  app-only bearer, and the account's OAuth 1.0a access token + secret) are set: the client on Vercel
  (`X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI=https://masayume.app/api/x/callback`), the rest on Fly
  (`X_BEARER_TOKEN`, `X_ACCOUNT_ID=1607719987317178368`, `X_POSTING_ENABLED=1`, `X_API_KEY`, `X_API_KEY_SECRET`,
  `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`). The relay only spoke an OAuth 2.0 user token for replies, which
  needs an authorization-code flow with `tweet.write`; `725c477` adds OAuth 1.0a signing (RFC 5849, the guide's
  worked example as the test vector), and the relay's boot line now reads `posting on (oauth1)`.
- **The blocker is on X's side:** every v2 call — the mentions timeline, even a public user lookup — answers
  `403 client-not-enrolled`: "you must use keys and tokens from a developer App that is attached to a
  Project". The owner must create a Project in the developer portal and attach the app (or create the app
  inside a project and re-issue the keys), set the app's permissions to Read and Write, and register
  `https://masayume.app/api/x/callback` as the OAuth 2.0 callback with `https://masayume.app` as the website.
  Nothing on our side changes when that is done; the relay's next poll simply succeeds.
- **The navigation panels are as wide as their sections** (`1f15014`). The owner, after the removals: "why is
  the rectangle that big now?" — Build, Games and Explore had fixed widths and column counts (44/52/64rem,
  two/three/four columns) that the removed sections used to fill. The component now sets `--nav-sections`
  and the panel is one 17rem column per section: Build is a single column, Explore three (Trade, Proof,
  Learn), Games three. Explore's height is its Learn column's seven destinations.
- `room.masayume.app` is issued and answering (`/health` 200 over the domain); `GAME_ROOM_PUBLIC_URL` is
  `wss://room.masayume.app` on Vercel and Fly. Vercel DNS carries Fly's A/AAAA records and the ACME CNAME
  (the first CNAME to `masayume-ops.fly.dev` was not what Fly validates against).
- **OpenAI is the AI provider.** The owner asked for OpenAI and to look in the local env: `~/.openai/credentials`
  held a revoked project key (401 "Incorrect API key"); the one in `~/dev/hackathon/keeperhub-copilot/.env.local`
  answers 200 and lists `gpt-5.4`. It is `OPENAI_API_KEY` + `AI_MODEL=openai/gpt-5.4` on Vercel (Sensei now
  reports `openai/gpt-5.4 via direct` on production) and on Fly (the agent runner); `~/.openai/credentials`
  now holds the working key.
- **The house runner existed only in the studio's copy.** Fly had no `RUNNER_PRIVATE_KEY` and Vercel no
  `STRATEGY_RUNNER_ADDRESS`, so "Let Masayume run it" named nothing and the runner idled on an empty
  `STRATEGY_IDS`. A `strategy-runner` role key (`0xfE22…AA52`, 3 STT) is now on Fly, its address on Vercel and
  in `web/.env.local`, and `846ad24` makes the runner **discover its strategies from the registry** — every
  active strategy naming its key, re-read each cycle — so a creator's launch runs without anyone editing a
  secret. The static list remains as an override.
