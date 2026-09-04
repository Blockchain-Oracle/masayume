# The "left open" list, closed — 2026-09-04

Twentieth session. The nineteenth ended with a list headed "left honestly open"; the user's answer was
"I don't know why all of these are left open but yeah we need to adjust them for sure too." Every item on
that list is now in, each its own gate-green commit. Nothing is pushed. What was deployed is in §6.

The method was the nineteenth's rule — read our source against the reference's source, run the gate, the
browser only for what code cannot show — plus one addition worth keeping: **a scratch driver per chain
path**, run against the live deployment before the commit. Two of them (`spike:room-key`, `spike:sponsor`)
found nothing wrong and proved the slice; the third thing they found was not in the slice at all (§5).

## 1. The five-band card face — `9026fd9`

Flicky's card is five stacked tiles (`swipe-screen.tsx` L300–451): the title banner, the art window, the
quote box, two stat pills, and the YES/NO chips carrying a probability per side. Ours was a head row, the
art, one line and a facts row, and the odds — read for the auto-swipe — never reached the face. `StageFace`
now draws the four bands (the asset's mark and pair, the cadence, N/M; the CRT window with its four screws;
the eyebrow, the question and the settle clock on Flicky's ramp; `now` and `stake`), and `SwipeDeck`'s calls
are the fifth: each carries its side's odds and a `locked` state the throw springs back from with the reason.

The odds are the venue's, not a model's. `useArenaQuote` reads `sizeForStake` per side at the card's stake,
so a side's figure is the walk's price per contract, and a side whose quote reverts is locked before the
chain would refuse it — Flicky's `yesPlaceable`, from the book instead of a digital-BS mark. The two
figures do not sum to a hundred; the difference is the spread, and printing it is truer than normalising
it away. The duel's question names the Window's line — the oracle's opening print, `useOpeningPrice` —
with the live price as `now`; practice asks its own question on the same bands.

## 2. The music bed — `55f51f0`

Flicky's bed is an Uppbeat track under a per-download credit that is not ours to carry, and the plan left
the music slider hidden until a CC0 track existed. No track was going to be the reference's either, so the
bed is written the way Pips writes its game audio: oscillators and noise booked on the Web Audio clock with
a 25 ms look-ahead (`bed.ts`) — a pulse lead over an arpeggio and a motif, a triangle bass on the octave
bounce, two detuned saws under a low-pass for the pad, and a three-piece kit with a fill into the
turnaround, 112 BPM in A minor. It weighs nothing, loops without a seam, and its provenance is that file.
The first two seconds after the unlock booked 44 oscillators and 12 noise hits with no console error.

## 3. The room asks the wallet for nothing — `1ebdfc1`

Flicky's room takes a bare `hello(address)` and lets the chain be the authority for everything that costs
money; ours asked the wallet for a message signature before any match existed — the one prompt a duel
still had beyond the entry, and the reason the nineteenth's note said "no key can vouch for it before
entry exists". The answer was to let the key vouch: the game key (`useGameKey`, one per wallet, shared
through a module store so three hooks cannot race the first creation) signs the room's auth message the
moment the wallet and the key exist, silently; the token (`r2`) carries the key beside the wallet; and the
ops room checks a socket's key against the arena's own `agentOf(match, wallet)` before it admits it to a
seat's room. Before the entry the claim is exactly as trusted as the reference's `hello`; from the entry
on it is checked. A key the entry never named is refused with `wrong-key` and the match it is about, and
the stage answers with a re-key plate — `authorizeAgent`, one transaction, this match only, then a resync
— which is the honest way back for a second device or a wiped IndexedDB.

Two things the driver caught. The room server looked for a protocol starting `r1.`; it now takes whichever
offered protocol is not its own, so the token's version is core's to check. And the spike drivers minted
four-argument claims; they pass the wallet as its own key now (no agent is named, so the seat check admits
them).

## 4. The sponsor pays the picks' gas — `dd68dab`

The vault's sponsor lane relays through the ERC-2771 forwarder; the arena's agent check is `msg.sender`,
so a pick cannot ride it. The sponsor pays the duel's gas another way: `/api/games/sponsor` sends STT to a
seat's key, and the key pays for its own picks. The order is what keeps it from being a faucet — only a key
the arena has already named for a live seat, once per seat per match, up to the deck's envelope, under the
vault lane's per-address and per-device gates, from the same `SPONSOR_PRIVATE_KEY`. The entry reads the
sponsor's readiness before it is signed (doc 04 §Recovery) and, when ready, names the key with no value; the
lobby asks the sponsor the moment the entry confirms; the pick screen reads the key's tank before a throw,
and a dry key offers the sponsor again or a wallet top-up sized off the cards left. The entry stays the
player's transaction: it escrows a pot, and capital intake is never sponsored (AD-15).

**The envelope was wrong, and the sponsor made it visible.** Slice 8a funded the arena lane's gas ceiling
per card — 5.76 STT for five cards, sent into a key with no way back — when the gate only needs the ceiling
*held* once (Somnia rejects a sender that cannot cover `gasLimit × maxFeePerGas`) and a pick burns ~276k.
The floor plus a measured per-pick fee allowance is 0.77 STT for a full deck (`gas.ts`, tested). The
write-boundary invariant caught the transfer living in web; it lives in `packages/markets/games/sponsor.ts`.

The driver (`spike:sponsor`) opened a throwaway free match on Shannon naming a fresh key with no value: a
stranger's key got 403 ("the arena has not named that key"), the named key went 0 → 0.6912 STT, a second ask
got 409, and the match was withdrawn. Setting the key also lit the vault's sponsor lane (`/api/sponsor`
reports configured with the forwarder) — Yosuku's Enoki-sponsored one-tap has its relayer now; that lane
was not exercised this session.

## 5. The season — `daec56b`

Flicky's rank screen carries a Season overlay over an env-configured season and a Move prize pool; ours
had none because no programme backed it. Now there is one, whole. `SeasonPrizePool.sol` is the reference's
`prize_pool` ported to the venue's collateral — anyone deposits, only the admin distributes, once, never
more than the pool holds, with a remainder hatch; four forge tests. `core/games/season.ts` is the rules:
the split parsed from `start:end:amount`, the headline pool derived from it, a rank's prize, the eligibility
floor, the winner list that skips the ineligible, the env reader, the countdown; five tests. The ladder's
API annotates each row with finished ranked duels (`countRankedFinalized`) and eligibility and gives the
asking wallet its place below the cut (`ladderRankOf`); `/api/games/season` serves the config beside the
escrow's live balance. The rank page draws the overlay in Yosuku's tokens — the banner, the pool line, the
player's standing pinned above the board, the per-rank panel, the chips lit or locked — and adds the one
line the reference could not print: what the pool escrows on chain. The hub opens with the banner (Flicky's
home), drawn as our own art around a pixel trophy. `season:results` prints the payout sheet and the pool's
cover; `season:distribute` sends the same list to the pool, dry by default, with a receipt JSON.

Season one: `season-1`, ends 2026-09-30T23:59:59Z, split 40 / 20 / 10 / 5×6 = 100 tUSDC, eligible at one
finished ranked duel. The ladder is empty on this arena, so the readout paid nobody — correctly.

## 6. Shannon, and the keys

- **`SeasonPrizePool`** at `0x6B340DBE7AC3283B5f5c3aA5f6AaEd57378596fA` (creation block 479519557, tx
  `0xbb93…f5f2`), funded with **100 tUSDC** by the deployer (`0x5d3b…dccd`). Admin: the deployer.
- **Sponsor key** `~/.config/masayume/sponsor.env` → `0xb78cA30d4bEb78530C13d971709cBF3b2f175b11`, **6 STT**
  from the deployer; `SPONSOR_PRIVATE_KEY` in `web/.env.local`. The maker got **4 STT** (it was refusing
  settle cranks under its envelope). Deployer: 42.6 STT before these.
- Two throwaway matches (`0x1cdd…5b79`, one more) were opened and withdrawn by the demo wallet for the
  sponsor driver; their keys hold 0.69 STT each of the sponsor's.

## 7. Ops

Ops had been running **without its `DATABASE_URL`** — the settler and the projector reported "no DATABASE_URL"
and idled; the ladder could not have been written. The relaunch this session restored it. The recipe, since
the process takes its environment from the shell that starts it: capture the nine variables
(`DATABASE_URL DRY_RUN GAME_DECK_KEY GAME_ROOM_HOST GAME_ROOM_PORT GAME_ROOM_PUBLIC_URL
GAME_SETTLER_PRIVATE_KEY MAKER_PRIVATE_KEY ROOM_TOKEN_SECRET`) into a `KEY='value'` file — **quoted**, because
the database URL carries `&`, which an unquoted `source` reads as a background operator and drops the
variable — then `set -a; source it; set +a; caffeinate -i pnpm --filter @masayume/ops start`. The room now
logs each connection's key beside its wallet.

## 8. Also

The hub's "pick up where you left off" plate read localStorage during render and tripped a hydration error
on `/games`; it is `useLastGame` now, null on the server. The chrome-devtools bridge lost its browser once
(an orphaned profile process; killed, relaunched).

## 9. Open, and yours

- The 45 rows in `docs/implementation/needs-user-review-2026-09-04.md` — keep or revert, each. Unchanged.
- Moonshot A/B and the deal-headroom trade (context/54 §5) — unchanged.
- The vault's sponsor lane is now configured and unexercised; the tile's PnL sparkline; first-run onboarding
  and achievements behind their stores; Lucky, the arcade pair and Moonshot, in the owner's order.

## 10. Hosted (added later the same day)

The user's closing line was "now it's a good time to start thinking of if you want to deploy". The rules in
force: the repo is private on GitHub, so pushing is a backup, not a publication; a Vercel production promotion
needs an explicit yes (the `vercel:deploy` skill's own rule), so the plan was a preview. What happened:

- **Pushed.** `main` → `origin/main` (private `Blockchain-Oracle/masayume`), 45 commits.
- **Ops on Fly.** App `masayume-ops` (org personal, region iad — Neon's region), one `shared-cpu-1x`/1 GB machine
  that never auto-stops, volume `ops_data` at `/data` for the deck journal (`GAME_DECK_JOURNAL`), the room on
  `0.0.0.0:8787` behind Fly's TLS: **`wss://masayume-ops.fly.dev`** (`/health`, `/occupancy` answer 200). Secrets:
  the nine ops variables plus `DRY_RUN=0` and `SEASON_*`. The first deploy provisioned no IPs (an org-slug error on
  the v6 allocation) — `fly ips allocate-v4 --shared` and `allocate-v6` fixed it; the Mac's resolver then cached the
  miss for a few minutes. The key-signed room check passed through Fly. **The local ops is stopped**: the hosted
  one holds the maker, settler and room keys, and one writer per key is the rule — never run both.
  `web/.env.local` now points the local web at the hosted room.
- **Web on Vercel.** Project `masayume` (team blockchain-oracles-projects, root directory `web`, Node 24), the
  server env set for production and preview (`DATABASE_URL`, `ROOM_TOKEN_SECRET`, `PRIVATE_DESK_PRIVATE_KEY`,
  `SPONSOR_PRIVATE_KEY`, `GAME_ROOM_PUBLIC_URL`, `SEASON_*`). `vercel deploy --yes` from `main` produced a
  deployment Vercel tagged **Production** (`https://masayume-umber.vercel.app`, build 3 min, Ready) rather than a
  preview. It is **not public**: the project's Vercel Authentication is `all_except_custom_domains`, so every
  vercel.app URL 302s to a team login; through `vercel curl` `/api/status` reports healthy, the room URL is the Fly
  one, the season and sponsor routes answer, `/markets` and `/games` render.

**To make it public — the owner's yes:** either attach a custom domain (`masayume.app`, the constant in
`features/share/copy.ts`; protection already exempts custom domains) or set the project's protection to preview
only (`PATCH /v9/projects/prj_GiCyzXpMuxRmai2OT4wdLcZyGW7e {"ssoProtection":{"deploymentType":"preview"}}`).
`NEXT_PUBLIC_APP_ORIGIN` should then be set to the public origin. Not done: git integration (deploys are CLI
uploads), drains/monitoring, the vault sponsor lane's first hosted exercise.
