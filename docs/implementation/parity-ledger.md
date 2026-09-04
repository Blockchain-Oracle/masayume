---
title: Masayume working parity ledger
status: working record
authority: docs/architecture/yosuku-source-led-migration/01-reference-parity-manifest.md
reference_commit: 3c56ef52b78dae28cc198495f753480292f6a5ad
pin_verified: 2026-09-01 — reference/yosuku HEAD == origin/main == pinned commit, 0 commits drift
---

# Working parity ledger

The manifest in `01-reference-parity-manifest.md` defines the **minimum** surface. This file tracks
implementation against it. Rows are added to, never weakened or removed.

**There are no approved user-visible exclusions.** `Pending` means "not yet built in the dependency
order", never "optional" or "cut".

## Status vocabulary

| Status | Meaning |
|---|---|
| `Done` | Meets the route definition-of-done in `05-migration-and-agency-handoff.md` |
| `Shell` | Resolves in the correct Yosuku shell with honest dependency/unavailable states; capability not yet connected |
| `Partial` | Real data/writes connected for part of the surface |
| `Pending` | Not started; sequenced in a later stage |
| `Blocked` | A genuine external dependency is missing; blocker + resolution recorded |

## Decision log

| Date | Decision | Reference | User-visible consequence | Approval |
|---|---|---|---|---|
| 2026-09-04 | **Money is in the header again.** The reference's balance pill (Coins · the sum a bet can be paid from · `+`) sits left of the address pill and opens `AddFunds` as a centred modal; `masayume:open-funds` opens it from anywhere (the ticket's top-up gate, `/fund`). The account menu is the reference's four rows — Trading account · Wallet · Portfolio · **Disconnect** — and nothing else; Claims / Add funds / X recovery are gone from it. `/claims` is deleted (the reference never had one): claiming is the inline `ClaimWinnings` card on the Window's own result, and everything-at-once stays on `/portfolio`. The faucet no longer hides at exactly zero or replaces the Bet button | `Header.tsx` L293–364, 429; `AddFunds.tsx`; `ClaimWinnings.tsx` via `Verdict.tsx` L106; the user 2026-09-04 ("add money keeps taking me to a page") | Tap the money next to your address → a modal; mint free in one tap; disconnect from the menu; collect a win on the Window that won | **User decisions 2026-09-04** (`/claims` deleted; pill always visible) |
| 2026-09-04 | **The first credit is the "you're funded" moment** — `CreditWelcome`, once per address (localStorage), auto-dismissed at 8 s; later mints are the toast. The reference's *silent auto-drip at ≤ 1* needs a treasury that signs for the user; ours is the venue's `faucet(uint)` the wallet signs, so the drip is **Blocked** pending a treasury/sponsor key and the welcome fires on the first mint instead | `Header.tsx` L160–210; `CreditWelcome.tsx` | A new wallet's first mint is celebrated; nobody is silently funded | Blocked (drip) · Adapted (welcome) |
| 2026-09-04 | **`/fund` keeps the reference's page and says what is missing.** Yosuku's card on-ramp charges Paystack in Naira and credits from a treasury; neither key exists here, so the Fund button is disabled with the reason and the page points at the free mint. Reachable only from the modal, as the reference removed its nav slot (`Header.tsx` L65–67) | `app/fund/page.tsx` | No dead-end stub; the honest state, in the reference's layout | Blocked — needs `PAYSTACK` + a treasury |
| 2026-09-04 | **The Ticket is the reference's nine blocks again.** The stake input, the additive `+1 +5 +20` chips and the `1× 2× 3×` chips are one bordered block; the readout is the three-column Current cost · Return · Max loss strip with one caption line; the route is Public / Private; the account gates are inline cards; the mobile ticket is the right-edge slide-over that becomes the rail at `lg:`. The ¼/½/¾/Max fraction chips, the four-row readout, the three-way route control, the session chip in the header, the walk line and the bottom sheet were ours and are gone | `Ticket624Drawer.tsx` L768–1277; audit 2026-09-04 (the user: "the selection card is not well organised") | One compact card whose shape never changes when leverage or route changes; a tap on a card below the fold brings the page to the hero on desktop (`openTicket`, `page.tsx:583-589`) and slides the drawer over the page on a phone — on any tap, side or not, and again on a re-tap | **User-directed 2026-09-04** (source-first fidelity) |
| 2026-09-04 | **Leverage reverted to the reference's verbatim** — three chips on the amount row and the one sentence "L× can knock out before expiry." `BoostCard`, `KnockoutMeter`, `Odometer` and `boost-card.css` removed; the portfolio's boost row says the line in words | `Ticket624Drawer.tsx` L1074–1121 | Tapping 2× changes the numbers in the strip and nothing else grows; the 2026-09-02 21st.dev redesign is superseded | **User decision 2026-09-04** (revert) |
| 2026-09-04 | **"Plain words" removed.** The reference's Simple/Pro is a bet-composer mode inside `TradePanel`, which `/markets` never mounts; "In plain words" on `/strategies` is a static heading. Ours was an invented toggle that replaced the chart rail. §02 "Just ask" is the reference's plain-language surface and stays. The tutorial's closing screen loses the reading choice it drove | `TradePanel.tsx` L140–144, 727–745; `app/strategies/page.tsx` L790 | No toggle over §01; the tutorial ends on Connect alone | Adapted (an addition withdrawn) |
| 2026-09-04 | **A stake the book cannot fill is refused by name, never clamped.** New blocker `over-book` ("Above what the book can fill — up to X") fires on a partial quote; `no-liquidity-at-size` keeps only the empty-book case. The reserves' eight reverts that all read "No liquidity at this size" are split: `thin-book` (ThinBook, WideBook, InsufficientLiquidity, NothingFilled, IOC no-fill) vs `reserve-cap` (OverPositionCap, OverWindowCap, OverExposure, OverExpiryCap, TooManyOpen) — a funded reserve's policy cap no longer reads as a shortage | Yosuku caps a stake to money only (`ticket624.core.ts` L126, 136; `Ticket624Drawer.tsx` L264–265) — it has no book; the user: "you should not be able to place more than what we can offer" | The button says the ceiling the book can take; a reserve's refusal says whether it is the book or the cap | Adapted — a book-aware guard where the reference had no book |
| 2026-09-04 | **The house maker was never quoting.** Ops had run without `MAKER_PRIVATE_KEY`, so the `MarketMakerVault`'s 5,035 tUSDC had rested no order and every book was as thin as the venue's own makers left it — the real cause of the "no liquidity" refusals on parlay, range and leverage. Restarted with the key | `services/ops/src/actors/market-maker/index.ts` L127–129 ("scanning and reporting only") | Books carry the vault's bids and asks; refusals fall to what the reserves' own caps say | Ops — no product change |
| 2026-09-03 | **Band presets follow the asset's price.** The reference's ±$15/30/55 and its $5 centre grid are BTC dollars; carried to another asset by its price ratio to the level they were tuned at (`PRESET_ANCHOR_USD` 77,000), the grid snapped to the nearest nice step, edges printed in cents under $10k. Found in a browser: on ETH every band was refused as a near-certainty (ETH 4h Balanced spanned $414, thirteen σ) | `ticket624.core.ts` L222–230; `Ticket624Drawer.tsx` L64–66; context/49 §1 | BTC keeps the reference's numbers to the dollar; ETH 5m Balanced ±$1.00 prices at 3.2× · 28.0% inside — the same odds band as BTC's | **Needs user review** — an adaptation where the reference had one asset |
| 2026-09-03 | **An exit from the maker vault settles every closed Window first, not one.** The vault names its blockers one at a time; the page asks again after each settle (≤16) and its own note reads every open Window in one round. Found in a browser: four Windows were closed at once, the page settled one and the withdraw was refused `UnsettledWindow` | `MarketMakerVault.withdraw`, `unsettledExpired()`; context/49 §2 | "Withdraw" works when several Windows have closed; each settle is a signature | No approval needed |
| 2026-09-03 | **A table of Windows reads its labels in one round** (`getMarketsLite`, no opening prints) and a balance that has not landed prints "…", never 0.00 — the earn card said "wallet 0.00" for ten seconds over a wallet holding 10,006 | doc 05 §No fake-data; context/49 §3–4 | `/earn`'s ten rows name themselves together; the wallet line is honest while reading | No approval needed |
| 2026-09-03 | **The LP Provider badge reads the maker vault's shares** — the reference's own `plpBalance > 0` (`lib/badges.ts` L48–52); it stays locked with its dependency named only where no vault is deployed. "Needs Earn (Stage 5)" was false once the vault went live | `lib/badges.ts`; context/49 §9 | A supplier's portfolio shows the badge unlocked; withdrawing every share locks it again (the vault keeps no per-wallet supply history) | **Needs user review** — the same narrowing as the Room's gate |
| 2026-09-03 | **`/surface` reads the venue's book back, not a volatility model.** The reference's SVI smile, strike ladder and ATM term structure become the top of the book, cumulative depth, a stake ladder walked as an IOC taker fills, and every live Window of the asset priced off its own book (doc 03 §Surface). No new port method: the page reads the coordinator's books, the pool params and the fee | doc 03 §Surface; `web/src/features/surface/`, `@masayume/core/surface`; context/48 | The route is live on real structure; nothing on it is estimated | Adapted — the class doc 03 assigns |
| 2026-09-03 | **A crossed book is shown as crossed** (bid ≥ ask): no mid, no spread, the UP tile takes the ask. Caught live on the 5m lane at two minutes to the close — a maker re-laying its whole ladder (200/330/460 a level) every few seconds; the contract's book and the store's agreed level for level across three probe passes (context/48) | `bookStructure.crossed`; `spike:book-cross` | "crossed" in vermilion where a negative spread would have been printed | Truth (doc 00 allowed change 4) |
| 2026-09-03 | **The private open's guard is read after the signature, not off the polled quote.** Driven from a browser on the 15m lane the desk refused twice before a cent moved (`sizeForStake 4424000 < guard 4973250`); the desk's sizing for a fixed 2 tUSDC stake moved from 3.868 to 3.220 contracts in three seconds (context/47 §Finding 2) while the ticket's quote was up to `REQUOTE_MS` (12 s) old before the wallet popup opened. The signature covers the stake, never the size, so `usePrivateOpen` now sizes again right before the desk is asked and puts the 5% floor under that; the floor is unchanged, and the leverage open still takes its guard off the polled quote | `Ticket624Drawer.tsx` L541–583 (the reference re-signs on a failure and sends `min_quantity 0`) | A moved book is still "quote again", but the guard is measured seconds, not tens of seconds, before the desk's own pre-flight; a failed mint is refunded on the spot (seen live: `BelowMinQuantity(12121000, 14503650)`, four desk transactions, the stake back) |  |
| 2026-09-03 | **Every reading query waits for the boot.** A wallet is known within a tick of hydration, so the balance sheet and the history fired before `loadCollateral()` had resolved, failed with "collateral not loaded", and stayed failed until their 15 s poll: `/portfolio` opened on two "Something went sideways" alerts and the faucet card never showed for an empty wallet (context/47 §Finding 1). `useReadingQuery` now observes the boot's cache entry (`skipToken`, never fetching it) and enables everything else once the boot is ok | doc 05 §No fake-data (loading is a valid state); `bootMarkets` ("the three reads every screen needs before its first number") | No alert on a fresh load; the faucet card is on the ticket within 3 s; every read starts a boot later than before |  |
| 2026-09-02 | **The maker vault books the venue's exact escrow, not a cash delta.** Live, the venue refunded the vault's own expired quote inside the next placement (lazily, on the pool), which made a delta-measured escrow underflow (`Panic(17)`); the gateway now books `quantity × price` (`× (one − price)` for a NO buy) and any surplus as that Window's return. Redeployed at `0xc904F38f38eF96E8741C7D9218a7899504B99e79`; the first vault drained to its inventory | context/44 §The venue's lazy refund | The actor requotes a Window whose earlier quote expired instead of being refused | No approval needed — a correctness fix |
| 2026-09-02 | **A boost is stake-first: the reserve sizes it at execution.** The first live open reverted `StakeAboveMax` because a live maker moved the ask between the send and the block; `open(marketId, side, stake, leverageBps, minQuantityRaw)` now fixes the stake, sizes off the live book in the same transaction, refunds the lot's dust and refuses a fill under the caller's floor (the Ticket's 95% of the quoted size). The reserve was redeployed at `0x5484fF06F4B6a8108fABb2511385985D933a2D23` | `ticket624.core.ts` `SIZE_BUFFER`; context/45 §The first live open | "Buy UP 2× for 10.00" charges 10.00 or less, never more; a moved book is a requote, not a revert | No approval needed — a correctness fix |
| 2026-09-02 | **The leverage surfaces redesigned with 21st.dev, on the user's call** ("same colours, better animation, better breakdown"): the chips carry a sliding highlight (the 21st segmented control), the flat strip is a boost card — the multiple and its line, a bar of whose money is in the position, the payout as one rolling figure (the 21st count-up's spring, settling on the chain's exact reading), the facts, a knock-out meter (the 21st meter's track-fill-threshold) — and the portfolio's rows carry the meter. `motion` added to the web app; reduced motion honoured throughout. Yosuku's palette and type untouched | user message 2026-09-02; `.21st/design.json` decisions; `features/leverage/BoostCard.tsx`, `KnockoutMeter.tsx`, `components/data/Odometer.tsx` | The boost reads as a breakdown, not a strip | **User-directed deviation** from verbatim replication (layout and motion only) |
| 2026-09-02 | Range opens carry a 3% headroom over the quoted stake (`RANGE_STAKE_HEADROOM_BPS`): the basis moves every second and a cap equal to the quote never lands on a short lane (live: +0.06% on 1h, +0.3% on 15m); the Ticket says "up to X if the basis moves before it lands" | reference `costCapBuffer(cadence)`; context/43 §The first live opens | A range bet lands; the stake charged is the exact one at that second | No approval needed — a correctness fix |
| 2026-09-03 | **The duel room, its projector and its settler are running** (slice 7). `ws@8.21.3` in `services/ops`, beside the Next lifecycle rather than inside it; the room token rides in `Sec-WebSocket-Protocol`, not a query string, so a credential never lands in an access log or a `Referer`, and a refused upgrade is an HTTP 401 so a client can tell an expired token from a dead server. The room holds nothing durable — a reconnect rebuilds the whole match from `matchOf`, `deckOf`, `pnlOf` and the venue's own Windows. The projector turns the arena's log into rows and into what a room says, from a cursor that is a high-water mark; the settler cranks reveal, lock, settle, finalize and refund, all of which anyone may crank. **Proven live**: a fresh socket that had never seen match `0x3cbb1a60…1e2e` rebuilt it whole (players, mode, tier, phase, commitment), a wallet outside the match was refused with `forbidden`, and a real `cancelMatch` (54,343 gas) reached a live socket as `match.refunded` / `creator-cancelled` through the projector alone | doc 06 §Matchmaking, realtime and reconnect; `spike:room`, `spike:duel-live`, `spike:queue` | A duel survives a dropped socket and a restarted process; no duel surface promises anything yet (slice 8) | No approval needed — the slice's own acceptance |
| 2026-09-03 | **The venue's supply set the arena's parameters, and the owner changed them on chain.** Somnia runs two assets with one Window per cadence, and the arena checks card life at **reveal** — so a card must outlast join + reveal + `minCardLifeSec` at deal time, which is 540s of a 900s cycle at the parameters as deployed. Measured: a duel was dealable **40.1% of the time**, in 9-minute dead zones. The owner's answer (2026-09-03): `setParams` `0x261fe1cc587a16387cf69459f9b8a7c91371fef0547bf6e3a298f423e9322b13`, gas 93,678, read back from chain — join 180→60s, reveal 120→45s, `minDeckSize` 3→2. **89.2% dealable, one 6:29 gap an hour.** The windows shrink safely because both players are already on live sockets when paired, and a player who misses one triggers `refundUnjoined` — the failure is a refund, not a loss | `spike:deck-supply`; `spike:arena-params`; doc 06 §Decision log | A duel is available nine times in ten instead of four; a deck is 4 cards normally and 2 in the dead zone; the queue carries a countdown to the next dealable deck | **Owner-approved 2026-09-03** (deviation from doc 06 §Owner decisions 4) |
| 2026-09-03 | **The deckmaster was sizing headroom against the wrong number** — a latent refund bug found by reading the deployed parameters, not by a test. It required `minCardLifeSec + 60s` of card life at deal time, but the arena checks card life at reveal, and a reveal may legally land after the whole join and reveal windows have elapsed. A deck dealt at that boundary, where the challenger takes their time, reaches `revealDeck` on a dead Window: the call reverts, nobody can open the deck, and the match refunds at its reveal deadline. Invisible in every spike, because two players who sign in seconds never hit it — it appears exactly when one is slow, which is what those windows exist for. `dealHeadroomSec` now derives from all three deadlines plus a create-latency term | `deckmaster.ts` §dealHeadroomSec; the deployed `params()` | A slow challenger no longer costs both players the match | No approval needed — a correctness fix |
| 2026-09-03 | **The deck lane stopped being a preference and became a description.** With the floor at two, preferring a single cadence would deal a TWO-card deck while four Windows sat eligible — enough to satisfy the floor, and a worse contest for no reason. `selectDeck` now takes every eligible Window soonest-first up to five, and `lane` records what that turned out to be. The cost, stated: a mixed deck's pot waits on its slowest card, bounded by the one-hour horizon, with cards resolving one at a time through `settlement.progress` | `deck.ts` §selectDeck; the owner's approved "4 cards normally, 2 in the dead zone" | A duel is four cards whenever the venue has four | Follows the owner's 2026-09-03 approval |
| 2026-09-03 | **A card's receipt is keyed by the pick's own coordinates, not by a chain log.** `CardReceipt.logKey` became `pickKey` = `chainId:matchId:cardIndex:seat`: one card emits `PickFilled` and later `CardSettled`, so a log-identity key would have appended a second receipt for a settled card instead of filling in its payout — and `picksComplete`, which counts two receipts per card, would have locked a match one pick short. The same key is what lets a reconnect's snapshot and a live delta fold onto each other; `duel_cards` is re-keyed to match. `RefundReason`'s first member is `creator-cancelled`, as the contract names it, not `creator-timeout` | `types.ts` §CardReceipt; `lifecycle.test.ts` "folds a card's settlement into the receipt its pick already wrote" | A settled card shows its payout on the card it was bought on; a creator who withdraws is not told a clock ran out | No approval needed — a correctness fix found by implementing slice 7 |
| 2026-09-03 | **`GameArena` deployed on Shannon** at `0xec71498B3557c921813fFCF08a018316BCCDf0dF` (block 478915140, creation 54,289,829 gas, four `setTier` calls) on the owner's standing go for the arena once fork- and gas-proven; deployer `0xdD7a…Bf9a` is admin; the module regenerated (AD-10 lockstep). Read back and smoke-tested with a real wallet: a free-tier create confirmed and read back whole, then cancelled to REFUNDED with `escrowed` and `credited` zero. **Fork gas is not live gas** — the same `createMatch` ran 185,484 on the fork and 1,104,046 on Shannon, so the `arena` envelope is anchored on PrivateDesk's live mint (1,917,880) at 8M | `contracts/deployments/50312.json`; `GameArena.fork.t.sol`; doc 06 §Decision log | Duel picks, escrow and settlement have a real contract behind them; no duel surface promises anything yet | Owner-authorized (standing go, doc 06 §Owner decisions 5) |
| 2026-09-02 | **`RangeReserve`, `MarketMakerVault` and `LeverageReserve` deployed on Shannon and supplied 5,000 tUSDC each** on the owner's standing go ("do any deployments you want"): `0x1F8dB9B0913cB09e5CfDe44Adfa7Ff22b0868386` (block 478033175, 60.9M gas), `0x3F6a9D3DF15134328b4928bAf39d41647A8E48cA` (478033625, 47.2M; maker `0xE0fE…ae9d`; replaced the same evening by `0xc904…9e79`, see the exact-escrow row), `0x0F4f2C66917D03D2B31c3c5730E6Fae28d9BB575` (478033747, 55.5M; replaced the same evening by `0x5484…2D23`, see the stake-first row); deployer `0xdD7a…Bf9a`, admin of all three; the module regenerated (AD-10 lockstep) | `contracts/deployments/50312.json`; the parlay's recipe (context/42) | The Ticket's Range mode, its 2×/3× chips, `/games/range`, `/earn` and the portfolio's boosts are live against real contracts | Owner-authorized 2026-09-02 |
| 2026-09-02 | **Leverage is a knock-out certificate on the venue's own contracts.** `LeverageReserve` fronts `(L−1)·stake` for a premium, buys the boost off the resting book as the venue's taker and holds it; its claim is repaid first at settlement, at the owner's cash-out, or at the knock-out anyone may trigger once the book's mark is under the maintenance line. The owner's loss is capped at the stake; the reserve's is gap risk at the line, under public caps. The reference's Ticket arithmetic (`ticket624.core.ts`) and its "L× can knock out before expiry" made explicit; a fairly priced boost with no knock-out would be cosmetic on a binary payoff | `ticket624.core.ts` `qtyForStake`/`winForQty`; `underwrite.move`; `margin.move`; doc 03 §Leverage; context/45 | 2× and 3× on the Ticket are real: the chain sizes and prices the boost, the strip shows the front, the fee and the line | **Needs user review** |
| 2026-09-02 | A boost is placed from the wallet only: the reserve buys and custodies the contracts, and `EventVault` has no outbound path by design (AD-5). The higher chips lock off the wallet route with the reference's own treatment for a private bet ("placed at 1x") | `Ticket624Drawer.tsx` L1079–1081; doc 03 "from one Trading Balance" | Choose Wallet to bet at 2× or 3×; the chip's title says so | **Needs user review** — the promise names the Trading Balance |
| 2026-09-02 | The premium is the reference's flat 8% of the fronted amount (`underwrite.move`), the maintenance line its 120% (`margin.move`); entry only inside 0.05–0.95 and never in the last 90 s of a Window; a boost that could not beat the plain bet when right is refused (`Underpriced`, the reference's "leverage loses even if right" guard) | `DeployLeverageReserve.s.sol`; `TradePanel.tsx` L424 | The reserve's terms are public params; the Ticket refuses what the reserve refuses | No approval needed — tunable without a redeploy |
| 2026-09-02 | The knock-out is permissionless and unpaid (the reference's margin desk paid its liquidator 5% of proceeds); the house keeper cranks it, and an owner may cash out any time at the bids with a 3% slippage floor under the mark | `margin.move` `liq_penalty_bps`; `LeverageBetRow.tsx` | Nothing leaves a position to anyone but its owner | **Needs user review** |
| 2026-09-02 | **The Earn vault is the maker, not a house.** `MarketMakerVault` rests a post-only YES bid and YES ask on the venue's Windows under on-chain bounds (spread, price band, size, per-Window and aggregate caps); it can only buy complete sets at a discount. The reference's vault was the venue's counterparty, which DreamDEX does not have | `app/earn/page.tsx`; doc 03 §Earn/LP; context/44 | Suppliers earn the spread the maker captures and carry the inventory it is left with; both readable per Window on `/earn` §02 | **Needs user review** — a product where the reference had a dependency |
| 2026-09-02 | Share price counts deployed capital at cost, floored per Window; withdrawals draw on idle capital and are refused while a closed Window is unsettled (the page sends the crank first, anyone may) | `MarketMakerVault.deployedOf` / `withdraw`; context/44 | The number on the panel never includes a spread before it is realized; "Withdraw N idle" names what is still out | No approval needed — the doc-05 no-fake-data rule applied to a valuation |
| 2026-09-02 | The venue's `price` is the YES price for every order kind (a `BUY_NO` at p rests as a YES ask at p); the range fork test's book seeding is corrected to match | context/44 §What the vault is allowed to do | None visible; every maker quote is expressed in YES terms | Recorded |
| 2026-09-02 | **A band's odds are the house's, from the Window's book and the venue's own prints.** `RangeReserve` centres a normal return where the Window's resting book puts the market (Φ⁻¹ of its P(close ≥ open) over the parlay's depth) and widens it by a per-asset σ measured from the venue's closing prints; a band opened mid-Window is therefore priced against the current price. The reference's venue priced bands with its own model; DreamDEX has none | `ticket624.core.ts` §range; `RangeMath.sol`, `RangePricing.sol`; context/43 §What this settles | The multiple on the button follows the market and the clock, and the chain charges exactly it or requotes | **Needs user review** — a pricing model where the reference had a venue; parameters are public and tunable |
| 2026-09-02 | The reserve refuses a Window whose book is thinner than 20 contracts a side (`ThinBook`), wider than 0.20 (`WideBook`) or already decided (P(up) outside 3–97%) — the same doctrine as the parlay: the venue's data prices the product or nothing does. With the venue's makers offline every book was empty on 2026-09-02, so the live page would refuse until they return | `RangePricing._center`; context/43 | "No liquidity at this size" on an empty book rather than a guessed centre | No approval needed — the parlay's rule |
| 2026-09-02 | `/games/range` is built on the parlay page's frame because the reference has no range page; the Ticket's range mode is the reference's own | ledger §RangeReserve | A game page in the app's grammar | **Needs user review** |
| 2026-09-02 | The range band is not yet drawn on the hero's chart (the reference shades it); recorded as a follow-up | `Ticket624Drawer.tsx` L750–761 | The band lives in the Ticket only | **Needs user review** |
| 2026-09-02 | **RangeReserve settles on the OracleHub's own print.** A Window's closing price is `pullNumericAnswer` on the question the module row names (cents, two decimals, readable from a contract two seconds after expiry, pending under `0x25cd016c` before); the opening print and the asset are proven through the hub's content-addressed key of the venue's rebuilt question definition. Nothing is scheduled, nothing co-signed | context/43; `contracts/test/OracleHub.fork.t.sol`; `scripts/spike/range-oracle.ts` (live Window 70535: 76,735.23, hub == indexer) | A range round will show the same closing print the Window settled on, with the oracle's own receipt link | No approval needed — the venue's machinery, verified; the design that follows is in RESUME §Stage 5 |
| 2026-09-02 | **A parlay leg is priced by the venue's book, on-chain, at open** — `ParlayReserve.openParlay` reads each Window's `getBookLevels` and charges the cost-weighted price over the depth the ticket must hedge; the reference took opener-supplied `prob_bps` and named that its gap | `parlay624.move` L1–41 (v1 header), context/14 §5 "production hardening is re-deriving them from venue quotes in-tx" | The number on the Place button is the number the chain charges; a moved book is a requote, never a worse fill | No approval needed — the reference's own stated fix |
| 2026-09-02 | **No admin void on the parlay reserve.** A leg whose Window the venue voids voids the ticket and refunds the stake; the venue's `voidExpired()` is permissionless, so no grace-and-admin path is needed to untrap funds | `parlay624.move` `admin_void`; AD-5 | Nothing can hold a refund back; a void is a state the slip shows | **Approved by the user 2026-09-02** — a deliberate removal, like the vault's |
| 2026-09-02 | `/parlay` adds a "Settle" pill on a settled-but-uncranked leg, a "Paid" row for a claimed ticket, a "Voided" row, and the reserve's liquid/in-play line under the footnote | reference `ParlaySlip.tsx`, `ParlayBuilder.tsx` L492–494 | The reference relied on a keeper and deleted claimed objects; here the crank is the reader's and history stays | **Approved by the user 2026-09-02** |
| 2026-09-02 | **`ParlayReserve` deployed on Shannon on the owner's go and supplied**: `0x50Ced768C80d499bA4FB956C7DF0c2beB078C151` (block 477800945, 36.9M gas against Somnia's own 55.4M estimate, forge's local 3.3M), then 5,000 tUSDC from the deployer `0xdD7a…Bf9a`; the module regenerated (AD-10 lockstep); the adapter driven on an Anvil fork holding the live reserve and then live on Shannon | `contracts/deployments/50312.json`; context/42 §Live on Shannon | `/parlay` quotes off the live books and opens against a funded reserve | **User's go** 2026-09-02 (the faucet then topped the deployer up to 50 STT) |
| 2026-09-02 | **`/portfolio` opens with the reference's cream ledger plate, verbatim** (`components/portfolio/BalancePlate.tsx`, `PoolRows.tsx`, the page's plate mount L295–329, the connect card L277–292): the Stage 2 deviation that put our dark `/markets` panel on `/portfolio` is reverted on the user's call ("look how clean Yosuku's is"). The plate is cream in both themes as the reference's is; the X card nests in the X row; the Trading Balance's own controls take the plate's disclosure row (the reference's carries creator earnings, which does not exist here); `/markets` keeps its reviewed dark plate | `web/src/features/markets/portfolio/plate/*`, `ConnectCard.tsx` | The portfolio reads as the reference's: one vermilion figure, the proportion bar, the legs, "Elsewhere · not spendable here" rows | **User's call 2026-09-02** |
| 2026-09-02 | The plate's second leg says "In your Trading Balance" where the reference says "In your account"; "Get test tUSDC"; "New to Somnia? Test funds are free →" | `BalancePlate.tsx` L68, L56; page L289 | The words name the pool every other surface names | Truth correction (doc 00 allowed change 4) |
| 2026-09-02 | `/trade-from-x` renders without the app's ticker, header, footer and install strip, as the reference does (its page mounts no `Header`/`Marquee`; the sticky strip carries the primary nav); the layout's shell is route-aware (`ShellChrome`, `ISLAND_ROUTES`) | reference `app/trade-from-x/page.tsx` L88–106 | No double chrome on the island; the strip's mono nav links are the reference's | Fidelity restored, no approval needed |
| 2026-09-02 | With the install strip dismissed, the header hangs under the ticker (`[data-strip="off"] .header { top: 28px }`, 20px on phones) instead of the reference's `top: 0`, which covers the ticker and the page's first line. The reference's own comment assumes the ticker leaves with the strip; it never does — verified on yosuku.xyz by dismissing its strip | `part-02.css:89` (verbatim from `globals.css:428`); `web/src/styles/shell.css` override | Every page keeps a readable nav and first line after the strip is closed | Deviation — the user's 2026-09-01 ruling (invisible is not fidelity) on a defect the reference carries too |
| 2026-09-02 | `/strategies` and `/agents` keep only the reference's 28px of air above their content; the ticker + header offset comes from `page-shell` like every other route (the fork had copied the reference's `pt-[120px]` on top of it) | reference `app/strategies/page.tsx` L468, `app/agents/page.tsx` L72 (`main.container.pt-[120px]`) | The first line sits where the reference's does, not 92px lower | Fidelity restored, no approval needed |
| 2026-09-02 | `EventVault` is the venue's trader with a per-owner ledger (Yosuku's buckets), not a venue operator over the user's wallet; delegated orders are IOC only and attributed by balance delta | `trading_vault.move`; AD-3 "delegated route", AD-5; SDK `placeBinaryOrderFor` considered (§EventVault) | Deposit once; a delegate can only open in-cap positions that are yours; no resting vault orders, so no self-match | Architecture default; fork-verified on Shannon (context/41) |
| 2026-09-02 | The vault keeps a per-owner, per-Window tally in storage (`VaultTally`) because Shannon's RPC serves `eth_getLogs` over at most 1,000 blocks | RPC probe 2026-09-02: "block range exceeds 1000" at every span tried | Vault history reads in two multicalls; a vault round links no single transaction and says so | No approval needed — a read the browser can actually make |
| 2026-09-02 | Sponsored calls use OpenZeppelin's `ERC2771Forwarder`; the relayer's allowlist is the policy; deposits refuse the forwarder | doc 03 §Sponsored actions; NFR-7 "capital intake never sponsored"; reference `useSmartSubmit` (sponsor when it can, wallet when it can't) | A tap can be gas-free where a sponsor runs and says who pays where none does | No approval needed — the architecture's own rule |
| 2026-09-02 | The vault has no admin, no pause and no owner; the reference's admin-only `write_off_locked_for` has no counterpart | `trading_vault.move` L36, L336; doc 02 "pause does not trap owner exits" | Nothing can freeze a withdrawal; a lost position simply settles to what the chain pays | **Needs user review** — a deliberate removal |
| 2026-09-02 | **Deployed on Shannon on the owner's go**: `EventVault` `0x84Ec824D89ee78d5728545CE0B40EC968aa7CD7A`, `ERC2771Forwarder` `0x82bb75b8aE663abC73308Ce42ca00d701cFb50d3` (block 477731559), `StrategyRegistry` `0xAd5f37B0f3d0f6030B9d9c0f4985AFb184A85FB4` (block 477738374); deployer `0xdD7a…Bf9a` | `contracts/deployments/50312.json`; the module regenerated and committed (AD-10 lockstep) | The Trading Balance, grants, strategies and the X executor grant are live surfaces now | **User's go** (faucet funded 2026-09-02) |
| 2026-09-02 | Gas ceilings for the vault lanes set from Shannon readings (`vault` 4M, `vault-order` 6M): Somnia's schedule is ~10× the EVM for calls, ~20× for creations; a grant ran out of gas at 2M | `packages/core/src/constants/gas.ts`; context/41 §Live on Shannon | A signing key needs 0.43 STT for a vault order's envelope, not 0.72 | No approval needed — measured, as the constant's own comment demanded |
| 2026-09-02 | The live adapter run on Shannon (deployer as owner and actor): deposit, an owner UP from the balance at 0.167, a STRATEGY grant, a delegated DOWN, an over-cap order refused before signing, the oracle's settlement, a crank, then withdraw / revoke / withdraw: net +16.72 tUSDC came back to the wallet; the wallet-seat history read timed out on the indexer twice (the venue's service, not ours) | `scripts/spike/vault-fork.ts` `LIVE=1`; cast for the exits | Every vault path has run on the real venue | Verified |
| 2026-09-01 | Pin confirmed at `3c56ef5`; upstream fetched, zero drift | doc 00 §Pinned reference basis | None — no version mixing | Verified, no approval needed |
| 2026-09-01 | Yosuku source, CSS, tokens and assets reused verbatim | doc 00 §Source and provenance gaps item 2 | Exact visual fidelity | **User approved** (owns/has permission) |
| 2026-09-02 | The fill projection is derived in the browser from the wallet's indexed fills and complete-set actions, settled by the chain's own rule; no database, no credential | doc 03 §Equity/PnL "rebuildable event/fill projection", doc 02 §Data ownership | Settled history, equity, PnL, Trader Edge and badges all read one reading | Verified against chain balances (see §Fill projection), no approval needed |
| 2026-09-02 | A sell beyond inventory is booked as a buy of the complement (a collateral-backed short) | Chain evidence: the indexer labels it a plain sell, the wallet ends up holding the other side | An open short reads as the side actually held; the venue's own PnL engine drops it | Verified on 89 settled markets across 4 active wallets |
| 2026-09-02 | Whether a payout was collected is read from the live ERC-6909 balance, never inferred | The indexer exposes no per-wallet redemption record for settlement-contract redeems | "collected" / "to collect" / "collection unread" on each settled row | No approval needed — a guessed "paid" would hide money |
| 2026-09-02 | Reputation tiers ported without the reference's per-tier bonus % and fee % | `lib/predictionContract.ts` TIERS | Tier, record and progress shown; no bonus or fee promised | **Needs user review** — no contract pays either |
| 2026-09-02 | Reputation, badges, the equity curve and CSV export are mounted on `/portfolio` §03 "Your record" | The reference computes all four on its portfolio page (`computeBadges`, `fetchReputation`, `equityRef`, `positionsToCSV`) but its pinned JSX mounts none of them; `BadgeDisplay` has no render site | A surface the reference wrote but never showed | **Needs user review** — placement is ours, components are the reference's |
| 2026-09-02 | `/leaderboard` is computed server-side from the indexer's fill tape over a rolling day, cached three minutes in memory; the doc-03 "DB projection" is deferred as an optimisation of the same derivation | doc 03 §Leaderboard; reference route's own 24h scope and cache | Venue-wide board, no credential needed | No approval needed — the derivation is unchanged, only the store |
| 2026-09-02 | A take's verifiable spine is the wallet's `personal_sign` over the call, stored with the row; the reference's is an on-chain `TakePosted` event plus a Walrus blob | doc 02 §Data ownership ("Takes … Postgres, with signatures/receipts where claimed"); `lib/sui/takeBoard.ts` | "signed by the wallet · verify ↗" on every take card instead of "on Walrus · verify on Suiscan"; posting is a signature, not a transaction | No approval needed — the doc-02 rule, applied; 12 endpoint checks pass |
| 2026-09-02 | The "✓ position" badge is a chain read the route makes at post time (the Room's `holdsPosition`), never a client claim | reference `TakeComposer624` posts open calls only; the badge came from an order id the bet flow hands over | A bettor's take is stamped from the chain; an unreadable chain refuses the post rather than stamping "open call" | No approval needed — strictly more honest than the source |
| 2026-09-02 | The composer's strike is the Window's opening print, read-only; Range is present, disabled, and names RangeReserve (Stage 5) | `TakeComposer624.tsx` L59–63 (user-typed strike), L129–140 (three sides) | The call is on the number the Window settles against; no invented level; a control that does nothing says why | Truth correction (doc 00 allowed change 4) |
| 2026-09-02 | Share cards are rendered in the browser and handed to the native share sheet or downloaded with a pre-filled X post — the reference's own mechanism; doc 03's "server-rendered/open-graph cards" (link unfurls) are a follow-on, not a substitute | `lib/shareCard.ts`, `lib/openBetShareCard.ts`, `ShareBetButton.tsx`, `ShareTradeButton.tsx` | Identical share behaviour; a pasted link does not yet unfurl into the card | No approval needed — user-visible behaviour is the reference's |
| 2026-09-02 | The Call (on-screen) follows the theme; the exported PNG keeps its one dark design. No leverage caveat, no X handle: the footer prints the app's own host | `BetPlacedCard.tsx` L70 (`data-theme="dark"`), `openBetShareCard.ts` L101 (`@yosuku0`), L354–362 (leverage) | Cream ticket in light mode; the PNG is the same in both; nothing on a card claims an account or a product that does not exist | Deviation — the user's 2026-09-01 ruling on non-flipping surfaces; truth corrections |
| 2026-09-02 | Share cards redesigned as a 1600×900 X banner with a QR stub, the site and the handle `@masayume_app` — the user's explicit exception to source-led replication; the "no X handle" half of the row above is superseded | User instruction 2026-09-02 ("that's like one exception I think you can do"); `openBetShareCard.ts` L101 for the handle line the reference had | A landscape card X shows uncropped; a scannable route into the app from any shared post; the post text ends `masayume.app via @masayume_app` | **User's call** — brand constants supplied by the owner |
| 2026-09-02 | `/stats` reads the last 24 hours off the board's own scan, never "since launch": the indexer's paging caps one scan at about a day of five-minute Windows, so a cumulative-since-inception figure cannot be read honestly in one request; incomplete scans label every figure a floor; no `localStorage` high-water mark (the reference floors its counters; a rolling day legitimately goes down) | `lib/sui/traction.ts` `MAX_PAGES`, `monotonic()`; `scan.ts` caps | Numbers are a day's truth, labelled as such; the page and the leaderboard cannot disagree | No approval needed — the doc-05 no-fake-data rule applied to a paging limit |
| 2026-09-02 | A "call" on `/stats` is a taker's buy; a taker's sell is a cash-out, listed and not counted; fills the indexer has not attributed are counted and shown, never guessed | `traction.ts` counted `OrderMinted` events on sponsored txs | "Calls filled" is the number of times a wallet clicked a side and the book filled it | No approval needed |
| 2026-09-02 | `/download` is the PWA install surface: manifest + icons, a stateful install CTA (`beforeinstallprompt` / iOS steps / browser menu / installed), the phone frame around a real capture of `/markets`. Native stays Blocked and is said plainly in the meta list | doc 03 §Download; `app/download/page.tsx`, `manifest.json` | Install works where the platform allows it; nowhere does the page claim a store or a native build | **Needs user review** — copy is truth-corrected throughout (see §Download) |
| 2026-09-02 | The route error boundary's words are the reference's again ("A quiet moment on the floor." …); the earlier Masayume wording ("The screen blinked. The chain didn't." / "Back to markets") was never a recorded decision and the row classed the surface Exact | `app/error.tsx` | Same calm fallback in both themes, technical-details disclosure kept (additive) | Fidelity restored, no approval needed |
| 2026-09-02 | Unresolved journaled intents are reconciled against the chain when a session starts, and told to the user as toasts; `reconcileUnknown` distinguishes a reverted receipt from a successful one; nothing is ever re-sent | doc 05 Stage 2 "journal and reconciliation"; AD-3 | A send that timed out yesterday is explained today — landed, reverted, absent, or still unknown | No approval needed — the architecture's own rule, finally wired |
| 2026-09-02 | Price alerts get a live evaluator (the reference's `checkAlerts` has no caller and its button was cut in 8c7ecc1); mounted in the hero foot beside the Room | doc 03 §Alerts "market stream evaluator"; reference `PriceAlerts.tsx` orphaned | A threshold alert actually fires (toast, and a system notification when permitted) while the app is open; the popover says exactly that | **Needs user review** — placement is ours; the reference has no live mount |
| 2026-09-02 | `/news` is restored from the reference's own history (`93d09c1^:app/news/page.tsx`); the feed component and RSS route survive in the pinned source. "Bitcoin News" → "Market News" because the venue lists BTC and ETH. A More-menu entry is added | doc 03 §News/ticker "real configured feed/provider" | A live wire (Cointelegraph + Decrypt, no credential) at `/news`; Fear/Greed still pending a provider | **Needs user review** — a route the pinned reference cut as "broken" |
| 2026-09-02 | `/status` probes at read time: RPC head, indexer, price feed lag, social store, Sensei — each under its own timeout; a stale last-good reading counts as a failed probe | doc 03 §Status "derive dependency health at read time; do not keep a stale healthy claim" | Healthy / degraded / unreachable computed per load; optional capabilities listed truthfully without degrading the verdict | No approval needed |
| 2026-09-02 | Public pages rewritten on real facts only: `/docs` (contracts from the pinned addresses, code from the repo), `/how-it-works` (the reference's 64/36 example kept and labelled an example; fees truth-corrected), `/pitch` (labels CONCEPT / NEXT / NO-OP / ILLUSTRATIVE; team = the one builder in `git log`; no revenue rate), `/demo` (live traction from `/api/leaderboard`, real screenshots, real tx links) | doc 03 §Public/support surfaces; doc 05 §No fake-data | No future behaviour as current; every number sourced | **Needs user review** — `/docs` links `github.com/Blockchain-Oracle/masayume` (drop if private); the pitch's Somnia mark is a drawn stand-in |
| 2026-09-01 | `globals.css` split into <400-line modules, values byte-identical; `design-literals` rescoped for ported presentation | repo invariants vs doc 02 §Source-led shell | None — split verified by concatenation diff | **User approved** |
| 2026-09-01 | Native mobile remains `Blocked` | doc 00 §Source and provenance gaps item 1 | `/download` native buttons show a truthful blocked state | Architecture default |
| 2026-09-01 | **Truth correction** — AppStrip advertised "Yosuku is on iOS". Masayume has no native build, so the claim would be false. Mechanism kept (it owns `--appstrip`, which every fixed offset derives from); copy is now "Masayume installs as a web app" / "Somnia testnet — test funds only", both true | doc 00 allowed deviation 4 | Strip promises an installable PWA, which exists, instead of an iOS app, which does not | Deviation class pre-approved |
| 2026-09-01 | Brand mark is Masayume's own glyph (crescent + vermilion point), not the Yosuku celebrant figure | doc 00 §Allowed changes 1 — "brand substitution changes the mark and name, not the design grammar" | Different logo; identical drawing grammar, footprint and colour law | Deviation class pre-approved |
| 2026-09-01 | Ticker driven by real DreamDEX asset prices + next close, not Yosuku's `/api/ticker`. Fear/Greed omitted while no provider is configured | doc 05 §No fake-data; ledger row "news/ticker" | Real figures only; the FNG cell returns when a real provider is connected | Recorded, pending row |
| 2026-09-01 | Invariant rescope was **approved but not needed** — the CSS split kept every part under the cap and ported components carry no literals, so `design-literals` and `file-length` pass unmodified | repo invariants | Guardrails remain fully strict on all code | Approval unused |
| 2026-09-01 | **Invisible-in-light fix, backgrounds.** The reference's Tutorial card is `bg-neutral-900/95`, which part-14 turns to cream in light mode — taking `bg-white/20` (step dots), `border-white/[0.12]` and `hover:bg-white/[0.06]` (choice cards) with it, none of which part-14 remaps. They render white-on-cream, i.e. invisible. Same defect class as the reel's `var(--white)`, in background form, and present in the reference itself | doc 00 authority order; RESUME.md §Never write `var(--white)` | Step dots and choice-card edges are visible on cream instead of absent; dark mode byte-identical to source | Deviation — the user's 2026-09-01 ruling (invisible is not fidelity) applied to the same defect class |
| 2026-09-01 | **`text-gray-*` diverged for the Tutorial only.** The ledger row below records the gray ramp as stale-but-legible and reserves "evidence of unreadable text" as the trigger to diverge. Measured on this card: body copy `text-gray-400` = `rgb(163,163,163)` on cream at **2.36:1**, far under AA, on the one screen whose whole job is to be read. Remapped to part-14's own ladder (9.67:1 / 5.11:1 / 3.44:1) | doc 00 authority order 3–4; the row below | Onboarding prose is readable in light mode. Scoped to `.tutorial-card`; the other 811 `text-gray-*` utilities are untouched pending a reviewed global pass | Trigger the ledger itself defined |
| 2026-09-01 | Light mode in the reference is partially stale: `tailwind.config.ts` maps `gray-*` to CSS vars but there is no `@config` directive, so under Tailwind 4 its 811 `text-gray-*` utilities compile to static dark-ramp hex and do not follow `[data-theme="light"]`. Verified live on yosuku.xyz (`--gray-400` = `#5e574b` while `text-gray-500` renders `#737373`). Rendering remains legible, so the port reproduces source behaviour rather than diverging | doc 00 authority order 3–4 | None today; recorded so it is a deliberate choice, not an unnoticed bug | Fidelity preserved; revisit only with evidence of unreadable text |


## Signing and authority (doc 02 §Signing and authority architecture)

| Requirement | Destination | Status |
|---|---|---|
| Shared read-only runtime, no mutable account or signer | `packages/markets/src/runtime/read-runtime.ts` | **Done** — `setSigner`/`signerAddress`/`requireTrader` removed; `.trader` unreachable; `configureMarkets`/`ensureMarkets` return `void` so the exchange object is never handed out |
| Endpoint rotation cannot change signing authority | same | **Done** — rotation rebuilds reads only |
| `SubmitterSession` per account + chain + authority | `packages/markets/src/sessions/submitter-session.ts` | **Done** — owns its own SDK instance, signer passed at construction, `setSigner` never called |
| Sessions do not multiply sockets | same | **Done** — no `wsRpcUrl`; SDK opens a socket only when configured, so subscriptions stay on the one shared runtime |
| Own nonce queue (one key, one writer) | `packages/markets/src/sessions/nonce-queue.ts` | **Done** — serialised; a rejection does not stall the queue (targeted check) |
| Own journal, attribution, stop gate | `packages/markets/src/submitter/create.ts` | **Done** — bound to one account |
| Authority types enumerated | `packages/markets/src/sessions/authority.ts` | **Done** — 9 roles, delegated ones marked |
| Disposed on disconnect / account switch / chain switch / expiry / revocation | `packages/markets/src/react/session.tsx` | **Done** — new wallet client disposes and rebuilds; disposed sessions reject |
| Grant policy per session (`SESSION`, `EXECUTOR`, `STRATEGY`) | `contracts/src/vault/EventVault.sol` | **Done in code** — typed grants with independent caps, expiry and one-call revocation; the session's viem clients carry the vault beside the SDK trader (`VaultContracts`). Not deployed: owner-authorized |

**Stage 2 is complete.** `/fund` and `/claim` are not Stage 2 reads — see §`/reels` for why.

### EventVault and the Trading Balance (Stage 4, contract and port done 2026-09-02; surfaces in flight)

The reference's Trading Balance is `yolev::trading_vault` (`contracts/leverage-pkg/sources/trading_vault.move`):
deposit once into buckets — `available`, `private_available`, `agent_available`, `locked_margin` — withdraw only
to the owner, and let one agent spend an allocation inside a policy. `EventVault.sol` ports the buckets and the
owner-only exits verbatim in shape, and replaces the single agent policy with the three typed grants the
architecture requires (AD-5). What DreamDEX changes, and what was decided:

| Requirement | Reference | Ours | Class | Status |
|---|---|---|---|---|
| Deposit / withdraw / private bucket / private withdraw | `trading_vault.move` `deposit`, `withdraw`, `move_to_private`, `withdraw_private` | `EventVault.deposit`, `withdraw`, `moveToPrivate`, `withdrawPrivate` — pay `_msgSender()` only; no function takes a destination | Exact (shape) | **Done** — 34 unit tests |
| Credit from an external flow | `credit_available_for`, `credit_private_for` ("anyone may call because the caller contributes the coin") | `creditFor`, `creditPrivateFor` pull from the caller | Exact | **Done** |
| Agent allocation with caps | one `AgentPolicy` per user: `max_trade`, `max_leverage_bps`, `max_daily_loss`, `expires_at_ms` | one live grant **per kind** (`SESSION` / `EXECUTOR` / `STRATEGY`) with `maxStakePerTrade`, `maxDailySpend` (UTC day), `maxOpenPositions`, `maxPriceRaw`, expiry, budget; replacing a grant returns the old budget first | Adapted — AD-5 | **Done** |
| Agent executes inside the policy | `agent_open_leverage` → `margin::request_open_for` (owner hard-wired) | `placeFor(grantId, …)` → an IOC on the venue pool **placed by the vault**, attributed by balance delta, booked to `g.owner`; sale proceeds go to the owner's `available`, never back to the budget | Adapted — the venue has no per-owner order placement we can trust for binaries | **Done**, fork-verified |
| Owner trades from the balance | `open_leverage` | `place(...)` from `available`, same IOC path | Adapted | **Done** |
| Settlement returns funds to the balance | `return_locked_for` (anyone contributes the coin) | `crankSettle(owner, marketId)` — permissionless; redeems both sides through the module and credits the owner (FR-31) | Adapted | **Done**, fork-verified on a void |
| Admin write-off of a lost margin | `write_off_locked_for` (admin only) | **none** — the vault has no admin, no pause, no owner; nothing can trap an exit | Deviation (removal) | **Recorded** |
| History readable without an indexer | Sui events | `VaultTally`: per-owner, per-Window storage tally (bought/sold per side, cost, proceeds, payout, first/last/settled) + `marketsOf` paging | Adapted — Shannon's RPC caps `eth_getLogs` at 1,000 blocks and blocks are sub-second, so events cannot rebuild a portfolio in a browser | **Done** |
| Sponsored transactions | Onara gas station: user signs, sponsor co-signs and pays, policy allowlist (`lib/sponsor.ts`, `useSmartSubmit.ts`) | OpenZeppelin `ERC2771Forwarder` + the relayer's per-function allowlist; `deposit` / `depositAndGrant` refuse the forwarder (capital intake is never sponsored) | Adapted | Contract **done**; relay in flight |

**The alternative considered and not taken.** The pinned SDK exposes `placeBinaryOrderFor(owner, …)` and an
operator registry (`setOperatorApprovalForPool`), which would let the vault place orders in the user's own name
with escrow from the user's wallet — no deposit, wallet-only projection. Not taken because: the SDK documents
the operator grants as SpotPool features and the spine ruled "no venue operator-registry dependency (spot-only
risk)"; a session key would need every pool pre-approved for collateral, which defeats popup-free; and the
reference's product is a deposit-once balance. Recorded here so it is a decision, not an oversight.

**Fork verification (Story 6.1's build-phase check)** — `context/41-eventvault-fork-verification-2026-09-02.md`:
against Shannon's real contracts at block 477647519 the vault filled YES at 0.434 and NO at 0.595 on the same
15m Window, refunds landed in the wallet balance (pool credit 0), a void redeemed exactly ½ per token on both
sides through the vault's operator approvals, `withdraw` paid the owner in full, and no storage write equalled
the pool address. Self-match between two owners of one vault cannot occur: the vault only ever sends IOC, so it
never rests an order to match against.

**The port (`packages/core/src/vault`, `packages/markets/src/vault`).** `simulateCaps` mirrors `placeFor`'s
checks in the contract's order and is golden-tested on `caps.vectors.json` by forge and vitest alike. Reads are
two multicalls (`getVaultSnapshot`, `getVaultHoldings`); the tally is the history's second seat
(`SettledRound.source: "vault"`, no transaction to link); vault intents ride the tx lane and vault orders ride the
order lane's third dimension (`OrderRequest.route`). Everything answers "EventVault is not deployed on this
network yet" until `contracts/deployments/50312.json` exists and `pnpm contracts:export` regenerates
`addresses.masayume.json` (AD-10 lockstep).

**Trading Balance surfaces (fork A, 2026-09-02)** — `web/src/features/vault/`, mounted on `/portfolio`
(inside the balance plate's rows), `/claims` (vault credits beside the plate, never in its sum) and the history
rows; fixtures on `/dev/vault`.

| Reference | Ours | Class | Approval |
|---|---|---|---|
| Trading balance block — `app/portfolio/page.tsx` at `1a36ffa^` L416–466: the pinned source computes the vault balances (L50–130) but its JSX mounts no controls; the block was cut in `1a36ffa` "drop the old-deployment section" | `TradingBalanceView`, `VaultControls`, `vault.css` | Restored from the reference's own history, as `/news` was | **Needs user review** |
| Snapshot cells L358–412 (Wallet / Available / In trades / Private / Leverage / Agent / Positions / P&L / Address) | `VaultCells`: Wallet, Available, In trades (at cost, says so), Private, In grants, Positions — only what the vault can state truthfully; Leverage and Address dropped, P&L lives in §03 | Adapted | No approval needed |
| Pool-row grammar `components/portfolio/PoolRows.tsx` (label, one sentence, amount; a row with controls is its own `<details>`) | `VaultRow` inside `BalanceSheetPanel`; the panel is mounted on `/portfolio` only | Exact grammar on our plate surface (the `.ledger-plate` deviation stands) | No approval needed |
| Fixed cream inks, black deposit button, emerald "Private" figure and button | theme tokens; ink-on-ground button; the private *figure* in plain ink, the private *button* keeps the reference's green | Deviation — flipping surface; colour law (green is for P&L) | Pre-approved class |
| — | `VaultGrants`: the live grants and revoke, under the cells | Additive — ours | **Needs user review** — may overlap the session manager and strategy surfaces |
| Sui events | history rows with `source: "vault"`: "via Trading Balance", no proof link, a crank on the row; `/claims` rows "Vault credit — withdrawal" | Adapted (AD-1: a vault credit is a withdrawal, not a redeem) | No approval needed |

Truth corrections: "Your new bets do not use this." → "Bets placed from it and the grants you allow spend from
here." (the reference's bets ran on its manager account; ours bet from the vault); the pool-row sentence takes the
reference's X-row shape ("… Only you can withdraw it."); a null amount prints "—" where the reference printed
`0.00` under a comment promising a placeholder. `BalanceSheet.vaultBase` is `available` only — a private row on
`/markets` would need `vaultPrivateBase` on the sheet (not added). Not seen in a browser; every state rendered
through the real components on `/dev/vault`.

**Session-key tap trading and the sponsor rail (fork B, 2026-09-02)** — `web/src/features/session/`,
`packages/markets/src/sessions/session-key.ts`, `packages/markets/src/vault/sponsor.ts`, `/api/sponsor`;
fixtures on `/dev/session`.

| Reference | Ours | Class | Approval |
|---|---|---|---|
| One-tap bets were Enoki-sponsored (`Ticket624Drawer.tsx` L128–132, `useSmartSubmit.ts`); no sheet for a browser key exists | Enable sheet (caps editor, worked example, capability receipt, one signature via `depositAndGrant`), manager, chip — in the Ticket's ported grammar (`.tk-modes`, `.tk-lev`, `.tk-control-label`) | Adapted — no source | **Needs user review** |
| Public / Private two-option control (`Ticket624Drawer.tsx` L1180–1205) | Wallet / Trading Balance route control in the same `.tk-modes` grammar; a tap routes to the grant when armed and `simulateCaps` passes, else to the chosen source with the reason in words | Adapted | No approval needed |
| Sponsor when it can, wallet when it can't (`useSmartSubmit.ts` L79–144) | `/api/sponsor`: forwarder target, selector allowlist (`placeFor withdraw withdrawPrivate revoke crankSettle sweep`; never capital intake), per-address and per-device sliding-hour gates that refuse without a device id, then `forwarder.execute`; the key pays otherwise and the manager says who pays | Adapted | No approval needed — AD-15 |
| — | The key's gas top-up at enable = the lane's own envelope (`GAS_CEILING["vault-order"]` × 60 gwei × 1.2 ≈ 0.72 STT); a measured `placeFor` ceiling would cut it tenfold | Ours | **Needs a decision** — a `constants/gas.ts` measurement once deployed |
| — | Sponsor gates are per process; the store-backed `sponsor_gates` table is deferred (AD-7) | Ours | Recorded |
| — | Only the session key is sponsored today; the owner's own withdraw / revoke / crank stay wallet-paid (a `sponsor` prop on `SubmitterSessionProvider` would extend it) | Ours | Recorded |

**The X rail (fork D, 2026-09-02)** — `web/src/features/x/`, `/api/x/*`, `packages/core/src/x/` (parser with
tests, the ported link messages), `packages/db` (`x_links`, `x_receipts`, `x_relay_state`), the `x-relay` ops
actor; fixtures on `/dev/x`.

| Reference | Ours | Class | Approval |
|---|---|---|---|
| Linking: `api/claim/x/link` (sign in with X, then a wallet signature over `xLinkMessage`); `trade-from-x`'s tweet-a-code flow calls an external connect worker whose source is not in the repo | The `api/claim` flow, ported; the tweet-a-code step says so | Adapted | **Needs user review** |
| `lib/xLink.ts` signs only the pair | Link/unlink messages carry `Issued: <iso>` with a 5-minute TTL (doc 02's nonce-backed challenge) | Strengthening | No approval needed |
| `/trade-from-x` L1–60, L139–156: "3x" leverage caps, two Suiscan proof links | The grant's real caps (per trade, per day, 8 open Windows, 30 days); the proof links point at `/docs` until real transactions exist; "settles back to you" kept because it is true | Truth correction | **Needs user review** |
| `/claim`: sealed auto-accounts funded by strangers' tweets | What waits is the Trading Balance of the wallet the account routes to; the reveal is a public read of that vault; the claim is connecting that wallet, with a signed re-link otherwise | Adapted | **Needs user review** |
| Tweet-vault cash-out to the wallet | The X betting balance is the EXECUTOR grant's budget; "Cash out" is `revoke`, returning the budget to the Trading Balance (copy says so) | Adapted | **Needs user review** |
| `/trade-from-x` dark island | Kept dark (`data-theme="dark"`) beside Reels per doc 04; the sticky strip keeps only the brand and "open the app" | Adapted | **Needs user review** |
| `alreadyLinkedOther` | Ported: an X account routed to another wallet is refused with that wallet named; only an unlink signed by the bound wallet moves it | Exact | No approval needed |
| Free-text instruction | Grammar `<btc\|eth> <up\|down> <stake> <1m\|5m\|15m\|1h\|4h>` in any order, synonyms tolerated, any other digit-bearing token refused by name | Adapted | No approval needed |
| Twitter bird icon | Lucide has no X glyph; an inline glyph | Deviation | Pre-approved class |

**Strategies and agents (fork C, 2026-09-02)** — `contracts/src/strategy/StrategyRegistry.sol` (10 forge
tests, incl. `test_AD10_no_pool_address_in_storage`, `test_AD5_registry_never_touches_subscriber_funds`),
`@masayume/core/strategies` (spec, the momentum model, record scoring, health — tested), `@masayume/markets/strategies`,
`packages/db` (`strategies`, `runner_heartbeats`, `strategy_fills`), the `strategy-runner` ops actor,
`web/src/features/strategies/`, `/strategies`, `/agents`, `/api/strategies/*`; fixtures on `/dev/strategies`.

| Reference | Ours | Class | Approval |
|---|---|---|---|
| Join in ONE signature (`LiveDesk.tsx`, one PTB) | Two signatures: vault `depositAndGrant`, then registry `subscribe` (which verifies the grant on the vault and pulls the fee to the creator; the registry never holds funds); the copy says so | Truth correction | **Needs user review** |
| Creator studio wears "Coming soon" and never lists (`app/strategies/page.tsx` L720–733) | Same markup, live: publish a spec the house runner honours | Adapted | **Needs user review** |
| Memory Market sells Seal-encrypted passes (L889–1030) | Headline and "More minds soon" capsule only; a sentence says playbooks are plain text stored by Masayume | Truth correction | No approval needed |
| Withdraw the desk balance without pausing (L376–390) | "Desk balance" is the grant's budget; withdrawing revokes first, so it pauses copying | Adapted | **Needs user review** |
| One hard-coded enclave agent as the featured desk | The active strategy with the most subscribers | Adapted | No approval needed |
| Leverage risk tiers | Caps: guarded = 1 open, price ≤ 0.70; balanced = 1 open, ≤ 0.85; active = 2 open, any price | Adapted — DreamDEX has no leverage | **Needs user review** |
| DiceBear portraits | Paper tile + glyph (the image host is outside the CSP) | Deviation | Pre-approved class |
| `/api/claim/x/me` on the X bar | Links to `/claim`; never claims a link | Adapted | No approval needed |

Runner health on the cards is derived at render (alive = now − lastTick < max(180 s, 3×interval);
"never started" is its own state; ops unreachable renders "status unknown", never alive). The runner
executes through `submitOrder` route `vault-grant` under a `strategy-runner` session, so the caps pre-check is
the lane's; `DRY_RUN` exercises the loop without sending. Not deployed: `/strategies` and `/agents` say
"StrategyRegistry is not deployed on this network yet".

**The adapter on the fork (2026-09-02, `scripts/spike/vault-fork.ts`)** — through the real lanes against
Shannon's venue on Anvil: deposit with its absorbed approval, an owner UP from the Trading Balance filled at
0.616, a STRATEGY grant read back, a delegated DOWN filled at 0.413 and booked to the owner under grant 1, a
void, a third party's crank crediting the balance, the balance sheet reading it, the vault seat's round from
the tally (`claim: paid`). The wallet seat's indexer read timed out during the run — unrelated to the vault.

**Needs the owner.** Deployment: a funded deployer key (STT from the faucet) and the go —
`forge script script/DeployEventVault.s.sol --rpc-url shannon --broadcast`; nothing is deployed, published or
funded without it. Also for review: the private bucket's wording on the portfolio, and the sponsor allowlist.

### ParlayReserve and `/parlay` (Stage 5, built and fork-verified 2026-09-02; live on Shannon the same day)

The reference's parlay is `parlay624::parlay624` (`contracts/parlay624-pkg/sources/parlay624.move`): one ticket
over N legs, escrow both sides at open (the opener's stake plus the house's `max_payout − stake`), resolve leg by
leg on the venue's own print, kill the ticket on the first losing leg, force-pay the owner on a full streak;
suppliers hold shares of `liquid + locked`. `ParlayReserve.sol` (`contracts/src/parlay/`) ports the escrow, the
incremental resolve, the exposure and per-instant caps and the share vault in shape, and changes what DreamDEX
changes:

| Requirement | Reference | Ours | Class | Status |
|---|---|---|---|---|
| Leg pricing | the opener supplies `prob_bps[]`; the contract only recomputes the combination (its header names this the production gap) | `openParlay` reads each Window's resting book (`getBookLevels`) inside the call and prices the chosen side as the cost-weighted price over the depth the ticket would need to hedge (`max(priceDepthRaw, maxPayout)`), rounded up; a book thinner than that depth refuses the leg (`ThinBook`) | Strengthening — the gap the reference named, closed | **Done** — 25 forge tests, golden vectors shared with vitest |
| A leg | `(expiry, lower, higher]` on the BTC feed | `(marketId, outcomeIdx)` — a Window and a side; the line is the Window's own opening print | Adapted — AD-10, market id only | **Done** |
| Settlement | `pyth_feed::normalized_spot_at(expiry)` + the venue's band rule, permissionless, idempotent | `resolveLeg` reads the market's `isVoided` / `isResolved` / `payoutNumerators` (the venue's own verdict), permissionless, idempotent; a settled Window not yet resolved reverts `MarketNotSettled` — crank again | Adapted | **Done**, fork-verified on a void |
| A leg the venue voids | not a case — the print is always recorded eventually; `admin_void` after a grace | the ticket voids on the first void leg: the stake goes back to the owner, the house's part back to liquid; **no admin void exists** because the venue's `voidExpired()` is itself permissionless, so nothing can trap a refund | Adapted — AD-5 | **Done**, fork-verified |
| Same-print correlation | λ · min leg prob floor when two legs share an expiry; per-expiry liability sub-cap | the same floor and sub-cap keyed on the Window's expiry instant (Windows across assets and cadences that close at the same second are decided by the same closing prints) | Exact (shape) | **Done** — the two Windows live during the fork run shared an instant |
| Open | one PTB: split the stake coin, `open_parlay(...)` | `openParlay(legs, maxPayout, maxStake)`: the caller's `maxStake` is the guard the reference had in the coin it split; a stake above it reverts `StakeAboveMax`, which the port surfaces as a requote | Adapted | **Done** |
| Claim | force-pays `owner`, never the caller; the object is deleted | `claim` pays `owner` only; the ticket stays as `CLAIMED` (history readable without an indexer) | Adapted | **Done** |
| Suppliers | `supply` / `withdraw` shares over `liquid + locked` | the same; `paused` stops opens and supply only — settlement, claims, refunds and withdrawals never pause | Exact (shape) | **Done** |
| Admin | keeper rotation, params, pause | `setParams` / `setPaused` / `setAdmin` on tunables only; no keeper (every crank is permissionless); open tickets keep the terms they were opened on | Adapted | **Done** |

**The port (`packages/core/src/parlay`, `packages/markets/src/parlay`).** `quoteParlay` mirrors `ParlayMath`
(VWAP, the correlation floor, the ceiling-rounded stake floor) and is golden-tested on
`pricing.vectors.json` by forge and vitest alike; `maxPayoutForStake` is the "Set stake" inverse the
contract does not have. On the page the quote is the chain's own (`previewOpen`) — one call for "Set
payout", up to three for "Set stake", the last always over a depth no shallower than the payout it returns,
so the chain can only charge less than the number shown. `submitParlayOpen` asks the chain once more before
any signature and returns `requote` instead of sending when the book moved. Reads are multicalls
(`getParlayReserveState`, `listParlaysOf` via `parlaysOf` paging, no event scan). Everything answered
"ParlayReserve is not deployed on this network yet" until `contracts/deployments/50312.json` carried
`parlayReserve`; it has since 2026-09-02 (`0x50Ce…C151`, `parlayReserveFromBlock` 477800945) and
`pnpm contracts:export` regenerated the module.

**`/parlay` (`web/src/features/parlay/`)** — the reference's page, `ParlayBuilder` and `ParlaySlip` ported from
source; the reference's own `SectionHeader` is now `components/shell/SectionHead.tsx` verbatim (its
`.section-head` rules were already in part-05/06); fixtures on `/dev/parlay`. **Driven in a browser 2026-09-03** (context/49): the BTC close streak preset, three legs quoted off the live books (34×, 2.60% combined), approve then open from the demo wallet, the slip's ticket "In play · 0/3 · 43.8×"; the chain charged 3.92 for the 171.70 the ticket had quoted at 5.00 as the odds lengthened between quote and open — Set-stake mode fixes the payout, as recorded above.

| Reference | Ours | Class | Approval |
|---|---|---|---|
| Legs are BTC "bells" only (binary-only v1); the strike is picked from a grid | Legs are the venue's live Up/Down Windows of any listed asset; the strike slot shows the Window's opening print, read-only ("opening print pending" before it prints) | Truth correction (doc 00 allowed change 4) | No approval needed |
| "BTC close streak" preset — UP at the three soonest BTC bells | The same, on the soonest BTC Windows; disabled with fewer than two | Exact | — |
| Quote: a dry-run per leg on the venue, debounced 400 ms | `previewOpen` on the reserve, debounced 400 ms, requoted every 12 s; a refusal shows the reserve's reason and "Retry" | Adapted | No approval needed |
| "Legs share a BTC market, so odds are adjusted for correlation." | "Legs settle on the same closing print, so odds are adjusted for correlation." | Truth correction | No approval needed |
| The stake leaves the wallet in the same PTB | Two signatures the first time (approve, then open), absorbed as everywhere (Approvals convention) | Adapted | No approval needed |
| Keeper cranks settlement; the slip shows "ringing…" at zero | A "Settle" pill on a leg whose Window the indexer reports settled (the permissionless crank); "Settling…" between expiry and that | Additive — no keeper runs here | **Approved by the user 2026-09-02** |
| Claimed tickets vanish (the object is deleted) | A "Paid" pill and "Paid out to your wallet." — the row stays | Additive | **Approved by the user 2026-09-02** |
| — | "Voided" state: "The venue voided a Window, so the ticket is void. Your stake is back in your wallet." | Additive — a state the venue can produce | No approval needed |
| Footnote "The full payout is set aside up front…" | The same sentence, then the reserve's own line: "Reserve: N tUSDC liquid · U% in play" (or that it is paused) | Additive — the promise as a figure | **Approved by the user 2026-09-02** |
| "View on Suiscan" | "View on the Shannon explorer" | Truth correction | — |
| framer-motion enters and layout animation | CSS enters (`pl-rise`, `pl-drop`, `pl-fade`), none under reduced motion; no layout animation | Deviation — no framer-motion dependency in this repo | Pre-approved class |
| `text-gray-*` utilities | the reference's own `--gray-*` vars in the CSS module (what its Tailwind config maps the utilities to) — they follow the theme, the compiled utilities do not | The Tutorial's rule, applied at port time | Recorded |

**Fork verification** — `context/42-parlayreserve-fork-verification-2026-09-02.md`: against Shannon's real
contracts, two legs (UP on the daily BTC Window, DOWN on the daily ETH Window, both closing at the same
instant) priced off the venue's books inside `previewOpen`, the open charging exactly the preview, the whole
payout escrowed, no market address in storage, then `voidExpired()` on one Window and a third party's
`resolveLeg` refunding the stake and releasing the house's part.

**Live on Shannon (2026-09-02, the owner's go).** Deployed by `0xdD7a…Bf9a` at
`0x50Ced768C80d499bA4FB956C7DF0c2beB078C151` (block 477800945, tx `0xb4ee…ed72`): the creation used 36,937,142
gas at 6 gwei against Somnia's own `eth_estimateGas` of 55,405,713 (forge's local simulation said 3.3M — the
limit must come from Somnia's estimate, and `gas × price` must fit the balance; recipe in `contracts/README.md`).
The house (the deployer) then approved (259,745 gas) and supplied 5,000 tUSDC (`supply` 898,941 gas), so the
reserve can lock up to 3,000 tUSDC of payouts under the launch params — the reference's demo cut (12% margin,
λ 0.40, 3 legs) with a 500 tUSDC jackpot cap; `setParams` tunes them without a redeploy. The adapter was then
driven end to end on an Anvil fork holding the live reserve (a 5.00 stake for 17.88 over UP 0.371 × DOWN 0.673,
the void refunding the stake to the cent) and live on Shannon: ticket 1 opened for 4.521740 against a 40.69 payout
on two 1-minute Windows sharing an instant, the UP leg at 0.115 lost on the oracle's print, a permissionless crank
settled the ticket `lost` and released the 36.17 the house had locked (context/42 §Live on Shannon). The four
review rows above were approved by the user the same day.

### RangeReserve, the Ticket's Range mode and `/games/range` (Stage 5, built and fork-verified 2026-09-02; live on Shannon the same day)

The reference's Range is the Ticket's second mode (`Ticket624Drawer.tsx` L203–333, L857–1030, L1257–1280): a
both-ends-finite band around spot, a width preset scaled per cadence, a draggable centre in five-dollar steps,
priced by the reference's own venue (`ticket624.core.ts` §range: `placeRangeMint624`, `rangeTicks624`) and settled
on its feed. DreamDEX has no band market, so `RangeReserve.sol` (`contracts/src/range/`) is the house that prices
and funds it, on the venue's own machinery (context/43):

| Requirement | Reference | Ours | Class | Status |
|---|---|---|---|---|
| Basis | the venue's normalized spot at expiry | the OracleHub's answer to the Window's own closing question (`markets(id).oracleQuestionId` → `pullNumericAnswer`), in cents — the same print the Window's Up/Down settles on; pending under one selector until two seconds after expiry, readable for good after | Adapted — the venue's oracle, no print of ours | **Done**, live-verified (context/43) |
| Band | `[lowerTick, higherTick]` in ticks, both finite | `[lowPrint, highPrint]` in cents, inclusive; `INSIDE` or `OUTSIDE` | Adapted | **Done** |
| Odds | the venue's own model (`entryProb` from a dry-run) | the house's: P(inside) under a normal return over the seconds left, σ per asset **measured from the venue's own closing prints** (BTC 0.615 bps/√s over 388 five-minute Windows, ETH 0.75–0.80 over 370, 2026-09-02), the distribution **centred where the Window's book puts the market** (P(close ≥ open) off the resting orders, Φ⁻¹ of it, over the parlay's 20-contract depth) — so a band opened mid-Window is priced against the current price, not the stale opening print; margin, longshot/near-certain refusals as the reference's 2–97% admission band | Adapted — a model where the reference had a venue; every input readable, every parameter public | **Done** — 100 forge tests incl. 12 golden rows shared with vitest, generated by a third implementation |
| The asset | known | the opener names it; the contract rebuilds the (asset, expiry) question definition and requires the hub's key to map to the Window's question (`WindowQuestion.sol`); cached per Window after the first open | Strengthening — the module row carries no asset | **Done**, fork-verified |
| The opening print | the market's strike | the hub's answer to the (asset, `tradingStart`) question through the same key; a Window without one is refused (`NoOpeningPrint`), never guessed | Adapted | **Done**, fork-verified |
| Venue guard | one venue | only Windows whose `oracleAdapter` is the hub and whose `originVenueId` is the pinned venue (two-decimal prints); the 1-minute lanes ride another adapter and are refused | Adapted | **Done** |
| Escrow | the venue's mint | the parlay's: the whole `maxPayout` at open, stake from the opener, `maxPayout − stake` from `liquid` into `locked`; per-expiry sub-cap because every band on one print is decided together | Exact (shape) | **Done** |
| Settlement | the venue's | `settle(roundId)`: permissionless, idempotent, `NotSettled` while the hub is pending; a voided answer refunds; `voidStale` after `staleAfterSec` (6 h) if the hub never answers — anyone may call, the stake goes home | Adapted — AD-5 | **Done** |
| Claim | the venue pays | `claim` pays `owner` only; the round stays as `CLAIMED` | Adapted | **Done** |
| Suppliers, admin, pause | — | the parlay's share vault, `setParams` / `setVolatility` / `setPaused` / `setAdmin`; open rounds keep their terms; settlement, claims, refunds and withdrawals never pause | Exact (shape) | **Done** |

**The port (`packages/core/src/range`, `packages/markets/src/range`).** `RangeMath` (the Φ table, its inverse, the
root, the band probability, the floored stake) is mirrored integer for integer by `@masayume/core/range` and pinned
by `pricing.vectors.json` (forge `RangeVectors.t.sol` ↔ vitest `pricing.test.ts`, the table checked against erf
within 1e-4). `quoteRangeOnchain` asks the chain (`previewOpen`) for "Set payout"; "Set stake" reads the basis
(`previewBasis`), solves with the mirror, then lets the chain price that payout. `submitRangeOpen` asks once more
before any signature and returns `requote` when the basis moved. Reads are multicalls (`getRangeReserveState`,
`listRangesOf` via `roundsOf` paging). A `range` gas lane (8M, not yet measured on Shannon). Everything answers
"RangeReserve is not deployed on this network yet" until `contracts/deployments/50312.json` carries `rangeReserve`.

**The Ticket's Range mode (`features/range/RangeTicketBody.tsx`, `BandControl.tsx`, `range-band.css`)** — the
reference's range body ported: "Winning range", From/To, the track with the spot marked, the width presets
(Tight / Balanced / Wide, `$60 span`), the centre readout with −$5 / recentre / +$5, the vermilion "Place RANGE
$X to $Y →". `BetModes` is live where the reserve is deployed and stays disabled, naming what is missing, where it is
not. Inside only, as the reference. The wallet route only (the reserve takes the stake by allowance).

**`/games/range` (`features/range/RangeScreen.tsx`)** — the reference has no range page; the surface is its Ticket's
range mode on the parlay page's frame (the same `pl-*` CSS: hero, §01 plate + ticket, §02 slip, §03 how it pays),
with the Window picker on the plate and both sides offered. Fixtures on `/dev/range`. **Seen in a browser 2026-09-03** (context/49): the picker, the band on ETH priced after the preset fix, the Ticket's rows unwrapped; no round was placed with a signature.

| Reference | Ours | Class | Approval |
|---|---|---|---|
| Presets ±$15/30/55, scaled 0.5 / 1 / 4 for 1m / 5m / 1h; a $5 centre grid; whole dollars | the same three on BTC to the dollar; other cadences scale by √time from the 5-minute anchor (15m ≈ 1.7, 4h ≈ 6.9, 1d 16); other assets scale by price ratio to the level the dollars were tuned at, with the grid snapped to a nice step and edges in cents under $10k (ETH: ±$0.40/$1.00/$1.80 on $0.20 at 5m) | Adapted — lanes and assets the reference did not have; the price scaling is the decision-log row of 2026-09-03 | **Needs user review** |
| "BTC must finish inside" · "BTC now" | `{asset} must finish inside` · `{asset} now` — the venue lists ETH too | Truth correction | No approval needed |
| The band drawn as a shaded region on the price chart (`drawPriceLine` `band`) | **not drawn** — the chart card and the Ticket are siblings; lifting the band into the hero is a follow-up | Pending | **Needs user review** |
| Gas-free footnote ("Gas-free · settles on its own, right on the price.") | "Settles on its own, right on the oracle's print." | Truth correction — no sponsor on this lane | No approval needed |
| Private bets refuse range ("Private bets cannot be range bets") | Private drops back to the wallet when a band is picked and the route control hides in range mode, as the reference hides its Public/Private block (`Ticket624Drawer.tsx` L1180); the sentence is the option's title (§PrivateDesk) | Adapted | No approval needed |
| — | `/games/range` with OUTSIDE as a side, the Window picker, the slip's Settle / Void (no oracle answer) / Claim pills | Additive — the game the doc-04 mode row names | **Needs user review** |

**Fork verification** — `contracts/test/RangeReserve.fork.t.sol` on a fork of Shannon (Window 70625, BTC 5m, question
49301): the opening print 77,105.51 read through the hub's key, the book centre 0.4535 off the Window's own resting
orders (the venue's makers were offline, so the test rests a maker's two bids first through `placeBinaryOrder`),
P(inside ±0.05%) 0.368, an 8.25 stake for a 20 payout charged exactly as previewed, the asset proof cached, no market
address in storage, `settle` refusing while the hub is pending, and after the grace a third party's `voidStale`
refunding the stake to the cent. The hub itself is covered by `OracleHub.fork.t.sol` and the live spike (context/43).

### MarketMakerVault and `/earn` (Stage 5, built and fork-verified 2026-09-02; live on Shannon the same day)

The reference's Earn (`app/earn/page.tsx`) supplies a venue-run house vault — the counterparty to every bet — and
shows its share price, value and utilization, with supply and withdraw-all. DreamDEX has no house; the other side
of a bet is the order book. So `MarketMakerVault.sol` (`contracts/src/maker/`) IS the maker, bounded on-chain
(context/44):

| Requirement | Reference | Ours | Class | Status |
|---|---|---|---|---|
| What the capital does | backs the venue's payouts; the venue prices | rests a post-only YES bid and YES ask on the venue's live Windows, at least `minSpreadRaw` apart, inside price bounds, capped per quote, per Window, in aggregate and in Windows; the only thing it can buy is a complete set at a discount | Adapted — the maker where the reference had a house | **Done** — 25 unit tests, fork-verified: a pair rested inside the live ETH book, both sides filled by takers, 10 sets merged for 10.00 |
| Who quotes | the venue | one key the admin names (`setMaker`); the actor is `services/ops/src/actors/market-maker` (dry-run by default, the bot kit's maker loop: fair = the book's mid, requote only when the fair moved, quotes carry their own TTL) | Adapted — the bounded maker actor doc 03 names | **Done** — not yet run live |
| Share price | `vaultValue / totalPlpSupply`, `vaultValue = balance − mtm` | `(liquid + Σ deployed) / shares`, deployed at cost per Window, floored — never a spread before it is merged, never a mark on unpaired inventory | Adapted — conservative by construction | **Done** |
| Utilization | `maxPayout / balance` | `deployed / totalValue` | Adapted | **Done** |
| Withdraw | "withdraw anytime", the venue's own request cycle on the live pool | from `liquid` only; refused while a closed Window is unsettled (`UnsettledWindow`) — the page settles it first, anyone may | Strengthening — no exit ahead of an unbooked loss | **Done** |
| Supply paused | `SUPPLY_CLOSED` hard-coded for a retired pool, the banner up front | the vault's own `paused` — the same banner, only when true; settlement, merges and withdrawals never pause | Truth correction | **Done** |
| Exposure and return | not shown (the reference's history endpoints were dead) | §02 "Where the capital is": one row per Window the maker is on — deployed, inventory both sides, state (resting / paired / one-sided / closed), the realized result once settled; Merge and Settle on the row | Additive — the "real inventory and exit accounting" doc 03 asks for | **Needs user review** |

**The port (`packages/core/src/maker`, `packages/markets/src/maker`).** The flow arithmetic (`deployedOf`,
`realizedOf`) and the actor's pair construction (`fairYesRaw`, `pairAround`, `quantizeQuantity`, `quoteExpiryNs`)
are pure and tested (8 vitest). `getMakerVaultState`, `listMakerOpenWindows` (books + live inventory),
`listMakerHistory`, `getMakerSharesOf`, `getMakerUnsettledExpired`, `readPoolTop` (the book's top and grid in one
multicall); `MakerIntent` on the tx lane — `maker` gas lane (8M, unmeasured) for quote/pull/settle, the vault lane
for supply/withdraw/merge; hooks `useMakerVault` / `useMakerWindows` / `useMakerHistory` / `useMakerShares`.

**`/earn` (`web/src/features/earn/`)** — the reference's page from source: the hero "Earn the *spread*." with the
live panel (share price 4 dp, the delta chip above par, vault value, utilization + meter), §01 the deposit card
(amount, Max, the wallet-scaled quick amounts, Supply) and your position (value, shares at the share price,
Withdraw). Fixtures on `/dev/earn`. **Driven in a browser 2026-09-03** (context/49): a 50 tUSDC supply landed (50.13 shares at 0.9973), the withdraw was refused by the vault until the exit settled every closed Window — fixed — and five layout and honesty defects came out of the page (a nested `<main>`, "wallet 0.00" while reading, the cards overflowing a phone, labels resolving one a second, a Base UI console error).

| Reference | Ours | Class | Approval |
|---|---|---|---|
| Panel label "Closed pool · 4-16" / "Predict PLP" (its own truth correction for a retired pool) | "Live · maker vault" / "Paused · maker vault" / "No maker key · quotes off" · "Masayume MM" | Truth correction | No approval needed |
| A decorative sparkline beside "Up from 1.0000 at launch" (drew no data; the reference's own comment: "No history source ⇒ no sparkline") | not drawn; "Below 1.0000 — the vault is carrying a loss" when so | Truth correction (doc 05 §No fake-data) | No approval needed |
| §01 meta "withdraw anytime" | "withdraw what is idle, any time"; the Withdraw button takes what `liquid` covers and names what is still deployed | Truth correction | No approval needed |
| "Withdraw all" | "Withdraw N idle" when capital is deployed; every closed unsettled Window is settled first (the page sends the permissionless crank, one signature each, asking the vault again after each — four were closed at once when the flow ran, context/49) | Adapted | **Needs user review** |
| — | §02 the Windows table with Merge / Settle; its labels read in one round (`useMarketsLite`), "…" only until they land | Additive | **Needs user review** |
| The leverage-reserve handlers on the same page (`doSupplyReserve`, `doSettle`) | their JSX is gone from the pinned source (orphaned handlers); the leverage reserve has no supplier UI and is supplied by the house — §LeverageReserve | Adapted | No approval needed |

**Fork verification** — context/44: against Shannon's real contracts on Window 70978 (ETH 4h), a pair at
0.311 / 0.337 rested (the venue refused a flat 0.48 bid as `PostOnlyWouldCross`, and the venue's `BUY_NO` price
turned out to be the YES price — both recorded), two takers hit both sides, `merge` returned 10.00 for 10 sets
with the credit collected in the same call, a second pair pulled to the cent.

### LeverageReserve, the Ticket's leverage and the portfolio's boosts (Stage 5, built and fork-verified 2026-09-02; live on Shannon the same day)

The reference offers leverage three ways: the Ticket's own arithmetic (`lib/sui/ticket624.core.ts`: `qty = stake·L/prob`,
a win pays `qty − stake·(L−1)`, "L× can knock out before expiry"), an underwriting reserve that fronts the rest of the
notional for an 8% premium with no liquidation (`underwrite.move`, the "v4" its constants name), and a borrow-and-
liquidate margin desk at a 120% maintenance line (`margin.move`, the path its web ticket actually takes). Doc 03's row
asks for a "prefunded reserve/underwriter with capped loss and explicit maximum payout; never a cosmetic multiplier".
`LeverageReserve.sol` (`contracts/src/leverage/`) is the Ticket's arithmetic made a contract on DreamDEX (context/45):

| Requirement | Reference | Ours | Class | Status |
|---|---|---|---|---|
| The boost | `qtyForStake`: `stake·L / prob` contracts; `winForQty`: less the financed `stake·(L−1)` | `sizeForStake` walks the live book for what `stake + fronted − premium` buys, on the venue's lot; the open buys exactly that as an IOC taker and charges the stake the fill implies; a win pays `quantity − fronted` | Adapted — the book prices it, in-transaction | **Done** — 34 unit tests, the shared vectors, fork-verified |
| Who fronts | the venue (624) / the yolev reserve's suppliers / the lending pool | the reserve's suppliers, shares of `liquid + outstanding`; the front counted at cost, the premium as income | Adapted | **Done** |
| The knock-out | "can knock out before expiry" (624); the margin desk liquidates under `debt × maintenance`, keeper-executed, 5% to the liquidator; the underwriting reserve has none | anyone may sell the position at the resting bids once the book's mark is under `fronted × maintenance`; the reserve repaid first, the rest to the owner, nothing to the cranker; a thin book sells what it can and leaves the position live with a smaller claim | Adapted — permissionless, unpaid | **Done** — fork-verified against live bids |
| Cash-out | mid-round close disabled on the reference's testnet ("thin AMM spread misprices an early exit") | the owner's `close` at the bids with their own `minProceeds`; the row floors it 3% under the mark | Adapted | **Done** — not seen in a browser |
| Settlement | keeper-cranked `settle`/`close`, permissionless fallback in the client | `settle` redeems through the module, repays the reserve, pays the owner; permissionless; a void pays half a contract | Adapted | **Done** — void fork-verified, won/lost in the unit suite |
| Caps | max leverage (3×), premium 8% of fronted, maintenance 120%, exposure 60% | the same, plus an entry band (0.05–0.95), a cap per position and per Window, a cap on open positions, no opens in the last 90 s, and `Underpriced` for a boost that cannot beat 1× when right | Strengthening | **Done** |
| Funding source | the Trading Balance with a wallet top-up in the same PTB | the wallet only (the vault has no outbound path, AD-5); the chips lock off the wallet route | Deviation | **Needs user review** |
| Withdraw | suppliers redeem any time from idle capital | from `liquid` only; refused while a position past its Window's expiry is unsettled (`UnsettledPosition`) | Strengthening | **Done** |

**The port (`packages/core/src/leverage`, `packages/markets/src/leverage`).** The arithmetic is pure and mirrored line for
line (`walkQuantity`, `walkBudget`, `terms`, `winIfRight`, `isKnockable`, `split`, `markOverLevels`; 13 vitest over
`sizing.vectors.json`, the same rows forge asserts in `LeverageVectors.t.sol`). `getLeverageReserveState`,
`listLeveragePositionsOf` (paged), `listLeverageOpenPositions`, `getLeverageMark`, `sizeLeverageForStake` /
`previewLeverageOpen` (the chain's own quote), `getLeverageSharesOf`; `LeverageIntent` on the tx lane, a `leverage`
gas lane (8M, **unmeasured**), `submitLeverageOpen` with the requote guard; hooks `useLeverageReserve` /
`useMyLeveragePositions` / `useLeverageMark`; `leverage-reserve.abi.ts` exported.

**The Ticket (`ticket/LeverageChips.tsx`, `features/leverage/`)** — the reference's 1×/2×/3× chips
(`Ticket624Drawer.tsx` L1074–1090), live: 1× is the plain order; a higher multiple swaps the book quote for the
reserve's (`BoostCard`: the payout if right, max loss, exposure, odds, with the front, the fee and the line in its header and bar legend), prints the reference's one sentence
("2× can knock out before expiry.") and, under it, what the reference never showed — the front, the fee and the
line — then the CTA "Buy UP 2× for <stake>". The Call carries the reference's caveat ("✦ 2× leverage. It can knock
out before close.", `BetPlacedCard.tsx` L123–127) on screen and its PNG line (`openBetShareCard.ts` L360) in the
export. `/portfolio` lists the wallet's boosts under its open bets (`LeverageBetRow`: the multiple, your equity at
the mark, the line, Cash out / Settle) and the last five that settled, knocked out or cashed out. Fixtures on
`/dev/leverage`; a boosted Call on `/dev/share`. **Driven in a browser 2026-09-03** (context/49): the chips, the boost card at 2× and 3× (real quotes: 106.62 payout on 9¢ odds, 16.42 on 45¢), a 2× open on BTC 5m for 4.99, The Call with the caveat (its unit line now precedes it, as the reference's order has it), the portfolio row "LIVE · 2× BOOSTED · Yours now 3.07 · Cash out".

| Reference | Ours | Class | Approval |
|---|---|---|---|
| Chips disabled for a private bet, title "Private bets are placed at 1x." | Chips disabled off the wallet route, under a pause, or above the reserve's ceiling; the title says which | Adapted | No approval needed |
| One sentence under the strip: "L× can knock out before expiry." | The sentence, then one line on how a knock-out settles; the front, the fee and the line sit in the card's header and bar legend | Additive (truth) | **Needs user review** |
| Leverage column `1.0×` on every open bet (`Portfolio624Section` L452) | The multiple only on boosted rows; plain rows say nothing | Adapted — the recorded Stage 2 deviation, resolved | **Needs user review** |
| `LeveragePortfolioPanel`: value, cashout, live P&L, health % — defined at `app/portfolio/page.tsx` L368 and never mounted (`PORTFOLIO_UX_SPEC.md` L398 lists it among the deletions); the live reference UI is the `1.0×` column | "Yours now" (mark − front), the line or "at the knock-out line"; no percentage health | Adapted | **Needs user review** |
| Earn page reserve handlers (`doSupplyReserve`, `doSettle`) with no JSX in the pinned source | No supplier UI; the reserve is supplied by the house like the parlay and range reserves | Adapted | No approval needed |

**The keeper (`services/ops/src/actors/leverage-keeper`)** — one key, dry-run by default: settles what the venue
settled, knocks out what is under the line and has bids to sell into; both permissionless, both pay the owner.
Env: `LEVERAGE_KEEPER_PRIVATE_KEY`, `LK_REFRESH_MS` (20 s), `DRY_RUN`, `VENUE_ID`. Registered in `main.ts`.

**Fork verification** — context/45: on Window 70978 (ETH 4h) with live makers at 0.679 / 0.707, a 2× boost on 10
bought 27.157 contracts for a 9.999999 stake, 10.00 fronted and 0.80 premium; the mark at the bid was 18.44 against a
12.00 line; with the line raised over the mark (the reference's own proof-script move) a stranger's knock-out sold
into the live bids for 18.44, the reserve repaid 10.00 and the owner paid 8.44; a second boost voided through the
venue's `voidExpired` settled at half a contract; the house withdrew its 5,000 plus the two premiums.

### PrivateDesk, the Ticket's Private option and the claims list (Stage 5, built, fork-verified and live on Shannon 2026-09-03)

The reference's private bet is a `private_budget` Move module and an HTTP desk (`lib/privateBet.ts`,
`lib/sui/privateBudget.ts`, `services/private-bet-executor/server.mjs`, `openAuth.mjs`, `enclaveTicket.mjs`;
context/14 §7): an owner funds a budget only they withdraw and allows the desk a cap; each bet opens in a fresh
throwaway account through three transactions so none names the owner and the position together; an attested
enclave signs the bearer ticket that is the only claim; the tickets live in the browser with back-up and restore.
Doc 03's row: "ephemeral account or scoped session; described as link-private unless stronger privacy is actually
built"; doc 00: "Link-private is not anonymous." `PrivateDesk.sol` (`contracts/src/private/`) is the module on DreamDEX
and `packages/markets/src/private/desk-*.ts` the desk, run inside Next API routes (context/46):

| Requirement | Reference | Ours | Class | Status |
|---|---|---|---|---|
| The budget | `private_budget::deposit` / `allocate(agent, allowance)` / `revoke` / `withdraw_to_sender`; fund-and-allocate in one PTB | `deposit`, `allow`, `depositAndAllow` (one tx), `revoke`, `withdraw` — pays `msg.sender` only; the desk is one pinned key (`desk()`), not an address the owner names | Exact (shape) | **Done** — 8 unit tests |
| The open | three txs: `charge_to_pool(owner)`, `fund_slot_from_pool(slot)`, `mint_in_slot(slot, market)` with `min_quantity 0` and `max_cost = stake` | `chargeToPool(owner, amount, key)`, `fundSlot(slot)`, `mintInSlot(slot, market, side, minQuantity)` — sized off the live book to the slot's balance, the escrow clamped to the stake, the dust kept | Exact (shape) — the book prices it in-transaction | **Done** — fork-verified |
| The way home | redeem, then `sweep_slot_to_pool(slot)`, then `credit_from_pool(owner)` (winnings land in the private balance, not the Trading Balance: "settling straight to the Trading Balance cannot be done without naming both halves") | `settleSlot` (permissionless), `sweepSlotToPool(slot)`, `creditFromPool(owner, amount, key)` — into the private balance, the same reason; the vault's `privateAvailable` bucket stays for what it was (a move-aside) | Exact (shape) | **Done** — void fork-verified, won/lost in the unit suite |
| The desk's record | an on-disk ticket store with no owner ("exists only so a position cannot be redeemed twice") | **none**: the three keys derive from the owner's authorisation signature and the contract's `chargedOf` / `slotOf` / `creditedOf` say what landed; an open or cash-out that lost its reply is sent again and resumes | Strengthening | **Done** — `spike:private-live` re-sends the same authorisation and nothing is charged twice |
| The claim | an enclave-signed BCS ticket, its key pinned on chain in `ticket_seal::PrivateDesk`, verified locally with ed25519 | an EIP-712 `Claim` signed by the desk key the contract pins, verified locally with `verifyTypedData` against `desk()` | Adapted — a key, not a TEE; the surfaces say "the desk key the contract pins" | **Needs user review** — the trust model |
| Authorising an open | `openAuthMessage`: a human-readable personal_sign naming the bet, 5-minute TTL, future-dated refused | `privateOpenMessage`, the same shape, rebuilt by the route from the chain's own Window (never the caller's strings); the signature doubles as the keys' seed | Exact (pattern) | **Done** — 7 vitest |
| Honesty | "BETA", "link-reduction, not full anonymity", never "anonymous / untraceable / zk" | the same words on the control, the note and the panel; the panel names the correlation that remains and what the desk can and cannot do | Exact | **Done** |
| The pool's bound | `no function hands the desk a spendable coin` | the desk funds only what was charged and credits only what was swept (`PoolShort`), **once per key** (`KeyUsed` — two desk instances racing on one claim cannot pay it twice; the security reviewer's high finding); it cannot withdraw; the pool holds only what was just charged or just won; the band is checked at the charge; `sweep` resolves the pool by market id | Strengthening | **Done** — redeployed at `0x4D27…28bB` |
| The desk's own safety | a per-owner allowlist and a stake cap in the executor's env; no rate limit | a pre-flight `sizeForStake` and a check of the desk key's STT before any charge; opens gated per owner (20/h) and per address (60/h) like the sponsor's calls; the authorisation signature canonicalised (a high-`s` twin or a 0/1 recovery byte would have mapped one signature to four slots); the message names the desk contract and the chain and states the stake to the base unit; error text to anonymous callers is one line | Strengthening | **Done** |

**The port (`packages/core/src/private`, `packages/markets/src/private`).** Types, the wire schemas, the message and
the EIP-712 types in core; `deriveSlotKeys`, `signPrivateClaim` / `verifyPrivateClaim` (4 vitest), reads
(`getPrivateDeskState`, `getPrivateBudget`, `getPrivateSlot`, `sizePrivateForStake`), the owner's `PrivateIntent`s on
the tx lane, a `private` gas lane (6M, **measured live below**), and the desk: `createDeskClient` (one key, one nonce
queue, a lock per slot), `openPrivateBet` (the resumable state machine; a mint the book refuses is swept and credited
back with the reason), `cashOutPrivateBet` (settle → sweep → credit, each skipped when the contract shows it landed),
`deskHealth`. Hooks `usePrivateDesk` / `usePrivateBudget` / `usePrivateSlot`; `private-desk.abi.ts` exported.

**The surfaces (`web/src/features/private/`, `/api/private/{status,open,cashout}`)** — from the reference's source:

| Reference | Ours | Class | Approval |
|---|---|---|---|
| Public / Private two-option control (`Ticket624Drawer.tsx` L1175–1219), off until the desk reports ready, "retry" beside it | Private as the route control's third option (Wallet / Trading Balance / Private), shown where a desk is deployed, disabled with the reason in its title, "retry" beside it; drops back to the wallet — and says so — when the desk goes away, and silently when the bet is a band | Adapted | **Needs user review** |
| Private switched OFF the moment the stake passes the cap (L263–266: "the option is what goes away") | **Not flipped**: the option stays chosen and the CTA names the cap (`private-over-cap`); a silent private-to-public flip is the one outcome the route exists to prevent (the code-reviewer agent's finding) | Deviation — safety | **Needs user review** |
| Top-up on a short private balance (L500–518) | The same for a short BALANCE; a short ALLOWANCE (every charge spends it; a refund restores the balance, never the permission) is a zero-amount re-allow, no wallet money — its own line and CTA | Strengthening | No approval needed |
| Retry after a failed open: sign again (L565–583) | A reply that never arrived keeps the authorisation per owner (`masayume.private.pending`) and the next tap re-sends it — the keys derive from the signature, so nothing is charged twice; the desk refuses a stale authorisation only for a charge that has not landed | Strengthening | No approval needed |
| `privBlocker` (L443–448): checking, not available, the floor, the cap | `derivePrivateBlocker`: the common ladder without the funds checks, then `private-probing` / `-unavailable` / `-below-min` / `-over-cap` / `-unreadable` / `-refused`, the wallet's shortfall as `over-balance` | Exact (pattern) | No approval needed |
| The budget line (L1221–1247): "X in your private balance." / "Private bets spend a balance only you can withdraw." · "add funds"; else "Always 1x. Cash out from this device." | The same two lines; "Always 1×. Cash out from this browser, on Portfolio."; the honest one-liner under it | Exact | No approval needed |
| Top up and bet as ONE action (`place()` L541–563): four stakes' worth, never more than the wallet holds, the new balance allowed | The same: `Add X and buy UP privately`, then the signature; the note says how many signatures | Exact | No approval needed |
| The desk prices the bet itself; the public quote strip shown | `PrivateQuoteRows`: cost, payout if right, max loss, odds — the desk contract's `sizeForStake` off the live book | Adapted | No approval needed |
| `Bet UP privately →`; toast `Private bet placed: UP $64,500` | `Buy UP privately for <cost>`; toast `Private bet placed: UP on BTC` | Exact (pattern) | No approval needed |
| Chips disabled under Private, "Private bets are placed at 1x." | The same title on the chips | Exact | No approval needed |
| Range refuses Private ("Private bets cannot be range bets…") | The option disabled in range mode with that sentence; switching to Range drops the source to the wallet | Exact | No approval needed |
| Tickets in `localStorage` (`yosuku_private_bet_tickets`, 40), refreshed every 4 s and on `storage` | `masayume.private.claims` (60), the same cadence | Exact | No approval needed |
| `PrivateClaims.tsx`: verify on sight, Back up / Restore (existing claims win), the warn line, the row (side, strike, stake, payout delta, when, Verified / Unverified, Cash out), the foot — mounted nowhere in the pinned source (only `/dev/private`) | Ported verbatim with its CSS (`private-claims.css`, the reference's own light overrides, plus the plate's cream inks); the Window in place of the strike; mounted as the plate's Private pool row panel with the budget controls above it | Restored from the reference's own component, mounted where its pool row is | **Needs user review** |
| The portfolio computes `privateBalanceDusdc(tickets) + vaultPrivateDusdc` (page.tsx L195) and never renders it — its `PoolId` has no private pool | The desk's balance plus the vault's private bucket; the row shows whenever a desk is deployed | Additive — the row and its panel are ours | No approval needed |
| `TradePanel`'s honest line: "Your main wallet stays off this trade…"; the incognito toggle's info: "your bet stays separate from your main wallet, so it isn't tied to your public trading history" | "Kept separate from your wallet, so it is harder to link back to you — not anonymous." (from `MOBILE_INTEGRATION.md` §5 / `MOBILE_COPY_DEJARGON.md`) | Exact (spirit) | No approval needed |
| — | The panel's trust and correlation sentences: a stolen desk key could redirect what an owner allowed it, so the allowance is the blast radius (keep it to a few bets); the charge and the slot's funding stay visible seconds apart | Additive (truth) | **Needs user review** |

**The desk service** — `web/src/features/private/desk.server.ts` holds `PRIVATE_DESK_PRIVATE_KEY` (the browser never
learns it), `/api/private/status` answers `deskHealth` (no key, not deployed, the key is not the pinned one, paused,
too little STT), `/open` verifies the owner's signature over the message rebuilt from the chain's Window and runs
the resumable open, `/cashout` takes the claim and nothing else (a forged or edited claim fails against the pinned
key). Fixtures on `/dev/private` (the control's states, the claims list on real signatures from a throwaway key,
then the live panel). **Driven end to end in a browser on 2026-09-03** (context/47, a scripted wallet under Playwright against the live desk): the faucet card, top-up-and-bet as one action, a mint refunded on the spot, an open, The Call, the claims list with verify-on-sight and back-up, cash-out 68 s after the close, withdraw. Two defects fixed from it: every reading query now waits for the boot (`ce17add`) and the open's guard is read after the signature (`724209a`). Restore, Revoke, the resume of a lost reply, a losing settlement, 390 and dark mode were not exercised.

**Fork verification** — context/46: on Window 71691 (BTC 4h) a 10 stake sized to 19.23 contracts at 0.52 off the
live book; the three-transaction open left no owner in any log and no venue address in storage; voided through the
venue, a stranger's settle paid half a contract, the sweep and credit brought 9.6154 home, the owner withdrew to
the cent and the desk's wallet read zero.

### `/surface` — the market surface (Stage 5, built 2026-09-03)

The reference (`reference/yosuku/app/surface/page.tsx`) reads Predict's on-chain SVI volatility surface back: the
smile across strikes, every strike priced as a ladder, ATM implied vol across expiries. Doc 03 §Surface: "Yosuku's
SVI surface cannot be relabeled as if DreamDEX exposes the same model … keeps the route and analytical density but
shows real DreamDEX structures." `web/src/features/surface/` and `@masayume/core/surface` (context/48):

| Reference | Ours | Class | Approval |
|---|---|---|---|
| Crumb · "Volatility Surface" · the intro naming the SVI model | Crumb · "Market Surface" · the intro naming the live order book — the ticket uses its top, this page reads the whole structure | Adapted (identity + truth) | No approval needed |
| Asset pills, one chip per active oracle labelled by days/hours to expiry, default the soonest, focal resets on asset change (L96–120, L200–236) | The same; chips carry the cadence and the clock; the focal Window is kept by id so a Window that closes drops to the next, never onto another by position | Exact (pattern) | No approval needed |
| §01 Surface — Forward · ATM implied vol · Time to expiry · Live markets (L253–270) | §01 The book — Opening print (spot against it, who is winning) · UP mid (bid and ask under it; the ask alone on a crossed book) · Spread (cents and share of the mid) · Closes in (the phase word under it) | Adapted — the venue's figures in the reference's four tiles | No approval needed |
| §02 Volatility smile — canvas line, forward marker, x labels (L272–294) | §02 Depth — cumulative size at each price on the UP book, both sides on one axis, the mid marked; SVG, labels in HTML | Adapted | No approval needed |
| §03 Strike ladder — 11 rungs, UP/DOWN price and IV, the ATM rung highlighted (L297–322) | §03 Slippage — a stake ladder 1…250, each walked over the asks as an IOC taker fills: average, slippage against the top, contracts, payout after the fee, fill; rows past the visible book step back and are named; the side toggle is the reference's chip | Adapted — the same shape over the book's own arithmetic | No approval needed |
| §04 Term structure — ATM IV across the asset's expiries, "need ≥2 live expiries" (L325–340) | §04 Term structure — every live Window of the asset on its own book, nearest close first: the curve of UP prices (categorical x: five cadences from 5m to 1d share no readable linear axis), each point pressable to become the focal Window; then the same Windows as rows | Adapted | No approval needed |
| `a b rho m sigma` under the smile | the lot, the fee and "the ticket caps its own order's cost; this ladder shows the book itself, unguarded" under the ladder | Adapted (the parameters that actually govern) | No approval needed |
| Dark-only page (`bg-bg`, `border-white/[0.08]`, `text-gray-*`) | Flips with the theme: inks are the reference's `--gray-*` vars and `--white`; the boxes take part-14's light steps by hand | Pre-approved class | No approval needed |
| — | A crossed book (bid ≥ ask) is named as such on every section; no mid or spread is printed for it | Truth | No approval needed |
| Not in the reference's header nav | Not in ours either; reachable by URL | Exact | No approval needed |

**Honesty.** Every figure is a reading of the chain's own book or a named state: hydrating is "…", an empty side
"—" with its own sentence, a failed read the diagnosis, a stale one the tick. The payout column waits for the
settlement fee rather than assuming zero (AD-15); the ladder waits for the pool's lot rather than guessing one.

**Port.** `@masayume/core/surface`: `bookStructure` / `impliedUp` (13 vitest across the module), `cumulativeDepth` /
`depthBounds`, `slippageLadder` over `walkBudget` / `walkQuantity`, `termPoints` / `termBand`. `@masayume/markets/react`
grew `useBooks` (several markets' books on one subscription, sharing the coordinator's entries), `useBookParams` and
`useSettlementFee` (the same cache entries `useStakeQuote` uses). Fixtures on `/dev/surface`. Inspected in Chrome at
1280 and 390 in both themes (context/48 §Gates).

### Toast (Stage 2, done 2026-09-01)

Ported from `reference/yosuku/components/Toast.tsx`. The reference's *behaviour* is thinner than what
was already here — no portal, no live region, no swipe, and a close button with no handler (only the
card's own `onClick` dismisses, L125–127) — so the Base UI primitive stayed and took the reference's
presentation, rather than the reverse. Adopting the reference wholesale would have traded away
accessibility for a visual match.

| Element | Reference | Now | Status |
|---|---|---|---|
| Bottom-right stack, newest nearest | L69 | already the viewport's placement | **Done** |
| `rounded-xl`, `bg-neutral-900/90`, `backdrop-blur-xl` | L120 | same utilities — `bg-neutral-900/90` is the reference's own, so `part-14.css` remaps it on cream with no second rule | **Done** |
| `min-w-[280px] max-w-[400px]` | L120 | `styles/toast.css` (`design-literals` bans px in TSX); the floor drops below `sm`, where 280px would overflow the gutter | **Adapted** |
| Border tinted by type (`emerald-500/20`, `rose-500/20`, neutral) | L93–97 | `.toast-plate[data-type]` — the tint is `--profit` / `--loss` at 20% | **Done** |
| Icon coloured by type (`emerald-400`, `rose-400`, gray) | L87–91 | `text-profit` / `text-loss` / `text-ink-muted` — **the reference's hex values *are* these tokens**: `#34D399` and `#FB7185` | **Done** |
| Spring entry/exit from the right (`x: 80`, damping 22 / stiffness 300) | L116–119 | `translateX(120%)` on the starting and non-swipe ending styles, on `--ease-bounce` — Yosuku's own overshooting curve | **Adapted** — no framer-motion added for one component |
| Warning type | — | follows the same formula, so the fourth kind is not the only one whose border says nothing | **Additive** |

### The Room (Stage 3, done 2026-09-01)

Ported from `components/MarketRoom.tsx`, `CommentRoom.tsx` and `lib/sui/useCommentRoom.ts` into
`web/src/features/room/`, over a real store (`packages/db`) and a real gate
(`web/src/app/api/room/*`). Opens from the hero foot and from every §01 card.

**The gate is the server's, not the sheet's.** Two facts must hold before a wallet reads or posts:
it owns the address (an EVM `personal_sign` the route verifies) and it holds a position on that
market (a chain read the route makes). A gate that lives only in the UI is not a gate — the sheet
says "bettors only", so the server has to mean it.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Gate machine `connect → locked → joinable → joining → joined` | `useCommentRoom.ts` L5–10 | `useRoom.ts` | Exact + one | **Done** — plus `unavailable`, which the reference cannot have: its store is the chain, ours can be absent, and "not connected here" must never look like "nobody has posted" |
| Position gate | on-chain `market_room_rule::join` → `bet_registry::has_bet` | `gate.server.ts` `holdsPosition` | Adapted | **Done** — `marketsProvider.listOpenPositions`, the closest honest read: a bettor holds the outcome tokens from fill until redemption. **Narrower than the reference**: a wallet that already redeemed a settled Window loses that Room. Recorded rather than widened — inventing more access than the chain can prove is the wrong way round |
| Identity | zkLogin wallet gates; a separate Ed25519 **delegate** does all messaging | one wallet | **Simplified** | **Done** — the delegate exists only because the messaging SDK rejects zkLogin's signature scheme. An ordinary `personal_sign` is exactly what a server can verify, so the wallet holding the position is the wallet that speaks. `alsoTry` went with it: it exists because the reference's ticket silently rolls a bet to the next round; ours does not |
| Encryption | E2E via Seal + the Sui messaging SDK | — | **Not carried** | **Recorded** — comments are stored in the clear and the server can read them. The reference's header badge reads "Bettors only · Encrypted"; **ours says only "bettors only"**, because the second half would be false |
| Sheet: framed panel, vermilion top hairline, mark tile, title, badge, close | `CommentRoom.tsx` L127–152 | `CommentRoom.tsx` + `styles/room.css` | Adapted | **Done** — Base UI `Dialog` keeps the focus trap and dialog role, as the Toast and Tutorial do |
| Dark island (`data-theme="dark"` pinned on the panel) | L130 | `styles/room.css` | **Deviation** | **Done** — the sheet follows the theme, on the user's 2026-09-01 ruling for the same defect on `/reels`. Light values are Yosuku's own light-card treatment, as `reel-theme.css` uses. One ink/surface set per theme |
| Onboarding states, haloed icon each | L154–200 | `RoomStates.tsx` | Exact shape | **Done** — `locked` also names *where* the rule lives, since "the check is on-chain" is the difference between a gate and a setting somebody could be asked to waive |
| Thread: author disc hued from the address, `timeAgo`, own-message tint | L26–39 | `CommentRoom.tsx` + `styles/room-thread.css` | Exact | **Done** — hue and `timeAgo` are the reference's own functions |
| Composer, 280 cap, whitespace collapsed | L118–125 | same | Exact | **Done** — the cap is enforced in the input, in the schema and in a `CHECK` constraint |
| 9 s thread poll while joined | L37, L117–127 | `useRoom.ts` | Exact | **Done** |
| Error boundary around the whole Room | `MarketRoom.tsx` L28–42 | `MarketRoom.tsx` | Exact | **Done** — same reasoning kept: never a full-page crash over a comment thread |
| Mounted at the page, not inside the card | `markets/page.tsx` L893–903 | `MarketsScreen.tsx` | Exact | **Done** — including the reference's reason: a cadence switch cannot leave it open on a Window the page is no longer showing |

**Verified against a real database**, not only by the gates. 14 checks over the live endpoints, all
passing: read with no token (400) and with a garbage token (401); join with a malformed signature
(401), with a **valid signature from a wallet holding no position (403)**, with a stale signature
(400), and with a signature made for a different market (401); a forged MAC, an expired token and a
token bound to another market (401 each); then the happy path — read, post, read back — plus a
spoofed `author` in the request body, which was ignored in favour of the token's address, confirmed
in the table. Over-long bodies refused at 400.

### Sensei (Stage 3, done 2026-09-01)

Ported from `components/SenseiDock.tsx`, `SenseiTape.tsx`, `SenseiTradeCards.tsx` and
`app/api/sensei/route.ts` into `web/src/features/sensei/` + `app/api/sensei/route.ts`. All 125
`.sensei-*` / `.sd-*` / `.sm-*` / `.st-*` rules were already ported in `part-02/03.css`.

**Ships complete without a credential.** The ring, teaser, drawer, meter, tape and trade cards all
run off the market stream `/markets` already holds; only the reply needs a key, and with none set
the route returns the reference's own 503 wording and the dock says it in the thread. Set
`ANTHROPIC_API_KEY` (documented in `web/.env.example`, never `NEXT_PUBLIC_`) and it lights up with
no code change. **The live reply path is therefore unverified** — see the note below the table.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Dock: draining ring + close time, urgent under the wire, hover-expanding name | L232–248 | `SenseiDock.tsx` | Adapted | **Done** — the ring's fraction and urgency come from `countdown()`/`urgentAtSec`, the venue-aware rule the hero and reel use, not the reference's flat 60 s and its fixed `{1m,5m,1h}` seconds table |
| Rotating teaser bubble, three pops then rest, hidden under reduced motion | L157–176, L220–231 | same | Exact | **Done** — cadence and copy verbatim; reduced motion is *subscribed* rather than read once at module scope, which the reference cannot do without breaking SSR |
| `sensei:open` event, `?sensei=1`, and the same-page anchor intercept | L78–102 | same | Exact | **Done** — including the reference's own fix for a client-side nav to the page you are already on |
| Drawer: head, pinned meter, thread, chips, starters, input | L251–334 | `SenseiDrawer.tsx` | Exact | **Done** |
| Meter: spot · drift · span · time left, tinted by direction | L265–289 | same + `core/market/drift.ts` | Adapted | **Done** — `computeDrift` ported with its honest rule intact: `spanMin` is the span the samples *actually* cover, so a thin history reports "3 min", never the 15 it asked for. Checked in `drift.test.ts` (5 cases). The flat band is a fraction, not the reference's hardcoded $3, because this venue lists assets priced under it |
| `SenseiTape` — the real chart, not a hairline | `SenseiTape.tsx` | `CardSpark` | Adapted | **Done** — the reference polls its own price history; this reads the series `/markets` already streams, so Sensei's price cannot disagree with the card behind the drawer. Same picture, one implementation |
| Typewriter reveal, word by word, with a caret | L42–58 | `Typewriter.tsx` | Exact | **Done** — splits on `(\s+)` as the reference does, so the paragraph does not jump as it reflows |
| Contextual follow-up chips, sit-it-out branch first | L61–67 | `copy.ts` `chipsFor` | Exact | **Done** — rules verbatim |
| Brain | DeepSeek `deepseek-chat`, temp 0.4 | Vercel AI SDK 7, default `anthropic/claude-opus-5` | **Substituted + made provider-agnostic** | **Done, revised 2026-09-02** — see §Sensei's model layer |
| System prompt: voice, three-part read, ground-truth-only, style bans, never say "bell" | L42–58 | `prompt.ts` | Exact | **Done** — carried whole, including the reason the word "bell" has to be banned by name |
| **THE BRAKE** | L54 | same | Exact | **Done** — verbatim. The one voice in the product allowed to say do not take this one |
| Pricing instruction | — | `prompt.ts` | **Additive** | **Done** — Yosuku prices off a house model, so its two sides sum to a dollar. DreamDEX has a real book on each side and they do not. A model left to assume otherwise would quietly do `100 - x` and state it as the market's price, so the prompt forbids it explicitly |
| Market snapshot sent with each turn | L136–147: spot + cadence + minsToClose + `strike624` line | `useSenseiSnapshot.ts` | Adapted | **Done** — the line is the opening print, and each Window also carries its **real top of book**, which the reference has nothing to send. `useTopOfBook` is called a fixed four times against a possibly-null market, so the hook count is constant |
| `restless` tilt cue (4+ asks in 3 min) | L182–183 | `useSenseiChat.ts` | Exact | **Done** — local timestamps only; no identity attached, nothing stored |
| `userId` → MemWal persistent memory | L36, L40, L80 | — | **Dropped** | **Recorded** — the reference posts the wallet address to a MemWal relayer that remembers each person. There is no such store here, so the field would put a wallet on the wire for a feature that does not exist. Persistent memory needs its own decision, not a field that arrived early |
| `SenseiTradeCards` — stake chips + Place, calling `placeMint624` directly | `SenseiTradeCards.tsx` | `SenseiTradeCards.tsx` | **Adapted — one write path** | **Done** — a second signing path inside a chat drawer is exactly what doc 02 §"do not scatter DreamDEX calls through components" exists to prevent, and every other surface here hands off to the one Ticket. The cards keep the job and drop the mechanism: tap a side and the Window opens in the ticket with that side chosen. Its `probAbove`/`payoutX` odds are the real book |
| Cards appear only once a read exists | L320 | `SenseiDrawer.tsx` | **Corrected** | **Done** — first cut counted any assistant turn, so an *unreachable brain* opened the trade cards and offered "Why?" as a follow-up to a configuration error. Failure notices are flagged and count as neither |

**Not verified: the live reply.** Every gate passes and every *un*configured path was exercised
against the running route, but no request has reached a model — there is no credential on this
machine and spending the user's without asking is not this agent's call. First run with one should
confirm: a reply arrives, the typewriter fires, the trade cards open, and the style rules hold (no
em dashes, no "bell").

### Sensei's model layer (revised 2026-09-02, user's call)

The first cut called the Anthropic SDK directly, which made the provider a code change rather than
a setting. **On the user's request it now runs on the Vercel AI SDK (`ai` 7.0.87)**, which the
project's own earlier stack review had already landed on (`_bmad-output/.../review-versions.md`
line 21: AI SDK 7 + Gateway, default `anthropic/claude-opus-5`, reasoning-effort through v7's
top-level option). Claude remains the default; the point is that it is now configuration.

`AI_MODEL` (default `anthropic/claude-opus-5`) names the model, and `model.server.ts` takes
whichever route the available credential allows, in this order:

| Order | Credential | Route | Why this order |
|---|---|---|---|
| 1 | `AI_BASE_URL` + `AI_API_KEY` | any OpenAI-compatible endpoint | Covers OpenRouter, Together, Groq, vLLM, a local Ollama — none needs a package of its own. An explicit endpoint is the most specific instruction, so it wins |
| 2 | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | that provider directly | A key you already hold should not require a gateway account to be useful |
| 3 | `AI_GATEWAY_API_KEY` | Vercel AI Gateway, `creator/model` string | One key, every provider |
| — | none | honest 503 **naming the variable that would fix it** | The provider is configurable now, so "the key" no longer identifies one |

| Element | Before | Now | Note |
|---|---|---|---|
| Reasoning effort | Anthropic `output_config.effort: "low"` | top-level `reasoning: "low"` | **Portable in AI SDK 7** (`'minimal'`…`'xhigh'`), mapped by each provider onto its own knob — no per-provider branch |
| Error mapping | `instanceof` per Anthropic error class | structural `statusCode`, plus a name check | A swappable-provider layer should not need a new branch per provider. The name check earns its place: a bad `AI_GATEWAY_API_KEY` is rejected **before any request goes out**, so its `GatewayAuthenticationError` carries no status — verified against the real error, not assumed. Without it that read as "unreachable", pointing at the network instead of the key |
| Refusal fallbacks (`betas` + `fallbacks`) | present | **dropped** | Anthropic-only server-side routing with no portable equivalent |
| Explicit `cache_control` breakpoint | present | **dropped** | Provider-specific. The stable prefix is still first and the volatile figures still sit in their own later turn, so a provider that caches a prefix can still do so |

Verified against the running route, all four paths: no credential names `ANTHROPIC_API_KEY`;
`AI_MODEL=openai/gpt-5.4` names `OPENAI_API_KEY`; `AI_MODEL=meta/llama-4-maverick` (no direct
package) names the gateway or a custom endpoint; and with a gateway key present the call is
actually attempted and a bad key reports as a rejected credential rather than a network fault.

### §01 rail card (Stage 3, done 2026-09-01)

Ported from `Market624Card` (`reference/yosuku/app/markets/page.tsx` L251–400). `.market-card` and
every `.mc-*` rule were already in `yosuku/part-06.css` + `part-16.css`, light theme in part-14/15.

**Why now:** §01 held a text row that stated the Window as a plain question with an odds-chip pair.
Once §02 landed, `/markets` asked the same question twice in two card languages. The reference has
no such overlap because its §01 *is* this chart card. **User's call, 2026-09-01**, given the three
options in the previous entry.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Whole card is the ticket trigger; UP/DOWN stop propagation | L285–300, L369–387 | `MarketCard.tsx` | Exact | **Done** — keyboard activation guarded to the card itself, as the reference does |
| `.mc-head` — asset disc · ticker · serif italic cadence · countdown with clock-dot | L303–315 | same | Adapted | **Done** — the disc is keyed to the asset (`asset-mark.ts`); ETH takes a neutral disc rather than Bitcoin's orange. Third surface to need that rule |
| `.mc-question` "BTC holds above $X?" + strike dot; `···` while pending | L316–323 | same | Adapted | **Done** — the line is the **opening print**, via `HERO_HEAD.holdsAbove`, so the card and the hero cannot word it differently |
| `.mc-pricebar` — big spot + change | L325–336 | same | Adapted | **Done** — the change is against **this Window's line**, not a 24h figure: it is the only comparison that decides anything here |
| `.mc-spark` — `Spark624` canvas + dashed strike rule + tick | L241–249, L338–340 | `CardSpark.tsx` | **Adapted** | **Done** — SVG, not `<canvas>`. The reference draws three fixed cadences; a lane here holds every Window the venue lists, so the cost scales with the venue — SVG needs no ref, no effect and no redraw on resize, and is the same picture. The dashed rule and tick stay the elements part-06 already styles |
| Line colour | — | `CardSpark.tsx` | **Corrected** | **Done** — first cut coloured by the series' own direction, which put a green line beside a red −$1,419 on a Window that had rallied off its low but still sat under its print. Caught in the browser; it now says which side of the **line** the price is on, the only question the card asks |
| `.mc-strip` — LIVE ODDS + UP ramp + cents | L342–355 | `MarketCard.tsx` | **Adapted — no-fake-data** | **Done** — the reference fills the ramp with `odds?.upCents ?? 50`, so an unread book shows as an even market. An unread side shows nothing here, as on the hero |
| Closing state replaces the strip and hides the foot | L343, L356–358, L360 | same | Adapted | **Done** — from `phase()` (AD-1), not the reference's `minMintMs * 0.6` approximation |
| `.mc-foot` — outlined UP/DOWN pills with prices | L360–388 | same | Adapted | **Done** — top of the real book, so they do not sum to 100 |
| `.mc-room` strip | L391–403 | same | Present, disabled | **Done** — names the comment service as the missing piece, exactly as `HeroChartFoot` does |
| Fixed three-cadence rail (1m · 5m · 1h) with `RailPlaceholder` | L846–874 | `LaneTabs` + `BetweenRounds` | Adapted | **Done** — pre-existing: cadence tabs and one lane at a time, since lanes derive from live `intervalSec`. The grid is `auto-fill` rather than `repeat(3,1fr)` for the same reason |

`.mc-spark .strike-tick` needed a light remap (`part-14/15` do not cover it, so its `rgba(5,5,5,0.7)`
chip landed as a near-black blob on cream) — the same fall-through class as the Tutorial's
`bg-white/20`. **That is three components in a row.** `OddsChips.tsx` went with the text row it
served; its `useBook` call site is gone with it.

### Word-market board — `/markets` §02 "Just ask" (Stage 3, done 2026-09-01)

Ported from `reference/yosuku/components/WordMarketBoard.tsx` into
`web/src/features/markets/word-board/`. `.words-*` / `.wq-*` were already ported verbatim in
`yosuku/part-16.css` + `part-17.css`, **including their light-theme block**, so only three
source assumptions this venue does not share are in `styles/word-board.css`.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| §02 header "Just ask / No chart to read…" | `app/markets/page.tsx` L878–881 | `MarketsScreen.tsx`, `SECTIONS.words` | Exact | **Done** — `SectionHeader` gained the reference's `desc` slot |
| Horizon groups at 6 min / 65 min, count beside the label, empty groups dropped | L31–35, L79–82 | `@masayume/core/market/horizons.ts` | Adapted | **Done** — bands verbatim; only the third label changes, because "Later today" is false for a 1d Window closing tomorrow (observed live: a 1:00 AM close). Bands are half-open, checked in `horizons.test.ts` (4 cases) — a boundary slip would silently drop or double-list a Window |
| Card frame, odds bar, Yes/No buttons, `min-height` question, 720px type ramp | `part-16/17.css` | already ported | Exact | **Done** — verified at 390 (one column, 16px question, no x-overflow) and 1440 |
| The line in the question | `strike624(spot,'up')` L67 | `core/copy/question.ts` `wordQuestion` | **Adapted** | **Done** — the **opening print**, as `/markets` and `/reels` already use. A strike derived from spot is not the number these Windows settle against |
| Odds: `probAbove`, a client-side logistic on `(line−spot)/σ` | L22–27, L74 | `hero/useTopOfBook.ts` | **Adapted — no-fake-data** | **Done** — the reference calls it "an honest client-side odds estimate"; it is still an invented number, barred by doc 05. Prices are the top of the real book, the same reading the hero's UP/DOWN buttons show, so the two cannot disagree |
| `No` priced as `100 − yes` | L119 | `WordCard.tsx` | **Corrected** | **Done** — each side is its own contract with its own ask, so they do not sum to 100 (observed live: 38¢ / 59¢). Neither is derived from the other |
| The odds bar's fill | L109 | `WordCard.tsx` | **Adapted** | **Done** — with two independent asks there is no single probability, so the bar is the stated split `up/(up+down)` and the label says "N% implied on Yes", never "the odds". One-sided or unread book → a flat unfilled track, because an empty green fill reads as "0%, everyone says no", a claim about the market rather than about our knowledge of it |
| BTC disc (`.wq-btc`, orange radial + tilted ₿) | `part-16.css` | `.wq-generic` + `hero/asset-mark.ts` | Adapted | **Done** — the venue also lists ETH, which gets its initial on a neutral disc rather than wearing Bitcoin's colour; same rule and values as `.mh-asset-badge` |
| Template rotation across the four phrasings | `TEMPLATES[i % 4]` L73 | `wordQuestion` | **Corrected** | **Done** — keyed on the market id, not the array index. On index, every card reworded itself whenever a Window closed and the list shifted underneath it |
| Self-contained fetch of markets + spot on a 12 s poll | L51–63 | prop from `useLanesState` | **Adapted** | **Done** — the reference is self-contained so it can also stand alone; here that would put a second market stream on `/markets` (see §Subscription coordinator) |
| Yes/No hand off to the ticket | `router.push` L84 | `marketDeepLink` | **Done** — the existing deep-link grammar, as the reel uses |

Also fixed here, since the element was being edited: `MarketsScreen`'s §01 used
`aria-labelledby="section-lanes"` against a `SectionHeader` that takes no `id`, so the reference
dangled. It uses `aria-label` now, like the newer sections (was listed under §Known, not fixed).

**Resolved 2026-09-01 — the user chose to make §01 chart-like** (see §§01 rail card above). Original
question, kept for the reasoning: the reference's §01 is a rail of *chart* cards,
so its §02 word board is the page's only plain-language surface. Our §01 `MarketRow` already
states each Window as a plain question (`plainQuestion`) and carries an odds chip pair, and there
is a "Plain words" toggle above it as well. So `/markets` now says the same Windows in words
twice, in two different card languages. Three ways out — keep both (they do differ: §01 is the
trading rail with cadence tabs and hero selection, §02 browses every lane at once), make §01's
rows chart-like to match the reference's rail, or retire the toggle now that §02 is the plain
surface. Chosen: the first. The "Plain words" toggle stays and now means something sharper — chart cards by
default, plain Yes/No questions on demand.

### First-run Tutorial (Stage 3, done 2026-09-01)

Ported from `reference/yosuku/components/Tutorial.tsx` into `web/src/features/onboarding/`.
Presentation values in `styles/tutorial.css` under the `markets-hero.css` convention.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Shows once, `localStorage` flag, Skip/backdrop/Escape all dismiss | L8, L49–59, L82–88 | `useFirstRun.ts` | Exact | **Done** — hydrates after mount, so a returning visitor never sees a frame |
| Modal: `bg-neutral-900/95`, `border-white/10`, `rounded-2xl`, bottom sheet → centred at `sm` | L96–107 | `Tutorial.tsx` + `styles/tutorial.css` | Adapted | **Done** — Base UI `Dialog` keeps the focus trap, dialog role and inert background the reference re-implements by hand; it takes the reference's presentation, as the Toast did |
| Per-step reveal (framer-motion, `y:20 → 0`, `scale:.95 → 1`, 200 ms) | L100–107 | `.tutorial-step` | Adapted | **Done** — CSS keyed on the step on Yosuku's `--ease-out`; no second animation library. Honours `prefers-reduced-motion`, which the reference does not |
| Five steps, Skip + Next, `Get started` on the last | L19–41, L171–186 | `steps.ts` | Exact shape; **rewritten prose** | **Done** — the reference describes Sui/zkLogin, sponsored gas and its on-chain Trading Balance. None is true here: step 3 says the user signs every transaction, step 4 describes the pools that *do* exist (spendable / order escrow / venue payout credit), and cadences are "whatever the venue is listing" because lanes derive from live `intervalSec` |
| Step indicators (`w-6` vermilion active, `w-2` past/future) | L160–168 | `Tutorial.tsx` | Exact | **Done** — as an `<ol>` with `aria-current="step"`; the reference's are bare divs |
| Final step: Simple/Pro choice writing `yosuku_trade_mode` | L117–129 | `TutorialChoice.tsx` | **Adapted** | **Done** — Masayume's ticket has one layout, so a literal port would ship a choice that changes nothing. The same question drives `plainWords`, the shipped preference that switches the live-Window rail between chart cards and Yes/No questions |
| Ends on Connect; picking does not close; auto-dismiss on connect | L66–79, L130–135 | `Tutorial.tsx`, `TutorialChoice.tsx` | Exact | **Done** — wagmi `address` replaces `useCurrentAccount` |
| Card wears no focus ring | — | `.tutorial-card:focus` | **Improved** | **Done** — Base UI's default initial focus lands on Close, so a welcome screen opened pointing at the way out. Focus goes to the dialog itself, ring suppressed on the container only |
| Card scrolls rather than clipping on a short viewport | — | `.tutorial-card` | **Improved** | **Done** — the closing step overflows a 390×844 phone; the reference clips it off-screen |

Two light-mode defects found here and fixed, both recorded in the decision log above: the
`text-gray-*` body copy at 2.36:1, and three `*-white` utilities that fall through part-14's
remap. **The `*-white` gap is general — check for it before porting the next dark component.**

### Subscription coordinator (Stage 2, done 2026-09-01)

`packages/markets/src/runtime/coordinator.ts` — one normalised book per market, shared by every
consumer. The SDK already ref-counts its pool watches, so the transport was never the duplicated
part; three costs sat above it, all verified in the SDK source at the pinned version:

| Cost | Evidence | Now |
|---|---|---|
| Depth forked the store's memo cache (`bookynm:<market>:<depth>` over `book:<pool>:<depth>`), so it walked the whole resting-order map once per distinct depth per pool per block | `createClient.ts:253`, `store.ts:648` | One `CANONICAL_BOOK_DEPTH` (10) read per market; consumers slice what they display. Matches the SDK default, so `useStakeQuote`'s raw book shares the same entry |
| The memo cache is keyed on a version every new head bumps, so an unchanged book arrived as a new object every block and re-rendered every consumer | `store.ts:656` | `sameBookDepth` compares the mapped value; an unchanged book holds its reading, so nothing re-renders |
| `useBook`'s `useMemo` never held — all three call sites passed a fresh object literal as `target`, so `toBookDepth` re-ran on every render, not merely every block | `OddsChips.tsx:39`, `DepthStrip.tsx:40`, `useTopOfBook.ts:27` | The hook depends on `marketId`/`poolAddress`/`decimals` as primitives and reads through `useSyncExternalStore` |

Also collapsed: `useTick` now shares one timer per interval (`react/tick-clock.ts`) instead of one
per hook — the ticker strip alone was running four unsynchronised one-second intervals.

Honesty preserved: a hydrating watch reads `null` ("…"), never an empty book nobody has read; a
dropped socket flips the reading to `stale · offline` stamped with the **last live confirmation**,
not the last time the book moved, because the coordinator advances that timestamp every block
without emitting. The value logic is pure and checked in `runtime/book-reading.test.ts` (14 cases) —
a wrong equality check would silently freeze the book on screen.

Runtime rotation and `closeRuntime` both drop every entry and its watches (`onRuntimeClose`), so a
rebuilt client never leaves a book on screen that nothing is confirming.

### `/markets` hero-as-ticket (Stage 2, done 2026-09-01)

Ported from `reference/yosuku/app/markets/page.tsx` (render from L679) over the existing
DreamDEX pipeline — a presentation change, not a data change.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| `section.page-hero.markets-hero` + 4 `.crop` marks | L686–691 | `features/markets/MarketsHero.tsx` | Exact | **Done** |
| `.hero-grid.hero-grid-mini` (1fr + 400px, `items-start` at `lg`) | L693 | same + `styles/markets-hero.css` | Exact | **Done** — measured `836px 400px` at 1440, `534px 400px` at 1024 |
| Asset badge · mono asset label | L699–700 | `hero/HeroChartHead.tsx`, `hero/asset-mark.ts` | Adapted | **Done** — ₿ on Bitcoin orange for BTC; the venue also lists ETH, which gets its initial on a neutral disc rather than another asset's mark |
| Cadence tabs, active vermilion + 1px underline, dead lane dimmed and disabled | L707–729 | `hero/HeroCadenceTabs.tsx` | Adapted | **Done** — lanes derive from live `intervalSec` (FR-6), never a fixed list; the *pinned* lane is what holds its slot and its highlight when it is between rounds |
| Headline `BTC holds above <span.text-vermilion>$X</span>?` | L731–737 | `hero/HeroQuestion.tsx` | Adapted | **Done** — the line is the **opening print**, the level these Windows actually settle against, not a strike derived from spot |
| Distance line (`$83 above the UP line` / `needs +$X for UP to win`) | L738–746 | same | Exact phrasing | **Done** — branch from `neededMove` in core, not a second comparison |
| "Settles in" + countdown, block flips vermilion when urgent | L748–759 | `hero/HeroSettlesIn.tsx` | Adapted | **Done** — urgency from `urgentAtSec(intervalSec)` rather than a flat 60 s, which would misread a 1d lane |
| `.hero-chart-canvas` | L761–763 | `hero/HeroChart.tsx` | Adapted | **Done** — lightweight-charts in a filling box; the ported raw-`<canvas>` rule is scoped away from its internals |
| `.hero-chart-foot` — The Room + `.ramp` UP bar/cents | L764–789 | `hero/HeroChartFoot.tsx` | Exact layout; honest state | **Done** — Room disabled and says it waits on Stage 3; the ramp is real top-of-book, and an empty side reads "—" with no fill (never the reference's 50% default) |
| `.hero-yesno` mobile UP/DOWN with live cents | L790–813 | `hero/HeroYesNo.tsx` | Exact | **Done** — verified 79¢/24¢ matching the lane card at 390 |
| Ticket rail (desktop) / drawer (mobile) | `Ticket624Drawer` | `ticket/TicketDock.tsx` | Adapted | **Done** — rail above 900px, drawer below; the drawer has no trigger of its own, the UP/DOWN buttons are it |
| Bet type Up/Down · **Range** | `Ticket624Drawer` L858–869 | `ticket/BetModes.tsx` | Present, disabled | **Done** — Range names `RangeReserve` (Stage 5) as the missing piece; never wired to an ordinary Up/Down order |
| **Leverage chips** | `Ticket624Drawer` L1075–1090 | `ticket/LeverageChips.tsx`, `features/leverage/*` | Adapted | **Done** — live where `LeverageReserve` is deployed (§LeverageReserve); without it 2×/3× say what is missing |
| Live-now card grid below the hero (`Market624Card`) | L251–400, L847–875 | `lanes/MarketCard.tsx`, `lanes/CardSpark.tsx` | Adapted | **Done** — see §§01 rail card |
| Tutorial | L905 | `features/onboarding/*` | Exact shape | **Done** — see §First-run Tutorial |
| `WordMarketBoard` §02 | L878–881 | `features/markets/word-board/*` | Adapted | **Done** — see §Word-market board |
| Sensei dock | L890 | `features/sensei/*` | Adapted | **Done** — see §Sensei |
| `MarketRoom` | L896–903 | `features/room/*`, `api/room/*` | Adapted | **Done** — see §The Room |

Shell correction found in this slice: `.page-shell` reserved space for the fixed chrome and
`.page-hero` reserved it again, leaving the hero under a band of dead page. `.page-shell` now
yields that reservation to a route that leads with a `.page-hero` (`styles/shell.css`).

### `/reels` (Stage 2, done 2026-09-01)

Ported from `reference/yosuku/app/reels/page.tsx` over the same pipeline that feeds `/markets`, so a
price cannot disagree between the two. `.feed-snap` / `.feed-card` were already ported verbatim in
`yosuku/part-16.css`; the card's values live in `styles/reel.css` + `styles/reel-chrome.css` under
the `markets-hero.css` convention (source utility named above each rule), because `design-literals`
bans hex and px in TSX.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| `main.feed-snap` fixed between the chrome and the viewport bottom, `scroll-snap-type: y mandatory` | L297–301 | `reels/ReelsScreen.tsx` | Exact | **Done** — `.page-shell` yields its chrome reservation to `.reel-page`, and the Footer is hidden as the reference does on `/feed` |
| Framed portrait card ≤460px, radial-gradient ground, film grain, vermilion top hairline | L119–125 | `reels/ReelCard.tsx` + `styles/reel.css` | Exact | **Done** — values copied, including the fractalNoise data URI |
| Top meta: ₿ disc · "BTC · settles on the price" · "{cadence} round · closes HH:MM" | L128–135 | `reels/ReelHead.tsx` | Adapted | **Done** — the mark is keyed to the asset (`hero/asset-mark.ts`), and the cadence word comes from `formatCadence` because lanes here are whatever the venue lists, not a fixed 1m/5m/1h table |
| "closes in" + countdown, flipping vermilion when closing | L136–141 | same | Adapted | **Done** — urgency from `countdown`/`urgentAtSec`, not the reference's flat threshold |
| `Will BTC be above <span.vermilion>$X</span>?` | L146–150 | `reels/ReelQuestion.tsx` | Adapted | **Done** — the line is the **opening print**, as on `/markets`; the reference freezes a strike derived from spot, which a real on-chain number does not need |
| Live price + `+$83 vs line` / `−$120 vs line` | L151–159 | same | Exact phrasing | **Done** — the branch comes from `neededMove` in core, so the reel and the hero cannot disagree about who is winning |
| The chart as the card's hero | L162–169 | `reels/ReelChart.tsx` | Adapted | **Done** — the reference shares one series across all cards and gates only its rAF redraw; each Window here has its own history, so an `IntersectionObserver` gates the whole thing: only the card on screen and its two neighbours fetch a series or mount a chart |
| One-tap UP/DOWN | L179–188 | `reels/ReelCall.tsx` | Improved | **Done** — the reference links to a bare `/markets`; these use the existing deep-link grammar (`/markets?m=…&dir=…`, UX-DR21) so the side you tapped arrives selected |
| "closing. the next round is already rolling" | L173–176 | same | Exact | **Done** — shown once the Window is inside the no-entry buffer (`phase()`), which is the same rule the reference approximates with `minMintMs * 0.6` |
| Dark island — the card stays black on cream in light mode | `part-14.css:124` | `styles/reel-theme.css` | **Deviation** | **Recorded, user's call 2026-09-01** — the card follows the theme like every other surface, so `/reels` is not an island. Light values are Yosuku's own light-card treatment, lifted from `.creator-studio` (`part-01.css:131`): surface `#fffaf2`, ink `#211c18`, `.cs-line` hairline, its raised shadow. One ink triplet per theme drives every step |
| `EmptyReel` — framed holding card with three pulsing dots | L199–213 | `reels/ReelHolding.tsx` | Exact | **Done** — covers reading / no venue / between rounds |
| Swipe-up hint pill, fading after a real scroll | L338–348 | `ReelsScreen.tsx` | Exact | **Done** — including the reference's own correction (60px, not the first stray pixel) |
| Take pill (right rail, mid-card) | L320–331 | same | Exact | **Done** — opens the composer |
| Woven community takes, `TakeReelCard`, `TakeComposer624` | L44–53, L307–314 | `features/takes/*` | Adapted | **Done** — see §Takes |

Two adaptations worth knowing: rounds come from **every** live cadence the venue lists (the reference
is BTC + three fixed cadences), and membership derives from `phase()` like every other surface rather
than a second copy of the entry cutoff. `useReelRounds` holds its array identity while the membership
is unchanged — recomputing it on each clock tick would remount every card's chart once a second — but
only for as long as it came from the lane set still in hand, so a refetched Window is never rendered
from the previous poll's copy.

**`/fund` and `/claim` are not Stage 2 reads.** `/fund` (reference L29–99) is a Paystack card on-ramp
that charges NGN and credits testnet DUSDC from a treasury via `/api/fund-preview`: it needs a
Paystack key and a funded treasury signer, both owner-only, and funding is outside this authorization.
`/claim` (reference) is X-OAuth account recovery — Stage 4. Both keep their honest dependency state;
neither was silently reclassified.

### `/portfolio` — market portions (Stage 2, done 2026-09-01)

Ported from `reference/yosuku/app/portfolio/page.tsx` and its `Portfolio624Section`. Only the parts
that read the market pipeline are connected here; everything else keeps a named dependency state.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| No page headline — the balance is the header | L266–268 | `portfolio/PortfolioScreen.tsx` | Exact | **Done** |
| One spendable number, every other pool named beneath it and never summed in | `BalancePlate` L46–70 | existing `balance/BalancePlate.tsx` | Adapted | **Done** — already live on `/markets` and reviewed; the rule (FR-5) is the reference's own |
| `.ledger-plate` cream frame | `part-07.css:239` | — | Deviation | **Recorded** — the frame is a fixed cream slab with its own ink and the panel inside it is theme-aware; nesting them reproduces, in reverse, the "one card, two backgrounds" defect the reference's `.plate-rows` remap exists to fix. Our plate surface is used instead |
| Open bets: status · market · countdown · stake · value | `Portfolio624Section` L431–455 | `portfolio/BetsPanel.tsx`, `portfolio/BetRow.tsx` | Adapted | **Done** — off `getOpenPositionsWithPnL`, so cost basis, mark value and unrealised PnL are the venue's own numbers, not recomputed here |
| Silent status while a bet is live (pulsing dot + countdown say it twice already) | L440 | `BetRow.tsx` | Exact | **Done** |
| Row links back to its market | — | `BetRow.tsx` | Improved | **Done** — the deep-link grammar, as on the reel |
| Leverage column (`1.0×`) | L452 | `features/leverage/LeverageBetRow.tsx` | Adapted | **Done** — the multiple on boosted rows only (§LeverageReserve); a `1×` on every row would be a number pretending to be a choice |
| Claimables / "collect now" | L457–470 | existing `claims/LiveClaimPlate` | Adapted | **Done** — already live on `/claims`, mounted here as §02 |
| Settled history, receipts, equity curve, reputation, badges, CSV export | L486–512 | `features/markets/history/*` | Adapted | **Done** — see §Fill projection |
| Trader Edge link | `TraderEdgeLink` | `history/TraderEdgeLink.tsx` | Exact | **Done** |
| Creator earnings, X wallet card | L318–329 | — | — | Pending — Stage 3–4 |
| Trading Balance vault (deposit/withdraw/sweep, private withdrawal) | L51–58 | — | — | Pending — Stage 4 (`EventVault`) |
| Copy-trading desk, leverage panel | L520+, `LeveragePortfolioPanel` | `features/leverage/LeverageBetRows.tsx` | Adapted | **Done** for the leverage panel (§LeverageReserve); the copy-trading desk is `/strategies` |

---

### Fill projection — settled history, Trader Edge, leaderboard (Stage 3, done 2026-09-02)

One derivation feeds every pending Portfolio surface at once. `packages/core/src/projection/` replays a
wallet's indexed fills (`getUserFills`, paged) and complete-set router actions (`getRouterActions`,
paged) oldest-first into one ledger per Window (`ledger.ts`), settles each closed Window by the chain's
own rule (`settle.ts`, reusing `estPayoutBase`), and derives the equity curve, drawdown and streaks
(`equity.ts`), the Trader Edge report (`edge.ts`), reputation (`reputation.ts`), badges (`badges.ts`),
rankings (`leaderboard.ts`) and the CSV (`csv.ts`). `packages/markets/src/provider/history.ts` is the
port read (`listWalletHistory`, `useWalletHistory`); `provider/board.ts` runs the same replay venue-wide.

**Verified against the chain, not assumed** (spike `fill-projection-verify.ts`, 2026-09-02): for four
active wallets, 89 settled markets — 61 reconstructed balances match the ERC-6909 balance exactly, 27
differ only by the redeemed winning leg being zero, 1 differs by a zero-value losing leg that was
burned. Money is exact on all 89.

Three facts about the venue this had to learn, kept because they explain the code's shape:

- **A sell beyond inventory is a short.** The pool backs it with collateral and hands the seller the
  complement; the indexer labels the fill a plain sell. Three of the probe wallet's markets read as
  "−5,000,000 UP" until the rule was added. The SDK's own `computePositionPnL` clamps that sell to zero
  and drops the DOWN position — so `getOpenPositionsWithPnL` (the open-bets rows) cannot show an open
  short. Recorded, not patched: the open rows keep the venue's numbers by the earlier decision.
- **Redemptions leave no per-wallet record the indexer exposes.** `getRouterActions` covers the
  RouterMinter only; `trader.redeem` calls the settlement contract directly. Whether a payout was
  collected is therefore read from the live balance, batched in one `getBalances`, and an unreadable
  balance is `unknown`, never `paid`.
- **The indexer pages at 1,000.** The busiest wallet on the venue is a bot past both caps. The
  reading pages five deep and flips `complete` false beyond that, and every surface says so.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Settled rows: outcome word · paid X · ago · Receipt ↗ · tx ↗ | `Portfolio624Section` L486–512 | `history/HistoryRow.tsx`, `HistoryRows.tsx` | Adapted | **Done** — plus the net figure (the row's only P&L ink), the claim state, and "sold short" when a short was booked |
| Receipt modal (one open at a time, overlay/Esc/scroll-lock) | `TradeReceipt` | `history/HistoryReceipt.tsx` (Sheet) + existing `VerdictCard` | Adapted | **Done** — the same Verdict the live window stamps, from `toVerdict(round)` |
| Eight rows then more | `HISTORY_ROWS = 8` | `HistoryRows.tsx` | Exact | **Done** |
| Equity curve | `EquitySparkline.tsx` (mounted only in `LiveDesk`); `equityRef` effect on the portfolio page | `history/EquitySparkline.tsx` | Exact | **Done** — colours in `history.css`; below zero muted, never red |
| Reputation | `getReputationData` TIERS | `history/ReputationPanel.tsx` | Adapted | **Done** — tier, record, progress; bonus/fee % dropped (decision log) |
| Badges | `BadgeDisplay.tsx`, `computeBadges` | `history/BadgeGrid.tsx` | Exact layout | **Done** — LP Provider reads the maker vault's shares (the reference's `plpBalance > 0`); "Needs the Earn vault" only where none is deployed |
| CSV export | `csvExport.ts` (imported, never mounted) | `history/useCsvDownload.ts` | Adapted | **Done** — built in the browser from the rows shown |
| Trader Edge link | `TraderEdgeLink.tsx` + module CSS | `history/TraderEdgeLink.tsx`, `trader-edge-link.css` | Exact | **Done** |
| `/portfolio/edge` — intro, connect / reading / failed / none / report states | `app/portfolio/edge/page.tsx` | `features/edge/*`, `edge.css`, `edge-report.css` | Exact structure; adapted facts | **Done** — framer-motion entrance as a CSS keyframe honouring reduced motion |
| Curve, readout, four metrics, time-of-day split bars, payoff, provenance | same + `traderEdge729.ts` | `core/projection/edge.ts`, `features/edge/Edge*.tsx` | Adapted | **Done** — "Fees paid" is **settlement fees** (exact); maker/taker fees are not on the fill row and are not guessed |
| `/leaderboard` — hero, filter bar, podium, banzuke, you-bar, loading/empty | `app/leaderboard/page.tsx` | `features/leaderboard/*` | Exact (classes already in part-07..09) | **Done** — light-mode hairlines in `leaderboard-theme.css` (the reference's board has the same cream defect) |
| Board computed server-side, 24h, cached | `app/api/leaderboard/route.ts` | `api/leaderboard/route.ts`, `markets/provider/board.ts` | Adapted | **Done** — venue-wide as the reference's final rule; no protocol-account exclusion list exists here yet |
| Asset tabs (BTC only) | L163–166 | `LeaderboardBoard.tsx` | Adapted | **Done** — "All assets", since the venue lists BTC and ETH lanes |
| "Next market closes in" | `fetchMarkets624` poll | `LeaderboardScreen.tsx` via `useLanes` | Improved | **Done** — the same live lanes the markets page holds |
| Fixtures | — | `/dev/history` | — | **Done** — every state from canned rounds |

**Honesty constraints applied:** a capped history says so above its rows and on the report; the board's
meta says "partial day" when a scan was cut short; no bonus %, no fee %, no maker/taker fee estimate;
the board never claims a payout was collected (no live balance on a venue scan).

**Known, not fixed:** the venue's PnL engine drops open shorts (above). Trading fees beyond the
settlement skim are not shown. `/agents` still waits on the `StrategyRegistry` alone.

### Takes — woven into the reel (Stage 3, done 2026-09-02)

Ported from `app/reels/page.tsx` (`weaveReel`, the pill, the composer mount), `components/TakeReelCard.tsx`
and `components/TakeComposer624.tsx` into `web/src/features/takes/`, over the social store (`packages/db`,
`takes` table) and a route (`web/src/app/api/takes`). Read is public, as the reference's feed is; posting
proves the wallet by `personal_sign` over `takeMessage()` — the same text the browser and the route build
from the same fields — and stamps "✓ position" from the Room's own chain read. **Nothing about a take is a
client claim**: the Window's facts (asset, cadence, expiry, the line) are snapshotted from the venue at
post time, the caption is stored exactly as signed (the route refuses a caption it would have had to
normalise), and the author is the recovered signer, lowercased.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Weave: market, take, market, take… then the tail; a market first | `reels/page.tsx` L40–53 | `takes/weave.ts` | Exact | **Done** |
| 20 s take poll, last feed kept on a failed refresh | L262–274 | `useTakes.ts` (react-query) | Exact | **Done** — `configured:false` from the route means "no store", never an empty feed |
| Pill → composer | L320–331 | `ReelsScreen.tsx` | Exact | **Done** |
| Card: hued author disc, short address ↗, `timeAgo · 5m Window`, `✓ position` / `open call` | `TakeReelCard.tsx` L57–76 | `TakeReelCard.tsx` + `take.css` | Exact | **Done** — the disc's hue is the reference's `hue()`, now `lib/address-hue.ts`, shared with the Room |
| Call chip `▲ UP · BTC over $64,316` | L78–85, `callParts` | same | Adapted | **Done** — the band is the opening print; a take posted before the print says "vs the opening print"; no range glyph (no range markets) |
| The voice, or "No note. The call speaks for itself." | L87–98 | same | Exact | **Done** |
| Footer: `◆ on Walrus · verify ↗ · comments soon` | L100–106 | same | Adapted | **Done** — `◆ signed by the wallet · verify ↗` (author on the explorer); "comments soon" is a live link to the Window, where the Room is |
| "Take the other side →" → bare `/markets` | L107–110 | same | Improved | **Done** — deep-links the opposite side; a closed Window's card says "See how it closed →" instead |
| Dark island (`data-theme="dark"`) | L49 | `.reel-card` frame | Deviation | **Done** — follows the theme like the market card (user's 2026-09-01 ruling); verified light and dark at 390 |
| Composer: sheet, hairline, title/close, "where your words go" line | `TakeComposer624.tsx` L108–125 | `TakeComposer.tsx` + `take-composer.css` | Adapted | **Done** — Base UI Dialog (focus trap, dialog role); shares the Room's surface tokens; the line says the words are stored by Masayume and the call signed by the wallet |
| Side segments Up / Down / Range | L127–141 | same | Adapted | **Done** — Range disabled, titled "Range calls land with RangeReserve (Stage 5)" |
| Strike input, defaulting to spot | L143–160 | `.take-line` | Truth correction | **Done** — read-only opening print with spot beside it; "waiting for the opening print" before it lands |
| Horizon: 1m / 5m / 1h | L162–183 | `useComposerMarket.ts` | Adapted | **Done** — the venue's live lanes; default is the first cadence with an enterable Window; the market is the soonest enterable one (`phase()`) |
| Caption, 240 cap, counter | L185–195 | same | Exact | **Done** — cap in the input, the schema and the `CHECK` |
| Preview "You're calling ▼ BTC under $X · 5m Window" | L197–204 | same | Exact | **Done** |
| Post: Connect / No live market / Post / Posting… | L206–213 | same | Exact | **Done** — plus the unconfigured state in the Room's grammar, and the core permanence line under the button |
| Post = Walrus PUT + `post_take` tx via the sponsor | L76–106 | `usePostTake.ts` → `POST /api/takes` | Adapted | **Done** — one `personal_sign`; the server's own row is appended, never a local echo |
| Fixtures | `app/dev/takes` | `/dev/takes` | — | **Done** |

**Verified against the live endpoints** (scratch script signing with the demo wallet, 2026-09-02): empty
body 400; forged signature 401; stale signature 400; a valid signature presented for another address 401,
and for the other side 401; a settled Window 409; an unknown Window 404; caption over the cap 400; an
un-normalised caption 400; then the happy path — 200, the row read back from `GET /api/takes` with the
signer as author, `backed:false` (the demo wallet held nothing on that Window), the venue's opening print
as the line. That take is real and stays in the store. Woven card, composer and both themes inspected in
the browser at 390.

### Sharing — The Call and Earned Heat (Stage 3, done 2026-09-02)

Ported from `lib/openBetShareCard.ts` + `components/BetPlacedCard.tsx` + `ShareBetButton.tsx` (the
just-placed call) and `lib/shareCard.ts` + `ShareTradeButton.tsx` (the settled trade) into
`web/src/features/share/`. The two reference renderers each carry their own copy of the drawing kit;
`canvas.ts` holds it once, and the kit reads its palette off `share-card.css` so no colour lives in code.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| The Call — 1600×900 PNG (revised, see below): masthead, record line, direction eyebrow, hero band, stake → return, settle line, vertical perforation, the stub, proof in the footer, grain | `openBetShareCard.ts` L226–436 | `call-card.ts`, `stub.ts` | **Redesigned on the user's call** | **Done** — `MASAYUME`, `THE CALL · SOMNIA TESTNET`, return net of the settlement fee and labelled so; footer `TX 0x… · VERIFY ON SHANNON EXPLORER` / `MASAYUME · LIVE CALL` |
| Leverage caveat | L354–362 | `call-card.ts` L155 | Exact | Printed for a boost ("2× LEVERAGE · CAN KNOCK OUT BEFORE THE CLOSE"), omitted at 1× |
| Earned Heat — P&L hero (win = vermilion heat, loss = ash), sub-line, kind line, proof pair in the footer, the stub | `shareCard.ts` L285–482 | `trade-card.ts`, `stub.ts` | **Redesigned on the user's call** | **Done** — win/loss `SETTLEMENT RECORD` with `ORACLE-SETTLED $print AT <expiry UTC>` only when the closing print is on record; void `VOID RECORD · BOTH SIDES PAID 0.5`; a close-out `CLOSE-OUT RECORD` never claims a settlement; no cost on record → hero is the payout, labelled `PAID OUT` |
| Native share sheet with the file, else download + X intent, path decided inside the click | `ShareBetButton.tsx` L38–99 | `useShareCard.ts` | Exact | **Done** — once, for both buttons |
| The Call on screen: grain, ticks, masthead, eyebrow, band, wager strip, live countdown + draining bar, verify, share CTA, Portfolio / Place another | `BetPlacedCard.tsx`, `Ticket624Drawer.tsx` L807–836 | `CallPlacedCard.tsx`, `ticket/PlacedCall.tsx` | Adapted | **Done** — the ticket body becomes The Call on a confirmed fill; "Place another" resets the composer |
| Share slot on the receipt | `TradeReceipt.tsx` L321–325 | `VerdictCard.tsx` | Adapted | **Done** — replaces the earlier "Copy link"; the history receipt passes the entry tx and whether the round closed early |
| The stub — `SCAN TO MAKE YOUR CALL`, the QR to `https://masayume.app` on a cream tile, `masayume.app`, `@masayume_app` | none — the reference's cards carry no QR, and its handle line (`openBetShareCard.ts` L101, `@yosuku0`) had been dropped as an account that did not exist | `stub.ts`, `copy.ts` | Ours | **Done** — every export's QR decoded to the brand URL in verification |
| Fixtures | `app/dev/receipt`, `app/dev/betplaced` | `/dev/share` | — | **Done** — the on-screen card and every export rendered from canned records; dev scaffolding the user will remove before production |

**Revised 2026-09-02, the user's call** — the one surface the user opened to redesign ("we could redesign
the card in our own way… that's like one exception"): the exports are now a **1600×900 (16:9) banner**, the one
ratio X shows uncropped on both the web and phone timelines, with the reference's perforation turned vertical
and the torn-off **stub** carrying a QR to `https://masayume.app` on a cream tile, `masayume.app` and
`@masayume_app` — both given by the owner on 2026-09-02, held as constants in `copy.ts` so a card shared from
a preview deploy still points home. The pre-filled post signs off `masayume.app via @masayume_app`. The record
panel keeps every honesty rule and every word of the earlier port; only the geometry and the branding changed.
The QR is `qrcode-generator` (zero dependencies, ships its own types): byte mode at level M, modules snapped
to whole card units, a four-module quiet zone, dark ink on paper so phone scanners read it — an inverted code
on the dark ground is the version many of them refuse. The on-screen ticket (`CallPlacedCard`) is unchanged.

**Fixed with it**: `ticket/PlacedCall.tsx` now snapshots the Window at mount. `useTicket` auto-advances to the
next Window inside the no-entry buffer while the bet state stays, so The Call could show the next Window's
expiry and opening print under the fill it had just confirmed.

**Where the cards live in the app** (asked by the user 2026-09-02): The Call replaces the ticket body in the
`/markets` hero the moment a fill confirms (`ticket/Ticket.tsx`, `booked` branch) with "Share this call ↗"
under it; Earned Heat is the "Share card ↗" link on every Verdict receipt — the hero's verdict when a held
Window settles in view (`verdict/LiveVerdict.tsx`) and each settled row's receipt on `/portfolio`
(`history/HistoryReceipt.tsx`).

**Verified**: all six exports rendered at 1600×900 in the browser from `/dev/share` (2.0–2.4 MB each, under
X's 5 MB PNG limit); every QR tile cropped from the exports decoded to `https://masayume.app` with jsQR; the
call, the win and the loss inspected at full size. The live swap to The Call after a fill remains exercised by
types and the fixture only — the automated browser cannot sign.

### Traction — `/stats` (Stage 3, done 2026-09-02)

Ported from `app/stats/page.tsx` + `lib/sui/traction.ts` + `api/traction/route.ts` into `web/src/features/stats/`
and `packages/markets/src/provider/traction.ts`. The reference proved its numbers through the gas it sponsored
(its Onara ledger); Masayume sponsors nothing, so the proof is the venue's own fill tape — every call is a fill
with the wallet as taker, and every row links to the Shannon explorer.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Hero — eyebrow, "Proof of **demand**.", lede, headline metric card with the foot stat | page L107–149 | `StatsPage.tsx`, `stats.css` | Adapted | **Done** — lede truth-corrected (no sponsor; the tape is the proof); headline `Wallets that made a call · 24h`, foot `Calls filled` |
| Growth curve — a dot for one point, a glowing line over a gradient fill, no smoothing | `GrowthCurve` L52–84 | `GrowthCurve.tsx` | Exact, by hour | **Done** — cumulative distinct callers at each hour boundary of the window |
| Adoption — four `Stat` cards and the attribution paragraph | L167–195 | `StatsSections.tsx` | Adapted | **Done** — `Wallets that made a call` / `Calls filled` / `Staked` (labelled "at least this much" when the scan is incomplete) / `Windows settled … of N that closed`; the paragraph states the taker rule and the count of fills the indexer had not yet attributed |
| Live activity — dot by kind, kind label, wallet → account page, amount, age, `↗`, the row itself → the tx | L197–241 | `ActivityList` | Exact | **Done** — a call is vermilion, a cash-out gray; `call · UP · BTC` |
| Footnote on sources | L242–247 | `STATS.foot` | Adapted | **Done** — "the same replay the leaderboard ranks, computed once and shared" |
| Data — walks every sponsored tx and four event streams; `monotonic()` floors counters in `localStorage` | `traction.ts` L131–365 | `deriveTraction()` on the board's own scan (`scan.ts` shared with `board.ts`); `/api/traction` answers from `readBoard()`'s cache | Adapted | **Done** — **no floor**: a rolling day legitimately goes down |
| Polling 30 s; route cached 15 min, `maxDuration` 120 | page L94–98, route L15–18 | `useTraction.ts` 30 s; the board's 3-minute cache; both scan routes now `maxDuration = 120` | Adapted | **Done** — a cold read measured 66 s on 2026-09-02 |
| Loading / unreachable words | L153–155, L250 | `STATS.reading`, `STATS.unreachable` | Exact | **Done** |

**Scope is the last 24 hours, not since inception.** The indexer's past-market paging (100 × 20) and fill paging
(1,000 × 5 per pool) cap one scan at about a day of five-minute Windows, so "cumulative since launch" cannot be read
honestly in one request; the window is the board's, and `complete:false` marks every figure a floor. Riding on the
board's scan means the two surfaces cannot disagree and the venue is scanned once per three minutes, not twice.

**What counts.** A *call* is a taker's buy on a Window's book (the ledger's own price rule: the DOWN leg pays the
complement), **one per transaction and wallet**: an order that fills across several price levels is several fill
rows in one transaction, and the first cut counted each row — 491 "calls" that were 438 orders. A taker's sell is a
*cash-out* — listed in the activity, never counted as a call. A fill whose taker or side the indexer has not bridged
yet is counted as unattributed and shown as a number, never guessed onto a wallet.

**Verified**: the live route answered from the venue on 2026-09-02 — 69 wallets, 438 calls, 87 cash-outs,
16,325.42 tUSDC staked, 828 of 830 Windows settled, a 24-point curve, 30 recent rows with unique ids,
`complete: true`; a cold read took 66 s, a warm one 11 s. In the browser at 1280 the page rendered on those numbers;
two console errors from the first cut (an anchor nested in the row anchor — the reference's `role="link"` row is now
ported exactly — and duplicate keys from multi-level fills) are gone.

### Download — `/download` (Stage 3, done 2026-09-02)

Ported from `app/download/page.tsx` + `public/manifest.json` + `app/icon.svg` into `web/src/features/install/`,
`web/public/manifest.webmanifest`, `web/public/icons/`. Doc 03: "preserve web/PWA installation; native buttons
remain blocked". The `.dl-*` CSS was already in `part-18.css`.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Manifest — standalone, `/markets` start, `#050505` / `#E04D26`, SVG icon | `manifest.json` | `manifest.webmanifest` (JSON, since TS under `app/` may not carry hex) + `icon.svg`, 192, 512, maskable 512, Apple 180 rendered with rsvg-convert; `layout.tsx` metadata links them | Exact + PNGs | **Done** — served as `application/manifest+json`, five icons 200 |
| Hero — eyebrow, "Call it in *ten seconds.*", line, CTA, meta list | L66–90 | `DownloadPage.tsx`, `InstallCta.tsx` | Truth-corrected | **Done** — "Masayume on your phone"; the line drops "no gas, no seed phrase"; meta = web app · Somnia testnet · **Native — not built, the web app is the product** |
| CTA "Get the app" → TestFlight | L78–83 | `useInstallPrompt.ts` state machine | Adapted | **Done** — `installed` (inert), `prompt` (`beforeinstallprompt` → "Install Masayume"), `ios` ("Add to Home Screen", three steps), `manual` (browser-menu hint) |
| PhoneShot — a real capture, frame, island, side buttons | L32–59 | `PhoneShot.tsx`, `/app/bet-screen.png` | Exact + one frame addition | **Done** — the capture is `/markets` at 390×844 (2×, 780×1688) on 2026-09-02; a `dl-phone-bar` status-bar band above it so the island sits in a real gap (a browser capture has none) |
| Points — sign in / rounds / paid on the close | L97–113 | `DownloadPage.tsx` | Truth-corrected | **Done** — "Connect and go" (any EVM wallet, faucet), "Windows all day" (BTC and ETH), "Paid on the close" (the oracle print; yours to claim) |
| Foot | L115–118 | `DownloadPage.tsx` | Exact, Sui → Somnia | **Done** |
| Light theme | — | `download.css` | Deviation (invisible ≠ fidelity) | `.dl-cta` ink is a literal white on vermilion (`--white` remaps); `.dl-points` border-top takes part-14's own `border-white/[0.08]` light value |

### Error recovery (Stage 3, done 2026-09-02)

Doc 01 lists "error recovery" as a feature family; doc 05 Stage 2 asked for "the common transaction lifecycle,
error map, journal and reconciliation". The journal existed (`submitter/journal.ts`, intent recorded before send,
marked sent/confirmed/failed/unknown) and `reconcileUnknown()` could ask the chain — but nothing ever called
`listUnresolved`, so a send that timed out, or an intent recorded and never sent, was silent on the next visit.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Recovery on session start | none (the reference has no journal) | `packages/markets/src/submitter/recovery.ts` (`recoverUnresolved`), `web/src/features/recovery/WriteRecovery.tsx` in `AppProviders` | Ours — doc 05's own requirement | **Done** — once per session object; AD-3 kept: nothing is ever re-sent, only the chain's answer moves a record |
| Verdicts | — | `reconcile.ts` now `confirmed \| reverted \| absent \| unknown` (a reverted receipt used to read as confirmed) | Correction | **Done** — confirmed → "An earlier call landed … It is in your Portfolio"; reverted → "… reverted on chain. No position was opened; only gas was spent"; absent → "… never reached the chain. Nothing was spent"; unknown > 24 h → failed "unverifiable after 24h", with "Check your Portfolio before placing it again"; unknown, fresh → one quiet "still being checked" |
| Order records carry their pool and market | — | `IntentRecord.pool`, `.marketId` (optional, additive); `order-lane.ts` records them; `summarize()` is now `Up on BTC (5m Window), 12.00 staked` | Additive | **Done** — old records keep the old machine string, once |
| Route boundary | `app/error.tsx` — "A quiet moment on the floor." | `components/states/BoundaryScreen.tsx`, `app/error.tsx`, `error.css` | Exact (the row above classed it Exact; the Masayume wording was never a recorded decision) | **Done** — words are the reference's; `min-height: 70vh` inside the shell because our layout keeps the header and footer around it (the reference's pages mount their own header) |
| Root boundary | none | `app/global-error.tsx` (own `<html>`, theme-init script, fonts, `index.css`) | Additive | **Done** — `100vh`, same words |
| Sanity test | — | `recovery.test.ts` | — | the verdict matrix, one test (59 total) |

**Not verified live**: the recovery path needs a wallet with a journaled unresolved intent, which the automated
browser cannot produce — types and the unit test only. The two boundary screens were not rendered in the browser
either (nothing on the site throws on demand); `error.css` uses the reference's own `var(--bg)` / `var(--white)` /
`var(--gray-400)`, which part-13 remaps, so the light theme should hold — worth one look the first time it fires.

### Alerts (Stage 3, done 2026-09-02)

Ported from `components/PriceAlerts.tsx` + `lib/priceAlerts.ts` into `web/src/features/alerts/`. In the
pinned source the button is mounted nowhere and `checkAlerts` has no caller; doc 03 asks for "device
permission + stored user rules + market stream evaluator", so the evaluator (`AlertsWatcher.tsx`) is ours:
one hidden watch per asset with a pending rule, on `useAssetPrice`, marking a crossed rule triggered once,
raising a toast, and a system notification when permitted.

| Element | Reference | Destination | Class | Status |
|---|---|---|---|---|
| Rule store, permission request, notification | `priceAlerts.ts` L1–80 | `alerts/store.ts` | Exact + subscription | **Done** — key `masayume.priceAlerts`; `subscribeAlerts` (in-module + `storage` event) |
| Bell button (tint + count once armed), popover, Above/Below, target defaulting to the rounded live price, add, list, remove | `PriceAlerts.tsx` L44–135 | `PriceAlertsButton.tsx` + `alerts.css` | Exact | **Done** — emerald/rose → `--profit`/`--loss`; outside-click/Escape via `useFloatingMenus` |
| Popover anchor | `top-[calc(100%+8px)] right-0` | opens upward, anchored to the Room+Alert group | Adapted | **Done** — the hero clips downward overflow, and anchored to the bell it ran past a 390 viewport |
| Evaluator | none | `AlertsWatcher.tsx` in `AppProviders` | Ours | **Done** — a real trigger fired in the browser (toast seen); the system notification path is the reference's, guarded |
| Foot line | — | popover | Ours | "Fires while Masayume is open in a tab" / "Browser notifications are off — alerts show here as a toast…" |
| Light theme | `bg-neutral-900/96` past part-14's ladder; `text-gray-*` | `alerts.css` | Deviation (invisible ≠ fidelity) | **Done** |
| Mount | old market page's Share/Copy/Alert row, removed in 8c7ecc1 | hero foot, beside the Room | **Placement ours** | **Needs user review** |

Doc 03's "lifecycle" notifications have no source in the reference — only thresholds exist there — and
stay pending.

### News and ticker (Stage 3, done 2026-09-02)

The ticker was done in Stage 1 (real DreamDEX prices + next close; Fear/Greed pending a provider). The
wire: `api/crypto-news/route.ts` (Cointelegraph + Decrypt RSS, the reference's keyword sentiment, 300 s
revalidate) → `web/src/app/api/news/route.ts`; `components/NewsFeed.tsx` → `features/news/NewsFeed.tsx`
(skeleton, "The wire is quiet. Headlines return shortly.", lead story, square-endpoint rule, numbered wire);
the page from the reference's deleted `app/news/page.tsx` ("Market News", the Japanese line verbatim,
`.page-title-jp` restored from that commit's globals.css into `news.css`). More-menu entry added.
Verified live: 8 headlines; both themes at 1280 and 390.

### Status (Stage 3, done 2026-09-02)

`app/status/page.tsx` polled a predict server; there is none, so `web/src/app/api/status/route.ts` *is* the
probe: RPC (block, rtt, head vs clock), indexer (venue source, lanes, live Windows, latency), the price feed
per live asset (lag = now − print time), the social store (`select 1`), Sensei (`resolveModel`, never a
key) — in parallel, each under a 10 s timeout; a port read holding a last-good value counts as failed.
`features/status/*` keeps the page's structure exactly: loading, unreachable, the banner (healthy under the
reference's 120 s rule / degraded / unreachable; "Checkpoint" → "Block"), the table with the 60 s / 300 s
dot ladder and an "optional" chip for a capability not set up, "Last checked … Auto-refreshes every 30s".
Verified live: healthy (5 lanes, 10 Windows, both prints fresh, store answered, Sensei unconfigured) and,
during a recompile, a real degraded state.

### Public proof — `/docs`, `/how-it-works`, `/pitch`, `/demo` (Stage 3, done 2026-09-02)

All four keep the reference's structure element for element and replace every Sui/DeepBook fact with a
sourced Masayume one. No framer-motion (not installed): CSS keyframes honouring reduced motion.

- **`/docs`** (`features/docs/*`, `docs.css`): sidebar groups with scroll-spy and progress, masthead with
  chips (`@somnia-chain/markets-sdk`, `v0.28.1` from `PINNED_TESTNET`), nine sections — overview, how a
  Window works, ways in, the chain layer, the read runtime, signing sessions, the projection, verify on-chain
  (every row a pinned address → explorer, chip `ADDR`), the cream disclosure plate — and the foot row
  (`/markets`, source ↗, `/status`). Two code blocks are real excerpts. **Review**: the source link.
- **`/how-it-works`** (`features/how-it-works/*`): steps, the 64/36 payout card kept and labelled a worked
  example, mechanics (order book, live feed, no-entry buffer `max(30, min(300, 0.4×interval))`, ERC-6909),
  "How a price is made" in place of SVI (`price(DOWN) = 1 − price(UP)`; real `Quote` fields), fees
  truth-corrected (settlement fee read per market; no Bernoulli/utilisation fee), settlement, architecture,
  seven FAQs (cash-out: the venue allows it, the app's control is pending), CTA. `sky-400` → off-blue.
- **`/pitch`** (`features/pitch/*`, `pitch.css`, `pitch-slides.css`): the fifteen-slide folio, keyboard and
  dots, paper in both themes as the reference; claims on the brief, `context/01`, `context/04`, `context/05`,
  the ledger and RESUME; live usage from `/api/leaderboard`; labels CONCEPT (3), CONCEPT · NOT LIVE (5),
  NEXT · NOT LIVE (7), MOCK · ILLUSTRATIVE (8, 15), NO-OP TODAY (11, the `AttributionHook` seam), no rate and
  no dollar table (builder codes are documented spot-only); team = the one name in `git log`. Additive: a
  stacked layout under 900 px and a scrolling stage on short viewports. **Review**: the drawn Somnia mark.
- **`/demo`** (`features/demo/*`, `demo.css` + `demo-sections.css`): the sticky bar, hero, CTA row,
  five sections and the closing CTA as the reference lays them out. The video slot holds an honest state
  (no recording exists); the traction line reads `/api/leaderboard` live with reading / failed /
  partial-day states; §01–03 carry real screenshots of `/markets`, `/reels` and the Sensei drawer captured
  2026-09-02 and captioned as such; §04's cards and §05's list link the pinned contracts and six real
  fills read from the indexer for a public venue wallet (`0xe118…aeb4`, named above the list — the demo
  wallet had no fills). Follows the theme instead of the reference's own near-black ground. **Review**:
  the screenshot choices and the third-party proof wallet.

## Product shell

| Element | Reference evidence | Destination | Class | Status |
|---|---|---|---|---|
| Root layout, metadata, providers | `app/layout.tsx` | `web/src/app/layout.tsx` | Exact | **Done** |
| Pre-paint theme (no dark flash) | `lib/theme.ts` `THEME_INIT_SCRIPT` | `web/src/lib/theme.ts` | Exact | **Done** — verified light + dark |
| Global design system | `app/globals.css` (5,849 L) | `web/src/styles/yosuku/part-01..18.css` | Exact | **Done** — 18 modules, concatenation verified byte-identical |
| App strip | `components/AppStrip.tsx` (95 L) | `web/src/components/shell/AppStrip.tsx` | Exact; **truth-corrected copy** | **Done** |
| Marquee (price tape) | `components/Marquee.tsx` | `web/src/components/shell/Marquee.tsx` | Adapted — real DreamDEX prices + next close | **Done**; Fear/Greed cell pending a real provider |
| Desktop header + More menu | `components/Header.tsx` (432 L) | `web/src/components/shell/header/{Header,HeaderAccount,nav-items,useFloatingMenus}` | Exact structure; wallet adapted to wagmi | **Done** |
| Mobile floating pill bottom nav | `components/Header.tsx` `MOBILE_NAV` | `web/src/components/shell/header/MobileBottomNav.tsx` | Exact + Games | **Done** — verified at 390px |
| Footer / grain / custom cursor | `Footer.tsx`, `GrainOverlay.tsx`, `CustomCursor.tsx` | `web/src/components/shell/*` | Exact; cursor honours reduced-motion + coarse pointer | **Done** |
| Theme toggle | `components/ThemeToggle.tsx` (37 L) | `web/src/components/shell/ThemeToggle.tsx` | Exact | **Done** |
| Toast / tx feedback | `components/Toast.tsx` (130 L) | `web/src/components/ui/toast.tsx` + `styles/toast.css` | Adapted | **Done** — see §Toast |
| First-run onboarding modal (5 steps, Skip/Next) | `components/Tutorial.tsx` (192 L) | `web/src/features/onboarding/*` | Exact shape; adapted copy | **Done** — see §First-run Tutorial |
| Sensei dock + contextual bubble | `components/SenseiDock.tsx` (337 L), `SenseiTape.tsx`, `SenseiTradeCards.tsx`, `app/api/sensei/route.ts` | `web/src/features/sensei/*`, `app/api/sensei/route.ts` | Adapted — Claude over typed read models | **Done** — see §Sensei |
| Error boundary | `app/error.tsx` | `web/src/app/error.tsx` | Exact | Partial (exists) |

Games add exactly one navigation destination. Markets, Reels, Create, Strategies, Leaderboard,
Portfolio and More all remain.

## Route baseline

| Route | Reference | Class | Data authority | Status |
|---|---|---|---|---|
| `/` | `app/page.tsx` | Exact shell; adapted identity/protocol copy | Static + real traction | **Shell** — honest dependency state |
| `/markets` | `app/markets/page.tsx` | Adapted to DreamDEX | DreamDEX indexer + RPC | **Partial** — real lanes/book/lifecycle/ticket live, Yosuku hero-as-ticket ported (see Stage 2 above), first-run Tutorial, §02 word board, §01 chart card, Sensei and the Room live — all four Stage 3 slots closed |
| `/markets/[id]` | `app/markets/[id]/page.tsx` | Exact redirect intent | — | **Done** — redirect |
| `/reels` | `app/reels/page.tsx` | Adapted | Shared market stream + social store | **Done** — Windows and takes woven; see §`/reels`, §Takes |
| `/portfolio` | `app/portfolio/page.tsx` | Adapted | Chain/indexer projection | **Partial** — money, open bets, claimables, settled history, equity, reputation, badges and CSV live; creator earnings, X wallet and the vault pending |
| `/portfolio/edge` | `app/portfolio/edge/page.tsx` | Adapted | Real fills incl. losses/voids | **Done** — see §Fill projection |
| `/leaderboard` | `app/leaderboard/page.tsx` | Adapted | Fill projection over the venue tape (DB store deferred) | **Done** — see §Fill projection |
| `/earn` | `app/earn/page.tsx` | Adapted via `MarketMakerVault` | Masayume contract | **Done** from source (Stage 5); live once the vault is deployed — §MarketMakerVault |
| `/strategies` | `app/strategies/page.tsx` | Adapted | `StrategyRegistry` + DB | **Shell** — honest dependency state (Stage 4) |
| `/agents` | `app/agents/page.tsx` | Adapted | Registry + fill projection | **Shell** — waits on the `StrategyRegistry` alone now (Stage 4) |
| `/parlay` | `app/parlay/page.tsx` | Adapted via `ParlayReserve` | Masayume contract + the venue's books | **Done** — contract, port and page built, fork-verified, live on Shannon (`0x50Ce…C151`, 5,000 tUSDC supplied) and driven through the adapter on a fork and live (see §ParlayReserve); driven in a browser 2026-09-03 (context/49); awaits the user's review |
| `/surface` | `app/surface/page.tsx` | Adapted — real DreamDEX structures, not SVI | The coordinator's books, pool params, the fee | **Done** — see §`/surface`; awaits the user's browser review |
| `/trade-from-x` | `app/trade-from-x/page.tsx` | Adapted | X provider + `EventVault` grant | **Shell** — honest dependency state (Stage 4) |
| `/claim` | `app/claim/page.tsx` | Adapted to DreamDEX redemption | Chain receipts | **Partial** — `/claims` implemented |
| `/fund` | `app/fund/page.tsx` | Adapted | Faucet + approval/deposit | Partial (faucet exists) |
| `/waitlist` | `app/waitlist/page.tsx` | Adapted | `Waitlist` contract or DB | **Shell** — honest dependency state |
| `/stats` | `app/stats/page.tsx` | Adapted | Chain-derived + labeled off-chain | **Shell** — honest dependency state |
| `/docs` | `app/docs/page.tsx` | Exact structure; adapted facts | Static + pinned addresses | **Done** — see §Public proof |
| `/news` | `components/NewsFeed.tsx`, `api/crypto-news/route.ts`; page from `93d09c1^` | Adapted | RSS provider, no credential | **Done** — see §News and ticker |
| `/creators` | `app/creators/page.tsx` | Adapted | DB profiles + on-chain receipts | **Shell** — honest dependency state |
| `/creator/studio` | `app/creator/studio/page.tsx` | Adapted | Authenticated studio + registry | **Shell** — honest dependency state |
| `/creator/recover` | `app/creator/recover/page.tsx` | Adapted | Signed-wallet recovery | **Shell** — honest dependency state |
| `/studio` | `app/studio/page.tsx` | Adapted | DB/object storage | **Shell** — honest dependency state |
| `/how-it-works` | `app/how-it-works/page.tsx` | Exact structure; adapted facts | Static | **Done** — see §Public proof |
| `/demo` | `app/demo/page.tsx` | Real behavior; no invented economics | `/api/leaderboard` live + real screenshots + real tx links | **Done** — see §Public proof |
| `/pitch` | `app/pitch/page.tsx` | Exact grammar; adapted claims | Real evidence only; `/api/leaderboard` live | **Done** — see §Public proof |
| `/download` | `app/download/page.tsx` | Web/PWA exact | Static | **Shell** — honest dependency state |
| `/status` | `app/status/page.tsx` | Adapted | Read-time probes (`api/status`) | **Done** — see §Status |
| `/social` | `app/social/page.tsx` | Adapted | Postgres + realtime | **Shell** — honest dependency state |
| `/native-auth` | `app/native-auth/page.tsx` | Web auth adapted | — | **Shell** — honest dependency state |
| `/bell` | `app/bell/page.tsx` | Exact redirect intent | — | **Done** — redirect |
| `/pool` | `app/pool/page.tsx` | Exact redirect intent | — | **Done** — redirect |
| `/beta` | `app/beta/page.tsx` | Exact redirect intent | — | **Done** — redirect |
| `/markets-live` | `app/markets-live/page.tsx` | Exact redirect intent | — | **Done** — redirect |

`/dev/*` in Yosuku are internal design-review utilities. They are **not** a mock-data deliverable and
never justify fabricated public data.

## Additive game routes

| Route | Responsibility | Class | Status |
|---|---|---|---|
| `/games` | Yosuku-native selection + active-session return | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/duel` | Ranked/Free PvP prediction duel | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/practice` | Labeled no-stake tutorial loop | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/lucky` | Randomized live-market mode, auditable selection | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/range` | Range market backed by `RangeReserve` | Additive | **Shell** — honest dependency state |
| `/games/moonshot` | PIPS-derived; economic nature stated plainly | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/line-rider` | PIPS-derived arcade | Additive | **Shell** — honest dependency state (Stage 6) |
| `/games/candle-hop` | PIPS-derived arcade | Additive | **Shell** — honest dependency state (Stage 6) |

### Proposed Stage 6 acceptance additions (research only)

These rows add capability-level acceptance without rewriting the route rows above. Architecture and evidence:
`docs/architecture/yosuku-source-led-migration/06-game-architecture.md` and
`context/52-games-research-2026-09-03.md`.

| Capability | Source / adaptation | Data authority | Proposed acceptance |
|---|---|---|---|
| Shared Games layout + resume | Yosuku shell; PIPS selection/progression | Chain + DB active-match projection | All eight routes share profile/settings/stage chrome; active non-terminal match resumes before new selection |
| Practice | Flicky solo loop, adapted | Live public spot + local deterministic state | No wallet position, payout, opponent, MMR, streak or leaderboard write; no-stake label throughout |
| Ranked / Free Duel | Flicky lifecycle; DreamDEX gateway adaptation | GameArena + DreamDEX receipts/outcomes | **Contract and realtime done (slices 6 and 7)** — Free escrows no pot and still plays real capped picks; Ranked escrows the pot separately; create-cancel, join-timeout, reveal-unavailable, one-forfeit, both-incomplete, tie-split and void all covered by tests. Queue, pairing, the seed ceremony, a durable deck commitment, chain projection and permissionless settling all run. **The stage waits on slice 8** |
| Matchmaking, realtime and reconnect | Flicky's ws rooms and MMR pairing, independently implemented | Chain snapshot + DB projection; queue and presence are process memory | **Met (slice 7)** — one `ws` server in ops; wallet-signed room token bound to one arena on one chain; typed protocol where no client message can carry an amount; widening Elo band swept on the tick; commit-reveal on both client seeds; deck reveal sealed and journalled before any commitment is published; projector cursor and permissionless settler. A browser reconnect is proven live against Shannon; a mid-picking process restart is proven by construction and still owed a live drive, which needs picks that spend real tUSDC |
| Atomic pick | Leverage/EventVault gateway pattern | One GameArena transaction receipt | **Met on chain (slice 6, `a1ba6ed`)** — `placePick` walks the live book, places the IOC and records the measured cost and quantity in one transaction; a zero fill reverts; a partial fill above the minimum records what filled. Fork-verified against Shannon with six real picks; live at `0xec71…f0dF` |
| Lucky audit | PIPS seeded reel, adapted from strike to Window scan | Commitment + candidate-set hash + real quote/receipt | Player can recompute draw; sees Window/side/quote/slippage/gas payer before signing; result/history from receipts |
| Range integration | Existing Stage 5 route | Live RangeReserve + OracleHub | Shared game chrome/history only; no second read or settlement source |
| Moonshot A | PIPS reach mechanic on Range model | Proposed MoonshotReserve + OracleHub | Target solved from selected multiple, prefunded and real; unavailable until fork-verified, deployed and supplied |
| Arcade pair | PIPS mechanics independently reimplemented | Postgres server-checked score | Deterministic engine/version/trace checks; label scores off-chain and not cheat-proof; pause/reduced motion work |
| Matchmaking + room | Flicky pattern, adapted | Ephemeral ops process; chain/DB rebuild | Rating bands widen with wait; authenticated typed protocol; restart/reconnect reconstructs; messages cannot settle/pay |
| Game profile + friends | Additive Masayume layer | Postgres, linked identity evidence | Unique handle; directional follows by profile; Friends board filters verified results, never invents activity |
| Unified leaderboard + seasons | PIPS board shape; Flicky season pattern | Receipts for economics; DB ratings/scores; optional prize contract | Overall/Prediction/Arcade/Friends/Seasons in `/leaderboard`; no prize claim before funded contract receipt |
| Audio/haptics/accessibility | PIPS interaction discipline | User setting + platform support | Explicit sound control, best-effort haptics, keyboard/pointer parity, reduced motion, hidden-tab pause |
| Share result | Flicky artifact pattern; Masayume proof links | Verified terminal match + stored artifact hash | Portrait card contains mode/opponent/result/proof URL, never unverifiable balance or fabricated statistic |
| Stage 6 provenance | PIPS/Flicky behavior references | Pinned sources; no repo-level reusable licence | Independent implementation only; no copied unlicensed UI, engine or server source |

## Read-path and navigation acceptance — implemented 2026-09-03

Architecture: `docs/architecture/performance-read-architecture-2026-09-03.md` (§Implementation
record) and `docs/plans/2026-09-03-navigation-design.md`. Commits `287dac6`, `e964c0d`, `809fc10`,
`e7d40a0`, `a724b94`.

| Capability | Status | Acceptance met |
|---|---|---|
| Grouped navigation | **Done** | Desktop shows Markets, Reels, Games, Build, Explore, Portfolio with the three groups as `haspopup="menu"` carrying 8/7/16 destinations; mobile keeps Markets, Reels, Games, Portfolio, More; the drawer holds all 34 with one home each; a route-coverage test fails when a listed public route loses its home |
| Navigation accessibility | **Done** | Escape closes and returns focus to the trigger; the drawer is labelled "Everything in Masayume", traps focus and restores it to More; `aria-current="page"` on the active destination; `/games/range` lights Games and not More |
| Navigation responsive | **Done** | No horizontal overflow at 1440, 768, 390 or 320; bottom-bar targets 56×48; the drawer scrolls 2561px inside a 446px viewport at 320; the sixteen-item Explore menu bounds itself to `--available-height` and scrolls rather than hiding its last five destinations |
| Read dependency declaration | **Done** | Clock, collateral and venue are independent queries; each read declares the facts it needs; five HTTP-only pages declare none and no longer wait for the chain |
| Read failure contract | **Done** | A first-load infrastructure failure rejects so Query has a real error state and retry; domain failures resolve without retry; a failed refresh keeps the last-good value marked stale |
| Markets first-load states | **Done** | Chart skeleton at 143–186 ms, diagnosis with retry on failure, "no live Windows" when genuinely empty; no instruction to click to begin loading |
| Portfolio tiering | **Partial** | Critical/deferred split, one page-level error only when every critical read fails on the connection, settled history de-polled. **Unmeasured signed-in** — reproducing the retry storm needs a wallet session |
| Endpoint health | **Done** | Health is a completed `eth_chainId` round trip with chain id, latency and consecutive failures per endpoint; one selection point; auto-rotation stays off so a read failover cannot move a signer |
| Safe read persistence | **Done** | Allowlist is collateral, venue and book parameters only; nothing account-scoped is ever written; restored values marked `aged`; the allowlist is pinned by a test |
| Read-path instrumentation | **Partial** | Ten milestones published on the page, identity-free. **No field collection or aggregation** |
| Degraded-endpoint behaviour | **Done** | With the chain socket dead and the indexer healthy, `/markets` is usable at 1337 ms and `/status` renders fully; one retry button on screen, naming the real cause. Before this work the same condition left the entire application blank indefinitely |
| Provider/route boundary split, lazy loading, route skeletons | Pending | Phase D of the read architecture; not started |
| Settled-history archive/delta split; mutation-specific invalidation | Pending | Phase C remainder |

## Feature families

Tracked separately so the route table cannot hide a missing capability.

| Family | Status | Notes |
|---|---|---|
| Cadence-aware market discovery | **Partial** | Real 5m/15m/1h/4h/1d lanes live, on `/markets`, in the reel, and across the §02 word board |
| Hero-as-ticket trade flow | **Partial** | Ticket + quote + guarded write live; Yosuku presentation ported |
| Reel — snap feed of live Windows and takes | **Done** | Market cards off the shared stream; community takes woven in from the social store, honest when unconfigured |
| Up/Down · stake · cash-out · claim · receipt | **Partial** | Up/Down, stake, claim, receipt live; cash-out pending |
| Range · leverage · private | **Done** | `RangeReserve`, `LeverageReserve` and `PrivateDesk` live on Shannon; the private route is link-private, said so |
| Rooms / comments | **Done** | Position-gated, signature-authenticated, over `packages/db`; honest when unconfigured |
| Social takes, sharing, alerts, news/ticker | **Done** | Signed takes over Postgres; The Call and Earned Heat share cards; threshold price alerts with a live evaluator; the wire on `/news`; the ticker on real prices (Fear/Greed pending a provider) |
| X linking | **Partial** | OAuth/PKCE + signed wallet binding, parser, `/trade-from-x`, `/claim`, the relay actor and receipts built; the live X account, credentials and posting stay with the owner; on-chain execution needs the vault deployed |
| Trading Balance with labeled pools | **Partial** | `EventVault` written, fork-verified (contract and adapter), ported and surfaced on `/portfolio`, the plate, bets, history and `/claims`; not deployed (owner) |
| Positions, PnL, history, equity, reputation, badges, Trader Edge | **Done** | Open positions off the venue's PnL; history, equity, PnL, reputation, badges, CSV and Trader Edge off the fill projection; the leaderboard off the same replay venue-wide |
| Earn, parlays, strategies, creators, agents, playbooks | **Partial** | `StrategyRegistry`, the runner, `/strategies` + `/agents` live on Shannon; `ParlayReserve` + `/parlay` live on Shannon (deployed and supplied 2026-09-02); Earn, creators, playbooks stay Stage 5 |
| Assistant (Sensei) | **Done** | Claude-backed; honest unconfigured state, lights up on `ANTHROPIC_API_KEY` |
| Faucet, account setup, recovery, smart-wallet session, revocation | **Partial** | Faucet live; session-key tap trading with the enable sheet, manager, revoke, grant-without-key recovery and the sponsor rail built; all on-chain steps wait on the deployment |
| Status, docs, how-it-works, demo, pitch | **Done** | Read-time probes; every public page on real facts and live reads |
| Traction, download, error recovery | **Done** | `/stats` off the board's scan (24h, floors labelled); `/download` as the PWA install surface with a real capture; journal reconciliation on session start, reference boundary words, root boundary |
| Game selection, progress, achievements, stats, matchmaking, MMR, sound/haptics | Pending | Stage 6 |

## Visual contract

Ported from source, not approximated: light ground `#F4EEE3`, dark ground `#050505`, ink `#141210`,
vermilion `#E04D26`, profit `#34D399`, loss `#FB7185`; Sora display / Inter body / JetBrains Mono data
/ Noto Serif JP editorial; grain, crop marks, torii rhythm, numbered headers, ticker, editorial
italics; source spacing, borders, radii, shadows, breakpoints, easings; reduced motion; no theme flash.

The superseded gold/Archivo theme is removed, not layered over.

## Responsive contract

Inspected at 390 / 768 / 1024 / 1440 (source breakpoints govern). Mobile keeps the compact header and
persistent floating pill bottom nav. Reels stays phone-proportioned on large screens. Trading controls
become sheets/drawers per source. Desktop adds density without reordering the workflow.

## State contract

Every surface accounts for: identity (signed out → connecting → first run → linked → returning →
recovery → revoked); money (unfunded → insufficient → grant required → funded → pending withdrawal);
reads (loading → live → stale last-good → empty → disconnected → unavailable); market (upcoming → live
→ between rounds → near expiry → suspended → expired → settled → voided); trade (quote loading → quote
moved → confirmation → submitted → fill/partial → rejected → unknown → claimable → redeemed);
social/agent; and game lifecycle.

No invented data is used to demonstrate any of these. Loading and unavailable are valid product states.
