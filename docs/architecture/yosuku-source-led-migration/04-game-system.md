---
title: First-class game system
status: authoritative
visual_authority: Yosuku
mechanic_references: PIPS and Flicky
---

# First-class game system

## Product placement

Games are an additive first-class Masayume destination inside the Yosuku product shell.

- Add `Games` to desktop and mobile navigation without removing another item.
- Preserve Yosuku's header, bottom navigation, theme, typography, spacing, motion and account model.
- The game selection and menus use Yosuku's editorial language.
- A live game stage may use a dark immersive island, consistent with Yosuku Reels and trade-from-X surfaces.
- Returning users resume an active game instead of being silently sent to a fresh selection screen.

Yosuku is the visual authority. PIPS contributes game selection, first-run progression, customization, audio/haptics, achievements and individual game mechanics. Flicky contributes PvP lifecycle, commit-reveal, real-PnL scoring, matchmaking, settlement and recovery.

## Route family

```text
/games
  /practice
  /duel
  /lucky
  /range
  /moonshot
  /line-rider
  /candle-hop
```

Menus for profile, achievements, customization, funding, history, leaderboard, stats, settings and withdrawal should be shared product surfaces where possible rather than creating duplicate game-only balances or identities.

## Mode truth

| Mode | Economic meaning | Required honesty |
|---|---|---|
| Practice | Solo/tutorial loop, no stake and no chain position | Always labeled Practice and no-stake |
| Free Duel | Head-to-head match with the same prediction lifecycle but no side-pot | Real picks/positions if the flow claims them; no-stake clearly shown |
| Ranked Duel | Real DreamDEX picks plus fixed/capped match stake and MMR | Stakes, positions, scoring and payout come from receipts/outcomes |
| Lucky | Randomly selected eligible live market/side or clearly described random mechanic | Selection seed/source and real quote shown before execution |
| Range | Inside/outside a real settlement band | Unavailable until `RangeReserve` exists; never mapped to ordinary Up/Down |
| Moonshot | Preserve the referenced mechanic after its economic/data dependencies are documented | Clearly state whether it creates a real position or is arcade-only |
| Line Rider | Arcade mode and leaderboard | Never imply an on-chain trade if none exists |
| Candle Hop | Arcade mode and leaderboard | Never imply an on-chain trade if none exists |

The game-selection page may group modes as Prediction, Duel, and Arcade so users understand which actions carry economic risk.

## Shared game model

Core types belong in `packages/core/src/games`:

- `GameMode`
- `GameSession`
- `MatchId` and `Match`
- `DeckCommitment`, `Deck`, and `Card`
- `PickIntent`, `PickReceipt`, and `PickOutcome`
- `Stake`, `SidePot`, and `GameGrant`
- `SettlementProgress` and `GameResult`
- `Rank`, `Rating`, `Achievement`, and `GameStats`

Economic quantities use the same base-unit money types as markets and portfolio.

## Duel lifecycle

```text
Idle
  → Tutorial or mode selection
  → Funding/readiness
  → Queued
  → Matched
  → Deck committed
  → Deck revealed
  → Picking
  → Locked
  → Settling card 1..N
  → Finalized
```

Terminal and recovery outcomes include:

- user-cancelled before match;
- queue expiry;
- opponent no-show;
- reveal timeout and forfeit;
- partial-pick timeout;
- safe refund;
- finalization retry;
- confirmation unknown with transaction hash;
- reconnect to any non-terminal state.

Deck size is 3–5 based on the number of eligible live markets with enough remaining time and liquidity. The rule is deterministic and recorded with the commitment.

## GameArena responsibility

`GameArena` owns the match-level truth that DreamDEX does not:

- players and mode;
- side-pot/stake escrow where applicable;
- deck hash, deck size and reveal deadline;
- card identifiers and their DreamDEX market references after reveal;
- each player's recorded pick receipt/reference;
- pick and match deadlines;
- per-card settlement progress;
- scoring inputs derived from real position/fill economics;
- final result, side-pot payout, refund or forfeit;
- events sufficient to reconstruct the game.

`GameArena` does not invent market outcomes and should not become a second prediction market. DreamDEX remains the authority for underlying market positions and settlement.

## Pick execution

A ranked pick must result in a real DreamDEX position owned for the player, followed by a verifiable game record.

Preferred composition:

1. `GAME_SESSION` grant limits mode, match, eligible markets, total budget, per-pick amount, slippage and expiry.
2. The player's isolated smart-account/session submitter constructs the DreamDEX action.
3. If DreamDEX contracts and SDK permit safe batching, position creation and `GameArena` pick recording occur in one smart-account operation.
4. If safe atomic composition is not available, submit and confirm the DreamDEX fill first, then record its transaction/fill reference in `GameArena` through an idempotent continuation.
5. The UI cannot show “pick locked” until the required receipt state is established.

The builder must confirm the actual SDK/ABI composition before promising atomic picks. Architecture must not turn an assumption into product copy.

## Deck construction and commit-reveal

The deckmaster:

- discovers eligible DreamDEX markets from the shared market runtime;
- filters suspended, expired, near-expiry, illiquid or unsupported markets;
- chooses 3–5 cards under a recorded selection policy;
- serializes a canonical deck representation;
- commits `keccak256`/supported canonical hash before opponent exposure;
- stores reveal material durably and redundantly enough for fallback reveal;
- refuses new joins when reveal material cannot be recovered.

The revealed deck must hash to the commitment. A mismatch does not get ignored or regenerated under the same match; follow the contract's refund/new-match recovery.

## Scoring and payout

Ranked Duel scoring uses real economic results, not speed bonuses or UI multipliers:

- position quantity and premium/actual fill are captured from DreamDEX receipts;
- underlying position payout follows DreamDEX settlement;
- per-card score is real payout minus real premium/cost under a documented formula;
- duel comparison uses the same formula for both players;
- the duel side-pot and each player's underlying DreamDEX positions are separate ledgers;
- ties, voided markets, missing cards and partial completion have explicit rules shown before entry.

Users retain their underlying position economics. `GameArena` distributes only the separately agreed match stake/side-pot unless an explicitly funded alternative design is approved.

## Practice and arcade state

Practice exists to teach the swipe/pick loop without requiring funds. It may use live public price data or a deterministic local scenario, but it must never display synthetic activity as a real wallet position, payout, opponent or leaderboard result.

Arcade games may use off-chain scores and leaderboards. Their UI identifies them as arcade. They share profile, achievements, theme, audio/haptics and navigation, but not a fake Trading Balance transaction history.

## Matchmaking and realtime

The matchmaker owns ephemeral queue state and proposes matches. It cannot settle or pay a match.

- Queue keys include mode, stake tier, region/latency as needed, and rating band.
- Rating bands widen with wait time under a documented rule.
- WebSocket rooms carry presence, chat, opponent progress and transaction acknowledgements.
- Chain and database reconciliation rebuild the room after reconnect.
- The browser does not trust an opponent-sent score or outcome.
- A match ID namespaces every realtime message and idempotency key.

Postgres owns profiles, MMR, achievements, game history projection, settings and arcade scores. Contract events/receipts own economic results. MMR is updated only after a verified terminal result.

## Operational actors

| Actor | Authority and responsibility |
|---|---|
| Matchmaker | No funds; queue and pairing only |
| Deckmaster | No user withdrawal; construct/commit/reveal eligible deck |
| Game submitter | Per-player isolated session under `GAME_SESSION` grant |
| Settler | Permissionless/role call to advance settled cards and finalize; cannot redirect payout |
| Sponsor | Pays only policy-approved operations; no user-fund authority |

Each signing actor uses its own `SubmitterSession`, nonce queue and journal.

## Recovery requirements

- Sponsor unavailable: show payer/fallback before asking for a signature.
- Matchmaker unavailable: existing matches remain recoverable by ID; no new queue entry is accepted.
- Deckmaster unavailable before reveal: block joining or permit safe cancel/refund.
- Reveal timeout: contract-defined forfeit or refund.
- Player disconnect: resume from match/chain/DB state, not local component memory alone.
- Pick confirmation unknown: retain card, transaction hash and reconciliation action.
- Settlement actor unavailable: user or another caller can settle/finalize after the safe condition.
- One or more markets void: use the predeclared void/scoring rule.
- Underfunded grant: refuse before a pick; do not partially pretend it succeeded.

## Audio, motion and accessibility

Preserve the useful PIPS/Flicky interaction disciplines inside Yosuku's language:

- explicit sound setting and no surprise autoplay;
- haptics only where the platform supports them;
- reduced-motion alternative for swipe, reveal, countdown and result effects;
- keyboard and pointer alternatives to swipe gestures;
- visible focus and non-color-only outcome cues;
- pause expensive animation/audio when hidden;
- result celebration never obscures payout, claim or recovery state.

## Game completion definition

A mode is not complete because its selection card exists. It is complete when its entry, onboarding, real data/economic boundary, active lifecycle, terminal result, history, reconnect and failure states work in the Yosuku-native shell. This is an implementation acceptance statement, not a request for a separate automated test suite.
