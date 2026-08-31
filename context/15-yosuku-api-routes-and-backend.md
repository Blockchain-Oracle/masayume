# Yosuku — API routes & backend architecture

Reference repo: `/Users/abu/dev/hackathon/sommina-events/reference/yosuku` (Next.js App Router, Sui testnet).
Scope: all 35 route handlers under `app/api/**`, the five supporting libs (`lib/backendUrl.ts`, `lib/sponsor.ts`, `lib/memwal.ts`, `lib/xLink.ts`, `lib/claimOAuth.ts`), the README architecture, and a summary of `PORTFOLIO_UX_SPEC.md`.

Purpose: tell the DreamDEX-on-Somnia team what the server side does, which pieces to reproduce as-is (`portable`), which to re-implement with EVM calls (`adapter`), and which to drop (`drop`, Sui-only).

---

## 1. Big picture

Yosuku's "backend" is **Vercel serverless route handlers only — there is no database anywhere**. Every route is one of four shapes:

1. **Authenticated proxy to a private box service.** A machine ("the box", reachable on Tailscale/private IPs) runs several small HTTP services: the claim relay (`CLAIM_EXECUTOR_URL`, port 8789), the private-bet executor (`PRIVATE_BET_EXECUTOR_URL`), the CCTP keeper (`CCTP_KEEPER_URL`), the copy-desk keeper (`KEEPER_HEALTH_URL`, port 8792), the agent-spec registry (`AGENT_SPEC_REGISTRY_URL`), and the alert keeper (`ALERT_SERVER_URL`). The route holds the shared secret, validates the request shape at the edge, forwards, and passes the JSON back. The browser never learns the box address or the secret.
2. **Server-side signer.** A dedicated key lives only in env (`FAUCET_PRIVATE_KEY`, `ROOM_ADMIN_SECRET`, `SUINS_SIGNER_KEY`) and the route signs and submits a Sui transaction itself (faucet drip, room creation, subname mint). Never the deployer key.
3. **Chain/third-party read aggregator with in-process cache.** State lives on-chain (Sui GraphQL/gRPC/JSON-RPC) or at a public API (CoinGecko, Polymarket, RSS); the route pages it, caches it in a module-level variable and/or CDN headers, and shapes it for the UI. Cache-correctness bugs are heavily documented in comments — this is where most of the transferable lessons are.
4. **LLM gateway.** `/api/sensei` holds the DeepSeek key server-side and injects a system prompt + market snapshot + per-user memory (MemWal on Walrus).

Auth patterns, in increasing strength:

- **Shared secret header to box** (`x-claim-secret`, `x-cctp-auth`, `x-yosuku-relay-token`, `Bearer <secret>`): route-to-box, never user-facing.
- **Founder passphrase** (`x-studio-pass` checked against `STUDIO_PASSPHRASE`) for the house posting studio.
- **HMAC-signed session cookie** (`x_sess`, signed with `CLAIM_SESSION_SECRET`) proving which X account the browser is; the authorId inside is trusted *because* it's signed and is never taken from the client body.
- **Wallet personal-message signature** verified server-side (`verifyPersonalMessageSignature` against Sui GraphQL — needed for zkLogin sigs) for linking/unlinking.
- **Enclave-signed payloads** (bind tokens, private-bet cashout tickets): the signed bytes *are* the authority; the route forwards them opaquely and validates only shape/length.

The recurring philosophy, stated repeatedly in comments: no client-supplied identity is ever trusted; caching is only applied where staleness cannot lie to the user; every proxy degrades to an honest 501/503 "not configured" answer with the required upstream contract spelled out in the error body.

---

## 2. Route table

| Method(s) | Path | Purpose | Portability |
|---|---|---|---|
| POST | `/api/sensei` | LLM trading-companion chat (DeepSeek) with market snapshot + MemWal memory | **portable** |
| GET | `/api/ticker` | BTC/ETH/SOL/SUI/ALEO/DOGE prices + Fear & Greed (CoinGecko, alternative.me) | **portable** |
| GET | `/api/crypto-news` | Headlines from Cointelegraph/Decrypt RSS with regex sentiment | **portable** |
| GET | `/api/polymarket` | Trending Polymarket markets (Gamma metadata + CLOB live prices) | **portable** |
| GET | `/api/leaderboard` | 24h trader rankings from on-chain order events, in-process cached | **adapter** (idea portable, event source swaps to EVM logs) |
| GET | `/api/traction` | Cached headline stats (wallets/bets/volume) from a ~20s chain walk | **adapter** |
| GET | `/api/oracles` | Market list + spot for the web app, `{oracles, prices}`; never CDN-cached | **adapter** |
| GET | `/api/spot` | Live BTC spot + real oracle-observation history for sparklines | **adapter** |
| GET | `/api/predict/[...path]` | Caching CDN proxy in front of the slow upstream market-data server | **portable** (pattern) |
| GET | `/api/yosuku/quote` | Exact on-chain quote via devInspect (read-only eth_call equivalent) | **adapter** |
| POST | `/api/bet/build` | Build an unsigned bet tx for an external signer (MCP/agents), sponsored gas | **adapter** |
| POST | `/api/faucet` | Test-USDC drip, triple-gated (cookie + on-chain recency + balance) | **adapter** |
| POST | `/api/fund-preview` | Paystack test-payment → DUSDC drip. **CLOSED (farmed); kill-switch env** | **drop** (keep as a cautionary tale) |
| GET/POST | `/api/deposit/cctp` | Browser↔CCTP-keeper bridge for cross-chain USDC deposits | **drop** (Sui/CCTP-specific; pattern reusable) |
| GET | `/api/claim/info` | What auto-account is waiting for a wallet (relay lookup) | **adapter** |
| POST | `/api/claim/bind` | Bind signed-in X handle → wallet on-chain (relay does `set_owner`) | **adapter** |
| POST | `/api/claim/bind-attested` | Forward an enclave-minted bind token to the relay | **adapter** |
| GET | `/api/claim/x/start` | Begin X OAuth2+PKCE (canonical-origin redirect, state cookies) | **portable** |
| GET | `/api/claim/x/callback` | Token exchange, fetch profile, set signed 30-day session cookie | **portable** |
| GET | `/api/claim/x/me` | Who is signed in + what the relay says routes to which wallet | **portable** (relay call = adapter) |
| POST | `/api/claim/x/link` | Write authorId→wallet routing (wallet sig verified server-side) | **adapter** |
| POST | `/api/claim/x/unlink` | Remove the routing; clears session cookie | **adapter** |
| POST | `/api/private-bet/open` | Open a private bet via the TEE executor (owner-signed auth) | **adapter** |
| GET | `/api/private-bet/status` | Executor readiness/health for the UI badge | **portable** (pattern) |
| POST | `/api/private-bet/cashout` | Present enclave-signed claim ticket for payout | **adapter** |
| POST | `/api/private-bet/withdraw` | Batch-withdraw credited claims (fast/private modes) | **adapter** |
| POST | `/api/agent-spec` | Register a creator agent's strategy spec with the keeper-side registry | **adapter** |
| GET | `/api/desk/health` | Copy-desk keeper heartbeat, liveness re-derived from tick age | **portable** (pattern) |
| GET/POST | `/api/studio/[action]` | Founder-gated Line Studio proxy (options/lines/preview/post) | **adapter** |
| GET/POST | `/api/creator-card/[action]` | Public rate-limited card renderer bridge (options/preview only) | **portable** (pattern) |
| GET/POST/DELETE | `/api/alerts` | Mobile→box price-alert proxy | **portable** (pattern) |
| POST | `/api/room/ensure` | Idempotent server-side creation of a per-market encrypted chat room | **drop** (Seal/Sui-Stack-Messaging-specific; idempotent-ensure pattern portable) |
| GET/POST | `/api/suins/claim` | Mint `<label>.yosuku.sui` leaf subname on mainnet | **drop** (SuiNS; ENS-subname analogue possible) |
| POST | `/api/resolver/bet` | Legacy proxy to old resolver backend `/api/bet` | **drop** |
| GET | `/api/resolver/round-meta/[roundId]` | Legacy proxy to old resolver `/api/round-meta/:id` | **drop** |

---

## 3. Multi-route flows

### 3a. Trade-from-X and the claim flow (`claim/*`, `claim/x/*`, `lib/xLink.ts`, `lib/claimOAuth.ts`)

This is Yosuku's headline feature: **a tweet/reply becomes an on-chain trade**, and an X identity is durably bound to a wallet. Three actors:

- **The relay** (box service at `CLAIM_EXECUTOR_URL`): watches X mentions/replies 24/7, holds the auto-account store and an admin key, executes trades from a bounded vault, and answers `/claim/*` HTTP endpoints (`info`, `by-address`, `by-author`, `bind`, `bind-attested`, `link`, `unlink`). Authenticated by the `x-claim-secret` header (README `README.md:155` — a single systemd-managed box).
- **The Next.js routes**: identity plumbing between browser, X OAuth, and the relay.
- **The Move contract**: `social_vault::agent_trade` hard-wires the position owner to the user and `withdraw` is owner-gated, so even a fully prompt-injected executor can only move a user's funds into the user's own position (README `README.md:70-83`). The no-divert property is structural, not procedural — this is the single most important design idea to carry to Somnia (an escrow/vault contract where the relayer key can *open positions for* an owner but every payout path is hard-wired to that owner).

Two on-ramps exist, depending on whether the tweeter already has a wallet:

**Path 1 — tweet first, wallet later (sealed auto-account).** A user with no wallet replies "@yosuku BTC up 3x". The relay creates a *sealed auto-account* keyed by their X authorId and trades from it. Later they visit `/claim`, sign in with X, and either (a) run the enclave flow that produces a signed **bind token** — handle and destination wallet both verified inside the TEE and sealed inside the token — which `POST /api/claim/bind-attested` (`app/api/claim/bind-attested/route.ts:12-27`) forwards opaquely to the relay, or (b) use `POST /api/claim/bind` (`app/api/claim/bind/route.ts:13-31`), where the authorId comes from the *signed session cookie* — never from the client body — and the relay performs the on-chain `set_owner`. `GET /api/claim/info?wallet=` (`app/api/claim/info/route.ts:10-25`) tells the claim page what is waiting; unconfigured relay degrades to `{account: null}`.

**Path 2 — wallet first, ordinary link.** A signed-in X user with a connected wallet calls `POST /api/claim/x/link` (`app/api/claim/x/link/route.ts:27-58`). The comment at `:20-26` explains why this exists separately from `bind`: `bind` only ever *claims* a sealed auto-account and refuses anyone without one, which left the ordinary path broken — signed in, funded, and every tweet landing unrouted because nothing wrote `authorId → address`. `link` writes that mapping. The wallet must sign the exact message from `lib/xLinkMessage` (`lib/xLink.ts:1-7`):

```
Yosuku X account link
X user: <authorId>
Wallet: <0x…, lowercased>
```

and the route verifies it with `verifyPersonalMessageSignature` **via Sui's GraphQL client** because zkLogin signatures cannot be checked locally (`app/api/claim/x/link/route.ts:37-43` — passing only `address` made every Google-wallet user fail). `unlink` mirrors it with a message that spells out the consequence ("This removes the X route only. Funds remain in the wallet-owned betting balance.", `lib/xLink.ts:9-16`) and deletes the session cookie on success (`app/api/claim/x/unlink/route.ts:46`).

**The OAuth sub-flow** (how the browser proves which X account it is):

```
Browser                    /api/claim/x/start            x.com               /api/claim/x/callback           Relay
   |  GET start?return=/portfolio  |                       |                         |                         |
   |------------------------------>| origin != registered  |                         |                         |
   |   302 to canonical origin     | callback origin?      |                         |                         |
   |<------------------------------| redirect first (:20-25)|                        |                         |
   |  GET start (canonical)        |                       |                         |                         |
   |------------------------------>| set x_v (PKCE verifier), x_s (state), x_ret     |                         |
   |   302 x.com/i/oauth2/authorize  (httpOnly, 600s, :39-42)                        |                         |
   |---------------------------------------------------->|                           |                         |
   |          user approves (scope: users.read tweet.read)                           |                         |
   |   302 callback?code&state                            |                          |                         |
   |--------------------------------------------------------------------------------->| verify state==x_s      |
   |                               |                       |  POST /2/oauth2/token   | (confidential Basic auth,|
   |                               |                       |<------------------------| retry as public PKCE on |
   |                               |                       |  GET  /2/users/me       |  invalid_client, :47-59)|
   |                               |                       |<------------------------|                         |
   |   302 /claim?x=1  + Set-Cookie x_sess = HMAC({authorId, handle, t}), 30 days    |                         |
   |<---------------------------------------------------------------------------------|                        |
   |  GET /api/claim/x/me?wallet=0x…                                                  |                        |
   |---------------------------------------------------------------------------------------------------------->|
   |  { authorId, handle, account, binding, signedIn }   (session + relay merged)     |   /claim/by-author,    |
   |<-----------------------------------------------------------------------------------  /claim/by-address    |
```

Key decisions worth copying:

- **Canonical-origin bounce** (`app/api/claim/x/start/route.ts:15-25`): PKCE cookies must be written on the origin that receives the callback; users entering via www/preview/localhost otherwise "authorize successfully" and get asked to connect again forever.
- **Session cookie signing** (`lib/claimOAuth.ts:10-20`): HMAC key from `CLAIM_SESSION_SECRET`, with a domain-separated SHA-256 derivative of `CLAIM_SHARED_SECRET` as migration fallback and a hard refusal if neither is set — the comment explains that a fallback literal in a public repo would let anyone mint a session for any handle and steal tweet-funded accounts.
- **30-day TTL, enforced in both cookie and payload** (`lib/claimOAuth.ts:33-36`, callback `:112-120`): the shorter of the two always wins, so both read the same constant. It was 30 minutes; the portfolio told returning linked users "Connect X first" on nearly every visit.
- **`/api/claim/x/me` reads two sources deliberately** (`app/api/claim/x/me/route.ts:11-16, 50-54`): the cookie says who is signed in *on this browser*; the relay binding says which X account durably routes to a wallet *on any device*. With no session but a known binding it answers `signedIn: false` with the binding, so display works but identity-proving actions still demand sign-in (`:29-38`).

### 3b. Private bet (`private-bet/*`)

Private bets run through a TEE-backed executor on the box. The Next.js routes are validating proxies with a Bearer shared secret; the security model migrated from "trust the caller's fields" to "**trust only enclave-signed bytes**", and the comments record the exploits that forced each step:

```
Browser ── POST /api/private-bet/open ──────► executor /open      (desk funds the mint)
             body: owner, vortexPool, oracleId, expiry, strike, isUp,
                   stakeMicro, quantity, maxCostDusdc,
                   authSignature + issuedAtMs  ◄── owner's proof; without it the
                                                   endpoint is a faucet forwarding an
                                                   attacker-chosen owner with our Bearer
                                                   token (open/route.ts:15-19)
             ◄─ { digest, costDusdc?, sessionAddress?, entryDigest?, returnDigest? }

Browser ── GET /api/private-bet/status ─────► executor /health
             ◄─ { ready, label READY|BETA, reasons[], vortexPool, mode,
                  sessionAddress, maxStakeDusdc, privateBalanceEnabled,
                  withdrawModes: ('fast'|'private')[] }        (status/route.ts:34-46)

Browser ── POST /api/private-bet/cashout ───► executor /cashout
             body: vortexPool, ticketHex (exactly 146 bytes, the BCS ticket layout),
                   signatureHex (exactly 64 bytes, ed25519)     (cashout/route.ts:36-39)
             The owner and every parameter live INSIDE the signed bytes; a forged or
             edited claim fails the signature check at the desk (cashout/route.ts:6-11).

Browser ── POST /api/private-bet/withdraw ──► executor /withdraw
             body: vortexPool, mode 'fast'|'private', claims[{ticketHex, signatureHex}]
             Old shape took owner + digests → guessing a digest drained someone else's
             credited balance to your address (withdraw/route.ts:6-8).
```

All three mutating routes return a **501 with the required executor contract in the error body** when `PRIVATE_BET_EXECUTOR_URL` is unset (e.g. `open/route.ts:67-82`) — a self-documenting integration pattern worth keeping. Timeouts: open/cashout 30s, withdraw 45s, health 5s. Env: `PRIVATE_BET_EXECUTOR_URL`, `PRIVATE_BET_SHARED_SECRET`, plus `PRIVATE_BET_DUSDC_POOL`/`NEXT_PUBLIC_VORTEX_DUSDC_POOL` fallbacks for the status readout.

Transferable design: pin exact byte-lengths at the edge, put identity inside signed payloads not JSON fields, and never attach your server credential to caller-controlled identity.

### 3c. Sensei (`sensei/route.ts` + `lib/memwal.ts`) — the LLM companion

`POST /api/sensei` (`app/api/sensei/route.ts:14-85`). Server-only DeepSeek gateway (`https://api.deepseek.com/v1/chat/completions`, model `deepseek-chat`, temperature 0.4, max_tokens 400, 28s timeout, `maxDuration = 30`). Request:

```json
{ "messages": [{"role": "user"|"assistant", "content": "…"}],   // last 12 kept
  "market": { …arbitrary live snapshot gathered by the client… },
  "userId": "0x…",            // optional; scopes persistent memory
  "restless": true }          // client-side tilt cue: rapid-fire asking
```

Response: `{ reply }` or `{ error }` (503 no key, 400 bad input, 502 upstream). The **market snapshot is deliberately unstructured** — the client gathers whatever is live and the route injects `JSON.stringify(market)` into the system prompt (`:56`); if absent the prompt says so explicitly rather than letting the model guess.

**The system prompt is the product.** Quoted verbatim from `app/api/sensei/route.ts:42-58` (each line is one array element, joined with spaces):

> 'You are Sensei, the trading companion inside Yosuku, a Bitcoin prediction market on DeepBook Predict (Sui testnet).'
>
> 'The game: people bet UP or DOWN on short BTC rounds. UP wins if BTC is above the line at close. DOWN wins if it is below.'
>
> 'Your voice: calm, sharp, human. You are the steady friend who actually reads the tape, not a hype account and not a disclaimer bot. Short sentences. Say the real thing, then stop.'
>
> 'Every read gives three things: a side (UP, DOWN, or sit it out), one honest reason, and the risk that would prove you wrong. Keep it to 2 to 4 sentences. Call a coin flip a coin flip. Never promise an outcome.'
>
> 'Ground truth only. Reason strictly from the live market data below. Never invent a price, a level, or a number. If the data is not there, say so plainly and ask for it instead of guessing.'
>
> 'This is testnet. Test funds, not real money. Frame it as a read and a game, never as real-money financial advice.'
>
> 'Hard style rules, follow them exactly: no emoji, ever. No em dashes and no en dashes, ever; use a period, a comma, or a colon instead. No exclamation marks. No filler like "as an AI" or "it is worth noting".'
>
> 'Never use the word "bell". Not "at the bell", not "before the bell", not "the next bell". The round has a close, so say close, round, market, or time left.'
>
> **The Brake** — 'THE BRAKE, your most important job: you are the one voice in this app allowed to say do not take this one. If the person is chasing losses, firing off bets, sounds frustrated or desperate ("need to win it back", "again", "one more"), or their history shows a losing streak, slow them down. Name it plainly and kindly. Offer to sit the next round out together. Never encourage chasing or making it back. Talking someone down beats another bet. That is the whole point of you.'

When `restless: true`, one more line is appended: *'Signal: this person is asking fast in a short window, a tilt cue. Check their pace gently before you give the read.'* (`:55`). The Brake plus the client-computed restless flag is a genuinely differentiating responsible-gambling feature — cheap to port (any LLM provider) and demo-friendly.

**Memory** (`lib/memwal.ts`): per-user persistent memory on Walrus via the `@mysten-incubation/memwal` SDK, namespace `sensei:<lowercased userId>` (`:35-38`), delegate key server-only. Recall: semantic query on the last user message, `limit 4`, `maxDistance 0.7` (`:41-51`); injected into the prompt as *'What you remember about this person (use it to personalize the read, never recite it back word for word): - …'* (`route.ts:57`). Write: fire-and-forget `rememberFact(userId, lastUser)` after a successful reply (`route.ts:80`). Everything is best-effort and never throws — unconfigured, anonymous, or relayer-paused simply means no memory this turn (`memwal.ts:4-7`). Env: `MEMWAL_PRIVATE_KEY`, `MEMWAL_ACCOUNT_ID`, `MEMWAL_SERVER_URL` (default `https://relayer-staging.memory.walrus.xyz`), `MEMWAL_NAMESPACE` (default `sensei`). For Somnia: swap MemWal for any vector store or even a KV of recent facts; keep the "memory enriches, never blocks" contract.

### 3d. Studio & creator-card — what creators can do

Both routes front the **same** box endpoints (`${CLAIM_EXECUTOR_URL}/studio/*`, secret `x-claim-secret`) but expose different slices to different audiences:

- `/api/studio/[action]` (`app/api/studio/[action]/route.ts`) — **founder-only**. Gated on header `x-studio-pass === STUDIO_PASSPHRASE` (`:14`); allowed actions `options | lines | preview | post` plus a cheap `auth` ping (`:12, 29`). The browser only ever sends the passphrase; the route swaps it for the box secret (`:2-6`). `post` publishes a market card **from the house X account** — which is why it stays founder-gated.
- `/api/creator-card/[action]` (`app/api/creator-card/[action]/route.ts`) — **public, read-only**: GET `options` (which live markets/strikes are offered) and POST `preview` (render a card image) only; `post` is deliberately absent (`:3-5`). Per-IP in-memory rate limit, 30 req/min keyed on `x-vercel-forwarded-for` (`:10-49`); `private, no-store` cache headers; upstream error text is only passed through if it's a short string, else replaced by a safe public message (`:70-77`). Input hygiene worth copying: the creator handle is untrusted display text headed into an image renderer, so it's constrained to X's actual `^[A-Za-z0-9_]{1,15}$` grammar and silently *dropped* (not rejected) when invalid — "a bad handle costs the creator their byline and never their card" (`:124-129`). marketId must be a 32-byte hex id; strike must be 1–10,000,000 USD (`:130-135`).

So the creator story server-side is: anyone can browse options and preview a card with their handle as byline; publishing from the house account is founder-only; creators earn fees via an on-chain BuilderCode (see leaderboard §3i and the portfolio spec's "Creator earnings" pool).

### 3e. Agent-spec & desk/health — the attested agent registry and its heartbeat

- `POST /api/agent-spec` (`app/api/agent-spec/route.ts`): when a creator lists an attested strategy, the on-chain listing pins the hard caps and the agent address (= the sealed enclave address); this route registers the **direction logic** the enclave will evaluate — `{ strategyId, agent, creator, spec: { preset: 'momentum'|'reversion', lookback: 2–12, thresholdBps: 0–4000 } }`, all three ids strictly `0x` + 64 hex (`:22-41`). Forwarded to the keeper-side spec registry (`AGENT_SPEC_REGISTRY_URL` + Bearer `AGENT_SPEC_SHARED_SECRET`) "so specs never touch a third party" (`:3-7`); 501-with-contract when unconfigured.
- `GET /api/desk/health` (`app/api/desk/health/route.ts`): heartbeat of the copy-trading keeper. Two hard-won rules encoded here: (1) the keeper serves health itself so a dead process yields nothing on the socket, and this route reports that honestly instead of a cached "healthy" — the desk once showed "Copying, watching Bitcoin" for **ten days** while every signal was skipped (`:2-6`); (2) liveness is **re-derived** rather than trusted: `live = (now - lastTickAt) < max(180s, intervalMs*3)`, and `ok = live && cosignerOk !== false` (`:22-25`). Always answers 200 (even "keeper unreachable") so the UI can render the truth. Env: `KEEPER_HEALTH_URL`.

Together with the private-bet executor these form the "Live Desk": on-chain listing (caps + agent address) → spec registry (what it trades) → keeper (executes) → health route (proves it's alive). The health-derivation pattern ports directly.

### 3f. `predict/[...path]` — the caching proxy

`GET /api/predict/*` (`app/api/predict/[...path]/route.ts`) proxies `https://predict-server.testnet.mystenlabs.com` (~1s TTFB) and puts Vercel's CDN in front — repeat market opens go sub-100ms (`:1-7`). The whole route is the `cachePolicy` table (`:13-24`):

| Path family | s-maxage | stale-while-revalidate | Why |
|---|---|---|---|
| `managers/*` | **never cached** | — | per-user; a fresh trade must show immediately |
| `*/prices/latest`, `*/svi/latest` | 8s | 30s | feeds live trade pricing |
| `*/prices*` (history) | 30s | 300s | sparklines, slow-moving |
| `predicts/*` | 15s | 120s | vault stats |
| `oracles/*` | 5s | 30s | state/svi |
| `trades/*`, `positions/*` | 10s | 60s | shared reads |
| default | 5s | 30s | |

Headers set on both `Cache-Control` and `CDN-Cache-Control`; the upstream fetch also uses Next's data cache (`next.revalidate = sMaxAge`) so a CDN miss still doesn't hammer upstream (`:35-38`). Errors and uncached paths get `no-store`. **Highly portable**: put exactly this in front of any slow indexer/subgraph on Somnia — the one rule being "user-scoped data is never cached".

### 3g. `resolver/*` — legacy

`POST /api/resolver/bet` and `GET /api/resolver/round-meta/[roundId]` are thin pass-throughs to an old resolver backend, resolved by `lib/backendUrl.ts:11-27`: `BACKEND_URL`/`NEXT_PUBLIC_BACKEND_URL` if set; otherwise `http://localhost:3001` **only on local hosts**, else a hard throw — the comment records that guessing `:3001` in production sent every call to a port that never served anything and burned a 5s timeout per call. Drop both; keep the "never guess an upstream in production" lesson.

### 3h. Money in: faucet, fund-preview, deposit/cctp

**`POST /api/faucet`** (`app/api/faucet/route.ts`) — signs with a dedicated faucet key (`FAUCET_PRIVATE_KEY`), *never* the deployer (`:1-3`). Drips 2 DUSDC (open web) or 5 DUSDC when the request carries a valid `onboardKey` — the X-Predict relay's shared key, so auto-onboarded tweeters start with a bigger stake (`:12-31`; note the deliberate acceptance of both the env key and a built-in literal so the two machines can't drift, which once silently downgraded every X onboard to $2). Three stacked gates, no external store (`:5-10`):

1. per-device: httpOnly cookie `yfp_claim`, 24h (`:77-82`);
2. per-account: **the chain is the store** — scan the faucet wallet's outgoing txs for a DUSDC transfer to this address in the last 24h (`fundedRecently`, `:42-61`; fail-open);
3. balance gate: already holding > 3 DUSDC → friendly no-op success (`:86-90`).

Also encodes a Sui-specific bug worth knowing about generally: query what the wallet *holds*, not what it holds as coin objects — 2000 DUSDC sat in the address balance while `getCoins` reported 1.19 and every claim was refused (`:98-113`). Adapter: same three gates on Somnia with an ERC-20 `Transfer` log scan or a tiny KV.

**`POST /api/fund-preview`** (`app/api/fund-preview/route.ts`) — Paystack test-mode payment → DUSDC to the user's own wallet. **Closed 2026-08-26 after being farmed** (`:40-56`): ten test receipts in five minutes drained the shared faucet wallet 744 → 1.19 DUSDC. Three independent holes, each sufficient: references never recorded (one payment replays forever); `amountDusdc` client-supplied and never checked against what was paid; verification optional (no `PAYSTACK_SECRET_KEY` → `paystackVerified` returns true). Gated behind `FUND_PREVIEW_OPEN === 'i-fixed-the-replay-hole'`. Do not port; do port the checklist (single-use references need a store; credited amount must derive from the *verified* paid amount; verification mandatory).

**`/api/deposit/cctp`** (`app/api/deposit/cctp/route.ts`) — browser↔CCTP-keeper bridge (keeper on Tailscale, unreachable from browsers by design, `:1-6`). GET no params → `{configured}` health; GET `?domain=&tx=` → status of one deposit (both params strictly validated before URL interpolation, `:32-36`); POST `{sourceDomain, txHash, user}` → hand a broadcast burn to the keeper. Two good error postures: a keeper blip returns `{status:'unknown'}` 200 — "must not read as 'your deposit failed'… keep polling" (`:39-41`); a failed POST is recoverable because the burn already happened and anyone can relay it (`:60-62`). Sui/CCTP-specific: drop, unless DreamDEX wants a cross-chain USDC rail, in which case the shape transfers.

### 3i. Data & misc routes

**`GET /api/leaderboard`** (`app/api/leaderboard/route.ts`, 499 lines — the densest lessons file in the repo). 24h trader rankings built **from on-chain order events, not an indexer** — the old indexer served only a retired deployment and the board went blank with no error (`:5-15`). Mechanics: two type-scoped GraphQL event scans (`OrderMinted` + three redeem event types) over a 24h window, folded per-account, ranked by `computeLeaderboard624`, top 50 returned, 5-minute in-process cache, `maxDuration 60`. Notable decisions, each earned in production:

- **24h window, not 7d** (`:38-45`): a week is 15,000+ events across 300+ pages and never completed at any page cap, so every weekly total was a partial scan reported as fact.
- **Retry pages; never `break` on a bad response** (`:82-101`): a dropped page is indistinguishable from "no more data"; three runs gave 183/231/199 traders on identical state. `meta.complete` goes false if any page dropped.
- **Membership by builder code, not gas sponsorship** (`:26-28, 176-186, 195-206`): every mint Yosuku routes stamps `YOSUKU_BUILDER_CODE` on the account; gas sponsorship became insufficient once some users paid their own gas. Currently the board is venue-wide with only protocol/desk (`self_owned`) accounts excluded (`:414-420`) — the tradeoff is stated in comments.
- **Synthesize losing redemptions** (`resolveSettled`, `:305-357`): nobody redeems a losing bet (payout 0, gas-only), so left alone the board counts wins and drops losses. A settled loss is final; the route reads the settlement price per market and fabricates the zero-payout redemption the chain will never emit. Unredeemed *winners* stay out until actually cranked.
- **Sort oldest-first before folding** (`:396-399`): a redeem only counts if its mint was seen first; without the sort every winner booked its cost and dropped its payout.

Response: `{ rankings: […top 50], meta: { period:'24h', windowStartMs, windowEndMs, rankedTraders, totalWallets, closedCalls, totalVolume, complete, unmatchedRedemptions }, records: [] }`. Adapter: same architecture over EVM logs (`eth_getLogs` on your Mint/Settle/Claim events) — all five decisions above transfer verbatim.

**`GET /api/oracles`** (`app/api/oracles/route.ts`) — the market list the web app trades from, byte-compatible with a legacy shape: bare array of oracle rows, or `?prices=1` → `{ oracles, prices: {[id]: {spot}} }`. Markets come from `MarketCreated` events (GraphQL, paged), spot from reading the PythFeed object over gRPC — the exact value markets settle against, no indexer hop (`:123-127`). Three cache rules earned in production: **never CDN-cache** — `status` is computed from `Date.now()`, so a cached copy actively lies, and `x-vercel-cache: HIT` once served 8 "active" markets of which only 2 were live (`:6-11`); **no fire-and-forget SWR in serverless** — the instance freezes on response so a background refresh never runs and the snapshot drifts forever; await the refresh instead (`:170-183`); **restamp status per request** against this request's clock (`:186-199`). In-process TTLs: markets 15s, price 5s; on total failure serve the last good cache. Adapter: identical structure reading your Somnia factory events + oracle feed.

**`GET /api/spot`** (`app/api/spot/route.ts`) — live BTC spot **plus genuine history** for sparklines: pages `oracle_lane::ObservationRecorded` events (the oracle's own settlement-feed observations, ~200 points, filtered to the settlement feed id, `:66-75`), 4s in-process cache, `no-store`. Replaced a per-instance rolling buffer that started empty on cold start (blank chart for 20s, instances disagreeing). Refuses to invent a price: empty history → 503 with `usd: null` — "Empty is honest; stale or fabricated is not" (`:92-95`). Response: `{ usd, tsMs, history: [{usd, tsMs}] }`.

**`GET /api/ticker`** (`app/api/ticker/route.ts`) — CoinGecko simple-price for BTC/ETH/SOL/SUI/ALEO/DOGE (revalidate 30s) + alternative.me Fear & Greed (300s). Response `{ coins: [{symbol, price, change24h, mcap}], fng: {value, label} }`. Fully portable; no keys.

**`GET /api/crypto-news`** (`app/api/crypto-news/route.ts`) — Cointelegraph + Decrypt RSS, hand-rolled regex parse, keyword-regex sentiment (`POS`/`NEG` lists, `:16-23`), dedupe by title, newest-first, top 8, revalidate 300s. Response `{ articles: [{title, source, url, publishedAt, sentiment}] }`. Fully portable; no keys.

**`GET /api/polymarket`** (`app/api/polymarket/route.ts`) — social proof / discovery rail: Gamma API for metadata (60s revalidate), enriched with live YES/NO prices from the CLOB API per market (30s), filters (active, not ended, volume floor, optional `?query=` text match, ends within 1 year), sorts by 24h volume, returns `?limit=` (default 12) with `hasLivePrice` flags. Fully portable; no keys.

**`GET /api/traction`** (`app/api/traction/route.ts`) — the honest-marketing numbers ( wallets onboarded, sponsored actions, bets, volume, bettors) from `fetchTraction()`, a ~20s full-history walk of sponsored txs. `force-dynamic` (the walk breaks builds), `maxDuration 120`, CDN cache `s-maxage=900, stale-while-revalidate=86400`. On failure returns nulls with 200 — "Never 500 a consumer that only wants a number to render" (`:35-37`).

**`/api/alerts`** (`app/api/alerts/route.ts`) — GET/POST/DELETE pass-through to the box alert-keeper (`ALERT_SERVER_URL`, header `x-yosuku-relay-token: ALERT_SERVER_SECRET`) so mobile only ever talks to yosuku.xyz. Inert 503 until configured. Pattern portable as-is.

**`POST /api/room/ensure`** (`app/api/room/ensure/route.ts`) — `{marketId} → {ruleId, groupId}`: idempotently creates a per-market encrypted chat room server-side with the app's own funded key (`ROOM_ADMIN_SECRET`; users only join, Onara-sponsored). Flow: find existing `MarketRoomRule` by type via GraphQL (self-healing a missing permission grant) → else create messaging group (Seal-encrypted, deterministic id from marketId) → create+share the gated rule → grant it `ExtensionPermissionsAdmin`. Includes a retry wrapper for single-gas-coin version races (`:86-105`) and a documented near-catastrophe: an earlier default key of `new Uint8Array(32).fill(42)` — "not a private key so much as a shared one" — now a hard refusal (`:8-13`). Sui-stack-specific (Seal, Sui Stack Messaging): drop the implementation, keep the idempotent-ensure + no-default-keys patterns.

**`/api/suins/claim`** (`app/api/suins/claim/route.ts`) — GET readiness `{ready, parent:'yosuku.sui'}`; POST `{address, label}` mints `<label>.yosuku.sui` as a leaf subname on **mainnet**, signer = the wallet owning the parent NFT (`SUINS_SIGNER_KEY`, `SUINS_PARENT_NFT`), label grammar enforced, pre-checked availability for a clean 409. Drop (or reimagine as ENS subnames if Somnia has an equivalent).

**`GET /api/yosuku/quote`** (`app/api/yosuku/quote/route.ts`) — exact on-chain quote via `devInspect` (Sui's simulation call): binary `?oracle&expiry&strike&isUp&quantity` or range `?kind=range&lower&higher`; returns `{ mintCost, redeemPayout }` in DUSDC. Read-only, no signing. Adapter: on Somnia this is a `view` function / `eth_call` on the event-contract pricer — much simpler.

**`POST /api/bet/build`** (`app/api/bet/build/route.ts`) — the agent/MCP on-ramp: given `{user, side, cadence?, payoutDusdc, leverage?, marketId?}`, builds the full bet transaction **server-side with the same code path the web app uses** ("a second copy of the mint chain… would have failed live", `:1-7`) and returns it *unsigned* with `signAs`, plus sponsorship: if the Onara gas station answers, `gasOwner` is set to the sponsor and the response includes `submitTo` (the sponsor's co-sign endpoint); otherwise `gas: 'self-paid'` with an honest note. Its best product idea: **first bet with no account creates+funds+bets in one transaction** (`:51-57`) — no exact pre-quote is possible, so cost is bounded by `maxCost` and the whole tx reverts if it can't fit; "A bounded revert beats a setup errand." Also `step()` error wrapping so failures name the failing stage (`:114-117`). Adapter: same route shape returning an unsigned EVM tx (`{to, data, value}`) + optional ERC-4337/paymaster sponsorship data.

Supporting lib — **`lib/sponsor.ts`** (Onara gas station client): `getSponsorStatus()` (4s timeout, null on any failure → callers fall back to user-paid gas) and `submitSponsored({sender, txBytes, txSignature})` with `waitForExecution=false` (return at execution, don't wait for indexing — 504s otherwise). Two refined error behaviors: an "unconfirmed" failure that still carries a digest is treated as success (a retry could double-execute, `:79-82`); policy-refusal messages are filtered to the *near-miss* policy (the one that recognized the call but refused for a real reason) instead of the alphabetical-first irrelevant ones, with the full verdict list logged (`:37-55, 84-89`). The graceful-degradation contract (sponsored when up, self-paid when not, response says which) is the part to port.

---

## 4. Env var inventory

Complete list from `grep process.env` across `app/api/**` + the five libs:

| Env var | Used by | Purpose | Secret? |
|---|---|---|---|
| `CLAIM_EXECUTOR_URL` | claim/*, claim/x/*, studio, creator-card | Box relay base URL (e.g. `http://100.x.x.x:8789`) | yes (topology) |
| `CLAIM_SHARED_SECRET` | same + claimOAuth fallback | `x-claim-secret` header to relay; HMAC-derivation fallback | **yes** |
| `CLAIM_SESSION_SECRET` | claimOAuth | HMAC key for the `x_sess` X-session cookie | **yes** |
| `CLAIM_X_REDIRECT` | claim/x/start, callback | Registered OAuth callback URL (default `https://yosuku.xyz/api/claim/x/callback`) | no |
| `CLAIM_HOME` | claim/x/callback | Post-OAuth landing (default `https://yosuku.xyz/claim`) | no |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | claim/x/start, callback | X OAuth2 app (secret optional; public-PKCE fallback) | **yes** (secret) |
| `PRIVATE_BET_EXECUTOR_URL` / `PRIVATE_BET_SHARED_SECRET` | private-bet/* | TEE executor + Bearer auth | **yes** |
| `PRIVATE_BET_DUSDC_POOL`, `NEXT_PUBLIC_VORTEX_DUSDC_POOL` | private-bet/status | Pool id fallback for status readout | no |
| `AGENT_SPEC_REGISTRY_URL` / `AGENT_SPEC_SHARED_SECRET` | agent-spec | Keeper-side strategy-spec registry | **yes** |
| `KEEPER_HEALTH_URL` | desk/health | Copy-desk keeper `/health` (default `http://44.197.193.42:8792/health`) | no |
| `CCTP_KEEPER_URL` / `CCTP_SHARED_SECRET` | deposit/cctp | CCTP keeper + `x-cctp-auth` | **yes** |
| `ALERT_SERVER_URL` / `ALERT_SERVER_SECRET` | alerts | Alert keeper + `x-yosuku-relay-token` | **yes** |
| `STUDIO_PASSPHRASE` | studio | Founder gate for house posting | **yes** |
| `FAUCET_PRIVATE_KEY` | faucet, fund-preview | Dedicated faucet signer (never deployer) | **yes** |
| `FAUCET_ONBOARD_KEY` | faucet | Relay's key for the 5-DUSDC drip (built-in literal also accepted) | yes |
| `FUND_PREVIEW_OPEN` | fund-preview | Kill-switch; must equal `i-fixed-the-replay-hole` | no |
| `PAYSTACK_SECRET_KEY` | fund-preview | Paystack test-mode verification (`sk_test_…`) | **yes** |
| `ROOM_ADMIN_SECRET` | room/ensure | Room-creator keypair; hard refusal if unset | **yes** |
| `SUINS_SIGNER_KEY` / `SUINS_PARENT_NFT` | suins/claim | Mainnet subname signer + parent NFT id | **yes** (key) |
| `DEEPSEEK_API_KEY` | sensei | LLM key, server-only | **yes** |
| `MEMWAL_PRIVATE_KEY` / `MEMWAL_ACCOUNT_ID` / `MEMWAL_SERVER_URL` / `MEMWAL_NAMESPACE` | memwal (sensei) | Walrus memory delegate; server-only | **yes** (key) |
| `SUI_RPC_URL` | faucet, fund-preview, quote | Testnet JSON-RPC (default `https://sui-testnet-rpc.publicnode.com`) | no |
| `SUI_MAINNET_RPC` | suins/claim | Mainnet fullnode | no |
| `NEXT_PUBLIC_SUI_GRAPHQL_URL` | claim/x/link, unlink | GraphQL for zkLogin sig verification | no |
| `NEXT_PUBLIC_ONARA_URL` | sponsor.ts, bet/build | Gas-station base URL | no |
| `NEXT_PUBLIC_RELAYER_URL` | room/ensure | Messaging relayer (default `https://relayer.yosuku.xyz`) | no |
| `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` | backendUrl.ts (resolver/*) | Legacy resolver base | no |

Hard-coded service endpoints (no env): DeepSeek API, X API (`api.x.com`), Sui testnet GraphQL (`graphql.testnet.sui.io`) and gRPC fullnode, predict-server upstream, CoinGecko, alternative.me, Cointelegraph/Decrypt RSS, Polymarket Gamma + CLOB, Paystack, Suiscan explorer links.

---

## 5. PORTFOLIO_UX_SPEC.md — one-page summary

A 447-line final build spec for `/portfolio` (`PORTFOLIO_UX_SPEC.md`). The page in one sentence (`:5`): *"One account surface: the single number you can bet with on this site right now, then every other place your money is sitting as a labelled row under it, then your bets, with one sheet for moving money and everything rare collapsed at the bottom."*

**Core principles**

- **One honest hero number.** `READY TO BET = acctBalance + walletDusdc`, because one sponsored signature can spend either (verified against the actual PTB builders, `:13`). Money that can't be bet here (X balance, sealed claims) is excluded *by name* in the sub-sentence and listed below — never a grand total across pools (`:434`: "It cannot place a bet").
- **One data hook, one truth.** `useMoney(address)` returns everything (balances, pools[], tasks[], counts); hero, rows, tasks and Move sheet all render from that one object "so they cannot disagree" (`:65-89`).
- **No money figure from lossy sources.** The event-derived positions scan has a 500-row cap, so the plate shows *counts* from it, never amounts (`:16, 431`).
- **Tasks vs pools.** Zero-to-three task rows (finish-able states, in fixed precedence: wrong wallet for the X handle → wallet session expired → money waiting from a tweet → wallet money not yet spendable → X connected but not linked) render above the pool list; a task never replaces a pool row — "the money must never live only in a slot that another state can outrank" (`:93-101, 175-176`).
- **Pools as children of the hero.** Under eyebrow "Also yours. Not counted above.": X replies (always, with a 6-state precedence table `:153-162`), Waiting for you (sealed account), Creator earnings (BuilderCode owners only), Copy trading, Private bets, Older account — each with one sentence of per-row **custody honesty** (`:172`: the blanket "only you can move money out" is false for the X pool because the relay bets from it, so custody is stated per row: "the agent bets, only you cash out").
- **One Move sheet** for all transfers: enumerated legal From→To pairs mapped to specific tx builders (`:124-133`); illegal pairs never render; locked money shows its reason; the cross-chain deposit widget exists exactly once in the app, inside this sheet.
- **Copy rules**: no emoji, no em/en dashes, the user is the actor, restrictions always paired with their payoff, never "for technical reasons" or "currently" (`:170-171, 235`). Every line of user-facing copy is spelled out in section 6.
- **Empty states are structural** (`:210-229`): skeleton mirrors real geometry (no reflow); signed-out is an acquisition block, not a zeroed portfolio; connected-but-empty renders the full structure at zero. A brand-new user is **never** told to fund before betting — first bet creates, funds and places in one sponsored signature; "Add money is an option, never a precondition" (`:229`).
- **Deletion discipline** (section 7): dead handlers, theme islands, an invisible-white-card root cause, and a misleading CTA are all deleted with file:line receipts; two "dead-looking" handlers are kept because they are the only exits for real money (`:400`).
- **Section 8, "Deliberately not changed, and why"** is a model worth copying in any spec: each non-change is justified (e.g. no Transfers tab because no durable move log exists and an empty one "reads as theft", `:433`; the just-in-time rescue in the ticket drawer — "You have {amount} in your X balance. Move it here and this bet goes through." — is named as the highest-leverage follow-up, `:439-448`).

**Screens specified**: balance plate (hero + 4-cell rail + primary button `Add money` / `Get test DUSDC`), task rows, pool rows, YOUR BETS (Open/History segmented, max 4 fields per row), Account & Recovery (collapsed `<details>` rows: X account — forced open on `?x=` OAuth return so the return is never invisible — recovery, creator recovery, desk, CSV export, on-chain link, testnet disclaimer), and the Move sheet.

For DreamDEX: the pool/task/one-number model transfers wholesale to any multi-balance product (wallet + event-contract margin + social balance), and the copy rules plus the "custody honesty per row" idea are chain-agnostic.

---

## 6. What to reproduce, in priority order

1. **Trade-from-X with a no-divert vault** (§3a) — the differentiator. Needs: an EVM vault where a relayer can only open positions owned by the bound user; the OAuth + signed-session + link routes port almost verbatim (only the signature verification changes to `personal_sign` + `ecrecover`, which is *simpler* than the zkLogin dance).
2. **Sensei with the Brake** (§3c) — portable in an afternoon; swap DeepSeek for any provider, MemWal for any store. The system prompt is written and battle-tested; keep it.
3. **The caching proxy + oracles/spot/leaderboard patterns** (§3f, §3i) — the cache-honesty rules (never cache time-derived status; restamp per request; no fire-and-forget refresh in serverless; retry pages; synthesize unredeemed losses) are the difference between a demo that lies and one that holds up.
4. **Faucet with triple gating + bet/build for agents** (§3h, §3i) — onboarding and the MCP/agent surface; both adapt mechanically to EVM.
5. **Ticker / crypto-news / polymarket** — zero-dependency portable color for the feed.
6. Skip: CCTP, SuiNS, room/ensure, resolver, fund-preview (but read fund-preview's post-mortem comment before building any payment-triggered drip).
