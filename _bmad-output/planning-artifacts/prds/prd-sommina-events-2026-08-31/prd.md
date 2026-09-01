---
title: Masayume
status: final
created: 2026-08-31
updated: 2026-09-01
---

# PRD: Masayume (正夢)

*A consumer prediction-market app on DreamDEX Event Contracts (Somnia Shannon testnet), built for the Somnia × DreamDEX Event Contracts hackathon.*

## 0. Document Purpose

This PRD is the product contract for Masayume, written for the downstream BMad workflows (UX design, architecture, epics & stories, build) and for the builder (Abu). It distills an already-completed discovery phase: the research knowledge base in `context/` (hackathon brief `00`, protocol docs `01–05`, Yosuku reference analysis `10–15`, feature port map `20`) and the locked direction decisions in `context/30-ideas-and-direction.md`. It does not duplicate those documents — `addendum.md` carries the technology choices, mechanism detail, and source citations; FR bodies stay behavioral. Vocabulary is Glossary-anchored; FRs are globally numbered and nested under features (numbers are stable identifiers, not positions — late-added FRs keep their issued number, e.g. FR-40 in §5.5); inferences carry inline `[ASSUMPTION]` tags indexed in §15.

## 1. Vision

DreamDEX Event Contracts are an honest primitive with no consumer layer. Binary Up/Down markets on BTC/ETH trade on a fully on-chain CLOB with (currently) zero fees, full collateralization, and keeperless oracle settlement — and the official app is a single trading screen that shows no volume, no history, no social anything, while every sharp edge of the protocol (winnings must be claimed, windows expire and respawn, pools are recycled) is passed straight through to the user. **A primitive is not a product.**

Masayume (正夢 — "a dream that comes true") is the consumer and agent layer for that primitive: a fast, dark, mobile-first app where live price windows scroll past like a feed, a bet is one tap and a stake amount, every settlement carries an on-chain audit receipt one tap from the oracle's own resolution graph, and an AI copilot named Baku gives you a quantitative read — including, crucially, when *not* to bet. Wins stamp **正夢 masayume** ("it came true"); losses stamp **逆夢 sakayume** ("a dream that didn't"). Bounded agents can trade for you from a vault that structurally cannot pay anyone but you.

The product thesis is the venue's own thesis, taken seriously: Somnia calls itself "the Agentic L1" and DreamDEX calls itself "agents-first," yet no EC-native consumer or agent experience exists. Masayume is designed to demonstrate — to users, to judges, and to the ecosystem — what the primitive becomes when someone builds the product on top of it.

## 2. Why Now

Timing is load-bearing three ways:

1. **The hackathon window.** Submission closes 8 Sep 2026 (Somnia Shannon testnet, chain 50312). Judging weights: Technical Implementation 25%, Innovation 20%, UX 20%, Ecosystem Impact 20%, Demo 15%. Organizers explicitly ask for "production-ready applications rather than simple proof-of-concept."
2. **The gap is documented, not speculative.** DreamDEX's own FAQ admits volume is not shown in the official app; no EC analytics endpoints exist; the oracle audit trail lives on a separate explorer nobody surfaces in-product. Every one of those is a product opening this PRD claims.
3. **Testnet cadence is a demo gift.** Testnet windows run as short as 60 seconds — a market can open, trade, settle, and pay out *during a 2–3 minute demo video*. That collapses the hardest problem of demoing a prediction market (waiting for resolution) into a feature.

## 3. Target User

### 3.1 Jobs To Be Done

- **Functional:** "Let me take a position on BTC/ETH direction in seconds, with capped downside, and actually collect when I win."
- **Emotional:** "Make the win *feel* like something — a verdict, a stamp, a receipt — not a silent balance change."
- **Social:** "Let me post my call where others can see it, back it with real money, and let someone take the other side."
- **Trust:** "Prove to me the game isn't rigged — show me the oracle's sources, the settlement tx, the un-fakeable numbers."
- **Protective:** "Stop me from tilting. Tell me when the smart move is to sit out."
- **Delegation:** "Let a strategy trade for me within hard limits I set, with a structural guarantee it can't steal."
- **Evaluative (judges):** "Let me clone it, run it with zero setup, verify every claim on-chain, and see the whole loop live."

### 3.2 Non-Users (v1)

- Leverage seekers and margin traders — Event Contracts are fully collateralized by design; max loss = stake. That *is* the product's safety story, not a gap.
- Users needing anonymity — takes and positions are public on-chain; we offer no privacy layer.
- Mainnet/real-money users — v1 is Somnia Shannon testnet only (tUSDC).
- Market creators — users trade windows the venue lists; they do not author markets.

### 3.3 Key User Journeys

*Named-persona narratives, numbered UJ-1…UJ-9. FRs reference these inline.*

- **UJ-1. Dayo goes from zero to a claimed win in one sitting.**
  Dayo, a crypto-curious dev with MetaMask but no Somnia history, lands on the app from the hackathon Discord. He taps **Connect**, and a one-click "Add Somnia Shannon" prompt configures the network. The app sees he has no tUSDC and offers the in-app Faucet — one tap mints test collateral to his wallet ([ASSUMPTION: he has or obtains STT gas via the linked Somnia faucet; the app detects a zero-STT wallet and links him there before any signing]). The Markets screen shows the live BTC 5-minute window as a hero chart with a countdown and live cent odds. He types a 10 tUSDC stake, taps **UP**, confirms one transaction, and watches the chart against the frozen opening-price line. At expiry the Verdict moment plays: **正夢 masayume — it came true.** A claim plate shows his winnings; he taps **Claim all**, and the success card links the settlement tx and the oracle's resolution graph. **Edge case:** if his order can't fill at his quoted odds (book moved), the ticket re-quotes and shows the new cost before placing — it never silently fills at a worse price beyond the displayed cap.

- **UJ-2. Ada scroll-bets from the feed on her phone.**
  Ada, a Polymarket user bored on a commute, opens `/reels`. Full-screen cards snap past: a live ETH 60-second window with a countdown, then a community take ("UP 72% — funding flipped"), then the next window. She taps **DOWN** on a card, sizes the pre-filled stake, and — having enabled tap-trading earlier — the bet places with no wallet popup ([ASSUMPTION: session-key trading is enabled in a prior explicit grant step with visible caps]). Two cards later she taps **take the other side** on someone's UP call. The bet settles while she's still scrolling; the win stamp appears on the card in place. **Edge case:** a card whose window has entered its no-entry buffer shows "Between rounds" with the next window pre-armed — the tap is never a dead click.

- **UJ-3. Tunde tries to prove it's rigged, and fails.**
  Tunde, a DeFi skeptic who assumes every hackathon app fakes its numbers, hits `/stats`. Every metric — markets settled, volume, unique wallets — is paired with the on-chain query that produced it. He opens a settled round's Receipt: entry fill tx, settlement tx, and a deep link into the oracle resolution graph showing each price source, values, the median, and the quorum that resolved the round. He clicks through three receipts. **Climax:** he can't find a number the chain doesn't back. **Resolution:** he posts the receipt link instead of a callout.

- **UJ-4. Maria meets the Brake.**
  Maria has lost four 60-second windows in a row and is re-staking bigger each time, firing rapid questions at Baku. Baku's quantitative read shows a fair value inside the disagreement band — no edge — and the anti-tilt layer notices the loss streak, stake escalation, and rapid-fire pattern. Instead of a trade idea it answers: *"You're chasing. Model says no edge here. Sit this window out."* Her daily-loss stop is two losses away; the ticket shows it. **Edge case:** if she hits the daily stop, the ticket refuses new entries until midnight with an honest label — the disabled control looks disabled and says why.

- **UJ-5. Kenji reads his own edge.**
  Kenji, a data-driven trader, opens Portfolio after a week of betting. One number — his spendable balance — heads the page. Open positions show live PnL against current book marks; history rows are honestly labeled (settled at oracle / closed early / voided). He taps **Claim all** to sweep three finalized wins and one void (both sides paid at 0.5). On the Edge tab: ROI, profit factor, expectancy, max drawdown, an equity curve, and a one-sentence readout that refuses to claim a pattern before 5 settled rounds. He exports CSV for his own spreadsheet.

- **UJ-6. Lara rides a streak parlay.**
  Lara wants one ticket that says "BTC up this window AND ETH up this window." The parlay builder prices each leg from the live book mid, shows the combined probability with the correlation surcharge applied, and quotes stake → max payout. On open, the full max payout is escrowed — the slip literally says *"your payout is already locked in the contract."* First leg settles UP: the slip advances. **Climax:** second leg settles UP; she claims; the pre-funded escrow pays in full. **Edge case:** had a leg lost, the ticket dies instantly at the first losing settlement — no zombie hope, and the slip says exactly which leg killed it.

- **UJ-7. Sam lets an agent trade — and verifies it can't steal.**
  Sam likes the "Oracle-Follow" house strategy's record but doesn't trust agents. The strategy card links a **verify** view: the vault contract's rule that any position an agent opens is hard-wired to the depositor, withdraw pays only the owner, and settlement cranking is permissionless. He deposits 50 tUSDC, sets caps (max stake per trade, max daily spend, max open positions), and subscribes. He watches the runner's trades appear in his own portfolio. A week later he pauses the strategy; open positions remain his. **Edge case:** if the runner goes offline mid-window, anyone (including Sam) can crank settlement — liveness never becomes custody.

- **UJ-8. Nia bets from the group chat.**
  Nia lives in the hackathon's Telegram community. She DMs the Masayume bot, links her account, and gets a capability receipt: **CAN** place bets from her vault balance within her caps; **CANNOT** withdraw, change caps, or pay anyone but her. Having funded her Vault from the web app earlier, she types `bet 5 btc up`, the bot confirms the window, odds, and cost, places the bet from her vault, and posts the verdict with the receipt link when the window settles. **Edge case:** a message that would exceed her caps is refused with the specific cap named; an unfunded-Vault bet request is refused with a deposit link (the Executor spends only Vault balance).

- **UJ-9. A judge evaluates the whole loop in ten minutes.**
  A judge clones the repo. It runs with zero env configuration against testnet defaults. The README opens with the one-line pitch, a proven-on-chain section where every claim links a real tx, and an honest-limitations section. `/dev` fixture pages show every card, receipt, and modal state without needing live money. They watch the demo video: a bet placed, settled by the oracle, and claimed — live, in under three minutes. They check `/stats` and the numbers match the chain.

## 4. Glossary

*Downstream artifacts use these terms verbatim.*

- **Market** — one binary Up/Down Event Contract question on an asset's price over one Window, identified by `marketId`. Only a Market in Trading status accepts orders.
- **Window** — a Market's fixed lifespan (testnet cadences observed: 60s / 5m / 10m, plus a daily BTC↔ETH series; mainnet 15m / 1h). Markets die on schedule and respawn; a successor window auto-rolls.
- **Cadence** — a Window duration class (e.g., "5m"). The Markets screen groups live Markets into cadence lanes.
- **Side** — UP or DOWN. Prices are UP-probabilities in (0,1); DOWN price ≡ 1 − UP price.
- **Odds** — the display form of price: cents per $1 payout, clamped to [1, 99]. Odds come from the real order book, never estimated.
- **Stake** — the tUSDC amount a user commits. Stake-first sizing: user enters Stake; the system derives contracts. Max loss = Stake, always.
- **Ticket** — the bet-entry surface (stake input, side, quoted cost/payout, guards). A Ticket that can't act says why on the control itself.
- **Mint-a-pair** — the venue matching a Buy UP with a Buy DOWN by minting a fresh pair from combined collateral. Consequence: a backed Take can rest as a real order without any counterparty inventory.
- **Settlement** — the oracle answering a Market's question at expiry via the venue's keeperless rail; resolution and finalization happen on-chain and redemption opens immediately.
- **Claim** — redeeming winnings after Settlement. Winnings are claimed, not received: a winning position pays 1 tUSDC per contract **less the on-chain settlement fee (currently 0 — read from chain, never assumed)** only when redeemed. The Claim-all plate sweeps everything claimable.
- **Void** — a Market with no reliable settlement price; both Sides redeem at 0.5, and claiming a void requires redeeming each side explicitly.
- **Verdict** — the settlement moment in the UI. Win stamps **正夢 masayume**; loss stamps **逆夢 sakayume**; void stamps its own honest state.
- **Receipt** — the provable record of a round: fill tx link(s), settlement tx link, and the Oracle Graph deep link.
- **Oracle Graph** — the venue oracle explorer's per-question resolution view (sources, values, median, quorum), deep-linkable per Market.
- **Take** — a public post: Side + confidence + Window + optional caption (≤240 chars), optionally **backed** by a resting order at the stated probability. Backed Takes carry an on-chain-verifiable badge in two states — resting and filled (FR-14).
- **Reel** — one full-screen card in the vertical snap feed: a live Market card or a Take card.
- **Baku (獏)** — the copilot, named for the dream-eating spirit. Gives a Read; enforces the Brake; remembers context per user.
- **Read** — Baku's structured answer: a Side or *sit out*, one honest reason, and the risk that proves it wrong — grounded in the Fair Value model's live numbers, never invented.
- **Fair Value** — the model's P(up) for a Window (realized-vol + momentum + tanh-shaped z-score), with **Tilt** = Fair Value − book mid, an **edge floor** below which no trade is suggested, and a **disagreement ceiling** above which the model distrusts itself.
- **Brake** — the copilot layer allowed to say "don't bet": detects tilt patterns (loss-streak + stake escalation + rapid-fire prompting) and enforces the Daily Stop.
- **Daily Stop** — a per-wallet max daily loss, authoritative server-side; when hit, every betting surface refuses new entries until midnight (user-local) reset.
- **Vault** — the EventVault contract: per-user balance ledger from which a subscribed Strategy may open positions whose beneficiary is hard-wired to the depositor. Withdraw pays only the owner. Settlement cranking is permissionless. *(Ours — not the venue's per-pool vault balance, a protocol payout-fallback pool that normally reads 0; the two must never be conflated in UI or docs.)*
- **Strategy** — a named trading policy (v1: house-run) users subscribe Vault funds to, within Caps.
- **Caps** — per-subscription hard limits: max stake per trade, max daily spend, max open positions.
- **Runner** — the off-chain service executing a Strategy through the Vault.
- **Parlay** — a multi-leg all-or-nothing ticket across Markets. The Reserve escrows the full max payout at open; the first losing Leg kills the ticket instantly; Legs resolve permissionlessly from each Market's own Settlement.
- **Leg** — one Market+Side inside a Parlay.
- **Reserve** — the ParlayReserve contract holding the escrowed payout.
- **Executor** — the bounded server-side agent that places Telegram-originated bets from a user's Vault, holding no withdrawal power.
- **Capability receipt** — the explicit CAN / CANNOT list shown when a user grants any delegated power (Executor, Strategy, session key).
- **Session key** — a scoped, expiring signing grant enabling tap-trading without per-order wallet popups, bounded by caps and revocable.
- **Banzuke** — the leaderboard: traders ranked by exact realized PnL (FIFO lot-matching), with badges.
- **tUSDC** — testnet collateral token, 6 decimals, in-contract faucet (≤10,000/call). **STT** — testnet gas token. (Mainnet: USDso 18 decimals / SOMI — out of scope v1.)
- **Fixture pages** — `/dev` routes rendering every card/receipt/modal state from canned data, for judges and development.

## 5. Features

### 5.1 Onboarding & Wallet

**Description:** A first session must go connect → funded → first bet with no external documentation. Wallet connect includes one-click network add. Test money finds the user: the collateral faucet is in-app, and a gasless claim path exists so winnings are never stranded behind an empty gas tank. Realizes UJ-1. The "no seed phrase" feel comes from removing friction (faucet, gasless claims, session keys, one-click network) rather than from embedded-wallet infrastructure (see addendum: Privy rejected).

#### FR-1: Wallet connect with one-click network setup
A visitor can connect an EVM wallet and add/switch to Somnia Shannon in one prompt. Realizes UJ-1.
**Consequences (testable):**
- A wallet with no Somnia Shannon network configured reaches a connected, right-network state in ≤2 prompts from tapping Connect.
- A connected wallet on the wrong chain sees a blocking, honest state naming the fix — every write path is disabled until the chain matches.

#### FR-2: In-app faucet
A connected user with low/no tUSDC can mint test collateral in-app. Realizes UJ-1.
**Consequences (testable):**
- One tap requests tUSDC from the token's own faucet (≤10,000 per call); balance updates without page reload.
- A wallet with zero STT is detected before any signing attempt and routed to STT with an explanation — a user funded in tUSDC but out of gas never hits a raw revert. The faucet routing lists fallback faucets (the official one being down during judging is a real failure mode). [ASSUMPTION: v1 routes to external STT faucets; a relayer dust-drip behind the §12 anti-farm gates is Open Question 11.]
- ERC-20 approvals follow one law across every spender (venue module, Vault, Reserve): the first interaction with a new spender absorbs its approval into that action's confirm step with one honest sentence, and a later action exceeding the remaining allowance absorbs the re-approval the same way (pre-checked before send) — never a surprise mid-flow signature.

#### FR-3: Gasless claim path
A user can claim winnings without spending gas. Realizes UJ-1, UJ-5.
**Consequences (testable):**
- A user signs a redeem authorization; a relayer submits and pays gas; the payout lands in the user's wallet.
- Sponsorship covers claims (redeems) plus explicitly listed zero-capital-intake actions (the waitlist join, FR-39) — and never capital intake (deposits, bets, Vault funding). Selling a position back into the book (FR-40) is *not* sponsorable: it requires an order signature only the user can hold, and SM-C2's no-custodial-shortcuts rule forbids the workaround. Each sponsored flow has its own per-function allowlist (NFR-7).

#### FR-4: Session-key tap-trading
A user can explicitly enable tap-trading: subsequent bets within caps place without per-order wallet popups. Realizes UJ-2.
**Consequences (testable):**
- Enabling shows a capability receipt (scope, caps, expiry) and requires one explicit signature.
- With tap-trading active, a bet from tap to submitted order requires zero wallet prompts; exceeding any cap falls back to a normal wallet prompt.
- The grant is revocable in one tap and expires on its own. *(Mechanism resolved by architecture AD-5: session-key tap-trading IS a Vault SESSION grant to a browser-held key — the venue-native operator route is not used. Tap-trading money therefore lives in the Vault by design, the enable flow composes deposit + grant, session-mode tickets size and label against Vault balance, and Portfolio presents it per FR-5's labeled-pools rule.)*

#### FR-5: Honest money display
The app shows one spendable balance number and never fabricates values. Realizes UJ-5.
**Consequences (testable):**
- A failed balance read renders last-known-good with a stale indicator — never 0, never a spinner that lies.
- Distinct pools (wallet, Vault, order escrow, and the venue's per-pool vault balance — which buys spend **from** *first* when nonzero) appear as labeled rows, never silently summed; a buy never quietly spends from a pool the UI hasn't shown. Normal bets draw from the **wallet**; the Vault funds all delegated trading (Strategies, Executor, and session-key tap-bets — AD-5). The headline "spendable" number is wallet balance. *(Stated divergence from the reference's single prefunded trading balance: EC bets settle to the wallet naturally, so wallet-first is the honest pool structure here — but the multi-pool reality must never leak into the headline number.)*

### 5.2 Markets Loop

**Description:** The core screen: cadence lanes of live Markets, a hero Market as chart-and-ticket in one, stake-first betting with every protocol sharp edge absorbed by guards, the Verdict moment, and the Claim-all plate. Odds always come from the real book. Realizes UJ-1.

#### FR-6: Live market browser with cadence lanes
A user can browse all live Markets grouped by Cadence, with lanes derived from live market rows (never hardcoded). Realizes UJ-1.
**Consequences (testable):**
- Lanes render from the distinct `intervalSec` values of live venue Markets; a cadence with no live window shows a "Between rounds" placeholder with the next window's start, never an empty gap — and the copy handles gaps from seconds to a day (a daily cadence exists).
- A user's chosen cadence stays pinned; the UI never auto-reverts it.
- Every Market row shows live volume and trade count (the numbers the official app hides).
- A plain-words view restates each live Market as a yes/no question ("Will BTC finish this 5-minute window above $64,120?") with Yes/No taps deep-linking into the Ticket (FR-7) — phrasing derived from `asset` + `intervalSec` + opening price, never parsed from question text.
- v1 lists only up/down Markets (`strike == 0`); a fixed-strike Market appearing in the venue is excluded with a counted, disclosed exclusion — never rendered with wrong "vs open" framing.

#### FR-7: Hero market — chart as ticket
A user can see the featured Market as a live chart with the opening-price line frozen, a countdown, live Odds for both Sides, and distance-to-line readout. Realizes UJ-1.
**Consequences (testable):**
- The strike/opening line never moves once the window opens ("the price of a question may move; the question may not"). Before the opening print resolves (the oracle can lag the first seconds of a window), the line and the distance readout show an explicit pending state — they never render a guessed level.
- The chart and the Fair Value model read the **same price source the Market settles on** (or the closest readable proxy), and the UI names that source — the display price must never diverge from the settlement basis in a way that manufactures "it's rigged" moments.
- Countdown urgency is interval-relative — urgent at `min(60s, intervalSec × 0.4)` remaining, so a 60-second Window is not born urgent and the accent stays earned; the urgency glow belongs to the hero/active card only. The readout states what movement each Side needs (e.g., "needs +$42 for UP").
- Tapping any market card or an UP/DOWN chip loads it into the hero with that Side preselected; deep links (`?m=&dir=`) reproduce that state.

#### FR-8: Stake-first ticket with real quotes
A user can enter a Stake and see exact cost, contracts, and payout quoted from the live book before committing. Realizes UJ-1, UJ-2.
**Consequences (testable):**
- Quotes derive from a real order-book quote for the actual size (never a midpoint estimate); display Odds are cents-per-$1 clamped [1,99].
- Quotes refresh on an interval and debounce user input; a stale quote is visibly stale.
- Entry is blocked outside the client admissibility band (~[2%, 97%]) with an honest label ("too close to certain").
- A minimum-stake floor prevents sub-lot dust orders at the input, with the floor stated on the Ticket.
- Quick-amount chips scale to the user's actual balance — never fixed denominations that read as dead buttons for a small wallet.
- The hero surface shows top-of-book depth for both Sides (the order book is real — show it), without requiring any user to understand it before betting.

#### FR-9: Guarded order placement
A user's confirmed bet either fills within displayed bounds or fails with a specific reason — never a silent worse fill, never a stranded resting order. Realizes UJ-1, UJ-2.
**Consequences (testable):**
- Orders are immediate-or-cancel with a re-quote at click time; cost is capped at the fresh quote × a cadence-scaled buffer; a fill above the cap is impossible.
- Bets are refused inside the window's no-entry buffer (headroom scaled to cadence) and the Ticket auto-advances to the next window keeping Side and Stake.
- Every write is gated on the Market's *on-chain* Trading status (the indexer lags seconds); every submitted tx's receipt status is checked and surfaced — a reverted tx is never shown as success.

#### FR-10: Verdict moment
At Settlement the user gets an unambiguous verdict with the stamp vocabulary. Realizes UJ-1, UJ-2.
**Consequences (testable):**
- Win renders 正夢 masayume; loss renders 逆夢 sakayume; void renders its own state ("no reliable print — both sides pay 0.5").
- The Verdict card carries the Receipt (fill tx, settlement tx, Oracle Graph link) and a one-tap share card.

#### FR-11: Claim-all plate
A user can sweep every claimable payout in one action. Realizes UJ-1, UJ-5.
**Consequences (testable):**
- The plate aggregates finalized Markets for the user's wallet **and the user's Vault credits** (delegated positions settle into the Vault — those rows are withdrawals, labeled distinctly) — including voids, which redeem both sides explicitly. Redemption writes are sequential txs or the gasless relayer loop (Multicall3 batches *reads* only — there is no write-batching mechanism on testnet); until gasless claims ship, the plate is honest about multi-signature claiming: a progress list ("claiming 2 of 4"), per-item outcomes, never one collapsed verdict.
- Unclaimed winnings surface persistently (badge/nudge) until claimed; the number shown equals the on-chain claimable sum **net of the on-chain settlement fee** (currently 0; derived from chain, never hardcoded — one venue config change must not make every displayed payout wrong).

### 5.3 Reels Feed

**Description:** The moat surface: a vertical snap feed interleaving live Market cards and Take cards. Fast cadences mean cards settle while you watch. Tap-to-bet is inline (with session keys, popup-free). Realizes UJ-2.

#### FR-12: Vertical snap feed of live windows and takes
A user can scroll full-screen cards: live Markets (chart, countdown, odds) interleaved with community Takes. Realizes UJ-2.
**Consequences (testable):**
- Cards snap one-per-viewport; a first-time user sees a swipe hint until their first real scroll.
- A card's Market settling while on screen updates the card in place to its Verdict state.
- Off-screen cards do no animation work and poll nothing (visibility-gated).

#### FR-13: Inline tap-to-bet
A user can bet directly from a Reel without leaving the feed. Realizes UJ-2.
**Consequences (testable):**
- Tapping UP/DOWN on a Market card opens an inline Ticket pre-filled with that Market and Side; all FR-8/FR-9 guards apply identically.
- On a Take card, **take the other side** opens the Ticket pre-filled with the opposing Side of the same Window.

### 5.4 Takes (Social Layer)

**Description:** "Your prediction is the post." A Take is Side + confidence + Window + optional caption. Because two Buy orders on opposite Sides cross via Mint-a-pair, a backed Take can rest as a real order at the stated probability — a social post that IS liquidity. Launch social loop is in-app Takes + share cards. *(Scope note: the social/posting rail is in-app only in MVP — no X or Telegram posting loop; the §5.11 Telegram rail is a betting rail, not a posting loop.)* Realizes UJ-2, UJ-3.

#### FR-14: Take composer
A user can post a Take on any live Window (caption ≤240 chars), optionally backing it with a resting order at their stated confidence. Realizes UJ-2.
**Consequences (testable):**
- A backed Take places a post-only order at the stated probability; if it would cross, the user is offered the crossing price or an adjusted level (the routine post-only rejection is absorbed, never surfaced as an error).
- "Backed" is on-chain-verifiable in either state: a **resting** backed order and a **filled** backed order are distinct badge states, both provable, neither self-reported. Unbacked Takes are visibly distinct from both.
- A backed order that never fills before window expiry auto-expires with the order (orders always carry expiry ≤ market expiry); the Take card then shows its honest terminal state ("call stood, money never matched") rather than pretending the position existed.
- While a backed order rests, its locked escrow is visible to its owner and cancelable in one tap — resting money is never invisible money. The app tracks its own placements locally (a placing call that throws may still have rested an order on-chain), cancels from that record, then sweeps the venue.

#### FR-15: Share cards & OG images
Any Verdict, Take, or Parlay outcome can be shared as a rendered card; market links unfurl with live data. Realizes UJ-2, UJ-3.
**Consequences (testable):**
- Share cards render server-side as images with the stamp vocabulary and the Receipt link.
- Market/Take URLs produce dynamic OG images showing the live probability at render time.
- Open-position share cards use strictly conditional framing ("IF IT LANDS") and absolute UTC settle times — never unconditional win language or a relative countdown that goes stale in a screenshot.

### 5.5 Portfolio & Edge

**Description:** One account surface: a single spendable number on top, open positions with live PnL, honestly-labeled history, FIFO realized-PnL accounting, CSV export, and the Edge tab that tells users the truth about their own trading. Realizes UJ-5.

#### FR-16: Open positions with live PnL
A user sees every open position marked against the live book. Realizes UJ-5.
**Consequences (testable):**
- Unrealized PnL = (mark − entry) × qty with DOWN marks computed as 1 − P(up); a position in a settled-but-unclaimed Market shows as claimable, not open.
- Positions are keyed by `marketId` — a recycled pool never bleeds one window's position into another.

#### FR-17: Honest history
A user sees closed rows labeled by how they closed: settled at oracle / closed early / voided. Realizes UJ-5.
**Consequences (testable):**
- Claim time and oracle print time are distinct fields, never conflated.
- Rows the accounting cannot match to a cost basis are skipped and counted, never guessed into the totals.

#### FR-18: FIFO realized PnL & equity curve
The app computes realized PnL by FIFO lot-matching in integer math. Realizes UJ-5.
**Consequences (testable):**
- Split redemptions group into one logical close; proportional cost allocation has no float drift (bigint).
- Only fully-closed rows count toward net (open positions never read as losses).
- **Losses are synthesized:** a losing position emits no redemption event (nobody redeems a zero-payout side), so realized losses are constructed from each finalized Market's settlement print — an events-only ledger that counts wins and drops losses is a defect. Unredeemed *winners* stay out of realized PnL until actually claimed.

#### FR-19: CSV export
A user can export their full history as CSV. Realizes UJ-5.
**Consequences (testable):**
- Export includes every column the history view shows, plus tx hashes; re-importing sums to the displayed totals.
- Fill logging uses the bot-kit `TradeRow`-compatible column shape from day one (a free decision now, unrecoverable later) so the markout/adverse-selection analytics can run as-is when added post-MVP.

#### FR-20: Edge analytics
A user can see ROI, win rate, profit factor, expectancy, max drawdown, streaks, equity curve, time-of-day performance, payoff shape, and a one-sentence readout. Realizes UJ-5.
**Consequences (testable):**
- Profit factor is null before the first loss ("does not invent"); the readout refuses pattern claims before 5 settled rounds.
- Time-of-day buckets show when the user performs best (split gain/loss per local-time window); payoff shape shows avg win vs avg loss, best streak, and total staked.
- The page states its own provenance: computed client-side from on-chain history ("calculated in your browser — redeeming doesn't erase the ledger"), reinforcing that the analytics *can't* lie because no server touches them.

#### FR-40: Close a position early
A user can exit an open position before Settlement by selling it back into the book at the live price. Realizes UJ-5.
**Consequences (testable):**
- The close flow quotes real proceeds for the actual size (FR-8 discipline), places IOC with a minimum-proceeds cap, and labels the resulting history row "closed early at live price" (FR-17's honesty labels depend on this capability existing).
- A position with no bid depth shows an honest "no exit right now" state instead of a fake quote; the position still settles normally at expiry.

### 5.6 Provably-Fair Layer

**Description:** The trust engine. Every settled round is auditable in two taps; every stat is un-fakeable. This is cheap to build on this venue (the oracle explorer already exists; volume is on every market row) and disproportionately credible. Realizes UJ-3, UJ-9.

#### FR-21: Per-round receipts
Every settled position exposes its Receipt: fill tx(s), settlement tx, Oracle Graph deep link. Realizes UJ-3.
**Consequences (testable):**
- The Oracle Graph link resolves to the venue oracle explorer's per-question graph view (sources, values, median, quorum) for that exact round. [ASSUMPTION: the venue oracle explorer remains publicly reachable through judging; Receipts degrade to raw tx links if not.]
- An "audit this settlement" affordance appears on every Verdict and history row — not buried in a detail view.

#### FR-22: Un-fakeable stats page
A public `/stats` page shows product traction where every number is paired with its on-chain provenance. Realizes UJ-3, UJ-9.
**Consequences (testable):**
- Metrics (markets settled, volume, unique wallets, claims paid) are recomputable from chain/indexer queries the page itself names.
- A calibration chart shows stated probability vs. realized outcome frequency across settled rounds ("when the crowd said 70%, it happened X%").
- **Adoption is separated from capability:** house wallets (Runners, seed-liquidity, demo accounts) are published and labeled; headline counts include only external wallets. Attribution on a shared venue uses Masayume-only touchpoints (Vault, Reserve, Waitlist, takes/backed orders) and states its limits honestly.
- Loss-inclusive accounting (FR-18's synthesis rule) applies to every win-rate/calibration figure; an incomplete indexer scan flags the affected metric as partial rather than reporting a partial scan as fact.
- A live-activity feed (recent settlements/claims, each row a click-through to its tx) keeps the page visibly alive during judging.

### 5.7 Baku Copilot

**Description:** Baku answers "should I take this?" with a quantitative Read — and is the one voice allowed to say no. The Fair Value model computes; the LLM explains; the Brake protects. Memory personalizes but never blocks. Realizes UJ-4.

#### FR-23: Quantitative Read
A user can ask Baku about any live Window and get: a Side or *sit out*, one honest reason, and the risk that proves it wrong — in 2–4 sentences. Realizes UJ-4.
**Consequences (testable):**
- The Read is grounded in a live model snapshot (Fair Value, Tilt, band state, time left); the LLM never outputs a number absent from the snapshot.
- When |Tilt| is below the edge floor or above the disagreement ceiling, the Read is *sit out* — a recommendation to bet in-band-violation is a defect.
- A stalled price feed (stale beyond threshold) yields "model is blind right now," never a Read from stale data.
- On a one-sided or empty book, the model anchors to the single-quote bound (an ask caps fair value, a bid floors it) rather than a fabricated mid; if even that is unavailable, the Read says so honestly.
- A Read that names a Side renders an inline act-on-it card (tap → pre-filled Ticket, all FR-8/FR-9 guards applying) — the Read is actionable, not just prose.

#### FR-24: The Brake
Baku detects tilt and intervenes. Realizes UJ-4.
**Consequences (testable):**
- Loss streak + stake escalation + rapid-fire prompting (restless signal) triggers a talk-down response instead of a Read. Detection thresholds ship as tunable defaults in the numbers bank (addendum §F) so the behavior is testable, not vibes.
- The Daily Stop is **per-wallet and authoritative server-side**, enforced by every betting surface — web Ticket, Reels inline, and the Telegram Executor alike (a user stopped on web cannot keep betting from chat). Vault Runners are bounded separately by their Caps.
- The stop resets at midnight in the user's local timezone (auto-captured at the wallet's first signed-in session; UTC only before one exists) and is user-configurable with a shipped default (addendum §F) via a Stop settings surface — limit editor plus the friction-gated opt-out; a promised configuration with no UI to configure it is a defect.
- When the stop is hit, entry surfaces refuse with an honest label — the disabled control looks disabled and says why.

#### FR-25: Baku memory
Baku remembers per-user context across sessions to enrich Reads. Realizes UJ-4.
**Consequences (testable):**
- A returning user's Read can reference their prior sessions (positions taken, patterns Baku observed, past Brake interventions); every referenced fact must exist in the memory store — memory enriches with real history, never invented history.
- Memory failures degrade to a memory-less Read — they never throw or block.

**Notes:** [NOTE FOR PM — demo risk, tracked as Open Question 10]: live testnet measurements found books sitting near coin-flip while the underlying was already well past the settlement reference. If that anomaly is chronic, Baku's disagreement ceiling makes *sit out* the near-universal Read (correct behavior, weak demo) and the oracle-follow Runner won't trade. Verify the reference basis before the demo script depends on Baku recommending anything.

### 5.8 Leaderboard & Badges

**Description:** The Banzuke: retention and social proof, ranked by exact realized PnL from on-chain fills — with the cache-honesty rules that keep it truthful. Realizes UJ-9.

#### FR-26: Banzuke ranking
Anyone can view traders ranked by realized PnL over a time window. Realizes UJ-9.
**Consequences (testable):**
- Ranking uses FIFO lot-matching over deduplicated on-chain events folded oldest-first; window filtering applies to close time while prior mints still supply cost basis.
- **Losses are synthesized** per FR-18's rule (losers emit no redemption event) — a winners-only Banzuke is a defect, not a leaderboard.
- Unmatched redemptions are counted and disclosed, never assumed zero-cost; an incomplete scan renders the board labeled partial, never a partial scan presented as complete.
- House wallets (Runners, seed-liquidity) are excluded from ranks or labeled as house, per FR-22's adoption/capability rule.
- The signed-in user sees their own row pinned ("You") regardless of rank.

#### FR-27: Badges
Traders earn badges from on-chain-derivable facts (volume, win rate over minimum sample, streaks, Founder status). Realizes UJ-9.
**Consequences (testable):**
- Every badge criterion is computable from public data; no badge is grantable by admin fiat.
- Win-rate badges require a minimum settled-round sample; win rate alone never ranks agents or strategies (vanity-metric rule).

### 5.9 Strategy Vaults (Agents)

**Description:** The agents-first flagship: users subscribe Vault funds to house Strategies within Caps, under the no-divert guarantee — the agent's only power is opening positions whose beneficiary is hard-wired to the depositor. v1 ships **exactly one subscribable Strategy (oracle-follow)**; the house market-maker is a disclosed house *actor* (live books, ops-health visibility) that takes no subscribers and gets no strategy card. (FR-29's one-Strategy-grant cap means multi-strategy subscription is a future grant-keying change, not product copy.) The marketplace language (verification ladder, decision envelope) frames future creator strategies without building creator self-serve. Realizes UJ-7.

#### FR-28: Vault deposit & withdraw
A user can deposit tUSDC into their Vault ledger and withdraw at any time; withdraw pays only the owner. Realizes UJ-7.
**Consequences (testable):**
- No contract path exists that moves a user's Vault balance to any address but their own wallet (no beneficiary parameter anywhere).
- Anyone can credit a named user (add-only); nobody but the owner can debit.

#### FR-29: Strategy subscription with Caps
A user can grant delegated trading rights per Vault — at most one Strategy grant, one Executor grant, and one Session grant (the FR-4 tap-trading key — architecture decision AD-5 unifies all three as Vault grant types), each with its own hard Caps — and unsubscribe/pause instantly. Realizes UJ-7, UJ-8.
**Consequences (testable):**
- Caps (max stake/trade, max daily spend, max open positions) are enforced in-contract — a delegate tx exceeding any cap reverts. *(Cap semantics: on Event Contracts max loss = stake, so the daily-spend cap is also a hard daily-loss bound — a deliberate v1 simplification over a realized-loss circuit breaker, safe because the venue has no leverage.)*
- The Strategy grant and the Executor grant are distinct grant types with independent Caps and revocation — subscribing a Strategy never conflicts with linking Telegram, and vice versa.
- Deposit + subscribe compose into one action for onboarding (no orphaned deposit state).
- Pause takes effect immediately; open positions remain the user's and settle to the user.

#### FR-30: No-divert agent trading
A subscribed Runner can open positions for its subscribers — and can do nothing else. Realizes UJ-7.
**Consequences (testable):**
- A fully-compromised Runner key can at worst open in-cap positions for the rightful owners (formal statement of the no-divert property; covered by contract tests).
- Every Runner action emits an auditable event linkable from the subscriber's portfolio.

#### FR-31: Permissionless settlement crank
Anyone can crank Vault position settlement; user funds never depend on the Runner's liveness. Realizes UJ-7.
**Consequences (testable):**
- With the Runner offline, a third party can settle and credit outcomes; a paused system leaves the withdraw path open (liveness never becomes custody).

#### FR-32: House strategy runners
The product operates 1–2 named house Strategies (market-making / oracle-follow) with published records. Realizes UJ-7.
**Consequences (testable):**
- Each strategy card shows the decision envelope (what it trades, bounds) and record from real fills; a DRY_RUN mode exercises the full loop without spending.
- Strategy ranking excludes win-rate-alone (vanity-metric rule); records link real txs.
- Runner health on the card is **re-derived, never self-reported**: alive means `now − lastTick < max(180s, 3×interval)`, computed at render — a dead Runner must read as dead immediately (the reference product showed "watching Bitcoin" for ten days while its desk was down; that failure is disallowed by construction).
- The card carries the Runner's live why/why-not feed: every cycle logs a why-string leading with the inputs its decision rests on, and idle cycles emit a heartbeat (markets scanned, per-reason skip counts, closest-to-trigger) — an idle strategy visibly *deciding* to sit out is trustworthy; a silent one is indistinguishable from a dead one.

### 5.10 Streak Parlays

**Description:** New market structure on top of the primitive: all-or-nothing multi-leg tickets, priced from the live book, escrow-backed so the payout can never come up short, resolved permissionlessly from each Market's own settlement. Realizes UJ-6.

#### FR-33: Parlay builder with live combined odds
A user can compose 2+ Legs across live Windows and see combined probability, stake, and max payout priced from live book mids. Realizes UJ-6.
**Consequences (testable):**
- Combined probability = product of leg probabilities with a correlation surcharge for correlated legs — same-asset/same-oracle **or same-expiry** (union of both triggers; floor at λ × min leg prob) — and a house margin; surcharge and margin values live in the numbers bank (addendum §F); rounding always favors the Reserve.
- Leg probabilities are read from the on-chain book **in the opening transaction itself** (the CLOB is fully on-chain — no trusted server attestation; improvement over the reference product, which trusted client input) and recorded on the ticket so pricing is auditable after the fact.
- Every leg must be on a future expiry at open — an opener can never include a leg whose outcome is already determined.
- A combined probability below the minimum-combined floor is refused at quote time (no lottery-ticket parlays that distort Reserve risk). *(Book-derived pricing plus margin is house pricing — the Reserve, not the book, is the counterparty — so FR-8's no-midpoint rule doesn't apply.)*
- A leg whose book is one-sided or empty is refused at quote time with an honest label — a mid is never invented to price a leg (an invented mid mis-escrows the Reserve).

#### FR-34: Pre-funded payout escrow
Opening a Parlay escrows the full max payout in the Reserve. Realizes UJ-6.
**Consequences (testable):**
- At open, Reserve escrow ≥ max payout, verifiable on-chain; a winning claim cannot be short-paid.
- If the Reserve lacks funds to escrow a requested Parlay, the builder refuses at quote time with an honest reason.
- Reserve risk is bounded by explicit caps: aggregate exposure across live tickets, per-ticket max payout, and a per-expiry sub-cap (so one settlement print can never take the whole float). A quote that would breach any cap is refused with the cap named.
- **Capitalization model (v1): house-seeded only.** The Reserve is funded by us; there is no public supply/LP side. (House-seeded by deliberate choice, revisitable post-hackathon; distinct from §10.2's LP-vault cut.)

#### FR-35: Permissionless leg resolution & first-loss kill
Legs resolve from each Market's own settlement; the first losing Leg kills the ticket instantly. Realizes UJ-6.
**Consequences (testable):**
- Leg resolution is callable by anyone and idempotent; a killed ticket frees its escrow immediately.
- Claim pays the ticket owner regardless of caller; a Parlay whose leg print never lands is refundable after a grace period (stake back).

### 5.11 Telegram Rail

**Description:** Distribution demo inside the hackathon's own community: bet from a chat message through the bounded Executor — "the agent can bet for you; it can't drain you." Sequenced after the Vault exists (the Executor holds its own Vault grant type — see FR-29). Scope statement: the rail serves existing wallet-holders — a chat user must link a wallet and fund a Vault before their first bet; there is no wallet-less "bet first, claim later" acquisition loop in v1 (a conscious consequence of rejecting embedded-wallet infrastructure — addendum §G). Realizes UJ-8.

#### FR-36: Account linking with capability receipt
A Telegram user can link their Masayume account and receives an explicit CAN/CANNOT capability receipt. Realizes UJ-8.
**Consequences (testable):**
- Linking binds TG identity to a wallet/Vault via a signed proof; identity never derives from unsigned message content.
- The receipt states: CAN bet within Caps from Vault balance; CANNOT withdraw, change Caps, or pay any other address.

#### FR-37: Bet by message
A linked user can place a bet with a chat message (asset, side, stake), with confirmation before execution. Realizes UJ-8.
**Consequences (testable):**
- The bot echoes window, odds, and exact cost and requires confirmation; all Ticket guards (FR-9) and the Daily Stop (FR-24) apply.
- A re-sent or duplicated chat message can never double-bet: commands are idempotent, deduplicated by message identity, and the booked position reflects the actual on-chain fill, never the requested size.
- A request exceeding Caps is refused naming the specific cap; verdicts post back with the Receipt link.

### 5.12 Growth & Landing

**Description:** The pitch surface and the growth loop: a landing page that sells the thesis, and an on-chain waitlist with referral climb and Founder badges. Realizes UJ-9.

#### FR-38: Landing page
A visitor understands the product, the trust story, and the sponsor-stack composition without connecting a wallet. Realizes UJ-9.
**Consequences (testable):**
- Landing shows live data (a real ticking market), the manifesto, and the "composed, not bolted on" stack table; every proof claim links a real tx.
- The no-divert story gets its flagship visual: a custody-rail proof diagram (delegated money's path with the withdraw door sealed — struck-through `withdraw()/transfer()/sweep()`, an attack that dies at the seal). This asset is required wherever delegation is sold (landing, strategy cards, TG linking), not invented ad hoc per surface.
- Sections render even when animations/observers fail — a screenshot or demo capture never catches a blank section.

#### FR-39: On-chain waitlist with referral
A visitor can join a gas-sponsored on-chain waitlist, get a rank, share a referral link, and climb. Realizes UJ-9.
**Consequences (testable):**
- Joining costs the user nothing (sponsored) and requires one signature; first 100 get the Founder badge; referral attribution is on-chain-derivable.

### 5.13 Developer & Agent On-Ramp

**Description:** The third leg of the thesis (§1): the primitive usable *by developers and by external agents*, not only by people in our app. A small MCP server wraps the chain adapter so any MCP-capable AI assistant can read markets and trade Event Contracts through our code, and a build-unsigned-tx API route serves agents that bring their own signing. Scope decided by Abu 2026-09-01 (was Open Question 9).

#### FR-41: EC MCP server + agent API
An external developer or AI agent can read live Markets, get quotes, build orders, and check claimables through a published MCP server (and a build-unsigned-tx HTTP route), using the same chain port the app uses.
**Consequences (testable):**
- The MCP server exposes at minimum: list live Markets (with phase), quote a stake, build an unsigned order/redeem tx, and enumerate claimables — every response derived through `packages/markets` (AD-1/AD-14; it is one more consumer of the port, nothing else).
- It never holds or requests private keys: writes are returned as unsigned calls for the caller to sign (the bot-kit `build*` pattern); custody stays with the caller.
- One config line in an MCP client is a working setup, documented in the README's developer section; the demo shows an assistant reading a market and producing a signed-by-the-caller bet.

## 6. Information Architecture

- **Core surfaces:** `/markets` (trade), `/reels` (feed), `/portfolio` + `/portfolio/edge` (money), `/parlays`, `/vaults` (strategies), `/leaderboard`.
- **Trust & marketing ring:** `/` (landing), `/stats`, `/waitlist`, `/demo` (in-app scrolly walkthrough with the tx-proof grid and embedded video — the judge who won't watch a video absorbs the story in-product), `/pitch` (the submission deck as a keyboard-navigable route — the deck is a build artifact, not a PDF).
- **Ops/judge ring:** `/dev/*` fixture pages.
- **Off-web surface:** the Telegram bot (Executor rail).
- **Chrome:** persistent price ticker; floating pill bottom-nav on mobile; Baku as a floating dock available on trade surfaces; claim-all plate surfaces globally when nonzero.
- Retired or moved routes redirect; nothing 404s (honest-state law, §7).

## 7. Aesthetic & Tone

- **Visual:** dark-first near-black ground; ONE accent color (final hue chosen in UX phase — direction colors green/rose reserved exclusively for P&L and verdicts). Japanese editorial framing without pastiche: the stamp vocabulary (正夢/逆夢), banzuke leaderboard, numbered section rhythm. [ASSUMPTION: accent ≠ Yosuku vermilion, to avoid reading as a reskin — UX decides.]
- **Voice:** calm, precise, honest. No hype, no "moon". Blocked actions state the blocker as the label. Error boundary stays on-brand and reassures: funds and positions are safe on-chain.
- **Honest-state discipline (product law):** disabled looks disabled; empty states explain themselves; success/blocked colors are semantic; a control you cannot use must not look usable.
- **Product vocabulary in copy:** wins/losses use the stamp language; Baku speaks as a protective spirit, not a shill — "the agent that eats your bad bets."
- **Required trust moments (UX-phase contract — these realize UJ-3/UJ-7's emotional payload and must not be invented weaker):**
  - The custody-rail proof diagram (FR-38).
  - The capability receipt framed as proof: struck-through verbs, the "No such function." kill-line (FR-4/FR-36).
  - The claim receipt as a physical object — cream stub that stays cream in dark mode, "Only you can cash out." (FR-11).
  - The worked-example sizing sentence on delegation flows: what the agent can and cannot do *at the chosen size* (FR-29).
  - Client-side provenance notes (FR-20).
  - "Don't trust it. Click it." as the standing invitation on every proof link.
- **Theme:** dark-only v1 — a conscious cut, not an omission. (The reference's token-remap-with-dark-islands approach is the noted path if a light theme is ever wanted.)

## 8. Platform

- **v1:** Responsive web (mobile-first — the Reels surface is designed for phones) + Telegram bot rail. PWA-installable. [ASSUMPTION]
- **Not v1:** native iOS/Android, X integration, desktop apps.

## 9. Non-Goals (Explicit)

*All cut on merit, not schedule.*

- **No leverage, margin, lending, or liquidations.** EC's full collateralization is the safety story; a margin desk would un-sell it.
- **No TEE/enclave attestation.** Replaced by per-action signature bounds; a TEE proves little in a testnet judging context.
- **No privacy/anonymity features.** The reference product's own docs admit link-reduction only.
- **No cross-chain onramps, fiat rails, or mainnet deployment** in v1.
- **No user-authored markets** — the venue lists windows; we don't mint questions.
- **No X (Twitter) rail** in MVP — the social loop is in-app Takes + share cards; the Telegram Executor is the chat rail. X can reuse the same Executor later.
- **We are not building a generic prediction-market aggregator** — Masayume is EC-native; depth over breadth.
- **No custodial holding of user funds by our servers** — custody lives in wallets and audited-pattern contracts only.

## 10. MVP Scope

*Locked direction: full scope on merit (user directive: deadline is never a scoping argument). Build sequence de-risks ordering; nothing falls off a phase boundary.*

### 10.1 In Scope

1. Onboarding & wallet (FR-1…5), Markets loop (FR-6…11) — the demo-critical path.
2. Reels feed (FR-12…13), Takes (FR-14…15), Portfolio & Edge (FR-16…20, FR-40).
3. Provably-fair layer (FR-21…22), Leaderboard & badges (FR-26…27).
4. Baku copilot (FR-23…25).
5. Strategy Vaults + house runners (FR-28…32), Streak Parlays (FR-33…35).
6. Telegram rail (FR-36…37); session-key tap-trading (FR-4 — scoped under item 1, built with this group per the build sequence).
7. Growth & landing (FR-38…39).
8. Developer & agent on-ramp (FR-41) — the MCP server + unsigned-tx API.

### 10.2 Out of Scope for MVP

- Price alerts — portable engine exists in the reference analysis but is absent from the locked scope. [NOTE FOR PM: cheap to add atop the watch layer; decide on merit post-MVP.]
- Bet-gated rooms / per-market chat — the Takes feed carries the social loop at launch (locked direction decision 6); an unmoderated live chat adds liability without a distinct job. Revisit with moderation design.
- Creator self-serve strategy marketplace — v1 is house Runners with marketplace *language*; opening authorship needs the verification ladder built for real.
- Copy-a-trader (following a Banzuke trader rather than a house Strategy) — a future Strategy type on the same Vault grants; v1 subscriptions are house strategies only.
- A raw "set your own odds" limit-order mode on the Ticket — backed Takes (FR-14) are the v1 resting-order surface; a second, unframed limit mode dilutes the one-tap thesis. Revisit on merit if power users ask.
- Market history explorer (public browse-past-windows surface with tape/candles) — the auditability job is carried by Receipts (FR-21), calibration (FR-22), and portfolio history; a public tape browser is a distinct analytics product. Revisit on merit.
- Reputation tiers / progression mechanics beyond badges — conscious kill: the reference's tier system fed its fee/bonus economy, which we don't have.
- Markout / adverse-selection analytics (captured-spread vs adverse-move per fill) — post-MVP on merit; FR-19's TradeRow-compatible fill log preserves the option at zero cost.
- ENS-style handle reservation on the waitlist — needs name-service infrastructure with no v1 job beyond flair.
- LP / be-the-house vault — depends on venue LP mechanics that EC does not expose today. (The ParlayReserve's own capitalization is house-seeded by decision — FR-34.)
- Everything in §9 Non-Goals.

### 10.3 Submission deliverables

- 2–3 min demo video, with the in-app `/demo` companion route (§6).
- Presentation deck shipped as the `/pitch` route (§6); its future-vision and sustainability slides carry the post-hackathon story (mainnet path, builder-fee readiness per Open Question 3), including the ecosystem framing: the Builder pattern exists for spot only — Masayume is the EC-native automation layer.
- SDK & docs feedback report (locked decision — material already collected, addendum §J).
- Honest-limitations README with per-claim tx proofs.
- Seed-liquidity script so demo books are never empty.
- Seeded house Takes from disclosed house accounts so the Reels feed is never socially empty at judging (labeled per FR-22's house-wallet rule).

## 11. Cross-Cutting NFRs

- **NFR-1 Chain-truth integrity:** No database is authoritative for chain state; server stores hold only social/copilot/ops data (Takes, Baku memory, Telegram link table, runner state). Anything money-shaped is recomputable from chain/indexer.
- **NFR-2 Write-path safety:** Every write gates on on-chain Trading status; every tx receipt is checked; order expiry is always set and inside the window; sub-lot dust is prevented at quote time. Every retry-prone money mover (relayer, Executor, Runner) submits idempotently: an unconfirmed response carrying a digest is treated as submitted, intent is recorded before acting, and booked outcomes come from actual fills/receipts, never from the requested size. (The protocol gotcha canon — addendum §D — is binding on all implementations.)
- **NFR-3 Identity keying:** All market state keys on `marketId`/symbol, never pool address. History queries are window-scoped.
- **NFR-4 Data hygiene:** Runtime validation at every money-path boundary; failed reads yield last-known-good (null ≠ 0); caches carry TTL + in-flight dedup; polling is visibility-gated. Lossy sources drive only counts, never money figures: durable amounts come from state reads or complete logs (prefer ERC-6909 `balanceOf` state over event reconstruction), never from a pruned or row-capped scan.
- **NFR-5 Performance & liveness:** Quote round-trip p95 ≤ 1.5s so a 60s window is comfortably tradeable (quote debounce ~350ms; re-quote cadence ~12s). Live surfaces prefer push (Somnia Data Streams / SDK reactivity — the chain's signature feature) where the SDK supports it, with visibility-gated polling as the floor, not the ceiling. Feed animation work only for on-screen cards; reduced-motion respected.
- **NFR-6 Liveness never becomes custody:** every keeper/runner step has a permissionless fallback; every pause leaves exits open; every stuck state has a time-gated refund.
- **NFR-7 Key & secret handling:** LLM keys server-side only; one signing key = one writer (no nonce racing), and per-service key separation with least privilege (the faucet/relayer/runner keys are distinct; no shared operator key). **Distinct wallets per economic role** (maker / taker-runner / relayer / Executor): the pool refuses self-matches, so a house taker sharing a wallet with the house maker whose book it crosses simply cannot fill — the demo dies silently. Relayer/sponsor policies are explicit per-function allowlists validated over the **whole batch** (one unlisted call rejects the batch — this matters under 4337/7702 batching); capital intake is never sponsored.
- **NFR-8 Judge-proofing & verification:** repo runs with zero env against testnet defaults; `/dev` fixture pages cover every card/receipt/modal state; every claim in README links a real tx; honest-limitations section maintained. A `/dev/doctor` preflight (config echo → venue resolve → wallet gas/collateral → per-market status/book) serves deploy-time and support-time diagnosis. Integration tests follow the bot-kit harness pattern: dry gate → wet gate against a **distinct counterparty wallet** → open-order delta leak-check around every wet run; network-free CI pins the invariants (status enum, taker-IOC, headroom gate, address/SDK-version drift).
- **NFR-9 Accessibility:** honest-state discipline (§7) is an accessibility requirement, not a style; reduced-motion and readable contrast on the dark theme are hard requirements.
- **NFR-10 Operational resilience:** ≥2 RPC endpoints configured with rotate-on-failure (both testnet RPCs are known); raw provider errors map to honest diagnoses before display (an empty gas tank surfaces as a viem parameter error — the user must see "you're out of STT", not a stack trace); every SDK instance with watches is closed with a bounded shutdown wait; everything resting carries order-level expiry as a dead-man's switch sized just past the requote interval.

## 12. Constraints & Guardrails

**Safety (responsible betting).** Testnet-only in v1 — no real money. The Brake and Daily Stop are product requirements, not decorations (FR-24): the app measurably intervenes against tilt. Marketing copy never promises profit; Baku's *sit out* answers are first-class outcomes. Stake is always the maximum loss, and the UI says so.

**Custody.** The no-divert property (FR-28/FR-30) is an invariant, stated in contract tests. Delegated powers (Runner, Executor, session key) are always bounded, receipted (capability receipt), and revocable. Our servers never custody funds.

**Privacy.** We store: wallet addresses, optional Telegram IDs (link table), Takes content, Baku memory. No emails, no KYC, no tracking beyond product analytics. Takes are public and effectively permanent; the composer says so.

**Cost.** LLM spend bounded per-user/per-day (Baku degrades to model-only numbers past budget). Gas sponsorship follows FR-3's allowlist (never capital intake — NFR-7); treat every sponsored or drip endpoint *we operate* as adversarial (the reference product's faucet was farmed at ~20 tx/hour): per-device + per-account gates, store-backed, degrading closed. The tUSDC faucet is not ours to gate — it is a client-signed call to the venue's own token contract (the venue's per-call cap is the limit), which keeps it zero-env-safe for judges.

## 13. Success Metrics

**Primary**
- **SM-1: The live loop.** A first-time wallet completes connect → faucet → bet → oracle settlement → claim on testnet in under 5 minutes, demonstrated live in the demo video. Validates FR-1…3, FR-6…11.
- **SM-2: Judged technical depth.** The app exercises the SDK across read, trade, watch, and history surfaces plus three original contracts (Vault, Reserve, and the small Waitlist) and a Runner — verifiable from the repo and on-chain txs. Validates FR-28…35. (Targets the 25% Technical criterion.)
- **SM-3: Un-fakeable traction.** By submission: ≥200 settled positions and ≥25 unique wallets **excluding published house wallets** (per FR-22's adoption/capability rule), 100% of `/stats` metrics recomputable on-chain, seeded by real community use via the Telegram rail + waitlist. Validates FR-22, FR-36…39. (Targets the 20% Impact criterion.)

**Secondary**
- **SM-4: Trust conversion.** Every settled round in the demo and README carries a working Receipt; oracle deep links resolve. Validates FR-21.
- **SM-5: Copilot honesty.** In a scripted eval set of live windows, 100% of Baku Reads contain only snapshot-grounded numbers, and all in-band-violation cases return *sit out*. Validates FR-23.
- **SM-6: Feed stickiness (qualitative for v1).** Session recordings show multi-card scroll + at least one inline bet per active session. Validates FR-12…13.

*Judging-criteria coverage:*
- Technical 25% → SM-2.
- Impact 20% → SM-3, plus the sustainability story (zero-fee venue, builder-fee readiness, mainnet path) carried by `/pitch` (§10.3).
- UX 20% → SM-1 + SM-6 + NFR-9's honest-state discipline.
- Innovation 20% → the surfaces no EC app has (Reels, backed Takes, Parlays, no-divert Vaults — the subjects of SM-2 and SM-6), framed explicitly in `/pitch`.
- Demo 15% → SM-1's live-loop video + the `/demo` route.

**Counter-metrics (do not optimize)**
- **SM-C1: Bet frequency.** Never optimize bets-per-user against the Brake: Brake interventions firing is *success*, not lost volume. Counterbalances SM-3.
- **SM-C2: Claim latency via custody.** Never "improve" claim UX by custodial shortcuts — gasless claims must keep paying the owner's wallet only. Counterbalances SM-1.
- **SM-C3: Stats vanity.** Never pad `/stats` with off-chain or synthetic numbers; a smaller true number beats a bigger unverifiable one. Counterbalances SM-3.

## 14. Open Questions

1. **Accent color / final visual identity** — deferred to UX phase (dark-first, single accent is locked; the hue is not).
2. **Domain — RESOLVED 2026-09-01:** masayume.app (Abu purchasing; .app enforces HTTPS, automatic on Vercel). Wired into deploy config when the app first deploys; vercel.app remains the fallback until the purchase lands.
3. **Builder-fee attribution on EC** — not documented for EC today; design order flow so a builder tag can be added; verify feasibility during architecture.
4. **Price alerts** — out of MVP; revisit on merit once the watch layer exists.
5. **Session-key mechanism — RESOLVED by architecture AD-5:** a Vault `SESSION` grant to a browser-held ephemeral key; Vault-funded by construction; no venue operator registry, no EIP-7702 dependency (unverified on chain 50312; 4337 EntryPoint exists on testnet but is unused by this design). FR-4 carries the resolution inline. Kept here so no reader treats the mechanism as open.
6. **Seed-liquidity sizing & wallet topology** — how much tUSDC the house maker quotes per window so demo books are never empty, and the wallet-per-role map (NFR-7's self-match rule: every economic role gets a distinct wallet).
7. **Baku memory store** — any KV; pick in architecture (constraint: losable without breaking Reads — see FR-25).
8. **tUSDC faucet contract cap vs. product faucet UX** — venue cap is 10k/call; decide our per-tap amount + anti-farm gates during build.
9. **The developer leg — RESOLVED 2026-09-01: Abu decided ADD.** Now §5.13 / FR-41, built as Story 9.6. Original question kept below for the record.
   *(was:)* **The developer leg — EC MCP server + agent on-ramp API.** *(Scope question for Abu — the one genuine addition surfaced by reconciliation.)* The winning reference framing was "usable by people, by developers, and by agents"; this PRD covers two of three. An MCP server wrapping our chain adapter (plus a build-unsigned-tx API route for external agents) almost certainly doesn't exist for EC, is cheap once the adapter exists, and lands squarely on the venue's agents-first thesis and the Technical/Ecosystem criteria. **Recommendation: add it.** Not added unilaterally because it expands the locked scope — decide and either grant it an FR home or a reasoned §10.2 line.
10. **Testnet reference anomaly (demo risk).** Live bot-kit measurements found books near coin-flip while the underlying was ~0.85% past the settlement reference — either testnet quotes don't track the underlying or `getOpeningPrices` isn't the actual reference. Verify against settled rounds (`getMarketResolution.openingAnswer.numericValue` — one indexer call per market) and decide Baku/Runner behavior if book-vs-model disagreement is chronic. Owner: first build phase; the FR-23 Notes carry the product consequence.
11. **Relayer STT dust-drip.** Should the app's own relayer drip dust STT to new users behind the §12 anti-farm gates (removing UJ-1's highest-friction bounce)? The venue's own precedent is auto-buying gas on first deposit. Decide during onboarding build; FR-2's external-faucet routing is the standing v1 path.

## 15. Assumptions Index

- §3.3 UJ-1 / §5.1 FR-2 — v1 routes zero-gas wallets to external STT faucets (with fallbacks listed); an in-app relayer dust-drip is Open Question 11, not assumed.
- §3.3 UJ-2 / §5.1 FR-4 — *(resolved, no longer an assumption)* session-key tap-trading is a Vault SESSION grant, Vault-funded by design (AD-5); the former fallback IS the mechanism.
- §7 — Accent color will differ from Yosuku's vermilion; UX phase decides.
- §8 — PWA-installable web is sufficient for v1; no native builds.
- General — Testnet cadences (60s/5m/10m) remain available through the judging window; cadence lanes are derived from live rows precisely so a cadence change cannot break the app.
- General — The venue oracle explorer (`prd.oracle.somnia.host`) remains publicly reachable for Receipt deep links; Receipts degrade to raw tx links if not.
