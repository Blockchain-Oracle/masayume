---
title: Masayume source-led Yosuku migration
status: authoritative
approved: 2026-09-01
scope: product architecture and implementation handoff
---

# Masayume source-led Yosuku migration

This package is the current product and architecture authority for Masayume.

Masayume is the Yosuku product experience migrated from Sui/DeepBook Predict to Somnia/DreamDEX, renamed, and expanded with first-class games. Yosuku is not an inspiration set. Its current source and verified live behavior are the minimum user-visible baseline.

## Read order

1. [00-direction-authority.md](00-direction-authority.md) — what is authoritative and what may change.
2. [01-reference-parity-manifest.md](01-reference-parity-manifest.md) — required routes, flows, states, design, and responsive behavior.
3. [02-target-architecture.md](02-target-architecture.md) — target boundaries, signing model, data truth, realtime, and performance.
4. [03-feature-adaptation-ledger.md](03-feature-adaptation-ledger.md) — how every Yosuku capability becomes real on Somnia/DreamDEX.
5. [04-game-system.md](04-game-system.md) — first-class PIPS/Flicky-derived game architecture inside the Yosuku product language.
6. [05-migration-and-agency-handoff.md](05-migration-and-agency-handoff.md) — implementation order and non-negotiable handoff rules.
7. [06-game-architecture.md](06-game-architecture.md) — Stage 6's executable proposal, research decisions, data/realtime/contracts and dependency-ordered slices.

## Governing decision

- Preserve every user-visible Yosuku route, feature, flow, state, color, type style, layout, motion, onboarding step, and responsive behavior.
- Allowed deviations are the Masayume name and identity text, Somnia/DreamDEX implementation truth, and additive first-class games.
- A protocol difference requires an adapter, Masayume-owned contract/service, or an honest blocked state. It does not authorize feature removal or fake behavior.
- Games inherit Yosuku's shell and design language. PIPS and Flicky contribute mechanics and lifecycle patterns, not a replacement visual identity.

## Superseded direction

The earlier BMAD PRD, UX, visual design, epics, and architecture remain historical research and implementation evidence. Their scope cuts, “patterns not pixels” ruling, gold/dark-only theme, and Yosuku drop lists are superseded. They must not be used to make current product or UX decisions.

Useful existing engineering invariants are explicitly retained in the target architecture rather than accepting or rejecting the old package wholesale.

## This documentation task does not authorize

- application or contract implementation;
- deleting historical specifications;
- replacing existing user-owned working-tree changes;
- deployment, publication, submission, or live financial operations.

Test-suite production, coverage targets, and fixture systems are not project deliverables. Builders may use small targeted checks, builds, and manual observation to gain implementation confidence, but they must prioritize the complete working product and the user's end-to-end review.
