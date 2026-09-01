# Direction & Scope Proposal (working doc — decisions pending with the user)

> **SUPERSEDED DIRECTION — historical research only.** The user selected a source-led full Yosuku migration with additive games. The MVP/stretch/“our way” decisions below no longer govern product, UX, or architecture. Read `docs/architecture/yosuku-source-led-migration/README.md` first.

> My recommendation given: judging weights (Tech 25 / Innovation 20 / UX 20 / Impact 20 / Demo 15), ~9 days to the 8 Sep deadline, solo builder + agents, and the Yosuku direction the user set. Everything here is arguable — `20-feature-map…` holds the full menu.

## Thesis (the pitch in three sentences)
DreamDEX Event Contracts are an honest, zero-fee, oracle-settled primitive with **no consumer layer**: the official app doesn't show volume, history, or social anything, and every sharp edge (claiming, expiry, recycled pools) is exposed to users. We build the consumer + agent layer — a fast, gasless, TikTok-feed prediction app where every settlement carries an on-chain audit receipt, an AI copilot gives a quantitative read (and tells you when *not* to bet), and bounded agents can trade for you but structurally cannot steal. "A primitive is not a product" — same play Yosuku ran, on a venue where it's even truer.

## Recommended MVP (must ship — maps to Tier 1+2 of the feature map)
1. **Markets loop**: cadence rail (60s/5m/10m testnet windows!), hero chart, stake-first UP/DOWN ticket (`quoteBinaryStake` → IOC), countdown → verdict moment, claim-all plate. SDK client tier + live watches; wagmi wallet via `setSigner`.
2. **Reels feed**: vertical snap feed of live windows + takes; tap-to-bet inline.
3. **Portfolio**: one-number plate, open positions w/ live PnL (`getOpenPositionsWithPnL`), history from finalized markets, FIFO PnL engine, CSV export.
4. **Provably-fair layer**: every settled round links Somnia explorer tx + **oracle resolution graph deep-link**; `/stats` page with un-fakeable on-chain metrics.
5. **Sensei-style copilot**: bot-kit fair-value model (vol + z-score + tanh) computed live + LLM explanation + the Brake (anti-tilt). This is the Innovation+UX double-scorer.
6. **Leaderboard + badges** (retention story) and the landing page.

## Second-week stretch (pick at most TWO — this is the main open decision)
- **A. Agent strategies (EventVault + 1–2 house runners wrapping ec-maker/oracle-follow)** — strongest tech-depth story ("agents-first venue, agents-first app"), reuses bot-kit; enables copy-trade language. Cost: one Solidity contract + runner service.
- **B. Streak parlays (ParlayReserve)** — most legible "new market structure" innovation; port is well-specified; improved vs Yosuku by reading CLOB mids. Cost: one Solidity contract + keeper-less resolution.
- **C. Trade-from-Telegram** (instead of X) — distribution demo inside the hackathon's own TG community; bounded-executor custody story without OAuth pain.
- **D. Session-key tap-trading** (`viem-session-account`) — CEX-feel, low-ish cost, big UX demo moment.
- My lean: **A + D** (agents + frictionless trading = the venue's own "agents-first" thesis), with B if time allows. C only if we want a growth stunt in the video.

## Architecture (clean-fork principles, per the user's "do it our way")
- **Next.js App Router monorepo**: `app/` (routes) · `src/core/` (pure engines: sizing, PnL, leaderboard, parlay math — ported from yosuku lib, tested) · `src/markets/` (the ONE chain adapter: markets-sdk client+trader wrapped behind the `MarketsProvider`/`Submitter` interface from `12-…`) · `src/server/` (route handlers: quotes cache, leaderboard aggregation, sensei, relayer) · `contracts/` (Foundry: EventVault, ParlayReserve, Waitlist) · `services/runner/` (strategy runner on ec-core patterns).
- **No database for chain truth** (Yosuku's proven pattern); small KV/Postgres only for takes/chat/sensei-memory.
- Pin `@somnia-chain/markets-sdk@0.28.1` exactly (indexer schema drift is real). `VENUE_ID` in env with the empty-scope explainer from ec-core.
- Zero-env judge quickstart; `/dev` fixture pages; DRY_RUN-style flags on the runner.

## Naming/branding
TBD with user. (Repo is `sommina-events`; product name should NOT impersonate DreamDEX/Somnia — it's "built on" them.)

## Decisions (locked 2026-08-31, research-grounded via Context7; user may veto any)
1. **Scope: A + B + C + D — all in, on merit** (user directive 2026-08-31: deadline is never a scoping argument; cuts must be justified on merit alone). A: agent strategies (EventVault + house runners). B: **streak parlays — full scope** (real product hook, well-specified port, and we improve on yosuku by reading leg probabilities from the CLOB mid). C: **social rail via Telegram bot** (bounded-executor "bet from a chat message; the agent can't drain you" — the hackathon's own community lives on Telegram, and TG needs no OAuth review; X rail can follow the same executor later). D: session-key tap-trading. Still cut, on merit not schedule: leverage/margin desk (redundant — EC's capped-risk design is the selling point), TEE attestation (replaced by EIP-712 per-action sigs; a TEE proves little in a testnet judging context), full privacy (yosuku itself admits it's only link-reduction).
2. **Wallet: wagmi v2 + RainbowKit** with a custom `somniaShannon` chain (markets-sdk ships the chain def; RainbowKit docs confirm first-class custom-chain support via `getDefaultConfig({chains:[…]})` + `Chain` type with iconUrl). `useWalletClient` → `exchange.setSigner({ walletClient })` is the exact seam the SDK documents. **Privy rejected for this build**: Context7 docs showed a murky mix of legacy/new APIs for custom-chain embedded wallets, and it needs app registration with origin-locked keys — the exact class of setup that broke yosuku's judge-quickstart on localhost (their Enoki keys were origin-locked). The "no seed phrase" feel comes instead from: in-app faucet, gasless claims (`signRedeemAuth`/`redeemFor`), session-key tap-trading (D), and one-click "Add Somnia" network button. Adapter stays thin so Privy can be added post-hackathon.
3. **Copilot LLM: Vercel AI SDK (`ai` v6) + AI Gateway**, model string `anthropic/claude-opus-5` in an env var (swappable one-liner). Streaming chat route (`streamText` + `useChat`), key server-side only. Quant layer (fair-value model from `03-…`) computes the numbers; the LLM explains them and enforces the Brake.
4. **Product name: "Masayume" (正夢)** — Japanese for *a dream that comes true* (a prophetic dream that became reality). Triple-fit: Somnia = dreams (Latin *somnium*); a prediction market = calling the future; a winning bet = your dream literally came true. Same naming school as Yosuku (予測 *yosoku* = prediction) without imitating it. Built-in product vocabulary: wins stamp **正夢 masayume** ("it came true"), losses stamp **逆夢 sakayume** (a dream that didn't) — receipt/share-card copy writes itself. Copilot named **"Baku" (獏)** — the Japanese dream-eating spirit that devours nightmares: the agent that eats your bad bets (the Brake), structurally on your side. Verified 2026-08-31: no crypto/web3 project named Masayume (web search), npm `masayume` free, `sakayume.xyz`/`mikuji.xyz` unregistered (masayume.xyz resolves to a Shopify IP — likely parked shop; use .app/.market/.io or vercel.app for the hackathon). Dark-first, single accent color, direction colors reserved for P&L.
5. **SDK/docs feedback report: yes** — we already have material (e.g. binary rows carry no tickSize/lotSize for `amountToPrecision`, indexer schema drift vs SDK floor, receipt-on-`info` trap, venue-id churn).
6. **Social loop**: in-app takes feed + share cards at launch; no X/TG rail in MVP.

## Build sequence (ordering for de-risking, NOT a cut list — nothing falls off if a phase runs long)
1. Scaffold, chain adapter, markets loop end-to-end on testnet (bet → settle → claim) — the demo-critical path first.
2. Reels, portfolio, receipts/stats, leaderboard.
3. Sage copilot (quant model + LLM + Brake).
4. Contracts: EventVault, ParlayReserve, Waitlist — tested (Foundry) + reviewed.
5. Strategy runners + session-key tap-trading + Telegram executor rail.
6. Polish, honest-limitations README, zero-env check, seed-liquidity script (quote both sides w/ zero inventory).
7. Submission artifacts: 2–3 min demo video, deck, SDK feedback report.
