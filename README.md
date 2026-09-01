# Masayume (正夢)

The consumer and agent layer for DreamDEX Event Contracts on Somnia — a fast, dark, mobile-first app where live price windows scroll past like a feed, a bet is one tap and a stake, and every settlement carries an on-chain receipt.

Work in progress. The product spec lives in `_bmad-output/planning-artifacts/`; the research base in `context/`.

## Quickstart (zero configuration)

```sh
pnpm install
pnpm dev
```

The app boots against Somnia Shannon testnet (chain 50312) with baked defaults — no `.env` required.

## Workspace

| Path | Role |
| --- | --- |
| `web/` | Next.js app (UI + server routes) |
| `packages/core` | Pure domain engines and types (imports zod only) |
| `packages/markets` | The one chain port: the only package that imports `@somnia-chain/markets-sdk` |
| `packages/db` | Optional Postgres schema/client (Drizzle) |
| `services/ops` | Long-running ops actors (house keys live here, never in web) |
| `contracts/` | Foundry contracts |
| `scripts/` | Invariants checker, protocol spikes, seed scripts |

## Checks

```sh
pnpm typecheck   # every workspace
pnpm invariants  # network-free architecture rules (see scripts/invariants/rules.mjs)
pnpm test        # golden tests in packages/core
```
