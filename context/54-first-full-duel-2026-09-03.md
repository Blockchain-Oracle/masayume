# The first duel driven through a real pick — 2026-09-03

Seventeenth session. Nothing was pushed or deployed. One thing was spent: about 0.08 tUSDC of
stakes across eight picks on the free tier, on the owner's go to continue.

Slice 7 left exactly one thing unproven — a full picked-through duel — because it is the first
path that spends a player's own money. This is the record of driving it, and of the three defects
and one open decision that came out of the attempt.

## 1. What now exists

`pnpm --filter @masayume/ops spike:duel-full` drives one match end to end against Shannon: deal,
create, join, reveal, both seats pick every card, the prints, `settleCard` per card, `finalize`,
and both claims. Three things about its shape are deliberate.

- **`PHASE` bounds the spend.** `preflight` reads only — balances, parameters, the entry-gate probe
  — and stops before anything is written. `picks` stops at the lock. `settle` is the whole loop.
- **`MATCH_ID` resumes.** A drive whose deck holds a 1h card waits the better part of an hour for
  the last print; interrupting it must not strand a paid-for match. The resume path reads the match
  from chain and finishes it, which is also what the settler would have done unaided.
- **The reveal is read back off the deck journal**, not kept from the deal. Holding the return value
  in memory would prove less: the journal is what a restarted operator actually has, and a
  commitment whose preimage cannot be read back is a match that can only refund.

`spike:pick-one` places one card with retry — the recovery a swipe needs, and the thing that
rescued the first live match (§3).

## 2. The queue's countdown was blind exactly when it was needed

`deckmaster.candidates()` filtered out every Window too close to expiry to deal, and then handed
that pool to `nextDealableSec`. But the series whose **successor** makes the next deck is precisely
the series about to expire. Filtering them out left the projection with only the 4h and 1d series,
whose successors never fall inside a duel's horizon — so `deckSupply` returned `null`, which the
queue renders as "no deck for the foreseeable future", during the one stretch where it has a real
countdown to show.

`selectDeck` applies `minHeadroomSec` itself, so the pre-filter never changed a deck. Removing it
is behaviour-preserving for selection and corrective for projection.

Measured in the dead zone, on the same venue minute:

| | before | after |
|---|---|---|
| `deckSupply` | `null` | `7s` |
| the refusal's own text | "…headroom 390s)" | "…headroom 390s); the next deck is dealable in 7s" |
| pool the projection saw | 4 live | 10 live |

This is the third defect in this family, after the reveal-headroom refund bug and the
absent-vs-null conflation of slice 7d. All three were invisible to the spikes because all three
appear only when something is slower than the happy path.

## 3. Two seats contend for the same book

The first live drive dealt four cards and placed seven of eight picks. The eighth —
the challenger's card 1 — reverted, in the same second the creator's pick on that same card
landed.

Nothing was wrong with either pick. On a binary pool, buying UP and buying DOWN draw on the same
resting liquidity, and the creator's fill consumed the level the challenger had just been quoted
against. The drive quoted with a 90% floor under `minQuantityRaw`; the fill came back beneath it
and the arena did what it should.

**This is the normal case in a live duel, not an edge.** Both players are looking at the same card
at the same moment; that is what the pick window is for.

The fix is a retry with a loosening floor — 90%, then 70%, then 50% — and an unchanged stake,
because the arena refunds whatever the walk does not spend, so a smaller fill costs the player
nothing. The rescued pick landed on its first retry and the match auto-locked to `settling`.

Slice 8's swipe surface needs the same behaviour. The port already returns `ArenaPickOutcome` with
`status: "reverted"` and a diagnosis, so the surface has what it needs; what it must not do is show
the player a failure for something that is only a lost race.

## 4. The arena's entry gate is its own, and it is tighter than the clock

Two rules disagree about when a card can be played, and only one governs.

- Ours: `phase()` calls a Window unenterable for its last `max(30, min(300, 0.4×interval))`
  seconds — **300s** on both live cadences.
- The arena's: `_sizeEntry` requires the market contract to report `status() == TRADING` **and**
  `expiry >= block.timestamp + minCardLifeSec` — **240s**.

Measured by quoting live Windows rather than reasoned about:

| card life left | our `phase()` | the arena |
|---|---|---|
| 278s | `noEntryBuffer` | quotes, 11000 raw |
| 189s | `noEntryBuffer` | refuses — `TooLate(bytes32,uint64)` |
| 61s | `noEntryBuffer` | refuses — `TooLate(bytes32,uint64)` |

So the arena is the authority and its floor is 240s. Our buffer is a product rule inherited from
Yosuku, and its reason — canon #6's dead-man's-switch order expiry — does not apply to an arena
pick, because the arena places an IOC whose expiry it caps itself. **Slice 8's duel surface should
gate a card on the arena's rule, not on `isEnterable(phase)`**, or it will refuse swipes the chain
would have taken.

## 5. The decision this leaves open

`minCardLifeSec` (240s) is a floor at **reveal**, and the pick window runs **180s after** reveal.
So in the worst legal case the last 120s of the pick window is refusable: a card revealed at
exactly its floor is `TooLate` long before the player runs out of clock. Two players who swipe in
seconds never see it — the same shape as every defect in §2.

For the arena's own gate to hold for every second of the pick window, a card needs
`minCardLifeSec + pickWindowSec` = 420s of life at reveal, so `dealHeadroomSec` becomes
420 + join + reveal + create-latency = **570s**. That costs deck supply, measured on the live
venue:

| rule | headroom at deal | dealable | longest gap |
|---|---|---|---|
| **A — today**: the arena's floor at reveal only | 390s | **89.2%** | 6:29 |
| B: our no-entry buffer holds at reveal | 450s | 87.5% | 7:29 |
| **D — the arena's gate holds for the whole pick window** | 570s | **84.2%** | 9:29 |
| C: our buffer holds for the whole pick window | 630s | 82.5% | 10:29 |

**The recommendation is D.** It is the only one that makes the rule which actually governs a pick
true for as long as the player is allowed to make one, and it costs five points of availability.
B and C price our client-side buffer into the deal, and §4 is the argument that the buffer should
not be there for a duel at all.

D changes `CREATE_LATENCY_SEC`'s neighbour in `dealHeadroomSec`, not a contract parameter, so it is
a code change and a policy-version bump — no `setParams`, no gas. **It waits on the owner**, because
it trades availability the same way the 2026-09-03 deck-supply decision did, and that one was
theirs.

## 6. The spikes never exited

`closeRuntime()` resolves, but something in the SDK's transport keeps a handle on the loop:
`spike:arena-params` sat for fourteen minutes after its `setParams` had confirmed and its read-back
had printed. `queue-drive.ts` already carried a private `setTimeout(process.exit).unref()` for this;
`spike/finish.ts` is that trick in one place and every spike now uses it. The grace period is real —
`process.exit` truncates pending stdout on a pipe — and `unref` means a runtime that does release
cleanly still exits on its own.

Worth knowing when reading an old spike log: piping a spike through `tail` showed **nothing at all**,
because the pipe buffers until the process exits and the process never did.

## 7. Gate

`pnpm typecheck`, `pnpm invariants` (14/14, 0 warnings), `pnpm test` (278), `pnpm build`.
Contracts untouched.
