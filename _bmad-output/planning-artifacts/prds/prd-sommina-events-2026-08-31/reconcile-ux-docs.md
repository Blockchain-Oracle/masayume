# Reconciliation: Yosuku UX source docs vs PRD + Addendum

**Input:** `context/10-yosuku-overview.md` + `context/11-yosuku-frontend-routes-and-ux.md` (full read) reconciled against `prd.md` + `addendum.md` (this folder), 2026-08-31.

**Test applied:** a source item counts as a finding only if it is (a) ranked high-value in the sources and no FR/UJ/IA entry covers it, (b) a qualitative pattern the FR structure dropped, or (c) contradicted — AND nothing in the PRD or addendum points at it (deep UX detail deliberately deferred to the UX phase is not flagged). Items the PRD explicitly cuts with a reason (leverage, TEE, privacy, X rail, LP vault, rooms, price alerts, creator self-serve, SVI, fiat onramp) are ignored per instructions.

---

## A. High-value UX patterns/flows with no FR/UJ/IA coverage (would be LOST)

### A1. The developer leg of the winning positioning — MCP server / dev surface (HIGH)
Doc 10 §Positioning, flagged **"the winning framing — reuse this"**: the primitive becomes usable **"by people, by developers, and by agents."** Yosuku shipped the first TS SDK + **first MCP server** for its primitive (515 downloads, its strongest "ecosystem impact" evidence), plus a `/docs` route telling that story ("one line in any MCP client and an LLM can trade").
The PRD's vision (§1) silently narrows to "consumer and agent layer" — two legs of three. No FR, IA entry, or deliverable builds any developer-facing surface. The "SDK & docs feedback report" deliverable is feedback *to* DreamDEX, not a dev layer *for* others — a different thing.
Nuance: unlike DeepBook Predict, DreamDEX already ships `@somnia-chain/markets-sdk`, so "first SDK" doesn't apply. But **an MCP server for Event Contracts almost certainly doesn't exist**, is cheap (wraps the same chain adapter the app already builds), and lands squarely on the "Somnia is the Agentic L1 / DreamDEX is agents-first" thesis the PRD itself claims (§1). This is the single largest silent drop. Decide it on merit; today it is lost, not deferred.

### A2. Edge analytics narrowed by FR-20's enumeration (MEDIUM-HIGH)
Doc 11 ranks Portfolio/Edge #5 and names its parts: "equity curve, expectancy, **time-of-day edge**, **payoff shape**." FR-20 enumerates its metric set (ROI, win rate, profit factor, expectancy, max drawdown, streaks, equity curve, readout) and — because it enumerates — an implementer will build exactly that. Dropped without a pointer:
- **"When you perform best"** — P&L bucketed by local time-of-day windows with split gain/loss bars (the most personal, screenshot-able insight on the page).
- **"Your payoff shape"** — avg win vs avg loss, best streak, fees, total stake.
- The **provenance note** — "calculated in your browser from on-chain history… redeeming doesn't erase the ledger" — a trust moment that belongs with FR-21/22's provably-fair story (see B2).

### A3. Judge-facing in-app surfaces: `/demo` walkthrough (and `/pitch` route) (MEDIUM)
Doc 11's port-worthiness **rank #3** is the cluster "`/stats`, `/demo`, tx-link discipline — cheap to build, disproportionate credibility." The PRD adopts `/stats` (FR-22) and the tx-link discipline (FR-21, NFR-8), and delivers a demo *video* and a *deck* — but the **in-app scrolly `/demo` walkthrough** (numbered sections alternating copy/screenshot, "Every claim is a transaction" grid of explorer links, video embedded) and the **`/pitch` deck-as-a-route** are silently gone. These are what let a judge who won't watch a video absorb the whole story in-product; neither the IA (§6) nor deliverables (§10.1.8) point at an in-app equivalent. The deck deliverable *could* be built as a route (source shows it is self-contained, no data deps, trivially reskinnable) — but nothing says so.

### A4. Word markets — plain-language "Just ask" board (MEDIUM)
Doc 11 feature #5, on the **flagship** `/markets` screen: the same live markets re-phrased as plain yes/no questions with no chart, Yes/No taps deep-linking into the ticket. It is the accessibility ramp for non-traders (the PRD's own Ada/Dayo personas) and costs almost nothing since deep links (FR-7) already exist. No FR, no IA mention, not in any out-of-scope list → lost. Note the PRD's own gotcha canon (addendum D #13, "never parse question text") means phrasing must derive from `asset` + `intervalSec` + opening price — doable and worth one line in an FR.

### A5. Custody storytelling assets after the X-rail cut (MEDIUM — see also B1)
Doc 11 rank #9 says explicitly: "The **capability-receipt UX and custody-rail SVG are worth porting even if the tweet rail itself is cut** — use them to explain any session-key/agent permission on Somnia." The PRD kept the capability receipt (Glossary, FR-4, FR-36 — good) but the **animated custody-rail proof diagram** — called "the single best security-storytelling asset in the app" (sealed withdraw door with struck-through `withdraw()/transfer()/sweep()`, an attack packet that travels the wire and dies at the seal) — has no pointer. UJ-7's "verify view" is the nearest hook but reads as a contract-link page, not a proof visualization. Since UJ-7/FR-30 (no-divert) is the PRD's flagship claim, the flagship way of *showing* it should be pointed at, or the UX phase will invent something weaker.

---

## B. Qualitative ideas the FR structure dropped (tone, trust moments, presentation)

### B1. Trust-moment copy and objects with no home in any FR
- **"No such function."** — the capability receipt's kill-line (CAN/CANNOT ledger with struck-through verbs, "no such function in the contract"). FR-36 specifies the CAN/CANNOT content but not this framing, which is the difference between a permissions dialog and a proof.
- **The receipt as a physical object** — `/claim`'s cream betting-stub ReceiptCard, deliberately cream in both themes "so it reads as a physical object," amount masked until sign-in, "Only you can cash out." footer. The PRD's Receipt (Glossary/FR-21) is defined purely as *links*; the tangible-object presentation that made settlement feel like the Emotional JTBD ("make the win feel like a verdict, a stamp, a receipt") is unpointed. The stamp vocabulary survived; the stub did not.
- **Worked-example sizing sentence** — the copy drawer's live sentence re-stating exactly what the agent can and cannot do *at the chosen size* (doc 11 rank #11: "port the trust language"). FR-29 has caps; §12 has "bounded, receipted, revocable"; the worked example at chosen size is the piece that makes caps legible and it appears nowhere.
- **`/docs` honesty plate + "Don't trust it. Click it."** contract-proof table. NFR-8 puts honest-limitations + proofs in the README only; the in-product placement (a Trust ring page a judge hits from the footer) is dropped. Cheap; consider folding into `/stats` or landing footer.

### B2. Client-side provenance as a trust pattern
Doc 11: Edge is computed "entirely client-side… 'calculated in your browser from expiry summaries'" — i.e., *the analytics can't lie because we never touch them*. That reinforces NFR-1 (no DB authoritative for chain state) at the copy level. Nothing in FR-20/FR-21 carries it.

### B3. Micro-craft items with no pointer (small, cheap, source-flagged)
- **Wallet-scaled quick-amount chips** (doc 11, `/earn`): "fixed 50/100/250 chips are dead buttons for someone holding 4.90" — applies directly to the FR-8 stake input and the FR-29 subscription sizing; no FR consequence mentions relative sizing.
- **IntersectionObserver fallback so screenshots never capture blank sections** (landing, doc 11) — a demo-video/judge safeguard; NFR-8 doesn't cover it.
- **First-visit Tutorial overlay** on `/markets` — onboarding §5.1 covers wallet/funding, not first-use orientation of the trading screen.
- **Baku inline trade cards** — Sensei's chat drawer renders actionable trade cards inline (read → tap → ticket). FR-23 produces a Read as *text*; the act-on-the-Read affordance is unpointed.
- **Light theme as token-remap with "dark islands"** (doc 11: "worth copying as an approach") — PRD locks dark-first and never mentions a light mode; fine to cut, but it is a silent cut, not a reasoned one.
- **Waitlist name-service check** (`.yosuku.sui` → ENS-style handle reservation; doc 11 rank #6 names it as part of the growth loop) — FR-39 keeps referral + Founder, drops the handle-reservation hook silently.
- **`/stats` live-activity feed** (event rows, color-dotted, every row click-through to explorer) — FR-22 specifies metrics + calibration but not the liveness feed that makes the page feel alive during judging.

### B4. README / presentation patterns — mostly SAFE (for the record)
Doc 10's presentation patterns are well covered: proven-on-chain with per-claim tx links (NFR-8, UJ-9), honest-limitations section (§10.1.8, NFR-8), zero-env quickstart (addendum A), sponsor-stack "composed, not bolted on" table (FR-38), un-fakeable metric definitions incl. the wallet-farm lesson (§12 Cost), `/dev` fixture practice (Glossary, NFR-8), graceful route retirement (§6), on-brand error boundary copy (§7), strike-pinning law (FR-7), vanity-metric rule (FR-27/32), "every link goes somewhere real" (implied by honest-state discipline — worth one explicit line in the UX brief).

---

## C. Contradictions and unstated divergences

### C1. Unified Trading Balance vs wallet-first betting (divergence, unstated)
Doc 10: Yosuku's **Trading Balance** is *one prefunded vault routing normal/private/leverage/agentic trades* — and doc 11 rank #5 credits exactly this IA with preventing "the classic three-competing-balances failure." The PRD splits money into wallet (normal bets), Vault (agents/Executor, maybe session-key fallback), and Reserve escrow — FR-5 handles this honestly with labeled pool rows, but the PRD never states *which pool a normal bet draws from*, and the source's core money-IA idea (one spendable number you bet **from**) is silently halved: FR-5 keeps the one-number display while the PRD's architecture reintroduces the multi-pool reality underneath. Not wrong — EC bets settle to the wallet naturally — but the divergence from the pattern the source ranks as "gold" is nowhere acknowledged, and UX will hit the question immediately (deposit-to-Vault vs bet-from-wallet confusion is exactly the failure the BalancePlate existed to prevent).

### C2. "Never a midpoint estimate" vs parlay legs "priced from live book mids" (internal tension seeded by the port)
FR-8: quotes "derive from a real order-book quote for the actual size (**never a midpoint estimate**)." FR-33: leg probabilities "come from the **CLOB mid** at open." Both are defensible (the Reserve is the parlay counterparty, so mid + margin is house pricing, not a fill estimate) — but the PRD states the first as a law and the second as a spec without reconciling them. One sentence in FR-33 ("mid is legitimate here because the Reserve, not the book, pays") prevents an implementer from "fixing" one to match the other.

### C3. Reels betting: source routed to `/markets` for honesty; PRD bets inline
Doc 11: reel UP/DOWN buttons "route to `/markets` — honest, no fabricated odds." FR-13 does inline tap-to-bet — an *improvement*, and the source's rationale is preserved because FR-8/9 guards apply inline. No action needed; recorded so the divergence is known-deliberate rather than an accident someone reverts.

### C4. Wallet-less "bet first, wallet later" acquisition loop (dropped semi-silently)
Yosuku's `/claim` flow let someone bet from X with **no wallet** ("We made you an account and locked it to you") and bind a wallet later. The PRD's Telegram rail (FR-36) requires wallet+Vault linking *before* any bet. The X rail is cut with a reason, and Privy's rejection (addendum A/G) indirectly explains why wallet-less EVM onboarding is hard — but the acquisition-loop consequence (chat users must already be wallet-holders) is never stated. Fine for v1; should be a conscious line, not an accident.

### C5. "Gasless" scope — reasoned, NOT a finding (for the record)
Yosuku marketed sponsored gas *everywhere* (feature 29); the PRD sponsors claims/exits only, with reasons (§12 Cost, NFR-7, SM-C2). Explicitly reasoned → ignored per instructions. Same for the accent-hue change vs doc 11's "vermilion-only" must-keep — tagged [ASSUMPTION] in §7, indexed §15 → not silent.

---

## D. Checked and covered (no action — the deferral pointers exist)
Cadence lanes/placeholders/pinning (FR-6), hero-as-ticket + deep links (FR-7), ticket auto-roll (FR-9), strike pinning (FR-7), reel mechanics + visibility gating (FR-12), take-the-other-side (FR-13), backed Takes via mint-a-pair (FR-14), share cards + dynamic OG (FR-15), one-number plate + pool rows (FR-5/16), honest history labels (FR-17), FIFO/bigint PnL (FR-18), CSV (FR-19), banzuke + "You" bar (FR-26, Glossary), badges from public data (FR-27), no-divert vault + permissionless crank (FR-28–31), pre-funded parlay + first-loss kill (FR-33–35), capability receipt (Glossary/FR-4/36), waitlist referral + Founder (FR-39), landing with live data + manifesto + stack table (FR-38), stats un-fakeability + calibration (FR-22), Brake/Daily Stop (FR-24), Baku grounding (FR-23), reduced-motion + honest-state-as-a11y (NFR-5/9), visibility-gated polling (NFR-4), bottom pill nav + ticker + floating dock (§6), error-boundary reassurance (§7), PWA (§8).

---

## E. Suggested dispositions (each is one PRD/addendum line, not a rebuild)
1. **A1:** add an FR or deliverable ("EC MCP server wrapping the chain adapter; `/docs` or README section tells the by-people/by-developers/by-agents story") — or add it to §9/§10.2 *with a reason* so the drop is deliberate.
2. **A2/B2:** extend FR-20's consequence list with time-of-day buckets, payoff shape, and the client-side provenance note.
3. **A3:** one line in §10.1.8: deck ships as an in-app `/pitch` route; demo video gets an in-app `/demo` companion with the tx-proof grid — or an explicit cut.
4. **A4:** one consequence under FR-6 or FR-12 for a plain-language question phrasing surface (derived from asset+interval+opening price, never question text).
5. **A5/B1:** one line in §7 or a UX-phase handoff note naming the custody-rail proof diagram, receipt-stub object, "No such function." framing, and worked-example sizing sentence as required trust moments (they realize UJ-3/UJ-7's emotional payload).
6. **C1/C2/C4:** add the three reconciling sentences so the divergences are stated, not silent.
