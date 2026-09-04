# The fidelity restoration — Yosuku, Pips and Flicky, from source — 2026-09-04

Nineteenth session. One long day in two halves: the duel's ghost pairings and silent refusals first,
then the user's rejection of nine surfaces' fidelity and the nine-slice plan that answered it
(`~/.claude/plans/witty-exploring-canyon.md`, approved). Nothing is pushed. What was deployed is in §5.

The method changed mid-day, on the user's instruction, and the change is worth recording as a rule:
**verify by reading our source against the reference's source and running the gate; the browser only
for what code cannot show; never a screenshot per step.** And keep a written to-do for a multi-slice
job — the plan file's `## Progress` section, ticked as each slice lands — because the Ticket's
mobile mini chart was listed in slice 1 and skipped, and only the list caught it.

## 1. What landed, slice by slice

| Slice | Commit | What it is |
|---|---|---|
| duel fixes | `92519ca` `c175bfb` `5e4ba99`… `f3e14c6` | a dissolved pairing reaches the screen; the deal no longer commits a dead pairing; the reducer leaves `matched`; gas refusals speak; `/occupancy` before any signature; a sealed deck survives a reload |
| 1 · markets loop | `433cf37` | tap → ticket with the reference's scroll/drawer at 1024; the nine-block Ticket; leverage verbatim; plain-words gone; `over-book` and the reserve's caps named |
| 2 · header & money | `a780c28` | the money pill; AddFunds as the centred modal; Disconnect back; `/claims` deleted, `ClaimWinnings` inline; `CreditWelcome` |
| 3 · tap-trade | `f36b82a` | the session sheet is a centred `#0d0d10` modal on the AccountSetup moment |
| 4 · the Room's gate | `b98d4ac` | a `bettors` registry written from every lane's confirmed fill, read first by `holdsPosition` — the reference's "ever bet" |
| 1b · the depth section | `2735c69` | `/surface` §02 in `drawIvLine`'s grammar; the foot's alerts in the foot's voice; the drawer's missed chart |
| 5 · asset marks | `5e4ba99` | Bitcoin's mark and the Ethereum diamond, the reference's own drawings, on all four discs |
| 6 · reels | `6f812e0` | one round per asset and lane, twelve at most; memoised cards; live reads gated on `near`; `?m=` kept; ↑/↓ |
| 7 · parlay | `f290a8e` `a0cb5e8` | 300 bps headroom; the requote as the headline; a leg follows its lane; `ThinBook` on the row; 8 s slip |
| 8a · one signature | `bf5fbf6` | `ArenaMatches` / `ArenaAgents` / `GameArena`; payable entries that name and fund the key; `placePickFor`; `useGameSession`; the receipt-fed reducer; auto-swipe |
| 8b + 8c · sound and motion | `da53d94` | Kenney CC0 effects; Pips's press/release; Flicky's eight cues; the drag's five signals; the ramp and the bar; the result modal with the share card; the checker canvas |
| 8d + 8e · flow, arts, doc | `85244de` | `/games/duel/[matchId]`; history; the ladder; the match tile; last game; HOW TO; dead-duel lock; presence; the pixel arts, CRT, m6x11plus; doc 04 amended |
| 9 · ledger | `85244de` | the authority record carries the games' references; the 45 unreviewed rows in one table for the owner |

## 2. The depth section

The user's words were "that depth section; it probably looks like a mess now." There is one section
in the app titled Depth — `/surface` §02 — and it was a bare stretched SVG with no axis, no grid and no
price labels, while §04 beside it already drew in the reference's `drawIvLine` grammar. Now §02 does
too. The hero foot on `/markets` was the other candidate: our alerts trigger sat in the reference's
10px mono foot as a bordered pill from a row the foot never had, and at 390px it wrapped the ramp.

## 3. The one signature

Flicky asks nothing per card because it sponsors every transaction. There is no sponsor here, so the
entry transaction does three things at once: escrows the pot, names a browser-held key as the seat's
agent, and forwards its `msg.value` to that key as gas. Every pick is then `placePickFor(player, …)`,
signed by the key under the `game-session` authority, paid for by the player under the allowance the
entry took, refunded to the player, `PickFilled` naming the player. The key's budget is the deck's
own ceiling and never a parameter; a finished match refuses it before the grant is consulted. Seven
new forge tests; the fork duel on three live Windows (worst pick 276k gas). The room's one message
signature remains — it precedes any match, so no key can vouch for it yet.

## 4. What is honest about the games' new feel

The sounds are Kenney's CC0 originals under our own provenance file; Flicky's Uppbeat bed is not
CC0 and is not here (the music slider hides until a CC0 track exists). The arts — bull, bear, coin,
card back, searching banner, locked-in mark — are pixel grids drawn in this repo and painted with the
venue's tokens, because neither reference licenses its PNGs. The pixel type is m6x11plus; its own
name table says so, and Daniel Linssen is credited in the settings sheet. Pips's synthesised score
was not copied; its press/release discipline was re-implemented on the click sample.

## 5. Shannon

`GameArena` redeployed at **`0x0d8FC9659d02070aD8fF7E9a27E5394B9F5a2EF2`** (creation block
479464205, tx `0xaee5…1bbb`, 59.4M gas at 6 gwei from the deployer's 43 STT), the module regenerated,
ops restarted on it with the maker key. The old arena `0xec71…f0dF` holds nothing the app reads.

## 6. Open, and yours

- The 45 rows in `docs/implementation/needs-user-review-2026-09-04.md` — keep or revert, each.
- Moonshot A/B and the deal-headroom trade (context/54 §5) — unchanged.
- A CC0 music bed; a sponsor key; the five-band card face with per-side odds (the odds are read, the
  bands are not drawn); the tile's PnL sparkline; first-run onboarding and achievements behind their
  stores; Lucky, the arcade pair and Moonshot, in the owner's order.
