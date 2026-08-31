# Yosuku front-end: routes, screens & UX (reference doc)

Source: `reference/yosuku` — Next.js (App Router) consumer prediction-market front-end on Sui / DeepBook Predict.
Scope of this doc: every route under `app/` (pages, layout, error boundary, globals.css) plus `components/landing/**`. API routes are covered by a separate doc.

Product in one line: **"Bet on Bitcoin up/down in fixed rounds (1m / 5m / 1h), from the web, a phone, an X reply, or an AI agent — gasless, no seed phrase, only you can cash out."** Rounds settle automatically on a Pyth oracle price; a vault (not a counterparty) quotes both sides off an SVI volatility surface.

Design language (used everywhere): near-black `#050505` ground, **vermilion `#E04D26`** as the single brand accent, profit-green `#34D399` / loss-rose `#FB7185` reserved strictly for direction/P&L, Sora (display) + Inter (body) + JetBrains Mono (data) + Noto Serif JP (decorative italic), film-grain overlay, corner "crop" ticks, torii-style numbered section headers ("01 · Live now"), Japanese editorial framing (banzuke leaderboard, "the floor", "the bell"). A cream/light theme ("light mode beta") is implemented as a token swap with deliberate "dark islands" (the reel, X-trade page stay dark).

---

## Route table

| Route | Purpose | Status |
|---|---|---|
| `/` | Landing page (award-style editorial pitch surface) | marketing |
| `/markets` | **Flagship market browser + bet ticket** (hero chart, cadence rail, word markets, Sensei dock) | core |
| `/markets/[id]` | Old market detail → redirect to `/markets` (retired venue) | redirect |
| `/reels` (renders "/feed") | TikTok-style vertical snap feed of live rounds woven with community "takes" | core |
| `/portfolio` | Balance plate (one number), pools, open/settled bets, creator earnings | core |
| `/portfolio/edge` | "Know your edge" — personal trading analytics report from on-chain history | core |
| `/leaderboard` | 24h P&L leaderboard: podium + sumo-banzuke two-column ledger + "You" bar | core |
| `/earn` | Supply the LP vault ("be the house"), share price / utilization dashboard | core |
| `/strategies` | AI copy-trading desk: live desk, memory market, agent archive, launch-an-agent studio, copy drawer | core |
| `/agents` | Agent leaderboard (capital entrusted, copy-trades, hard caps) | core |
| `/parlay` | Multi-leg parlay builder + live slip | core |
| `/surface` | SVI volatility surface explorer (smile, strike ladder, term structure) | core (power-user) |
| `/trade-from-x` | "X-trade" onboarding: connect → fund+authorize agent (1 sig) → tweet bets | core |
| `/claim` | Claim tweet-bet winnings: sign in with X → bind wallet → claim (TEE-attested variant) | core |
| `/fund` | Card on-ramp (Paystack NGN test mode) → DUSDC to own wallet | core |
| `/waitlist` | On-chain founder waitlist + referral climb + `.yosuku.sui` name check | growth |
| `/stats` | "Proof of demand" — live on-chain traction dashboard (growth curve, activity feed) | marketing/judge |
| `/docs` | Editorial docs: overview, SDK, MCP server, attested agent, contract links | marketing/dev |
| `/creators` | Creator guide for X-Predict (post a card, earn builder fees) | marketing |
| `/creator/studio` | Creator card studio (build + share a prediction card) | core (creator) |
| `/creator/recover` | Passkey-only recovery of creator earnings (no social login) | core (creator) |
| `/studio` | Founder-only "Line Studio": passphrase-gated tool to post live lines to X | internal tool |
| `/how-it-works` | Explainer: steps, payout example, SVI math, fees, settlement, FAQ | marketing |
| `/demo` | Video + scrolly demo walkthrough with Suiscan tx proof links | marketing/judge |
| `/pitch` | Full keyboard-driven 14-slide pitch deck as a route ("The Yosuku Folio") | marketing/judge |
| `/download` | iOS TestFlight page with real device screenshot in CSS phone frame | marketing |
| `/status` | Indexer/pipeline health page (lag per pipeline) | ops |
| `/social` | Internal content board (tweet threads with copy buttons), noindex | internal tool |
| `/bell`, `/pool`, `/beta`, `/markets-live` | Redirects to `/markets` / `/earn` (graceful retirement of old routes) | redirect |
| `/native-auth` | OAuth bridge page: forwards Google id_token fragment to `thebell://auth` app scheme | infra |
| `/dev/*` (betplaced, receipt, room, takes, playbook, private, proof) | Design-review harnesses rendering real components with fixture data; `return null` in prod | dev |
| `app/error.tsx` | Route-level error boundary, on-brand ("A quiet moment on the floor") | infra |
| `app/markets/[id]/opengraph-image.tsx` | Dynamic OG card (edge runtime) with live probability estimate | infra |

---

## `app/layout.tsx` — root layout (88 lines)

- Fonts via `next/font/google`: Sora (`--font-sora`, display), Inter (`--font-inter`), JetBrains Mono (`--font-jetbrains`), Noto Serif JP (`--font-noto-serif-jp`).
- Metadata: title "Yosuku · bet anywhere", OG/Twitter cards, PWA manifest, `appleWebApp` config (installable web app).
- Body order: inline `THEME_INIT_SCRIPT` (from `lib/theme`) runs synchronously before paint so the resolved dark/light theme lands on the first frame (no flash) → `<AppStrip />` (fixed top strip advertising the app; reserves height via `--appstrip` CSS var) → `<WalletProvider>` (Sui dapp-kit wrapper) → `<ToastProvider>` → children → Vercel `<Analytics />`.
- Chain-specific: `WalletProvider` (`@mysten/dapp-kit`) — replace with wagmi/RainbowKit for EVM. Everything else is chain-agnostic.

## `app/globals.css` — design system (5,849 lines, summary)

- Tailwind v4 `@theme` block defines tokens: `--color-vermilion #E04D26`, `--color-profit #34D399`, `--color-loss #FB7185`, gray ramp, font aliases, three easing curves (`--ease`, `--ease-out`, `--ease-bounce`).
- `:root` duplicates the tokens as plain CSS vars; `overflow-x: clip` on html/body (deliberately not `hidden`, to keep `position: sticky` working); vermilion `::selection`; vermilion `:focus-visible` ring.
- Major scoped component systems (each a named comment section): AppStrip, Marquee (price ticker), **SenseiDock + Sensei drawer** (AI assistant with progress-ring avatar, chat bubbles, inline trade cards), settle-clock (round countdown ring), **page-hero "editorial trading floor"**, sticky filter bar, featured-market hero, tape (live-trade strip), torii section headers, market grid + market card (incl. `cardFlash`/`rowFlash` update animations, `strike-pulse`), expanded market modal ("morphs open from the hero card"), `/feed` full-screen snap feed, word-markets board, leaderboard hero / **podium** / Yokozuna champion strip / **banzuke** / sticky "You" bar, ledger plate (cream card inside dark page), calendar heatmap, equity/positions cards, landing sections (hero dial, stats band, how-it-works, sticky features, manifesto, editorial split, FAQ, footer with giant watermark), tooltips, custom cursor, floating pill mobile bottom nav.
- **Light mode ("beta")**: a huge `[data-theme="light"]` remap layer that converts white-alpha utilities into ink-alpha equivalents on a warm cream ground (`#F4EEE3`), with explicit "dark islands" (reel cards, X-trade page) that stay near-black in both themes. Worth copying as an approach: tokens + a remap layer, not a second stylesheet.
- Reduced-motion is respected throughout (`@media (prefers-reduced-motion: reduce)` disables every keyframe system).

## `app/error.tsx`

Error boundary styled with theme vars: headline "A quiet moment on the floor.", reassurance ("Your funds and positions are safe on-chain. This is only the screen."), Try-again button + link to `/markets`. Copy tone worth stealing verbatim for any on-chain app.

---

## `/` — Landing page (`app/page.tsx`, 1,032 lines)

The pitch surface. Award-site style, fully data-live (no fake numbers on the hero).

**Sections, in order:**
1. **Hero** — left: eyebrow "Foresight, rendered on-chain", H1 "Read the room / before the room reads itself.", CTAs "Launch app ↗" (`/markets`) and "How it works ↓". Right: the **hero dial** — an SVG gauge (300×300) with 72 tick marks, an arc showing live UP probability, a rotating needle, decorative sparkline, center readout: `UP PROBABILITY / 62% / BTC > $64,120 / closes in 0:43`. The dial is driven by real data: `fetchMarkets624()` + `fetchSpot624()` every 15s, strike from `strike624(spot,'up')`, probability from a logistic `probAbove(spot, line, msLeft)` (`app/page.tsx:100`), countdown from `useBell624()` next-bell. Comments record hard-won lessons: price the same horizon the countdown shows; lock strikes on first sight so the question text never rewrites itself (`app/page.tsx:296`). Also `hero-award` badge ("Edition One · Tokyo 2026" seal), frame corners, cursor glow, scroll indicator.
2. **How it works** (`#how`) — 3 editorial steps (Choose / Commit / Settle), each with a hand-drawn inline SVG "art frame" (market card mock, probability ring, settlement checkmark) revealed by IntersectionObserver (`.in-view`), with a no-IO fallback so screenshots never capture blank sections (`app/page.tsx:385`).
3. **Sticky features** — 5 "acts" (One press / Cash out anytime / Side or range / Be the house / Autopilot with hard rules), scroll-driven crossfade: section is tall, a pinned stage crossfades acts as `featureProgress` (computed from scroll position, `app/page.tsx:432`) passes thresholds; vertical progress rail + dots. Each act has its own inline SVG diagram (strike/window/settle, binary position, settlement flow, reputation ladder, agent guardrails).
4. **Manifesto** — single blockquote between vertical rules: "The market is a room of opinions. We built a quieter room: pick a side, wait for the clock, get paid."
5. **Editorial split** — "Fast payouts. Only you can cash out." + numbered spec table (`SPEC_ROWS`: Runs on Sui, automatic payouts, live prices, round lengths, test dollars, sub-second settle, audits in progress).
6. **App band** — infinite marquee link (`-50%` translate, duplicated halves) to `/download` cycling phrases ("Try it on *your phone*", "Call the next round in *ten seconds*").
7. **iOS section** — "It fits in *your pocket*" + TestFlight CTA.
8. **FAQ** — 5 items, single-open accordion, category sidebar with counts, all answers in honest plain language (includes "test dollars, not real money").
9. **Footer** — headline "Quiet markets, loud answers. *Every round.*", brand column, 3 link columns (Product / Develop with npm SDK + MCP links / Society), a status strip (Network Sui · Protocol DeepBook Predict · Latency Sub-second · Build v0.4.1), giant outlined "YOSUKU" watermark. Comment: "Every link goes somewhere real — dead '#' anchors read as broken to a judge."

**Data sources:** `useBtcPrice`, `useOracles`, `useProtocolStats`, `useBell624`, `/api/oracles?prices=1` (15s poll), `fetchMarkets624`/`fetchSpot624` from `lib/sui/predict624Client`, `getCanonicalMarketLine`, `strike624`.
**Components:** `Header`, `Marquee`, `GrainOverlay`, `YosukuMark`.
**Port notes:** the dial, scroll systems, and copy are chain-agnostic; swap the four data fetchers for DreamDEX event-contract reads. The "spec table" and footer status strip just need new values.

### `components/landing/**` — legacy landing kit (UNUSED by current app)

`grep` confirms nothing imports these; they are an earlier landing page for the same product under the previous name **"DART"** (mint-green `#34D399` accent, not vermilion). Still worth mining for techniques:
- `HeroSection.tsx` — full-bleed photographic hero (`/hero.png`), gradient scrims, animated CSS "smoke" layers, live BTC price pill (`useBtcPrice`), giant condensed "DART" wordmark, magnetic CTA buttons.
- `FeaturesScroll.tsx` — GSAP ScrollTrigger **horizontal scroll-jacked section** (pin + translate a 300vw track): slide 1 brutalist typography on mint, slide 2 canvas particle-wave ("Deep Liquidity", 250 particles + connecting lines, retina-aware), slide 3 glass tilt cards; separate stacked mobile layout below `md`.
- `HowItWorks.tsx` — 400vh scrolly with a canvas **3D point-sphere** (250 points, rotation + radius driven by scroll progress, distance-based line connections) and three crossfading text overlays (mix-blend-difference).
- `FinalCTA.tsx` — full-screen mint CTA: mouse-parallax "START PREDICTING" mega-type (framer-motion springs), white background wipes up on hover, whole section is the click target.
- `TickerMarquee.tsx` — framer-motion marquee of BTC/ETH/ALEO prices from **CoinGecko simple/price API** (30s poll) + fake volume stat.
- `MagneticButton.tsx` / `TiltCard.tsx` / `TextReveal.tsx` — reusable micro-interactions: magnetic pull (30% of cursor delta via `useSpring`), 3D tilt (±10deg, translateZ content), per-letter staggered mask reveal (Ochi ease `[0.76,0,0.24,1]`).
- `hero/PredictionOrb.tsx` — react-three-fiber crystal orb: physical material (transmission/clearcoat/sheen), inner glow, 150 orbiting instanced particles, mouse tilt, Bloom postprocessing, `tier: 'high'|'medium'` quality switch; `hero/OrbFallback.tsx` — pure-CSS orb fallback for low-power devices.
All chain-agnostic; libraries: gsap + ScrollTrigger, framer-motion, @react-three/fiber/drei/postprocessing, lucide-react.

---

## `/markets` — flagship market browser (`app/markets/page.tsx`, 908 lines)

The core screen. Layout: Marquee + Header + page hero (chart + ticket) → "01 · Live now" card rail → "02 · Just ask" word-market board → footer; SenseiDock floats bottom-right; first-visit `Tutorial` overlay.

**User flow:**
1. Land on a **featured market in the hero**: big canvas price chart of the live Pyth tape with the strike line drawn, question headline "BTC holds above **$64,120**?", distance-to-line readout ("$78 above the UP line" / "needs +$42 for UP to win"), "Settles in MM:SS" countdown (turns vermilion under 60s), UP/DOWN buttons with live cent odds, an odds ramp bar, and a "The Room" chat link.
2. A **cadence toggle** (1 min / 5 min / 1 hr) sits with the headline; user-chosen cadence is pinned (never auto-reverted), dead lanes are dimmed "Between rounds" but never removed (`app/markets/page.tsx:536` region).
3. Beside the hero (desktop) / as a slide-in drawer (mobile): **`Ticket624Drawer`** — the bet ticket. Tapping any card or an UP/DOWN button "loads it into the hero" (`openTicket` scrolls to top on desktop) with side preselected. Deep-link support: `?m=<marketId>&dir=up|down` preselects round + side (`app/markets/page.tsx:565`).
4. If the selected round enters its submission buffer while sizing, the **ticket auto-advances to the next round of the same cadence**, keeping side/amount/leverage (`ticketMarket` memo, `app/markets/page.tsx:597`).
5. **"Live now" rail**: exactly one card per cadence (`RailItem` = market | placeholder), so three lanes are always present. Each `Market624Card`: asset glyph + cadence word, countdown with pulsing clock dot, locked question, spot + delta%, mini canvas sparkline with strike target, "LIVE ODDS" ramp, UP/DOWN foot buttons showing cents, and a **"The Room · bettors only · encrypted"** button opening `MarketRoom` (per-market chat gated to actual bettors; `roomAlso` passes later round ids because bets may have rolled forward).
6. **Word markets** ("Just ask"): `WordMarketBoard` — same live markets phrased as plain yes/no questions, no chart. (Its Yes/No taps deep-link into `/markets?m=…&dir=…`.)
7. **SenseiDock** (`targetTime = next expiry`): floating AI-assistant dock with countdown ring that expands into a chat drawer with inline trade cards (CSS in globals: `sensei-dock`, `sensei-drawer`, `sensei-trade`).

**Odds engine (`useHouseOdds624`, `app/markets/page.tsx:127-233`)** — the most interesting mechanism: display odds come from **unsigned dry-run simulations of a minimum ticket against a funded house account** (`HOUSE_SENDER`/`HOUSE_WRAPPER`), normalized to cents per $1 payout. Per-market cache (18s stale window), 3s sweep with a 4-worker concurrency pool and 350ms stagger, hero market quoted first. UP and DOWN are different bands (each with a $20 cushion) so they deliberately don't sum to $1 ("honest, not a bug"). Strikes are pinned at first quote so the question never mutates.

**Chart rendering:** `drawPriceLine` from `lib/charts/canvasChart` with options (`target`, `verdict`, `gridLines`, `axisRight`, `motion`, `fighters`); the hero springs only the **leading edge** of the series via `useLivePrice` so history never wobbles (`app/markets/page.tsx:626`).

**Data:** `fetchMarkets624` (15s), `fetchSpot624` (5s, settlement Pyth feed), `fetchPythHistory624(120)` (15s, shared series for hero + all sparklines), `pollWhileVisible` wrapper pauses polling on hidden tabs.

**Port notes:** Chain-specific: the dry-run quoting (replace with DreamDEX quoter / view function), `Ticket624Drawer` internals, Sui ids. Chain-agnostic and worth porting wholesale: the rail-with-placeholders pattern, cadence pinning, ticket auto-roll, strike pinning, deep links, hero-as-ticket-target interaction, Room-per-market, odds ramp visual language.

---

## `/reels` — the vertical reel (`app/reels/page.tsx`, 353 lines; renders `.feed-snap`)

**The moat feature.** A full-screen vertical **snap-scroll feed** (one card per screen) weaving two card types via `weaveReel()` (`app/reels/page.tsx:47`): market, take, market, take…

- **`ReelCard`** (market): framed portrait card (max 460px, rounded 26px, radial near-black gradient, SVG film grain, vermilion heat hairline on top) with: BTC meta + round close time, big countdown (`fmtBell624`), headline "Will BTC be above **$64,120**?", live spot + signed distance vs line, and the **chart as the hero** filling the middle (animated canvas tape with "win line" label). Win-line is **frozen per market at first sight** so distance reads as a moving number (`app/reels/page.tsx:78`). Only the on-screen card runs the rAF animation (IntersectionObserver gates `motion`); off-screen cards draw once. Foot: UP/DOWN buttons that route to `/markets` — "honest, no fabricated odds" (bets happen on the markets page).
- **`TakeReelCard`** (social): a community take fetched from `fetchTakes` (`lib/sui/takeBoard`, Walrus-stored), with "take the other side" as the bottom action.
- **Take composer**: a vermilion **"Take" pill fixed on the right rail, mid-card (TikTok-style placement so it never covers a card's action row)** opens `TakeComposer624`; posting reloads the feed.
- **Swipe hint**: bouncing chevron + solid vermilion pill "Swipe up for the next market", hidden only after a real scroll (>60px, not the first stray pixel).
- Empty/loading states are portrait cards with pulsing dots ("between rounds, a new one rolls every minute.") so the feed never looks frozen.

**Data:** `fetchMarkets624` (15s, success-gated so a failed read never empties the deck), `fetchSpot624` (5s), `fetchPythHistory624(150)` (15s), `fetchTakes(30)` (20s).
**Port notes:** entire interaction model is chain-agnostic (CSS scroll-snap + canvas); only the four fetchers and the take-storage (Walrus) are chain-specific. This is the #1 feature to replicate.

---

## `/portfolio` (`app/portfolio/page.tsx`, 563 lines)

**Design thesis (stated in comments): the page opens with ONE number.** No "Portfolio" headline; the balance IS the header.

- Disconnected: "Connect Wallet" card + `XWalletCard` below it (claim your X-account wallet), link "New to Sui? Test funds are free →".
- Connected: **`BalancePlate`** (cream ledger-plate component) shows the single spendable figure, open-bet / settled counts, a primary "bet" CTA → `/markets`; inside it, **`PoolRows`** lists every non-spendable pool as rows (fed by `useMoney()`, one read so plate and rows can't disagree), with the X-wallet's controls embedded in its own row; a `<details>` disclosure "Creator earnings and recovery" wraps `CreatorEarningsCard`.
- `TraderEdgeLink` → `/portfolio/edge`.
- **`Portfolio624Section`** — "Your bets" (open + settled positions on the live venue).
- A retired `LeveragePortfolioPanel` implementation remains in-file (orders opening/confirming with Suiscan links, positions with equity/cashout/live P&L/health stats, `HealthBadge` HEALTHY/WATCH/AT RISK, plain-language "How this works" disclosure, self-serve Cancel→refund) — the old-deployment section was removed from render but the components show the UX language for leverage.
- Private bets: `loadPrivateBetTickets` from **localStorage** (4s poll + `storage` event), merged into the private-balance row.
- Vault deposit/withdraw/withdraw-private handlers via `useSmartSubmit` (sponsored-gas smart submit) + `tradingVaultClient` tx builders; equity curve drawn via `drawEquityCurve` from manager P&L API series; badges via `computeBadges`; CSV export helpers imported (`positionsToCSV`).

**Data:** ~10 hooks from `lib/sui/hooks` (manager, balances, positions, summary, PnL, PLP, trading vault), `lib/sui/leverageHooks`, `fetchReputation`, `fetchManagerPositionsSummary`, localStorage private tickets.
**Port notes:** the one-number BalancePlate + pool-rows information architecture, health badges, and plain-language risk copy are gold and chain-agnostic; every hook/tx builder is chain-specific.

## `/portfolio/edge` (`app/portfolio/edge/page.tsx`, 255 lines + CSS module)

Personal analytics report ("Know your edge") computed **entirely client-side** from on-chain expiry summaries (`fetchExpiryHistory` → `computeTraderEdge729`): net-result equity curve SVG with zero line, ROI, metric tiles (win rate, profit factor, expectancy, max drawdown), **"When you perform best"** — P&L bucketed by local time-of-day windows with split gain/loss bars, "Your payoff shape" (avg win/loss, best streak, fees, stake), a generated natural-language "Yosuku readout", and a provenance note ("calculated in your browser from PredictData.expiry_summaries… redeeming doesn't erase the ledger"). Careful empty states (no wallet / loading skeleton / read error / no settled rounds). Uses a CSS module (the only page that does). Fully portable concept; swap the history fetcher.

---

## `/leaderboard` (`app/leaderboard/page.tsx`, 344 lines)

- **Hero** ("The *house* of names.") with meta column: ranked traders, total staked, "Next market closes in" HH:MM:SS (nearest live expiry, 15s poll), TODAY'S BOARD stamp; honest scope filter bar ("BTC · Last 24 hours", closed-calls count).
- **01 · The podium** — top 3 rearranged `[2nd, 1st, 3rd]`, rank #1 gets a "GRAND CHAMPION" sash + win-streak eyebrow; avatar = deterministic glyph from address hash (`glyphFromAddress`).
- **02 · The field** — **banzuke** (sumo ranking sheet): ranks 4–50 in mirrored East/West two-column rows, tier dividers ("RANK & FILE", "THE LONG TAIL"), P&L + meta per cell.
- **"You" bar** — shown whenever a wallet is connected: your rank / "Unranked", top-% or "no closed calls in the last 24 hours", net/win-rate/streak, CTA "Your ledger →".
- Empty state explains the ranking honestly ("names show up once bets settle and get cashed out").

**Data:** `useLeaderboard()` (rankings + window meta), `fetchMarkets624` for the countdown. Fully portable; the banzuke presentation is a signature visual.

## `/stats` (`app/stats/page.tsx`, 257 lines)

Judge-facing traction page ("Proof of *demand*."). Headline metric card: **"Wallets that used the app"** (giant emerald number, caption "bet, funded, or opened an account · un-fakeable" — comments document how a wallet-farm inflated the old definition and how it was fixed). Sections: 01 Growth (cumulative-wallets SVG curve, honest: 1 point = a dot, no smoothing), 02 Adoption (4 stat tiles: wallets, gas-free txs, bets placed "by N people", staked $ with truncation note), 03 Live activity (feed of onboard/tweet-trade/leverage/liquidation/deposit events, color-dotted, **every row click-through to Suiscan**). Attribution argument: Yosuku sponsored the gas, so the chain itself proves each user came through Yosuku. 30s refresh from `fetchTraction()` (`lib/sui/traction`). The "every number links to the explorer" pattern is highly port-worthy for judge credibility.

---

## `/earn` (`app/earn/page.tsx`, 318 lines)

"Earn the *spread*." — be-the-house LP page. Hero panel reads the live on-chain vault object (`useVaultStats`): **share price as the hero number** ("1.0234 / share" + green delta chip "up from 1.0000 at launch"), vault value, utilization % with meter. **`SUPPLY_CLOSED = true`**: deposits into the retired pool are refused *up front* with a banner ("A control you are not allowed to use should not look usable") while withdrawals stay open — a model of honest state handling. Supply card: amount field with Max, **quick-amount chips scaled to the wallet's actual balance** (quarter/half/¾/all — "fixed 50/100/250 chips are dead buttons for someone holding 4.90"). Your-position card: value, shares, withdraw-all. Also contains (mostly latent) leverage-reserve handlers incl. **permissionless self-settle** (`doSettle`) so users can force payout even if the keeper is down. Tx via `useSmartSubmit` + `predictClient`/`leverageClient` builders.

## `/strategies` (`app/strategies/page.tsx`, 1,405 lines)

The AI copy-trading marketplace. Dense page, several products in one:

1. **Nameplate** "AI strategies." + live counts ("N listed · M copying" with pulsing dot) + `StrategyXBar`.
2. **The Live Desk** (`LiveDesk` component, id `live-desk`) — the current copy-trading venue.
3. **The Memory Market** — "Own an agent's mind": gallery of sealed agent memory capsules; buy a **Memory Pass** (tradable on-chain asset) then decrypt the SEAL-encrypted playbook stored on Walrus (`buildBuyPassTx`, `readMemory`); creator earns per pass; honest state when the capsule blob is gone ("You own this pass, but the playbook is no longer stored… you keep the pass").
4. **Earlier agents (archive)** — collapsible grid of `StrategyCard`s from the earlier venue: deterministic identity per agent (accent color hashed from id, DiceBear notionist avatar with seeded-gradient-marble + kanji-glyph fallback), honest tiering (`tierOf`: Settled with signed P&L / Active / "N copying · history not indexed" / New), curated filter tabs that hide when empty (All/Settled/Has memory/Most copied/Safest/New), equity sparkline for ≥2 exits, spec footline (max per trade, fee, copiers).
5. **Recent copy-trades** — liveness feed, grouped by copier+strategy ("copied ×N · total"), rows click through to Suiscan.
6. **Creator studio ("Launch an agent")** — 4-step publish flow: 01 Strategy preset (momentum etc.), 02 Tune (two knobs: lookback rounds, threshold %), 03 **Hard limits** (max leverage, max per trade, sub fee — "the ceilings it is bound to on Sui, forever"), 04 Who runs it (Recommended: attested TEE agent runs the spec / Advanced: self-hosted bot wallet). Publishes via `buildListStrategyTx`, then `recordAgentSpec` registers the logic with the attested keeper.
7. **Copy drawer** (`CopyDrawer`, slide-over) — the subscribe flow: identity + tier, **"It can't touch your funds"** guarantee block with verify-on-Sui link, "How it trades" honest mechanism, caps/record stat grid, playbook vault + memory-market blocks, then size-and-confirm: shared "Copy Balance" input with +1/+5/+25/max, a **live worked example sentence** re-stating exactly what the agent can and cannot do at the chosen size, risk line, CTA that names the top-up amount. Manage state: pause copying (open positions keep running and stay yours).
8. Stranded-funds rescue banner: if the retired social vault holds a balance, a withdraw door appears at the top ("the missing door, not a new permission").

**Data/tx:** ~20 imports from `lib/sui/strategyClient`, `memoryMarketClient`, `xHandle` (resolve creator wallets → bound X handles, non-blocking), sponsor status, `useSmartSubmit`. 30s poll.
**Port notes:** the trust language (hard caps, no-withdraw custody, worked example), identity system, and drawer flow are the valuable parts; SEAL/Walrus memory would need an EVM equivalent (or just IPFS + lit-style access control) and is optional.

## `/agents` (`app/agents/page.tsx`, 258 lines)

Read-only agent leaderboard over the same strategy data: totals strip (agents / strategies / subscribers / volume copied), ranked rows (rank ghost number, kanji-glyph avatar, capital entrusted in vermilion, copy-trades, max leverage, last active; #1 gets a "Top Desk" chip and vermilion left border), and an "How agents are ranked" explainer that **deliberately excludes win-rate** ("a vanity metric") in favor of entrusted capital + executed trades, and restates no-divert custody. 30s poll of `fetchStrategies`/`fetchAgents`.

## `/parlay` (`app/parlay/page.tsx`, 92 lines)

Thin editorial shell: 01 "Build the streak" → `ParlayBuilder` (pick markets, set lines, watch the multiplier climb), 02 "Your tickets" → `ParlaySlip` (each leg ticks green as it settles; claim when the streak lands), 03 "How a parlay pays" — three cards: ① odds multiply, ② all-or-nothing, ③ **pre-funded payout** ("the full winning payout is set aside up front, so it can never come up short"). The pre-funded-payout guarantee is the product hook to replicate.

## `/surface` (`app/surface/page.tsx`, 332 lines)

Power-user page making the pricing engine visible: reads the on-chain SVI vol surface per oracle and renders 01 Surface stats (forward, ATM IV, time to expiry, live markets), 02 **Volatility smile** (custom canvas IV-vs-strike line with forward marker; raw a/b/rho/m/sigma params printed), 03 **Strike ladder** (11 rungs decimated from the smile: strike, UP price, DOWN price, IV; ATM row highlighted) — "the options chain Predict exposes, not a single bet", 04 **Term structure** (ATM IV across expiries). All math re-derives the on-chain quote client-side (`sviSmile`, `computeSviPrice`, `atmImpliedVol`); "the contract stays authoritative." Only worth porting if DreamDEX has an inspectable pricing curve; the strike-ladder presentation generalizes.

---

## `/trade-from-x` (`app/trade-from-x/page.tsx`, 385 lines)

"Trade by tweeting. *Un-drainably.*" — forced-dark page with its own slim nav. Two halves:

- **Hero: `CustodyRail`** — an animated SVG proof diagram: tweet chip → agent hexagon (`bounded key · agent_mint_for`) → "BTC · yours" position box; a **sealed withdraw door** (`withdraw() · transfer() · sweep()` struck through, lock-with-slash icon, "no such function in the contract") and an **animated attack packet** that travels the tweet wire, tries the withdraw stub, and dies at the seal. This is the single best security-storytelling asset in the app.
- **Setup spine** — 3 steps with a fill-as-you-go progress spine: 1 Connect wallet, 2 **Fund + authorize · 1 signature** (`CapabilityReceipt`: amount + presets, a CAN/CANNOT ledger — "can: open a position you own ≤ $X/trade ≤ 3×; cannot: ~~withdraw · transfer · drain~~. No such function."), 3 Link X (`CodeTicket`: one-time code, copy interaction with underline bloom, X intent link "Post it on X"). Then a payoff composer cycling example tweets (`@yosukuapp BTC up 3x`) and a trust footer with two Suiscan proof links.

**Chain-specific:** `buildEnableTweetTrading624` (single-PTB deposit+authorize), the connect Cloudflare worker (`CONNECT_URL`). The step spine, capability receipt, and custody-rail SVG are pure UX and fully portable.

## `/claim` (`app/claim/page.tsx`, 341 lines)

Where a tweet-bettor claims winnings. Split layout: left = flow, right = **`ReceiptCard`** — the reward rendered as a tangible cream betting-stub (always cream in both themes "so it reads as a physical object"): vermilion top strip, yosuku mark, SETTLED·WON/WAITING/CLAIMED chip, amount masked as `$ • •` until sign-in, fake barcode bars, "Only you can cash out." footer.
Flow (two variants):
- Default: Step 1 Sign in with X (`/api/claim/x/start` OAuth; session checked on every visit so returning users skip the gate) → Step 2 connect wallet → auto-`bind` POST (`set_owner`) with bounded polling and real failure reasons ("already linked to 0xab…cd — connect that wallet") → claim button "Claim $X to 0xab…cd" → `unsealAccountKey` (SEAL) + `recoverFundsToWallet` → success card with Suiscan receipt.
- **Attested variant** (env-gated `NEXT_PUBLIC_ATTESTED_BIND`): OAuth runs *inside a TEE enclave* which proves handle AND signs the wallet binding in-TEE (`bind-attested`), "so no operator key can bind your account to anyone."
Copy worth stealing: "We made you an account and locked it to you. Only you can open it, not even us."

## `/fund` (`app/fund/page.tsx`, 198 lines)

Card on-ramp preview: user states DUSDC wanted ("You get" input + presets), page shows derived "You pay ≈ ₦16,000" (NGN via Paystack test mode; per-request cap 50), Paystack inline popup if a pk_test key is set, otherwise a clearly-simulated payment; `/api/fund-preview` credits DUSDC **to the user's own wallet** (self-custodial even for fiat), success card with verify-on-chain link + "Place a bet →". Swap Paystack + the credit API for any EVM faucet/on-ramp; the "you get / you pay" framing is the keeper.

## `/waitlist` (`app/waitlist/page.tsx`, 277 lines)

On-chain founder waitlist: "Joining signs your place on-chain: verifiable demand, not an email." Eased count-up of wallets in line + founder spots left (first 100 = FOUNDER tier); **Founder Pass card** (gradient-bordered ticket: connect → sign once gas-free → shows `#rank` + FOUNDER/EARLY badge + referral link with copy; each signed referral climbs the line); mini leaderboard "Top of the line · by referrals"; **`.yosuku.sui` name checker** (debounced 400ms live availability via `suix_resolveNameServiceAddress` against mainnet SuiNS); three why-join cards. Data: `lib/sui/waitlist` (`fetchWaitlist`, `buildJoinTx`, `fetchWaitlistLeaderboard`), `?ref=0x…` referral param. Entire growth loop is portable (ENS subnames on EVM).

---

## Docs / marketing routes

### `/docs` (`app/docs/page.tsx`, 411 lines)
Editorial docs page, not a docs framework: sticky sidebar with grouped nav (Start here / Build / Trust), **scroll-spy** (IntersectionObserver, `rootMargin: '-120px 0px -65%'`), reading-progress hairline, corner-ticked masthead ("The close, *documented*."). Sections: Overview, How a market works (KeyVals rows), **Four ways in** (Tap / Markets / Pool / Strategies cards), The SDK (`@yosuku/deepbook-predict` with a syntax-tinted code block — tiny hand-rolled tokenizer at `app/docs/page.tsx:341` — and copy button), Agent memory, **MCP server** ("one line in any MCP client and an LLM can trade"), The attested agent, **Contracts & proof** ("Don't trust it. Click it." — package/object/tx rows linking to Suiscan), and an "Honest" cream ledger-plate disclosure (testnet only, BTC only, ~2% spread, built on Sui primitives). The honesty plate + clickable-proof table are the patterns to copy.

### `/creators` (`app/creators/page.tsx`, 350 lines)
Creator manual for X-Predict, same shell as /docs (sidebar, scroll-spy, progress). Explains: a card = a BTC call (price + settle time; "no election cards, no sports cards" because the oracle must answer it), the 4-step bet lifecycle in replies, **builder-code economics** (fee rides on top of the trade, accrues on-chain to a code only the creator's keys can claim; "your earnings do not pass through Yosuku at any point"), 1-of-2 multisig custody (zkLogin + passkey) with the plain-language reason, setup steps, craft advice ("A line nobody would fade will not trade"), honest limitations. Written entirely in the second person; excellent template for a creator program.

### `/how-it-works` (`app/how-it-works/page.tsx`, 441 lines)
Older-style explainer (mint/blue accent remnants of DART): 4 getting-started steps, payout example (100 UP @ 64¢ → 100 DUSDC), key mechanics grid, **SVI formula section** (w(k) = a + b(ρ(k−m) + √((k−m)²+σ²)) with parameter glossary), fee structure (Bernoulli fee `baseFee·p·(1−p)` + utilization fee, total capped below 1), 4-step settlement process, on-chain architecture cards, 7-item FAQ accordion, CTA. All copy portable with number swaps.

### `/demo` (`app/demo/page.tsx`, 190 lines)
The "walkthrough in place of a video" (and with the video): sticky mini-nav, embedded YouTube demo, traction line (18 wallets · 51 gas-free trades · ~1,800 SDK installs), then 5 numbered scrolly sections alternating copy/screenshot: 01 Trade from a tweet (opens with the hook "Grok lost $170k to a single tweet… ours can't be drained"), 02 One tap, 03 Feed "like short-form video", 04 Real depth (leverage / private trades / copy-trade cards), 05 **"Every claim is a transaction"** — a grid of labeled Suiscan tx links. Framer-motion `whileInView` rises. The claim→tx-link discipline is the key judge-facing pattern.

### `/pitch` (`app/pitch/page.tsx`, 696 lines)
A **full pitch deck as a route**: 14 slides, keyboard nav (← → space), dot navigation, AnimatePresence transitions, cream "paper" palette (ink on `#F1EADC`, ticket-stub perforation underline `Emph` with a spring-in vermilion dot). Slides: Cover ("The whole timeline is *Vegas*." + At-a-glance ledger) → The Engine (DeepBook did the hard part) → The Gap ("A great market no one can *reach*") → Our Edge ("The winner wins on *experience*") → Distribution·X ("X is Vegas. So we bet *there*." with a mock X-post bet card) → Proof ("It opened your bet. It took *zero*.") → Onboarding (fund with a card, bet from a tweet) → Mobile (dark phone mock, both bet & won states, drawn in JSX) → AI agents ("Agents can bet. They can't *drain*." + MCP spec panel) → Real usage (count-up StatCards sourced to traction.ts) → Revenue model → Why Sui → Team → Roadmap (NOW/NEXT/THEN PhaseCards) → The Ask ("Only you can *cash out*."). Self-contained, no data deps — trivially reskinnable for a Somnia pitch.

### `/download` (`app/download/page.tsx`, 122 lines)
TestFlight page. Notable: the phone is a **real full-resolution device screenshot** (1170×2532) inside a CSS phone frame with side-button nubs and a CSS dynamic-island overlay; long comments explain why a drawing was rejected ("a drawing is always a flattering guess") and document the exact `xcrun simctl status_bar` command to reshoot. Copy: "Call it in *ten seconds*."

### `/studio` (`app/studio/page.tsx`, 292 lines)
Founder's Line Studio (passphrase-gated via `x-studio-pass` header to `/api/studio/*`; sessionStorage-cached). Pick market (cadence chips) + strike (ladder with "~50%" coinflip marker + custom input) → debounced 350ms server-rendered **card PNG preview + caption** → three post paths: "Post from bot" (server posts), **"Post from my X"** (PNG copied to clipboard via ClipboardItem with download fallback, opens X intent with caption prefilled — deliberately no token custody, comment explains why), "Copy text". "Live now" list shows watched lines with bettor counts. The relay auto-registers posted cards within ~15s.

### `/social` (`app/social/page.tsx` + `SocialBoard.tsx`, 301 lines)
Internal, noindexed content board rendering `content.json`: tweet threads grouped by topic (X-Predict / Launch / How it works / Product / Manifesto / Drip), each unit a card with an over-280-chars warning and a **per-tweet copy button**, plus essays and share-card assets. Theme-tokenized. A neat "marketing ops inside the app" idea.

### `/status` (`app/status/page.tsx`, 137 lines)
Indexer health: overall banner (healthy if max lag < 120s), per-pipeline rows with green/amber/rose lag dots, checkpoint numbers, backfill chips; 30s auto-refresh via `fetchStatus`.

### Redirects & infra
- `/bell`, `/pool`, `/beta`, `/markets-live`, `/markets/[id]` — all `redirect()` with comments explaining *why the route is kept* (old links, bookmarks, word-market deep links). A discipline worth copying: retire surfaces, never 404 them.
- `/native-auth` — Google OAuth implicit-flow bridge: Google requires https redirect URIs, so mobile zkLogin redirects here and the page forwards the `#id_token` fragment to `thebell://auth`, keeping the zkLogin `aud` (and therefore the address) identical between web and mobile. Pattern reusable for any mobile OAuth bridge.
- `app/markets/[id]/opengraph-image.tsx` — edge-runtime dynamic OG image (1200×630): cream card matching the brand, live oracle fetch (60s revalidate) computing nearest strike + a rough logistic probability for the preview, mark as inline base64 SVG. Dynamic OG per market is a strong share-loop pattern.

### `/dev/*` — design-review harnesses
`betplaced` (bet-placed card, `?state=down|up|range|lev`, `?png=1` renders the actual share-card PNG), `receipt` (trade receipt: win/loss/cashout/liquidation/claimed-only), `room` (chat gate states: locked/joinable/joined/connect), `takes` (feed take cards), `playbook` (SEAL vault states), `private` (private-claims incl. a genuinely-computed enclave signature verification and a corrupted-sig failure fixture), `proof` (ProofRecord band). All `return null` in production, deterministic fixtures, screenshot-ready. **Adopt this practice**: every share-card/receipt/modal gets a `/dev` page with all its states.

---

## Product features inventory (deduplicated)

| # | Feature | Where it lives |
|---|---|---|
| 1 | Rolling-cadence binary rounds (1m/5m/1h), always-open lanes with "between rounds" placeholders | `/markets` |
| 2 | Hero chart = the ticket target: tap any card → loads into hero with side preselected; deep links `?m=&dir=` | `/markets` |
| 3 | Real display odds via unsigned dry-run quotes, cents-per-$1, staggered cache sweep | `/markets` (`useHouseOdds624`) |
| 4 | Ticket auto-rolls to next round when the selected one enters its submission buffer | `/markets` |
| 5 | Word markets ("Just ask") — same markets as plain yes/no questions | `/markets` → `WordMarketBoard` |
| 6 | **TikTok-style vertical reel** of live rounds woven with community takes; right-rail Take composer; swipe hint | `/reels` |
| 7 | Community "takes" (opinion posts optionally backed by a real position; "take the other side") | `/reels`, `TakeCard`, `TakeComposer624` |
| 8 | The Room — bettors-only encrypted chat per market (gated on having bet; forgiving about rolled rounds) | `/markets` → `MarketRoom`, `/dev/room` |
| 9 | Sensei — AI assistant dock with countdown ring, chat drawer, inline trade cards | `/markets` → `SenseiDock`, globals.css |
| 10 | One-number portfolio (BalancePlate + pool rows; nothing unspendable ever merged into the headline figure) | `/portfolio` |
| 11 | Trader Edge — client-computed personal analytics (equity curve, expectancy, time-of-day edge, payoff shape) | `/portfolio/edge` |
| 12 | Leaderboard as podium + sumo banzuke + persistent "You" bar | `/leaderboard` |
| 13 | Be-the-house LP vault with share price hero, utilization meter, wallet-scaled quick amounts, honest "supply paused" gating | `/earn` |
| 14 | Parlay builder with pre-funded payout guarantee and leg-by-leg settling slip | `/parlay` |
| 15 | Copy-trading marketplace: hard on-chain caps, no-withdraw custody, worked-example sizing drawer, pause-anytime | `/strategies` |
| 16 | Launch-an-agent creator studio (preset + two knobs + hard caps + attested-TEE or self-host) | `/strategies` |
| 17 | Memory Market — agent playbooks as sealed, tradable access passes | `/strategies` |
| 18 | Agent leaderboard ranked by entrusted capital (win-rate deliberately excluded) | `/agents` |
| 19 | SVI surface explorer: smile, strike ladder, term structure | `/surface` |
| 20 | Trade-from-X: tweet bets at a bot; un-drainable bounded agent; CAN/CANNOT capability receipt; animated custody-rail SVG proof | `/trade-from-x` |
| 21 | Claim flow for tweet-bettors: X sign-in → wallet bind → claim; cream receipt-ticket visual; TEE-attested bind variant | `/claim` |
| 22 | Card on-ramp to self-custody ("you get / you pay" framing) | `/fund` |
| 23 | On-chain waitlist with referral rank-climbing, Founder tier (first 100), name-service handle reservation | `/waitlist` |
| 24 | Live traction dashboard where every number links to the explorer; "un-fakeable" metric definitions | `/stats` |
| 25 | Editorial docs with scroll-spy, honesty plate, clickable contract proofs, SDK/MCP story | `/docs`, `/creators` |
| 26 | Pitch deck and demo walkthrough as in-app routes with tx-proof links | `/pitch`, `/demo` |
| 27 | Creator card studio + founder line studio (server-rendered share PNGs, clipboard-image posting, relay auto-registration) | `/creator/studio`, `/studio` |
| 28 | Creator fee custody: builder codes, 1-of-2 zkLogin+passkey multisig, passkey-only recovery | `/creators`, `/creator/recover` |
| 29 | Sponsored gas everywhere (`useSmartSubmit`), "gas-free" as a first-class marketing claim | all tx flows |
| 30 | Dynamic per-market OG images with live probability | `opengraph-image.tsx` |
| 31 | Theme system: token-based light "beta" with dark islands; first-frame theme script | `globals.css`, `layout.tsx` |
| 32 | Micro-craft: strike pinning, leading-edge-only chart spring, visibility-gated polling (`pollWhileVisible`), rAF only for on-screen cards, IO fallbacks, graceful route retirement, on-brand error boundary, `/dev` state harnesses | throughout |
| 33 | Legacy landing kit: GSAP horizontal scroll, canvas particle wave, 3D point sphere, R3F crystal orb, magnetic buttons, tilt cards, letter reveals | `components/landing/**` |

## Port-worthiness ranking (for a Somnia / DreamDEX Event Contracts app)

Ranked by (product differentiation × demo impact) ÷ porting cost. "Chain work" = what must be rebuilt against DreamDEX/EVM.

1. **`/markets` core loop (features 1–4)** — the product. The rail-of-cadences + hero-chart-as-ticket + honest live odds is the whole trading UX, and ~80% of it (layout, canvas charts, countdowns, pinning/rolling logic, deep links) is chain-agnostic. Chain work: market list, spot/history feed, a quoter, and the bet tx via viem/wagmi. Do this first.
2. **The reel (`/reels`, features 6–7)** — the most memorable, most demo-able surface and almost pure front-end (scroll-snap + canvas). Judges remember "TikTok for event markets". Chain work: same data fetchers as #1; takes can start as a plain backend table instead of Walrus.
3. **Judge-proof surfaces (`/stats`, `/demo`, tx-link discipline — features 24, 26)** — cheap to build, disproportionate credibility. Every claim links to the Somnia explorer; define metrics "un-fakeably" (Somnia's speed/gas story slots straight into the sponsored-actions framing).
4. **Landing page (`/`)** — the dial-driven hero, sticky features, manifesto and FAQ are a complete, reusable pitch surface; only the data fetchers and spec-table values change. Reuse the scroll systems as-is.
5. **Portfolio one-number plate + Trader Edge (features 10–11)** — strong retention UX; Edge is fully client-side and portable if event settlement history is queryable. The BalancePlate information architecture prevents the classic "three competing balances" failure.
6. **Leaderboard podium/banzuke + waitlist referral loop (features 12, 23)** — high visual signature and a growth loop; both straightforward on EVM (events for rankings, a tiny contract or even attestations for the waitlist; ENS subnames replace `.yosuku.sui`).
7. **Parlay with pre-funded payout (feature 14)** — a real product hook that maps naturally onto event contracts (multi-event conditional escrow); moderate contract work, big odds-multiplier appeal.
8. **The Room + Sensei (features 8–9)** — social stickiness and an AI hook; Room needs a small gated chat backend (bet-verification via chain read), Sensei needs an LLM endpoint + the existing dock CSS. Medium cost, good demo moments.
9. **Trade-from-X + claim flow (features 20–21)** — the most differentiated distribution story ("bet from a reply; the agent can't drain you") but the highest infra cost (bot, relay, bounded-agent contract, OAuth). The **capability-receipt UX and custody-rail SVG are worth porting even if the tweet rail itself is cut** — use them to explain any session-key/agent permission on Somnia. TEE attestation: skip for a hackathon.
10. **Earn/LP vault (feature 13)** — port only if DreamDEX exposes an LP side; the page itself is simple.
11. **Copy-trading desk + agents (features 15–18)** — a whole second product; port the *trust language* (hard caps, worked example, pause-anytime) if you build any automated-trading angle, but don't start here. Memory Market is a novelty — cut unless agents are the thesis.
12. **Surface explorer (feature 19)** — only meaningful if the new venue has an inspectable pricing curve; otherwise cut.
13. **Studio/creator tooling, social board, `/status` (features 25, 27–28)** — operational nice-to-haves; the `/dev` harness practice (feature 32) costs nothing and should be adopted from day one.
14. **Legacy landing kit (feature 33)** — a parts bin: magnetic buttons, tilt cards, and the R3F orb can dress up a Somnia landing quickly, but don't ship the DART pages as-is.

**Cross-cutting must-keeps regardless of feature set:** the honest-state discipline (disabled things look disabled, empty states explain themselves, retired routes redirect), the strike/question-pinning rule ("the price of a question is allowed to move; the question is not"), vermilion-only accent with direction colors reserved for P&L, sponsored-gas framing ("gasless" is a Somnia-friendly claim), and every trust claim backed by an explorer link.
