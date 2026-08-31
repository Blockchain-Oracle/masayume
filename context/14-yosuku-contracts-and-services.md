# Yosuku — Move contracts, services, gas infra (reference for the DreamDEX/Somnia rebuild)

Source: `reference/yosuku` (Sui testnet, DeepBook Predict venues). All paths below are relative to
`reference/yosuku/`. Yosuku is a consumer prediction-market product; every mechanism below exists to
sell one of a handful of user-facing guarantees (gasless UX, "the agent can't steal", parlays,
leverage with capped downside, private bets, paid strategy/knowledge access, skin-in-the-game
social). The closing section maps each guarantee to a Somnia/DreamDEX implementation choice.

Terminology mapping while reading: Sui "PTB" (programmable transaction block) ≈ EVM multicall /
batched calls in one tx; Sui "hot potato" (struct with no abilities that must be consumed in the
same tx) ≈ a check enforced within one transaction (EVM equivalent: do the whole flow inside one
contract function, or use transient storage / callback patterns); "shared object" ≈ ordinary
contract storage; "owned object" ≈ token/NFT held by an EOA; Walrus ≈ blob storage (IPFS/S3);
Seal ≈ threshold decryption gated by an on-chain predicate (no direct EVM equivalent — closest is
a backend that checks a view function before serving a decryption key); Nautilus/Nitro enclave ≈
AWS Nitro TEE producing attested ed25519 signatures.

---

## 1. Package overview and port priority

| Package | Modules | Purpose | Port priority |
| --- | --- | --- | --- |
| `contracts/predict624-vault` | `spike_vault`, `vault624` | **The production custody pattern**: multi-user delegated-agent vault. Users deposit, subscribe ONE agent with hard caps, agent can only trade (never withdraw), permissionless settle credits the owner. | **MUST** — this is the distilled "no-divert" primitive, simplest to port |
| `contracts/leverage-pkg` (`yolev`) | `social_vault`, `trading_vault`, `margin`, `lending_pool`, `underwrite`, `parlay`, `leverage`, `strategy` | Trading balance + agent/copy-trading custody, margin desk with liquidation, lending pool, underwritten leverage, parlay reserve, strategy marketplace. | social_vault/trading_vault patterns: **MUST** (fold into our vault). parlay: **NICE** (see parlay624). margin+lending_pool+underwrite: **DROP** for hackathon (leverage). strategy: **NICE** |
| `contracts/parlay624-pkg` | `parlay624` | AND-combo parlay tickets against a house reserve, settled on the venue's own oracle print. Escrow-both-sides, incremental leg resolution, early-kill, force-pay-owner claim. | **NICE→MUST if parlays are a headline feature** — cleanest self-contained economic contract in the repo |
| `contracts/core` (`suioverflow`) | `agent_registry`, `attestation_verifier`, `audit_log`, `vault`, `yosuku_vault`, `bell_share`, `strategy_market`, `policy_vault`, `risk_guardian` | TEE-attested agent identity + per-action signature verification, audited non-custodial strategy vaults (ERC-4626-style share vault on Predict), Seal-paywalled playbook market, risk-score registry. | attestation flow: **NICE** (backend-signed session keys are the hackathon version). yosuku_vault share-vault: **NICE**. strategy_market: **NICE**. risk_guardian/policy_vault: **DROP** |
| `contracts/take-board` | `take_board` | Event-only "post a take" feed: one event links Walrus content blob + market + backing position. | **MUST** (trivial — one event) if we do a social feed |
| `contracts/yosuku-rooms` | `bet_registry`, `market_room_rule` | On-chain "has bet on market X" registry + position-gated chat room membership. | bet_registry: **NICE** (one mapping). room rule: **DROP** (rebuild as backend check) |
| `contracts/memory_market` | `memory_market` | Sell transferable `MemoryPass` NFTs gating access to an agent's memory/playbook. | **NICE** — tiny, demos well as ERC-721 + gated content |
| `contracts/seal-pkg` | `handle_registry`, `attested_registry` | Claim authority for tweet-onboarded accounts: binds a social handle key to a wallet; only the bound wallet can unseal the account's withdraw key. | **DROP** unless we do social onboarding; the *pattern* (relay-custodied key, on-chain claim gate) is worth knowing |
| `contracts/attreg-pkg` | `agent_registry` | Standalone copy of core's Nitro-attestation agent registry (PCR pinning + enclave pubkey). | **DROP** (duplicate of core module) |
| `contracts/waitlist-pkg` | `waitlist` | On-chain waitlist: one wallet = one signed join tx, dedup + position + referrer event. | **NICE** — 50 lines, free "verifiable traction" demo |

Off-chain pieces:

| Piece | What it is | Port priority |
| --- | --- | --- |
| `services/private-bet-executor` | HTTP desk that opens/cashes out **private** (wallet-unlinked) bets via throwaway accounts, enclave-signed bearer tickets as the claim of ownership. | **NICE** — the *ticket + fresh-address* pattern is portable; full privacy story is heavy |
| `infra/onara` | Cloudflare-worker gas station: per-flow allowlists of exact `pkg::module::function` targets it will sponsor. This is the entire "gasless" mechanism. | **MUST** (as concept) — on Somnia: relayer/paymaster/EIP-7702 with a function allowlist |
| `scripts/*.mjs` | Keepers (fill/settle/liquidate cranks) + end-to-end proof scripts + setup one-shots. | keeper pattern: **MUST** (we need a settle/resolve crank service) |

---

## 2. `contracts/core` (`suioverflow`) — attested-agent spine

### 2.1 `agent_registry.move` (identical copy in `attreg-pkg`)

Purpose: on-chain identity for a TEE agent. `Registry` maps `agent_addr → AgentInfo` holding the
enclave's PCR0/1/2 measurements and its **attested ed25519 public key**
(`contracts/core/sources/agent_registry.move:20-31`).

- `register_attested` (`:89-103`) consumes a `NitroAttestationDocument` that Sui's native
  `nitro_attestation::load_nitro_attestation` verified earlier in the same tx (AWS root cert chain +
  COSE signature), extracts the attested public key and PCRs, and pins them. Returns an `AgentCap`.
- `revoke` (`:118`) — only the registering owner can revoke; `assert_active` (`:126`) is the gate
  every verifier calls.

Guarantee: "the key that signs agent actions provably lives inside an unmodified enclave image."

**EVM sketch**: `AgentRegistry { mapping(address agent => AgentInfo{bytes32 pcr0.., bytes pubkey, bool revoked, address owner}) }`.
No native Nitro verification on EVM — either verify the COSE attestation in Solidity (expensive,
exists as libraries) or have a trusted registrar submit `register(agent, pubkey, pcrs)`; for a
hackathon, an owner-set `operatorKey` per agent is the honest simplification.

### 2.2 `attestation_verifier.move` — per-action attested signature

The real per-action check (`contracts/core/sources/attestation_verifier.move:48-70`): `verify(reg,
agent, action_digest, nonce, timestamp_ms, signature, clock)`:

1. agent must be registered and not revoked;
2. `timestamp_ms` must be ≤ now and at most 5 minutes old (`MAX_ATTESTATION_AGE_MS = 300_000`, `:15`);
3. ed25519-verifies `signature` over `BCS(ActionIntent{intent=0, timestamp_ms, action_digest, nonce})`
   against the registered enclave pubkey — byte layout must match the Rust enclave exactly (`:31-36`).

Returns a `VerifiedAction` **hot potato** (no abilities, `:22-27`) — it *must* be consumed in the
same tx by a downstream module, so a verification can never be stockpiled or replayed across
transactions. Note: `verify` only checks freshness, not nonce uniqueness; consumers that need replay
protection keep their own consumed-nonce table (see `yosuku_vault`).

**EVM sketch**: a library function `verifyAction(agent, digest, nonce, ts, sig)` doing
`ECDSA.recover(keccak256(abi.encode(DOMAIN, digest, nonce, ts))) == registry.keyOf(agent)` +
`require(block.timestamp - ts < 5 min)` + `require(!usedNonce[agent][nonce]); usedNonce[..]=true`.
The hot-potato property is free on EVM if the check and the action happen in one function.

### 2.3 `audit_log.move`

Per-agent append-only provenance (`contracts/core/sources/audit_log.move:13-29`): each entry emits
`AuditEntryRecorded{seq, action_digest, walrus_blob_id, ts}` and stores the latest seq/blob/digest
on-chain so a reader can confirm freshness without an indexer. The Walrus blob is the full off-chain
decision record (model inputs/outputs); the digest binds it. **EVM sketch**: just events —
`event AuditEntry(address agent, uint64 seq, bytes32 digest, string blobUri)` plus a
`latest[agent]` struct.

### 2.4 `vault.move` — generic non-custodial agent portfolio vault

A user-owned vault (`Vault<T>`, `contracts/core/sources/vault.move:65-80`) an attested agent may
operate under owner-set limits (`VaultConfig`, `:37-46`): per-protocol cap (bps of total assets),
`max_single_move`, and a rolling-24h `daily_loss_limit` circuit breaker (`RiskState` + `roll_day`,
`:49-53`, `:472-477`).

Flows (each is a 2–3-step hot-potato dance so the whole thing completes in one tx):

- **Allocate**: `begin_allocation` (`:239-270`) consumes a `VerifiedAction`, re-checks agent
  identity, digest match, pause, move cap, idle balance, and the per-protocol cap **on-chain
  regardless of the enclave's verdict** ("defense in depth", comment `:236-238`); mints an
  `AllocationTicket`. `withdraw_for_allocation` (`:274`) pulls the coin; `confirm_allocation`
  (`:286-314`) books principal + audit entry.
- **Collect** (exit): `begin_collection` (`:320`) — allowed **even while paused** so funds can always
  come home; `confirm_collection` (`:344-393`) books realized PnL, and if today's realized loss
  exceeds the limit, auto-pauses the vault (`CircuitBreakerTripped`, `:366-377`) — but the collection
  itself still completes.
- **Trade**: `begin_trade`/`settle_trade` (`:402-468`) — budget-capped round-trip through DeepBook,
  same loss accounting.

Owner powers regardless of the agent: `deposit` (`:193`), `owner_withdraw` of idle at any time even
while paused (`:200`), `emergency_pause`/`unpause` (`:208-218`), `set_config` (`:220`). Invariant in
one sentence: **the agent can act only inside owner-set caps, can never widen them, and the owner
can always freeze the agent and pull idle funds.**

**EVM sketch**: `AgentVault { address owner; address agent; uint256 idle; mapping(bytes32=>uint) alloc; Config cfg; RiskState risk; bool paused; }`
with `onlyOwner` withdraw/config/pause, `onlyAgentSig` (verified action) allocate/trade that
`require(amount <= cfg.maxSingleMove && allocAfter <= cap)`, and a loss counter that flips `paused`.
Tests to mirror: `vault_tests.move` — `owner_withdraw_works_while_paused`,
`circuit_breaker_trips_on_excess_loss`, `collection_allowed_while_paused`,
`allocation_exceeds_protocol_cap`.

### 2.5 `yosuku_vault.move` + `bell_share.move` — fungible-share strategy vault

The ERC-4626 of the repo (`contracts/core/sources/yosuku_vault.move:1-16` header). A shared vault
holds the DUSDC float and a `TreasuryCap<BELL_SHARE>` (a normal fungible coin,
`contracts/core/sources/bell_share.move:12-25`), so a Predict strategy position is a composable
token rather than a siloed receipt.

- NAV v1 = idle float + Σ open-leg cost basis (conservative, `:158-160`).
- `deposit` mints shares at `amount * supply / nav` (rounding favors the vault, `:163-176`);
  `redeem` burns for a pro-rata slice **paid from idle** — open legs stay locked until they settle,
  and redemption never depends on the agent (`:180-189`).
- `begin_predict_action` (`:197-242`) is the hardened open gate. Beyond the core vault's checks it
  adds: an explicit **consumed-nonce replay table** (`:218-220`), a per-vault **oracle allowlist**
  (`:222-223`), and — the key trick — it **re-derives the signed digest from the on-chain call
  parameters** (`predict_action_digest`, `:369-394`; big-endian u64s deliberately, `:396-405`) and
  requires it to equal the signature's digest (`EDigestBind`, `:227-229`). So the enclave's signature
  is bound to *this exact oracle/strike/side/qty/cost*, not to an opaque hash the host claims
  matches. It then funds the **exact** `cost` just-in-time from the float (`:239`) — a stolen agent
  key can mis-spend at most one in-flight trade, never the reserve.
- Settlement is async: `confirm_predict_action` (`:247`) books the liability; `book_payout` (`:279`)
  later deposits redeemed proceeds, realizes PnL, and runs the same daily-loss breaker.

**EVM sketch**: an ERC-4626 vault over the quote asset where `totalAssets() = idle + openCost`;
`openPosition(params, sig)` verifies the operator signature over `keccak256(abi.encode(vaultId,
KIND, params, nonce, issuedAt))`, checks nonce/allowlist/caps, transfers exactly `cost` to the
market contract; `bookPayout` credits proceeds and realizes PnL. On DreamDEX the "leg" is an
ERC-6909 outcome-token position in a per-window pool; NAV can mark open legs at cost (v1) exactly as
here.

### 2.6 `strategy_market.move` — paid, provenance-verifiable playbooks

A strategist lists a **Seal-encrypted playbook** blob plus a **plaintext provenance manifest** (tx
digests + realized PnL) so buyers can verify the track record on-chain *before* buying without
seeing the content (`contracts/core/sources/strategy_market.move:1-16`).

- `list` (`:130-169`): shared `Listing<Q>` with price, `access_ms` (0 = perpetual), seal identity =
  the listing's own object-id bytes (`:146-148`).
- `purchase` (`:173-210`): exact-price payment, protocol fee split (fee capped at 10%,
  `MAX_FEE_BPS`, `:36-37`), and buyer recorded in an on-chain access table with expiry; a repeat
  purchase **extends** a time-boxed subscription with saturating arithmetic (`:190-200`).
- `seal_approve` (`:215-226`) is **the paywall itself**: Seal key servers dry-run it and only issue
  decryption shares if the caller is the strategist or an unexpired buyer. "No relayer, no
  custodian: the paywall IS the Move predicate."
- `update_playbook` (`:229`) versions content for existing buyers; `withdraw_proceeds` (`:256`) is
  strategist-gated.

Tests confirm intent (`strategy_market_tests.move`): `purchase_grants_seal_access`,
`stranger_cannot_decrypt`, `subscription_expires`, `repeat_purchase_extends_subscription`,
`fee_split_and_withdrawals`.

**EVM sketch**: `StrategyMarket { mapping(uint id => Listing{seller, price, accessMs, uri, manifestUri}); mapping(uint => mapping(address => uint64 expiry)) access; }`
with `purchase()` doing the fee split and `hasAccess(id, user) view returns (bool)`. Without Seal,
the decryption gate becomes a backend that checks `hasAccess` before serving the decrypted blob —
weaker (backend-trusted) but the same product.

### 2.7 `policy_vault.move`, `risk_guardian.move`

- `policy_vault` (`contracts/core/sources/policy_vault.move`): metadata + Seal gate for an
  *encrypted agent policy* blob; `seal_approve` (`:85-94`) releases decryption only to the active
  registered agent. Drop for the rebuild; a config table suffices.
- `risk_guardian` (`contracts/core/sources/risk_guardian.move`): shared per-protocol risk-score
  registry written **only by the attested guardian agent** (`update_score`, `:79-97`). Two nice
  mechanism ideas worth remembering even if we drop it:
  - **fail-open staleness** — `is_high_risk` ignores scores older than 10 min (`:106-111`) so a dead
    guardian can never freeze funds;
  - **bounded permissionless pause** — anyone may pause a subscribed protocol, but only while a
    fresh high-risk score exists (`guardian_pause`, `:126-130`), with an owner ("DAO") unpause
    override (`:133-141`). Removes the human bottleneck in a crisis without granting open-ended
    authority.

---

## 3. `contracts/predict624-vault` (`yosuku_spike`) — the production no-divert custody vault

This package is the **shared successor of social_vault** and the cleanest expression of Yosuku's
core custody promise. Two modules.

### 3.1 `spike_vault.move` — minimal proof of the pattern

(`contracts/predict624-vault/sources/spike_vault.move:1-16`.) A shared vault owns an object-owned
venue account; the vault's UID is the **only** source of `Auth` for that account, so "custody policy
is exactly this module's API surface": anyone can `deposit` (`:64`); the designated `agent` can
`agent_mint` positions capped by `max_margin` per trade (`:78-112`) but **has no withdraw path**;
`user_withdraw` (`:116-128`) is owner-gated and transfers to `owner` unconditionally — the only
funds-out path.

### 3.2 `vault624.move` — multi-user generalization (deployed, the one the app uses)

(`contracts/predict624-vault/sources/vault624.move:1-22` header.) One shared `Vault624` owns ONE
canonical venue account holding the pooled DUSDC; per-user claims live in `ledger:
Table<address,u64>` (`:52-60`).

- `deposit` (`:154-168`): credits `ctx.sender()`'s ledger entry.
- `withdraw` (`:174-188`): debits the sender's own entry and transfers **to the sender
  unconditionally** — "the ledger itself is the owner gate… the agent has no entry to pull."
- `subscribe` (`:193-213`): user names ONE `agent` plus hard per-trade caps — `max_margin` (all-in
  cost of a single trade) and `max_leverage` (1e9-scaled). Upsert + reactivate. `cancel` (`:217`)
  deactivates.
- `agent_mint_for` (`:231-282`): the only trade path. Policy gate `assert_agent_trade` (`:327-341`):
  subscription exists & active, caller == subscribed agent, leverage ≤ cap, `max_cost` ≤ cap, ledger
  covers `max_cost`. The user is debited the **exact** cost, measured as the vault account's balance
  delta around the venue mint (`:251-270`) with a defense-in-depth `cost <= max_cost` post-assert.
  The order id is recorded in `positions` with its owner.
- `crank_settle` (`:289-321`): **permissionless** — anyone can close a settled position; the payout
  (again a balance delta) can only ever be credited to the recorded position owner's ledger entry.

Plain-English economics: users pool money in one account; the agent is a *trader with a spending
limit per user*, never a custodian; winning/losing flows straight back into the per-user ledger, and
withdrawal is a self-service right that no operator can block or redirect.

**EVM sketch (this is the one to build)**:

```solidity
contract EventVault {
    IERC20  quote;             // e.g. USDC on Somnia
    IMarket dreamdex;          // per-window CLOB, ERC-6909 outcomes
    mapping(address => uint256) ledger;
    struct Sub { address agent; uint128 maxCost; uint64 maxLevBps; bool active; }
    mapping(address => Sub) subs;
    mapping(uint256 orderId => address owner) positions;

    function deposit(uint256 amt) external;                       // credits msg.sender
    function withdraw(uint256 amt) external;                      // pays msg.sender only
    function subscribe(address agent, uint128 maxCost, ...) external;
    function cancel() external;
    function agentTradeFor(address user, TradeParams p) external { // msg.sender == subs[user].agent
        // caps + balance check; measure cost as balanceBefore-balanceAfter around the fill
        // record positions[orderId] = user
    }
    function crankSettle(uint256 orderId) external;               // permissionless; credits positions[orderId]
}
```

DreamDEX's `OperatorPermissionsRegistry` / `placeOrderFor` pattern is the natural substitute for the
"vault UID is the only Auth" trick: register the vault contract as the operator of its own market
account, and keep the user-facing policy (subscribe/caps/ledger) in the vault exactly as above.

---

## 4. `contracts/leverage-pkg` (`yolev`) — trading balance, agent custody, margin, parlays

Eight modules; the deployed product uses `trading_vault` + `margin` + `lending_pool` (web leverage),
`social_vault` + `strategy` (trade-from-X + copy trading), `parlay` (superseded by `parlay624`),
`underwrite` (earlier leverage model), `leverage` (earliest, receipt-based).

### 4.1 `social_vault.move` — the "no-divert" custody answer to agent-drain attacks

The module doc (`contracts/leverage-pkg/sources/social_vault.move:1-19`) states the threat model
plainly: custodial AI agents get drained via prompt injection ("Grok lost ~$170K to a Morse-code
tweet — you don't hack the wallet, you hack the AI"). The structural fix: **remove the divert path
entirely** rather than trying to harden the AI.

- Per-user custodied balances keyed by depositor address (`Vault<T>`, `:44-60`).
- `deposit` (`:141`) credits the sender; `credit_for` (`:161-172`) lets **anyone** fund a *named*
  user (used by the relay to sponsor tweet-onboarded accounts) — permissionless because it can only
  ever ADD to a user's own balance.
- `withdraw` (`:178-189`): owner-gated, pays the caller — **the only path by which funds leave the
  vault to an arbitrary address**. The agent has no withdraw capability at all.
- `agent_trade` (`:200-236`): the attested agent's ONLY power — debit a user's balance (≤
  `max_trade`) into `margin::request_open_for(desk, coin, oracle, user, …)` where the position owner
  is **hard-wired to `user`** (comment `:228-231`): "There is no argument or code path here that
  lets the agent name a different beneficiary." Every exit of the resulting position force-pays the
  user. So a *fully* prompt-injected agent can only trade a user's own funds into the user's own
  position. `max_trade` bounds the blast radius (over-sizing, since theft is impossible).
- **Copy trading**: `Subscription` (`:77-89`) is a subscriber-created grant letting a strategy
  creator's agent open positions from the subscriber's balance within subscriber-granted caps
  (`create_subscription`, `:245-269`; only the subscriber can create it — "an agent can never
  authorize itself"). `authorized_trade` (`:288-330`) enforces vault match, active flag, caller ==
  sub.agent, margin/leverage caps, then opens with owner = subscriber. `cancel_subscription`
  (`:274`) is subscriber-gated; existing positions are unaffected because they already force-pay
  the subscriber.

Tests prove the two halves of no-divert (`credit_for_tests.move:12-50`): the named user (not the
funder) can withdraw a credited amount; the funder cannot.

**EVM sketch**: fold into `EventVault` above. Copy-trading = a second table
`mapping(address subscriber => mapping(address agent => Grant{maxCost, maxLev, strategyId, active}))`
and an `authorizedTradeFor(subscriber, params)` that checks the grant and opens a position owned by
the subscriber. The single load-bearing invariant to keep: *the beneficiary of every position opened
with user funds is a constant equal to the funded user; there is no beneficiary parameter.*

### 4.2 `trading_vault.move` — the platform account layer ("Trading Balance")

(`contracts/leverage-pkg/sources/trading_vault.move:1-16`.) One deposit, then funds route into
normal trading, private flows, leverage, and bounded agent flows without the wallet-coin round-trip.
Per-user `Account` has four buckets (`:48-55`): `available` (withdrawable), `private_available`
(cashouts from private routes), `agent_available` (owner-allocated agent budget), `locked_margin`
(accounting for margin out in an order/position).

- Owner-gated: `deposit`/`withdraw` (`:100-148`), `move_to_private`/`withdraw_private`
  (`:152-198`), `allocate_agent` (`:202-242`, sets an `AgentPolicy{agent, max_trade,
  max_leverage_bps, max_daily_loss, expires_at_ms}`), `revoke_agent` (`:244`, returns budget to
  available instantly).
- Anyone-may-credit (caller contributes the coin): `credit_available_for` (`:119`),
  `credit_private_for` (`:169`), `return_locked_for` (`:385`) — how settlement PTBs return money to
  the account instead of the wallet.
- Trading: `open_leverage` (`:266-317`, user debits own available into a margin order they own);
  `agent_open_leverage` (`:321-380`, agent spends the user's `agent_available` inside the policy —
  active, unexpired, per-trade and leverage caps — into a position hard-wired to the user).
- `write_off_locked_for` (`:404`) — admin accounting hook to keep account value honest after a
  liquidation returns nothing.

**EVM sketch**: this is a balances-and-policies contract; on Somnia it merges naturally with the
vault above (available/locked buckets + an operator allowance struct per user). The
"credit_available_for is permissionless because the caller supplies the funds" idiom translates to
`function creditFor(address user) payable` / with `transferFrom(msg.sender, …)`.

### 4.3 `lending_pool.move` — minimal Compound-style pool

(`contracts/leverage-pkg/sources/lending_pool.move:1-12`.) Suppliers get shares; borrow interest
accrues continuously via a RAY-scaled borrow index with a utilization-linear rate
(`accrue`, `:112-127`: `rate = base + slope * utilization`; `borrow_index *= 1 + rate*dt/year`).
`borrow`/`repay`/`repay_lossy` are `public(package)` (`:167-202`) so **only the margin/leverage
modules can move debt**; `repay_lossy` socialises bad debt across suppliers by simply not restoring
liquidity (share price drops). Full-repay loans only; no reserve factor.

**EVM sketch**: don't rebuild — use a 100-line pool exactly like this if leverage is kept (shares +
index + utilization rate, `onlyMarginDesk` borrow/repay), or drop leverage entirely for the
hackathon (recommended).

### 4.4 `margin.move` — the borrow-and-liquidate desk on a *live* binary market

The module doc (`contracts/leverage-pkg/sources/margin.move:1-32`) contains the key insight: the
common claim "you can't liquidate a binary bet" is wrong on this venue because `redeem` works
**mid-round at the live bid mark**, so a binary position has a continuously updating recoverable
value. The only obstacle is custody — venue accounts are owner-gated — so the desk custodies every
leveraged position in an **agent-owned account** and can redeem at mark the moment health drops.

Mechanism (escrow→fill handshake because one tx has one sender, `:186-193`):

1. `request_open` / `request_open_for` (`:195-233`): trader (or a vault on the user's behalf)
   escrows margin + leverage intent in a shared `OpenOrder`. Leverage cap validated here so no entry
   point bypasses it (`new_order`, `:238-275`).
2. `fill` (`:294-343`): keeper-only. Borrows `notional - margin` from the pool, returns the combined
   coin for the same tx to mint into the keeper-owned custody account, records a shared
   `MarginPosition` whose `owner` **field** is the trader (`:321-341`). Debt handle =
   `principal_scaled` into the pool's index.
3. `cancel` (`:279-287`): trader reclaims an unfilled order any time — the keeper is a *liveness*
   dependency, never a custody one.
4. `close` (`:359-384`): with redeemed proceeds — repay debt, remainder force-paid to the **owner**,
   never the caller. Aborts if proceeds can't cover debt (that's the liquidation path).
5. `liquidate` (`:394-437`): eligibility is asserted **on the real redeemed proceeds** —
   `proceeds * 1e4 < debt * maintenance_bps` (`:412`) — so the agent executes but "can never fake a
   liquidation or divert". Liquidator takes `liq_penalty_bps` off the top; pool repaid; shortfall
   socialised via `repay_lossy`; leftover to the owner.
6. `admin_writeoff` (`:445-457`): post-expiry bad-debt cleanup, gated so it can never touch a live
   or winning position.

Views for the keeper: `health_bps` = mark×1e4/debt (`:468`), `is_liquidatable` (`:475`).

Tests (`margin_tests.move`): `open_fill_close_winner`, `liquidate_at_mark`,
`liquidate_rejects_healthy`, `only_keeper_can_fill`, `cancel_reclaims_margin`,
`request_open_caps_leverage`.

**EVM sketch (if leverage survives scoping)**: `MarginDesk` holding positions itself (contracts can
custody ERC-6909 tokens directly — the whole "keeper-owned account" contortion disappears on EVM):
`requestOpen` escrows margin; `fill` (keeper) borrows, buys outcome tokens on the DreamDEX CLOB,
stores `Position{owner, debtShares, qty}`; `liquidate` sells at market inside the same call and
`require(proceeds * 1e4 < debt * maintenanceBps)` — the "real proceeds" property carries over
directly. Recommendation: **drop for hackathon**; it drags in the pool, a keeper, and liquidation
edge cases.

### 4.5 `underwrite.move` — the no-debt leverage alternative (house-fronted)

(`contracts/leverage-pkg/sources/underwrite.move:1-27`.) Instead of lending, the reserve is the
**counterparty**: trader posts margin, reserve fronts the rest of the notional and charges an
upfront premium on the fronted amount (`premium_bps`). Properties by construction: trader has no
debt, max loss = margin, nothing to liquidate — settlement is deterministic. `settle` (`:339-365`)
is permissionless: reserve reclaims fronted capital first, remainder force-paid to the owner.
Aggregate risk is bounded by `max_exposure_bps` (`fill`, `:293-296`). Suppliers earn the premiums;
a losing position costs the reserve its fronted amount.

Honest scope note in-source (`:22-27`): `open`/`fill` hands the notional coin back for the same tx
to mint with — a hand-crafted tx could take the fronted funds without minting; the app always mints
atomically and the exposure cap bounds the worst case.

**EVM sketch**: simpler than the margin desk and worth considering *if* we want a "boost" feature:
`fill` buys the outcome tokens inside the same function (no leak possible on EVM), records
`Position{owner, fronted}`; `settle(positionId)` sells/redeems, `reserve += min(proceeds, fronted)`,
rest to owner. Economically it's "the house sells you a deep-ITM-funded call on your own bet" and
prices it with a flat premium.

### 4.6 `parlay.move` — AND-combo tickets against a reserve (v1, oracle-object settled)

(`contracts/leverage-pkg/sources/parlay.move:1-42`.) See §5 for the newer port; mechanics are
identical except v1 resolves each leg against the Predict `OracleSVI` object's frozen settlement
(`resolve_leg`, `:480-537`; binary rule copied verbatim from the venue: `up_wins = settlement >
strike`, at-the-money settles DOWN, `:502-504`) and the correlation sub-cap is per **oracle**
rather than per expiry.

Test coverage worth copying (`parlay_tests.move`): `pricing_floor_is_exact`,
`stake_below_floor_aborts`, `correlation_surcharge_raises_floor`, `exposure_cap_enforced_at_open`,
`withdraw_locked_capital_aborts`, `per_oracle_subcap_enforced`, `payout_cap_enforced`,
`single_leg_rejected`, `mismatched_vectors_rejected`.

### 4.7 `strategy.move` — the Agent Strategy Exchange

(`contracts/leverage-pkg/sources/strategy.move:1-15`.) A creator publishes a `Strategy<T>`
(`:28-45`): encrypted playbook blob, pointer to the agent's memory account, **hard risk caps every
subscriber inherits** (`max_leverage_bps`, `max_margin`), and a flat `sub_fee`. `subscribe`
(`:103-113`) pays the creator exactly the fee and calls `social_vault::create_subscription` with the
strategy's caps — so subscribing *is* granting the bounded copy-trade authorization, in one tx.
Stated invariant (`:13-14`): "memory *influences* what the agent proposes; this contract *enforces*
what it may do… Memory never touches fund authority." Note the in-source version-skew warning
(`:98-102`): the deployed build's `subscribe` returns nothing while this source returns a refund
coin — a good reminder to keep deployed-ABI parity notes in our own repo.

**EVM sketch**: `Strategy` registry contract + `subscribe(strategyId)` that takes the fee and writes
the copy-grant into the vault in the same tx. Performance/leaderboard stays off-chain, computed from
events (verified PnL, drawdown), "never win-rate alone".

### 4.8 `leverage.move`

Earliest model: user borrows directly, holds a `Loan` receipt themselves
(`contracts/leverage-pkg/sources/leverage.move:52-70`), closes/liquidates by returning proceeds.
Superseded by `margin.move` (which fixed custody so liquidation is actually executable). Drop.

---

## 5. `contracts/parlay624-pkg` — parlays settled on the venue's own oracle print (v2, deployed)

(`contracts/parlay624-pkg/sources/parlay624.move:1-30`.) One ticket bundles N band legs
`(expiry, lower, higher]` on the BTC settlement feed; pays `max_payout` only if **every** leg wins;
any losing leg forfeits the whole stake. The design solves four problems at once:

**1. Counterparty solvency, per-ticket.** At open, the reserve pre-funds the full `max_payout` into
the ticket's escrow (opener's `stake` + reserve's `house_locked = max_payout - stake`), so it can
never be short on a win (`open_parlay`, `:424-428`). `locked` tracks aggregate contingent liability.

**2. Fair pricing enforced on-chain.** The contract recomputes the combined win probability from the
per-leg `prob_bps[]` (`:370-379`), applies a **same-expiry correlation surcharge** — legs at one
expiry are decided by the same print, so Π p understates the joint probability; floor it at
`λ · min_i p_i` (`:381-387`) — then asserts the stake clears the margined fair floor
`ceil(max_payout · p_combined · (1 + margin_bps))` with round-up so the reserve is never short a
base unit (`:391-395`). Longshots below `min_combined_prob_bps` are rejected. Scope caveat (v1
header `:35-41`): the per-leg probabilities themselves are supplied by the opener (keeper co-signs);
production hardening is re-deriving them from venue quotes in-tx. Exposure caps bound the worst
case.

**3. Aggregate risk caps.** `max_exposure_bps` of total value across LIVE tickets (`:400-406`), a
per-parlay `max_payout_cap`, and a per-expiry sub-cap `max_expiry_locked` (`:408-422`) controlling
same-print correlation pileup.

**4. Trust-minimized settlement.** `resolve_leg` (`:484-546`) is **permissionless and idempotent**:
it reads `pyth_feed::normalized_spot_at(expiry)` — the *identical call on the identical shared
object* the venue's own settlement makes — and applies the venue's verbatim band rule
(`won ⟺ sp > lower && sp <= higher`; exactly-at-strike settles DOWN). First losing leg kills the
ticket instantly: the entire escrow sweeps back to the reserve and all liability is released before
later expiries even arrive (`:519-531`). `claim` (`:553-579`) pays the **owner field, never the
caller** — payout never depends on keeper liveness. `admin_void` (`:611-641`) refunds the stake if a
print never lands (after `last_expiry + grace_ms`) — "funds are never trapped". Legs must be
non-empty bands on **future** stamps at open (`:363-368`) so an opener can't pick known outcomes.
Suppliers: standard share vault over `liquid + locked`; they earn losing stakes, pay out winners
(`supply`/`withdraw`, `:300-328`; locked funds are not withdrawable).

Leg encodings (`:20-27`): UP at strike → `(strike, u64::MAX]`; DOWN → `(0, strike]`; RANGE →
`(lower, higher]`.

**EVM sketch (recommended port — this is a great hackathon centerpiece):**

```solidity
contract ParlayReserve {
    IERC20 quote; ISettlement feed;           // the same price source DreamDEX windows settle on
    uint liquid; uint locked; uint supplyShares;
    mapping(uint64 expiry => uint) lockedByExpiry;
    struct Leg { uint64 expiry; uint128 lower; uint128 higher; uint16 probBps; uint8 status; }
    struct Parlay { address owner; Leg[] legs; uint8 wonCount; uint8 status;
                    uint stake; uint maxPayout; uint houseLocked; }
    mapping(uint => Parlay) parlays;

    function openParlay(Leg[] calldata legs, uint stake, uint maxPayout) external; // recompute prob, floor-check stake, lock houseLocked
    function resolveLeg(uint id, uint idx) external;   // permissionless; read feed.priceAt(expiry); early-kill on loss
    function claim(uint id) external;                  // pays parlays[id].owner, never msg.sender
    function adminVoid(uint id) external;              // stake refund after grace if no print
    function supply(uint amt) external; function withdraw(uint shares) external;
}
```

On DreamDEX, per-leg probabilities can be read from the per-window pool's order book mid (removing
the v1 "opener supplies prob_bps" caveat — a genuine improvement over the original), or composed
off-chain and co-signed by our backend exactly as Yosuku does. If each leg's settlement is already
an ERC-6909 outcome token resolution, `resolveLeg` can instead read the market's resolved outcome.

---

## 6. Small packages

### 6.1 `take-board` — the social feed index

One function, one event, zero objects (`contracts/take-board/sources/take_board.move:48-66`):
`post_take(blob_id, market_id, order_id, side, strike_usd)` emits `TakePosted` with the author,
Walrus content blob, the market, and an **optional backing position id** — the feed surfaces
verifiable skin-in-the-game. "Gas-light by design… cheap enough to sponsor gas-free like the rest
of the app."

**EVM sketch**: `event TakePosted(address author, string blobUri, address market, uint256 orderId, uint8 side, uint64 strike, uint64 ts)`
behind a `postTake` function; index with logs. Optionally verify `orderId` ownership at post time.

### 6.2 `yosuku-rooms` — skin-in-the-game chat access

- `bet_registry` (`contracts/yosuku-rooms/sources/bet_registry.move`): `record(market_id)` is folded
  into every bet tx and permanently marks "this address bet on this market" (`:25-34`); idempotent,
  survives fast market expiry so eligibility outlasts the 1m/5m/1h window (`:8-9`). `has_bet`
  (`:37`) is the gate.
- `market_room_rule` (`contracts/yosuku-rooms/sources/market_room_rule.move`): a per-market chat
  room (Sui Stack Messaging group) whose self-serve `join` (`:75-85`) grants read+post only if
  `bet_registry::has_bet(caller, market)`.

**EVM sketch**: `mapping(address => mapping(bytes32 marketId => bool)) hasBet` written by the vault
on every fill; chat gating happens in our backend by reading it. One mapping, big social payoff.

### 6.3 `memory_market` — transferable access passes to agent memory

(`contracts/memory_market/sources/memory_market.move:1-14`.) Admin-gated listing (curation —
prevents listing a fake market on an agent you don't own, `:9-13`); `buy_pass` (`:95-115`) pays the
creator exactly `price` (excess refunded) and mints a **transferable `MemoryPass` object**;
`seal_approve` (`:118-120`) gates decryption to pass holders. The asset being sold is the agent's
*memory/playbook*, not copy-trade access.

**EVM sketch**: ERC-721 `MemoryPass` with `mint()` paying the creator; content access = backend
checks `balanceOf`/ownership before serving. ~80 lines, demoable.

### 6.4 `seal-pkg` — claim authority for walletless (tweet) onboarding

The onboarding trick (`contracts/seal-pkg/sources/handle_registry.move:1-13`): a tweet-onboarded
user has no wallet, so the relay generates the account's withdraw key, Seal-encrypts it, and
**discards the plaintext** — Yosuku holds no usable key (no honeypot, still non-custodial). Seal
key servers only release the key to whoever `seal_approve` authorizes:

- Before claim: no owner bound → `seal_approve` aborts for everyone → funds tradeable by the
  no-divert agent but un-drainable (`:5-11`).
- On claim: user proves handle ownership; the relay (`set_owner`, admin-gated, `:44-52`) binds the
  handle key to the verified wallet; only that wallet can unseal (`seal_approve`, `:68-74`,
  namespaced ids `registry_id ++ key`).

`attested_registry.move` is the hardened version (`:1-9`): **no admin path at all** — a binding
requires an ed25519 signature from the pinned enclave key over `(key ++ owner)`
(`set_owner_attested`, `:39-49`), making "only you — not even us" literally true (the relay can pay
gas for the tx but cannot forge the binding). Tests include a real signature vector plus forged-sig
and wrong-owner rejections (`:82-118`).

**EVM sketch**: only needed if we do social onboarding. `mapping(bytes32 handleKey => address owner)`
with `setOwnerAttested(key, owner, sig)` verifying an operator/enclave signature; content release is
a backend that checks the mapping. The economically important part is the *sequencing* — funds can
be traded (bounded) before the user ever has a wallet, and claiming is a pure on-chain right.

### 6.5 `waitlist-pkg`

(`contracts/waitlist-pkg/sources/waitlist.move:1-8`.) On-chain waitlist: `join(referrer)` records
one slot per wallet with a position and emits `Joined` — "demand as an un-fakeable signal" (every
entry cost a signed tx). ~50 lines; trivially an EVM contract + sponsored gas.

---

## 7. `services/private-bet-executor` — the private-bet desk

Node HTTP service (`services/private-bet-executor/server.mjs`), systemd-deployed, fronted by
Next.js API routes that hold a shared secret (mobile spec `MOBILE_INTEGRATION.md:21-33` — the
secret and executor URL never reach the client).

**What it does.** Opens bets whose on-chain position is *not linkable to the user's wallet*
("sponsored-session-manager" mode — honestly labeled link-reduction, **not** zk anonymity;
`README.md:13`, `MOBILE_INTEGRATION.md:9-16`). Per bet it creates a **fresh throwaway venue
account** (`createAccount`, `server.mjs:324-340`, via `private_budget::open_bet_slot` /
`new_self_owned` so each account is a new object, not derived from any address), funds it from the
user's pre-deposited private budget, mints, and later redeems.

**The unlinkability choreography** (the most interesting part; comment `server.mjs:665-675`):
opening is deliberately **three separate transactions** —

1. `charge_to_pool(owner, amount)` — names the owner, names no slot/market/side (`:369-377`);
2. `fund_slot_from_pool(slot, amount)` — names the slot, no owner (`:380-391`);
3. `mint_in_slot(slot, market, …)` — names slot + market; the call *has no owner argument*, so the
   opening tx cannot name the bettor even by accident (`:399-427`).

Nothing on chain holds an owner and a position at the same time. The code is candid that amount +
timing correlation remains and that pre-funding slots ahead of demand is the unfinished fix. Cashout
mirrors it in two hops: `sweep_slot_to_pool` (no owner) then `credit_from_pool(owner)` (no slot)
(`:800-827`) — because the earlier single-tx payout had put the wallet at input 9 beside the
position and "winning was enough to be identified" (`:360-367`).

**Auth model — three independent layers:**

1. **Transport**: `Authorization: Bearer <PRIVATE_BET_SHARED_SECRET>` between web backend and
   executor (`requireAuth`, `server.mjs:117-125`).
2. **Open**: a wallet **personal-message signature over a human-readable bet description**
   (`openAuth.mjs:23-36` — built "to be READ, not just verified": the wallet prompt says "UP,
   $64,500, 2.00 DUSDC"), 5-minute TTL, future-dating rejected, recovered signer must equal the
   claimed owner (`verifyOpenAuthorization`, `:45-75`). Without it the endpoint "is a faucet".
3. **Cashout/withdraw**: an **enclave-signed bearer ticket** is the only claim of ownership. The
   desk keeps no owner table ("a table the operator can read is not privacy",
   `enclaveTicket.mjs:3-7`); at cashout the owner is read *out of the signed ticket bytes*, never
   off the request (`server.mjs:757-770`). Ticket = 146-byte BCS record (intent, owner,
   session_manager, oracle, expiry, strike, side, stake, quantity, issued_at, nonce;
   `enclaveTicket.mjs:10-28`), ed25519-signed inside a Nitro enclave whose pubkey is pinned in env
   AND in an on-chain `ticket_seal::PrivateDesk` so a user can verify without trusting the box
   (`server.mjs:73-81`, `/health` publishes both, `:961-965`). The enclave enforces its own guard
   (stake cap, expiry) — a tampered host "can only be refused" (`enclaveTicket.mjs:87-90`).
   Withdrawals batch multiple claims but refuse mixed owners (`server.mjs:893-898`).

Operational hardening worth copying: prove the enclave can sign **before** money moves
(`assertEnclaveReady`, `:567-605`); record the ticket to disk *before* issuing it so a late failure
is recoverable (`:702-717`); serialize the JSON store behind a promise-chain lock to prevent
double-redeem races (`:539-547`); capture the venue's *actual* minted quantity from events rather
than the requested one (`mintedFromEvents`, `:280-299`); stake floor derived from the venue's
minimum net premium so users get a readable error instead of a deep MoveAbort (`:150-162`).

**API** (`server.mjs:969-996`): `GET /health` (readiness, caps, budget vault ids, enclave pubkey),
`POST /open`, `POST /cashout`, `POST /withdraw`. Gas is sponsored via Onara (`signAndExecuteSponsored`,
`:235-264` — sponsored-only, no self-paid fallback of the same tx). `venue729.mjs` is the venue
adapter (pricer construction, mint, permissionless redeem, order-id packing; header `:1-19`
documents the three silent-failure venue diffs it was rewritten for). `PRIVATE_LEVERAGE_PLAN.md` is
a parked design for private+leveraged combined (not built); its "open risks" section flags
operator-key contention when relay/keeper/executor share one key — relevant to our own service
design (separate keys per service).

**Somnia relevance**: the enclave-signed bearer-ticket + fresh-address pattern ports directly (fresh
EOA or CREATE2 account per bet, backend/TEE-signed EIP-712 ticket as the redemption claim, split
fund/trade/settle txs through a pooling contract). Recommend **drop full privacy** for the hackathon
but keep the *bearer-ticket claim* idea if we want "bet without connecting a wallet" demos.

---

## 8. `infra/onara` — the gasless mechanism

A Cloudflare Worker gas station (`wrangler.jsonc` — worker `yosuku-gas`, testnet). Flow
(`infra/onara/README.md:62-69`): the app builds a tx with `setGasOwner(sponsor)`; the user signs
(authorization only, pays nothing); `POST /sponsor` checks the policy, co-signs as gas owner, and
executes. Clients check `GET /status` first and must "never silently broaden policy".

**Policy model**: each JSON in `policies/` allowlists exact `pkg::module::function` targets, allowed
command kinds (MoveCall/SplitCoins/MergeCoins/TransferObjects), a `gasBudgetMax`, optionally
per-call `typeArguments` pinning (e.g. only `Coin<DUSDC>` transfers in `yosuku-wallet-send.json`)
and `callLimits` (account setup allows exactly one `create_manager`,
`yosuku-account-setup.json`). **A tx is declined unless EVERY call is allowlisted** — the README
documents a real outage where dropping one `subscribe` entrypoint silently broke the Fund-X-wallet
flow because its PTB bundled deposit + subscribe (`README.md:12-19`).

What each policy sponsors (the product surface of "gasless"):

| Policy | Flow covered |
| --- | --- |
| `yosuku-account-setup` | exactly one venue account creation per user |
| `yosuku-trading` / `-624` / `-729` | the core bet path per venue generation: account create/share/auth, deposit/withdraw, pricer + mint + settle-redeem, plus `bet_registry::record`; DUSDC-only type pins on coin helpers |
| `yosuku-vault` / `-624` / `-729` | vault deposit/withdraw/subscribe/cancel (both `subscribe_with_risk` and `subscribe` — see outage note) |
| `yosuku-strategy` / `-729`, `yosuku-copy` | strategy list/subscribe/update + social_vault deposit/withdraw/create_subscription/cancel_subscription |
| `yosuku-leverage` | trading_vault create/deposit/withdraw/open_leverage + underwrite request/cancel/settle/supply/withdraw + venue redeem paths |
| `yosuku-parlay` | `parlay::open_parlay` / `resolve_leg` / `claim` |
| `yosuku-private-budget` | private budget deposit/allocate/revoke/withdraw_to_sender (old + upgraded package ids both listed) |
| `yosuku-pool` | venue `predict::withdraw` ONLY — the `_note` records that sponsoring `supply` was farmed at ~20 tx/hour to drain the sponsor and inflate stats, so capital actions pay their own gas while withdraw stays sponsored so no supplier is stranded |
| `yosuku-rooms`, `yosuku-takes`, `yosuku-waitlist`, `yosuku-memory` | join/record, post_take, waitlist join, buy_pass |
| `yosuku-creator-recovery` | two-stage zkLogin+passkey controller registration then BuilderCode mint/claim — both targets required, each alone is unsafe (`README.md:71-76`) |
| `yosuku-wallet-send` | plain DUSDC transfers (type-pinned) |

**Deliberate omissions are policy too**: agent-executed calls (`agent_trade`, `authorized_trade`)
and admin calls are *not* sponsored — the agent pays its own gas by design, and "we would have paid
for the attempt" is treated as a real cost (`README.md:27-37`).

**Somnia port**: same design, different rails. Options: (a) a relayer service that accepts a
user-signed EIP-712 intent and submits the tx itself against a per-function allowlist (closest
1:1 port — the vault's functions take the user as a verified-signature parameter); (b) EIP-7702
delegation + a sponsor that only co-funds txs whose calldata selector+target is allowlisted; (c) an
ERC-4337 paymaster with a validation rule = the policy JSON. Keep three Yosuku lessons regardless:
whole-batch validation (every call allowlisted or decline), type/asset pinning, and per-flow budget
caps with farm-resistant omissions (never sponsor capital-intake actions).

---

## 9. `scripts/*.mjs` — one line each

Keepers / cranks:
- `keeper.mjs` — the underwrite-desk agent: watches `OrderRequested`, fronts + fills into the keeper-owned custody manager, redeems settled positions and cranks `settle` (force-pays traders); "permitted-but-not-trusted — the Move contract enforces every flow" (`scripts/keeper.mjs:191-203`).
- `margin-keeper.mjs` — production web-leverage keeper: FILL (`margin::fill` + same-PTB deposit/mint), CLOSE settled winners, LIQUIDATE settled losers or mid-round undercollateralised positions (`scripts/margin-keeper.mjs:218-228`).

Proof scripts (each is an on-chain end-to-end demonstration of a contract guarantee):
- `prove-escrow-fill.mjs` — proves the trustless open handshake: trader escrows, keeper fills, the Position receipt lands owned by the trader.
- `prove-margin-liquidation.mjs` — proves a *genuine* liquidation at 120% maintenance: 6x open, redeem at live mark, `liquidate` asserts on real proceeds, pool repaid, penalty to liquidator, rest to trader.
- `prove-open.mjs` — proves the underwritten leveraged-open PTB (reserve fronts → deposit → mint).
- `prove-creator-recovery.mjs` — proves the sponsored zkLogin+passkey creator-recovery protocol end-to-end with disposable keys.
- `fresh-cycle-test.mjs` — opens a fresh 2x position, lets the box keeper fill it, reads back the on-chain position (proves fill persistence).
- `test-open-leverage.mjs` — opens a 2x position through the real frontend path (`trading_vault::open_leverage`).

Setup / ops one-shots:
- `setup-margin.mjs` — stands up the margin desk (create+seed pool, create keeper custody manager, `create_desk`).
- `setup-reserve.mjs` — creates + seeds the underwrite `Reserve<DUSDC>`.
- `fund-pool.mjs` — supplies DUSDC into the web lending pool.
- `publish-underwrite.mjs` — publishes the yolev package via the SDK (bypassing a CLI panic).
- `create-keeper-manager.mjs` / `private-bet-create-manager.mjs` — create the keeper's / executor's venue manager.
- `private-bet-find-vortex-pool.mjs` — looks up the Vortex DUSDC pool object via their API.

Debug / probes:
- `debug-fill.mjs`, `debug-close.mjs` — manually drive a specific fill / redeem for a stuck order or position.
- `probe-quote.mjs` — devInspect venue quotes across oracles/strikes to find a healthy non-zero quote.
- `check-market-line.mjs` — sanity-checks strike-line/tick math against the predict server.

UI QA (playwright): `audit-capture.mjs` (full-route screenshot+console audit at mobile/desktop
widths as a walletless first-timer), `probe-chevron.mjs`/`probe-chevron2.mjs`/`probe-jp.mjs`
(hunt specific layout overflows), `shot-portfolio.mjs`/`shot-stats.mjs` (single screenshots).

---

## 10. `.github/workflows/ci.yml`

One job (`ci.yml:17-42`): checkout → Node 20 → `npm ci` → `npm run typecheck` → `npm test` (the
runtime-validation tests around `lib/sui/schemas.ts` — "the bet / claim / cashout boundary can never
silently regress") → `npm run lint` advisory-only (`continue-on-error: true`). Concurrency-cancels
superseded runs. No Move build in CI (contracts are built/deployed manually via `sui move build`).

---

## 11. Guarantees Yosuku sells — and how we'd get them on Somnia/DreamDEX

| # | Guarantee (user-facing promise) | How Yosuku gets it | Somnia/DreamDEX plan |
| --- | --- | --- | --- |
| 1 | **Gasless everything** — bet, join, post, subscribe without holding gas | Onara worker sponsors txs matched against per-flow `pkg::fn` allowlists; user signature is authorization only (§8) | Relayer service accepting user-signed EIP-712 intents (vault functions verify the signature and take the user as a parameter), or EIP-7702/4337 paymaster; either way keep the allowlist-of-selectors policy files, whole-batch validation, type pinning, and never-sponsor-capital-intake rules |
| 2 | **"The agent can trade for you but can never steal"** (no-divert custody) | vault624/social_vault: agent's only entry point debits the user into a position whose beneficiary is hard-wired to that user; withdraw is owner-gated and pays the caller; caps (`max_margin`, `max_leverage`) bound blast radius (§3, §4.1) | One `EventVault` contract: per-user ledger, `subscribe(agent, caps)`, `agentTradeFor(user, …)` with `require(msg.sender == subs[user].agent)` + caps, positions mapped to owners, permissionless `crankSettle` crediting owners. Use DreamDEX's `OperatorPermissionsRegistry`/`placeOrderFor` so the vault contract is the operator of its own market account; the user-facing policy stays in our contract. **Build this first.** |
| 3 | **Agent identity you can audit** (TEE attestation, per-action signatures, on-chain audit trail) | Nitro attestation pinned in `agent_registry`; every action carries a fresh ed25519 sig over its digest, re-derived on-chain (`yosuku_vault::predict_action_digest`); Walrus audit blobs + events (§2.1–2.5) | Hackathon version: backend "operator key" per agent registered in a small `AgentRegistry`, EIP-712 per-action signatures with nonce+TTL verified in the vault, `AuditEntry` events pointing at IPFS/S3 blobs. Digest-binding to exact params is cheap in Solidity (`keccak256(abi.encode(...))`) and worth keeping — it is what makes "the signature approved *this* trade" true |
| 4 | **Parlays with a solvent house** (AND-combos, big payouts, instant kill) | ParlayReserve escrows the full max payout at open, recomputes combined probability + correlation surcharge + margined stake floor on-chain, caps aggregate/per-expiry exposure, permissionless leg resolution on the venue's own settlement print, claim force-pays the owner (§5) | Port `parlay624` almost line-for-line as a Solidity `ParlayReserve` over ERC-20 quote; legs reference DreamDEX window outcomes (read the resolved outcome / settlement price the windows themselves use). Improvement available on EVM: derive per-leg probabilities from the on-chain CLOB mid at open instead of trusting client input. LP side is a standard share vault |
| 5 | **Leverage with capped downside** | Two models: margin desk (borrow + real mid-round liquidation at the live redeem mark, §4.4) and underwrite (house fronts notional for an upfront premium, no debt, nothing to liquidate, §4.5) | **Drop for the hackathon.** If a "boost" is wanted, port `underwrite` (much simpler: no pool, no keeper-liquidation, deterministic settlement; `fill` can buy outcome tokens inside the same function so the Sui same-PTB leak disappears) |
| 6 | **Copy trading without custody risk** | `strategy::subscribe` pays the creator and writes a subscriber-created, cap-bounded grant; the creator's agent trades subscriber funds into subscriber-owned positions (§4.1, §4.7) | A `Grant{agent, maxCost, maxLev}` table in the vault + `authorizedTradeFor`; strategy registry contract collects the fee and writes the grant in one tx. Leaderboard from events off-chain |
| 7 | **Private bets** (position unlinkable to wallet) | Fresh throwaway account per bet, 3-tx charge/fund/mint split so no tx names owner+position together, enclave-signed bearer ticket as the only redemption claim, pinned pubkey published on-chain (§7) | Drop full privacy; optionally keep the bearer-ticket pattern (backend-signed EIP-712 claim redeemable by whoever holds it) for a walletless-demo flow. Be as honest as Yosuku's own copy: "link-reduction, not anonymity" |
| 8 | **Paid knowledge with verifiable provenance** (playbooks, agent memory) | `strategy_market` (Seal paywall = on-chain predicate; plaintext PnL manifest verifiable pre-purchase) and `memory_market` (transferable pass NFT) (§2.6, §6.3) | ERC-721/1155 access passes + `hasAccess` view; content encryption gated by a backend that checks the chain (accept the trust downgrade or skip encryption and sell signed content). Keep the *plaintext provenance manifest* idea — link the listing to real tx hashes |
| 9 | **Skin-in-the-game social** (takes feed, bet-gated rooms) | `take_board` event with optional backing position id; `bet_registry` mapping folded into every bet; room join gated by `has_bet` (§6.1–6.2) | `hasBet[user][market]` written on fill + a `TakePosted` event; gate chat/comments in the backend. Nearly free to build, high demo value |
| 10 | **Un-fakeable traction** (waitlist) | one signed join tx per wallet, on-chain count + referrer (§6.5) | 30-line contract + sponsored gas |
| 11 | **Liveness never becomes custody** (a dead operator can't trap funds) | Recurring pattern everywhere: trader `cancel` reclaims unfilled escrow; `settle`/`resolve_leg`/`claim`/`crank_settle` are permissionless; collections allowed while paused; risk scores fail open when stale; `admin_void` refunds stuck parlays after a grace window | Adopt as a design rule for every contract we write: every keeper-driven step needs a permissionless or owner-driven fallback, every pause leaves the exit open, every stuck state has a time-gated refund |

**Suggested hackathon build order** distilled from the above: (1) `EventVault` (no-divert ledger +
operator grants + permissionless settle) on DreamDEX per-window pools; (2) relayer/paymaster with
Onara-style policy files; (3) `ParlayReserve` over window outcomes; (4) takes feed + bet registry;
(5) strategy/memory passes if time allows. Leverage, TEE attestation, and privacy are the cut lines.
