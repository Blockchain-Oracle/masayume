---
title: Yosuku reference parity manifest
status: authoritative
reference_commit: 3c56ef52b78dae28cc198495f753480292f6a5ad
---

# Yosuku reference parity manifest

This manifest defines the minimum Masayume product surface. The implementation ledger should add destination paths and completion evidence without weakening this inventory.

## Product shell

The shell comes from Yosuku source:

- root layout, metadata, pre-paint theme selection, providers, error boundary, and global styles;
- desktop header navigation and mobile persistent bottom navigation;
- app strip, ticker, footer, grain, background, smooth scrolling, custom cursor where applicable, theme toggle, and reduced-motion behavior;
- global toast and transaction feedback language;
- desktop enrichment without turning mobile and desktop into different products.

Games add one first-class navigation destination. They do not replace Markets, Reels, Strategies, Portfolio, or More.

## Route baseline

| Route | Reference product responsibility | Masayume classification |
|---|---|---|
| `/` | Full editorial landing, product acts, manifesto, architecture, FAQ, download CTA | Exact shell; adapted identity/protocol copy |
| `/markets` | Cadence lanes, hero market/chart, room, ticket, quotes and trade entry | Adapted to DreamDEX |
| `/reels` | Vertical live-market feed, takes, quick directional entry | Adapted to DreamDEX |
| `/portfolio` | One-number portfolio, labeled pools, positions, history and recovery | Adapted |
| `/portfolio/edge` | Trader Edge analysis and performance explanation | Adapted |
| `/leaderboard` | Banzuke-style ranking and reputation | Adapted |
| `/earn` | Liquidity/market-making participation | Adapted via Masayume vault |
| `/strategies` | Live strategy desk, strategy discovery, memory market, recent trades | Adapted |
| `/agents` | Agent discovery/creation/leaderboard surface | Adapted |
| `/parlay` | Multi-leg streak ticket and settlement | Adapted via ParlayReserve |
| `/surface` | Market surface/term-structure analysis | Adapted to real DreamDEX data |
| `/trade-from-x` | Link X and authorize bounded social trade execution | Adapted |
| `/claim` | Recovery/linking/claim flow | Adapted to DreamDEX redemption |
| `/fund` | Funding preview and deposit path | Adapted |
| `/waitlist` | Founder position, referral, rank and growth loop | Adapted |
| `/stats` | Public traction and verifiable receipt story | Adapted |
| `/docs` | Product and developer documentation | Exact structure; adapted facts |
| `/creators` | Creator discovery and earning story | Adapted |
| `/creator/studio` | Creator configuration and operations | Adapted |
| `/creator/recover` | Creator account recovery | Adapted |
| `/studio` | Strategy/playbook studio | Adapted |
| `/how-it-works` | Product mechanism explanation | Exact structure; adapted facts |
| `/demo` | Guided product demonstration | Real Masayume behavior; no invented economic state |
| `/pitch` | Judge/investor product narrative | Exact presentation grammar; adapted claims/evidence |
| `/download` | Install/native/PWA entry | Responsive web/PWA exact; native marked Blocked pending source decision |
| `/status` | Dependency and service health | Adapted |
| `/social` | Social board/takes | Adapted |
| `/native-auth` | Native/deep-link authentication bridge | Blocked for native source; web auth still Adapted |
| `/bell`, `/pool`, `/beta`, `/markets-live`, `/markets/[id]` | Legacy/deep-link redirects | Exact redirect intent with Masayume targets |

Yosuku's `/dev/*` pages are internal design-review utilities, not production-data substitutes and not a product deliverable. A builder may keep equivalent private inspection tooling if useful, but must not populate public Masayume routes with fabricated balances, odds, trades, settlements, or activity.

## Additive game routes

| Route | Responsibility |
|---|---|
| `/games` | Yosuku-native game selection and active-session return |
| `/games/duel` | Ranked/free PvP prediction duel |
| `/games/practice` | Clearly labeled no-stake tutorial/practice loop |
| `/games/lucky` | Randomized live-market prediction mode with auditable selection |
| `/games/range` | Real range-market game backed by RangeReserve |
| `/games/moonshot` | PIPS-derived arcade/trading mode with its economic nature stated plainly |
| `/games/line-rider` | PIPS-derived arcade mode, not represented as a chain position unless it creates one |
| `/games/candle-hop` | PIPS-derived arcade mode, not represented as a chain position unless it creates one |

## Feature families

The route table does not replace this feature inventory:

- cadence-aware live market discovery;
- hero-as-ticket trade flow;
- Up/Down, stake, range, leverage, private, cash-out, claim, and receipt behavior;
- social takes, comments/rooms, sharing, alerts, news/ticker, and X linking;
- single coherent Trading Balance with separately labeled economic pools;
- positions, PnL, history, equity, reputation, badges, leaderboard, and Trader Edge;
- earn/liquidity, parlays, strategies, creators, agents, playbooks, and assistant surfaces;
- faucet/funding, account setup, recovery, wallet association, smart-wallet/session authorization, and revocation;
- status, traction, docs, demo, pitch, download/install, and error recovery;
- game selection, progress persistence, achievements, game stats, history, customization, sound, haptics, reduced motion, matchmaking, MMR, result sharing, and return-to-session behavior.

## Visual contract

Use Yosuku's actual source values and assets as the implementation source. The following identify the system; they are not permission to approximate it:

- light ground `#F4EEE3`, dark ground `#050505`, ink near `#141210`;
- vermilion action/accent `#E04D26`;
- profit `#34D399` and loss `#FB7185` semantics;
- Sora display, Inter body, JetBrains Mono data, Noto Serif JP editorial/stamp roles;
- cream editorial surfaces and intentional dark islands;
- film grain, crop marks/ticks, torii section rhythm, numbered headers, ticker/marquee, and editorial italic accents;
- Yosuku spacing, borders, radii, shadows, breakpoints, hover/focus states, and animation curves from source;
- reduced-motion behavior and no pre-hydration theme flash.

Brand substitution changes the mark and name, not the design grammar. Do not replace this with the historical gold/Archivo Masayume theme.

## Responsive contract

At minimum, inspect and preserve behavior at phone, tablet, small desktop, and wide desktop sizes. Representative implementation widths are 390, 768, 1024, and 1440 pixels, but source breakpoints govern.

- Mobile retains Yosuku's compact header and persistent bottom navigation.
- Reels remains a phone-proportioned feed object on larger screens.
- Trading controls become sheets/drawers/rails according to source behavior.
- Desktop adds space and information density without reordering the product into a different workflow.
- Games use the same outer shell; an immersive game stage may be a deliberate dark island.

## State contract

Every relevant surface must account for the states present in the reference and target lifecycle:

| State family | Required examples |
|---|---|
| Identity | signed out, connecting, first run, linked, returning, recovery, revoked |
| Money | unfunded, insufficient collateral, allowance/grant required, funded, pending withdrawal |
| Reads | initial loading, live, stale last-good, empty, disconnected, dependency unavailable |
| Market | upcoming, live, between rounds, near expiry, suspended, expired, settled, voided |
| Trade | quote loading, quote moved, confirmation, submitted, fill/partial fill, rejected, unknown confirmation, claimable, redeemed |
| Social/agent | unlinked, authorizing, authorized, capped, expired, runner unavailable, execution receipt |
| Game | idle, tutorial, queued, matched, reveal, picking, locked, per-card settlement, final, refund, forfeit, reconnect |

Do not invent successful product data to demonstrate these states. Use the real backend/chain once implemented; until then, the UI should state that the capability is not connected rather than pretending it is.

## Parity record required during implementation

For every surface, the builder records:

| Field | Required value |
|---|---|
| Reference evidence | Yosuku file path and relevant live observation |
| Destination | Masayume route/component/module |
| Classification | Exact, Adapted, Additive, Blocked, or user-approved Excluded |
| Data authority | Chain, DreamDEX indexer, database, device, or external service |
| States | Identity, data, transaction, failure, recovery, and responsive states |
| Deviation | `none` or a direct user approval |
| Confidence | Build/manual observation/targeted check as appropriate |

There is no approval for a user-visible exclusion at the time of this document.
