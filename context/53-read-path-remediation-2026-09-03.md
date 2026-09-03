# Merge of `codex/navigation-ia`, and the read-path remediation built on it — 2026-09-03

Thirteenth session. Nothing was pushed, deployed, funded or transacted.

## 1. The merge

`codex/navigation-ia` (`287dac6`) descended directly from this branch's tip (`935e215`), which in
turn descended from `main` (`497b43a`). All three histories were strictly linear, so there was
nothing to reconcile and no conflict surface.

- `main` advanced by `git fetch . codex/navigation-ia:main` — this never touches a working tree and
  refuses a non-fast-forward, which is the safety property that mattered.
- This worktree advanced by `git merge --ff-only codex/navigation-ia`.
- Both are now `287dac6`. `main` contains `287dac6`, `6e6395f`, `1cd8255`, and the two earlier
  commits in the chain (`3da4760`, `7d902ff`).
- The untracked `prompt.md` was preserved. It was briefly captured by a `git add -A` and removed
  from tracking again with `git rm --cached`; the file on disk was never modified.

Merged tree verified green: typecheck 0, invariants 14/14 with 0 warnings, 172 tests, production
build 0.

## 2. The research, checked against the code

The read-path research was accurate on every claim that mattered, and one thing it under-stated.

Confirmed: `useReadingQuery` disabled every non-boot query until clock, collateral **and** venue all
succeeded; `withReading` resolved failures as the error arm of a `Reading` so TanStack recorded an
outage as a successful query; `lastGood` was module-level and died with the document; the Markets
hero's "Pick a Window above to read it here" was shown whenever the lane set was not yet a value;
Portfolio mounted every read at once with a retry button per panel; the endpoint probe verified only
that a socket opened.

Under-stated: `/news`, `/stats`, `/leaderboard`, `/status` and the strategies list read **our own
HTTP routes** and involve no chain at all, yet every one of them sat behind the chain gate. Five
whole pages were paying a 1.5–5.5 s chain tax for data that never touches the chain. A blanket gate
is invisible precisely because it is uniform — no single call site looks wrong.

Also found: the boot's clock read and `useClock` were two cache entries issuing the same chain read.

## 3. What was built

`e964c0d`, `809fc10`, `e7d40a0`, `a724b94`. The full table is in
`docs/architecture/performance-read-architecture-2026-09-03.md` §Implementation record. In short:
the boot is three independent facts and each read declares what it needs; a first-load
infrastructure failure rejects so Query has a real error state and retry, while a domain failure
still resolves and a failed refresh still keeps its last-good value marked stale; the Markets hero
has three faces instead of one instruction; Portfolio has critical and deferred tiers and says one
outage once; endpoint health is a completed `eth_chainId` round trip; a public-only allowlist
survives a reload.

## 4. Measured

Production build, `/markets`, warm assets, time to the real hero chart in the DOM — the same probe
on both trees.

| | before (`287dac6`) | after |
|---|---|---|
| cold assets | 5308 ms | — |
| warm assets | 2961, 2869 ms | 2016, 2106, 1426, 1257 ms |
| FCP | 328–1220 ms | 96–112 ms |

The sample is small and network variance is real, so the mechanism matters more than the median:
`route.useful` beat `boot.ready` on four of five instrumented loads (1970<2016, 1379<1475,
1090<1831, 1186<2102). Under the old gate the lane read could not *start* until `boot.ready`, so the
best load's old-path equivalent is 2102 ms + the observed 744 ms lane read ≈ 2846 ms against
1186 ms measured. The hero skeleton is on screen at 143–186 ms.

**Degraded endpoint** — chain WebSocket dead, indexer healthy, injected before any app script:

- before: clock and collateral can never resolve, `boot.ready` never becomes true, and the gate
  disables *every* query in the application. The entire product is blank indefinitely behind one
  line asking the reader to pick a Window.
- after: `/markets` is fully usable at `route.useful` 1337 ms — hero chart, live question, twenty
  word-market rows — because lanes need only the venue fact and the venue resolves over the
  indexer. `/status` renders completely. One retry button on screen, naming the real cause.

## 5. Two defects found by driving the running app

Both were found in the browser, not by reading.

1. **`Missing queryFn` instead of the real error.** Readiness was first observed by mounting a
   second `useQuery` on the fact's key with `skipToken`. Two observers with different options on one
   query means a refetch resolves against whichever synced last, so the moment a fact errored the
   page reported our own cache wiring instead of the RPC failure. Readiness now comes from one
   provider through context: one observer per fact, nothing to collide.
2. **Explore's last five destinations were unreachable.** Sixteen items, `overflow: hidden`, no
   max-height: on a 582 px viewport the popup ran 122 px past the fold and Docs, Status, Download,
   Demo and Pitch could not be reached at all. Base UI already publishes `--available-height`; the
   popup now respects it and scrolls.

## 6. Navigation verified in the running build

At 1440, 768, 390 and 320: no horizontal overflow at any width. Desktop shows the six destinations
with Games/Build/Explore as `haspopup="menu"` carrying 8/7/16 items. Escape closes a menu and
returns focus to its trigger. The mobile bar is Markets, Reels, Games, Portfolio, More at 56×48; the
drawer is labelled "Everything in Masayume", holds all 34 destinations, scrolls 2561 px inside a
446 px viewport at 320 wide, traps focus and restores it to More on Escape. `/games/range` marks
Games `aria-current="page"` without also lighting More.

## 7. Not done, and honest about it

- Phase D entirely: the provider stack still mounts globally on every route, no route-group split,
  no lazy loading of wallet modals/Sensei/charts, no route `loading.tsx` boundaries.
- The settled-history archive/live-delta split. History is slowed and gated, not split.
- Mutation-specific invalidation; `invalidateAfterWrite` still invalidates broadly.
- No field metrics collection. The probe publishes to the page and transmits nothing.
- No bundle measurement against a recorded baseline.
- **Portfolio is unmeasured signed-in.** The owner's retry storm was not reproduced because that
  needs a wallet session, which this pass did not drive. The tiering is built and typechecked but
  its effect on the storm is argued, not measured.
- No Stage 6 game code. The architecture is the authority and its owner decisions are unanswered.

## 8. Owner decisions still open

Doc 06 §Owner decisions carries eight, unchanged and unanswered by this session: build order;
Moonshot A vs B; ranked stake tiers and per-card cap; deck policy; whether the standing Shannon
deploy go covers the new GameArena custody contract; directional follows vs mutual friendship;
seasons as recognition-only; and Free-Duel wording and economics. None was invented or assumed here.

From this session, one new question for the owner: the read-cache allowlist is deliberately
public-only (collateral, venue, book parameters). Persisting account-scoped data — a balance sheet,
a position list — would make a signed-in reload markedly faster, but it puts wallet-scoped data on
disk and requires a purge on disconnect and account change that must never fail. It was not done.
