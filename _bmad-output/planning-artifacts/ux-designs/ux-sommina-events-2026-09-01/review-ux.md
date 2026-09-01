# Consolidated UX Spine Review — Masayume

- **DESIGN.md:** `_bmad-output/planning-artifacts/ux-designs/ux-sommina-events-2026-09-01/DESIGN.md`
- **EXPERIENCE.md:** `_bmad-output/planning-artifacts/ux-designs/ux-sommina-events-2026-09-01/EXPERIENCE.md`
- **PRD:** `_bmad-output/planning-artifacts/prds/prd-sommina-events-2026-08-31/prd.md`
- **Run at:** 2026-09-01
- **Lenses:** 1 Rubric coverage (validate.md Pass 1) · 2 PRD reconciliation · 3 Structure/prose (light)

## Overall verdict

**Strong.** The pair is an unusually clean contract: every one of the ~60 `{token.path}` cross-references in both spines resolves against DESIGN.md's frontmatter (zero broken references), all eight DESIGN.md body sections are present in canonical order, all eight EXPERIENCE.md required sections are present plus both required-when-applicable sections, and PRD reconciliation is near-total — every §6 surface homed, all six §7 trust moments spec'd, all nine UJs verbatim with climaxes, all six FR-bound states present. One **high** finding: the two spines (and DESIGN.md vs the PRD itself) contradict each other on whether the Stake input starts empty or pre-filled. Two **mediums**: DESIGN.md lacks visual rows for a set of components EXPERIENCE.md specifies behaviorally, and FR-27 badges have no behavioral home. Everything else is low.

---

## Lens 1 — Rubric coverage (validate.md Pass 1)

**Verdict: strong.** Findings: 0 critical · 0 high · 1 medium · 3 low.

### Spec compliance (design-md-spec.md)
- Frontmatter: all five token groups present (`colors` flat kebab-case hex — incl. 8-digit `scrim` alpha hex; `typography` nested with valid subsets; `rounded` with conventional `full: 9999px` and `DEFAULT`; `spacing` scale + named tokens; `components` mapping to values and `{path}` refs). All internal component-token references resolve. Extra metadata keys (`status`/`created`/`updated`) are outside the spec table but harmless.
- Body sections: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts — **all present, canonical order.** Contrast targets stated for load-bearing combinations (ink ~15:1, ink-secondary ~7.4:1 floor, gold 10.9:1).
- EXPERIENCE.md required sections: Foundation, Information Architecture, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows — **all present.** Required-when-applicable: Inspiration & Anti-patterns (triggered by the Yosuku reference — present) and Responsive & Platform (multi-surface — present). Invented sections (Trust Moments) earn their place (they are the PRD §7 contract).
- Sources frontmatter: all three paths (`prd.md`, `addendum.md`, `DESIGN.md`) resolve on disk.
- Visual reference coverage: `imports/` is empty; no `mockups/` or `wireframes/` exist — nothing to link, no orphans. N/A-pass.
- Flow coverage: all nine UJs carry named protagonist, numbered steps, a bolded climax beat, and a failure path. Complete.

### Broken token references
**None.** Every `{colors.*}`, `{typography.*}`, `{rounded.*}`, `{spacing.*}`, `{components.*}` reference in both files — including the nested `{components.reel-card.max-width}` and `{components.verdict-stamp.rotation}` — resolves to a defined frontmatter token by exact name.

### Findings
- **[medium]** **Component coverage gap: EXPERIENCE.md specifies behavior for components DESIGN.md gives no visual row.** EXPERIENCE Component Patterns rows with no DESIGN.md Components entry: *Cadence lanes, Plain-words view, Take composer, Baku dock (chat sheet), Parlay builder/slip, Strategy card, Ticker, Share card, Faucet card, Close-early control, Edge readout, Waitlist card, Landing sections, Toasts, Wrong-network banner, Session-key manager, Stats metric row.* Many compose cleanly from specced primitives (buttons, plates, inputs, badges) plus the color/type laws — but at least **Toasts, Ticker, Share card, Baku dock, Parlay slip, Strategy card, and Wrong-network banner** are visually distinct elements a downstream builder must invent. *Fix:* add compact rows (or an explicit "composes from primitives X+Y" note per component) to DESIGN.md Components.
- **[low]** **Orphan token:** `typography.body-strong` is defined in DESIGN.md frontmatter but referenced nowhere in either spine's prose or components. *Fix:* reference it (labels? emphasized body?) or drop it.
- **[low]** **DESIGN.md "Market card" has no dedicated behavioral row in EXPERIENCE.md** — its behavior is distributed across Cadence lanes ("every row shows live volume + trade count"), Hero Market (tap-to-load), and Reel card. Extractable, but a consumer grepping component names one-to-one misses it. *Fix:* one-line Market card row in Component Patterns pointing at the three carriers.
- **[low]** Two bare `[ASSUMPTION]` tags in DESIGN.md carry no stated content ("borders and tonal steps, not shadows. [ASSUMPTION]" in Elevation & Depth; the stamp-rotation line in Shapes). The tag convention elsewhere always states what is assumed. *Fix:* state the assumption or remove the tag.

---

## Lens 2 — PRD reconciliation

**Verdict: strong.** Findings: 1 high · 1 medium · 4 low.

### (a) §6 IA surfaces → EXPERIENCE.md homes — COMPLETE
`/markets`, `/reels`, `/portfolio`, `/portfolio/edge`, `/parlays`, `/vaults`, `/leaderboard`, `/` (landing), `/stats`, `/waitlist`, `/demo`, `/pitch`, `/dev/*`, Telegram bot — all present in the IA table with matching ring assignment and purpose. Chrome (ticker, pill nav, Baku dock on trade surfaces, global Claim plate) and the retired-routes-redirect / nothing-404s law both carried. No misses.

### (b) §7 Required trust moments — ALL SIX SPEC'D
Each has a behavioral + visual spec in the Trust Moments section with its FR anchor: (1) custody-rail proof diagram FR-38 (static-first, reused across landing/verify/TG); (2) capability receipt as proof FR-4/FR-36 (struck verbs, "No such function." kill-line); (3) claim Receipt as physical object FR-11 (cream-always, "Only you can cash out."); (4) worked-example sizing sentence FR-29 (live-recomputed at chosen size); (5) client-side provenance notes FR-20; (6) "Don't trust it. Click it." standing caption (never without a working link). Plus a `/dev` fixture requirement per asset (NFR-8). None shipped weaker than the PRD contract.

### (c) Nine UJs verbatim by ID with climax beats — COMPLETE
UJ-1 through UJ-9 all appear as Key Flows with **verbatim titles and IDs** and explicit climax beats matching the PRD's climaxes (Verdict stamp, in-place settle, "can't find a number the chain doesn't back," the talk-down, the truth-telling readout, escrow pays in full, pause-keeps-positions, receipt-in-chat, stats-match-chain). Failure paths match the PRD edge cases.

### (d) FR-bound states — ALL PRESENT
- Pending opening print (FR-7): dashed line + explicit label + suppressed distance readout — in State Patterns and Hero Market. ✓
- Backed-resting / backed-filled (FR-14): distinct provable badge states, visible cancelable escrow, "call stood, money never matched" terminal (PRD-verbatim). ✓
- Daily-Stop-hit (FR-24): all three betting surfaces refuse, server-authoritative, pre-hit headroom on the Ticket (UJ-4). ✓
- Settled-unclaimed: present — tagged **FR-16** in EXPERIENCE.md, not FR-11. This is defensible: FR-16's consequence carries "shows as claimable, not open"; FR-11's persistent-surface consequence is separately covered by the Claim plate row's "persistent badge until claimed." Coverage complete; no action needed (noting the tag differs from the review brief's mapping).
- Pools display (FR-5): headline = wallet spendable only; labeled pool rows; venue pool's spends-first behavior noted; never-conflated rule carried. ✓
- Between-rounds (FR-6): lane placeholder + next start + seconds-to-a-day copy scaling + pre-armed Reel tap (UJ-2). ✓

### Findings
- **[high]** **Stake input: "starts empty" vs "pre-filled" — DESIGN.md contradicts the PRD and EXPERIENCE.md.** DESIGN.md Components → Ticket: "Stake input in `{typography.data-lg}` **(user-owned, starts empty)**". PRD UJ-2: Ada "**sizes the pre-filled stake**"; EXPERIENCE.md UJ-2 step 2: "inline Ticket, **pre-filled Stake sized to her balance**". DESIGN.md's anatomy is unscoped, so as written it applies to the Reels inline Ticket too — a downstream builder will implement one of two behaviors. *Fix:* scope the rule — e.g., hero/markets Ticket starts empty; the Reels inline Ticket pre-fills a balance-scaled Stake (still user-owned/editable) — and state it in both spines identically.
- **[medium]** **FR-27 (Badges) has no behavioral home in EXPERIENCE.md.** DESIGN.md gives achievement badges a visual chip spec and the Waitlist card covers the Founder badge, but FR-27's testable consequences — every criterion computable from public data, no admin fiat, win-rate badges require a minimum settled-round sample — appear nowhere in Component Patterns, the Banzuke row, or Key Flows. *Fix:* a badge row (or a clause on Banzuke row) carrying the on-chain-derivable / min-sample / no-fiat rules.
- **[low]** **Glossary drift: "Claim plate" vs "Claim-all plate."** PRD FR-11 and EXPERIENCE.md's IA chrome line say "Claim-all plate"; EXPERIENCE.md's Component Patterns row and DESIGN.md's component say "Claim plate" / `claim-plate`. Same object, two names across (and within) the spines. *Fix:* pick one (PRD's "Claim-all plate" or record the shortening once).
- **[low]** **Glossary drift: "venue payout credit"** (EXPERIENCE Balance plate row) renames the PRD's "venue's per-pool vault balance." The rename actively serves the PRD's never-conflate-with-our-Vault rule (it removes the word "vault") — a good decision, but it is nowhere marked as a deliberate rename. *Fix:* one `[ASSUMPTION: UI label renames the venue's per-pool vault balance to avoid Vault conflation]` tag.
- **[low]** **Heading drift: "Stat / balance plate"** (DESIGN.md Components heading) vs `balance-plate` (frontmatter) vs "Balance plate" (EXPERIENCE.md). Extractable but not identical across sections. *Fix:* normalize the heading.
- **[low]** **FR-23's one-sided-book anchoring rule is not echoed in the Baku dock row.** The PRD requires the model to anchor to the single-quote bound (ask caps fair value / bid floors it) rather than a fabricated mid, saying so honestly when even that is unavailable. The Baku dock row carries grounding, sit-out, and blind-state but not this case; the Voice table's "we won't invent a mid" string covers Parlays only. Omission, not contradiction. *Fix:* one clause on the Baku dock row.

**Contradictions with FR consequences beyond the high finding: none found.** Checked every EXPERIENCE/DESIGN claim against FR-1…FR-40 consequences — quote discipline (350ms/12s/IOC/cadence-scaled cap = FR-8/9/NFR-5), claim math (net of chain-read fee, currently 0 = FR-11), gasless path (FR-3), session-key fallback (FR-4), admissibility example (98¢ blocked vs ~[2,97]% band = FR-8), post-only absorption (FR-14), OG/share conditional framing (FR-15), FIFO/loss-synthesis (FR-18/26), Runner health re-derivation (FR-32), parlay pricing at open on-chain (FR-33), Reserve refusals (FR-34), first-loss kill (FR-35), TG idempotency and echo-confirm (FR-37), Daily Stop cross-surface authority (FR-24) — all consistent.

---

## Lens 3 — Structure / prose (light)

**Verdict: adequate-strong.** Findings: 0 new high (the contradiction is filed under Lens 2) · 3 low.

- **[low]** **Duplicated rules that could drift** (currently consistent everywhere — flagged as maintenance risk only):
  - Countdown law ("gold under 60s; 'Settling…' at zero") stated **four** times: DESIGN.md Components → Countdown, DESIGN.md Do's and Don'ts, EXPERIENCE.md Component Patterns → Countdown, EXPERIENCE.md Interaction Primitives.
  - Quote lifecycle numbers (~350ms debounce / ~12s requote) stated **three** times: EXPERIENCE.md Ticket row, EXPERIENCE.md Quote-lifecycle primitive, EXPERIENCE.md Foundation (via NFR-5); also live in PRD NFR-5.
  - Stale-data law (last-good at full ink + warning tick; null ≠ 0) stated in DESIGN.md Do's and Don'ts, DESIGN.md balance-plate row, EXPERIENCE.md state machine, and EXPERIENCE.md Balance plate row — with four different wordings of the same rule.
  - *Fix (optional):* make one location canonical per rule and let the others cite it.
- **[low]** Grammar slip, still parseable: "cancels work from the app's own placement record first, then **sweep** the venue" (EXPERIENCE.md Interaction Primitives, resting-money bullet) — subject/verb mismatch. *Fix:* "then sweep**s**".
- **[low]** Unmarked assumption: "session cookie keeps returning users signed in ~30d" (EXPERIENCE.md Responsive & Platform → PWA) carries a concrete duration and an auth mechanism with no `[ASSUMPTION]` tag, unlike every other invented concrete. *Fix:* tag it.
- **Placeholder/TBD leakage: none.** No TODO/TBD/lorem/placeholder text; `[ASSUMPTION]` tags are the PRD-mandated convention, not leakage. **Unparseable sentences: none.**

---

## Summary counts

| Lens | Critical | High | Medium | Low |
|---|---|---|---|---|
| 1 — Rubric coverage | 0 | 0 | 1 | 3 |
| 2 — PRD reconciliation | 0 | 1 | 1 | 4 |
| 3 — Structure/prose | 0 | 0 | 0 | 3 |
| **Total** | **0** | **1** | **2** | **10** |

Broken token references: **0**. Missing required sections: **0**. Unhomed §6 surfaces: **0**. Missing trust moments: **0**. Missing/renamed UJs: **0**. Missing FR-bound states: **0**.
