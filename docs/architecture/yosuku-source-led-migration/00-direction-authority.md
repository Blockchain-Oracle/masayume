---
title: Direction and authority
status: authoritative
decision_date: 2026-09-01
---

# Direction and authority

## Product decision

Masayume shall reproduce the current Yosuku product end to end and replace its Sui/DeepBook-specific substrate with Somnia/DreamDEX implementations. It shall add games without displacing Yosuku capabilities.

“Zuko,” “Zuku,” “Yuzuku,” and similar spellings in historical user notes refer to Yosuku.

## Authority order

When evidence conflicts, use this order:

1. The user's latest explicit direction.
2. This architecture package.
3. Current Yosuku source at the pinned commit, for product behavior and presentation.
4. Verified live Yosuku behavior, especially runtime, responsive, and authenticated states not obvious from source.
5. Current DreamDEX/Somnia source and official documentation, for protocol truth.
6. PIPS and Flicky source, for game mechanics and lifecycle patterns only.
7. `context/` research, as an evidence index.
8. Earlier BMAD artifacts, as historical evidence only.

An old PRD cannot overrule a later direct user decision.

## Pinned reference basis

| Reference | Pinned basis | Authority |
|---|---|---|
| Yosuku | `reference/yosuku`, `main`, `3c56ef52b78dae28cc198495f753480292f6a5ad` | User-visible product baseline |
| Live Yosuku | `https://yosuku.xyz` as inspected 2026-09-01 | Runtime/responsive corroboration |
| PIPS | `reference/pips`, `main`, `fe8f6963972ca18fc9db0fd9ee4db389e6293ee8` | Game selection, first-run, Lucky/Range/arcade mechanics |
| Flicky | `reference/flicky`, `main`, `56054baeb0c7f8ef6e039ebb0eed2b04e4f59388` | Duel, commit-reveal, scoring, recovery, matchmaking patterns |
| DreamDEX | local docs/SDK snapshot plus current official docs | Event Contract and CLOB truth |
| Somnia | current official docs and chain configuration | Network, account abstraction, realtime truth |

Before implementation begins, the builder must re-run the inexpensive upstream check. If Yosuku `main` moved, inspect the delta and update the pin deliberately; do not silently mix commits.

## Baseline strength

Yosuku is an **exact minimum baseline**, not loose inspiration.

Exact applies to:

- route availability and navigation;
- feature breadth and user flows;
- onboarding, returning-user, recovery, and account behavior;
- visible states and transitions;
- design tokens, typography, layout, motion, assets, and theme behavior;
- mobile, tablet, and desktop behavior;
- content hierarchy and interaction patterns.

Source-first does not mean retaining Sui terminology or lying about DreamDEX. Protocol-dependent content is adapted to the real Somnia implementation while keeping the same product promise and level of completeness.

## Allowed changes

Only these deviation classes are pre-approved:

1. **Identity:** Yosuku becomes Masayume; Sui/DeepBook-specific names, icons, addresses, explorer links, and factual copy become Somnia/DreamDEX equivalents.
2. **Implementation substrate:** Move/Sui/DeepBook adapters and contracts become EVM/Somnia/DreamDEX adapters and Masayume-owned contracts/services.
3. **Additive games:** games become a first-class navigation and route family, designed in Yosuku's visual language.
4. **Truth corrections:** wording may change when the original claim would be false on the target stack. The target must explain the real guarantee rather than silently weakening it.

Changing the palette, type system, layout, information architecture, onboarding order, product voice, or feature set requires a new explicit user decision.

## Classification vocabulary

- **Exact:** source-led port with the same presentation and behavior; brand text may be substituted.
- **Adapted:** same user-facing product promise backed by different real infrastructure.
- **Additive:** new game or Somnia-native capability that coexists with the baseline.
- **Blocked:** evidence or a required primitive is genuinely unavailable; blocker and resolution are explicit.
- **Excluded:** requires an explicit user decision. There are currently no approved user-visible exclusions.

“Later in the implementation sequence” does not mean optional or excluded.

## No-substitution rules

- Do not replace live odds, balances, positions, fills, payouts, activity, settlement, agents, opponents, or ranks with hardcoded values.
- Do not retain a visual control whose promised action is not implemented without a truthful state explaining what is missing.
- Do not rename a weaker property to sound like the stronger reference property. Link-private is not anonymous; sponsored is not inherently gasless; relayed is not automatically non-custodial; realtime projection is not source of truth.
- Do not recreate source-available UI from memory or screenshots.
- Do not remove a feature because DreamDEX lacks it natively. Give it a Masayume-owned capability design.

## Source and provenance gaps

Two facts need owner resolution before direct code/asset reuse by an external agency:

1. Yosuku's README claims native Expo iOS/Android parity, but the current public checkout contains no native mobile source. Responsive web behavior remains authoritative. Native implementation requires the missing repository/build or a separately approved reconstruction.
2. Yosuku displays an MIT badge but the current root checkout contains no `LICENSE` file. PIPS and Flicky also lack clear root license grants. Record ownership or permission before copying code or assets. This is a provenance gate, not permission to reduce product scope.

## Deliverable boundary

The architecture and parity documents are the deliverables of this task. The later builder owns implementation planning and code. Tests are not a separate product deliverable: use only targeted checks needed to understand uncertain logic, avoid financial mistakes, or establish that a visible flow works.
