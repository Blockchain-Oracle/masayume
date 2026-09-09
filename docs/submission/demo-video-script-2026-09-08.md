# Masayume: Demo Video Script (8 September 2026)

The narrated cut for the hackathon submission and YouTube. Replaces the earlier presenter draft of the
same date — same evidence, rebuilt story. The 166-second stock-voice review cut at `/demo`
([demo-script-2026-09-06.md](demo-script-2026-09-06.md)) is untouched.

- **Runtime:** 03:12 primary cut. A named 02:52 trim is at the end if you want to sit strictly inside the brief's 2–3 minutes.
- **Spoken words:** 446 at ~175 wpm — 153s of speech, 39s of deliberate holds and silence.
- **Proof environment:** Somnia Shannon testnet, chain 50312. tUSDC collateral, STT gas. Every number is testnet.
- **Tagline:** *Make your call. See it through.*

---

## The spine

**Cold open, then rewind.** The video opens mid-action with no greeting, no logo and no face: a tweet
becomes a real on-chain order in fourteen seconds. Only then does it back up and introduce anybody.
This is the highest-retention opening pattern there is, and it is the one thing the previous draft
did not do — it buried the tweet at 02:12, roughly ninety seconds after a cold viewer leaves.

**We are not claiming to be first, and that is the pitch.** Prediction markets are old. DreamDEX
already built the hard part — a real on-chain order book on Somnia for one question. The wedge is not
the market. It is that nobody built the thing a normal person would touch. Said out loud, this is
honest, it credits the sponsors, and it is a stronger claim than inventing a category.

**One hero, everything else is motion.** The agent that refuses to trade, publishes itself, gets
copied under a bounded permission, then loses money and settles honestly — that gets fifty seconds.
The seven games, the leverage, the parlay, the vault get twenty seconds and are carried by on-screen
chips, not by a spoken list. Naming features out loud is what made the last cut drag.

| | |
| --- | --- |
| **Viewer** | Anyone watching. Judges are in the room, they are not the address. |
| **Pain** | The rails work. The surface is unusable by anyone who is not already a trader. |
| **Promise** | Make the call in one tap, one tweet, or not at all — hand it to an agent. |
| **Hero proof** | An AI that read a live price, said no eleven times out of twelve, traded once, lost, and settled itself on chain. |

---

## Voice rules

The last draft failed on voice, not on facts. These are binding for any rewrite.

**Do**

- Talk to one person. "You shouldn't have to be here at all." Never "users can."
- Say *I* and *you*. Narrate what your hands are doing while they do it.
- Sentence fragments. "Confirm. Done." "And it lost."
- Plain money words: *bet*, *money*, *dollar*, *order*. Not *position*, *collateral*, *notional*.
- Let a number be the drama on its own. "Twelve decisions. Eleven holds. One trade."
- Leave the seam in. "I left it in the video" is worth more than any adjective.

**Never**

- **Balanced antithesis.** "It was never a hard question, it was a hard app." Two matched clauses
  pivoting on a contrast is the loudest AI tell in spoken copy. There are zero in this script.
- Lists of four in one breath. The old opening line had four.
- Presentational verbs: *I bring you*, *allow me to*, *let's dive into*.
- Aphorisms as beat-enders. "That refusal matters more than the trade." Say what happened instead.
- Narrating a feature inventory. If it can be a chip on screen, it is a chip on screen.
- Present tense over recorded footage. Ever.

---

## Cold open (00:00–00:14)

No greeting. No logo. No face cam. No music. Screen only, from the first frame.

| Beat | On screen | Spoken |
| --- | --- | --- |
| 1 | X compose box, cursor already in it | "Watch this." |
| 2 | Type `@masayume_app btc up 1 4h`. Do not rush the typing — it must be readable. | "Bitcoin. Up. One dollar. Next four hours." |
| 3 | Hit Post | "That's a tweet." |
| 4 | The reply card lands: Masayume mark, sender, spend, full hash | "And it tweets back a receipt." |
| 5 | Click the hash → Shannon explorer, **Success**. Hold 2s. | "That's the order. On chain. I never opened an app." |

That is 28 spoken words over fourteen seconds. The silence between beats 3 and 4 is doing work — do
not fill it.

**Capture decision — the one thing you have to choose.** Two ways to shoot this, both honest:

- **Live (preferred).** Bring the X relay up, rehearse one command off camera, then post on camera.
  Highest impact. Requires the relay running and a real testnet spend from the executor wallet.
- **Recorded thread (safe).** Shoot the existing verified thread: scroll to
  [the command](https://x.com/masayume_app/status/2096704007112696288), then
  [the receipt](https://x.com/masayume_app/status/2096704198461084030), then click through to
  [the fill](https://shannon-explorer.somnia.network/tx/0x072a0259bd75c22697d960da29c513ff9a0d3b0f24ba5eefbe626810093fa26b).
  Same words work unchanged except beat 3, which becomes "That was a tweet." Carry a
  **Recorded · 6 September 2026** label.

The recorded version still lands. Do not delay the shoot over this.

---

## Full timeline

| Time | What you say | What's on screen | Proof / note |
| --- | --- | --- | --- |
| **00:00–00:14** | *(cold open above)* | X → reply card → explorer | Live post, or the verified thread with a Recorded label |
| **00:14–00:24** | "Okay, let me back up. Somnia team, DreamDEX team — hey. I'm Blockchain Oracle. This is Masayume, and it's all on your testnet. Test money, real chain." | Hard cut to `masayume.app` hero. Face cam fades in lower right, first appearance. | Corner label **Somnia Shannon testnet** goes up here and stays up. |
| **00:24–00:46** | "I didn't invent prediction markets. They've been around for years. You already built the hard part — a real order book on Somnia for one question. Up, or down. The rails work. And that's where a normal person leaves. So I didn't build a market. I built what goes on top of yours." | Cut to a raw DreamDEX / CLOB order-book view. Let it sit two full seconds. One fast scroll on "a normal person leaves". Cut back to the Masayume Window on "on top of yours". | Frame the book as **raw rails**, which is what it is. No sneer, no comparison graphic. This beat is why the pitch is credible. |
| **00:46–00:57** | "One question at a time. We call it a Window. Bitcoin. This price, right now. This clock. Up or down when it hits zero. That's the whole thing." | `/markets` → a live BTC Window. Cursor lands on each field exactly as it's named: asset → opening print → countdown → the Up/Down pair. | Slowest cursor in the video. This is the ten seconds that decide whether a non-trader stays. |
| **00:57–01:22** | "Bitcoin, next hour, I say up. Tap Up. One dollar. Before I confirm, it shows me the real price off the real book. Not a rounded number to make me feel good. Confirm. Now notice what didn't happen. No wallet popup. I handed this browser a key with limits I set. It can buy. It can't withdraw. Only my wallet does that." | Tap **Up**, type `1`. Hold 2s on the readout strip — contracts, actual price, total. Confirm. Cut to the session chip → session sheet. Hold on **"Never: withdraw, change where money goes, or spend past the caps."** | **Live signed testnet trade, your wallet, your funds.** Fallback: clean pre-recorded take of the identical flow. Per-tap / per-day / expiry ride as on-screen chips — do not say them. |
| **01:22–02:17** | "Now the part I actually care about. You shouldn't have to be here at all. This is the agent builder. Name it, pick how it thinks, test it before anyone trusts it. This one's an AI. Watch. It read Bitcoin's real opening price. Eleven basis points. Basically nothing. And it said no. That's the point. I don't want a bot that bets. I want one that waits. Here it is, published on Somnia. Fee, zero. And here's someone copying it. That's a permission, not a deposit. Then I let it run overnight. Twelve decisions. Eleven holds. One trade. And it lost. Bought up, market went down, settled itself for zero. On chain. And I left it in the video. Don't take my word for it. The hashes are right there." | `/agents` builder, scrub four steps fast (≤4s total). Cut to the saved Sensei read — hold on opening **79,830.70**, **+11 bps**, **Hold**. Cut to explorer on `0x7a18eff5…`, hold 2s on Success + **zero fee**. Cut to the copy drawer (budget / cap / expiry visible, unspoken). Cut to the decision journal — the 11-hold, 1-trade list. Then explorer: fill `0xe175d59f…` → settlement `0x19738859…`, ~2s each. Then the rules agent's win `0x88a8aefd…` held 2s **silent**, captioned **Won · 1.661 tUSDC paid at expiry**. | **Hero beat.** Everything from the Sensei read onward carries **Recorded · 7 September 2026** — the grant is revoked and the loop is paused, so nothing here is narrated live. Never crop a hash. Full-face punch-in on "I left it in the video." The copy drawer's budget / per-trade cap / expiry and *I never hold their money* ride as on-screen chips — unspoken. |
| **02:17–02:28** | "And that tweet from the start? I sent it garbage on purpose. It refused and spent nothing. If you've run a bot on X, you know why that matters." | Cut to [the refusal post](https://x.com/masayume_app/status/2096796003147940231). Hold on the refusal card — no hash on it, which is the point. | Callback to the cold open. This is the beat that reads as *built by someone who has shipped*, not as a feature claim. |
| **02:28–02:46** | "It should also be fun. Seven games, one economy. Season one has a hundred test dollars locked in a contract. Not promised. Locked. Same markets under all of it." | **Montage, ~2s a beat, no lingering.** `/games` hub → Duel stage → Lucky spin → Moonshot **Paid** capture → Candle Hop run → season banner, hold 2s on **100 tUSDC**. Then chips over the market ticket: `Boost 2× / 3×` · `Parlay` · `Private` · `Earn`. Duel gets the longest montage beat (3s) with the chip **Duel · real orders + real side pot**. | Names ride as on-screen chips: Lucky · Range · Moonshot · Line Rider · Candle Hop · Practice. **Do not read them out.** Moonshot uses the recorded Paid capture, labelled. Claim nothing specific about Lucky, Range or Line Rider. |
| **02:46–02:59** | "Under all of it is DreamDEX. Their SDK finds the markets, prices them, fills the orders. I didn't rebuild any of that — what I built sits on top." | `docs.masayume.app/builders/dreamdex-sdk` — hold the SDK diagram. Contracts table. Then `docs.masayume.app/llms.txt` raw, hold 2s. | Counts ride as on-screen text: **10 contracts · 1,067 tests · 14 invariants**. Do not say them. The llms.txt shot runs silent for 2s under the caption **Docs, in plain text, for your AI** — a wink at AI-assisted judging that costs no words. |
| **02:59–03:12** | "Masayume's live on Somnia testnet right now. App, docs, and every hash are in the description. Or skip all of it. You've got my handle. Make your call. See it through." | Back to the app hero, face cam grows. Full-face punch-in on "Make your call." End card: `masayume.app` · `docs.masayume.app` · `@masayume_app`. Hold to black. | "You've got my handle" bookends the cold open. Leave a full beat of silence before the tagline. |

**Extended YouTube cut (03:30).** Add these back, in this order of value: the rules-agent win spoken at 02:14 — *"The other agent won one, and paid itself the second the window closed"*; the Duel line at 02:30 — *"Duel is you against one person. Real orders, real side pot"*; the docs line at 02:56 — *"And the docs point every feature at the exact SDK call. Reading them with an AI? There's a plain-text version."* Then one roadmap line before the close: *"Next: more
conditions for the agents, paid memory so a strategy can sell what it learned, and mainnet the day
Event Contracts get there."* Over the app hero. Roadmap framing only — never present tense. Cut this
line for the submission link.

---

## What changed from the previous draft

| Previous cut | This cut | Why |
| --- | --- | --- |
| Greeting + product name + four-item tagline at 00:00 | Tweet → receipt → on-chain order at 00:00, greeting at 00:14 | Cold open. The most surprising thing the product does was at 02:12; nobody was still watching. |
| "It was never a hard question. It was a hard app." | "The rails work. And that's where a normal person leaves." | Antithesis out. What actually happens, in.  |
| Implicitly novel | "I didn't invent prediction markets. They've been around for years." | True, credits DreamDEX, and scores on ecosystem impact. |
| X trade at 02:12 as a feature | X trade at 00:00 as the hook; the **refusal** at 02:09 as the callback | Same footage, four times the impact, plus a structural payoff. |
| Seven games and four surfaces read aloud (72 words) | Chips on screen, 44 spoken words | Narrating an inventory is what made it drag. |
| 03:52 | **03:12** | The brief asks 2–3 minutes. This is 12s over the ceiling with a 02:52 trim named below; the previous cut was 52s over with no path back. |

---

## Capture runbook

### Preflight

- **Record** at 2560×1440+, export 1920×1080. Browser at 100% on the app, **110% on the explorer** so hashes survive the downscale.
- **Face cam** lower right, ~22% frame width. **Absent for the entire cold open.** Shrink or move it for the ticket readout and every explorer hold.
- **Captions** burned in, lower centre, one line. Persistent corner label **Somnia Shannon testnet**. Add **Recorded · <date>** on every agent scene, the Moonshot capture, and the X thread if shot recorded.
- **Fixtures:** demo-user wallet connected on 50312, funded with tUSDC and STT before rolling. Tap-trading already armed so the session sheet has real caps.
- **Hide:** private keys, `~/.config/masayume/*.env`, X DMs and sidebar, bookmarks, the email in the profile chip, Vercel/Fly dashboards, terminal scrollback.
- **Environment:** production `masayume.app` only, never localhost. Confirm `/api/status` reads `healthy` with ≥1 live Window immediately before rolling.
- **Notifications:** macOS Focus on. Slack, Mail, Chrome notifications off.

### Tab order

1. `x.com/masayume_app` — compose box ready (or the command / receipt / refusal posts open)
2. Shannon explorer on the X fill `0x072a0259…`
3. A raw DreamDEX order-book / CLOB view
4. `masayume.app` hero → `/markets` → a live BTC Window
5. `masayume.app/agents` builder, and the agent detail / decision journal
6. Shannon explorer — four tabs on `0x7a18eff5…`, `0xe175d59f…`, `0x19738859…`, `0x88a8aefd…`
7. `masayume.app/games` → season banner → `/earn` → `/parlay`
8. `docs.masayume.app/builders/dreamdex-sdk` → contracts table → `docs.masayume.app/llms.txt`
9. `masayume.app` hero (closing frame)

### Exact inputs

| Step | Action | Expected | Fallback | Boundary |
| --- | --- | --- | --- | --- |
| Status check | Load `/api/status` off camera | `healthy`, ≥1 live Window | Postpone the shoot | Read-only |
| **Cold open** | Post `@masayume_app btc up 1 4h`, then click the hash in the reply | Receipt card with sender, spend, full hash; explorer shows Success | The verified 6 Sep thread, labelled | **Real testnet spend from the executor wallet.** Rehearse once off camera first |
| First call | BTC 1h Window → **Up** → stake `1` | Readout shows contracts + actual price; fills | Pre-recorded clean take | **Signs a real testnet trade from your own wallet** |
| Tap-trading | Session chip → session sheet | Caps, expiry, "Never: withdraw…" visible | Screenshot of the armed sheet | Read-only if already armed |
| Agent read | Saved Sensei corrected-read capture | 79,830.70 opening, +11 bps, **Hold** | The capture is the evidence | **Do not re-run the model on camera** — grant revoked |
| Publication | Explorer `0x7a18eff5…` | Success, full hash, zero fee | Saved screenshot | Read-only |
| Copy drawer | Open on the published strategy | Budget, per-trade cap, expiry, fee | Existing capture | **Stop before signing a new grant** |
| Loss + win | Explorer `0xe175d59f…`, `0x19738859…`, `0x88a8aefd…` | Confirmed, amounts legible | Saved screenshots | Read-only |
| Refusal | The refusal post | One reply, no hash | Saved screenshot | **Post nothing new from the account** beyond the cold open |
| Games | `/games`, Duel stage, Lucky, Candle Hop | Motion only | Recorded Moonshot Paid capture | Practice and arcade spend nothing |
| Season pool | Season banner | 100 tUSDC escrowed, ends 30 Sep | Escrow on explorer | Read-only |

### Retake triggers

- `/api/status` degrades, or live Windows drop to zero mid-take.
- Any hash, amount, sender or status cropped, blurred, or covered by the face cam or captions.
- A recorded scene appears without its **Recorded · date** label.
- A wallet popup, seed phrase, private key, env file or personal identifier enters frame.
- The cursor lands on a destructive control not in the script.
- You narrate a recorded agent decision in the present tense.
- The face cam is visible during the cold open.

---

## Edit map

- **First frame is the compose box.** No logo animation, no fade, no music. Music enters at 00:14 on the cut to the hero.
- **Hard cuts** on every "→" in the tab order. Cut on the word, not after it.
- **Silence** for the three explorer proof holds, the "And it said no" beat, and the beat before the tagline.
- **Remove:** wallet spinners, page loads, explorer indexing, typing dead air, the Duel queue countdown. Never cut between a click and its result.
- **Hold ≥2s, uncovered:** the X receipt card; the ticket readout strip; "Never: withdraw…"; publication hash and zero fee; the losing settlement; the winning 1.661 settlement; the 100 tUSDC escrow.
- **Full-face punch-ins — two only:** "I left it in the video" (≈02:10) and "Make your call" (≈03:06).
- **Closing frame:** app hero + `masayume.app` · `docs.masayume.app` · `@masayume_app`.

### Trim to 02:52 (strictly inside the brief)

Take these in order. Each is named so you can stop when you're inside.

1. **Drop the refusal callback entirely** (02:17–02:28, −11s). It's the beat I'd miss most, but it's the only whole beat that isn't load-bearing — the cold open already proved the tweet works.
2. **Shorten the games montage** from 18s to 14s (−4s): cut the Lucky and Line Rider beats, keep Duel, Moonshot, Candle Hop and the season banner.
3. **Trim two explorer holds** from 2s to 1.5s (−1s) — the publication tx and the losing fill. Never trim the settlement.
4. **Cut "Not a rounded number to make me feel good"** (−3s). Last resort; it's the best line in the trading beat.

**Never trim:** the cold open, the Window explanation, "And it said no", the loss, or the settlement hold.

---

## Project truth

### Verified (as of 8 September 2026)

- `masayume.app` live and `healthy`. `/api/status` at 21:03 UTC: RPC block 483,281,985, **10 live windows** across 5 lanes, BTC $78,567.13, ETH $2,486.08, Sensei `openai/gpt-5.4 via direct`.
- Docs live at `docs.masayume.app` — 52 guides, 215 links, 241 source references, plus `llms.txt` / `llms-full.txt`.
- 10 Masayume contracts on Shannon; all 20 configured addresses returned code at block 480,250,668.
- **Strategy published:** [`0x7a18eff5…f4619`](https://shannon-explorer.somnia.network/tx/0x7a18eff5353ac5ee423c0c331a56ec0a8b450acbae01cb07c4a79c6c743f4619), zero fee.
- **12 real AI decisions** (`openai.responses/gpt-5.4-2026-03-05`), unique by Window: **11 held, 1 traded** at 58%.
- **AI fill and honest loss:** [`0xe175d59f…d67d17`](https://shannon-explorer.somnia.network/tx/0xe175d59f302f3e55864dcaa05ccffa662c36461d942738e21157b37cb4d67d17) — 4.608 UP for 0.935424 tUSDC; market resolved DOWN; auto-settled for zero at 02:00:22 UTC, [`0x19738859…679f8`](https://shannon-explorer.somnia.network/tx/0x197388596631f01ce571894163e47aa4e268e41f8073718e56e57b56131679f8).
- **Rules agent win:** fill [`0x8a3c1652…cb7b2`](https://shannon-explorer.somnia.network/tx/0x8a3c1652ace3f626aae68abb576b6ab71012059285fcf717ee6b78a6f22cb7b2) (1.661 DOWN for 0.908567 tUSDC), auto-settled 04:00:13 UTC paying **1.661 tUSDC**, [`0x88a8aefd…92600`](https://shannon-explorer.somnia.network/tx/0x88a8aefd9c3d6d310ac14710d893c9d72391446b864ce6bea8004de185492600).
- **Trade from X:** [command](https://x.com/masayume_app/status/2096704007112696288) → [image receipt](https://x.com/masayume_app/status/2096704198461084030) → [fill](https://shannon-explorer.somnia.network/tx/0x072a0259bd75c22697d960da29c513ff9a0d3b0f24ba5eefbe626810093fa26b), spending 0.90852 tUSDC for 1.34 contracts. Grammar is `@masayume_app <asset> <side> <stake> <cadence>`, any order, with synonyms.
- **Invalid command refused:** [`2096795838307590451`](https://x.com/masayume_app/status/2096795838307590451) produced exactly one refusal, [`2096796003147940231`](https://x.com/masayume_app/status/2096796003147940231) — `instruction-invalid`, no transaction, no recursion.
- **Moonshot round 3 full cycle:** purchase → settlement (closing print $79,922.31) → claim paying **2.000132 tUSDC** on a 1.000354 tUSDC stake.
- **Duel driven end to end on Shannon** — [context/54](../../context/54-first-full-duel-2026-09-03.md).
- **Season 1 escrowed:** `/api/games/season` returns 100.000000 tUSDC deposited at [`0x6B34…96fA`](https://shannon-explorer.somnia.network/address/0x6B340DBE7AC3283B5f5c3aA5f6AaEd57378596fA), ending 30 Sep 2026, split 40/20/10 then 6 × 5.
- **Seven games:** practice, duel, lucky, range, moonshot, line-rider, candle-hop — three honesty tiers in `packages/core/src/games/types.ts`.
- Gates: **1,067 tests across 83 files**, all workspace typechecks, **14 invariants**, **226 contract tests across 24 suites**; [CI green](https://github.com/Blockchain-Oracle/masayume/actions/runs/34081587977) on `9bb7238`.

### Implemented, not verified — qualify or omit

- **Agent loop is paused.** Grant 8 revoked, #3 consent paused, `/api/strategies/health` reports no active strategies. Every agent scene is **recorded evidence** and must be labelled.
- **Faucet.** Funded and `ready: true` (47.997 STT treasury), but **no successful live payout is on record.** Cut from this script entirely. Do not shoot it.
- **Lucky, Range, Line Rider.** Built and routed, no dated live economics. Montage motion only, no spoken claim.
- **Private mode.** Local recovery passed, public empty state verified, balance reads 0.00 tUSDC.

### Roadmap only

Paid Memory Market, Reversion, achievements, game-profile statistics, broader performance work — and
mainnet. Nothing about mainnet is deployed. Say "the day Event Contracts get there," never "we are on mainnet."
