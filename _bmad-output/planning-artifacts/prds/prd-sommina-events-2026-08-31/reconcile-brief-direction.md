# Reconciliation: PRD vs Hackathon Brief & Direction Doc

*Input reconciliation for `prd.md` + `addendum.md` against `context/00-hackathon-brief.md` and `context/30-ideas-and-direction.md`. Date: 2026-09-01.*

**Verdict: faithful.** All six locked decisions are carried correctly, every submission requirement and judging criterion has a PRD home, and the one real internal tension in the direction doc (decision 1 vs decision 6 on Telegram) is resolved coherently — though via a silent rewording that should be made explicit. Remaining findings are minor coverage asymmetries and editorial residue, listed below.

---

## (a) Locked decisions 1–6 — carried?

| # | Locked decision | PRD home | Status |
|---|---|---|---|
| 1 | Scope A+B+C+D all in, on merit; merit-cuts: leverage/margin, TEE, full privacy | A → FR-28…32 (§5.9); B full scope incl. CLOB-mid leg pricing → FR-33…35 (FR-33 names the improvement over the reference); C → FR-36…37 (§5.11); D → FR-4. Merit-cuts all in §9 Non-Goals with explicit "(Cut on merit)" language. §10 restates "deadline is never a scoping argument"; §10.1 "nothing falls off a phase boundary" | ✅ Carried, including the no-deadline-scoping rule |
| 2 | Wallet: wagmi v2 + RainbowKit, custom `somniaShannon` chain, `setSigner` seam; Privy rejected (origin-locked keys / Enoki parallel); "no seed phrase" feel = faucet + gasless claims + session keys + one-click network add | Addendum §A Wallet row (verbatim rationale incl. Enoki parallel and thin-adapter/post-hackathon note); PRD §5.1 description names all four friction-removers; FR-1 one-click network add; FR-2 faucet; FR-3 gasless claims (correctly claims/exits-only); FR-4 session keys. Addendum §G re-records the Privy rejection | ✅ Carried |
| 3 | Copilot: Vercel AI SDK `ai` v6 + AI Gateway, `anthropic/claude-opus-5` in env (swappable), `streamText`+`useChat`, key server-side; quant computes, LLM explains + Brake | Addendum §A Copilot row carries every element; PRD FR-23 (snapshot-grounded Read — "LLM never outputs a number absent from the snapshot"), FR-24 (Brake enforced at Ticket, not just chat), NFR-7 (key server-side); addendum §E carries the fair-value model + Brake extras | ✅ Carried |
| 4 | Naming: **Masayume** (正夢), win stamp 正夢 masayume / loss stamp 逆夢 sakayume, copilot **Baku** (獏, "eats your bad bets"); dark-first, single accent, direction colors reserved for P&L; domain notes | PRD title + §1 Vision carry the full triple-fit and both stamps with correct glosses; Glossary defines Verdict/Baku; FR-10 makes the stamps testable; FR-15 puts stamp vocabulary on share cards; §7 dark-first / ONE accent / green-rose reserved for P&L + verdicts; Open Question 2 carries the parked-masayume.xyz domain note verbatim | ✅ Carried. Bonus: the direction doc's own slip (build-sequence step 3 says "Sage copilot") is correctly normalized to Baku everywhere |
| 5 | SDK/docs feedback report: yes, material already collected (4 items) | PRD §10.1 item 8 lists it as a locked deliverable; addendum §J carries all four collected items (tickSize/lotSize gap, indexer schema drift, receipt-on-`info` trap, venue-id churn) | ✅ Carried |
| 6 | Social loop: in-app Takes feed + share cards at launch; **no X/TG rail in MVP** | §5.4 description: "Launch social loop is in-app Takes + share cards (locked direction; no X/TG **posting** rail in MVP)"; §9: "No X (Twitter) rail in MVP … the Telegram Executor is the chat rail"; §10.2 keeps chat rooms out citing decision 6 | ✅ Carried — but see tension analysis (c): the word "posting" is a PRD insertion |

## (b) Brief requirements & judging criteria — addressed?

**Submission requirements**

| Requirement | PRD home |
|---|---|
| Working prototype on Somnia Shannon testnet (50312) | §2.1; SM-1 (live loop under 5 min); §3.2 (testnet-only v1); NFR-8 |
| GitHub repository | UJ-9 ("clones the repo"); NFR-8 (zero-env run, README claims link real txs) |
| 2–3 min demo video | §10.1 item 8; SM-1 requires the loop *in the video*; §2.3 makes the 60s cadence the demo strategy |
| Optional: deck | §10.1 item 8 ✅ (content unspecced — see gaps) |
| Optional: SDK/docs feedback report | §10.1 item 8 + addendum §J ✅ |

**"Must demonstrate" list**: working prototype ✅; EC integration ✅ (entire product is EC-native, §9 "depth over breadth"); meaningful API/SDK use ✅ (SM-2: read/trade/watch/history surfaces — matching the brief commentary's SDK-depth list); clear UX ✅ (§7 + NFR-9 + honest-state discipline as product law); adoption/trading-activity/ecosystem potential ✅ (SM-3 un-fakeable traction, FR-38/39 growth loop, TG rail as distribution).

**Judging criteria**

| Criterion (weight) | PRD home | Coverage |
|---|---|---|
| Technical Implementation (25%) | **SM-2 explicitly targets it** (SDK surfaces + 2 contracts + runner, on-chain verifiable) | Explicit |
| Business & Ecosystem Impact (20%) | **SM-3 explicitly targets it** (≥200 settled positions, ≥25 wallets, recomputable stats) | Explicit — but "sustainable" sub-criterion unanswered (gap 3) |
| Innovation & Originality (20%) | Implicit: §1 thesis, Parlays as "new market structure" (§5.10), Baku, mint-a-pair-backed Takes | **No named metric or section claims this criterion** (gap 2) |
| UX & Design (20%) | Implicit: §7, NFR-9, honest-state discipline; SM-6 is the closest metric and is explicitly qualitative | **No hard target** (gap 2) |
| Presentation & Demo (15%) | SM-1 + §10.1 deliverables + UJ-9 | Covered except the criterion's "future vision" element — the PRD has no future-vision section (fragments scattered: Privy post-hackathon, X-reuses-Executor, second-venue seam §B, marketplace language) (gap 2) |

Brief resources: bot-kit reused (FR-32, addendum §A/§E) ✅; Data Streams `/reactivity` carried as a judging-angle candidate (addendum §H) ✅; TG dev community is the distribution target of §5.11 ✅; STT faucet handled in FR-2 ✅. **DreamDEX Bot Builder** is never mentioned in the PRD — the brief marked it "not yet inspected"; informational only, no requirement lost.

## (c) Internal tensions — resolved or papered over?

**T1. Decision 1 includes C ("social rail via Telegram bot") while decision 6 says "no X/TG rail in MVP" — RESOLVED, with one caveat.** The PRD resolves this by classifying the two rails differently: the Telegram surface is an *execution/distribution* rail (§5.11 "Distribution demo… bounded Executor"; Glossary defines Executor as a Vault client with no withdrawal power), while decision 6's exclusion is read as covering the *social posting* loop (§5.4: Takes + share cards at launch). §9 states the split in one line: "the social loop is in-app Takes + share cards; the Telegram Executor is the chat rail. X can reuse the same Executor later." This is coherent — nothing in FR-36/37 posts user content socially; the bot only echoes confirmations and verdicts back to the linked user — and it matches the direction doc's own framing of C as "bet from a chat message; the agent can't drain you."
**Caveat:** the resolution is achieved by silently rewriting the locked wording — §5.4 quotes decision 6 as "no X/TG *posting* rail," a word that appears in neither locked decision. The reading is almost certainly the intended one, but since both texts are "locked," the PRD should own the reinterpretation in one explicit sentence (or the direction doc should be amended) rather than quote-with-insertion. As it stands, a strict reader of decision 6 could claim FR-37's verdict post-backs violate it.

**T2. Direction doc's "Second-week stretch: pick at most TWO" header vs decision 1's "all four" — RESOLVED correctly.** The header predates the lock; the PRD follows the locked decision (all four in §10.1) and carries the governing rule ("deadline is never a scoping argument") into §10 verbatim. Consistent with the user's standing no-deadline-scoping rule.

**T3. "Sage" vs "Baku" naming slip in the direction doc — RESOLVED.** Direction build-sequence step 3 says "Sage copilot" (stale name); decision 4 locks Baku. PRD and addendum §I use Baku throughout.

**T4. Gasless framing — CONSISTENT.** The thesis's "gasless" is correctly narrowed to claims/exits-only (FR-3, NFR-7, SM-C2 "capital intake is never sponsored"), matching decision 2's actual mechanism list rather than over-promising.

## (d) Direction MVP list & build sequence — anything with no PRD home?

**MVP list (1–6):** all homed. Markets loop → FR-6…11 (cadence lanes, hero chart with frozen line, stake-first quotes, IOC guards, Verdict, Claim-all; client tier + watches in addendum §A). Reels → FR-12…13. Portfolio → FR-16…20 (one-number plate FR-5/§5.5, live PnL, FIFO, CSV). Provably-fair → FR-21…22 (oracle-graph deep link + `/stats`). Copilot → FR-23…25. Leaderboard/badges/landing → FR-26…27, FR-38.

**Stretch A–D:** all homed (see table (a), row 1).

**Architecture bullets:** monorepo layout → addendum §A; no-DB-for-chain-truth → NFR-1 + addendum §A; SDK pin 0.28.1 → addendum §A; `VENUE_ID` + empty-scope explainer → addendum §A; zero-env quickstart / `/dev` fixtures / DRY_RUN → NFR-8, FR-32, addendum §A.

**Build sequence 1–7:** reproduced as addendum §I with the "not a cut list" framing intact; seed-liquidity script homed twice (§10.1 item 8; mint-a-pair mechanism in addendum §H); honest-limitations README in NFR-8; submission artifacts in §10.1 item 8.

**Residue found (none blocking):**
1. Direction's stretch-D description names `viem-session-account` as the mechanism; the PRD abstracts to a capability contract (FR-4) and re-opens the mechanism as Open Question 5 (operator registry vs local signer vs 7702). Defensible — the *locked* text of decision 1 says only "D: session-key tap-trading" — but the named candidate library is nowhere recorded; worth listing it among OQ-5's options.
2. Direction's stretch-A note "enables copy-trade language" has no verbatim home; FR-32's marketplace language (decision envelope, published records) subsumes it. Fine.
3. NFR-1 lists "chat" among stored server data while §10.2 puts per-market chat out of scope — "chat" presumably means Baku conversation history; the term should be disambiguated (the direction doc's architecture line has the same "takes/chat/sensei-memory" wording, so this is inherited).
4. Waitlist appears in the PRD (FR-39, addendum §C) though it is absent from the direction MVP numbered list — it *is* in the direction architecture line (`contracts/`: EventVault, ParlayReserve, **Waitlist**) and build-sequence step 4, so this is a faithful carry, not scope creep.

## Recommended edits (all small)

1. **§5.4 or §9:** add one sentence explicitly reconciling decisions 1 and 6 — e.g. "Direction decision 6 excludes social *posting* rails; the Telegram Executor (decision 1, option C) is an execution rail and is in scope — the two decisions are read together, not in conflict." Removes the silent quote-alteration (T1).
2. **§13:** add explicit hooks for the two 20% criteria with no named target — an Innovation line (e.g. parlays + backed-Takes + Brake as the originality claims) and a UX line (e.g. honest-state audit of every blocked control, or a hard first-bet time target) — so all five judged criteria have owners the way SM-2/SM-3 do.
3. **§13 or a short §"Future vision":** one paragraph consolidating the scattered post-hackathon threads (Privy behind the adapter, X on the Executor, second venue behind the §B seam, creator marketplace) — directly serves the Demo criterion's "future vision" element and gives the deck its outline; brief says deck is optional but §10.1 commits to it with no content spec.
4. **Impact "sustainable" sub-criterion:** add one honest line on the economic story (builder-code attribution as the revenue path once verified — currently OQ-3; strategy-fee cap already in addendum §F).
5. **NFR-1:** rename "chat" → "Baku conversation history" (or similar) to kill the ambiguity with the out-of-scope chat rooms.
6. **OQ-5:** record `viem-session-account` as the direction doc's original candidate among the mechanism options.
