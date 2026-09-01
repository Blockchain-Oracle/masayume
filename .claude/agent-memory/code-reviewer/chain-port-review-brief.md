---
name: chain-port-review-brief
description: How the team lead wants packages/markets + packages/core (chain port) reviews framed and reported
metadata:
  type: feedback
---

Chain-port reviews are judged against two binding docs and reported as a ranked top-5 with `file:line` + one-line fix each, plus a one-line "clean" verdict per dimension the lead names. No nitpicks or style-only items.

**Why:** the lead runs reviews per story against the architecture spine (`_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md`, esp. AD-1/2/3/6/14 + Consistency Conventions) and the protocol gotcha canon (`_bmad-output/planning-artifacts/prds/.../addendum.md` §D, 17 rules). The dimensions they ask for every time: (1) float arithmetic on money/prices crossing a boundary (AD-2), (2) reads that return 0/null on a failed fetch instead of Reading error/stale (AD-6), (3) state keyed by pool instead of marketId, unscoped getCandles/getFills, question-text parsing, hardcoded decimals/venue ids (canon #3/#13/#17), (4) duplication between core and the adapter mappers, (5) files that would benefit from a split or constant extraction. Owner style: files <= 400 lines, reusable functions, constants extracted, comments only for constraints code can't show.

**How to apply:** read the spine sections and canon first, verify SDK signatures against the real .d.ts ([[sdk-types-location]]), then rank by impact/effort. If a dimension is clean, say so in one line rather than padding the list.
