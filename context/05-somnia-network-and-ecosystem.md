# Somnia Network & Ecosystem — chain facts, faucets, AA/gas sponsorship, reactivity, oracle explorer, official EC app, Bot Builder, hackathon extras

> Web research done 2026-08-31 (WebFetch/WebSearch) plus the local mirrors under `reference/`. Every claim carries its source. Platform/API details live in `04-dreamdex-platform-spot-http-ws.md`; Event Contracts specifics in `01-dreamdex-event-contracts.md`; the hackathon brief in `00-hackathon-brief.md`.

## 1. Network parameters

Source: https://docs.somnia.network/developer/network-info (fetched 2026-08-31); cross-checked with `reference/dreamdex-docs/developers/developers.md`.

| Parameter | Mainnet | Testnet |
|---|---|---|
| Chain ID | **5031** | **50312** |
| Network name | Somnia Mainnet | Somnia Testnet (**Shannon**) |
| Native / gas token | **SOMI** | **STT** |
| Official RPC (HTTP) | `https://api.infra.mainnet.somnia.network/` | `https://api.infra.testnet.somnia.network/` |
| Official RPC (WSS) | `wss://api.infra.mainnet.somnia.network/ws` | `wss://api.infra.testnet.somnia.network/ws` |
| Explorer | `https://explorer.somnia.network` | `https://shannon-explorer.somnia.network/` (alt: `https://somnia-testnet.socialscan.io/`) |

**Third-party RPC providers** (mainnet): Ankr (`https://www.ankr.com/rpc/somnia/`), PublicNode (`https://somnia.publicnode.com/`), Stakely (`https://somnia-json-rpc.stakely.io`), Validation Cloud. DreamDEX's own reliability guidance says to keep ≥2 RPCs configured and rotate on failure (`reference/dreamdex-docs/developers/developers.md`).

**Useful deployed infra** (network-info page):

| Contract | Mainnet | Testnet |
|---|---|---|
| Multicall3 | `0x5e44F178E8cF9B2F5409B6f18ce936aB817C5a11` | `0x841b8199E6d3Db3C6f264f6C2bd8848b3cA64223` |
| ERC-4337 EntryPoint v0.7 | — | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` |
| Account factory | — | `0x4be0ddfebca9a5a4a617dee4dece99e7c862dceb` |
| CreateX | `0xD13C575ED5378fd18B100Bd87D5765d9A747358B` | `0x535822d4b86b2372FBE4fd9d1468318F04A2A640` |

Chain claims (marketing but consistent across docs): EVM-compatible L1, up to 1M TPS, sub-second finality, ~50 validators, no centralized sequencer, positioned as "the Agentic L1" (`reference/dreamdex-docs/welcome/readme.md`; https://somnia.network/).

## 2. Faucets (testnet STT + test tokens)

Sources: network-info page (above); `reference/dreamdex-docs/developers/quick-start.md`; `trading/readme-1/simple-swap.md`; `developers/event-contracts/contracts-and-addresses.md`.

- **STT (testnet gas)** — official faucet: **https://testnet.somnia.network/**. Alternatives: Google Cloud Web3 faucet (`https://cloud.google.com/application/web3/faucet/somnia/shannon`, also linked from DreamDEX docs as `https://cloud.google.com/web3/faucet?network=somnia`), Stakely (`https://stakely.io/faucet/somnia-testnet-stt`), Thirdweb (`https://thirdweb.com/somnia-shannon-testnet`). Stakely even runs a mainnet SOMI dust faucet (`https://stakely.io/faucet/somnia-somi`).
- **DreamDEX spot test tokens** (SOMI/WBTC/WETH, 18 decimals): faucet contract `0x89Ebc05dE83aB9752B95030218BB10A542b96B7C`, call `requestTokens(address[] tokens, uint256[] amounts)` (`developers/quick-start.md`). Testnet **USDso**: no faucet — swap for it on a testnet market or use the hidden Simple Swap debug faucet at `app.dreamdex.io/simple/debug` (`trading/readme-1/simple-swap.md`).
- **Event Contracts testnet collateral is different**: **tUSDC** `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` (6 decimals — mainnet USDso is 18!), minted on demand via `faucet(uint256)` capped at 10,000 per call (`developers/event-contracts/contracts-and-addresses.md`).

## 3. Account abstraction, paymasters, sponsored gas

Sources: docs.somnia.network search results (fetched 2026-08-31); `reference/dreamdex-docs/welcome/making-your-first-deposit.md`; `trading/earn.md`.

- **Somnia supports ERC-4337 account abstraction**; the testnet has the canonical EntryPoint v0.7 + an account factory deployed (table above). Official docs include guides: "Gasless Transactions with Thirdweb" (`https://docs.somnia.network/developer/building-dapps/account-abstraction/gasless-transactions-with-thirdw`), "Smart Wallet App with Thirdweb" (`.../account-abstraction/smart-wallet-app-with-thirdweb`), and "Somnia Account Abstraction Apps using Thirdweb React SDK" (`https://docs.somnia.network/developer/partners/somnia-account-abstraction-apps-using-thirdweb-react-sdk`). Pattern: smart account + relayer/paymaster pays gas in SOMI, users transact with zero native balance.
- **DreamDEX's own stack is proof it works in production**: the app provisions a **Privy-backed smart wallet** for every user (email/social login supported), executes swaps as **UserOps**, and **sponsors gas** on SOMI↔USDso and USDC.e↔USDso pairs, including auto-buying 1 SOMI on first deposit ("auto-buy gas") (`welcome/making-your-first-deposit.md`, `trading/readme-1/simple-swap.md`). The HTTP API even has an endpoint mapping login EOA → smart wallet(s), including counterfactual ones (`developers/http-api/wallets.md`).
- Takeaway for our dApp: two viable gasless/one-click routes — (a) 4337 smart accounts via Thirdweb/Privy with a sponsoring paymaster, (b) **EIP-7702 type-4 transactions**, which Somnia accepts on mainnet today (verified live by the bot kit's batch demo, `reference/dreamdex-bot-kit/advanced/batch-7702/README.md`) — one signature batching approve+trade from a plain EOA, no smart-wallet infra.

## 4. Reactivity & Somnia Data Streams

Sources: https://docs.somnia.network/developer/reactivity (fetched 2026-08-31); Data Streams SDK guide `https://docs.somnia.network/developer/data-streams/sdk-methods-guide.md` (fetched); https://docs.somnia.network/somnia-data-streams (index); `reference/dreamdex-docs/trading/readme-1/stop-orders.md`.

- **Reactivity** = respond to on-chain events without polling, in two forms:
  - **On-chain reactivity**: persistent event subscriptions stored in chain state; contract handlers execute automatically when matching events commit. Guaranteed, public effects; costs SOMI. This is exactly what powers DreamDEX **stop orders** (the SpotStopOrderRegistry holds a reactivity subscription and its 0.1-SOMI-per-order payment funds the trigger handler — `trading/readme-1/stop-orders.md`).
  - **Off-chain reactivity**: WebSocket push from the node API; nodes can run read-only simulations per event and deliver derived state with the notification. Free of SOMI costs; for UIs, indexers, bots.
- **Somnia Data Streams** — an on-chain data streaming protocol layered on this: register schemas, publish structured data, subscribe in real time. SDK: **npm `@somnia-chain/streams`** (+ viem). Key methods: `set()` (publish streams), `emitEvents()` (off-chain-reactivity events without persisting), `setAndEmitEvents()` (atomic write+broadcast), reads (`getByKey`, `getAtIndex`, `getBetweenRange`, `getAllPublisherDataForSchema`, `getLastPublishedDataForSchema`), `subscribe()` (WebSocket), schema ops (`registerDataSchemas`, `registerEventSchemas`, `computeSchemaId`, `getAllSchemas`). Docs: https://docs.somnia.network/somnia-data-streams (getting-started, "Hello World" app, chat-app tutorial); launched Nov 2025 (GlobeNewswire release). Works against testnet and mainnet RPCs.
- Relevance to us: a hackathon dApp can subscribe to DreamDEX pool events (fills, mark-price updates, EC round events) with push latency instead of polling — and the judges' ecosystem explicitly celebrates this (Somnia ran a dedicated Reactivity hackathon and a Data Streams mini-hackathon: https://blog.somnia.network/p/somnia-reactivity-hackathon-shows, https://blog.somnia.network/p/developers-experiment-with-somnia).

## 5. Oracle explorer (Prophecy Oracle) — prd.oracle.somnia.host

Sources: https://prd.oracle.somnia.host/explore (fetched — it's a JS SPA titled "**Prophecy Oracle**", chain 5031/somnia, with a ⌘K search and an indexer backend); `reference/dreamdex-docs/trading/event-contracts/settlement-and-voids.md`; `developers/event-contracts/market-structure.md`; Prophecy background: https://blog.somnia.network/p/introducing-prophecy-social-prediction-game, https://www.prophecypredict.xyz/.

- Every DreamDEX Event Contract market's **settlement question is public** on this explorer. Per the EC docs: open a question and switch to the **Graph** tab to see the full pipeline for that market — the question as recorded on-chain, **each price source with the value it returned, the median across them, how many sources had to agree, and which side the median landed on** (`settlement-and-voids.md`).
- Deep-link pattern for a specific market: `https://prd.oracle.somnia.host/questions/{oracleQuestionId}?view=graph` (`developers/event-contracts/market-structure.md`). The `oracleQuestionId` comes from the market struct / SDK.
- The oracle stack is "Prophecy" — the same Somnia oracle protocol behind **Prophecy Social** (a prediction game where AI agents pull evidence and reach consensus on-chain, with inspectable resolution receipts). For crypto-price EC questions the sources are price feeds and the resolution is a median, per the EC docs.
- Product idea validated by this: our app can link each market/round to its oracle question graph as a **trust/auditability feature** ("see exactly how this round settled") — zero backend work, just the deep link.

## 6. The official DreamDEX app & Event Contracts UI (what exists, what's missing)

Sources: https://www.dreamdex.io (fetched 2026-08-31); https://app.dreamdex.io/event-contracts (fetched — SPA, only shell renders server-side); `reference/dreamdex-docs/trading/event-contracts.md`, `trading/event-contracts/faq.md`.

**What the official product is:**
- Landing (dreamdex.io) pitches: zero fees (0% maker/taker), yield-bearing CLOB, 10ms execution / 1M TPS claims, "bot-friendly: no rate limits, cli, ccxt, mcp-native", 50 validators / no sequencer. Live stats shown: **$59.5M 30-day volume, 12.9K traders, 3.2M orders filled, $1.2M TVL, 4 CLOB markets**. Roadmap badges: Spot (live), **Event Contracts (live)**, Perpetuals (building), RWAs (planned), Vaults (planned).
- The app shell nav: **Spot / Perps / Event Contracts** primary tabs; Trade, Portfolio, Earn, Docs secondary; wallet connect (Privy smart wallets, email/social login). EC lives at app.dreamdex.io/event-contracts "next to Trade and Portfolio" (`trading/event-contracts.md`).
- EC UI per docs/landing: **BTC and ETH Up/Down markets on rolling 15-minute and 1-hour windows**; pick a side, stake USDso; winning contracts pay exactly 1 USDso; prices come from the live order book ("fair odds, not a house line"); "right pays a fixed payout — wrong costs only your stake, zero fees."

**Admitted/observable gaps (our opportunity):**
- **Volume is not shown in the app.** The FAQ says it outright: "How much volume has a market traded? It is not shown in the app yet, but it is on-chain… every market carries the collateral traded, the number of contracts, and the trade count on its own row" with a one-call recipe to read it (`trading/event-contracts/faq.md`, `developers/event-contracts/recipes.md#read-a-markets-volume`).
- The EC surface is a single trading screen — no market history/leaderboards/social layer/streaks/aggregated stats are documented or marketed anywhere; the oracle audit trail exists but lives on a separate explorer (§5) rather than in-app.
- Analytics primitives exist server-side for **spot** only (`/v0/portfolio`, volume endpoints — see `04-…md` §11.2); nothing equivalent is documented for EC, so any EC analytics/leaderboard product must read chain/SDK data — which is exactly the "analytics tools" category the hackathon suggests.

## 7. dreamBot Builder & Algo Arena

Sources: https://www.dreamdex.io/algo-arena (fetched 2026-08-31); X posts by @SomniaEco (https://x.com/SomniaEco/status/2079861413523165188); `reference/dreamdex-bot-kit/docs/railway.md`.

- **dreamBot Builder** (the "DreamDEX Bot Builder" from the hackathon resources) = a hosted no-code flow at **app.dreamdex.io/dreambot-builder**: pick one of the six bot-kit strategies (starter, market-making, grid, momentum, mean-reversion, TWAP), tune knobs in the UI, and it **generates a ready-to-run env block** — run locally with one command or one-click deploy to Railway (template `https://railway.com/deploy/pE6EIF`). "Your key never touches the site": the `PRIVATE_KEY` line is left blank for the user to fill in Railway variables / locally (`railway.md` documents the exact handoff). It's a config generator over the open-source bot kit, not a separate bot platform.
- **Algo Arena** = the 8-week trading competition it feeds (leaderboard.dreamdex.io; marketing page dreamdex.io/algo-arena): **July 14 – September 7, 2026**, $10,000 USDso total, $1,250/week ($1,000 leaderboard + $250 raffle). Score = Trading Volume × Pair Boost (1.2–1.5× on featured pairs) × Challenges; weekly window Tue 00:00 → Mon 23:59 UTC; wallets must be registered/linked on the leaderboard or their volume doesn't count.
- Relevance: the Builder shows the platform's preferred pattern for shipping consumer automation (config-gen + Railway worker + key never server-side); it's spot-strategy-only today — an **EC-native equivalent** ("pick a signal, auto-trade Up/Down rounds") would be novel.

## 8. Hackathon — extra facts beyond our brief

Sources: DoraHacks listing https://dorahacks.io/hackathon/event-contracts/detail (page blocks fetch; details via search snippets), Eventbrite https://www.eventbrite.com/e/event-contracts-hackathon-tickets-1998344868295 (fetched), `context/00-hackathon-brief.md`.

- Official name "**Event Contracts Hackathon**", run on **DoraHacks** by Somnia × DreamDEX. Eventbrite lists it as Aug 25 – Sep 9 (the DoraHacks countdown said "14 days 18 hours"); our brief says submissions 25 Aug – 8 Sep — treat **Sep 8** from the brief as the safe deadline, with DoraHacks as the submission portal.
- Confirmed framing everywhere: "$5,000 USDso prize pool" + social spotlight / Discord showcase; audience "developers, AI engineers, Web3 builders, trading application teams"; categories = consumer trading apps, AI trading agents, analytics tools, social prediction products, novel EC experiences. Nothing found beyond the brief's judging weights — no hidden tracks or sponsor bounties surfaced.
- Ecosystem context judges will recognize: this is the third in a series of Somnia builder pushes (Reactivity hackathon, Data Streams mini-hackathon — §4), and EC itself launched as DreamDEX's "new Up/Down trading feature". Somnia's blog frames the goal as products "with potential for continued development beyond the hackathon".

## 9. Builder-codes / builder-fee program (can an app earn from routed flow?)

Full mechanics in `04-dreamdex-platform-spot-http-ws.md` §10. Summary + ecosystem view:

- **Live today (spot)**: per-order builder tagging on SpotPool (`approveBuilder` → `placeOrder(..., builder, rate)`), cap read from `getMaxBuilderFeeBpsTimes1k()` (mainnet cap 100 bps = 1%; docs contradict themselves on the testnet cap — read at runtime). Fees accrue to the builder's pool vault balance, withdrawable anytime. SpotRouter has `…WithBuilder` twins (fee charged once, on leg 0). Sources: `reference/dreamdex-docs/developers/http-api/builder-fees.md`, `developers/contracts/functions.md#builder-codes`, `developers/contracts/spot-router.md#builder-attribution`.
- **Event Contracts: not documented.** No builder/attribution mention anywhere in the EC docs (`trading/event-contracts*`, `developers/event-contracts/*` — grepped 2026-08-31); EC runs on the separate BinaryMarketsModule stack. Assume **no builder revenue on EC flow** unless verified on-chain; don't build the business case on it.
- **Coming**: a formal "builder-codes / fee-rebate program" ("apps that route flow get paid") is the *next* roadmap item after v1.0 (`reference/dreamdex-docs/welcome/roadmap.md`) — worth one line in our pitch's sustainability slide ("positioned to monetize via DreamDEX's builder program as it extends").

## 10. Ecosystem cast (who's who around DreamDEX)

- **Somnia** — the L1 (chain 5031/50312); docs https://docs.somnia.network; blog https://blog.somnia.network; explorer links §1.
- **USDso** — Somnia's USD stablecoin by **Frax** (1:1 FraxUSD via LayerZero, mint/redeem vs USDC); quote currency of every DreamDEX spot pair and EC mainnet collateral (`reference/dreamdex-docs/trading/trading.md`, `welcome/making-your-first-deposit.md`).
- **Privy** — smart-wallet provider behind the dreamDEX app login (`welcome/making-your-first-deposit.md`).
- **SomniaLend** (https://app.somnialend.finance/) — ecosystem lending protocol; DreamDEX's Earn tab is a front-end over it (`trading/earn.md`).
- **Prophecy** (https://www.prophecypredict.xyz/) — Somnia's prediction/oracle protocol; its oracle explorer settles DreamDEX ECs (§5); Prophecy Social is its consumer game.
- **somnia-skills** (https://github.com/somnia-chain/somnia-skills) — agent skills (`dex-operator-trading`, `dex-spot-router-interaction`).
- **dreamdex-bot-kit** (https://github.com/somnia-chain/dreamdex-bot-kit, mirrored at `reference/dreamdex-bot-kit/`) — open-source strategy kit behind dreamBot Builder.
- **CCXT fork** — `github:somnia-chain/ccxt#add-dreamdex-exchange` (alpha) (`reference/dreamdex-docs/developers/libraries/ccxt.md`).
- **Hacken** — audited DreamDEX spot (Apr 2026, https://hacken.io/audits/somnia/); **Sherlock** auditing the USDso swap contract (`reference/dreamdex-docs/security/audits.md`).
- **@dreamDEXSomnia** on X; builder desk via https://dreamdex.io (`welcome/roadmap.md`).
