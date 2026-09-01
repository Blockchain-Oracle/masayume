---
title: Target architecture
status: authoritative
architecture: source-led product shell with capability adapters
---

# Target architecture

## Architecture decision

Use a **source-led Yosuku shell with a strangler migration of chain-dependent behavior**.

Three approaches were considered:

1. A wholesale Yosuku fork would deliver fast visual fidelity but retain extensive Sui, Move, Enoki, DeepBook, and service coupling while discarding useful Masayume core work.
2. A clean rebuild from screenshots/specifications would be tidy but would repeat the omission and design-drift failure that caused this correction.
3. A source-led shell preserves exact product behavior while replacing integrations behind explicit Masayume capability boundaries. This is adopted.

“Strangler” here means replacing one underlying Sui capability at a time while the Yosuku product surface remains the reference. It does not mean gradually reducing the reference feature set.

## System view

```text
Yosuku source-led Next.js product shell
  routes · layouts · components · tokens · fonts · assets · motion · states
                                  │
                                  ▼
Masayume application/use-case layer
  identity · markets · portfolio · social · strategies · parlays · games
                                  │
                ┌─────────────────┼──────────────────┐
                ▼                 ▼                  ▼
      DreamDEX chain port   Masayume contracts   Service/data ports
      reads + user orders   vaults + games       X · DB · realtime · AI
                │                 │                  │
                └─────────────────┼──────────────────┘
                                  ▼
                         Somnia source of truth
```

## Keep versus replace

### Keep and extend

- `packages/core` as the pure domain and use-case layer.
- integer/base-unit money and explicit decimal metadata;
- typed `Reading<T>` freshness rather than silently converting failed reads to zero;
- market identity keyed by `marketId`, not recycled pool address alone;
- on-chain market-status checks before writes;
- expiry/headroom, price, allowance, balance, and risk gates;
- transaction journals, receipt inspection, fill-based accounting, and reconciliation;
- one public error vocabulary across UI, APIs, workers, and contracts;
- Postgres only for off-chain product state and projections;
- single-writer operational actors for each signing authority;
- owner-controlled delegation with bounded grants.

### Replace or correct

- Replace the current Masayume web shell and theme with source-led Yosuku routes, components, global styles, fonts, assets, and motion.
- Replace the process-wide mutable SDK signer with isolated signing sessions.
- Expand the current markets-only port into a composed capability boundary while keeping all chain I/O behind it.
- Replace BMAD scope cuts and route omissions with the complete parity manifest.
- Replace generic or hardcoded product data with real DreamDEX, chain, database, or external-service reads.
- Replace Sui/Move/DeepBook-specific semantics with truthful Somnia/EVM/DreamDEX implementations.

## Target repository shape

Keep the current repository rather than making Yosuku a second runtime application.

```text
web/
  src/app/                         # source-led Yosuku route tree + game routes
  src/components/                  # source-led components; preserve local grouping
  src/features/
    identity/ markets/ reels/ portfolio/ social/
    strategies/ parlays/ creators/ games/
  src/styles/                      # Yosuku global design source and route modules
  src/providers/                   # wallet, query, theme, realtime coordinators
  src/server/                      # thin route handlers; no chain-domain duplication

packages/core/
  src/identity/ markets/ portfolio/ social/
  src/strategies/ parlays/ games/ money/
  src/reading/ errors/ time/ units/

packages/markets/
  src/runtime/                     # shared read-only DreamDEX runtime
  src/sessions/                    # isolated signer/submitter sessions
  src/capabilities/                # composed chain-facing implementations
  src/adapters/dreamdex/
  src/adapters/masayume-contracts/

packages/db/
  src/schema/ repositories/ projections/

contracts/
  src/EventVault.sol
  src/StrategyRegistry.sol
  src/ParlayReserve.sol
  src/RangeReserve.sol
  src/MarketMakerVault.sol
  src/GameArena.sol
  src/Waitlist.sol
  script/ deployments/

services/ops/
  src/actors/claims/
  src/actors/strategy-runner/
  src/actors/x-relay/
  src/actors/market-maker/
  src/actors/game-matchmaker/
  src/actors/game-deckmaster/
  src/actors/game-settler/
  src/actors/sponsor/
```

Do not extract a new generic UI package during the migration unless a concrete cross-runtime consumer requires one. Keeping source-led components close to their routes reduces visual drift and unnecessary abstraction.

## Dependency rules

1. `packages/core` imports no React, Next.js, wallet, database, network, SDK, or contract runtime.
2. UI components consume view models and use cases, not `@somnia-chain/markets-sdk` directly.
3. Server handlers and operations actors call the same capability boundary as the web application.
4. `packages/markets` is the only workspace package that owns DreamDEX/Somnia market reads and writes.
5. Contract ABIs and deployed addresses are generated once and consumed through `packages/markets`.
6. `packages/db` cannot redefine chain truth. It stores off-chain entities and rebuildable projections.
7. Long-running signing actors do not run inside ordinary serverless route handlers.

## Web application architecture

### Source-led shell

Port from the pinned Yosuku source rather than rebuilding by description:

- `app/layout.tsx`, global CSS, fonts, metadata, theme pre-paint script, error boundary, and primary providers;
- current route files and their component dependency trees;
- responsive navigation, route transitions, dark islands, ticker, grain, smooth scrolling, reduced-motion logic, and component styles;
- first-run and returning-session behavior;
- copy hierarchy, changing only identity and protocol facts.

Before adapting a route, record its source path, dependencies, visible states, responsive branches, and data contract in the parity ledger.

### Server and client boundaries

- Keep static/editorial route shells server-rendered where the source permits.
- Use client components only for wallet state, live subscriptions, interaction, motion, and browser APIs.
- Do not instantiate WalletClient or signing sessions during server rendering.
- Preserve layout-mounted providers so route transitions do not destroy wallet, theme, game-session, or query state.
- Keep one query/cache identity for a market or account across routes; do not create separate representations for Markets, Reels, Portfolio, and Games.

## Domain and use-case layer

The core owns terms and lifecycle, not the SDK.

### Shared value types

- `MarketId`, `VenueId`, `WindowId`, `AccountId`, `PositionId`, `TxHash`;
- `BaseUnits`, `TokenAmount`, `Probability`, `Price`, `Quantity`, `Pnl`;
- `Reading<T>` with live/stale/unavailable metadata;
- `TxIntent`, `TxLifecycle`, `Refusal`, and `RecoveryAction`;
- `Grant`, `GrantScope`, `GrantBudget`, `GrantExpiry`;
- absolute timestamps plus a measured chain/server time offset.

### Capability facades

The application layer exposes cohesive use cases:

- `IdentityFacade`
- `MarketFacade`
- `TradingFacade`
- `PortfolioFacade`
- `SocialFacade`
- `StrategyFacade`
- `ParlayFacade`
- `CreatorFacade`
- `GameFacade`
- `StatusFacade`

Facades can compose multiple infrastructure ports but return one stable view model and error vocabulary to the web layer.

## DreamDEX boundary

Retain one chain boundary but divide it internally by capability:

```ts
interface MarketReadPort { /* discovery, detail, book, candles, lifecycle */ }
interface TradingPort { /* quote, approve, submit, cancel, cash out, redeem */ }
interface AccountPort { /* balances, grants, vault pools, positions */ }
interface StrategyPort { /* register, subscribe, execute, revoke, receipts */ }
interface ParlayPort { /* quote, open, inspect, settle, claim */ }
interface GamePort { /* fund, join, pick, inspect, settle, refund */ }
```

These are logical contracts, not necessarily six packages or six RPC clients. `packages/markets` composes them over:

- `@somnia-chain/markets-sdk` for supported Event Contract operations;
- exported/raw ABIs only when the SDK does not expose a required composition;
- Masayume contract adapters for capabilities DreamDEX does not own;
- indexer/GraphQL for discovery and projections;
- RPC receipt/log reads for final write truth.

The adapter must preserve DreamDEX rules already captured in `context/`: current on-chain status before writes, `marketId` identity, future nanosecond expiry, IOC taker behavior, explicit venue, decimal derivation, receipt success assertions, and permissionless claim/redeem mechanics.

## Signing and authority architecture

The existing module-level `SomniaMarkets` instance mutates one global signer. That is unsafe once multiple identities can sign concurrently.

Adopt two runtime concepts:

### `DreamDexReadRuntime`

- shared within one browser tab or one server process;
- contains public/indexer clients, market metadata, subscriptions, and caches;
- has no mutable account or signer;
- may reconnect or rotate endpoints without changing an actor's signing authority.

### `SubmitterSession`

- created for exactly one account, chain, and authority type;
- owns its WalletClient/account, nonce queue, journal, attribution, and grant policy;
- cannot have its signer replaced after construction;
- is disposed on disconnect, account switch, chain switch, expiry, or revocation.

Authority types include:

- external user wallet;
- embedded/smart wallet;
- browser session key;
- X executor;
- strategy runner;
- game session/player;
- market maker;
- claim/settlement actor;
- sponsor/paymaster policy.

One private key or account has one writer at a time. Different actors never share a mutable SDK object merely because they use the same RPC endpoint.

## Write pipeline

Every write follows the same conceptual lifecycle:

```text
Intent
  → eligibility and authority checks
  → fresh market/account reads
  → quote and bounded policy check
  → transaction construction
  → user or scoped actor signature
  → submission
  → receipt and fill inspection
  → projection update/reconciliation
  → completed, refused, failed, or confirmation-unknown state
```

Two execution lanes remain:

1. **Attended:** the user signs with an external or smart wallet.
2. **Delegated:** a role-specific actor signs under a user-created, capped, expiring, revocable grant.

Both lanes use the same domain checks, receipt truth, and error map. A delegated actor cannot withdraw to itself or change the beneficiary.

## Unified funds and grants

`EventVault` is the single user-owned prefunding and delegation framework. It avoids separate custody mechanisms for tap trading, X, strategies, games, and sponsorship.

Required grant scopes include:

- `SESSION_TRADE`
- `X_EXECUTOR`
- `STRATEGY`
- `GAME_SESSION`
- `CLAIM_ONLY`

Each grant specifies:

- owner and fixed payout beneficiary;
- authorized actor/session;
- allowed actions and optional market/mode set;
- total and per-action budget;
- maximum price/slippage or payout exposure;
- creation, expiry, nonce, and revocation;
- optional cooldown or daily stop.

Only the owner can withdraw. Executors can use funds only through allowlisted actions whose outputs remain owned by or payable to the owner.

## Contract capability set

DreamDEX remains the market and position primitive. Masayume contracts add product capabilities around it:

| Contract | Responsibility |
|---|---|
| `EventVault` | Trading Balance, grants, owner-only withdrawal, bounded delegated execution |
| `StrategyRegistry` | Strategy definitions, subscriptions, budgets, creator attribution and revocation |
| `ParlayReserve` | Escrow, immutable legs, maximum payout, settlement, void/refund rules |
| `RangeReserve` | Fully funded range outcome, oracle basis, expiry and settlement |
| `MarketMakerVault` | Share accounting, capital allocation, exposure limits, exit and settlement |
| `GameArena` | Match stake/side-pot, deck commitment, picks/receipts, deadlines, finalize/refund/forfeit |
| `Waitlist` | Founder/referral membership and rank if kept on-chain |

Cross-contract rules:

- maximum loss/payout is known and funded before accepting risk;
- owner withdrawal and beneficiary rules are structurally enforced;
- settlement and recovery become permissionless after safe deadlines where practical;
- all actions are idempotent or uniquely keyed;
- pause does not trap owner exits;
- events are sufficient to rebuild user-facing projections;
- no contract claims privacy or atomic composition that it does not provide.

## Data ownership

| Data | Authority | Database role |
|---|---|---|
| Market lifecycle, book, fills, positions, balances | DreamDEX/Somnia | Cache/projection only |
| Grants, vault balances, parlays, game stakes/commitments/results | Masayume contracts | Searchable projection only |
| OAuth/session records and X association | Identity/X provider + signed account binding | Durable off-chain record |
| Takes, comments, chat | Postgres | Primary authority, with signatures/receipts where claimed |
| Matchmaking queue and presence | Matchmaker/Redis or process store | Ephemeral |
| MMR, achievements, profiles, preferences | Postgres | Primary off-chain product state |
| Strategy metadata and runner health | Contract for economic authorization; DB for content/health | Split, labeled |
| Share cards and uploaded creator assets | Object storage | URL/metadata index |
| Live UI updates | Realtime projection | Never financial authority |

The UI labels separate pools instead of summing economically different balances into a misleading single number.

## Realtime architecture

- One subscription coordinator owns DreamDEX/Somnia streams per browser session.
- Deduplicate subscriptions by market/account key and fan out cached updates to routes.
- Reels, Markets, Portfolio, and Games consume the same normalized market stream.
- Visibility and route activity control high-frequency work; hidden routes release or reduce subscriptions.
- Use WebSocket/Data Streams for latency, periodic reconciliation for correctness, and RPC receipts/events for transaction truth.
- Reconnect resumes from a cursor or performs a bounded snapshot before applying new events.
- Game room WebSocket messages coordinate presence and progress but cannot decide economic outcomes.
- Long-running matchmaker, relay, runner, and settlement loops live in `services/ops`, not Next.js request lifetimes.

## Error and recovery contract

All surfaces use one typed error map. The visible result must distinguish:

- **refused before submission:** persistent reason and the action needed to proceed;
- **submitted and failed:** transaction context, humanized cause, and safe retry path;
- **confirmation unknown:** amber state with transaction hash and reconciliation action;
- **dependency unavailable:** last-good data marked stale where safe, never silently zeroed;
- **partial completion:** completed effects, remaining work, and idempotent continuation;
- **expired/revoked authority:** stop the actor and require an explicit new authorization.

Toasts are supplementary. A transaction-critical refusal or unknown state remains visible in the surface that initiated it.

## Identity and onboarding

Preserve Yosuku's onboarding shape while replacing Enoki/Sui specifics:

- external EVM wallet connection remains available;
- embedded/in-app smart wallet supports email/social/no-seed onboarding;
- account abstraction/paymaster handles approved sponsored actions;
- account, X identity, creator identity, and signing authority remain separate records;
- first-run funding and approval are integrated into the product flow rather than sent to raw tooling;
- returning users recover state without flashing the wrong onboarding screen;
- grants and smart-wallet sessions are visible and revocable.

Gas sponsorship is a policy decision, not a UI adjective. If a paymaster refuses or is unavailable, the flow explains the fallback and who would pay.

## Performance architecture

Performance work protects the reference experience; it does not justify simplifying it.

- Preserve server rendering for editorial shells and defer wallet/live boundaries to focused client components.
- Load the exact fonts deliberately and avoid duplicate font families from the superseded theme.
- Window the Reels feed and game-card decks so inactive heavy cards are not mounted indefinitely.
- Lazy-load Three.js/React Three Fiber and game-specific audio only inside routes that need them.
- Use one normalized query cache and one subscription per key instead of route-local polling storms.
- Pause animation, audio, charts, and high-frequency updates when hidden; honor reduced motion.
- Keep timestamp calculations on a shared time-offset service to avoid multiple drifting timers.
- Batch independent reads and use multicall where supported, while retaining per-read freshness metadata.
- Avoid serial server waterfalls: compose independent public data at the facade boundary.
- Keep wallet/session objects out of serialized server payloads.
- Profile source-led routes before rewriting them; do not trade fidelity for speculative optimization.

## Security and trust boundaries

- User wallets and smart-account owners remain the only unrestricted user-fund authorities.
- Delegated actors receive least-privilege grants and separate signer sessions.
- Server API input is schema-validated and never trusted as proof of ownership or settlement.
- OAuth state, callback binding, and wallet association use nonce-backed signed challenges.
- X and agent relays produce receipts linking the external instruction, grant, market, transaction, and beneficiary.
- Game commit-reveal plaintext is durable enough to allow fallback reveal; joining is blocked when reveal material is unavailable.
- Settlement workers are replaceable; contracts provide manual or permissionless recovery after deadlines.
- Secrets and signing keys never enter client bundles or shared logs.

## Native mobile boundary

Responsive web and PWA behavior are part of the baseline. Native mobile is currently `Blocked` because the referenced native source is absent. Do not invent a second design system for a future native app. If the source becomes available, evaluate it against the same parity manifest. If reconstruction is later approved, share domain/view models and reproduce the same flows intentionally.

## Verification boundary

The builder should use builds, type checks, receipt inspection, manual desktop/mobile observation, and small targeted checks where uncertainty or financial logic warrants them. A large automated test program, coverage target, fixture catalog, or test-only route expansion is not part of the requested deliverable.

The final acceptance authority is the user's review of the complete working product.
