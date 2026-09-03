# Read-path performance and resilience architecture

Status: research and proposed architecture; not implemented in the navigation branch

Date: 2026-09-03

## Executive diagnosis

Masayume already uses TanStack Query, but the current problems are not solved by adding more caching alone. The production measurements put the causes in this order:

1. every market/wallet query is held behind one boot barrier whose chain reads take 1.1–5.5 seconds in the measured sample;
2. the global provider/query cascade then delayed useful Markets data to roughly 20.8 seconds even though the static shell painted around 0.3 seconds;
3. provider errors are converted into resolved `ReadingErr` values, so TanStack Query often records an infrastructure failure as a successful query;
4. Portfolio mounts several expensive query families together, including deep historical scans and per-position fan-out;
5. the full wallet/markets/session provider stack is mounted for every route, including lightweight documentation and demo routes.

The result matches the reported behavior: a hard refresh has no last-good cache, several independent reads can fail at once, the UI exposes repeated `Try again` states, and revisiting a route can start the whole chain again.

## Current evidence

### Query configuration

`web/src/providers/query-client.ts` currently uses a five-second default `staleTime`, retries once, and refetches on window focus. It has no persisted cache and no explicit garbage-collection policy.

`packages/markets/src/react/useReadingQuery.ts` and `packages/markets/src/provider/reading.ts` convert thrown failures into `ReadingErr` values. The query promise therefore resolves. TanStack Query cannot apply its normal error state, retry policy, or previous-data behavior to those failures.

`packages/markets/src/provider/reading.ts` keeps a last-good value in a module-level Map. This helps only after one success in the current document; it disappears on a full reload.

### Transport

`packages/markets/src/runtime/read-runtime.ts` creates one SDK runtime using one selected WebSocket RPC. The probe verifies that a socket opens, not that a JSON-RPC request succeeds. Rotation is disabled by default and rebuilding the runtime drops its watches.

The installed Markets SDK performs chain reads over WebSocket with a four-second request timeout. Wagmi separately has an HTTP fallback transport, but SDK reads do not use it.

A production-mode diagnostic on 2026-09-03 timed the three boot reads concurrently against both configured endpoints. Endpoint 0 completed in 5,457 / 1,158 / 2,579 ms; endpoint 1 in 4,917 / 1,124 / 1,170 ms. Clock and collateral share the SDK WebSocket path and commonly completed together at 1.1–4.1 s; venue/indexer resolution varied from 0.5 s to 5.5 s. Both endpoints were usable, so swapping the URL alone is not a fix. This is a nine-read snapshot, not an SLA.

The boot query is not merely a status panel. `useReadingQuery` disables every non-boot query until clock, collateral and venue all succeed (`packages/markets/src/react/useReadingQuery.ts:18-53`), although those boot reads are only mutually parallel (`packages/markets/src/provider/boot.ts:14-17`). Public lane/metadata reads that do not truly need all three are therefore delayed by the slowest dependency.

Somnia's official network information and RPC-provider guidance support configuring multiple independent endpoints for production: [network information](https://docs.somnia.network/developer/network-info), [RPC providers](https://docs.somnia.network/developer/deployment-and-production/ecosystem/ecosystem-tools/rpc).

### Portfolio fan-out

The Portfolio screen mounts history, money/balance sheet, positions, and vault bets together. Those branches activate balance-sheet reads, vault snapshot, private-desk budget, X status, positions, vault bets, leverage reserve/positions, and per-position market/mark/claimable reads.

History is particularly expensive: it can request multiple pages of fills and router actions, then read related markets, fees, holdings, and vault tallies. It currently polls every fifteen seconds even though most settled history is immutable.

After writes, `invalidateAfterWrite` invalidates a broad set of query families in parallel. That is safe but can turn one mutation into a burst of active network work.

### Route and bundle boundary

`web/src/app/layout.tsx` mounts the full `AppProviders` stack globally. Wallet, RainbowKit, query, markets runtime, session, boot, alert watching, write recovery, and session recovery therefore hydrate on routes that do not need them.

A local production-build manifest estimate showed roughly 2.1–2.5 MiB of raw JavaScript represented across several route chunk unions. This is not an on-wire or field measurement, but it is enough to justify measuring and splitting provider boundaries before adding more client libraries.

There are currently no route `loading.tsx` boundaries and no field Web Vitals reporting.

### Production timing baseline

`pnpm build && pnpm start` ruled out the development compiler as the primary cause:

- `next build` compiled in 5.3 s, typechecked in 10.5 s and generated 72 pages in 1.8 s;
- production HTTP TTFB was 26 ms on the first `/markets` request and about 2 ms warm; `/portfolio` was 5 ms first and about 2 ms warm;
- in a browser reload, the static shell appeared around 307 ms;
- the unresolved Markets hero still showed “Pick a Window above to read it here,” and useful ETH/BTC cards did not appear until roughly 20.8 s.

The server/static route is fast; the bottleneck is after hydration in the client runtime, boot gate and downstream query/provider work. The disconnected browser could not reproduce the owner's signed-in Portfolio retry storm, so its exact query-family breakdown remains an instrumentation task rather than a claimed measurement.

### Markets hero state

Market selection already attempts deep link, then pinned lane, then the first live market. While the lane set is unresolved, the hero displays an empty-state instruction telling the user to pick a window. That is a loading/error ambiguity, not a user action requirement. The correct unresolved state is a chart skeleton; a successful empty response should say that no live windows are available.

## Target architecture

### 1. Restore TanStack Query's failure contract

Infrastructure failures must reject the query promise with a typed error. Domain absence remains a successful value.

An adapter at the UI boundary should translate TanStack state into the existing reading model:

- pending with no data -> loading;
- rejected with no data -> error;
- previous data plus refetch failure -> stale previous data with visible context;
- successful empty domain result -> named empty state.

Retries should apply only to transient transport, timeout, and indexer failures. Configuration errors, contract reverts, validation failures, and user refusals should not retry. TanStack Query's retry controls and network modes are documented here: [query retries](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries), [network mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode).

Longer term, provider methods should return domain values and throw typed infrastructure errors directly, removing the second cache embedded in `Reading` wrappers.

Current TanStack Query v5 documentation confirms that a rejected query function is required for error/retry state, while `skipToken` derives `enabled: false`. Disabled queries are useful for true dependencies, not as a global readiness barrier. Keep `Reading<T>` at the port/UI seam, but make the Query adapter throw `ReadingError` for first-load infrastructure failures and translate cached refresh failures back to stale readings.

### 2. Decompose boot by dependency

Split readiness into independently cached facts:

- runtime configured — synchronous, no network;
- chain clock — needed for countdown/time-sensitive writes, not for every editorial/public list;
- collateral metadata — needed for formatting and money writes; safely persist by chain/address;
- venue identity — needed for venue-scoped reads; safely persist with a short revalidation;
- endpoint health — observational, never a render gate.

Each query declares the facts it actually needs. Public/indexer lane discovery can start immediately after runtime configuration and venue hint, then reconcile when the live venue resolution returns. Wallet balance/position writes continue to wait for exact collateral and live venue truth. This removes the slowest-read barrier without weakening transaction safety.

Render allowlisted persisted market metadata immediately for returning users, marked aged until revalidated. Persistence and boot decomposition are complementary: persistence improves warm reloads; decomposition improves both cold and warm loads.

### 3. Centralize endpoint health and failover

Create one read-health controller for the Markets runtime:

- probe with `eth_chainId` and `eth_blockNumber`, not merely WebSocket open;
- record success rate, recent latency, consecutive transient failures, and selected endpoint;
- open a circuit after repeated failures and rotate once centrally;
- re-establish subscriptions, then refetch affected active queries;
- never rotate in the middle of a multi-step write;
- keep signer and transaction submission transport isolated from read failover.

Viem's WebSocket transport has reconnect/retry behavior, and its fallback transport can rank endpoints by stability and latency. Application-level policy is still needed because the SDK currently owns its client and because execution errors must not be treated as endpoint failures: [WebSocket transport](https://viem.sh/docs/clients/transports/websocket), [fallback transport source](https://github.com/wevm/viem/blob/main/src/clients/transports/fallback.ts).

Preferred long-term SDK seam: allow a caller-supplied public client or a read-only fallback transport. Until then, use the centralized controller around runtime construction and make rotation observable.

### 4. Persist only safe, useful query data

Use `PersistQueryClientProvider` so cache restoration finishes before fetching resumes. Set query `gcTime` at least as long as persistence `maxAge`, and include a cache buster containing application schema/build, chain, and venue identity. TanStack's persistence contract is documented at [persistQueryClient](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient).

Use IndexedDB through the already-installed `idb-keyval`, with a small custom async persister. Add only `@tanstack/react-query-persist-client` if implementation confirms it is not already transitively usable.

Persist allowlisted, successful query families only:

- public market metadata and slowly changing configuration;
- immutable or settled history pages;
- public derived portfolio data only when keys include chain, venue, and wallet.

Do not persist:

- live quotes, order books, or short-lived mark prices;
- mutations or pending transaction authority;
- private/session keys, tokens, or secrets;
- query data that is not scoped to the connected account.

Purge account-scoped data on disconnect or account change. Persistence improves reload behavior; it must not become an identity leak.

### 5. Reshape Portfolio around critical data

Define two rendering tiers.

Critical tier:

- wallet/account identity;
- balance sheet summary;
- open positions and actionable claim state.

Deferred tier:

- settled history;
- secondary analytics;
- expanded per-position detail;
- vault/activity disclosures below the fold.

Load the critical tier first, show section-level skeletons, and let independent sections succeed independently. A failed history scan must not replace an otherwise useful portfolio with a page-level retry screen.

Split history into an immutable settled archive and a small live delta. Give settled pages a long or infinite stale time and invalidate them on confirmed relevant writes, account/chain changes, or explicit refresh—not every fifteen seconds.

Move all read definitions into typed `queryOptions` factories with stable keys containing chain, venue, contract, and wallet identity. Keep identical-read deduplication, and replace broad post-write invalidation with mutation-specific invalidation plus `setQueryData`/optimistic updates only where correctness is provable.

The `stacks-20` repository is useful as a pattern reference for centralized query options, identity-rich keys, `skipToken`, route intent preloading, and long-lived history. It is not a drop-in solution: its cache is also memory-only and its transport and chain model differ.

### 6. Split provider and route boundaries

Keep the root layout and visual shell server-first. Mount wallet/markets/session providers only inside the trading/authenticated route group that needs them. Treat the header wallet control as a small client island.

Map provider requirements per route before moving files. Recovery and alert watchers must remain present on routes where their guarantees matter; they should not silently disappear in pursuit of a smaller bundle.

Lazy-load heavy, interaction-triggered surfaces such as wallet modals, Sensei, charts, and ticket drawers where product behavior permits. Next.js documents how client boundaries pull imported modules into the client bundle and how lazy loading defers client components: [server and client boundaries](https://nextjs.org/docs/app/guides/server-and-client-boundary), [lazy loading](https://nextjs.org/docs/app/guides/lazy-loading).

Use route `loading.tsx` files where server navigation can block. Next.js uses them for immediate skeleton feedback and interruptible navigation: [linking and navigation](https://nextjs.org/docs/app/getting-started/linking-and-navigating).

### 7. Preserve client navigation

Replace internal raw anchors with Next.js `Link`. Client navigation preserves shared layouts and in-memory application state, while Link also participates in framework prefetching where applicable: [Next.js Link](https://nextjs.org/docs/app/api-reference/components/link).

This is the one performance-related correction included with the navigation implementation because it is intrinsic to navigation behavior.

### 8. Instrument before tuning further

Add a small isolated Web Vitals client component using `useReportWebVitals` or `instrumentation-client.ts`. Record LCP, INP, CLS, FCP, and TTFB plus domain milestones:

- `runtime.configured`, `clock.ready`, `collateral.ready`, `venue.ready`, and `boot.ready`;
- first successful SDK JSON-RPC and first successful indexer request;
- `lanes.first_success`;
- `portfolio.critical_ready`;
- query-family latency, error type, retry count, and stale-data use;
- selected RPC/indexer and endpoint rotations.

Do not emit raw wallet addresses, session material, transaction secrets, or request payloads. Use a short-lived anonymous/session identifier if correlation is required.

Measure field percentiles and lab traces. The Web Vitals `good` thresholds at the 75th percentile are LCP at or below 2.5 seconds, INP at or below 200 ms, and CLS at or below 0.1: [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds). Next.js recommends isolating the reporting component so the client boundary stays small: [analytics guide](https://nextjs.org/docs/app/guides/analytics).

## Delivery sequence

### Phase A — measurement and truth

- add field metrics and domain milestones;
- instrument query families and endpoint selection;
- capture cold reload, warm revisit, account switch, and degraded-endpoint baselines;
- define explicit product budgets from real observations.

Initial budgets to validate rather than assume: static shell under 1 s, cached meaningful market content under 1 s, cold public market content under 3 s p75, and Portfolio critical content under 4 s p75 on the supported network. Record actual p50/p75/p95 before treating these as release gates.

### Phase B — correctness before caching

- split boot into dependency-specific queries and remove the global gate from independent public reads;
- restore rejected-promise error semantics;
- introduce typed retry classification;
- correct Markets hero loading/empty/error states;
- add independent portfolio section boundaries.

### Phase C — resilient reads

- add endpoint health and centralized rotation;
- add safe IndexedDB persistence and cache busting;
- split live and settled history;
- narrow mutation invalidation.

### Phase D — payload and scheduling

- split provider route groups;
- lazy-load interaction-triggered clients;
- defer non-critical portfolio panels;
- add route-level skeleton boundaries.

## Acceptance gates

- A warm revisit renders safe cached data without a manual retry and visibly revalidates in the background.
- A cold load with one unhealthy RPC automatically selects a healthy read endpoint without retry storms.
- A refetch failure with previous data shows persistent stale/error context and keeps the last good values.
- A first-load failure shows one actionable error per failed section, not many competing page-level `Try again` buttons.
- Portfolio critical content is not blocked by settled history or secondary analytics.
- A confirmed write invalidates only the data families it can affect.
- Account switching cannot display another account's persisted data.
- No secret or signing material is persisted or sent to analytics.
- Field metrics identify the endpoint, query family, and stage responsible for slow sessions.
- Bundle and request-count changes are compared against a recorded baseline before acceptance.

## Explicit non-goals

- Do not hide transport failures behind indefinite skeletons.
- Do not cache transaction authority or pretend stale quotes are current.
- Do not copy `stacks-20` wholesale.
- Do not add a general state-management library to solve a server-state problem.
- Do not let automatic RPC fallback replay writes or user-signature requests.
