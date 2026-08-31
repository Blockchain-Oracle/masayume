# Somnia × DreamDEX Event Contracts Hackathon — Brief

> Source: hackathon listing text pasted by the user on 2026-08-29. Verbatim facts preserved; commentary marked as such.

## What it is
Build the next generation of prediction-market experiences on **DreamDEX Event Contracts** (binary Up/Down markets on crypto prices, traded on the fully on-chain DreamDEX CLOB on **Somnia**).

Suggested product categories (from organisers):
- Consumer-facing trading applications
- AI-powered trading agents
- Analytics tools
- Social prediction products
- "Entirely new experiences that showcase what can be built with DreamDEX Event Contracts"

## Timeline
| Milestone | Date |
|---|---|
| Registrations open | 18 Aug 2026 |
| Submission window | **25 Aug – 8 Sep 2026** |

(Today is 2026-08-29 → ~10 days left at time of writing.)

## Prizes
- **$5,000 USDso** prize pool (shared)
- Social-media spotlight, showcase to Somnia community, featured in Somnia Discord showcase series

## Eligibility / who they want
Open worldwide, solo or team. Especially: AI/agent web3 devs, trading-app devs, full-stack, product-focused builders. **"We encourage experienced builders to create production-ready applications rather than simple proof-of-concept."**

## What to build — must demonstrate
- A working prototype
- Integration with DreamDEX Event Contracts
- Meaningful use of DreamDEX APIs and/or SDKs
- A clear and intuitive UX
- Potential for user adoption, trading activity, or ecosystem impact

## Submission (each team)
1. Working prototype **on testnet** (Somnia Shannon testnet, chain 50312)
2. GitHub repository
3. 2–3 minute demo video

Optional: presentation deck; **a feedback report on SDK & documentation** (cheap bonus — we should do this).

## Judging criteria (weights)
| Criterion | Weight | What they ask |
|---|---|---|
| Innovation & Originality | 20% | Novel? Creative use of Event Contracts to solve a real problem? |
| Technical Implementation | **25%** | Effective use of Event Contracts + APIs/SDKs; strength/functionality of implementation |
| UX & Design | 20% | Intuitive, accessible, usable; compelling overall experience |
| Business & Ecosystem Impact | 20% | Attract new users; generate trading activity; increase EC adoption; expand DreamDEX ecosystem; sustainable |
| Presentation & Demo | 15% | Problem, solution, product, demo, future vision |

## Developer resources (given)
- DreamDEX Bot Kit — https://github.com/somnia-chain/dreamdex-bot-kit (cloned at `reference/dreamdex-bot-kit`)
- DreamDEX Bot Builder (a hosted "set up your bot" flow — not yet inspected)
- Docs — https://docs.dreamdex.io/developers/event-contracts (mirrored as markdown at `reference/dreamdex-docs/`)
- llms.txt — https://docs.dreamdex.io/llms.txt (mirrored at `reference/dreamdex-llms.txt`)
- Telegram dev community — https://t.me/+XHq0F0JXMyhmMzM0
- Testnet gas token: **STT** (request from Somnia testnet faucet; see `05-somnia-network.md`)

## About the organisers
- **Somnia**: high-performance EVM-compatible L1. Mainnet chain 5031, Shannon testnet chain 50312.
- **DreamDEX**: fully on-chain CLOB on Somnia (spot + event contracts), zero fees, USDso settlement, "agents-first".

## Reference product (user's direction)
- **Yosuku** — https://yosuku.xyz / https://github.com/Cybire1/yosuku (cloned at `reference/yosuku`). A consumer layer for *DeepBook Predict* on **Sui**. The user's intent: fork/revamp the feature set and product ideas for DreamDEX Event Contracts on Somnia, with a cleaner architecture and additional features. See `10-yosuku-overview.md` and `20-feature-map-yosuku-to-dreamdex.md`.

## Commentary (mine, not from the brief)
- Technical Implementation is the heaviest single criterion and explicitly rewards **SDK depth** → use `@somnia-chain/markets-sdk` broadly (realtime watches, hooks, trader tier, history surface, resolution audit links).
- "Generate trading activity" + "attract new users" (20%) → a consumer front-end with sponsored/simplified onboarding and a social loop scores directly on this.
- The optional **SDK/docs feedback report** is a low-cost differentiator that signals a serious builder.
