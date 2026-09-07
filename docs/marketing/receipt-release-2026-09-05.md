# Receipt release — 5 September 2026

Source verification completed on 5 September 2026. This page records the code checks; deployment identifiers and public checks are recorded separately in the docs repository evidence. No synthetic trade or X mention is used to test the live executor.

## Changes

- Clear state headings, line breaks, safe refusal copy and complete clickable transaction links.
- Actual booked cost, quantity, average price and resolved Window details retained separately from requested stake.
- Deterministic branded PNGs with licensed bundled fonts; essential facts remain in plain text.
- Atomic mention claims and a durable reply queue. Media failure falls back to text; ambiguous posting never automatically retries.
- Independent delivery loop and outer deadlines, so media work does not hold the financial poll's busy gate.
- Known transaction hashes retained through receipt and local bookkeeping errors.
- Inherited JavaScript properties cannot become parser asset/side tokens.
- In-app receipts label actual cost Spent and requested budget Requested, preserving tiny values.

## Verification

All 924 repository tests passed across 63 files. Workspace typechecks, all 14 invariants and the Next.js production build passed. The ops Docker image built successfully; a network-disabled container rendered a 1200 × 600 PNG with the bundled fonts and Sharp. No actor or signer was started in that check.

Twelve disposable Postgres integration checks passed, including concurrent claims, rollback, competing workers, expired leases, terminal states, repeated migration, historic rows and exact detail round-trips. This caught and fixed double JSON serialization that would otherwise lose booked amounts. The temporary container was removed.

Run the isolated database check with `pnpm exec tsx packages/db/scripts/test-x-reply-delivery-postgres.ts`. It creates its own loopback database and never uses the caller's DATABASE_URL.

The six DEMO previews were reproducible and visibly marked as fixtures; they were moved to local, ignored authoring material on 7 September. The [runtime renderer and its tests](../../services/ops/src/actors/x-relay/reply-card.test.ts) remain tracked. Actual receipt-component fixtures with the real CSS were checked at 320, 390 and 1280 pixels; they include tiny amounts, historical rows, long instructions and long reasons, with no content overflow. Unit tests mock transport and signing; they do not post or trade.

## Boundaries

The owner completed the X profile work. The assistant did not publish marketing drafts, pin a post, schedule a campaign or create a live trade for testing.

This release preserves Rettiwt's existing account-session transport. It does not implement an official API migration or media alt metadata. The platform-policy limitation remains documented in the [operator guide](../../services/ops/src/actors/x-relay/README.md).

A process crash before the final receipt is stored can leave a claimed submitted row without durable transaction association. It is never executed again automatically, but there is no reconciliation worker to resolve it. Unknown transaction results and ambiguous public-post acknowledgements require inspection.
