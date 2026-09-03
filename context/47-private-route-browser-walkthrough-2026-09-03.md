# The private route driven from a browser on Shannon (2026-09-03)

Stage 5 item 5 had run only through the adapter (context/46 §Not covered: "the claims list, the control and the
panel in a browser"). This is the whole route through the real UI on the dev server — `pnpm dev`, the desk key in
`web/.env.local` — against the live `PrivateDesk` at `0x4D27…28bB`, with the demo user `0xd357…9358` as the owner.
Two defects came out of it, both fixed the same session; the numbers below are from the run.

## How the browser was driven

The Claude Chrome extension was not connected, and a browser wallet would have meant typing the demo key into an
extension. So the run used Playwright (`playwright-core` 1.62.1, found in the npx cache) launching the installed
Google Chrome headed, with a **scripted wallet**: the key stays in Node (viem `privateKeyToAccount`), the page sees an
EIP-1193 provider on `window.ethereum` plus an EIP-6963 announcement, and every `request` crosses to Node through
`context.exposeFunction`. Four kinds of request get real handling — accounts / chain queries, `personal_sign` (the
desk authorisation), `eth_sendTransaction` (signed and broadcast by a viem wallet client), and the chain-switch calls
as no-ops; everything else passes through to the RPC. wagmi's injected connector reconnects on its own, so the
header showed `0xd3…9358` on the first load with no connect step. The profile is persistent
(`launchPersistentContext`) because the claims list and a pending authorisation live in this browser's
`localStorage`. The driver, kept outside the repo (playwright-core is not a dependency):

```js
import { chromium } from "<npx cache>/playwright-core/index.mjs";
import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const pub = createPublicClient({ chain: shannon, transport: http(RPC) });
const wallet = createWalletClient({ account, chain: shannon, transport: http(RPC) });
async function handle({ method, params = [] }) {
  switch (method) {
    case "eth_requestAccounts": case "eth_accounts": return [account.address];
    case "eth_chainId": return "0x" + (50312).toString(16);
    case "wallet_switchEthereumChain": case "wallet_addEthereumChain": return null;
    case "personal_sign": return account.signMessage({ message: { raw: params[0] } });
    case "eth_sendTransaction": { const [tx] = params; return wallet.sendTransaction({ to: tx.to, data: tx.data, value: tx.value && BigInt(tx.value), gas: tx.gas && BigInt(tx.gas) }); }
    default: return pub.request({ method, params });
  }
}
const context = await chromium.launchPersistentContext(profileDir, { channel: "chrome", headless: false });
await context.exposeFunction("__mwallet", async (json) => JSON.stringify(await handle(JSON.parse(json))));
await context.addInitScript(() => {
  const provider = { isMetaMask: true, request: async (a) => JSON.parse(await window.__mwallet(JSON.stringify(a))), on() { return provider; }, removeListener() { return provider; } };
  window.ethereum = provider;
  const info = { uuid: "…", name: "Masayume Dev Wallet", icon: "data:image/svg+xml,…", rdns: "dev.masayume.wallet" };
  const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: Object.freeze({ info, provider }) }));
  window.addEventListener("eip6963:requestProvider", announce); announce();
});
```

Each stage was a short script over that driver: `ariaSnapshot()` of the ticket region to read the state, `getByRole`
clicks, a screenshot at each step, `page.on("response")` on `/api/private/*` for the desk's exact answers, the wallet's
requests logged in Node. **Run under `caffeinate -i`**: this machine slept twice while nothing touched it (stalls of 7
and 30 minutes in both browsers), and one earlier attempt lost the ticket region during a sleep — the observer that
watched the same ticket awake saw it live through the no-entry buffer, so that loss is recorded as unverified.

## Finding 1 — every wallet-scoped read raced the boot (fixed, `ce17add`)

On a fresh load `/portfolio` opened on two "Something went sideways" alerts (Your bets, Your record; technical
`collateral not loaded — await loadCollateral() during boot`) and `/markets` showed neither the wallet balance nor
the faucet card for an empty wallet. The port reads call `getCollateral()` synchronously, trusting that the boot ran
first; wagmi knows the wallet within a tick of hydration, so the balance sheet and the history fired before the boot's
three RPC reads landed, failed, and stayed failed until their 15 s poll. "Try again" cleared the alerts at once and the
faucet card appeared after 33 s, which is what named the race. A real MetaMask usually loses that race by a few
hundred milliseconds, which is why the fork and script runs never showed it. `useReadingQuery` now observes the boot's
cache entry (`skipToken`, never fetching it) and enables every other reading once the boot is ok: a fresh load shows
no alert, and the faucet card is on the ticket within 3 s.

## Finding 2 — the open's guard sat under a quote up to 12 s old (fixed, `724209a`)

The first two bets were refused before a cent moved — `sizeForStake 4424000 < guard 4973250` at 07:33 and again at
08:17 — the ticket's polled quote (`REQUOTE_MS` 12 s) had sized 5.235 contracts for the 2 tUSDC stake and the desk's
pre-flight found 4.424 five seconds later. The desk's sizing for the same stake, read ten times over twenty seconds on
the 15m BTC Window (`0x…120a9`, ~08:20 UTC):

| UTC | contracts for 2 tUSDC | price |
|---|---|---|
| 08:19:40 | 3.773 | 53.0¢ |
| 08:19:44 – 08:19:58 | 3.868 | 51.7¢ |
| 08:20:02 | 3.853 | 51.9¢ |
| 08:20:05 | 3.327 | 60.1¢ |
| 08:20:08 | 3.220 | 62.1¢ |
| 08:20:12 | 3.824 | 52.3¢ |

A sixth in three seconds. The authorisation signature covers the stake and never the size, so `usePrivateOpen` now
reads `sizePrivateForStake` **after** the wallet signature and derives the 5% floor from that reading, right before the
desk is asked; the floor itself is unchanged. The leverage open (`BOOST_FILL_FLOOR_BPS`) takes its guard off the
polled quote the same way and was not changed here.

## The run that landed (08:15–08:30 UTC Window, BTC 15m, `0x…120a9`)

Funding, from the ticket's own CTA "Add 8.00 tUSDC and buy UP privately" (four stakes, the reference's top-up):
`approve` 259,745 gas, `depositAndAllow(8)` 516,047, then the `personal_sign` over the ported message (side, stake,
Window, market, desk and chain, wallet, issued-at). The faucet before it came from the ticket's card: "Mint 10,000
tUSDC", one transaction.

Three taps on the fresh guard, six minutes before the close with BTC $70 under the line and the odds running
13¢ → 18¢ → 24¢:

| Tap | Guard | Desk's answer | Desk transactions |
|---|---|---|---|
| 1 | 14.504 (95% of 15.267) | pre-flight passed; the mint reverted `BelowMinQuantity(12121000, 14503650)`; **refunded 2.00** | charge 278,953 · fund 454,266 · sweep 249,898 · credit 272,254 |
| 2 | 10.326 | refused before the charge: `sizeForStake 10309000 < guard 10325550` | none |
| 3 | 7.755 | **opened**: 8.163 contracts for 1.999935 | charge 278,953 · fund 454,266 · mint 1,917,922 |

The refusal toast was the exact copy with its technical line under it. After tap 3 the ticket body became The Call
(N° B15A9C, "YOU STAKE 1.99 → WIN IF IT LANDS 8.16 tUSDC · after the settlement fee", "verify on Shannon explorer"), the
toast said "Private bet placed: UP on BTC 15m", the claim was in `masayume.private.claims`, and the chain read
`budgetOf` = balance 6.00, allowance 4.00 — tap 1's refund restored the balance but not the allowance, by design
(the panel's "Desk may spend" line and the ticket's re-allow line are where that shows). The ticket kept the bet
through "Closing — no new entries" at 08:25.

## For the user's eye

- The Sensei bubble ("Coin-flip?", "Want a read?") floats over the ticket's CTA and over the toast's close button at
  1280×900.
- The plate's "Get test tUSDC" is a link to `/markets`, where the faucet card lives; with a wallet that holds any
  tUSDC the card is gone, as designed.

## Settlement, cash-out and the way home (08:30–08:31 UTC)

BTC closed at $77,956 against the $77,905 line, so the call won. Watched from the ticket, awake: "Trading" →
"Closing — no new entries" (08:25) → "Settled · Settling…" (08:30:11, The Call's countdown replaced by the word) →
the ticket auto-advanced to the 08:30 Window at 08:30:26 while The Call stayed on the settled one, as `PlacedCall`
snapshots it. Under the hero the stamp line said "You held nothing in this window — nothing to stamp": the wallet
held no position, which is the point of the route, but it reads oddly beside CALL PLACED — for the user's eye.

`/portfolio`, the Private row opened: Balance 6.00 · Desk may spend 4.00 · Spendable 4.00 · Desk key `0x8af0…62af` ·
Per bet, at most 25 tUSDC; the trust and correlation sentences; "Private positions — Only you hold the proof these
are yours"; the row `UP · BTC 15m · 2.00 tUSDC · 7m ago · Verified · Cash out`. **Back up** downloaded
`masayume-private-claims-2026-09-03.json` (`kind`, `version` 1, `exportedAt`, one claim with its desk signature).

**Cash out** tapped at 08:30:56, 56 s after the close: the desk settled, swept and credited, and at 08:31:08 the toast
read "Cashed out: 8.16 tUSDC credited to your private balance."; the row became `+6.16 · Credited`, the balance
14.16 (the desk may still spend 4.00 — cash-outs credit the balance, never the allowance). **Withdraw** at 08:31:13
(`0xea70…68a9`, the owner's own transaction): "Private balance withdrawn to your wallet.", balance 0.00, spendable 0.00,
the allowance line still 4.00. On chain afterwards: `budgetOf` = 0 / 4.000000; the wallet holds 10,006.163065 tUSDC
(10,000 minted − 8 deposited + 14.163065 withdrawn); the desk key went from 1.4159 to 1.3850 STT across the two opens,
the refund, and the settlement. Nothing else was touched: the first contract's two stranded slots on Window 73121
(context/46) are still the operator's to settle.

## What this closes and what it does not

Closed: context/46's "not covered" browser items — the control, the note, the CTA and its three answers (refused before
the charge, refunded after a failed mint, opened), The Call, the claims list with verify-on-sight, back-up, cash-out
and the row's states, the panel's deposit-and-allow and withdraw, the toasts. Not exercised: Restore (the file
picker), Revoke, the pending-authorisation resume from a lost reply (the route answered every time), a losing
settlement (the earlier live script covered one), 390-wide, dark mode.
