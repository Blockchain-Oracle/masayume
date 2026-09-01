---
title: Migration and agency handoff
status: authoritative
audience: implementation agent or agency
---

# Migration and agency handoff

## Handoff objective

Implement Masayume as the complete Yosuku product experience on Somnia/DreamDEX, then add first-class games in the same product language. Do not begin by rescoping the product or designing another interface.

## Required start procedure

The implementation agent or agency should:

1. Inspect the current branch, worktree status, existing application behavior, and user-owned changes. Do not overwrite unrelated work.
2. Read this architecture package in order, beginning with `README.md`.
3. Use the general `reference-product-fidelity` skill.
4. Verify that `reference/yosuku` still matches the pinned current upstream commit. Review any upstream delta before updating the pin.
5. Run/inspect Yosuku and Masayume at desktop and mobile sizes; do not rely on summaries alone.
6. Inspect the exact Yosuku route/component/style dependencies for the first implementation slice.
7. Refresh changing DreamDEX, Somnia, wallet/account-abstraction, and Next.js facts from primary documentation. Use Context7 where available rather than relying on recalled APIs.
8. Read `web/AGENTS.md` and the repository's installed Next.js guidance before changing Next.js application code.
9. Enter Plan mode and produce an implementation plan that preserves every ledger row. Sequencing may be staged; scope may not be silently reduced.

If the agent disagrees with an architectural decision, it should present specific source or protocol evidence and the user-visible consequence before changing it. “Cleaner,” “faster,” or personal taste is not sufficient evidence for product drift.

## Migration method

Use a route-and-capability strangler rather than a theme overlay or a separate Yosuku clone.

For each route family:

1. Open the pinned Yosuku source route and recursively identify its live component, style, asset, provider and data dependencies.
2. Record the route in the parity ledger, including first-run, returning, failure and responsive behavior.
3. Port the source-led shell and pure presentation behavior.
4. Replace Sui-dependent imports with Masayume facade calls; do not scatter DreamDEX calls through components.
5. Implement or connect the real capability behind the facade.
6. Observe the route at relevant viewport sizes and exercise its primary flow.
7. Record any approved deviation and unresolved blocker.

Avoid a broad automated rewrite of Yosuku imports before understanding which modules carry product semantics. Avoid “temporary” replacement components that become a second design system.

## Implementation sequence

This order manages dependencies. It is not a cut list.

### Stage 0 — Authority and safety

- Establish a clean implementation branch/worktree without touching existing untracked `context/screens/` or `prompt.md`.
- Confirm source revisions and reuse/provenance authority.
- Create the working parity ledger from `01-reference-parity-manifest.md`.
- Mark the BMAD artifacts historical; do not derive new UI work from them.

### Stage 1 — Yosuku shell and identity

- Port root layout, themes, fonts, global styles, shell components, navigation, error boundary and responsive behavior from source.
- Replace the Masayume gold/Archivo theme completely rather than layering Yosuku tokens on top.
- Substitute the Masayume mark/name and Somnia chain identity without redesigning the shell.
- Connect external wallet and embedded/smart-wallet identity through isolated sessions.
- Preserve first-run, returning, disconnect, account-switch and recovery behavior.

Visible result: all baseline routes resolve inside the correct shell even where a capability still displays an honest connection blocker.

### Stage 2 — Shared market and transaction runtime

- Split the read-only DreamDEX runtime from isolated `SubmitterSession` instances.
- Normalize markets, books, candles, lifecycle and account readings once for all routes.
- Implement the common transaction lifecycle, error map, journal and reconciliation.
- Connect real funding, approval, quote, Up/Down, cash-out, claim and receipt paths.

Visible result: Markets, Reels, Fund, Claim and the market portions of Portfolio use the same real data and write pipeline.

### Stage 3 — Portfolio, social and public proof

- Complete Portfolio, Trader Edge, history, PnL, stats and leaderboard projections.
- Add Takes, rooms/comments, sharing, alerts, news/ticker and social identity.
- Complete real status, docs, how-it-works, demo and pitch content using current Masayume evidence.
- Preserve creators and studio route presentation while connecting the real profile/content layer.

### Stage 4 — Unified Trading Balance and delegated execution

- Implement `EventVault` and its owner-only withdrawal/grant model.
- Add embedded session trading and gas-sponsorship policy.
- Implement strategy registry/runner and agent/creator surfaces.
- Create and connect the official Masayume X account after the owner authorizes the live external action and supplies required credentials.
- Implement X OAuth linking, mention ingestion, deterministic parsing, bounded execution and receipt/recovery.

### Stage 5 — Product contracts around DreamDEX

- Implement and connect `ParlayReserve`.
- Implement and connect `RangeReserve`.
- Implement and connect `MarketMakerVault` for Earn.
- Implement the prefunded/capped leverage model.
- Implement the truthful private/link-reduction flow.
- Replace the Yosuku SVI content with the real DreamDEX market surface described in the feature ledger.

These routes remain part of the shell before their contracts are complete, but they must show a precise unavailable/dependency state rather than invented successful data.

### Stage 6 — First-class games

- Add Games navigation and Yosuku-native selection/account/menu surfaces.
- Establish shared game profile, settings, audio/haptics, achievements, history and resume state.
- Implement Practice and arcade modes with their economic nature labeled.
- Implement GameArena, deckmaster, matchmaker, isolated game sessions and settlement actor.
- Connect Ranked/Free Duel to real DreamDEX positions and GameArena receipts.
- Implement Lucky with auditable selection.
- Connect Range only after `RangeReserve` is real.

### Stage 7 — Coherence and performance pass

- Remove duplicated market/account streams across routes.
- Check hidden-tab work, heavy card mounting, fonts, motion, audio and game bundles.
- Reconcile every parity row and every route at mobile and desktop sizes.
- Replace stale Somnia/Yosuku claims with current verified wording.
- Present the complete product to the user for end-to-end acceptance.

## Definition of done for a route

A route is done when:

- it uses the pinned Yosuku source as its presentation basis;
- its brand/protocol changes are limited to approved deviations;
- every important identity, data, transaction, failure, recovery and responsive state is implemented;
- it reads real product data and submits through the real authority boundary;
- it shares account, balance, market and transaction truth with adjacent routes;
- no unapproved feature or control is missing;
- any unresolved target-platform difference is plainly visible and recorded;
- the user can review the end-to-end behavior.

“Page renders,” “happy path screenshot matches,” and “tests pass” are not substitutes for this definition.

## Verification policy

Testing is not a standalone deliverable for this project.

The builder should still make proportionate checks when they reduce real uncertainty:

- run the build/type checker after meaningful integration changes;
- use a small focused test for uncertain pure financial/state-machine logic when it is the clearest way to reason about it;
- inspect transaction receipts and actual fills for economic flows;
- manually exercise the changed route on desktop and mobile;
- confirm reconnect/recovery when the feature depends on long-lived state.

Do not create a broad coverage target, a parallel fixture product, or a large suite of tests merely to satisfy a process. Do not place new tests beside implementation files if the eventual builder/user establishes a separate test organization. The implementation plan should focus on the working product.

## No fake-data interpretation

The instruction not to use fake product state means:

- a live Masayume route cannot display invented market odds, balances, fills, payouts, users, agent results, leaderboard activity, opponents or settlements as if real;
- loading and unavailable states are valid product states;
- editorial examples in documentation must be labeled examples;
- Practice and arcade simulation are valid only because their no-stake nature is explicit;
- Yosuku's internal `/dev/*` component-review pages do not create a requirement for public mock routes.

## Agency decision log

Record a decision only when it affects user-visible parity, data authority, signing/custody, contract guarantees, or an unresolved source gap. Each entry contains:

- date and owner;
- reference evidence;
- current architecture rule;
- proposed change and reason;
- user-visible consequence;
- explicit user approval when it deviates from the baseline.

Routine file organization and implementation detail do not require user ceremony as long as they preserve these contracts.

## Handoff report format

At each meaningful handoff, report:

- branch/worktree and current runnable surface;
- pinned Yosuku reference commit;
- completed parity rows;
- current real integrations and their data authority;
- blocked rows and exact resolution needed;
- deviations approved by the user;
- next dependency-ordered slice;
- any live action still requiring authorization, including X account credentials, deployments or funding.

Never describe an unimplemented parity row as an optional stretch unless the user explicitly changes the baseline.
