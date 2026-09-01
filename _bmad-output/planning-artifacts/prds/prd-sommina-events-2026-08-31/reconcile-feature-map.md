# Reconciliation — `context/20-feature-map-yosuku-to-dreamdex.md` vs PRD + Addendum

*Input: the feature port map (doc 20). Method: every KEEP/ADAPT/NEW verdict, every drop-list row, every NEW-opportunity item, and every cross-cutting discipline checked against `prd.md` FRs/NFRs/scope sections and `addendum.md`. Items the PRD explicitly places out of scope with a reason are treated as decisions, not gaps, and listed at the end for the record.*

## Verdict summary

Coverage is strong: all of Tier 1, Tier 2, and most of Tier 3 map cleanly to FRs; all six cross-cutting discipline bullets are reflected in NFR-1..9 and §7; the drop list maps 1:1 onto §9 Non-Goals / addendum §G with rationale. The gaps below are the residue — mostly from the **NEW opportunities** section (the "our edge" list), which got partial coverage.

---

## (a) KEEP/ADAPT/NEW items with no FR and no scope decision

### GAP-1. Order-book-native user surfaces (NEW #1) — depth display and "set your own odds" limit orders
Source (line 48): *"depth display, limit 'set your own odds' orders (post-only), … order expiry as auto-cancel. Yosuku's venue had no book."* This is the first item on the source's "our edge" list — the features only possible because DreamDEX has a real CLOB.

What survived: quote-both-sides-zero-inventory MM (FR-32 + seed-liquidity script §10.1.8 + addendum §H mint-a-pair cold start); order expiry (gotcha #5).
What silently vanished:
- **Depth display** — no FR shows book depth anywhere (hero, ticket, or reel card). FR-8 *uses* the book for quotes but never *shows* it.
- **User-facing limit orders** — the only resting-order path in the PRD is a backed Take at stated confidence (FR-14). A "set your own odds" mode on the Ticket itself has no FR and no out-of-scope entry.

Neither appears in §10.2 Out of Scope or §9 Non-Goals. Given SM-2 targets "judged technical depth" and this is the headline order-book-native differentiator, this is the most consequential silent drop. Recommend: either an FR (depth readout + limit-order ticket mode) or an explicit out-of-scope line with a reason (e.g., "backed Takes are the v1 limit-order surface").

### GAP-2. Market history explorer (NEW #3, second half)
Source (line 50): *"History survives settlement (full tape+candles+orders) → market history explorer, calibration charts."* The calibration chart survived (FR-22). The **market history explorer** — a public browse-past-windows surface with tape/candles, exploiting the fact that EC history survives settlement (which the source flags as something the official app doesn't have) — appears nowhere: no FR, no route in §6 IA, no scope decision. `/portfolio` history is the user's own trades only. Recommend: scope decision either way.

### GAP-3. Copy trading (Tier 3 header)
Source row is titled *"Agent strategies marketplace + copy trading"* (ADAPT, scope!). The PRD ships house Strategies (FR-28..32) and explicitly defers **creator self-serve marketplace** with a reason (§10.2) — fine. But **copy trading** as a concept (following another trader, e.g., from the Banzuke) is neither an FR nor a scope line; the word does not occur in prd.md or addendum.md. The source's own mechanism column partially scoped it down, but the PRD should own the decision: one line in §10.2 ("copy-a-trader = a future Strategy type; v1 subscriptions are house strategies only") closes it.

### GAP-4. Custody-rail SVG explainer (Trade-from-X row)
Source (line 35): *"If cut, keep the capability-receipt UX + custody-rail SVG to explain agent permissions."* X was cut with a reason (§9, §G — decision, fine), and the capability-receipt UX survived richly (FR-4, FR-36, Glossary). But the **custody-rail SVG** — the visual explainer of how delegated money flows and why it can't divert — was named as the keep-even-if-cut artifact and appears nowhere. Nearest cousin is UJ-7's "verify view" on the strategy card, but no FR consequence mandates a visual custody explainer. Cheap, judge-facing, and the source explicitly said to keep it. Recommend: add as a consequence under FR-29 or FR-38 (landing "composed, not bolted on" section is a natural home).

## (b) Cross-cutting / judge-credibility content dropped or diluted

### GAP-5. Somnia Data Streams "chain's signature feature" judging angle has no requirement anywhere
Source (NEW #5, line 52): push-based live UI via `@somnia-chain/streams` / SDK `/reactivity` + the explicit judging angle *"uses the chain's signature feature."* Addendum §H parks it as a one-line "candidate," but: no FR, no NFR, not in §14 Open Questions — while NFR-4/NFR-5 codify a **polling** model (visibility-gated polling, ~12s re-quote cadence). As written, the architecture phase can satisfy every requirement without ever touching Streams, and the judging angle (relevant to the 25% Technical + 20% Ecosystem criteria) silently evaporates. Recommend: promote to §14 Open Questions at minimum, or an NFR-5 alternative ("live surfaces prefer push via Data Streams where the SDK supports it; polling is the fallback").

### GAP-6. Leaderboard "5 cache-honesty rules" — the named one is missing
Source (line 24): port *"the 5 cache-honesty rules (incl. 'synthesize never-emitted losing redemptions')"*. FR-26 carries roughly three (event dedup, close-time window filtering with prior-mint cost basis, unmatched-redemptions disclosed). The one rule the source names — **losing positions emit no redemption event, so losses must be synthesized from finalized markets** — is stated nowhere in FR-17/18/26. Without it, FIFO-over-emitted-events computes a winners-only PnL and the Banzuke overstates everyone — precisely the un-fakeable-numbers failure SM-C3 exists to prevent. Recommend: add as an FR-26 (and FR-18) consequence: "positions in markets finalized against the holder are synthesized as realized losses even though no redemption event exists."

## (c) Contradictions

### CON-1. Parlay correlation-surcharge trigger: same-expiry vs same-asset/oracle
Source (line 34): correlation surcharge *"λ=0.40 **same-expiry**."* PRD FR-33 and addendum §C: *"same-**asset**/same-**oracle** legs."* The trigger condition changed silently. These select different leg pairs: BTC-60s + ETH-60s expiring together is correlated under the source's rule but not the PRD's; BTC-5m + BTC-10m the reverse. Since the Reserve's solvency math depends on it (rounding-favors-reserve is only safe if the surcharge fires on actually-correlated legs), this needs a deliberate reconciliation — likely the union (same-asset OR same-expiry) — recorded in addendum §C.

### CON-2. Push vs poll (soft — see GAP-5)
Source's NEW #5 proposes push-based live UI as an edge; NFR-4/NFR-5 hard-code polling semantics. Not fatal (polling can be the requirement floor), but as written the NFRs read as a decision *against* streams that was never actually made.

## Minor notes (flag, low stakes)

- **Sensei system prompt "ports verbatim"** (source line 31, citing doc 15's quoted prompt): Baku's FRs define behavior but neither PRD nor addendum records that a proven ported system prompt exists as the starting artifact. One line in addendum §A/E preserves it.
- **Unfilled backed Take**: FR-14 covers post-only placement and cross handling, but not the terminal state of a backed order that never fills before window expiry (order auto-expires per gotcha #5 — what does the Take card show?). UX-phase detail; worth a consequence.
- **Builder-fee "sustainability pitch" mention** (NEW #7, second clause): order-flow tagging survived (§14 Q3, addendum §H); the instruction to *mention it in the sustainability pitch either way* is deck content — carry into the submission-deck outline.
- **"Liquidated" history label** dropped from the honesty-label set (source line 14) — correct and consistent with the no-leverage Non-Goal; noted only to show it was checked.

## Explicitly decided — NOT counted as gaps (for the record)

- Privy embedded wallets → rejected with rationale (addendum §A/§G); "no seed phrase" explicitly reframed in §5.1.
- Bet-gated rooms/comments (source verdict KEEP-lite) → reversed to out-of-scope, but **with** a reason (§10.2: Takes carry the social loop; moderation liability). Decision, not gap — though it is the one place the PRD overturns a source verdict rather than narrowing it.
- Trade-from-X → cut with reason (§9, §G); Telegram alternative adopted (FR-36/37).
- Leverage/lending/liquidations, TEE (audit-trail events kept via FR-30), privacy, Sui-specific rails, SVI math, legacy components → all in §9/§G with reasons matching the source's own drop list.
- Price alerts → §10.2 with a revisit note (not in doc 20 anyway).
- Headroom vs no-entry-cutoff number mismatch → addendum §F already flags "reconcile at build"; not silent.

## Coverage confirmation (what is fully reflected)

Tier 1 rows 1–6 → FR-1..11, FR-16..20; Tier 2 rows → FR-12..15, FR-21..22, FR-10, FR-26..27, FR-38; Tier 3 Sensei→Baku (FR-23..25 + addendum §E), EventVault (FR-28..31 + §C), parlays (FR-33..35 + §C), waitlist (FR-39). All six cross-cutting bullets → §7, NFR-1..9, §10.1.8 (honest-state UX, marketId pinning, Zod/null≠0/TTL-dedup/visibility gating, one order-builder = ONE chain adapter, liveness-never-custody, judge-proofing incl. SDK feedback report).
