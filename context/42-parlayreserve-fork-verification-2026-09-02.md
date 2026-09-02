# ParlayReserve on Shannon's real contracts — fork verification (2026-09-02)

Stage 5's first build-phase check: a parlay whose legs are priced by the venue's own resting books
inside the opening transaction, run against a fork of Shannon through the public RPC
(`contracts/test/ParlayReserve.fork.t.sol`, `FORK_MARKET_IDS=68116,68117`). At the fork block only two
Windows were `Trading`: the daily BTC Window (68116) and the daily ETH Window (68117), both closing at the
same instant about 11½ hours out — so the run also exercised the same-print correlation path with real legs.

## What the venue did

| Step | Result |
|---|---|
| `previewLegPrice(68116, UP, 20 contracts)` — the YES asks, cost-weighted | **0.338** per contract; 20 contracts filled (the book held the depth) |
| `previewLegPrice(68117, DOWN, 20 contracts)` — the YES bids inverted | **0.797** per contract; 20 contracts filled |
| `previewOpen([UP 68116, DOWN 68117], maxPayout 20)` | combined **0.269386** = 0.338 × 0.797; the two legs share an instant, so the floor λ · min = 0.40 × 0.338 = 0.1352 was checked and lost to the product; stake floor **6.034247** = ceil(ceil(20 × 0.269386) × 1.12) |
| `openParlay(legs, 20, maxStake = 6.034247)` from the opener | charged **exactly the preview**; the reserve's balance = 5,000 liquid + 6.034247 escrow (the house's 13.965753 moved from `liquid` to `locked`); no storage write equalled either market's address (AD-10) |
| `vm.warp` past both expiries + settlement window, `voidExpired()` on 68116 (permissionless) | the Window voided |
| `resolveLeg(1, 0)` from the test contract (a third party) | the ticket flipped to `VOID`; **6.034247** paid back to the opener; `liquid` back to 5,000; `locked` 0 |
| `withdraw(all shares)` by the house | 5,000 returned in full |

Gas for the whole scenario on the fork: 898,440 (forge's report — indicative only; Somnia's schedule runs
~10× the standard EVM, context/41 §Live on Shannon).

## What it settles

- **The venue's books are readable from a contract in-transaction.** `getBookLevels(isBid, n)` answers
  from a contract caller exactly as it does for the SDK, in YES terms, best level first, expired makers
  skipped — the same read the SDK's `getBinaryOrderBook` makes. Pricing a leg this way needs no oracle, no
  co-signer and no opener-supplied probability, which is the "production hardening" the reference's own
  `parlay.move` header named and never did.
- **A DOWN leg is the YES bids inverted.** The SDK's four-sided book builds NO asks as `1 − yesBid`; the
  reserve does the same walk (`ParlayMath.vwap(levels, invert = true)`), so both sides see one price.
- **Real books are lopsided.** On these Windows UP was cheap (0.338) and DOWN dear (0.797) — the sum is
  above 1 by the spread, as a real book's is. The multiplier the ticket shows (3.31× here) is what the
  books actually offer, not a model's.
- **A void refunds through the venue's own permissionless path.** `voidExpired()` needs no admin, so the
  reserve needs no `admin_void`: the first void leg voids the ticket and the stake goes home in the same
  crank anyone may send.
- **Thin books refuse, not misprice.** The test's own guard logs and stops if a book cannot fill the
  ticket's depth; on this run both daily books were deep enough for 20 contracts. On a thin Window the
  open reverts `ThinBook(marketId, available, needed)` and the page shows the reserve's reason.

## Not covered

- A resolved (non-void) settlement on the fork — the oracle callback does not run in a fork; the unit
  tests cover a won streak, a lost leg, a vector naming no winner, and the claim paying the owner only.
- The adapter end to end on a fork (`scripts/spike/parlay-fork.ts`): written, not yet run — it needs an
  Anvil fork with the reserve deployed under `DEPLOY_TAG=anvil` (the vault's recipe in context/41).
- Live gas on Shannon: the `parlay` lane is sized at 6M beside the vault order until a real reading lands.

## Live on Shannon (2026-09-02, later — the owner's go)

Deployed by `0xdD7ae7c43e87Fae3eaE13c23C01eCa6D5bE8Bf9a`: `ParlayReserve` at
`0x50Ced768C80d499bA4FB956C7DF0c2beB078C151`, block 477800945, tx
`0xb4eebbfec060a2a19a75c1d74a00aa59e46794e311289f0f94b762ee3258ed72`. The deployer is the reserve's `admin`.

| Step | Gas on Somnia | Note |
|---|---|---|
| Creation | **36,937,142** | Somnia's own `eth_estimateGas` said 55,405,713; forge's local simulation 3,276,300 (already ×1.3). 0.222 STT at 6 gwei |
| `approve(reserve, 5,000)` | 259,745 | the same figure the vault session measured |
| `supply(5,000 tUSDC)` | 898,941 | `liquid` 5,000, `locked` 0, the deployer holds all shares |

The recipe that landed, after the vault session's three failed creations taught the lesson: `forge script
script/DeployParlayReserve.s.sol --rpc-url shannon --broadcast --skip-simulation --legacy --with-gas-price
6000000000 --gas-estimate-multiplier 105 --private-key …`. `--skip-simulation` makes forge take the limit from
the RPC's `eth_estimateGas` (Somnia's schedule) instead of its local replay; the multiplier of 105 kept
`gas × price` (58.2M × 6 gwei = 0.349 STT) inside the deployer's 0.358 STT, which the node checks before
admitting the transaction. The script's post-broadcast `writeJson` still runs, so `deployments/50312.json`
gained `parlayReserve` and `parlayReserveFromBlock` (pinned by hand to the creation block, 477800945; the script
wrote the fork block of its local execution, 77 blocks earlier). `pnpm contracts:export` regenerated
`packages/markets/src/contracts/parlay-reserve.abi.ts` and `addresses.masayume.json`; typecheck, invariants
(0 warnings), 99 vitest, 72 forge and the web build pass on the regenerated module.

## The adapter on an Anvil fork holding the live reserve

`scripts/spike/parlay-fork.ts` ran against `anvil --fork-url https://dream-rpc.somnia.network --port 8546
--chain-id 50312` at fork block 477803627, with the clock held (`anvil_setBlockTimestampInterval 0`), the
house's fork balance raised to 10 STT (`anvil_setBalance` — the parlay lane's gas gate wants 6M × 60 gwei × 1.2 =
0.43 STT before it lets a key sign) and `SKIP_FAUCET=1` (the deployer already holds tUSDC). No `DEPLOY_TAG=anvil`
deploy is needed any more: the fork carries the live reserve and its 5,000 of liquidity.

| Step | Result |
|---|---|
| `getParlayReserveState` through the port | the live params, `liquid` 5,000, not paused — resolved from `addresses.masayume.json`, no env override |
| `quoteParlayOnchain` for a 5.00 stake on the two soonest Windows (70415 UP, 70416 DOWN; same instant) | UP **0.371**, DOWN **0.673**, combined 0.249683, correlated; payout **17.879811** (3.575×) |
| `submitParlayOpen` | confirmed; ticket 1 charged **exactly 5.000000** |
| `listParlaysOf` | one `live` ticket, legs `up@371000 pending`, `down@673000 pending` |
| warp past expiry + settlement window, `voidExpired()` on leg 0's Window | `isVoided` true |
| `parlay-resolve-leg` by the house | confirmed; the ticket is `void`, legs `void` / `pending` |
| the opener's spendable | back to **5,016.719187** — the stake refunded to the cent |
| the reserve | `liquid` 5,000, `locked` 0, utilization 0 |

## The adapter live on Shannon

`LIVE=1 SKIP_FAUCET=1 HOUSE_KEY=… pnpm --filter @masayume/scripts spike:parlay-fork`, the deployer as house and
opener, no env for the RPC or the reserve (the baked Shannon defaults and `addresses.masayume.json` resolved
both). The two soonest Windows with four minutes left were 70399 (UP) and 70400 (DOWN), 1-minute-cadence
Windows closing at the same instant.

| Step | Result |
|---|---|
| `quoteParlayOnchain`, 5.00 stake | UP **0.115**, DOWN **0.954**, combined 0.109710 (correlated), payout **40.691687** — 8.138× |
| `submitParlayOpen` | confirmed, tx `0xadefc1e2…8fc7`, **3,919,971 gas**; ticket 1 charged **4.521740** — less than the 5.00 quoted, because the chain re-priced over the depth the payout needs and may only charge less (ledger §ParlayReserve); the reserve held `liquid` 4,963.83 / `locked` 36.17 while the ticket was live |
| the oracle settled 70399 | DOWN won; the UP leg lost |
| `parlay-resolve-leg` (leg 0) by the house | confirmed, tx `0x63a5b9ec…40ac`, block 477809410, **125,421 gas**; the ticket is `lost`, legs `lost` / `pending` |
| the opener's spendable | 5,012.197447 — the 4.52 stake stayed with the house |
| the reserve | `liquid` **5,004.521740**, `locked` 0, utilization 0 — the house's 36.17 released, the stake earned |

So the deployed reserve has now been through both terminal paths a fork cannot produce or can: a void with a
refund (fork) and a lost leg on the oracle's own print (live). A won streak with a claim has run only in the
unit tests; a live one needs a ticket whose legs all land.

Deployer after the session: ~50.1 STT (the user's faucet top-up landed mid-session) and ~5,012 tUSDC. The
reserve's `admin` is the deployer.
