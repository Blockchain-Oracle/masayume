# Navigation information architecture

Status: approved for implementation on `codex/navigation-ia`

Date: 2026-09-03

## Problem

Masayume has outgrown a flat header and a seven-item mobile bar. Important destinations are split between the primary header, a small overflow menu, the account menu, a crowded mobile bar, and route-specific navigation. That makes the product difficult to learn and makes some routes effectively invisible.

The redesign must make the full product legible without pretending that every route deserves equal prominence. It also must preserve Next.js client navigation so the application does not discard its in-memory query cache during ordinary navigation.

## Accepted direction

Use a hybrid hierarchy:

- Desktop keeps the highest-frequency destinations visible and groups the rest into two descriptive menus.
- Mobile keeps four high-frequency destinations in the bottom bar and uses a fifth `More` action to open a complete drawer.
- Account destinations remain in the wallet/account menu.
- Child journeys stay local to their parent feature rather than becoming global navigation.

This keeps the fast paths one tap away while giving every global destination a predictable home.

## Canonical hierarchy

### Desktop

`Markets · Reels · Games · Build ▾ · Explore ▾ · Portfolio`

`Build` contains:

- Create — create a new market.
- Strategies — discover repeatable trading approaches.
- Agents — manage automated market agents.
- X-trade — turn a post into a trade.

`Explore` is grouped as:

- Trade: Parlay, Sensei.
- Proof: Leaderboard, Stats, Market Surface, Trader Edge.
- Learn: News, How it works, Docs, Status, Download.

### Mobile

The persistent bottom bar contains exactly:

`Markets · Reels · Games · Portfolio · More`

`More` opens a full-height, safe-area-aware drawer. The drawer exposes the same Build, Trade, Proof, and Learn groups as desktop, with an icon and a short description for each item. It must expose active-route state and close after a destination is selected.

### Account

The account menu owns:

- wallet and balance information;
- Portfolio;
- Claims;
- wallet actions such as copy, network switching, and disconnect.

There is no global `Profile` destination because the product does not currently have a real profile route.

### Contextual and excluded routes

Game modes remain under Games. Claim flows remain reachable from account and the relevant transaction journey. Fund, creator recovery, demo, pitch, developer, redirects, unfinished placeholders, and internal auth flows do not receive global navigation entries.

Trader Edge is surfaced in Explore because it is a meaningful proof/analysis destination, while its deeper portfolio actions remain contextual.

## Component architecture

One typed navigation registry is the source of truth. Each entry defines:

- route and label;
- icon and concise description;
- desktop placement or group;
- mobile quick-tab eligibility;
- aliases used to determine active state;
- optional status such as `beta`.

The registry feeds:

- the desktop header;
- the desktop Build and Explore menus;
- the mobile bottom bar;
- the mobile More drawer;
- the X-trade island's route links where applicable.

The account menu remains separate because its contents depend on wallet state.

## Interaction and accessibility

- All internal destinations use Next.js `Link` so client cache and layout state survive navigation.
- Menu and drawer triggers are real buttons with accessible names and expanded state.
- Menus support keyboard traversal, Escape, outside-click dismissal, and visible focus.
- The drawer traps focus while open, restores focus to `More` when closed, and closes on selection.
- Active destinations use `aria-current="page"` where appropriate.
- Motion is subtle and disabled under `prefers-reduced-motion`.
- Desktop menus use icons and descriptions only where they improve scanning; the persistent top row remains compact.

## Visual direction

Keep the existing Yosuku/Masayume palette, mono micro-labels, hairline borders, and compact editorial density. Use no gradients, glass effects, or decorative shadows. Menus should feel like an information map, not a marketing mega-menu.

The supplied 21st.dev references informed the grouped link cards, icon-led scanning, and compact motion. Existing Base UI/Sheet primitives remain the accessibility foundation; no new navigation library is required.

## Acceptance criteria

- Desktop has six visible navigation targets including two grouped menus.
- Mobile has five total bottom-bar actions and no compressed or overlapping labels.
- Every approved global route appears exactly once in the hierarchy, apart from intentional account shortcuts.
- Active state works for aliases and nested routes.
- Opening and closing menus/drawer is keyboard accessible.
- Mobile drawer is usable at narrow widths and respects bottom safe area.
- Internal navigation does not perform a document reload.
- The separate X-trade surface links back into the same product hierarchy.
- Typecheck, invariants, targeted tests, production build, 21st review, and desktop/mobile visual checks pass.

## Out of scope

This branch will not perform the broader RPC, query-cache, provider-boundary, or portfolio-fetch refactor. Those changes have a separate architecture document because they affect failure semantics and transaction safety.
