# Context Knowledge Base — Somnia × DreamDEX Event Contracts Hackathon

Research memory for this project. **Read this first in any new session/agent.** Everything here was produced by reading the actual sources end-to-end; each doc cites its sources (file paths under `../reference/` or URLs).

## The mission (one paragraph)
Build a production-quality consumer prediction-market app on **DreamDEX Event Contracts** (binary BTC/ETH Up/Down windows on Somnia's fully on-chain CLOB, zero fees, oracle-settled) for the hackathon (submission window ends **8 Sep 2026**; testnet, chain 50312). Direction: take the feature set and product thinking of **Yosuku** (a Sui/DeepBook Predict consumer layer — TikTok-style feed, one-tap gasless bets, social takes, predict-from-X, agent strategies, AI assistant, parlays) and rebuild it *our way* on the DreamDEX stack via `@somnia-chain/markets-sdk`, plus our own features.

## Files
| File | What's in it |
|---|---|
| `00-hackathon-brief.md` | The hackathon rules, dates, judging weights, submission requirements, resources |
| `01-dreamdex-event-contracts.md` | **The core protocol doc**: market structure/lifecycle, one-book-two-sides, mint-a-pair, escrow, settlement rail + oracle explorer, addresses/networks/venue ids, SDK tiers, the 14-item gotcha canon, ec-core wrapper map, product implications |
| `02-markets-sdk-api.md` | Full `@somnia-chain/markets-sdk` 0.28.x API reference (unified/client/trader tiers, watches, hooks, types, ABIs, wallet-signer story) |
| `03-dreamdex-bot-kit-strategies-and-tools.md` | The 6 ec-* strategies dissected, oracle-follow fair-value model formulas, LLM/ensemble patterns, ec-doctor/ec-test, edge analytics, deployment |
| `04-dreamdex-platform-spot-http-ws.md` | Everything non-EC: spot CLOB, HTTP API (SIWE auth, endpoints), WebSocket channels, order types, fees, session keys/operators, builder fees, audits, EIP-7702 batching |
| `05-somnia-network-and-ecosystem.md` | Somnia network facts (RPCs, faucets, STT), AA/sponsorship options, reactivity, oracle explorer, review of the official EC app, Bot Builder, builder-code program |
| `10-yosuku-overview.md` | Yosuku in one page: positioning, feature inventory, the README patterns worth copying (proven-on-chain receipts, honest limitations, sponsor-stack table) |
| `11-yosuku-frontend-routes-and-ux.md` | Every route/screen + user flows + port-worthiness ranking |
| `12-yosuku-data-layer.md` | The ~95 lib modules: market/round model, PnL, leaderboard, alerts, parlays, money rails; portable-vs-adapter classification + proposed chain-adapter interface |
| `13-yosuku-components.md` | ~100 UI components inventory with portability tags + design-system notes |
| `14-yosuku-contracts-and-services.md` | The 10 Move packages (no-divert vault, parlay, margin desk, trading vault, strategy market, attestation), executor service, gas sponsorship; EVM equivalents |
| `15-yosuku-api-routes-and-backend.md` | All ~36 API routes, the trade-from-X / private-bet / Sensei flows, env inventory, portfolio spec summary |
| `20-feature-map-yosuku-to-dreamdex.md` | Feature-by-feature port map (keep/adapt/drop/new) with the DreamDEX mechanism, drop list, NEW opportunities, cross-cutting disciplines |
| `30-ideas-and-direction.md` | Direction proposal: thesis, recommended MVP, stretch options A–D, architecture, open decisions, deadline plan |

## Reference folder (`../reference/`)
- `yosuku/` — full clone of the reference product (Sui). Point at real code, e.g. `reference/yosuku/components/TakeComposer.tsx`.
- `dreamdex-bot-kit/` — official bot kit; `packages/ec-core/src/` is the canonical "how to talk to EC correctly" code; `skills/` contains agent skills (dreamdex-bot, somnia).
- `dreamdex-docs/` — full markdown mirror of docs.dreamdex.io (re-fetch any page: append `.md` to its URL; ask questions via `GET <page>.md?ask=<question>`).
- `dreamdex-llms.txt` — docs index.
- `markets-sdk/package/` — extracted `@somnia-chain/markets-sdk` 0.28.1 npm package (read the real types/source here).

## Ground rules distilled (do not violate)
1. EC has **no REST API** — everything goes through `@somnia-chain/markets-sdk` (indexer GraphQL + RPC) or raw contracts via its exported ABIs.
2. Gate every write on `getMarketOnchain(marketId).status === 1`; the indexer lags seconds.
3. Key ALL state by `marketId`/symbol — pools are recycled across windows.
4. Winnings are claimed, not received: sweep `listBinaryMarkets({venueId, status:"Finalized"})` and redeem with explicit `outcomeIdx` (voids pay both sides 0.5).
5. Testnet collateral = tUSDC (6 dp, `faucet(uint256)` ≤10k/call); mainnet = USDso (18 dp). Derive decimals from chain. Gas: STT (testnet) / SOMI.
6. Orders: mandatory future `expireTimestampNs` (ns) ≤ market expiry; IOC for takers; post-only reverts `PostOnlyWouldCross` (routine — requote); skip windows without headroom (`intervalSec*0.4`, 30–300s).
7. Prices are YES probabilities in (0,1); NO = 1 − YES; two Buy orders on opposite sides can match (mint-a-pair) → you can quote both sides with zero inventory.
8. Set `VENUE_ID` explicitly (testnet `0x679795…8a28c` as of Aug 2026 — it MOVES; read off a live market row when in doubt).
9. One signing key = one writer (nonce racing); claim inside the same loop.
10. `assertTxOk` every trader-tier write; unified-tier receipts live on `order.info`.
