# Pre-Build Package Review — Masayume planning set

- **Run:** 2026-09-01, bmad-review, lenses: adversarial · edge-case-hunter · structure (epics.md) · prose (epics.md, after structure)
- **Content:** PRD + addendum, DESIGN.md + EXPERIENCE.md, ARCHITECTURE-SPINE.md, epics.md, sprint-status.yaml
- **Full lens outputs:** preserved in the session task transcripts; this file carries the synthesis and disposition of every finding. All dispositions were applied to the artifacts on 2026-09-01 immediately after this review (see each artifact's memlog).

## Verdict

The package's spine holds: no lens found a wrong product decision, a broken paradigm, or a scope hole. What the lenses found — and what per-phase review could not have found — is **assembly damage**: places where five documents edited in sequence disagree with each other, and behavioral edges only visible when you trace a story against all four contracts at once. Four adversarial findings were build-blocking (a dev agent would have built the wrong thing); the rest are drift, missing edge ACs, and editorial hardening. Everything is fixable by patching; nothing needs redesign.

## Build-blocking findings (adversarial)

1. **Vault-held positions invisible to the ledger contract.** AD-1's `getLedger(wallet)`, FR-16, FR-11, and Story 3.1 are wallet-scoped, but every STRATEGY/EXECUTOR/SESSION position lives in EventVault. Portfolio, Edge, CSV, Banzuke, and the claim plate would silently omit all delegated trades — including every session-key tap-bet — and "agent trades appear in your own portfolio" (UJ-7) would be false. → AD-1 amended (ledger merges vault-attributed events; claims enumerate vault credits); Stories 3.1/6.5/6.6 extended.
2. **The delegated-order write path was hand-waved.** Vault orders are contract calls with different ABI/fill-event shapes, and all vault users share one venue-side owner — colliding with the pool's self-match refusal. "The same order lane" cannot express this. → AD-3/AD-5 gain the direct-vs-vault routing dimension; Story 6.1 gains the venue-behavior verification AC.
3. **Daily Stop reserve semantics self-contradictory.** `checkAndReserve` pre-send vs "spent = booked cost, never decremented" cannot both hold when an IOC misses. → Resolved as reserve-then-reconcile: reserve requested cost pre-send, reconcile to booked cost after, release on failure ("never decremented *by user action*"). AD-9 + Story 5.2 patched.
4. **OQ-5 resolution only half-synced into the PRD.** FR-29 was patched but FR-4/FR-5/§14.5/§15 still present the session-key mechanism as open/fallback. A PRD-first reader builds the dead route. → All four spots patched to state AD-5's resolution.

## Other adversarial findings (all applied)

5. Daily Stop has no settings surface anywhere; tz captured only "at configuration" → settings AC added to Story 5.2; tz auto-captured at first SIWE; Ticket headroom line added to DESIGN.
6. FR-11's batching citation points at facts that don't exist for writes; Epic 1 claim flow is multi-prompt with no designed states → citation fixed; interim claim-progress UX added (Story 1.10 + EXPERIENCE).
7. FR-3 promised sponsored "exits" the architecture can't implement → "exits" cut with reason (redeems only; close-early is an order signature).
8. Story 4.4's sponsored waitlist join needs an ops actor that doesn't exist until Epic 8 → re-sequenced: 4.4 ships user-gas with honest note; sponsorship lands as an 8.1 AC.
9. LLM budgets and sponsor gates have no schema home despite "degrade closed" depending on them → `llm_budgets` + `sponsor_gates` added to the spine schema + degradation table; Stories 5.3/8.1 name their stores.
10. Two incompatible faucet models (client-signed venue call vs store-gated endpoint) → resolved: the tUSDC mint is a client-signed venue call, ungated, zero-env-safe; our gates apply only to endpoints we sponsor. AD-7/EXPERIENCE/PRD §12 aligned.
11. DESIGN says one toast, EXPERIENCE says max 3 → single-toast queue wins; EXPERIENCE patched.
12. "Urgent under 60s" makes the 60s cadence permanently urgent, violating the one-glow law on the demo's flagship lane → urgency now `min(60s, intervalSec × 0.4)`; glow confined to the hero/active card. FR-7 + DESIGN + UX-DR14 patched.
13. OQ-9 (MCP server) had no downstream closure point → mandatory decision line added to Story 9.5's submission checklist.
14. sprint-status key for Story 1.4 truncated at 64 chars → story title shortened; tracking regenerated.
15. Allowance law only specified for the venue spender; EventVault/ParlayReserve approvals undesigned → generalized to a spine convention (every first interaction with a new spender absorbs its approval); Stories 6.2/6.3/7.3 ACs extended.
16. FR-32's "1–2 strategies incl. market-making" vs FR-29's one-grant cap vs the epics' maker-as-house-actor → resolved: v1 ships exactly one subscribable Strategy (oracle-follow); the maker is a disclosed house actor with ops-health visibility, no card. FR-32/FR-29 noted.

## Edge-case findings (37 — all folded into story ACs)

Clock-skew phase basis · missing-successor windows · faucet refusal states · STT sufficiency (not just nonzero) · allowance shortfall on later bets · pending-print betting rule · thin/one-sided book quotes · band-edge inclusivity (2%/97% edges in) · no-digest timeout reconciliation · buffer clamp outside interpolation range · both-sides verdict stamping · wallet-switch mid-session · take-the-other-side on dead windows · composing takes in the buffer · partial-fill backed badges · OG render fallback card · no-mark positions · partial close-early · waitlist self-ref/duplicate-join guards · stop-check auth binding · reservation release on revert/partial fill · stop-check fail-closed on ops outage · LLM-failure fallback · deposit+grant atomicity · two-tab session-key lock (Web Locks) · cleared-IndexedDB orphaned grants · never-ticked runner health state · void parlay legs · permissionless voidAfterGrace · duplicate-market legs refused · relayer-down wallet-gas fallback · fee-flip re-sign flow · TG unlink/relink · confirm expiry + cost re-echo · expired-grant refusals · watcher backfill cursor.

## Structure findings (epics.md — applied)

Citation legend extended to every form the ACs use (canon #n, addendum §, UJ/OQ/SM-n, named conventions) + persona key · per-epic intros deduped against the Epic List (drift-proof: Epic 6's UJ tags and Epic 9's UX-DR21 claim already disagreed — map wins, UX-DR21 removed from Epic 9's entry) · requirements inventory bulletized; FR Coverage Map promoted to h2 and reduced to FR → Epic (annotations kept) · Additional Requirements given IDs (AR-1…AR-6) · component-anatomy restatements in 4.1/4.3/6.2 and claim rules in 8.1 replaced by citations · mega-**Then** chains split into **And** lines (1.8, 5.2, 6.1, 6.4, 6.5, 7.2, 7.3, 8.1) · cross-story references cite artifacts, not story numbers · frontmatter runMode line dropped.

## Prose findings (epics.md — applied)

18 recommendations + 12 minors: the misparse risks (1.11 "only", 3.4 verbless quote, 6.1 "deposits ledger", 8.1 adverb chain, 5.4 "prompting fire", 1.2 bare `components:` colon, 6.5 "golden-cross"), the ≥5-rounds gate ambiguity, term-drift alignments (expired-unfilled, empty-with-explanation, strike-0 = fixed-strike exclusion stated once), Glossary capitalization sweep (Take/Window/Side/Stake/Read/Ticket/Vault/Caps/Runner/Executor where the Glossary sense is meant; code literals stay lowercase), citation grammar normalized ("AD-9 entry point n", "PRD §12", "DESIGN.md §…"), 7.2 quote-vs-revert surface split, 8.4 "internal settlement event", 5.2 future-tense clause recast.

## What was already solid (no lens broke it)

The product thesis and scope decisions; the hexagonal one-port paradigm and the 16-AD set as a system; the FR/UX-DR/AD coverage chain (machine-verified, and no lens found a coverage hole); the honest-state/trust-moment UX contracts; the wallet-per-role and single-writer topologies; the golden-vector twin-runtime discipline; the readiness-gate PASS itself — the plan is implementable once these patches land.
