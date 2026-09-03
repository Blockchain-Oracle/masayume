# PrivateDesk on Shannon's real contracts — fork verification and the live desk (2026-09-03)

Stage 5 item 5: the truthful private / link-reduction flow. The reference runs private bets through a
`private_budget` Move module and an HTTP desk (`services/private-bet-executor`, context/14 §7): an owner
deposits into a budget only they can withdraw and allows the desk a cap; the desk opens each bet in a fresh
throwaway account with THREE transactions — `charge_to_pool(owner)`, `fund_slot_from_pool(slot)`,
`mint_in_slot(slot, market)` — so no transaction names the owner and the position together; an attested
enclave signs a bearer ticket that is the only claim of ownership; cash-out goes home in two hops the same
way. Doc 03's row asks for "an ephemeral account or scoped session; described as link-private unless
stronger privacy is actually built", and doc 00 forbids renaming it anonymous. `PrivateDesk.sol`
(`contracts/src/private/`: `IPrivateDesk`, `PrivateGateway`, `PrivateDesk`) is that module on DreamDEX;
the desk service is `packages/markets/src/private/desk-*.ts`, run inside Next API routes.

## What a private bet is here

- **The owner's side.** `deposit`, `allow`, `depositAndAllow` (one transaction, the reference's
  `buildFundPrivateBudgetTx`: no state where the money is in but the desk cannot touch it), `revoke`,
  `withdraw` — the last pays `msg.sender` and nobody else, and needs no cooperation from the desk.
- **The desk's open, three sends and never fewer.** `chargeToPool(owner, amount, chargeKey)` names the
  owner and an opaque single-use key; `fundSlot(slotId, amount)` names the slot; `mintInSlot(slotId,
  marketId, outcomeIdx, minQuantityRaw)` names the slot and the market and buys the side off the live book as
  an IOC taker — sized to the slot's balance at execution (`walkBudget`, then cut so the escrow at the walk's
  limit never exceeds the stake, so nobody else's money is borrowed even for a block), never charged more
  than the stake, the dust left in the slot. The venue sees one taker for every private bet ever placed: the
  contract itself.
- **The way home.** `settleSlot` is permissionless and pays into the slot; `sweepSlotToPool(slotId)` names
  the slot; `creditFromPool(owner, amount, creditKey)` names the owner and another opaque key. The pool
  between is bounded: the desk can fund only what was charged and credit only what was swept (`PoolShort`).
- **No record anywhere.** The three keys derive from the owner's own authorisation signature
  (`deriveSlotKeys`: keccak of the signature, then of that with "slot" / "charge" / "credit"), which never
  touches the chain. A desk that lost its way mid-open re-derives them from the same signature and reads
  `chargedOf`, `slotOf` and `creditedOf` off the contract to see what already landed — so a request that lost
  its reply is simply sent again, and nothing is charged twice. The desk keeps no table of who owns what.
- **The claim.** An EIP-712 `Claim` (owner, slotId, creditKey, marketId, outcomeIdx, stake, issuedAtMs)
  signed by the desk key, whose address the contract pins (`desk()`); the browser verifies every claim on
  sight against that pinned key. Not an attested enclave — a key. Said so on the surfaces.

**What this is not.** Anonymity. `Charged` and `SlotFunded` land seconds apart for the same figure and a
determined observer can line them up (the reference says the same of its three-transaction split: "what
remains is amount and timing"); the desk process sees both halves while it works; the owner's deposit and
withdrawal name the wallet. Every surface says "harder to link back to you — not anonymous".

## Unit suite (17, over `MockLeverageVenue` — a walkable book IOC takers consume)

`PrivateDesk.budget.t.sol`: deposit-and-allow, withdraw pays the caller only, a zero deposit is a re-allow,
nobody else withdraws an owner's balance, a charge spends allowance and balance together, every charge
refusal named (`NotDesk`, `Insufficient`, `KeyUsed`, `OverAllowance`), the desk cannot fund or credit beyond
the pool, pause stops charges and mints but never the way home, admin controls.
`PrivateDesk.lifecycle.t.sol`: the open sizes 10 at 0.60 to 16.66 contracts for 9.996 and keeps the dust; won →
settled by a stranger → swept → credited → withdrawn to the cent; lost brings only the dust home; a void
pays half a contract; a slot the book refused (`BelowMinQuantity` under the guard) is refunded without a
mint; every mint refusal named; the escrow clamp (asks 10 at 0.30 then 0.90: 11.11 contracts for 3.999,
escrowed at 9.999 ≤ 10); two owners on one Window share nothing but the pool; and the property the design
exists for — **after the charge, no log the desk emits carries the owner, as a topic or in data, and the
credit carries the owner but not the slot** (`vm.recordLogs` over fund, mint, settle, sweep).

## Fork verification (Window 71691, BTC 4h, 11,697 s to expiry, live makers at 0.511 / 0.541)

| Step | Result |
|---|---|
| `depositAndAllow(50, 25)` by the owner | balance 50, allowance 25 |
| `sizeForStake(71691, UP, 10)` | **19.23 contracts for 9.9996 at 0.52**, limit 0.52 |
| charge → fund → mint from the desk | minted 19.23 for 9.9996; the dust 0.0004 stays in the slot; the desk holds the contracts; no log names the owner; no storage write equals the pool, the market or the owner |
| `vm.warp` past expiry + settlement window, the venue's `voidExpired`, a stranger's `settleSlot` | payout **9.615** (half a contract) |
| `sweepSlotToPool` → `creditFromPool` | swept **9.6154** (payout + dust); the owner's balance **49.6154** |
| the owner's `withdraw` | everything, to the owner; `totalOwed() == 0`, the desk's wallet **0** |

`SHANNON_FORK_URL=https://dream-rpc.somnia.network FORK_MARKET_ID=71691 forge test --match-contract PrivateDeskFork -vv`
(36.9 s). `assertBooksBalance`: the wallet equals `owed + pool + inSlots` after every call.

## Live on Shannon (2026-09-03)

`PrivateDesk` at **`0x4356F421bFAf8BFEEf5188C3A511aD79A5947c67`**, block 478410575 (creation tx
`0x2336…2f74` at 478410639, **36,142,430** gas at 6 gwei, the parlay recipe: `forge script
script/DeployPrivateDesk.s.sol --rpc-url shannon --broadcast --skip-simulation --legacy --with-gas-price
6000000000 --gas-estimate-multiplier 105 --private-key …`, with `PRIVATE_DESK_SIGNER` set). Admin = the
deployer. The desk signer is **`0x8aF0208D3B3428d03E036912312cD892Da8362AF`**
(`~/.config/masayume/private-desk.env`), funded 1.5 STT from the deployer (tx `0xb7ed…c71d`). Launch
params: a 1–25 tUSDC stake band per slot, no mints inside the last 60 s. The desk holds no house money —
only owners' balances, the pool's float and the slots' cash.

The desk key is also in `web/.env.local` as `PRIVATE_DESK_PRIVATE_KEY`, so `/api/private/*` runs on the
owner's dev server. `pnpm --filter @masayume/scripts spike:private-live` drives the whole flow through the
real adapter (`HOUSE_KEY` as the owner, `PRIVATE_DESK_PRIVATE_KEY` as the desk; `WAIT=1` to settle and cash
out; `SKIP_FUND=1` when the balance already covers it).

### The live drive (`spike:private-live`, 2026-09-03)

The owner is the deployer, `depositAndAllow(50, 50)` from the tx lane. On Window 73121 (BTC 4h, 7,481 s left,
a live maker's ask at 0.518):

| Step | Result | Gas |
|---|---|---|
| `sizeForStake(73121, UP, 10)` | 19.305 contracts for 9.99999 at 0.518 | — |
| `chargeToPool(owner, 10, chargeKey)` | balance 40 → 30, allowance 40 → 30, pool 10 | **278,380** |
| `fundSlot(slot, 10)` | pool 0, the slot 10 | **454,255** |
| `mintInSlot(slot, 73121, UP, 18.34)` | **18.975 contracts for 9.999825** (the maker had moved a tick; the 95% guard held); dust 0.000175 stays in the slot | **1,917,880** |
| the claim | EIP-712 over (owner, slot, creditKey, market, UP, 10, issuedAt), signed by `0x8aF0…62AF` | — |
| the same authorisation sent again | the same slot's ticket, **nothing sent**: `chargedOf` 10, the slot funded and minted — resumed from the contract | — |
| cash out before the bell | `{ status: "open", expirySec }` — nothing moved | — |

The three sends land in ~2 s at ten blocks a second; the whole open, reads included, in ~6 s. The `private` gas
lane is 4M on that measurement (`constants/gas.ts`).

**The lost claim, seen once.** The first live run was moved to the background and its output pipe never drained,
so its ticket was never printed: slot `0x7de3…7f78` (funded at block 478411176) holds 8.4 tUSDC of position and
1.6 of dust on Window 73121 with no claim anywhere — exactly the reference's "a cleared browser is a lost bet". What
the design allows: anyone may `settleSlot` it after the bell; the desk may `sweepSlotToPool` it; and `creditFromPool`
can pay whoever the operator believes the owner is — here the house, because the house ran the script. For a user,
the desk would have nothing to go on, which is the point and the risk, and why "Back up" is a primary action on
the claims list. (The slot's `settle → sweep → credit` for the house is left to run after 73121 closes.)

## Not covered

- The claims list, the control and the panel in a browser — the desk ran only through the adapter.
- Pre-funding slots ahead of demand — what would break the amount-and-timing correlation the reference
  also names as "the next piece of work". The slot is funded in the same minute as the charge.
- ERC-1271 wallets: the authorisation is checked with `verifyMessage` (EOA), as the takes and the Room are.
- A withdraw through the sponsor rail: the owner pays their own gas to withdraw; `PrivateDesk` carries no
  ERC-2771 context.
- The desk's sends are serialised in one process; a multi-instance deploy would race on the key's nonce the
  way the sponsor rail would (AD-7's deferred store).
