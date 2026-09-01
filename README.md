# Masayume (正夢)

The complete Yosuku consumer-product experience rebuilt on DreamDEX Event Contracts and Somnia, renamed Masayume and expanded with first-class games.

Work in progress. The authoritative direction and architecture live in [`docs/architecture/yosuku-source-led-migration/`](docs/architecture/yosuku-source-led-migration/README.md). The research base is in `context/`. `_bmad-output/` is a superseded historical planning package and must not govern current product or UI decisions.

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

## Developer confidence checks

These commands are available to a builder when useful; tests and coverage are not standalone product deliverables.

```sh
pnpm typecheck   # every workspace
pnpm invariants  # network-free architecture rules (see scripts/invariants/rules.mjs)
pnpm test        # existing focused core checks
```
