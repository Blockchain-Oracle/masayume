---
title: Feature adaptation ledger
status: authoritative
rule: no user-visible exclusions without direct approval
---

# Feature adaptation ledger

This is the initial product-to-capability ledger. The builder expands each row with source/destination paths and implementation status; the product promise and classification are already decided.

## Market and transaction capabilities

| Capability | Yosuku promise to preserve | Masayume implementation truth | Class |
|---|---|---|---|
| Live market discovery | Current windows, cadence lanes, between-round placeholders, market detail | DreamDEX SDK/indexer discovery keyed by `marketId`; live on-chain status checked before writes | Adapted |
| Hero-as-ticket | Chart and question are the primary trade surface | Same interaction over DreamDEX book/market data | Adapted |
| Up/Down | One-tap directional position with real quote | Native DreamDEX binary position/order | Adapted |
| Size-aware quote | User sees the executable economics for their stake | DreamDEX order book/SDK quote for actual size, not midpoint | Adapted |
| Fast repeat trading | Authorized taps without repeated full-wallet friction | Embedded smart wallet or bounded `SESSION_TRADE` grant | Adapted |
| Cash out | Exit a live position when market liquidity permits | Opposing/sell order through DreamDEX; output based on actual fill | Adapted |
| Claim | Find and redeem finalized winnings | Scan finalized positions/markets and call explicit redemption; idempotent journal | Adapted |
| Receipt | Verifiable outcome, price, fill, fees and chain link | RPC receipt/logs plus fill records and Somnia explorer links | Adapted |
| Leverage | Clearly bounded multiplied exposure from one Trading Balance | Masayume prefunded reserve/underwriter with capped loss and explicit maximum payout; never a cosmetic multiplier | Adapted/new contract |
| Private trade | Reduced public linkability and separate withdrawal/recovery experience | Ephemeral account or scoped smart-account session; described as link-private unless stronger privacy is actually built | Adapted/new service |
| Range | User predicts that settlement lands inside/outside a band | `RangeReserve` with fixed oracle basis, band, expiry, fully funded payout and permissionless settlement | Adapted/new contract |
| Trading Balance | Deposit once; route safely across product modes; owner can withdraw | `EventVault`, labeled wallet/vault/order/payout pools, owner-only withdrawal | Adapted/new contract |

## Feed, social and creator capabilities

| Capability | Preserved behavior | Masayume implementation | Class |
|---|---|---|---|
| Reels | Full-height live cards, swipe navigation, quick direction entry | Yosuku component behavior backed by shared DreamDEX market stream | Adapted |
| Takes | Create and browse opinions attached to a market | Postgres social record linked to `marketId`, account and optional position receipt | Adapted |
| Rooms/comments | Market-specific conversation with identity and moderation state | Postgres + realtime room service; chain is not claimed as comment authority | Adapted |
| Sharing | Share a market, take, trade or result in Yosuku's card language | Server-rendered/open-graph cards using real referenced records | Adapted |
| Alerts | Threshold and lifecycle notifications | Device permission + stored user rules + market stream evaluator | Adapted |
| News/ticker | Live contextual information around markets | Real configured feed/provider; unavailable state if no provider is connected | Adapted |
| Creators | Discover creators, evidence, playbooks and earnings | Profiles/content in DB; on-chain receipts and attributed strategy activity where claimed | Adapted |
| Creator studio | Configure creator identity, cards, playbooks and strategy offering | Authenticated studio services plus registry calls | Adapted |
| Creator recovery | Restore creator/account association | Signed-wallet identity recovery and provider re-link flow | Adapted |

## X prediction rail

Masayume needs its own official X account. Account creation, credential provisioning, and any live posting are external actions for the owner or a separately authorized implementation session; this architecture defines the system they connect to.

The preserved flow is:

```text
User links X + wallet
  → user creates an EventVault X_EXECUTOR grant
  → user mentions the Masayume X account with a prediction instruction
  → relay authenticates the author and parses an unambiguous intent
  → executor validates grant, budget, market, quote and expiry
  → executor submits from its isolated signing session
  → Masayume replies/displays a receipt linking the instruction to the transaction
```

Required components:

- official Masayume X account;
- OAuth account linking and signed-wallet binding;
- mention/webhook or bounded polling ingestion;
- deterministic instruction parser with refusal for ambiguity;
- `X_EXECUTOR` grant and owner-fixed beneficiary;
- isolated executor wallet/session and nonce queue;
- receipt/status store and public recovery/status surface;
- revocation, expiry, daily budget, slippage, market and action caps.

The executor may trade. It cannot change withdrawal destination or transfer user funds to itself.

## Portfolio, reputation and analytics

| Capability | Preserved behavior | Masayume implementation | Class |
|---|---|---|---|
| One-number portfolio | A clear headline plus separately named pools | Aggregated view model over wallet, EventVault, open orders/positions and claimable credit; no misleading sum | Adapted |
| Position/history | Open, settled, won/lost/voided and claim state | Chain/indexer-derived projection reconciled with receipts | Adapted |
| Equity/PnL | Real performance over time | Rebuildable event/fill projection; base-unit accounting | Adapted |
| Trader Edge | Explain behavior and performance, not only wins | Real fills/outcomes including losses and voids | Adapted |
| Leaderboard | Banzuke-style ranking and reputation | DB projection from complete verified outcome history; losses cannot disappear | Adapted |
| Badges/achievements | Visible progress and earned identity | DB authority for product achievements; on-chain only where the badge promises it | Adapted |
| Stats/traction | Publicly verifiable usage and product proof | Chain-derived metrics plus separately labeled social/off-chain metrics | Adapted |

## Earn, strategies, agents and assistant

| Capability | Preserved behavior | Masayume implementation | Class |
|---|---|---|---|
| Earn/LP | Commit capital to market making and inspect exposure/return | `MarketMakerVault` shares with bounded DreamDEX maker actor, real inventory and exit accounting | Adapted/new contract |
| Strategy marketplace | Discover, inspect and subscribe to strategies | `StrategyRegistry` plus creator metadata and verified trade history | Adapted/new contract |
| Strategy runner | Execute inside user-approved limits | Single-writer actor using isolated session and `STRATEGY` grant | Adapted |
| Agent creator | Configure strategy/agent rules and publish | Studio schema, simulation/read-only preview where labeled, registry activation only after real authorization | Adapted |
| Agent leaderboard | Compare actual performance and risk | Complete fill/outcome projection including losses, costs and inactive periods | Adapted |
| Memory market/playbooks | Save, inspect and reuse agent/creator context | DB/object storage for content; signed provenance and contract links where relevant | Adapted |
| Assistant/Sensei | Contextual product and market explanation, including refusal | AI service over typed read models; cannot invent positions, quotes or execution success | Adapted |

The assistant may explain or construct an intent. Execution still passes through the same quote, authority, risk, signature and receipt pipeline as manual actions.

## Parlays

Preserve Yosuku's multi-leg ticket and lifecycle while implementing it as a Masayume product contract:

- legs become immutable when opened;
- each leg identifies the DreamDEX `marketId`, side and settlement policy;
- quote shows stake, combined probability basis, maximum payout and void behavior;
- `ParlayReserve` is sufficiently funded before accepting the ticket;
- settlement is per leg and finalization is idempotent;
- void/refund rules are explicit and visible before confirmation;
- user or permissionless keeper can continue settlement after safe deadlines;
- chain events support the exact ticket, portfolio and receipt views.

## Surface

Yosuku's SVI surface cannot be relabeled as if DreamDEX exposes the same model.

Masayume keeps the route and analytical density but shows real DreamDEX structures:

- probability and spread by asset/cadence/window;
- bid/ask depth and available size;
- liquidity and slippage across stake sizes;
- term structure across current expiries;
- opening/reference and settlement-basis context;
- stale/unavailable markers for missing data.

If a later real volatility model is added, it must state its input data and estimation method.

## Funding, onboarding and recovery

| Capability | Preserved behavior | Masayume implementation | Class |
|---|---|---|---|
| No-seed onboarding | Social/email entry without exposing a seed phrase | Embedded/in-app EVM smart wallet | Adapted |
| External wallet | Connect an existing wallet | wagmi-compatible EVM connector | Adapted |
| Sponsored actions | Approved actions work without native gas where policy permits | ERC-4337 paymaster/sponsor service with explicit fallback | Adapted |
| Faucet/fund | User can obtain test collateral and understand balances | DreamDEX/Somnia testnet faucet and approval/deposit orchestration | Adapted |
| Account setup | Create required trading/vault state during the flow | Idempotent account/vault initialization | Adapted |
| Recovery/linking | Restore wallet/social association and claim access | Signed challenges, provider OAuth and owner-bound recovery | Adapted |
| Revocation | User sees and ends delegated access | On-chain grant revocation plus session invalidation | Adapted |

## Public/support surfaces

| Capability | Requirement |
|---|---|
| Landing/how it works | Preserve Yosuku's full editorial structure and motion; rewrite only Masayume/Somnia facts |
| Docs | Document actual implemented capabilities and boundaries; do not publish future behavior as current |
| Status | Derive dependency health at read time; do not keep a stale “healthy” claim |
| Demo | Navigate the real product and real connected data; recorded evidence can supplement but not become fake product state |
| Pitch | Preserve the presentation craft; use only real Masayume evidence and current hackathon facts |
| Download | Preserve web/PWA installation; native buttons remain blocked until native source/build decision is resolved |
| Waitlist/referral | Preserve rank/referral loop with real stored/on-chain membership |

## Explicitly not approved

There is no approved feature drop list. In particular, the older recommendations to drop private claims, native account flows, legacy analytics, route families, or Yosuku's design kit no longer govern this project.

If the builder discovers a genuine technical impossibility, they must present the exact evidence, the closest honest implementation, and the user-visible consequence before changing the ledger classification.
