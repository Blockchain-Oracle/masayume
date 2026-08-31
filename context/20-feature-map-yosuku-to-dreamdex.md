# Feature Map — Yosuku → DreamDEX Event Contracts

> Synthesis of docs 01–15. For each Yosuku feature: the verdict for our build (KEEP ≈ port nearly as-is · ADAPT ≈ same idea, new mechanism · DROP · NEW ≈ ours, no Yosuku equivalent), and the exact DreamDEX/Somnia mechanism. Ordered by build priority, not by Yosuku's structure. Sources: port-worthiness ranking (`11-…` §end), adapter classification (`12-…` §end), component tags (`13-…`), guarantees table (`14-…` §11), route priorities (`15-…` §6).

## Tier 1 — the product core (build first)

| Feature | Verdict | DreamDEX mechanism |
|---|---|---|
| Markets screen: cadence rail + hero chart-as-ticket + live odds + countdown | **KEEP** (~80% chain-agnostic) | `client.listLiveBinaryMarkets` + `getBookTops`/`getOpeningPrices` (batch), `useLiveBinaryOrderBookByMarket` (recycle-safe watch), `watchPrice` for underlying spot (testnet feed bundled). Odds come from the real book, not a house dry-run — simpler than Yosuku. |
| One-tap UP/DOWN bet with stake-first sizing | **KEEP/ADAPT** | `quoteBinaryStake(stake)` → shares+limit → `trader.placeOrder` IOC (or unified `createOrder` with walletClient). Port `ticket624.core.ts` sizing/slippage-caps math almost verbatim (prices are already probabilities). Mandatory `expireTimestampNs`; skip windows past headroom (`intervalSec*0.4`). |
| Wallet & onboarding: no seed phrase, gasless | **ADAPT** | wagmi/RainbowKit or Privy embedded wallets (DreamDEX itself uses Privy smart wallets); SDK takes viem `walletClient` via `setSigner`. Gasless: ERC-4337 EntryPoint v0.7 on testnet / EIP-7702 batching / relayer with Onara-style per-selector policy files; SDK's `signRedeemAuth`/`redeemFor` gives gasless claims out of the box; `build*` verbs return unsigned calls for AA. Never sponsor capital intake (Yosuku's gas-farming lesson). |
| In-contract faucet UX ("test money finds you") | **KEEP** | tUSDC `faucet(uint256)` ≤10k/call — `trader.faucet()`. One-tap in-app; no external page. |
| Claim winnings + auto-sweep | **ADAPT (better here)** | `getClaimable` → `redeemMany` batch; voids redeem both sides at 0.5 (explicit `outcomeIdx`). A "Claim all" plate + background nudge = retention feature the official app lacks. |
| Portfolio: one-number BalancePlate + positions + history | **KEEP** | `getOpenPositionsWithPnL` (batched), `listPastBinaryMarkets` + `getBinaryPositionPnL`, `getUserFills`. Port `useMoney` single-hook architecture + FIFO PnL engine + settled/cashed-out/liquidated honesty labels. |

## Tier 2 — the memorable surfaces (demo shape)

| Feature | Verdict | DreamDEX mechanism |
|---|---|---|
| `/reels` TikTok-style vertical feed (markets ⨯ community takes) | **KEEP** (almost pure front-end) | Same data as Tier 1; takes in a plain DB table (Walrus → drop). scroll-snap + canvas chart port as-is. Testnet's 60s/5m/10m cadences make the feed *fast* — a card settles during the demo video. |
| Post-a-take composer ("your prediction is the post") | **ADAPT** | DreamDEX has no user strikes — a take = side + confidence + window + optional backing order. **Because two buy-sides cross via mint-a-pair, a take at p can literally rest as a Buy order at p — a social post that IS liquidity.** `TakePosted` event or DB row; `hasBet` gating from fills. |
| Provably-fair receipts (`TradeReceipt`, ProofRecord, `/stats`) | **KEEP + NEW** | Somnia explorer links per tx + **oracle deep-link `prd.oracle.somnia.host/questions/{oracleQuestionId}?view=graph`** per settlement (docs explicitly invite building this). `/stats` reads chain aggregates. Cheap, disproportionate judge credibility. |
| Verdict/settle moment (SettleClock, Verdict, win/loss share cards) | **KEEP** | `getMarketResolution` (`openingAnswer` vs `closingAnswer` numericValue), canvas share-card renderers port verbatim. |
| Leaderboard (banzuke) + badges + trader-edge page | **KEEP** | Rebuild aggregation on `getUserFills`/finalized markets (indexer) or `eth_getLogs`; port FIFO lot-matching engine + `traderEdge729` stats + the 5 cache-honesty rules (incl. "synthesize never-emitted losing redemptions"). |
| Landing page (dial hero, sticky features, manifesto) | **KEEP** | Chain-agnostic; swap data + spec table. Legacy DART kit = parts bin. |

## Tier 3 — differentiators (pick deliberately, don't do all)

| Feature | Verdict | DreamDEX mechanism |
|---|---|---|
| Sensei AI assistant (read + the Brake) | **KEEP + upgrade** | System prompt ports verbatim (`15-…` quotes it). **Upgrade: back it with the bot-kit oracle-follow fair-value model** (`03-…` §4: realized vol, z = moneyness/(vol·√T), P(up)=0.5+0.5·tanh(√(2/π)z), edge band) so the "read" is quantitative, not vibes — LLM explains the model's numbers. Memory: any KV. |
| No-divert agent custody (`EventVault`) | **ADAPT** | Solidity per-user ledger vault: `subscribe(agent, caps)`, `agentTradeFor` (beneficiary hard-wired, caps enforced), owner-only withdraw, permissionless `crankSettle`. Vault becomes the operator of its own market account via `OperatorPermissionsRegistry`/`placeOrderFor` (spot) or simply holds/trades via SDK ABIs for EC. `viem-session-account` pkg is a candidate. This is the enabling contract for strategies/copy/trade-from-X. |
| Agent strategies marketplace + copy trading | **ADAPT (scope!)** | Grants table in EventVault + strategy registry (fee → grant in one tx). Keep the verification-ladder *language* (Draft→Paper→Verified→Live) and decision-envelope contract from `AI_STRATEGY_MARKETPLACE_PLAN.md`; ship 1–2 house strategies (wrap bot-kit ec-maker/oracle-follow as runners) rather than full creator self-serve. |
| Streak parlays | **ADAPT (improved)** | Port `parlay624` → Solidity `ParlayReserve` over window outcomes: escrow full max payout at open, combined prob ⨯ correlation surcharge (λ=0.40 same-expiry) ⨯ margin floor, permissionless leg resolution reading the market's own settlement, early-kill, claim force-pays owner. **EVM improvement: read leg probs from CLOB mid at open** (Yosuku trusted client input). |
| Trade-from-X | **ADAPT-lite or cut** | Full X relay = highest infra cost. EVM simplifies auth (ecrecover vs zkLogin). If cut, **keep the capability-receipt UX + custody-rail SVG** to explain agent permissions. Alternative distribution: Telegram bot (hackathon TG community!) — same bounded-executor vault, cheaper rail. |
| Bet-gated rooms / comments | **KEEP-lite** | `hasBet` from fills + small chat backend; `CommentRoom` component is 100% presentational. |
| Waitlist + referral | **KEEP** | 30-line contract + sponsored gas. |

## Drop list (with reasons)
- **Leverage desk, lending pool, liquidations** — second product; EC is already capped-risk by design (its selling point). If a "boost" is ever wanted: the `underwrite` premium model, not margin.
- **TEE/Nitro attestation** — replace with operator key + EIP-712 per-action sigs (digest bound to exact params, nonce+TTL); keep the audit-trail events.
- **Full privacy / private bets** — link-reduction only anyway; not judged here.
- **CCTP / Solana / BTC onramp, SuiNS, Seal/Walrus stack, zkLogin recovery** — chain-specific rails with no Somnia counterpart needed on testnet.
- **SVI pricing / strike curves / range-digital math** — DreamDEX prices ARE probabilities; whole layer vanishes (this is a *simplification win*).
- **Legacy gen-1 components** (`@ts-nocheck` seven) and `components/landing/` DART kit (parts bin only).

## NEW opportunities Yosuku couldn't have (our edge)
1. **Order-book-native features**: depth display, limit "set your own odds" orders (post-only), maker rebate-free quoting, **quote-both-sides-with-zero-inventory** market-making for our own liquidity, order expiry as auto-cancel. Yosuku's venue had no book.
2. **Oracle transparency UI**: per-round resolution graph deep-links; "audit this settlement" button. Docs invite it; nobody has built it.
3. **Volume/analytics surfaces**: per-market `cumulativeQuoteVolume`/`tradeCount` are on every row and the official app doesn't show them (FAQ admits it). History survives settlement (full tape+candles+orders) → market history explorer, calibration charts ("when the crowd said 70%, it happened 68%").
4. **Session-key trading** (`viem-session-account` / OperatorPermissionsRegistry): tap-to-trade without per-order wallet popups — the CEX-feel judges will notice.
5. **Somnia Data Streams / reactivity** (`@somnia-chain/streams`, SDK `/reactivity` subpath): push-based live UI + "uses the chain's signature feature" judging angle.
6. **EC-native auto-trader**: dreamBot Builder is spot-only today — an EC strategy runner with consumer UX is genuinely novel in this ecosystem.
7. **Builder-fee readiness**: builder codes live on spot (≤1%), EC attribution unverified — design order flow so a builder tag can be added; mention in "sustainability" pitch either way.

## Cross-cutting disciplines to adopt wholesale
- Honest-state UX: disabled looks disabled; empty states explain; retired routes redirect; blocker-string-as-CTA-label; success green / blocked grey; direction colors reserved for P&L; vermilion-style single accent (pick ours).
- "The price of a question may move; the question may not" (pin market identity by `marketId`).
- Zod at every money-path boundary; null≠0 for failed reads (keep last-good); TTL+in-flight-dedup caches; visibility-gated polling; one order-builder module (no duplicated tx-build chains).
- "Liveness never becomes custody": permissionless fallback for every keeper step.
- Judge-proofing: zero-env runnable clone; `/dev` fixture pages for every card/receipt state; every claim → explorer link; honest-limitations section in README; SDK feedback report (submission bonus).
