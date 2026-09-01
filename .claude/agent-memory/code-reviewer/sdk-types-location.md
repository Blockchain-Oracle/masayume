---
name: sdk-types-location
description: Where @somnia-chain/markets-sdk .d.ts files actually live (pnpm-hoisted, not under packages/markets/node_modules)
metadata:
  type: reference
---

The SDK type declarations are NOT at `packages/markets/node_modules/@somnia-chain/markets-sdk/dist/` (that glob returns nothing). pnpm hoists them to the repo root:

`node_modules/.pnpm/@somnia-chain+markets-sdk@<version>_.../node_modules/@somnia-chain/markets-sdk/dist/`

Find them with Glob `**/node_modules/@somnia-chain/markets-sdk/dist/**/*.d.ts` from the repo root. Most useful files: `somniaMarketsClient.d.ts` (client surface), `markets.d.ts` (BinaryMarket, MarketOnchain, MarketFees, list filters), `derivedReads.d.ts` (quote kernels, BinaryCrossingParams), `binary/portfolio.d.ts`, `binary/settlement.d.ts`, `hooks.d.ts`, `queryKeys.d.ts`. Grep a single file to avoid the very long path prefix in output.

**How to apply:** when a review needs to verify an SDK call signature or field semantics, go straight to this path instead of the package-local node_modules. See [[chain-port-review-brief]].
