<p align="center">
  <a href="https://masayume.app">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://docs.masayume.app/repo-assets/hero-dark.svg" />
      <source media="(prefers-color-scheme: light)" srcset="https://docs.masayume.app/repo-assets/hero-light.svg" />
      <img src="https://docs.masayume.app/repo-assets/hero-light.png" width="960" alt="Masayume — make your call, see it through. Price markets, games and agents on Somnia." />
    </picture>
  </a>
</p>

<h1 align="center">Masayume · 正夢</h1>
<p align="center">Make a price call. Try a game. Put a strategy to work.</p>

<p align="center">
  <a href="https://masayume.app"><b>Open app</b></a>
  &nbsp;·&nbsp;
  <a href="https://docs.masayume.app"><b>Documentation</b></a>
  &nbsp;·&nbsp;
  <a href="https://docs.masayume.app/start/quickstart"><b>Get started</b></a>
  &nbsp;·&nbsp;
  <a href="https://docs.masayume.app/architecture/overview"><b>Architecture</b></a>
  &nbsp;·&nbsp;
  <a href="https://masayume.app/status"><b>Service status</b></a>
</p>

Masayume brings short price markets, games and trading agents into one app. Choose a market Window, make a call, then follow the actual fill and result. Underneath, DreamDEX supplies the event markets on Somnia; Masayume adds trading balances, bounded permissions, specialist tickets and games.

The app currently targets **Somnia Shannon testnet — chain 50312**. Trading collateral is **tUSDC** (6 decimals); network fees use **STT** (18 decimals). You can browse markets and play Practice without connecting a wallet. Funded actions use test balances, and server-backed features depend on their configured services. See the [availability guide](https://docs.masayume.app/help/availability) for the prerequisites of each feature.

## Find your way

| What you want to do | Start here |
| --- | --- |
| Make an Up or Down call and read its result | [Your first trade](https://docs.masayume.app/trading/first-trade) · [Portfolio](https://docs.masayume.app/trading/portfolio) |
| Understand your money and trading permission | [Balances](https://docs.masayume.app/trading/balances) · [Tap-trading](https://docs.masayume.app/trading/tap-trading) |
| Explore other ticket types | [Range](https://docs.masayume.app/trading/range) · [Boost](https://docs.masayume.app/trading/leverage) · [Parlay](https://docs.masayume.app/trading/parlay) · [Private](https://docs.masayume.app/trading/private) |
| Supply capital to a reserve | [Earn](https://docs.masayume.app/trading/earn) |
| Try the games | [Practice](https://docs.masayume.app/games/practice) · [Duel](https://docs.masayume.app/games/duel) · [Lucky Draw](https://docs.masayume.app/games/lucky-draw) · [Line Rider](https://docs.masayume.app/games/line-rider) · [Candle Hop](https://docs.masayume.app/games/candle-hop) · [Moonshot](https://docs.masayume.app/games/moonshot) |
| Publish or follow a trading strategy | [Launch an agent](https://docs.masayume.app/agents/launch) · [Copy a strategy](https://docs.masayume.app/agents/copy) · [Run an agent yourself](https://docs.masayume.app/builders/self-host-agent) |
| Use the social and discovery tools | [Trade from X](https://docs.masayume.app/explore/trade-from-x) · [Sensei](https://docs.masayume.app/explore/sensei) · [Reels](https://docs.masayume.app/explore/reels) · [Rooms and alerts](https://docs.masayume.app/explore/rooms-alerts) |

## Watch it work

<p align="center">
  <a href="https://masayume.app/demo">
    <img src="https://masayume.app/video/masayume-demo-2026-09-07.jpg" width="720" alt="Watch the Masayume demo: markets, agents, X receipts and Moonshot on Shannon testnet" />
  </a>
</p>

**[Watch the 2:46 demo](https://masayume.app/demo)** · [Direct MP4](https://masayume.app/video/masayume-demo-2026-09-07.mp4) · [English captions](https://masayume.app/video/masayume-demo-2026-09-07.vtt)

Real app captures from 6–7 September 2026 show the corrected AI Hold read, confirmed strategy publication, bounded copying, the X receipt and a paid Moonshot round. All financial evidence uses Shannon testnet assets. The player includes a transcript; the [Practice guide](https://docs.masayume.app/games/practice), [ticket walkthrough](https://docs.masayume.app/trading/first-trade) and [Candle Hop guide](https://docs.masayume.app/games/candle-hop) provide further recorded walkthroughs.

## How the parts connect

<p align="center">
  <a href="https://docs.masayume.app/architecture/overview">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://docs.masayume.app/repo-assets/architecture-dark.svg" />
      <source media="(prefers-color-scheme: light)" srcset="https://docs.masayume.app/repo-assets/architecture-light.svg" />
      <img src="https://docs.masayume.app/repo-assets/architecture-light.png" width="960" alt="Masayume system map: public market reads, wallet-authorized order routes, and separate server and operator services" />
    </picture>
  </a>
</p>

- **Reading a market:** the shared reader gets public prices, books and chain facts without a signing account.
- **Placing a call:** your wallet or a key with a bounded grant signs an intent. Fresh execution checks route it to the venue or the appropriate Masayume contract. Receipts record actual fills.
- **Using a service:** app server routes and long-running operators handle features such as AI reads, X mentions, strategy decisions and game rooms. Their permissions and stored records are separate from your wallet.

[Explore the interactive map](https://docs.masayume.app/architecture/overview), then go deeper into [Range](https://docs.masayume.app/architecture/range), [Boost](https://docs.masayume.app/architecture/leverage), [Private mode](https://docs.masayume.app/architecture/private), [agents](https://docs.masayume.app/architecture/agents), [games](https://docs.masayume.app/architecture/games) or [X](https://docs.masayume.app/architecture/x). The documentation maps adapt to mobile screens and explain what each part can control.

## Contracts on Somnia testnet

Shannon addresses checked against the repository and public RPC on **5 September 2026**, at block **480,250,668**. All 20 unique configured addresses returned code. This confirms code presence at that block; it does not establish current liquidity, source-code verification or service availability.

| Contract | Purpose | Explorer address |
| --- | --- | --- |
| EventVault | Trading Balance and bounded trading grants | [0x84Ec824D89ee78d5728545CE0B40EC968aa7CD7A](https://shannon-explorer.somnia.network/address/0x84Ec824D89ee78d5728545CE0B40EC968aa7CD7A) |
| ERC2771Forwarder | Relays calls signed by the user | [0x82bb75b8aE663abC73308Ce42ca00d701cFb50d3](https://shannon-explorer.somnia.network/address/0x82bb75b8aE663abC73308Ce42ca00d701cFb50d3) |
| StrategyRegistry | Agent strategies, runners and subscription consent | [0xAd5f37B0f3d0f6030B9d9c0f4985AFb184A85FB4](https://shannon-explorer.somnia.network/address/0xAd5f37B0f3d0f6030B9d9c0f4985AFb184A85FB4) |
| ParlayReserve | Multi-Window tickets with reserved payouts | [0x50Ced768C80d499bA4FB956C7DF0c2beB078C151](https://shannon-explorer.somnia.network/address/0x50Ced768C80d499bA4FB956C7DF0c2beB078C151) |
| RangeReserve | Inside/Outside tickets on a Window’s closing price | [0x1F8dB9B0913cB09e5CfDe44Adfa7Ff22b0868386](https://shannon-explorer.somnia.network/address/0x1F8dB9B0913cB09e5CfDe44Adfa7Ff22b0868386) |
| MarketMakerVault | Shared capital for bounded market making | [0xc904F38f38eF96E8741C7D9218a7899504B99e79](https://shannon-explorer.somnia.network/address/0xc904F38f38eF96E8741C7D9218a7899504B99e79) |
| LeverageReserve | Financed positions, cash-out and knock-outs | [0x5484fF06F4B6a8108fABb2511385985D933a2D23](https://shannon-explorer.somnia.network/address/0x5484fF06F4B6a8108fABb2511385985D933a2D23) |
| PrivateDesk | Private-mode balances and separate trade slots | [0x4D27115c4eff6536bf0D009ACeBf339AA02128bB](https://shannon-explorer.somnia.network/address/0x4D27115c4eff6536bf0D009ACeBf339AA02128bB) |
| GameArena | Duel picks, side pots, settlement and player credits | [0x0d8FC9659d02070aD8fF7E9a27E5394B9F5a2EF2](https://shannon-explorer.somnia.network/address/0x0d8FC9659d02070aD8fF7E9a27E5394B9F5a2EF2) |
| SeasonPrizePool | Admin-controlled season prize escrow | [0x6B340DBE7AC3283B5f5c3aA5f6AaEd57378596fA](https://shannon-explorer.somnia.network/address/0x6B340DBE7AC3283B5f5c3aA5f6AaEd57378596fA) |

Collateral: [tUSDC — 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E](https://shannon-explorer.somnia.network/address/0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E).


<details>
<summary>DreamDEX and upstream contracts</summary>

These are upstream contracts used by the installed Somnia Markets SDK, rather than Masayume-owned deployments.

| Upstream contract | Manifest key | Explorer address |
| --- | --- | --- |
| BinaryMarketsModule | `binaryModule` | [0x3ecC694Cef705358864a646142ac17A90E29e388](https://shannon-explorer.somnia.network/address/0x3ecC694Cef705358864a646142ac17A90E29e388) |
| Binary pool implementation | `binaryPoolImpl` | [0x82A1FcdaA2daC2fC7D5f9909D43E68021eE966FD](https://shannon-explorer.somnia.network/address/0x82A1FcdaA2daC2fC7D5f9909D43E68021eE966FD) |
| Binary settlement | `binarySettlement` | [0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23](https://shannon-explorer.somnia.network/address/0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23) |
| CLOB factory | `clobFactory` | [0xb2BE8EE02F96379DB75f01802384593EBa9bfF04](https://shannon-explorer.somnia.network/address/0xb2BE8EE02F96379DB75f01802384593EBa9bfF04) |
| Test USDC (collateral) | `collateral` | [0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E](https://shannon-explorer.somnia.network/address/0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E) |
| Collateral router | `collateralRouter` | [0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C](https://shannon-explorer.somnia.network/address/0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C) |
| Market creator | `marketCreator` | [0x138CfA6b80475b8c03d7E468b2442278E51e645a](https://shannon-explorer.somnia.network/address/0x138CfA6b80475b8c03d7E468b2442278E51e645a) |
| Market creator factory | `marketCreatorFactory` | [0xE6bEE93cE87c9E6e62aCb621caa7832EE47b4F6B](https://shannon-explorer.somnia.network/address/0xE6bEE93cE87c9E6e62aCb621caa7832EE47b4F6B) |
| MarketsCore | `marketsCore` | [0x2802504314685D89bF6C992CA5a8e7cC78bc0294](https://shannon-explorer.somnia.network/address/0x2802504314685D89bF6C992CA5a8e7cC78bc0294) |
| OracleHub | `oracleHub` | [0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b](https://shannon-explorer.somnia.network/address/0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b) |


</details>

The checked-in records are [`contracts/deployments/50312.json`](contracts/deployments/50312.json), the generated [Masayume addresses](packages/markets/src/addresses.masayume.json), and the [upstream address manifest](packages/markets/src/addresses.pinned.json). Read the [contract reference](https://docs.masayume.app/builders/contracts) for roles and configuration boundaries. Get test STT from the [Somnia testnet hub](https://testnet.somnia.network/) and follow the [balance guide](https://docs.masayume.app/trading/balances) for test collateral.

## Run locally

Use **Node.js 24** and **pnpm 11.24.0**.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The public app shell uses checked-in testnet defaults, so no environment file is required to start browsing. A local server does not automatically run the database, AI provider, X integration, strategy runner or game-room service. Follow [local setup](https://docs.masayume.app/builders/local-setup), [configuration](https://docs.masayume.app/builders/configuration) and [services](https://docs.masayume.app/builders/services) to enable the features you need. Keep private keys and provider credentials in their server environments.

```sh
pnpm build                  # production web build
pnpm typecheck              # workspace type checks
pnpm invariants             # architecture rules
pnpm test                   # existing Vitest projects
pnpm contracts:test         # local Foundry tests; excludes fork suites
```

The user documentation lives in [its own repository](https://github.com/Blockchain-Oracle/masayume-docs) and at [docs.masayume.app](https://docs.masayume.app). App navigation and old `/docs` bookmarks point there. To work against a local docs checkout, set `NEXT_PUBLIC_DOCS_URL=http://localhost:3333` in `web/.env.local`.

## Repository guide

| Path | What lives here |
| --- | --- |
| [`web/`](web/) | Next.js screens and server routes |
| [`packages/core/`](packages/core/) | Domain types, rules and deterministic game engines |
| [`packages/markets/`](packages/markets/) | Market reader, signing sessions, execution routes and deployed addresses |
| [`packages/brain/`](packages/brain/) | Agent specifications, prompts and decision checks |
| [`packages/db/`](packages/db/) | Optional Postgres client and schema |
| [`services/ops/`](services/ops/) | Long-running strategy, market-making and game-room processes |
| [`contracts/`](contracts/) | Solidity contracts, Foundry tests and deployment records |
| [`scripts/`](scripts/) | Architecture checks, protocol probes and setup utilities |
| [`docs/assets/readme/`](docs/assets/readme/) | Branded SVG sources, PNG exports and video-link instructions |

The [source-led architecture record](docs/architecture/yosuku-source-led-migration/README.md) governs product and implementation decisions. [`context/`](context/README.md) retains the research behind it; `_bmad-output/` is superseded historical planning. For endpoint contracts and integration details, use the [API reference](https://docs.masayume.app/builders/api).

Both GitHub repositories currently require access. The documentation and its published artwork are available through the docs domain; source links in the guides require repository access.

Source and asset attribution is recorded in [Third-party notices](THIRD_PARTY_NOTICES.md). The [public-release audit](docs/submission/public-release-audit-2026-09-06.md) separates existing reuse authorization, third-party terms and the remaining project-license decisions.
