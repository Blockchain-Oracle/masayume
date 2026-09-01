# Rubric-Walk Review — ARCHITECTURE-SPINE.md (Masayume)

- **Target:** `_bmad-output/planning-artifacts/architecture/architecture-sommina-events-2026-09-01/ARCHITECTURE-SPINE.md` (status: draft, 2026-09-01)
- **Driving PRD:** `_bmad-output/planning-artifacts/prds/prd-sommina-events-2026-08-31/prd.md` (§5 FR-1…FR-40, §11 NFR-1…NFR-10, §12 guardrails)
- **Rubric:** (1) fixes the real divergence points for epic/story generation and misses none; (2) every AD Rule is enforceable and prevents its stated divergence; (3) nothing in Deferred can let two units diverge; (4) Capability→Architecture Map covers FR-1..FR-40 with no ungoverned FR; (5) every altitude-owned dimension is decided, deferred, or an open question — especially the operational/environmental envelope. Plus: mermaid validity.
- **Date:** 2026-09-01

## Verdict

**Conditional pass.** This is a genuinely good spine on the domain axis: the paradigm is committed and directional, AD-1/AD-3/AD-5/AD-7 kill the four biggest divergence machines in this product (chain access, write safety, delegation custody, data authority), the Deferred list is clean, the map covers all 40 FRs, and both mermaid blocks are valid (verified by rendering with mermaid-cli). It does not yet pass rubric items (1) and (5): two real divergence points for the story level are missed — caller identity for wallet-keyed server writes, and the execution locus of the write pipeline (which also hollows out AD-9's enforcement claim) — and the operational envelope is only half-decided (alerting, backup posture, env/deploy pipeline silent). Patch the findings below before generating epics; none require redesign, all are additive.

---

## Findings

### F1 — HIGH — Caller identity for wallet-keyed server writes is undecided (missed divergence point)

Every DB entity the spine names is keyed by wallet and written via web server routes: `takes (author, …)`, `daily_stops (wallet, …)`, `baku_memory (wallet-keyed facts)`, `tg_links (tg id ↔ wallet)`. No AD and no Consistency Convention decides **how a server route verifies the caller controls that wallet** — SIWE session, per-request signature, or trust-the-claimed-address. Four separate epics hit this independently (Takes FR-14, Baku memory FR-25, Daily Stop FR-24, Telegram linking FR-36 with its capability receipt), which is the textbook setup for four divergent inventions. It is also a correctness hole, not just a consistency one: AD-9 declares the Daily Stop "server-authoritative," but with no identity proof any caller can read or reset another wallet's stop — the authority is decorative. The same gap appears one layer down: AD-8 says web calls ops via "authenticated internal HTTP" without deciding the scheme (shared bearer from env? mTLS? signed payload?).

**Fix:** add one AD ("one identity proof"): the single mechanism by which a wallet proves itself to server routes (and the FR-36 link flow reuses it), plus one sentence naming the web→ops auth scheme. Both are one-decision items; leaving them to stories guarantees divergence.

### F2 — HIGH — Execution locus of the write pipeline is ambiguous; AD-9's web enforcement point doesn't exist in the seed

AD-3 and AD-9 both bind a "web ticket API" as a chain-write entry point. But per the spine's own rules, user bets are signed by keys the server never holds: the user's wallet (wagmi) and the SESSION grant's "browser-held ephemeral viem key (IndexedDB)" (AD-5), while AD-8 forbids web signing with house keys. And the Structural Seed's `web/` comment lists server routes "quotes cache, takes, baku, stats" — **no ticket/bet route**. So either (a) `Submitter` is isomorphic — runs in the browser for user/session keys and in ops for house keys — and the "web ticket API" is a guard/quote step, not a write path; or (b) bets proxy through a server API, which contradicts the seed and the key topology. The spine never says which. Two story authors will diverge exactly here (one builds a server betting endpoint, one client-signs through the port). Consequence for AD-9: for client-signed bets there is **no server chokepoint** — the Daily Stop check on the web side is honest-UI-level enforcement (the server can refuse a quote, not block a tx). That is a defensible v1 posture for a product-safety (not security) control, but the spine must say it out loud; "checked by every betting entry point" currently overclaims.

**Fix:** one paragraph in AD-3: `Submitter` runs wherever its signer lives (browser for user/session keys; ops actors for house keys); name the ticket-path server involvement (quote + guard endpoint) in the seed; restate AD-9 as "server-checked at every server-mediated entry point (ticket guard endpoint, executor); client mirror advisory — enforcement is app-surface, not chain-level."

### F3 — MEDIUM — NFR-8's judge-proofing surfaces have no governed home

The frontmatter binds NFR-1..NFR-10, but NFR-8's concrete deliverables — `/dev` fixture pages for every card/receipt/modal state, the `/dev/doctor` preflight (config echo → venue resolve → wallet gas/collateral → per-market status/book), README real-tx links — appear nowhere in the spine (grep: zero hits for "dev", "doctor", "fixture"). `/dev/doctor` is genuinely cross-unit: it needs port reads (markets), wallet checks, and config echo, and could plausibly be built in web or in ops. For a hackathon judged on verification, this is a fifth of the product's proof story with no owner. The bot-kit test harness half of NFR-8 *is* covered (Testing convention row) — it's the runtime surfaces that are homeless.

**Fix:** add a map row (e.g. "Judge-proofing surfaces (NFR-8) | web `/dev` routes + markets diagnostics | AD-1, AD-6, AD-13") and name `/dev` in the seed's `web/` comment.

### F4 — MEDIUM — Operational envelope half-decided (rubric item 5's named hole)

What **is** decided: infra providers (Vercel / Railway / Neon — named in diagrams and stack), secrets locus (house keys only in ops env, LLM key server-side, one zod `env.ts` per deployable), logging shape (structured why-strings), CI (network-free invariants script). What is **silent**:

- **Alerting/monitoring consumer.** `runner_heartbeats` is written, but nothing decides who reads it or what happens when it goes stale. SM-3 requires ≥200 settled positions of real community use before submission — if the seeder-maker or oracle-follow runner dies on day 2 of that window, the current spine has no mechanism by which anyone notices. Even a one-line decision ("ops status surface at `/dev/doctor`; Telegram DM to Abu on missed heartbeat") closes it.
- **Backup/durability posture.** Derivable from AD-7 (money recomputable from chain; social/ops data losable — FR-25 even licenses losing Baku memory) but never stated. `daily_stops` is the edge: losing it silently weakens a §12 safety control mid-day. State the posture explicitly ("Neon default backups; no app-level backup; acceptable-loss classes per table") so a story author doesn't invent an export job — or skip one that mattered.
- **Environments & deploy pipeline.** Presumably one env (Shannon testnet) plus Vercel previews — unstated. More importantly, AD-10 implies but doesn't operationalize the cross-unit redeploy workflow: contract deploy → regenerate addresses module → rebuild/redeploy web *and* ops in lockstep. Two deployables consuming one generated module across two hosts is exactly a two-unit divergence (ops trading against yesterday's EventVault). One ordering rule closes it.

### F5 — MEDIUM — §12's cost/abuse controls have no store, and the zero-env law makes them degrade *open*

PRD §12 binds two controls the spine never places: (a) LLM spend bounded per-user/per-day with degradation to model-only numbers; (b) per-device + per-account anti-farm gates on every sponsored/drip endpoint (the PRD cites the reference faucet farmed at ~20 tx/hour). Neither has a DB entity, an AD, nor a map mention (grep: zero hits for budget/anti-farm/per-device). Worse, AD-7's zero-env law says *every* store is optional at runtime with graceful degradation — but a rate limit or budget that degrades to *absent* under no-DB is an adversarial hole, not graceful degradation. These two controls need the opposite default: **degrade closed** (sponsored/drip endpoints disabled, Baku budget floor applied) when their store is absent.

**Fix:** add `llm_budget`/`sponsor_grants` (or equivalent) to the entity list, bind them under AD-7 with an explicit degrade-closed carve-out to the zero-env law.

---

## Rubric walk detail

### (2) AD-by-AD enforceability

| AD | Enforceable? | Prevents its divergence? | Notes |
| --- | --- | --- | --- |
| AD-1 one chain port | Yes — import rule, CI-checkable ("address/SDK drift" is already in the CI convention) | Yes | Clean. |
| AD-2 integer money | Yes — `bigint` end-to-end is type-checkable; "float on money is a defect" is review-enforceable | Yes | **Nit N1:** internal tension — decimals "read from chain once at adapter init" but "live only in `packages/core/units`", while the conventions forbid global mutable state in core. Either `core/units` is parameterized and `markets` holds the fetched value, or state the init-time exception. One sentence. |
| AD-3 one write pipeline | Yes — single `Submitter`, canon bound in one place | Mostly | See F2: pipeline is unified, but *where it executes* is not, and that is the divergence stories will actually hit. |
| AD-4 wallet-per-role | Yes — checked-in registry | Yes | **Nit N3:** say the registry checks in role → *address + env-var name*, never key material (AD-8 implies it; one word prevents a story committing keys). |
| AD-5 unified grants | Yes — contract-level; resolves OQ-5 with the constraint trail (no 7702, no operator registry) stated | Yes | Good — the strongest AD in the document. Note it silently fixes FR-4's funding surface to the Vault (the PRD's flagged fallback); FR-5's labeled-pools consequence should be cited in the Ticket/Portfolio epics. |
| AD-6 staleness type | Yes — envelope type + "no component invents its own fetch loop" | Yes | Clean. |
| AD-7 optional Postgres | Yes — zero-env CI run enforces it | Yes, **except** F5's degrade-open hole for abuse/cost controls. | |
| AD-8 single ops service | Yes | Yes | "Authenticated internal HTTP" scheme undecided → folded into F1. |
| AD-9 server-authoritative Stop | Partially | **Overclaims** — see F2/F1: no identity proof + no server chokepoint for client-signed bets. | Restate honestly. |
| AD-10 one address module | Yes — generated module, named forge tests | Yes | Deploy-ordering workflow missing → folded into F4. |
| AD-11 attribution hook | Yes — trivial | Yes | Fine. |
| AD-12 shadcn + DESIGN.md skin | Yes | Yes | Resolves the EXPERIENCE.md deferral as claimed. |
| AD-13 one error map | Yes | Yes | Clean; pairs correctly with NFR-10's out-of-STT trap. |

### (3) Deferred sweep — clean

All seven deferrals verified single-owner or genuinely code-level: Cap/risk numbers (numbers bank is the single source); streams-vs-poll depth (AD-6's seam confines it to the adapter/query layer); OQ-10 (localized behind the port by construction); OQ-9 MCP (a second port consumer — correctly costless); indexer-vs-logs (adapter-internal, and NFR-4 already bounds the money-figure cases); PWA/OG/CSV (single consumers, no cross-unit surface); mainnet path (carried by AD-2 + AD-10 as claimed). **No deferral can let two units diverge.** Note the spine's real deferral risks turned out to live outside the Deferred section (F1, F2, F5 are silences, not deferrals — which is exactly why they're findings).

### (4) Capability→Architecture Map — FR coverage complete, one row inaccurate

All of FR-1..FR-40 appear: ranges 1–5, 6–11, 12–15, 16–20, 21–22, 23–25, 26–27, 28–32, 33–35, 36–37, 38–39, plus FR-40 (Portfolio row) and dual rows for FR-4 (session keys) and FR-24 (Daily Stop). **No orphan FR.** NFR coverage is complete except NFR-8's runtime surfaces (F3). **Nit N2:** the Onboarding row (FR-1…5) says "web + markets" only, but FR-3's gasless claim path runs through the relayer worker — an ops actor bound by AD-8, with keys under AD-4 and batch-allowlist validation under NFR-7. The row should read "web + markets + ops (relayer) | AD-1, AD-2, AD-6, AD-13; AD-4/AD-8 + NFR-7 for the sponsored path."

### (5) Dimension sweep

Decided: paradigm/structure, chain access, write safety, money representation, custody/delegation, key topology, persistence & data authority, client state/fetching, UI kit & tokens, error handling, testing, config, logging shape, CI, infra providers, stack versions. Deferred (legitimately): tuning numbers, push-depth, OQ-9/OQ-10, indexer-vs-logs, mainnet. **Silent (findings):** app-surface identity/auth (F1), write execution locus (F2), judge-proofing surfaces (F3), alerting/backup/env-pipeline (F4), cost/abuse control stores (F5).

### Mermaid — both valid

Both blocks extracted and rendered successfully with `mmdc` (mermaid-cli, real mermaid parser, via headless Chrome): the layer-map `graph TD` (including the dotted labeled edge `-. "generated addresses module" .->`) and the deployment `graph LR` (including the space-titled `subgraph Somnia Shannon 50312` and the quoted edge label with parentheses). No syntax errors.

---

## Nits (roll into the same edit pass)

- **N1** — AD-2 vs "no global mutable state in core": resolve the decimals-at-init tension (see table).
- **N2** — Onboarding map row omits the ops/relayer leg of FR-3 (see §4).
- **N3** — AD-4: "checked-in role registry" should say addresses/env-var names are what's checked in.
- **N4** — AD-9's degradation clause ("per-browser with the honest label") is good; after the F2 restatement, keep the label language pointing at EXPERIENCE.md rather than duplicating copy.

## Recommended patch order

1. F1 — add the identity AD (unblocks Takes, Baku, Daily Stop, TG-link epics simultaneously).
2. F2 — one paragraph in AD-3 + AD-9 restatement + seed line.
3. F5 — degrade-closed carve-out + two entities.
4. F3 — one map row + one seed mention.
5. F4 — three sentences (alerting consumer, backup posture, deploy-ordering rule).

Nothing above changes an existing decision; the spine's committed structure survives all five patches intact.
