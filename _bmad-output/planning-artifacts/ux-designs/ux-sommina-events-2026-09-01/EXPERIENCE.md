---
name: Masayume
status: superseded
created: 2026-09-01
updated: 2026-09-01
superseded_by: docs/architecture/yosuku-source-led-migration/README.md
sources:
  - _bmad-output/planning-artifacts/prds/prd-sommina-events-2026-08-31/prd.md
  - _bmad-output/planning-artifacts/prds/prd-sommina-events-2026-08-31/addendum.md
  - _bmad-output/planning-artifacts/ux-designs/ux-sommina-events-2026-09-01/DESIGN.md
---

# Masayume — Experience Spine

> **SUPERSEDED EXPERIENCE DIRECTION.** The “patterns, not pixels,” dark-only, route-cut, Telegram-first, and Yosuku-brand rejection decisions below no longer govern implementation. Preserve current Yosuku end to end under `docs/architecture/yosuku-source-led-migration/`.

> Peer contract to `DESIGN.md` (visual identity). This spine defines behavior: surfaces, states, flows, and the honest-state law as a discipline. PRD Glossary terms are used verbatim and capitalized as defined. On conflict, the PRD wins; both spines win over any reference-product pattern.

## Foundation

- **Form factor:** mobile-first responsive web, PWA-installable. The Reels surface is designed for phones; every other surface must be excellent on a phone and *enriched* — never rearranged into a different product — on desktop.
- **Second surface:** the Telegram bot (Executor rail). Chat is a betting rail with its own conventions (see Responsive & Platform), not a port of the web UI.
- **Stack context:** Next.js App Router + Tailwind already exist in `web/`; wagmi v2 + RainbowKit for wallet. **Component library selection is deferred to architecture** — this spine specifies behavior and `DESIGN.md` tokens, not a kit. [ASSUMPTION: no kit is assumed; if one is adopted it must be skinned to `DESIGN.md`, not the reverse.]
- **Theme:** dark-only v1 (PRD §7) — a conscious cut. The cream Receipt is the single inverted island.
- **Performance envelope the UX depends on (NFR-5):** quote round-trip p95 ≤ 1.5s so a 60s Window is comfortably tradeable; live surfaces prefer push (Somnia reactivity/streams) with visibility-gated polling as the floor. The state patterns below assume data can be *late* — they never assume it can be *wrong*.
- `DESIGN.md` is the visual identity reference; every `{path.to.token}` below resolves there.

## Information Architecture

From PRD §6, exactly:

| Ring | Surface | Purpose |
|---|---|---|
| Core | `/markets` | Trade: Cadence lanes, hero Market chart-as-Ticket, plain-words view |
| Core | `/reels` | The feed: vertical snap Reels of live Markets + Takes, inline betting |
| Core | `/portfolio` | Money: one spendable number, labeled pools, open positions, honest history |
| Core | `/portfolio/edge` | Edge analytics: ROI, expectancy, equity curve, the one-sentence readout |
| Core | `/parlays` | Parlay builder + live slips |
| Core | `/vaults` | Strategies: house Strategy cards, Vault deposit/withdraw, Caps, subscriptions |
| Core | `/leaderboard` | The Banzuke |
| Trust & marketing | `/` | Landing: manifesto, live ticking Market, custody-rail proof diagram, stack table |
| Trust & marketing | `/stats` | Un-fakeable stats, every number paired with its on-chain query |
| Trust & marketing | `/waitlist` | On-chain waitlist, referral climb, Founder badges |
| Trust & marketing | `/demo` | In-app scrolly walkthrough: tx-proof grid + embedded video |
| Trust & marketing | `/pitch` | The submission deck as a keyboard-navigable route |
| Ops/judge | `/dev/*` | Fixture pages: every card/receipt/modal state from canned data |
| Off-web | Telegram bot | Executor rail: link → capability receipt → bet by message → Verdict postbacks |

**Chrome (persistent):** price ticker (top); floating pill bottom-nav (mobile); Baku as a floating dock on trade surfaces (`/markets`, `/reels`, `/parlays`); the Claim-all plate surfaces globally whenever the claimable sum is nonzero.

**Routing law:** retired or moved routes redirect; nothing 404s (honest-state law). A deep link into a dead Window resolves to its successor with a one-line note, never an error page.

**Deep-link grammar** [ASSUMPTION: param names beyond the PRD's `?m=&dir=`]:
- `/markets?m=<marketId>&dir=up|down` — hero + Side preselect (PRD-specified; the canonical bet link).
- `/reels?m=<marketId>` — feed opened at that Market's card.
- `/waitlist?ref=<address>` — referral attribution.
- Share URLs and OG images resolve per Market/Take with live probability at render time; a settled target renders its Verdict state, not a dead live-card.

## Voice and Tone

Calm, precise, honest. No hype, no "moon", no exclamation marks. Blocked actions state the blocker as the label. Numbers do the persuading. [ASSUMPTION: all concrete strings below are UX-authored and veto-able; the vocabulary rules are PRD contract.]

| Do | Don't |
|---|---|
| "Between rounds — next 5m Window opens in 0:42." | "No markets available" |
| "Too close to certain — this book is quoting 98¢." | "Invalid price" |
| "Switch to Somnia Shannon" (as the disabled CTA's label) | An enabled-looking button that errors on tap |
| "Daily Stop hit. Betting reopens at midnight." | "Limit exceeded" |
| "Quote is 14s old — requoting." | Silently filling at a moved price |
| "Minimum stake 1 tUSDC — below this the venue rounds your order to nothing." | "Amount too low" |
| "You're out of STT gas. Get some here first — no signing until you're fueled." | A raw viem parameter error |
| "No exit right now — no bids at this size. Your position still settles at expiry." | A fabricated exit quote |
| "IF IT LANDS · +12.40 tUSDC · settles 14:35 UTC" (open-position share) | "WON +12.40" on an unsettled position, or a relative countdown in a screenshot |
| "Don't trust it. Click it." (standing caption on every proof link) | "Verified ✓" with nothing to click |
| "This Leg's book is one-sided — we won't invent a mid to price it." | Quietly pricing a Parlay Leg from a fabricated mid |
| "Combined odds too long — below the floor, this stops being a bet and starts being a lottery ticket." | "Error: minCombinedProbBps" |
| "Runner idle — scanned 6 Markets, closest trigger 0.8¢ away." | "Watching the market…" (unfalsifiable liveness theater) |
| "Partial scan — this number is missing rounds and says so." | Presenting a partial scan as fact |

**Named strings (contract-level):**
- **Verdict:** win — 正夢 *masayume — it came true.* loss — 逆夢 *sakayume — a dream that didn't.* Void — 無効 *"no reliable print — both sides pay 0.5."*
- **Error boundary:** headline *"The screen blinked. The chain didn't."* body *"Your funds and positions are safe on-chain. This is only the screen."* + Try again + a way back to `/markets`. [ASSUMPTION: headline wording]
- **Baku's register:** a protective spirit, not a shill — "the agent that eats your bad bets." The Brake's talk-down keeps the PRD's cadence: *"You're chasing. Model says no edge here. Sit this window out."* Blind state: *"Model is blind right now — the price feed is stale. No Read until it wakes."* Baku never says "guaranteed," never outputs a number absent from its snapshot, and *sit out* is delivered as a first-class answer, not an apology.
- **Backed Take terminal state:** *"call stood, money never matched"* (PRD verbatim).
- **Claim Receipt footer:** *"Only you can cash out."*
- **Capability receipt kill-line:** *"No such function."*
- **Composer permanence note:** *"Takes are public and effectively permanent."*

## Component Patterns

Behavioral contracts. Visual anatomy lives in `DESIGN.md` Components; tokens referenced by `{path}`.

| Component | Surfaces | Behavioral contract |
|---|---|---|
| Ticket | `/markets`, Reels inline, Read act-on-it card | Stake-first: user enters Stake, system derives contracts. Stake starts empty on the hero/markets Ticket; context-carrying entries (Reels inline tap, take-the-other-side, Baku act-on-Read) arrive pre-filled with a suggested Stake the user can overwrite (same rule in DESIGN.md Ticket). Quotes from the real book for the actual size, debounced ~350ms, requoted ~12s, visibly stale otherwise. Blocked states render the blocker as the CTA label ({components.ticket}). Auto-advances to the next Window (keeping Side + Stake) when the no-entry buffer hits. IOC + re-quote at click; a fill above the displayed cap is impossible; a re-quote above cap shows the new cost before placing. Quick chips scale to live balance — never fixed denominations. Min-stake floor stated on the Ticket. |
| Hero Market | `/markets` | Chart + Ticket are one surface. Opening line frozen once printed; pending opening print is an explicit state (dashed line, "waiting for opening print") — line and distance readout never guess. Names its price source. Tapping any Market card or UP/DOWN chip loads it into the hero with Side preselected; `?m=&dir=` reproduces the state. Countdown urgency at min(60s, intervalSec × 0.4) remaining ({components.countdown}); the urgency glow belongs to the hero/active card only. |
| Cadence lanes | `/markets` | Lanes derive from live `intervalSec` values, never hardcoded. Empty lane = "Between rounds" placeholder with next start (copy scales seconds → a day). User's Cadence choice pinned; never auto-reverted. Every row shows live volume + trade count. Fixed-strike Markets excluded with a counted disclosure. |
| Plain-words view | `/markets` | Each live Market restated as a yes/no question derived from `asset` + `intervalSec` + opening price (never parsed from question text); Yes/No taps deep-link into the Ticket. |
| Reel card | `/reels` | Snap one-per-viewport. Market settling on screen updates the card in place to its Verdict state. Off-screen cards: no animation, no polling. UP/DOWN opens the inline Ticket (all Ticket guards apply). Take cards: "take the other side" pre-fills the opposing Side of the same Window. |
| Take composer | `/reels`, Market detail | Side + confidence + Window + caption ≤240 chars; permanence note visible. Backing places a post-only order at stated probability; a would-cross rejection is absorbed and re-offered (crossing price or adjusted level), never surfaced as an error. Resting escrow visible to owner + one-tap cancel. |
| Backed badge | Take cards | Two provable states — {components.badge-backed-resting} and {components.badge-backed-filled} — each with an on-chain verify link. Unbacked = no badge. Expired-unfilled shows the honest terminal state. |
| Balance plate | `/portfolio`, header pill | Headline = wallet spendable only. Pool rows labeled: Vault · order escrow · venue payout credit (UI rename of the PRD's "venue per-pool vault balance", deliberate — keeps "Vault" unambiguous; shown when nonzero, noted "the venue spends this first on your next buy"). Failed reads keep last-known-good + staleness tick; null ≠ 0. |
| Claim-all plate | Global | Aggregates finalized Markets incl. Voids (both sides listed explicitly); one-tap Claim all; sum shown = on-chain claimable net of the on-chain settlement fee (read from chain, currently 0). Persistent badge until claimed. Gasless path: sign → relayer pays gas → payout lands in the user's wallet. |
| Receipt | Verdict cards, history rows, `/stats` | Fill tx(s) + settlement tx + Oracle Graph deep link; "audit this settlement" affordance on every Verdict and history row. Degrades to raw tx links if the oracle explorer is down — labeled as degraded. Cream always ({components.receipt}). |
| Verdict stamp | Verdict card, Reel in place, TG postback, share cards | Stamp + romaji subline + P&L figure + Receipt + one-tap share. Screen-reader announced (see Accessibility Floor). |
| Baku dock | Trade surfaces | Floating dock; expands to a chat sheet. A Read = Side or *sit out* + one honest reason + the risk that proves it wrong, 2–4 sentences, grounded in the live snapshot. A Read naming a Side renders an inline act-on-it card → pre-filled Ticket. Brake talk-downs replace Reads when tilt patterns fire. Memory failures degrade to memory-less Reads silently. |
| Parlay builder | `/parlays` | 2+ Legs; combined probability with correlation surcharge shown, priced from live book mids read on-chain at open; stake ↔ max payout solver. Refusals at quote time with the reason named: below the combined floor, one-sided/empty Leg book, Reserve cap breach. Slip: *"your payout is already locked in the contract."* Legs tick as each Market settles; first losing Leg kills the slip instantly and names the Leg that killed it. |
| Strategy card | `/vaults` | Decision envelope + record from real fills (txs linked). Runner health re-derived at render (`now − lastTick`), never self-reported — dead reads as dead immediately. Live why/why-not feed incl. idle heartbeats. Subscribe = deposit + subscribe in one action; Caps editor with the worked-example sentence; pause is instant, positions remain the user's. |
| Capability receipt | Session key enable, `/vaults` subscribe, TG link | CAN list (scope, Caps, expiry) + struck-through CANNOT verbs + "No such function." Shown at every delegated-power grant, requires one explicit signature, revocable in one tap. |
| Banzuke row | `/leaderboard` | FIFO realized PnL; losses synthesized (winners-only board is a defect); unmatched redemptions counted + disclosed; partial scans labeled partial; house wallets excluded or {components.badge-house}-labeled; "You" row pinned. |
| Achievement badges | `/leaderboard`, profiles | Every badge criterion is computable from public on-chain data — no badge is grantable by admin fiat (FR-27). Win-rate badges require a minimum settled-round sample and always show it ("70% · 14 settled"); win rate alone never ranks anyone or anything (vanity-metric rule). Tapping a badge shows its criterion and the data that earned it. |
| Countdown | Everywhere | Tabular mono; urgent (gold) at min(60s, intervalSec × 0.4) remaining — a 60s Window is not born urgent; glow on the hero/active card only; "Settling…" at zero; absolute UTC timestamps anywhere a screenshot can outlive the clock. |
| Ticker | Chrome | Live prices + next/last Settlement prints; visibility-gated polling; carries real signal or doesn't move. |
| Share card | Verdict, Take, Parlay outcomes; OG images | Server-rendered image, stamp vocabulary, Receipt link. Open positions: conditional "IF IT LANDS" framing + absolute UTC settle time only. Market/Take URLs unfurl with live probability at render time. |
| Faucet | Onboarding, empty-balance states | One tap mints tUSDC via a client-signed call to the venue's own token contract (≤10,000/call — the venue's cap is the limit; ungated by us, zero-env-safe); balance updates without reload. Refusals render blocked-with-reason ("you hold enough tUSDC already" / "faucet capped — try later"). Zero-STT detected *before* signing → routed to STT faucets with fallbacks listed. Allowance approval absorbed into the first-bet flow with one honest sentence — never a surprise second popup. |
| Close-early control | Open position rows | Quotes real proceeds for the actual size (Ticket discipline), IOC with a minimum-proceeds cap; resulting history row labeled "closed early at live price". Empty bid depth → the "no exit right now" honest state; the position still settles at expiry. |
| Edge readout | `/portfolio/edge` | One generated sentence about the user's trading, grounded only in computed metrics; refuses pattern claims before 5 settled rounds; profit factor renders null (an em-dash, not 0) before the first loss. Time-of-day buckets, payoff shape, streaks. CSV export includes every visible column + tx hashes; re-importing sums to the displayed totals. |
| Baku memory | Baku sheet | A returning user's Read may reference prior sessions (positions, patterns, past Brake interventions) — every referenced fact must exist in the memory store; memory failures degrade silently to a memory-less Read, never block. Per-user budget exhaustion degrades to model-only numbers, stated honestly ("numbers only today — the explainer is resting"). |
| Waitlist card | `/waitlist`, landing | Join = one gas-sponsored signature; joined state shows on-chain `#rank`, Founder badge (first 100), and a copyable referral link; referral climbs are on-chain-derivable and reflected in a mini leaderboard. Empty/unconnected states explain what signing proves ("verifiable demand, not an email"). |
| Landing sections | `/` | Every section renders without observers or animation (static-first; motion enhances). Hero shows a real ticking Market — no fake numbers anywhere on the page. The stack table ("composed, not bolted on") and every proof claim link real txs. Custody-rail diagram is the flagship visual (Trust Moment 1). |
| `/demo` + `/pitch` | Judge ring | `/demo`: scrolly walkthrough with the tx-proof grid + embedded video — the whole demo story absorbable without pressing play. `/pitch`: the deck as a route — keyboard nav (← → space), dot navigation, self-contained (no live-data dependency), so it can never break during judging. |
| Toasts | Global | Bottom-anchored above the pill nav, one at a time (single queue — matches DESIGN.md), click to dismiss; success toasts are neutral ink (green is reserved); every toast's message also renders inline at the source of the event — a toast is an echo, never the only record. |
| Wrong-network banner | Global | Appears the moment the connected chain ≠ Somnia Shannon; names the fix and carries the one-tap switch; every write control beneath it renders blocked-with-reason until the chain matches. |
| Daily Stop settings | Settings | Limit editor with the shipped default; friction-gated opt-out (explicit confirmation); timezone auto-captured at first signed-in session, editable here; the Ticket shows stop headroom when a stop is set. |
| Session-key manager | Settings, Ticket header chip | Shows the active grant's scope, Caps, spend so far, and expiry; revoke is one tap; the Ticket carries a quiet "tap-trading on" chip while active so popup-free betting is never invisible power. |
| Stats metric row | `/stats` | Each metric = value + the on-chain query that produced it (tap to expand) + provenance label (external wallets only / house excluded). The calibration chart states its sample size. Live-activity rows each click through to their tx. |

## State Patterns

**The honest-state law as a state machine.** Every data-bearing surface is in exactly one of six states, and each state has a mandated treatment:

| State | Treatment |
|---|---|
| Loading | Skeleton in place, no invented numbers, no layout shift on resolve. Skeletons only where nothing was ever known. |
| Live | Real data, timestamped where staleness matters. |
| Stale-last-good | The previous value at full ink + a {colors.warning} staleness tick ("as of 12:04 — retrying"). **null ≠ 0**: a failed read never renders as zero money. |
| Empty-with-explanation | Says why it's empty and names the next action ("No positions yet. Your first Window is one tap away."). |
| Blocked-with-reason | The control looks disabled ({colors.ink-disabled}) and its label *is* the blocker. Never a tappable-looking dead control. |
| Error | Honest diagnosis in human words ("you're out of STT", not a stack trace), last-good data retained, `<details>` technical escape hatch. |

**Named product states (FR-bound):**

- **Pending opening print** (FR-7): dashed line, explicit label, distance readout suppressed — never a guessed level.
- **Between rounds** (FR-6): lane placeholder with next Window's start; the Reel card version pre-arms the next Window so a tap is never dead (UJ-2).
- **Settled-unclaimed** (FR-16): shows as *claimable*, not open — moves out of live PnL and into the Claim-all plate.
- **Backed-resting / backed-filled** (FR-14): distinct provable badge states; resting escrow visible + cancelable; expired-unfilled → "call stood, money never matched."
- **Daily-Stop-hit** (FR-24): every betting surface — web Ticket, Reels inline, Telegram Executor — refuses with "Daily Stop hit. Betting reopens at midnight." The disabled control looks disabled and says why. Server-side authoritative; the Ticket shows remaining headroom *before* the stop hits (UJ-4: "two losses away — the ticket shows it").
- **Wrong chain** (FR-1): blocking honest state naming the fix; every write path disabled until the chain matches.
- **Void** (FR-10/FR-11): its own stamp + explanation; Claim-all plate lists both sides explicitly.
- **No exit** (FR-40): "no exit right now" honest state on empty bid depth; position still settles at expiry.
- **Partial data** (FR-22/FR-26): a metric from an incomplete scan is labeled partial — never presented as fact.
- **Runner dead/idle** (FR-32): dead = re-derived stale tick, reads as dead now; idle = heartbeat feed visibly *deciding* to sit out.
- **Session key expired/revoked** (FR-4): the next tap falls back to a normal wallet prompt with a one-line note ("tap-trading expired — re-enable or sign each bet"); never a silent failure, never a silent re-grant.
- **Connect ladder** (FR-1): disconnected → connecting → connected-wrong-chain → connected-ready. Each rung is a distinct rendered state; read surfaces work fully while disconnected (browsing, `/stats`, Reels scrolling) — only writes demand a wallet, and they say so at the control.
- **First run**: the Reels swipe hint (until a real scroll) and a one-time Ticket walk-line ("your stake is your max loss — always") are the only onboarding overlays; both dismiss forever once acted on, neither ever blocks a tap. [ASSUMPTION: no multi-step tutorial modal — the surfaces teach themselves.]

**The write-path state machine** (NFR-2 made visible). Every money-moving action renders its lifecycle honestly:

| Phase | Treatment |
|---|---|
| Composing | Quote shown, guards evaluated, blocker-as-label if any guard fails. |
| Submitted | The control locks with "Placing…" — one submission per gesture; double-taps are absorbed, not double-sent. |
| Confirming | Pending indicator with the tx hash linked as soon as it exists; the user can navigate away — the outcome lands as a toast + inline state wherever the position lives. |
| Confirmed | State comes from the actual receipt and fill — the booked position reflects the real fill, never the requested size. |
| Reverted | Never shown as success. Human-mapped reason ("the Window closed under you — your stake was never taken"), `<details>` technical escape hatch, and the next action offered (the successor Window, pre-armed). |
| Unknown (timeout with a digest) | Treated as submitted, said honestly: "Submitted — waiting for the chain to answer. Your order is either in or it never left; we'll show you which." Resolution by receipt, never by guess. |

## Interaction Primitives

- **Tap-to-bet:** the tap IS the Side choice — every UP/DOWN tap lands in a pre-filled Ticket, never a bare navigation.
- **Snap scroll:** one Reel per viewport; first-use swipe hint persists until a real scroll (>60px); Verdicts land in place.
- **Countdown urgency:** gold at min(60s, intervalSec × 0.4) remaining ({components.countdown}); glow hero/active card only; ring drains linearly; "Settling…" at zero.
- **Deep links:** `?m=<marketId>&dir=up|down` reproduces hero + Side state everywhere a Market is referenced (cards, plain-words view, share URLs, Baku act-on-it, TG postbacks).
- **Session-key betting:** after an explicit grant (capability receipt + one signature), in-cap bets place with zero wallet prompts; any cap breach falls back to a normal wallet prompt; revocable in one tap; expires on its own.
- **Cadence pinning:** the user's chosen Cadence never auto-reverts; dead lanes dim to "Between rounds," never vanish.
- **Ticket auto-advance:** entering the no-entry buffer rolls the Ticket to the next Window, keeping Side + Stake, with a one-line notice.
- **Claim-all:** one tap sweeps everything claimable, voids and Vault credits included (labeled distinctly); gasless once the relayer ships — until then an honest per-item progress list ("claiming 2 of 4"), one signature per redemption, never one collapsed verdict.
- **Quote lifecycle:** debounce ~350ms on input; requote ~12s; stale is visible; click = fresh IOC re-quote with a cadence-scaled cost cap.
- **Reduced motion:** every keyframe system (stamp press, snap-feed animation, count-ups, draining rings) has a reduced-motion path: state changes render instantly, rings become static fractions, charts draw once. Liveness survives as data, not motion.
- **Visibility gating:** off-screen and hidden-tab surfaces poll nothing and animate nothing; return-to-visible refreshes before re-rendering stale numbers.
- **Resting money is never invisible:** while a backed order rests, its locked escrow shows to its owner with a one-tap cancel; cancels work from the app's own placement record first, then sweep the venue.
- **Popup-safe sharing:** the share decision (native sheet vs. intent tab) is made synchronously inside the tap gesture; the card image renders async after — a share never dies to a popup blocker.
- **Baku invocation:** the dock opens by tap or deep link (`?baku=1`); it never opens itself, never interrupts a bet in progress — the Brake intervenes in Baku's own sheet and on the Ticket's stop-headroom line, not as a modal ambush.
- **Hover (desktop only):** prefetch + detail enrichment; nothing functional hides behind hover.

## Accessibility Floor

Behavioral floor; contrast values live in `DESIGN.md`. NFR-9 makes this a hard requirement.

- **Honest-disabled semantics:** blocked controls are real disabled controls (`disabled`/`aria-disabled`) whose accessible name includes the blocker text — a screen-reader user hears *why*, same as a sighted user reads it.
- **Focus:** visible 2px {colors.gold} focus ring on every interactive element; focus traversal follows reading order; sheets and modals trap focus, Esc closes, focus returns to the opener.
- **Touch targets:** ≥ 44px everywhere, including Reel foot chips and quick-amount chips.
- **Screen-reader announcements:** Verdicts announce once via live region ("Masayume — it came true. Won 12.40 tUSDC."); countdowns do NOT announce every tick — they announce at 60s and at Settlement; stale-data ticks announce once per transition.
- **Reduced motion:** honored everywhere (see Interaction Primitives); the Verdict still lands as an instant state change with full information.
- **Language:** kanji stamps carry `lang="ja"` markup plus the romaji + translation subline — no meaning is carried by kanji alone.
- **Charts:** every chart carries an aria-label narrating its current truth ("BTC 64,182, 42 above the UP line, 38 seconds left"); the data is never only visual.
- **Color independence:** Side is never color-alone — UP/DOWN always carry their word; P&L always carries its sign; badge states always carry their text ("BACKED · RESTING"). The color law in `DESIGN.md` assumes a color-blind user loses nothing.
- **Claim-all plate announcement:** when the plate first surfaces with a nonzero sum, it announces once ("12.40 tUSDC claimable"); the persistent badge is polite, not nagging.
- **Forms:** every input labeled; the Stake input announces its floor and its derived cost on change (debounced to the quote cadence, not per keystroke).

## Key Flows

Screen-level restatements of PRD §3.3, IDs and protagonists verbatim. Each names its climax beat.

### UJ-1. Dayo goes from zero to a claimed win in one sitting.
1. Lands on `/markets` from Discord; taps **Connect** → RainbowKit sheet → one-click "Add Somnia Shannon" (≤2 prompts to right-network).
2. Zero-tUSDC detected → Faucet card in place of the Ticket CTA; zero-STT detected first → STT routing with fallbacks, before any signing.
3. One tap mints tUSDC; balance pill updates without reload.
4. Hero Market: BTC 5m chart, frozen opening line, countdown, live cent Odds. Types 10, taps **UP**; allowance absorbed into the first-bet confirm with one honest sentence; one transaction.
5. Watches the chart against the line; countdown goes gold at 60s.
6. **Climax — the Verdict moment:** stamp presses 正夢 *masayume — it came true*, P&L in profit ink, Receipt attached.
7. Claim-all plate shows winnings; **Claim all** (gasless); success card links settlement tx + Oracle Graph.
- Failure path: book moved past his quoted Odds → Ticket re-quotes and shows the new cost before placing; never a silent worse fill.

### UJ-2. Ada scroll-bets from the feed on her phone.
1. Opens `/reels`; swipe hint until her first real scroll.
2. Live ETH 60s card → taps **DOWN** → inline Ticket, pre-filled Stake sized to her balance.
3. Session key already granted → bet places with zero popups; card confirms in place.
4. Two cards later: a Take ("UP 72% — funding flipped", backed-filled badge) → **take the other side** → Ticket pre-filled with the opposing Side, same Window.
5. **Climax:** the first card settles while she's still scrolling — the win stamp presses on the card in place.
- Failure path: a card in its no-entry buffer shows "Between rounds" with the next Window pre-armed — the tap is never dead.

### UJ-3. Tunde tries to prove it's rigged, and fails.
1. Hits `/stats` cold, no wallet. Every metric is paired with the on-chain query that produced it; house wallets published and labeled.
2. Opens a settled round's Receipt from the live-activity feed: entry fill tx, settlement tx, Oracle Graph deep link.
3. The Oracle Graph shows sources, values, median, quorum. He clicks through three Receipts, each captioned *"Don't trust it. Click it."*
4. **Climax:** he can't find a number the chain doesn't back.
5. Resolution: the share affordance on the Receipt — he posts the receipt link instead of a callout.
- Failure path: the oracle explorer is unreachable → Receipts degrade to raw tx links, *labeled* as degraded — the proof chain thins honestly, it never breaks silently.

### UJ-4. Maria meets the Brake.
1. Four straight losses on 60s Windows, stakes escalating, rapid prompts at Baku.
2. Fair Value sits inside the disagreement band; the Brake's pattern (loss streak + escalation + restless prompting) fires.
3. **Climax:** instead of a Read: *"You're chasing. Model says no edge here. Sit this window out."* — a talk-down, not a trade idea.
4. Her Ticket shows the Daily Stop headroom: two losses away.
- Failure path: stop hit → every entry surface refuses until midnight with the honest label; the disabled control looks disabled and says why.

### UJ-5. Kenji reads his own edge.
1. Opens `/portfolio`: one number heads the page — spendable balance; pools as labeled rows beneath.
2. Open positions marked against live book; a settled-but-unclaimed row shows as claimable.
3. **Claim all** sweeps three wins + one Void (both sides paid at 0.5, listed explicitly).
4. History rows labeled by how they closed: settled at oracle / closed early / voided; claim time ≠ oracle print time.
5. `/portfolio/edge`: ROI, profit factor, expectancy, max drawdown, equity curve.
6. **Climax:** the one-sentence readout that refuses to claim a pattern before 5 settled rounds — the app telling him the truth about himself.
7. CSV export; provenance note: *"calculated in your browser — redeeming doesn't erase the ledger."*
- Failure path: a history read fails mid-page → last-good rows stay, the affected totals carry the staleness tick, and unmatched rows are skipped and counted — never guessed into his numbers.

### UJ-6. Lara rides a streak parlay.
1. `/parlays`: adds BTC-UP-this-Window + ETH-UP-this-Window; builder shows per-Leg probabilities, correlation surcharge, combined probability, stake → max payout.
2. Opens the Parlay; slip states *"your payout is already locked in the contract"* with the Reserve escrow verifiable on-chain.
3. First Leg settles UP — the slip's Leg row ticks; the ticket advances.
4. **Climax:** second Leg settles UP; the slip flips to won; she claims; the pre-funded escrow pays in full.
- Failure path: a losing Leg kills the ticket instantly — dead slip dimmed, the killing Leg named; no zombie hope.

### UJ-7. Sam lets an agent trade — and verifies it can't steal.
1. `/vaults`: Oracle-Follow Strategy card — decision envelope, record from real fills, live why/why-not feed, Runner health re-derived.
2. Taps **verify** → the custody-rail proof view: beneficiary hard-wired to the depositor, withdraw pays only the owner, settlement crank permissionless.
3. Deposits 50 tUSDC + sets Caps (max stake/trade, max daily spend, max open positions) + subscribes — one composed action; the capability receipt and the worked-example sentence restate his powers granted *at his chosen size*.
4. Runner trades appear in his own portfolio, each linked to its auditable event.
5. **Climax:** a week later he pauses — instant; open positions remain his and settle to him.
- Failure path: Runner offline mid-Window → anyone (including Sam) can crank Settlement; liveness never becomes custody.

### UJ-8. Nia bets from the group chat.
1. DMs the bot; links via signed proof (identity never from unsigned message content).
2. **Climax — the capability receipt lands in chat:** CAN place bets from her Vault balance within her Caps; CANNOT withdraw, change Caps, or pay anyone but her. *"No such function."*
3. Types `bet 5 btc up` → bot echoes Window, Odds, exact cost → she confirms → bet places from her Vault.
4. Verdict posts back with the stamp line and the Receipt link when the Window settles.
- Failure paths: a request exceeding Caps is refused naming the specific cap; an unfunded Vault is refused with a deposit link; a re-sent message can never double-bet.

### UJ-9. A judge evaluates the whole loop in ten minutes.
1. Clones the repo; runs with zero env against testnet defaults.
2. README: one-line pitch, proven-on-chain section (every claim links a real tx), honest-limitations section.
3. `/dev` Fixture pages: every card, Receipt, and modal state without live money.
4. Watches the demo video: bet placed, settled by the oracle, claimed — live, under three minutes; `/demo` carries the same story in-product for the judge who won't press play.
5. **Climax:** checks `/stats` — the numbers match the chain.
- Failure path: testnet is misbehaving during judging → `/dev` fixtures and `/pitch` carry the whole story with zero live dependencies; `/dev/doctor` diagnoses what's down in plain words.

## Inspiration & Anti-patterns

Reference: the Yosuku analysis (`context/11`, `context/13`). Patterns, not pixels — Masayume must not read as a reskin.

**Kept (proven):**
- **Rail-with-placeholders:** every Cadence lane always present; "Between rounds" instead of gaps.
- **Hero-as-Ticket:** tapping anything loads the hero with Side preselected; the chart is the bet surface.
- **One-number portfolio:** the balance IS the header; pools as labeled rows, never summed.
- **The Verdict moment:** settlement as a designed emotional beat with a stamp and a Receipt — not a silent balance change.
- **Blocker-as-label:** one derived blocker string doubles as the disabled CTA's text.
- **Wallet-scaled quick chips**, **question pinning** ("the price of a question may move; the question may not"), **retired-routes-redirect**, **`/dev` state harnesses**, **on-brand error boundary**, **claim-errors humanized** ("Already paid out — the auto-payout got here first").

**Rejected (documented failure modes):**
- **Fake or estimated Odds** — Yosuku dry-run-simulated because it had to; our book is real. Odds come from the order book or aren't shown.
- **Dead fixed-denomination buttons** — 50/100/250 chips for a wallet holding 4.90.
- **Three competing balances** — any surface where two numbers claim to be "your money" without labels.
- **Silent disabled states** — a control that looks usable and isn't.
- **Stale relative countdowns in screenshots** — share cards carry absolute UTC times only.
- **Winners-only leaderboards** — losses are synthesized; a board that drops losses is a defect, not a leaderboard.
- **Self-reported liveness** — "watching Bitcoin" for ten days while the desk was down; Runner health is re-derived at render, always.
- **Vermilion + film-grain + torii texture kit** — Yosuku's brand, not ours.

## Responsive & Platform

**Breakpoints** [ASSUMPTION: exact values]: base (<768px) single column, pill bottom-nav, Ticket as bottom sheet, Baku dock bottom-right above the nav; `md` (≥768px) two-column portfolio/stats/vaults; `lg` (≥1024px) `/markets` becomes hero chart + docked Ticket rail (right), top header nav replaces the pill, ticker persists.

**Desktop enrichment, never rearrangement:** hover prefetch and depth detail; top-of-book depth panel expands on the hero; `/pitch` is keyboard-navigable (← → space, dot nav); `/reels` stays a centered phone-proportioned column (max-width {components.reel-card.max-width}) — the feed is a phone object everywhere.

**PWA:** installable, safe-area-aware; sheets respect `env(safe-area-inset-bottom)`; session cookie keeps returning users signed in ~30d.

**Telegram bot conventions:**
- **Confirm-before-execute, always:** the bot echoes Window, Odds, and exact cost and requires confirmation before any bet.
- **Capability receipt on link:** the CAN/CANNOT message is the first thing a linked user sees, before any bet is possible.
- **Verdict postbacks:** stamp line + Receipt link when the Window settles; absolute UTC times in every message.
- **Refusals name the cause:** the specific Cap, the Daily Stop, or the unfunded Vault (with deposit link) — mirror of the web's blocker-as-label law.
- **Idempotent by construction:** re-sent messages never double-bet; the booked position reflects the actual on-chain fill.
- Same person, same limits: a user stopped on web is stopped in chat (the Daily Stop is per-wallet, server-authoritative).
- **Message shapes** [ASSUMPTION: exact formats]:
  - Confirm: `BTC 5m Window · UP @ 62¢ · 5 tUSDC → 8.06 if it lands · closes 14:35:00 UTC — confirm?`
  - Verdict: `正夢 masayume — it came true. +3.06 tUSDC · Receipt: <link>` (loss mirrors with 逆夢; Void states both-sides-0.5).
  - Refusal: `That's over your max stake per trade (5 tUSDC). Your cap, your rule — change it in the app: <link>`
  - Every money figure in the bot is exact, never rounded past display precision; every settled message carries its Receipt link.

## Trust Moments

The six required trust moments (PRD §7) — each a UX contract with a behavioral + visual spec. None may be shipped weaker.

1. **The custody-rail proof diagram** (FR-38). One reusable asset, not per-surface improvisations: delegated money's path drawn as a rail — deposit → bounded agent → a position hard-wired to *you* — with the withdraw door sealed: `withdraw()` / `transfer()` / `sweep()` struck through, and an attack shown dying at the seal. Static-first (a screenshot or failed observer never catches a blank section); motion is an enhancement. Appears wherever delegation is sold: landing, Strategy cards' verify view, TG linking page. Visual: {colors.surface-2} plate, mono verbs, the seal in {colors.gold-dim} — calm, diagrammatic, no red alarm styling.
2. **The capability receipt framed as proof** (FR-4/FR-36). Not a settings list — a receipt: CAN rows in plain mono, CANNOT verbs struck through, closed by the kill-line *"No such function."* at full ink. Shown at every delegated-power grant (Session key, Strategy, Executor), requires one explicit signature, and remains findable afterward (settings + TG `/receipt` command [ASSUMPTION]). Visual: {components.capability-receipt}.
3. **The claim receipt as a physical object** (FR-11). The cream stub ({components.receipt}) that stays cream in dark mode — the app's only inverted surface and its only shadow. Dotted-leader ledger rows, the settlement print as the monument with its exact UTC second, perforated stub edge, footer *"Only you can cash out."* Every claim success renders one; every history row can reopen its Receipt.
4. **The worked-example sizing sentence** (FR-29). Every delegation flow restates powers *at the chosen size*, live, as the numbers change: "At 50 tUSDC with these Caps, this Strategy can open at most 10 positions of up to 5 tUSDC each, spend at most 25 tUSDC today — and can never move a cent anywhere but back to your wallet." Rendered adjacent to the confirm CTA, in {typography.body} with mono figures; recomputed on every input change.
5. **Client-side provenance notes** (FR-20). Analytics pages state their own provenance where the numbers live: *"calculated in your browser from on-chain history — redeeming doesn't erase the ledger."* Set in {typography.caption} with an {colors.info} link to the exact query. The note is a standing element, not a tooltip.
6. **"Don't trust it. Click it."** The standing caption on every proof link — Receipts, `/stats` metrics, Strategy records, landing claims. Every trust claim in the product is one tap from its tx or its Oracle Graph view; the caption is set in {typography.label-micro} and never appears without a working link under it.

Every trust-moment asset ships with a `/dev` Fixture page covering all of its states (NFR-8) — the Receipt in win/loss/void/claimed, the capability receipt per grant type, the custody-rail diagram static and animated — so judges and screenshots can reach each one without live money.
