# Yosuku — Reference Product Overview

> Source: `reference/yosuku/README.md` + `.env.example` + repo structure (clone of https://github.com/Cybire1/yosuku, latest commit `3c56ef5`). Live at https://yosuku.xyz. Built for **Sui Overflow 2026, DeepBook Predict track**. Deep dives in `11–15-yosuku-*.md`.

## One-liner
"The consumer layer for DeepBook Predict" — predict directly from X, with leverage, private trading, and agent strategies; web + native iOS/Android (Expo). Tagline mechanism: *tweet "@yosuku BTC up 3x" and an agent opens that exact position on-chain from a vault only you can withdraw from.*

## Positioning (the winning framing — reuse this)
> "A primitive is not a product." DeepBook Predict settles honestly (oracle-driven), but out of the box has **no consumer app, no SDK, no safe way for an agent to trade it**. Yosuku is the layer that makes it usable **by people, by developers, and by agents** — without reinventing the market.

This maps 1:1 to our situation: DreamDEX Event Contracts = the honest primitive (on-chain CLOB + oracle settlement, zero fees); the official app is minimal (doesn't even show volume). Same gap, same play.

## Feature inventory (from README; verified areas in repo)
| Area | Feature | Where |
|---|---|---|
| Consumer core | One-tap UP/DOWN betting, gasless (sponsored), no seed phrase (zkLogin/Enoki) | `/markets`, `/reels`, Onara worker |
| Feed | **TikTok-style live feed** — full-screen market per card, price draws in, countdown, swipe next, tap UP/DOWN | `/reels` |
| Social | **Post a take**: drag a strike line, scrub horizon, slide to confirm — "your prediction is the post" | TakeComposer |
| Social | Predict-from-X: tweet → relay → bounded executor opens position from user-owned vault; **no-divert enforced in Move** (owner hard-wired, withdraw owner-gated) | claim/* routes, social_vault |
| Agents | **Agent strategies marketplace**: subscribe to a creator's agent with capped budget, zero withdrawal control | `/strategies`, strategy_market |
| Agents | **Bellkeeper**: autonomous agent, decisions ed25519-signed inside AWS Nitro enclave, attestation verified on-chain before vault releases funds | attestation_verifier |
| Agents | **Sensei**: in-app AI trading assistant (DeepSeek) — a read (UP/DOWN/sit-out), "the Brake" anti-tilt behaviour, MemWal memory | `/api/sensei`, SenseiDock |
| Markets | **Streak parlays** — stack 2–3 bells into one AND-ticket, odds multiply | `/parlay`, parlay624 |
| Money | **Trading Balance**: one prefunded vault routes normal/private/leverage/agentic trades; withdraw anytime, owner-only | trading_vault |
| Money | Leverage desk with real liquidations; private (incognito) bets; cross-chain deposit (CCTP), BTC onramp | leverage-pkg, private-bet-executor |
| Devs | First TS SDK + first MCP server for the primitive (`@yosuku/deepbook-predict`, `-mcp`) — 515 downloads | npm |
| Trust | `/stats` live on-chain traction page — every row links to explorer; "verifiable, not self-reported" (169 wallets, 928 gas-free actions) | `/stats` |
| Retention | Leaderboard, badges/reputation, price alerts, share cards, comments/rooms, creator studio + earnings, waitlist | various |

## How they used the sponsor stack (pattern to copy for judging)
A table mapping *each sponsor primitive → how the product composes it* ("Composed, not bolted on"): DeepBook Predict (pricing parity ~half-cent vs on-chain quote), Move custody moat, Nautilus TEE, Walrus+Seal memory, sponsored gas. Our equivalent: markets-sdk (all three tiers + watches), ERC-6909, OracleHub deep-links, Somnia reactivity, session keys/operators, EIP-7702 batching.

## "Proven on-chain" section (pattern to copy)
Every claim in the README links a real tx: the no-divert proof (funds returned to user: 0.953 to user / 0 to agent), attested agent trade, parlay open→claim, liquidations. Judges can click. **We should build the same receipts page from day one** (Somnia explorer + oracle explorer links).

## Honest-limitations section (pattern to copy)
They openly list: testnet-only, BTC-only, single-box listener, enclave not yet the live signer, privacy is link-reduction, ~2% spread shown transparently. Credibility play worth replicating.

## Tech stack
Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · framer-motion + GSAP + Lenis · three.js (landing orb) · TanStack Query · zod · recharts · @mysten/* (dapp-kit, enoki, seal, suins, sui-stack-messaging) · Move contracts (10 packages) · Cloudflare Workers (Onara gas station, connect worker) · vitest. Deployed on Vercel. `.env.example` is written so judges can run with ZERO env (hardcoded fallbacks) — **do the same**.

## Repo shape
```
app/            ~40 routes (see 11-)      contracts/   10 Move packages (see 14-)
components/     ~100 components (see 13-) infra/onara/ gas-sponsorship policies
lib/            ~95 modules (see 12-)     services/    private-bet-executor
app/api/        ~36 route handlers (15-)  scripts/     keepers + prove-* scripts
```
Also root: `AI_STRATEGY_MARKETPLACE_PLAN.md` (verification ladder for strategy creators: Draft→Paper→Verified→Live→Established; decision-envelope model contract; "win rate alone is not a quality metric"), `SENSEI_USE_CASE.md` (the assistant's honesty spine + Brake), `PORTFOLIO_UX_SPEC.md` (27KB portfolio spec).

## What the user wants from this reference
Fork the *feature set and product thinking*, not the code wholesale: rebuild for DreamDEX Event Contracts on Somnia with a cleaner architecture ("we'll do it our way"), keep the flows (feed → tap → settle → claim; social takes; agent strategies; assistant), add our own features on top. Chain layer swaps entirely (Sui/Move → EVM/viem/markets-sdk); most product/UX logic ports.
