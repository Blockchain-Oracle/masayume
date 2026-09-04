# Slice 8 — the duel has a screen, and the projection had a silent hole — 2026-09-04

Eighteenth session. Slice 8 in four parts plus its browser passes. Nothing was pushed. What was
spent on Shannon is in §6.

Slice 8 is the first slice with a screen a player actually plays, so every part of it was driven in
a real browser before it was called done — twice with two wallets at once, which is the only way a
duel can be driven at all.

## 1. What now exists

| Route | State |
|---|---|
| `/games/practice` | Real. A deck of the venue's live Windows, swiped, watched and scored. No stake, no chain. |
| `/games/duel` | Real end to end: entry, queue, lobby, `createMatch`, `joinMatch`, the picks, settlement, the result and the claim. |

Both run on one `SwipeDeck`. That was the point of building Practice first: the motion a player
learns with nothing at risk is the same component, the same gesture and the same keyboard path as
the one that spends their money.

**Practice** scores a different question from a duel and says so on screen at all times: the live
public feed thirty seconds after the last swipe, not the Window's settlement, because a practice
round cannot wait fifteen minutes. Every price is a real reading; a card the feed cannot price at
the close is left out of the scoreboard and counted in a sentence, because "unreadable" and "did not
move" are different answers. The opponent is a coin flip and is labelled as one.

**The duel** is one socket and one reducer. `matchEventsOf` folds the room's messages into core's
`transition`, so there is no local "I think I picked" anywhere — the arena's own `pick.confirmed` is
what moves the deck on. The screens are one branch per phase of `MatchState` and nothing beside it,
which is why a reconnect that lands on a snapshot draws the right thing without any of them having
remembered a step.

## 2. The defect that made the whole duel unfinishable

**Every read in `packages/db/src/games.ts` filtered on `lower(...)` of what the caller passed. No
write normalised anything, and viem returns a checksummed address from an event log.**

So `duel_matches` filled up with `arena = 0xec71498B…` while `listLiveMatches` asked for
`0xec71498b…`, and matched nothing, ever.

The settler's worklist *is* that projection. It read `no live match in the projection; idle`
straight through a live duel sitting one row away, for as long as the table has existed. Nothing
downstream of a join could happen: no deck revealed, no card settled, no pot awarded. And
`activeMatchFor` — the path that tells a reconnecting browser which match it is in — could never
return a row either.

Why the spikes never saw it: `spike:duel-full` sends its own `revealDeck`, `settleCard` and
`finalize`. The settler's worklist had never run end to end against a real match. It took the first
drive that ran **the settler and a browser against the same database** to expose it.

Fixed at the write, where the invariant belongs: one `key()` helper over every address, hash and id
going into the table, plus idempotent repair statements in the schema for rows a previous build
already wrote. The moment it landed the settler woke up and cranked a real backlog — two unjoined
matches refunded, one stranded `activeUnrevealed` returned.

**The lesson worth keeping: a table whose reads normalise and whose writes do not is not half
right, it is broken in one direction only, and it fails silently.** The reads returned zero rows,
which is a perfectly ordinary answer.

## 3. What the browser found that reasoning had not

Four defects in the new code, each from looking rather than thinking:

- **The stage cards were translucent**, so the two cards stacked behind printed their asset,
  question and price through the card being played.
- **The deck reserved a fixed height**, leaving dead space under every card and pushing both calls
  into the floating pill nav. `popLayout` takes the leaving card out of the flow instead.
- **The keyboard path died after one card.** The played card unmounts and focus falls to the body.
  The first fix was worse than the bug: while a throw is in the air BOTH cards are mounted, so one
  shared ref is written by whichever mounts last — focus landed on the card on its way out, which
  then unmounted. The incoming card is now found by its index.
- **A queue entry does not survive its socket, and the client did not know it.** The server drops it
  on close; the browser kept spinning on a queue it was no longer in. A match is deliberately not
  cleared the same way: it lives on chain and the snapshot restores it.

And two the tests found:

- **The practice bot's hand was the low bit of FNV-1a**, which is nothing but the XOR of the input
  bytes' low bits — so `alpha` and `beta` dealt the identical five cards.
- **The stake choice was component-local**, so a dropped socket returning a queued player to the
  entry silently reset a 10 tUSDC ranked selection to Free.

## 4. A light-mode token that was never flipped

`--profit` flips to matcha for light mode, and part-13 says in a comment that the neon mint is
unreadable on cream. But `--color-profit` — the Tailwind token every `--button-up-*` reads — is
declared as a literal in part-01 and was never flipped beside it.

Measured on the swipe stage's UP call: **#34D399 on cream is about 1.4:1.** Flipping the pair as
part-13 already intended puts the stage at 5.46 and 4.69, and takes the Ticket's own UP / DOWN and
the word board's Yes / No from the same ~1.4:1 to **4.69–6.30**. This is a light-mode colour change
on every surface reading those tokens, done deliberately.

Still marginal and left alone: the 9–10px `--gray-500` meta labels measure 3.78–4.07. They are the
app's own meta treatment and belong to the open global gray-ramp pass, not to one feature.

## 5. What was proven live, and what was not

Driven with two scripted wallets in two headed Chromes against the arena at `0xec71…f0dF`:

| Step | Proven |
|---|---|
| One signature → room token → socket | yes, both browsers |
| Queue, pairing, both seeds, deck sealed | yes — commitment and card count read back on screen |
| The deckmaster's hold | yes — the venue had no dealable deck, the pairing held with a countdown and dealt 28s later |
| Reconnect into a live match | yes — killing the room process rebuilt the same match from chain |
| A fresh browser resuming with no memory | yes — via `activeMatchFor`, working for the first time |
| `createMatch` / `joinMatch` from the browser | yes |
| The settler's reveal | yes |
| Eight picks, two seats, four cards | yes — `picked0 1111 picked1 1111` read back from chain |
| Settlement arriving card by card | yes — "4 of 8 cards settled" with the arena's own payouts |
| A finalized match on the result screen | **not yet** — the deck's 1h Windows had not closed |
| The claim from the browser | **not yet** — nothing was owed while it was watched |

The pick's retry ladder is shared code with `spike:pick-one`, which is proven live; what this
session did not observe is the browser losing a race and asking again.

## 6. What it cost

| Wallet | STT | tUSDC |
|---|---|---|
| demo-user `0xd357…9358` | 0.8418 → 0.7933 | 9947.20 → 9943.20 |
| deployer `0xdD7a…Bf9a` | 43.0498 → 43.0100 | 886.42 → 882.42 |
| settler (`leverage-keeper` key) `0xD560…3D7F` | 1.4850 → 1.4763 | — |

Eight tUSDC of stakes, four per player, each pick costing ~0.9999 of its 1 tUSDC cap with the arena
refunding the rest — and every one of those is a real position whose economics the player keeps.
About 0.10 STT of gas across three wallets.

**The stake per card is the tier's own per-card cap, fixed and identical for both seats.** A duel is
decided on real PnL, so letting one player stake ten times the other would make the pot a bet on
size rather than on calls. That is a decision this session made; it is also why this drive cost a
hundred times the first one, which used a hand-picked 0.01.

## 7. Things about the machine, not the product

Worth writing down because each cost real time:

- **`pkill -f "tsx src/main.ts"` kills the wrapper, not the process holding the port.** Two
  "bounce the room" experiments never dropped a socket, and both readings were thrown away. Kill by
  the PID `lsof` reports on the port.
- **Several ops instances can run at once**, and the ones that lose the port still run their
  projector and settler against the same database. One of them was a pre-fix build writing
  checksummed rows while a fixed one read lowercase.
- **A leftover headed Chrome holding a profile makes the next launch hand off to it** and fail. The
  drive now uses a fresh profile directory per run.
- **A dev-only `performance.measure` TypeError** from React's profiling of the app's `NotFound`
  boundary shows in the Next overlay on `/games/practice`. The production build makes zero
  `performance.measure` calls and logs nothing.

## 8. Configuration this added

`web/.env.local` gained `GAME_ROOM_PUBLIC_URL=ws://127.0.0.1:8787` — where the browser reaches the
ops duel room. Without it the duel says, correctly, that this deployment has no room.

To run the room locally the ops service needs `ROOM_TOKEN_SECRET` (the same value the web app mints
with), `GAME_DECK_KEY`, `DATABASE_URL`, and — to reveal and settle — `GAME_SETTLER_PRIVATE_KEY`
with `DRY_RUN=0` on a funded key.

## 9. Gate

`pnpm typecheck`, `pnpm invariants` (14/14, 0 warnings), `pnpm test` (300), `pnpm build`. Contracts
untouched. Six commits: `5774fc7`, `5f4bdac`, `f224b76`, `4dbfabc`, `a42c74f`, `fdcbba3`, `a3e007a`.
