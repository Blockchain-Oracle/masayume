# Input Reconciliation — UX Spines vs Architecture Spine

- **Input reviewed:** `ARCHITECTURE-SPINE.md` (draft, 2026-09-01) against `ux-designs/ux-sommina-events-2026-09-01/EXPERIENCE.md` + `DESIGN.md` (both final)
- **Question:** what do the UX spines require that the architecture drops or contradicts?
- **Reviewed:** 2026-09-01

## Verdict summary

The spine covers the UX contracts well at the money core (write pipeline, staleness envelope, grants, Daily Stop, error map). The drops cluster at the edges: the judge/trust ring of routes has no architectural home, the NFR-5 latency budget has no owner and one seed detail actively works against it, the market *lifecycle* (as opposed to market *data*) is not a domain type, AD-12's "declared once in `@theme`" is lossy for two of DESIGN.md's five token tiers, and the Telegram Verdict postback has no owning actor.

---

## (a) Performance envelope — p95 quote ≤1.5s, push-preferred (EXPERIENCE.md Foundation / NFR-5)

**Push-preferred: supported in principle.** AD-6's "watch-first from adapter subscriptions with visibility-gated polling as fallback" matches the UX law, and the Deferred section explicitly parks stream-adoption depth behind that seam. That deferral is legitimate — the seam is the architectural commitment.

**p95 ≤1.5s: not supported — no owner, and one contradiction.**

1. **No AD binds the latency budget.** The frontmatter binds NFR-1..10, but no invariant, convention, or test names the 1.5s quote round-trip. The Testing row (golden tests, forge tests, CI invariants script) contains zero latency checks. A budget nobody owns is a budget that gets spent: the UX quote lifecycle already commits ~350ms debounce + a fresh IOC re-quote *inside the click* (AD-3's "fresh quote → IOC"), so the architecture is stacking two quote round-trips into interactive paths without ever allocating the envelope.
2. **The seed's "quotes cache" server route contradicts the Ticket contract.** EXPERIENCE.md Ticket: "Quotes from the real book **for the actual size**." A shared server-side quotes cache (`web/` seed comment: "server routes (quotes cache, …)") cannot serve size-dependent, depth-dependent quotes without being keyed per (market, side, size) — at which point it caches nothing useful — and it inserts a Vercel hop into the one path with a hard p95. Either the quote path is client → port → RPC direct (and the "quotes cache" is only for anonymous surfaces like ticker/landing), or the spine must say what the cache is keyed by and what its TTL is relative to the ~12s requote. As written, the seed's most plausible reading is the slower, less honest one.
3. **Minor:** AD-6 routes push through TanStack Query v5, a pull-oriented cache. Feeding subscriptions into it (`setQueryData` from the adapter watch) is fine but is exactly the kind of mechanism worth one sentence, because "no component invents its own fetch loop" plus a pull cache is how push quietly degrades to polling in build.

**Fix shape:** an AD-6 sub-rule or convention row: quote reads are client-direct through the port (no server hop); the p95 ≤1.5s budget is named, allocated (debounce excluded, RPC + adapter mapping included), and measured by an instrumented dev check; "quotes cache" is renamed to what it actually serves.

## (b) Behavioral contracts needing server pieces the spine doesn't place

1. **Share-card / OG rendering is a chain-reading server surface, not "code-level."** The Deferred row waves off the "OG-image rendering stack" as no-divergence-risk. The stack choice is; the *route* isn't. EXPERIENCE.md requires: server-rendered images (1200×630, 1080×1920), **live probability read at render time**, settled targets rendering their Verdict state instead of a dead live-card, and popup-safe async rendering behind a synchronous share gesture. That makes the OG route a consumer of `packages/markets` on a server runtime, with four font faces (incl. Noto Serif JP subsetting) and settled-vs-live branching. It belongs in the web/ seed's server-route list and in the Capability map. Nothing currently places it.
2. **`/demo`, `/pitch`, `/dev/*` (the judge ring) are absent from the spine.** The seed's route comment and the Capability map cover neither. Two of these carry architectural properties, not just pages:
   - `/pitch` must be **self-contained with no live-data dependency** (EXPERIENCE.md: "so it can never break during judging"). That is an import-boundary invariant — `/pitch` must not import the chain port and must render with zero env — exactly the kind of rule the spine exists to state. Same for `/demo`'s tx-proof grid: its "real tx" hashes must be checked-in data, not live reads.
   - `/dev/*` fixtures are load-bearing for NFR-8 ("every trust-moment asset ships with a /dev Fixture page") and UJ-9's failure path, and **`/dev/doctor`** is a diagnostic surface that must probe RPC, indexer, ops actors, and DB — i.e. it touches AD-8's internal HTTP and the port's health. Neither the canned-fixture data's home (packages/core fixtures? web/fixtures?) nor doctor's probe surface is placed.
3. **Deep-link grammar and the routing law need one owner.** `?m=&dir=`, `/reels?m=`, `/waitlist?ref=`, `?baku=1` are fine as web/ code — but the routing law "a deep link into a dead Window resolves to its successor" requires a **successor-resolution query** (settled marketId → live successor for same asset+cadence) that no domain type or port capability names. See (d); it is the same missing concept.
4. **Stats provenance queries: covered in spirit, mechanism unstated.** The Capability map says "provenance = indexer queries named in UI," but AD-1 forbids the UI from touching the SDK/indexer directly — so the *query text itself* must cross the port boundary as data. The port needs a named-read surface (each read exposes its provenance string alongside `{value, asOf, stale}`). One sentence in AD-1 or AD-6 closes this; silence invites a hand-maintained query-text table that drifts from the real queries — precisely the un-fakeable-stats failure mode.
5. **Session-key manager surface: mostly covered.** AD-5's SESSION grant carries scope/Caps/expiry, and "spend so far" is chain-readable if EventVault enforces Caps on-chain (implied but worth stating: **cap accounting is contract state, not client bookkeeping** — otherwise "spend so far" is a client-local number wearing an on-chain costume). The manager UI itself is plain web/. Low risk.
6. **Minor, same family:** the faucet's mint mechanism (≤10,000/call, **anti-farm gated**) has a `faucet-ops` key in AD-4 but no contract in `contracts/` and no ops actor/route named for the gating logic; and the TG **linking page** (Trust Moment 1 lists it as a surface) is a web page that must reach the executor's link state via the internal HTTP path — neither placed.

## (c) DESIGN token pipeline — does AD-12's Tailwind v4 `@theme` carry DESIGN.md without loss?

**Three of five tiers carry cleanly; two do not.**

- **Carries:** colors → `--color-*`, spacing (incl. named `gutter`/`section`/`touch`) → `--spacing-*`, rounded → `--radius-*`, font families → `--font-*` (with the next/font-generated variables wired in — one line of care, not a gap).
- **Lossy 1 — typography roles are composites.** DESIGN.md's typography tokens are *roles* (`display`, `data-lg`, `stamp-hero`…) each bundling family + size + weight + line-height + tracking. `@theme` has no composite-role namespace; Tailwind expresses these as separate utilities. Carrying the roles faithfully requires a second declaration surface — `@utility text-display {…}` role classes (or equivalent) — which AD-12's "tokens declared once in `@theme` CSS" does not admit. Without naming that surface, builders will either flatten roles into per-property utilities scattered across components (forking the tokens — the exact thing AD-12 claims to prevent) or invent the surface ad hoc.
- **Lossy 2 — the `components` tier has no `@theme` home at all.** `ticket.cta-height: 52px`, `reel-card.max-width: 460px`, `verdict-stamp.rotation: -4deg`, ticker height 32px, and every per-component surface/border *mapping* (`ticket.surface → {colors.surface-1}`) are component-scope tokens. `@theme` namespaces don't model them; they must live as plain CSS custom properties or in the component modules. That's fine — but the spine must say where, or "no second kit / no forked tokens" is unenforceable for the tier that DESIGN.md and EXPERIENCE.md cross-reference most heavily (`{components.*}` citations appear in nearly every behavioral contract).

**Fix shape:** amend AD-12 to a three-layer pipeline with one source: `@theme` for scalar tiers, `@utility` role classes for typography composites, and a `components.css` custom-property block (values only via `var(--color-*)` etc.) for the component tier — all generated or hand-derived from DESIGN.md frontmatter as the single source of truth.

## (d) State patterns — UX states the spine's data shapes can't represent

1. **Market lifecycle is not a domain concept.** EXPERIENCE.md's named states — **pending opening print** (dashed line, distance suppressed), **between rounds** (with next Window's start), the **no-entry buffer** (Ticket auto-advance trigger), settling, settled, void, **settled-unclaimed** (claimable, out of live PnL) — form a phase machine every core surface renders. The spine's domain types (`EventMarket`, `Quote`, `OpenPosition`, `ClosedTrade`, `LedgerRow`) name none of it. Two concrete absences:
   - a **market phase enum** on `EventMarket` (incl. opening-print-pending as an explicit variant, so "never a guessed level" is type-enforced rather than a null check someone renders as 0 — the exact null→0 class of lie AD-6 exists to kill);
   - a **successor/schedule capability** on the port: "next Window's start" (between-rounds), "pre-armed next Window" (UJ-2's never-dead tap, Ticket auto-advance keeping Side+Stake), and the routing law's dead-deep-link redirect all need *settled/dead Window → live successor* resolution. No read named in the spine answers it.
2. **The two envelopes don't compose into the Error state.** Conventions define Result `{ ok, value | error }` and staleness `{ value, asOf, stale }` separately. But EXPERIENCE.md's Error state mandates **typed diagnosis + last-good data retained simultaneously** ("last-good rows stay… totals carry the staleness tick"). Neither shape alone represents "failed, with retained value and a diagnosis"; the spine should define the unified read envelope (`{ value?, asOf?, stale, error? }` or equivalent) once, or every surface will improvise the composition differently — the "ad-hoc last-known-good caches that disagree" AD-6 names as its own threat.
3. **Covered well, for the record:** the write-path lifecycle (Composing→…→Unknown-with-digest) maps cleanly onto AD-3's journal-before-send + digest-counts-as-submitted + book-from-receipt; Daily-Stop-hit onto AD-9; six-state Loading/Empty distinctions are renderable client-side once (2) is fixed.

## (e) Telegram rail conventions vs the ops executor design

**Covered:** confirm-before-execute and refusals-name-the-cause ride AD-3 + AD-13; idempotency has the right substrate (AD-8 local intent journal + AD-3 journal-before-send — the dedup key being Telegram message/update id is a code-level detail); same-person-same-limits is exactly AD-9; the capability receipt on link is AD-5's EXECUTOR grant + `tg_links` receipt state.

**Gaps:**

1. **Verdict postbacks have no owning actor.** "Stamp line + Receipt link when the Window settles" requires someone to *watch settlements for every linked user's open bets and push*. The ops roster (seeder-maker, runner, relayer, tg-executor, claim-sweeper) assigns settlement-watching to nobody; the executor as listed is request-driven (bet by message), not a settlement subscriber. Name it — an executor sub-loop or the claim-sweeper emitting settlement events the executor consumes — because unowned push jobs are the ones that silently don't exist at demo time.
2. **The Receipt link crosses the web/ops boundary.** Postbacks (and refusal messages: "change it in the app: <link>", deposit links) embed web URLs constructed inside ops. No convention owns URL construction (base URL config + the deep-link grammar from (b)3 shared as a core helper). Left unstated, ops hand-formats URLs that drift from web routes — a routing-law violation delivered straight into users' chats, where stale links can't be redirected.
3. **Minor — echoed-cost discipline:** the bot echoes "exact cost… confirm?", but AD-3 re-quotes fresh at execution. The pipeline's IOC cost cap can honor the echo (cap = echoed cost → worse fill becomes an honest refusal + re-echo, mirroring the web's "shows the new cost before placing") — but only if the executor is required to set the cap from the echoed figure. One sentence makes the mirror-of-web law load-bearing instead of accidental.

---

## Top gaps (ranked)

1. **Judge/trust ring unplaced** — `/demo`, `/pitch` (self-containment is an import-boundary invariant, not a page), `/dev/*` + `/dev/doctor`, and the OG/share-card route (a chain-reading server surface misfiled as "code-level"). (b)
2. **NFR-5's p95 ≤1.5s has no owner, and the seed's "quotes cache" server route contradicts size-specific real-book quotes** — the one hard latency budget in the product is unallocated, untested, and the seed's most plausible quote path adds a hop. (a)
3. **Market lifecycle missing from the domain** — no phase enum (pending-print, between-rounds, no-entry buffer, settled-unclaimed) and no successor-Window resolution capability, which the Ticket auto-advance, pre-armed Reels taps, and the dead-deep-link routing law all require. Plus: the Result and staleness envelopes don't compose into the Error-with-last-good state. (d)
4. **AD-12's "declared once in `@theme`" is lossy for typography roles and the entire `components` token tier** — the tier the UX spines cite most; without a named home, the no-fork rule is unenforceable. (c)
5. **Telegram Verdict postbacks unowned** — no ops actor watches settlements to push them, and web-URL construction inside ops has no shared convention. (e)
