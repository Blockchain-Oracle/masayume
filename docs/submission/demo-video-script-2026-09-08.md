# Masayume: Demo Video Direction (8 September 2026)

Pairs with **[demo-voiceover-2026-09-08.txt](demo-voiceover-2026-09-08.txt)** — that file is what you
read aloud, and nothing else. This file is what the screen does while you read it.

- **Spoken words:** 572. At your normal pace that's **3:36–3:50** of speech; **3:54–4:08** with the
  silent proof holds. Four minutes is the ceiling — if the take runs long, the named cuts are at the end.
- **Environment:** Somnia Shannon testnet, chain 50312. tUSDC for stakes, STT for fees. Every number is testnet.
- **Closing line:** *"That's Masayume. Now — what's your call?"*

## The shape

**Greeting, then the post.** The greeting stays exactly as it was — it works. Then straight into a
Bitcoin trade that started as a post on X, because that's the most interesting thing you own and the
viewer should meet it before they've been asked to understand anything.

**Sections are announced out loud.** *"Right. Agents."* *"Now, X."* *"And games."* The viewer is being
shown a product with a lot in it, and hiding the seams behind smooth transitions is how people lose
the thread. Say the topic, then explain it. Each section opens with the reason you'd want it —
*"because I don't want to make every call myself"* — not with the feature name alone.

**Screen answers the sentence you just said.** Never let a shot arrive before the words that motivate it.

---

## Voice rules

These are written from the notes on the two rejected drafts. They're binding.

**Do**

- **Break compound sentences in two.** *"This is a Bitcoin trade. And it started with a post."* — not
  *"This Bitcoin trade started with a post."* Speech goes in short beats; prose packs ideas together.
  This is the single biggest fix.
- **Say what happens.** *"I set a spending limit once, and after that it's one tap."*
- **Announce the section, then explain it.** *"Right. Agents."*
- **Lead with the want.** *"Because sometimes I just want to play."* Then the feature.
- **Discourse markers are good:** *okay, so, right, now, then, and.* They're how people actually talk.
- Contractions everywhere. First person doing things in the present tense.

**Never**

- **Negative framing.** *"Not a friendly average."* *"No wallet popup."* *"Not a rounded number to make
  me feel good."* A negation only lands if the viewer already knows the bad thing — someone who's
  never seen a wallet popup hears nothing at all. All of these are gone.
- **Past-perfect setup before the action.** *"I'd linked my wallet and set a budget."* Nobody announces
  preconditions. Do the thing, then explain the setup afterwards if it matters — which is why the
  wallet-linking line now comes *after* the trade lands.
- **Specification prose.** *"Publishing is one step; giving it a trading budget is another."*
  *"Portfolio tracks the result."* That's a manual read aloud.
- **Aphorisms as beat-enders.** *"It was never a hard question. It was a hard app."*
- Present tense over recorded footage. Ever.

**Overruled from the earlier draft:** the four-item promise in the greeting and *"I bring you"* both
stay. They were flagged as AI tells; they aren't. The greeting is the strongest thing in the video and
the four verbs preview the whole running order.

---

## Screen direction

Blocks match the blank-line breaks in the voiceover file, in order.

| # | You say (first words) | Show and do | Evidence requirement |
| --- | --- | --- | --- |
| 1 | "Howdy to the Somnia and DreamDEX team…" | Hard cuts ~1s: hackathon page → GitHub repo → land on `masayume.app` hero and hold. Face cam lower right from frame one. | Hero shows the Masayume mark and the Shannon testnet label. Persistent corner label **Somnia Shannon testnet** goes up here and stays. |
| 2 | "Let's start with that last one…" | Cut to the original X instruction post. Readable crop: BTC / UP / amount / window. | Label **Recorded testnet trade · 6 September 2026**. Never animate a fresh send. |
| 3 | "Here's the post…" | The post, then the delivered reply card — point at **Spent**. Then click through to the explorer, hold 2s on Success and the full hash. | [Command](https://x.com/masayume_app/status/2096704007112696288) → [reply](https://x.com/masayume_app/status/2096704198461084030) → [fill](https://shannon-explorer.somnia.network/tx/0x072a0259bd75c22697d960da29c513ff9a0d3b0f24ba5eefbe626810093fa26b). **Actual spend was 0.90852 tUSDC on a one-dollar request** — the reply card must stay readable, don't crop it to hide that. A filled order is not a won market. |
| 4 | "So I made that call on X…" | Brief inset of the account-link panel, then back. | The link step is real and precedes the post. Shown after the payoff, not before. |
| 5 | "Okay. So where does that live?" | Cut to the app. | — |
| 6 | "This is Masayume…" | Product header, then a compact DreamDEX / Somnia foundation shot. | DreamDEX supplies markets, quotes and fills. Do not imply we built the market layer, and do not imply DreamDEX has no apps. |
| 7 | "Here's one. Bitcoin…" | A live BTC Window. Cursor lands on each field **in the order you name it**: opening price → countdown → the Up/Down pair. | Slowest cursor in the video. **Up includes equality** — "at or above" is deliberate, keep it. |
| 8 | "So let's make one…" | Wallet connect, then tap **Up**, type `1`. | **The faucet is cut from the script** — funded and `ready`, but no live payout is on record. Come to the shoot pre-funded. The funding panel may appear as a visual; claim nothing about it. |
| 9 | "It shows me what I'm paying…" | Hold 2s on the readout strip: contracts, actual price, total. | On-screen: **tUSDC for stakes · STT for fees**. The loss sentence is the risk disclosure — do not cut it. |
| 10 | "Confirm." | Confirm, then Portfolio showing the position. | Live signed testnet trade from your own wallet, or a clean pre-recorded take of the same flow. |
| 11 | "Then tap-trading…" | Session chip → the spending-limit panel. Hold on the caps. | Tap approval is a bounded spending limit, not universal gaslessness. Per-tap / per-day / expiry ride as on-screen chips — don't say them. |
| 12 | **"Right. Agents."** | Full-screen section card or a hard cut to `/agents`. Give it a beat of silence. | The signpost is the point. Let it land. |
| 13 | "Because I don't want to make every call myself." | Optional brief face-cam return. | — |
| 14 | "There's Sensei…" | The Sensei advice dock. | Sensei advises. It does not execute autonomously. |
| 15 | "Or I build my own…" | The builder: instructions field, then the test-read control. | — |
| 16 | "Watch this one…" | The saved Sensei corrected read. Hold on opening **79,830.70**, **+11 bps**, **Hold**. | Label **Recorded · 7 September 2026**. The grant is revoked and the loop is paused — **do not re-run the model on camera** and do not narrate it as live. |
| 17 | "Then I publish it on Somnia…" | Explorer on the publication tx, hold 2s on Success and **zero fee**. | [`0x7a18eff5…f4619`](https://shannon-explorer.somnia.network/tx/0x7a18eff5353ac5ee423c0c331a56ec0a8b450acbae01cb07c4a79c6c743f4619). Publishing does not fund or start a strategy — that's why the line separates them. |
| 18 | "And you can copy mine…" | Copy drawer: record, budget, per-trade cap, expiry, fee. | Chip: **A permission, not a deposit — the owner never holds your money.** Chip: **Pause stops new copies; open trades stay open.** Both unspoken. |
| 19 | "Here's a run we recorded…" | Momentum #3 activity → fill → settlement → the owner's Trading Balance. Then the explorer. | Fill [`0x8a3c1652…cb7b2`](https://shannon-explorer.somnia.network/tx/0x8a3c1652ace3f626aae68abb576b6ab71012059285fcf717ee6b78a6f22cb7b2) → settlement [`0x88a8aefd…92600`](https://shannon-explorer.somnia.network/tx/0x88a8aefd9c3d6d310ac14710d893c9d72391446b864ce6bea8004de185492600), paying **1.661 tUSDC**. Overlay **Momentum · rule-based**. Recorded timestamps visible — settlement was not instantaneous. |
| 20 | "The AI keeps a record too…" | The AI decision journal — the 11-hold, 1-trade list. Then the losing fill and its zero settlement, ~2s each. | Overlay **AI · a separate strategy** — this must not read as the Momentum win. Fill [`0xe175d59f…d67d17`](https://shannon-explorer.somnia.network/tx/0xe175d59f302f3e55864dcaa05ccffa662c36461d942738e21157b37cb4d67d17) → settled for zero, [`0x19738859…679f8`](https://shannon-explorer.somnia.network/tx/0x197388596631f01ce571894163e47aa4e268e41f8073718e56e57b56131679f8). **The loss stays in.** Full-face punch-in on "it lost". |
| 21 | **"Now, X."** | Section card or hard cut to the X account. | Second signpost. |
| 22 | "The grammar is just words…" | On-screen, large: `@masayume_app btc up 1 4h`, with `asset · side · amount · window` labelled under it. Then the same command reordered. | Real grammar — any token order, `$` signs, decimals and synonyms all parse. `packages/core/src/x/parse.ts`. |
| 23 | "And when I send it something it can't read…" | [The refusal post](https://x.com/masayume_app/status/2096796003147940231). Hold on the card — no hash on it, which is the point. | Exactly one refusal, `instruction-invalid`, no transaction, no recursion. |
| 24 | **"Okay — what if your call is more specific?"** | Section transition back into the app. | Third signpost. |
| 25 | "Range… Parlay… Boost…" | One continuous choice sequence: Range band → Parlay legs → Boost 2×/3× chips and the knockout line. ~4s each. | Controls only. **Claim no new execution.** The knockout caveat is spoken because it's the one that can cost someone money. |
| 26 | "There's Private trading. And Earn…" | Private panel, then Earn shares. | Chip: **Private reduces the direct wallet link — it is not anonymity.** Chip: **Earn is variable exposure, not fixed yield.** |
| 27 | **"And games."** | Section card → `/games` hub. | Fourth signpost. |
| 28 | "Practice… Duel… Lucky Draw… Moonshot… Line Rider and Candle Hop" | One continuous montage, ~3s a name, in spoken order. All seven legible; Range is already covered. | Duel chip: **card trades use funds; ranked adds a pot.** Lucky: the draw and the order are separate actions. Moonshot uses the recorded **Paid** capture (2.000132 tUSDC on a 1.000354 stake), labelled. Arcade courses are seeded, not live-market charts — **no trading payouts**. Season banner may appear; **100 tUSDC escrowed** as on-screen text only. |
| 29 | "There's Reels for sharing a take…" | Reels take → Room → alert control → Portfolio. | A signed take is not an order. Room requires a position. Alerts need the tab open. Show controls or genuine existing captures — don't post anything new. |
| 30 | "If you want to try it…" | Docs home → Start → Agents/Games → Builders SDK map → `llms.txt` raw, 2s. | On-screen over the contracts table: **10 contracts · 1,067 tests · 14 invariants**. llms.txt caption: **Docs, in plain text, for your AI.** |
| 31 | "That's Masayume. Now — what's your call?" | Back to the app hero, face cam grows. End card: `masayume.app` · `docs.masayume.app` · `@masayume_app`. Hold to black. | Full beat of silence before the last line. Don't pronounce every URL. |

---

## Coverage ledger

Dropping a spoken feature list must not silently drop the feature. This is where each family lands.

| Family | Status | Treatment |
| --- | --- | --- |
| X instruction → fill → transaction | Dated live, 6 Sep | **Opening hero.** Spoken, with proof click. |
| X grammar and refusal | Verified local + dated refusal post | **Own section.** Spoken. |
| DreamDEX / Somnia foundation | Source verified | Spoken early, shown again at the docs handoff. |
| Windows, Up/Down, ticket, Portfolio | Verified local | Spoken. Up includes equality. |
| Wallet connect, tap-trading limits | Verified local | Spoken. **Faucet cut** — no live payout on record. |
| Sensei, agent builder, test read | Verified local + dated read | Spoken. Sensei advises only. |
| Publication, copy, budget, caps, pause | Dated live | Spoken; pause caveat is an on-screen chip. |
| Momentum #3 trade → settlement → balance | Dated live | Second proof. Spoken. |
| AI decisions, holds, the loss | Dated live | Spoken. The loss stays in. |
| Range, Parlay, Boost | Verified local | One spoken choice sequence, controls only. |
| Private, Earn | Verified local | Spoken, with risk chips. |
| Seven games + Moonshot claim | Catalog verified + dated Moonshot | One montage, six names spoken. |
| Season pool, 100 tUSDC escrowed | Dated live | On-screen text only. |
| Reels, Rooms, alerts | Verified local | One spoken bridge. |
| Docs, llms.txt, self-hosting, SDK map | Verified live | One closing handoff. |
| Paid Memory Market, Reversion, achievements, native app, mainnet | Roadmap | **Omitted.** Not spoken, not shown. |

---

## Capture runbook

### Preflight

- Record 2560×1440+, export 1920×1080. Browser 100% on the app, **110–125% on the explorer** so hashes survive the downscale. **Check the finished cut at phone size** — enlarge any panel whose words don't read.
- **Record one natural take before cutting a single word.** The script is a speaking guide. Contractions and small changes in your own voice are welcome as long as the claim stays true.
- Face cam lower right, ~22% frame width. Keep it clear of the ticket, the receipt card and every explorer hold. Optional brief return at "Because I don't want to make every call myself."
- Come **pre-funded** — tUSDC and STT in the demo wallet, tap-trading already armed so the limits panel has real caps to show.
- Hide: private keys, `~/.config/masayume/*.env`, X DMs and sidebar, bookmarks, the email in the profile chip, Vercel/Fly dashboards, terminal scrollback, wallet extension internals. Public proof wallets and hashes stay visible.
- Confirm `/api/status` reads `healthy` with at least one live Window immediately before rolling. Notifications off, Focus on.

### Tab order

1. [Original X instruction](https://x.com/masayume_app/status/2096704007112696288)
2. [Delivered reply](https://x.com/masayume_app/status/2096704198461084030)
3. [Matching transaction](https://shannon-explorer.somnia.network/tx/0x072a0259bd75c22697d960da29c513ff9a0d3b0f24ba5eefbe626810093fa26b)
4. `masayume.app` hero → `/markets` → a live BTC Window → Portfolio → session/limits panel
5. `/agents` — Sensei dock, builder, the saved corrected read, the decision journal
6. Explorer — `0x7a18eff5…`, `0x8a3c1652…`, `0x88a8aefd…`, `0xe175d59f…`, `0x19738859…`
7. [The refusal post](https://x.com/masayume_app/status/2096796003147940231)
8. Range → Parlay → Boost → Private → `/earn`
9. `/games` hub, Duel, Lucky, Moonshot Paid capture, Candle Hop, Line Rider, season banner
10. Reels → Room → alerts → Portfolio
11. `docs.masayume.app` → Start → Builders SDK → `llms.txt`
12. `masayume.app` hero (closing frame)

### Retake triggers

- `/api/status` degrades, or live Windows drop to zero mid-take.
- A hash, amount, sender or status is cropped, blurred, or covered by the face cam or captions.
- A recorded scene appears without its **Recorded · date** label.
- The AI strategy and the Momentum strategy appear without their distinguishing overlays.
- A wallet popup, seed phrase, private key, env file or personal identifier enters frame.
- You narrate a recorded agent decision in the present tense.
- The faucet gets attempted on camera.

---

## Edit map

- **Music** enters under the greeting, drops out for every explorer hold and for the beat before the last line.
- **Section cards** for the four signposts — "Agents", "X", "more specific", "games". A beat of silence on each. They're the spine of the cut.
- **Hold ≥2s, uncovered:** the X reply card; the fill transaction; the ticket readout; the limits panel; the publication hash and zero fee; the Momentum settlement; the losing settlement; the Moonshot Paid record.
- **Remove:** wallet spinners, page loads, explorer indexing, typing dead air, queue countdowns. Never cut between a click and its result.
- **Full-face punch-ins — two only:** "it lost" and "what's your call?"
- **Persistent:** corner label **Somnia Shannon testnet**. **Recorded · date** on every X, agent and Moonshot scene.

### If the take runs past 4:00

In this order:

1. The social bridge — "There's Reels for sharing a take…" (−6s). Whole line goes; the docs shot covers it.
2. "There's Private trading. And Earn, where you put money behind the quotes." (−6s). Keep both as visuals.
3. "That part took the longest to get right." (−4s). It's a good line, it isn't load-bearing.
4. "If you're building, there's local setup, self-hosted bots, and our DreamDEX integration." (−6s).

**Never cut:** the greeting, the post sequence, the Window explanation, "If I'm wrong, I lose the
dollar", the agent hold, the loss, or any of the four signposts.
