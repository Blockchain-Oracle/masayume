# Testnet onboarding faucet — 7 September 2026

The owner authorized one Get test funds flow: eligible STT funding followed by the existing wallet-signed DreamDEX tUSDC faucet mint. This change deploys no contracts and changes no existing contract roles or fees.

## Funding and configuration

Funding address: **`0x931F639Df2Efd3D0fFb9024B98504ca93a115d95`** on **Somnia Shannon, chain 50312**. Send STT to this address. Its new dedicated private key stays in the server environment; it is not an admin, runner, X executor or sponsor key.

Production web requires `STT_FAUCET_ENABLED=true`, `STT_FAUCET_PRIVATE_KEY` and the shared `DATABASE_URL`. `STT_FAUCET_RPC_URL` is optional. The key is configured only for Production; Preview stays disabled. The additive database schema is installed by the existing schema initialization path.

`GET /api/faucet` exposes the public address, balance and readiness. Wallet-specific status accepts `?wallet=0x…`. The last pre-release balance read was 0 STT: successful live payout acceptance depends on funding this address. A 10 STT reserve remains untouched, so a full 2 STT payout needs more than 12 STT including its fee envelope.

## Policy and recovery

- Wallet balance below 1 STT: transfer the difference up to 2 STT. At or above 1 STT: skip STT funding.
- One allocation per wallet per rolling 24 hours, at most 40 STT globally in that period, with a 10 STT retained treasury reserve.
- At most ten allocations per connection per rolling 24 hours. Challenge limits are six per wallet, twenty per connection and three hundred globally per hour. These bound usage; they do not establish one person per wallet.
- A five-minute free signature binds the site, wallet, chain, request and expiry. New allocations require the same connection identifier. An already reserved request can be recovered with its original valid signature after expiry.
- PostgreSQL serializes reservations across instances. A transfer's signed bytes, nonce, amount, fee allowance and hash commit before broadcasting. Retrying submits only those exact bytes; it never creates a replacement payment.
- A prepared transfer is reconciled before the next allocation. Unreadable required chain/database state and conflicting nonce evidence hold new allocations. Reserved/reverted attempts still consume quota conservatively.
- The tUSDC mint is a separate wallet transaction. A cancelled mint does not undo confirmed STT. An unknown mint still needs receipt inspection before another mint.

The production request adapter relies on [Vercel's overwritten client-IP header](https://vercel.com/docs/headers/request-headers); production outside Vercel fails closed. Only a keyed HMAC identifier is stored, not a raw IP. Keep this key dedicated: unrelated sends can conflict with journaled nonces.

To stop new requests, set `STT_FAUCET_ENABLED=false`. Do not delete prepared rows, reset nonces or resend a different transaction to clear a hold. Inspect the saved hash and on-chain sender, recipient, amount and nonce first. An unresolved transfer can be checked/rebroadcast by retrying its signed request, or reconciled before the next valid new request. A `conflict` requires operator investigation. No automatic nonce replacement is implemented.

## Implementation and validation

Policy and public receipt types live in `packages/core/src/faucet`. `packages/db/src/faucet.ts` owns durable locking and records; `packages/markets/src/faucet` owns signing/RPC; `web/src/features/funding/faucet-service.server.ts` coordinates them. Browser code receives public receipt facts only. Header, Portfolio and out-of-gas errors use the same panel.

The current acceptance ledger is [acceptance-2026-09-06.md](acceptance-2026-09-06.md). Unit tests cover eligibility, bad/expired signatures, limits, interrupted delivery, read/write failure, concurrent retries and browser signature cancellation/wallet changes. The disposable Postgres script tests real transaction locking, rollback, rolling limits and recovery across service instances; its chain boundary is simulated and sends nothing.

Run the affected checks with:

```sh
pnpm test
pnpm exec tsx packages/db/scripts/test-faucet-postgres.ts
pnpm typecheck
pnpm invariants
pnpm build
```

The database check requires a locally available `postgres:17-alpine` Docker image and creates/removes its own loopback database. It never connects to the configured production database.

## Fresh-wallet correction — 8 September 2026

The released chain adapter rejected buffered transfer gas above 300,000 units. Read-only calls to Shannon reproduced the problem: a new address with zero balance, zero nonce and no code needed an `eth_estimateGas` allowance of 631,500 units; an existing recipient needed 21,000. The 20% buffer made the fresh-address allowance 757,800, so the old cap rejected the wallets this onboarding is intended to fund. No user transaction or prior tUSDC claim should be required to receive STT.

The adapter now uses the estimated gas with the existing buffer and caps the total transfer fee at 0.01 STT. At the observed 6 gwei price, the buffered fee allowance is 0.00545616 STT. Readiness and signing share that fee cap. The target, wallet cooldown, daily allocation, treasury reserve and durable transfer recovery are unchanged. The previous service tests mocked transaction preparation; a new adapter regression test covers the actual fresh-recipient gas estimate and decoded signed transaction, plus existing recipients, excessive fees, pending nonces and unavailable/wrong-network reads.

The UI presents STT first, then tUSDC, explains that the faucet pays for the STT transfer, and retains one Get test funds action. It also waits up to 15 seconds for missing collateral metadata after gas funding instead of immediately requiring a manual retry. Neither tUSDC holdings nor an existing STT balance are prerequisites for the gas request. STT eligibility uses native balance only: below 1 STT, top up toward 2 STT subject to availability and cooldown. The separate tUSDC mint currently checks a conservative 0.72 STT wallet gas envelope before signing; a wallet with enough gas can still mint while another STT allocation is unavailable.

The production status endpoint was read on 8 September and reported 50 STT in the dedicated funding wallet, a full 40 STT daily allocation and readiness for an empty wallet. This confirms treasury availability, not a successful payout. At investigation time, this correction was a local worktree change; no live transfer was sent for this investigation.

References: [Somnia gas differences](https://docs.somnia.network/developer/deployment-and-production/somnia-gas-differences-to-ethereum), [Markets SDK native RPC documentation](https://prd.smk.somnia.host/docs/typescript/native).
