# Masayume: Demo Video Script (presenter cut, 8 September 2026)

The narrated judge-facing cut. This does **not** replace the 166-second stock-voice review cut
([demo-script-2026-09-06.md](demo-script-2026-09-06.md)) already deployed at `/demo`; it is the
presenter-led video for the hackathon submission and YouTube.

> **Scope note.** The hackathon brief asks for a **2–3 minute** demo video
> ([00-hackathon-brief.md](../../context/00-hackathon-brief.md)). This cut is built to the
> requested 4-minute ceiling at **03:52**. A marked 02:58 trim is given under
> [Timing Check](#timing-check) — take it if the judges enforce the stated range.

## Cut Summary

- **Audience:** Somnia and DreamDEX judges, plus builders in the Somnia Discord showcase — assume zero prediction-market background.
- **Target runtime:** 03:52 (hard ceiling 04:00).
- **Spoken-word target:** 606 words at ~175 wpm.
- **One-line promise:** A prediction market you can tap, play, hand to an agent, or just tweet at.
- **Hero proof:** An AI agent that reads a real market, **refuses to trade**, then — once copied under a bounded grant — fills and settles itself on Shannon, loss included, with explorer receipts.
- **Closing tagline:** *Make your call. See it through.*
- **Proof environment:** Somnia Shannon testnet, chain 50312. tUSDC collateral, STT gas. Every figure below is testnet.

## Project Truth

### Verified now

- App live and healthy at `masayume.app`; `/api/status` at 12:13 UTC on 8 Sep returned `overall: healthy`, RPC block 482,964,114, BTC $78,229.35, ETH $2,469.95, Sensei `openai/gpt-5.4 via direct`.
- Docs live at `docs.masayume.app` — 52 guides, 215 links, 241 source references, plus `llms.txt` / `llms-full.txt`.
- 10 Masayume contracts on Shannon; all 20 configured addresses returned code at block 480,250,668 (5 Sep).
- **AI agent "Shannon Sensei" published:** [`0x7a18eff5…f4619`](https://shannon-explorer.somnia.network/tx/0x7a18eff5353ac5ee423c0c331a56ec0a8b450acbae01cb07c4a79c6c743f4619), zero fee.
- **12 real AI decisions** (`openai.responses/gpt-5.4-2026-03-05`), unique by Window: **11 held, 1 traded** at 58%.
- **AI fill and honest loss:** [`0xe175d59f…d67d17`](https://shannon-explorer.somnia.network/tx/0xe175d59f302f3e55864dcaa05ccffa662c36461d942738e21157b37cb4d67d17) bought 4.608 UP for 0.935424 tUSDC; market resolved DOWN; auto-settled for zero at 02:00:22 UTC — [`0x19738859…679f8`](https://shannon-explorer.somnia.network/tx/0x197388596631f01ce571894163e47aa4e268e41f8073718e56e57b56131679f8).
- **Momentum #3 winning cycle:** fill [`0x8a3c1652…cb7b2`](https://shannon-explorer.somnia.network/tx/0x8a3c1652ace3f626aae68abb576b6ab71012059285fcf717ee6b78a6f22cb7b2) (1.661 DOWN for 0.908567 tUSDC), auto-settled 04:00:13 UTC paying **1.661 tUSDC** — [`0x88a8aefd…92600`](https://shannon-explorer.somnia.network/tx/0x88a8aefd9c3d6d310ac14710d893c9d72391446b864ce6bea8004de185492600).
- **Trade from X:** [command](https://x.com/masayume_app/status/2096704007112696288) → [image receipt](https://x.com/masayume_app/status/2096704198461084030) → [fill](https://shannon-explorer.somnia.network/tx/0x072a0259bd75c22697d960da29c513ff9a0d3b0f24ba5eefbe626810093fa26b) spending 0.90852 tUSDC for 1.34 contracts. An intentionally invalid command produced exactly **one refusal, no transaction, no recursion**.
- **Moonshot round 3, full cycle:** purchase → settlement (closing print $79,922.31) → claim paying **2.000132 tUSDC** on a 1.000354 tUSDC stake.
- **Duel driven end to end on Shannon** (deal, create, join, reveal, both seats pick every card, per-card settle, finalize, both claims) — [context/54](../../context/54-first-full-duel-2026-09-03.md).
- **Season 1 prize pool really escrowed:** `/api/games/season` returns 100.000000 tUSDC deposited at SeasonPrizePool [`0x6B34…96fA`](https://shannon-explorer.somnia.network/address/0x6B340DBE7AC3283B5f5c3aA5f6AaEd57378596fA), ending 30 Sep 2026, split 40/20/10 then 5 × six places.
- **Faucet funded and ready** (checked 8 Sep): `ready: true`, treasury 47.997 STT, 38 STT remaining in the rolling day.
- Gates: **1,067 tests across 83 files**, all workspace typechecks, **14 invariants**, **226 contract tests across 24 suites**; [CI green](https://github.com/Blockchain-Oracle/masayume/actions/runs/34081587977) on `9bb7238`.
- Live arcade leaderboard rows and a populated venue leaderboard (top entry: 12 settled trades, 58% win rate).

### Implemented but not yet verified

- **Faucet live payout.** Funded and `ready`, but no successful live STT delivery is recorded in the ledger. **Rehearse once off-camera before filming.**
- **Agent loop is currently paused.** Grant 8 revoked, #3 consent paused, `/api/strategies/health` returns no active strategies. The agent beat therefore **revisits recorded evidence** — it must not be narrated as happening live.
- **Lucky, Range, Line Rider:** built and routed; no dated live economic evidence in the current ledger. Show as motion in the montage, claim nothing specific.
- **Private mode:** local recovery passed and the public empty state is verified; balance reads 0.00 tUSDC.

### Roadmap only

- Paid Memory Market, Reversion, achievements, unrecorded game-profile statistics, broader performance work.
- Mainnet. Nothing about mainnet is deployed; say "when Event Contracts are ready," never "we are on mainnet."

## Claim-to-Screen Ledger

| Claim | Status | Evidence | Exact screen or action | Script treatment |
| --- | --- | --- | --- | --- |
| App is live on Shannon and healthy | verified live | `/api/status` 8 Sep 12:13 UTC | `masayume.app/status` | speak |
| A Window is asset + opening price + closing time + Up/Down | verified live | `/markets`, docs `trading/first-trade` | Market detail hero | speak |
| Quote is the real book, not a midpoint | verified local | `packages/markets/src/provider/quotes.ts` | Ticket readout strip | speak |
| Tap-trading signs without a popup, inside caps, cannot withdraw | verified local | `features/session/copy.ts`, `EventVault` | Session sheet "What you are signing" | speak |
| Agent builder separates identity, behaviour, test read, publication | verified live | Ledger: builder exercised | `/agents` four-step builder | speak |
| The AI read a real price and held | verified live | Corrected preview: opening 79,830.70, ~+11 bps | Saved Sensei read capture | speak, label **Recorded 7 Sep** |
| Strategy published on Somnia | verified live | tx `0x7a18eff5…` | Explorer tab | speak + proof shot |
| Copying is a bounded permission, not a deposit | verified live | Grant tx `0x3e8b134b…`, consent `0x3aeb28e9…` | Copy drawer | speak |
| 12 real decisions: 11 holds, 1 trade | verified live | Ledger decision IDs 1–12 | Agent detail / journal | speak, label **Recorded** |
| It traded, lost, and settled itself for zero | verified live | tx `0xe175d59f…` → `0x19738859…` | Explorer | speak + proof shot |
| The rules agent won and auto-settled 1.661 tUSDC | verified live | tx `0x8a3c1652…` → `0x88a8aefd…` | Explorer | speak + proof shot |
| A tweet placed a real trade with a receipt card | verified live | X command → receipt → tx `0x072a0259…` | x.com, live | speak + proof shot |
| Invalid command refused, no transaction | verified live | Refusal 2096796003147940231 | X thread | speak |
| Seven games, three honesty tiers | verified local | `packages/core/src/games/types.ts` descriptors | `/games` hub | speak |
| Duel = real orders plus a real side pot | verified live | context/54 full drive | Duel stage motion | speak |
| Season 1: 100 tUSDC escrowed | verified live | `/api/games/season`, escrow `0x6B34…96fA` | Season banner | speak |
| Moonshot bought, settled and paid 2.000132 tUSDC | verified live | 3 receipts | Moonshot Paid state | montage only |
| Boost 2×/3× with loss capped at stake | verified local | `LeverageReserve`, `features/leverage/copy.ts` | Leverage chips | speak (montage) |
| Parlay / Private / Earn exist | verified local | Deployed contracts + routes | Rapid montage | name only |
| DreamDEX SDK 0.28.1 supplies discovery, quotes, fills | verified live | `packages/markets/…`, docs `builders/dreamdex-sdk` | Architecture map | speak |
| 10 contracts, 1,067 tests, 14 invariants | verified local | Acceptance ledger + CI run | Docs / CI | speak |
| Docs carry an AI-readable export | verified live | `docs.masayume.app/llms.txt` 200 | llms.txt in browser | speak |
| Faucet gives you test funds in one flow | implemented-unverified | `ready:true`, 47.997 STT, no recorded payout | Get test funds panel | **rehearse first; qualify or cut** |
| Lucky / Range / Line Rider specifics | implemented-unverified | Built, no dated live economics | Montage motion | omit specifics |
| Paid Memory Market, mainnet | planned | Backlog | — | roadmap line only |

## Final Timeline Script

| Time | Spoken script | Screen and demo direction | Proof or capture note |
| --- | --- | --- | --- |
| 00:00–00:11 | "Howdy to the Somnia and DreamDEX team. It's Blockchain Oracle, and I bring you Masayume — a prediction market you can tap, play, hand to an agent, or just tweet at." | Hard cuts, ~1s each: hackathon page → GitHub repo → **land on `masayume.app` hero and hold**. Face cam lower right from frame one. | Live site. Hero must show the Masayume mark and the Shannon testnet label. |
| 00:11–00:25 | "Ask anybody one question: will Bitcoin be higher an hour from now? Everybody has an answer. Then you show them this — order books, expiry timestamps, slippage — and they're gone. It was never a hard question. It was a hard app." | Cut to a raw DreamDEX/CLOB order-book screen. Let it look dense. Scroll once, fast. Cut back to the Masayume Window on the word "app". | Any public order-book view. Do **not** disparage DreamDEX — frame it as *raw rails*, which is what it is. |
| 00:25–00:38 | "So I built Masayume on DreamDEX Event Contracts. Same markets, same chain, one honest question at a time. We call it a Window. An asset, a starting price, a closing time. Up, or down. That's the whole thing." | `/markets`. Cursor traces each field as it is named: asset → opening print → closing countdown → the Up/Down pair. | Slow, deliberate cursor. This is the single most important 13 seconds for a layman. |
| 00:38–01:07 | "Let's make one call. Bitcoin, one hour. I tap Up, I put in one dollar — and before I confirm, it shows me the real price off the real book, not a friendly average. Now watch: no wallet popup. That's tap-trading. I handed this browser a key with limits I chose — how much per tap, how much per day, and when it dies. It can buy. It can never withdraw. Only my wallet does that." | Market detail. Tap **Up**, type `1`. Hold 2s on the readout strip (contracts, actual price, total). Confirm. Cut to the session chip, open the sheet, hold on **"What you are signing" → Never: withdraw, change where money goes, or spend past the caps**. | **Live signed trade on testnet.** Boundary: your own wallet, your own funds. Fallback: a pre-recorded clean take of the same flow. |
| 01:07–01:28 | "But here's the part I'm proud of: you don't have to be here at all. This is the agent builder. Give it a name, choose how it thinks, then test it before anyone trusts it. This one's an AI. Watch its read — it saw Bitcoin's real opening price, an eleven basis point move, and it held. It said no." | `/agents` builder, scrub the four steps fast. Then cut to the saved **Shannon Sensei corrected read** capture. Hold on the opening **79,830.70** and **+11 bps** and the **Hold** verdict. | Label band: **Recorded · 7 September 2026**. Do not imply the model is running now. |
| 01:28–01:47 | "That's the point. An agent that only trades when it likes the price. Here it is published on Somnia, and here's somebody copying it — a budget, a cap per trade, an expiry. Read that carefully: it's a permission, not a deposit into my pocket. Pause it any time." | Cut to explorer tab already open on publication tx `0x7a18eff5…`, hold 2s on Success + hash. Cut to the copy drawer: budget, per-trade cap, expiry, fee. | Keep the full hash legible. Fee reads **zero** — don't skip past it, it supports the claim. |
| 01:47–02:12 | "And it ran. Twelve real decisions overnight: eleven holds, one trade. It bought, the market went the other way, and it settled itself for zero. A real loss, on chain — and I left it in the video. The rules-based agent took an Ethereum window the other way and settled one-point-six-six back the second it expired. Don't take my word for it." | Agent detail / decision journal — the 11-hold, 1-trade list. Then explorer: fill `0xe175d59f…`, settlement `0x19738859…`, then the winning settlement `0x88a8aefd…`. Hold each ~2s. | **Hero proof.** Never crop the hash. The loss stays in — it is the credibility beat. |
| 02:12–02:35 | "Or skip the app completely. This is just a tweet: one dollar, Bitcoin, up, four hours. It replied with a receipt — who sent it, what it actually spent, and the transaction hash. Click the hash: same trade, on Somnia. And when I sent it nonsense, it refused, and it spent nothing. That refusal matters more than the trade." | Live x.com thread. Show the command post, then the reply card — hold 3s so sender, spend and hash are readable. Click through to the explorer. Cut to the refusal post. | Genuinely live and clickable. Hide any personal X sidebar/DM chrome. |
| 02:35–03:04 | "A call should also be fun. Seven games. Duel — you and one opponent, real orders and a real side pot. Lucky Draw deals you a provable random market. Moonshot: pick how far, the house prices it. Plus Range, Line Rider, Candle Hop, and Practice with no money at all. Season one has a hundred test dollars actually locked in escrow. Same markets underneath — boost two or three times with your loss capped, stack a parlay, go private, or supply the vault and earn." | **Breadth montage, ~2s per beat, no lingering.** `/games` hub → Duel stage motion → Lucky spin → Moonshot Paid capture → Candle Hop run → season banner (hold 2s on **100 tUSDC**) → market ticket 2×/3× chips → parlay slip → private toggle → `/earn`. | Name over motion. Do not stop to explain any one of these. Moonshot uses the recorded Paid capture, labelled. |
| 03:04–03:26 | "Underneath everything is DreamDEX. Their SDK finds the markets, prices them, and fills the orders. Our contracts do the parts it doesn't — bounded permissions, the reserves, and the game arena. Ten contracts on Shannon, over a thousand tests, and docs that map every feature to the exact SDK call. Judges, there's a plain-text version for your AI too." | `docs.masayume.app/builders/dreamdex-sdk` — hold the SDK diagram. Cut to the contracts table. Cut to `docs.masayume.app/llms.txt` raw in the browser and hold 2s. | The llms.txt shot is a deliberate wink at AI-assisted judging. Keep it to 2 seconds. |
| 03:26–03:36 | "Next up: more market conditions for the agents, paid memory so a strategy can sell what it learned, and mainnet the day Event Contracts are ready." | Back to the app hero. Face cam grows slightly. | Roadmap framing only. No present tense. |
| 03:36–03:52 | "Masayume is live on Somnia testnet right now. The app, the docs, and every receipt are in the description. Make your call. See it through." | Full-face punch-in on "Make your call." Cut to the app hero with an end card: `masayume.app` · `docs.masayume.app` · `@masayume_app`. Hold to black. | Land the tagline with a beat of silence before the cut. |

## Capture Runbook

### Preflight

- **Canvas / recording:** record the browser at 2560×1440 or higher, export 1920×1080. UI text must survive the downscale.
- **Browser zoom:** 100% on the app, 110% on the explorer so hashes read at 1080p.
- **Face camera:** lower right, ~22% of frame width. Shrink or move it during the Ticket readout and every explorer hold.
- **Caption safe area:** lower centre, clear of the face cam and the ticket dock.
- **Accounts / fixtures:** demo-user wallet already connected on Shannon 50312, funded with tUSDC and STT **before** recording. Tap-trading already armed so the session sheet has real caps to show.
- **Secrets and personal data to hide:** private keys, `~/.config/masayume/*.env`, X DMs and sidebar, browser bookmarks, email in the profile chip, any Vercel/Fly dashboards, local terminal scrollback.
- **Network / environment:** production `masayume.app` only — never localhost. Confirm `/api/status` reads `healthy` and reports at least one live Window **immediately before** rolling.
- **Notifications disabled:** macOS Focus on; Slack, Mail and Chrome notifications off.

### Tab order

1. Somnia × DreamDEX hackathon page
2. `github.com/Blockchain-Oracle/masayume`
3. A raw DreamDEX order-book / CLOB view (the problem shot)
4. `masayume.app` hero → `/markets` → a live BTC Window
5. `masayume.app/agents` (builder) and the agent detail / decision journal
6. `shannon-explorer.somnia.network` — four tabs pre-opened on `0x7a18eff5…`, `0xe175d59f…`, `0x19738859…`, `0x88a8aefd…`
7. `x.com/masayume_app` — command, receipt and refusal posts
8. `masayume.app/games` → season banner → `/earn` → `/parlay`
9. `docs.masayume.app/builders/dreamdex-sdk` → contracts table → `docs.masayume.app/llms.txt`
10. `masayume.app` hero (closing frame)

### Exact demo inputs

| Step | Input or click | Expected result | Fallback evidence | Safety boundary |
| --- | --- | --- | --- | --- |
| Live status check | Load `/api/status` off-camera | `overall: healthy`, ≥1 live Window | Postpone the shoot | Read-only |
| First call | BTC 1h Window → **Up** → stake `1` | Readout shows contracts + actual price; confirm fills | Pre-recorded clean take of the same flow | **Signs a real testnet trade from your own wallet.** Your call, your funds |
| Tap-trading | Open session chip → session sheet | Caps, expiry and "Never: withdraw…" visible | Screenshot of the armed sheet | Read-only if already armed |
| Agent read | Saved Shannon Sensei corrected-read capture | 79,830.70 opening, +11 bps, **Hold** | The capture itself is the evidence | **Do not re-run the model on camera** — grant is revoked |
| Publication proof | Explorer tab `0x7a18eff5…` | Success, full hash, zero fee | Saved explorer screenshot | Read-only |
| Copy permission | Copy drawer on the published strategy | Budget, per-trade cap, expiry, fee | Existing capture | **Stop before signing a new grant** unless you choose to fund one |
| Loss + win proof | Explorer `0xe175d59f…`, `0x19738859…`, `0x88a8aefd…` | Confirmed; amounts legible | Saved screenshots | Read-only |
| X receipt | Live x.com thread; click the hash in the reply | Explorer opens the matching fill | Saved receipt image + tx page | **Post nothing new from the account on camera** |
| Games montage | `/games` hub, Duel stage, Lucky, Candle Hop | Motion only | Recorded Moonshot Paid capture | Practice and arcade spend nothing |
| Season pool | Season banner / `/api/games/season` | 100 tUSDC escrowed, ends 30 Sep | Escrow address on explorer | Read-only |
| Faucet (optional) | **Get test funds** | STT top-up, then tUSDC mint | Cut the beat entirely | **Rehearse once off-camera first** — no successful live payout is on record |

### Retake triggers

- `/api/status` degrades, or the live-Window count drops to zero mid-take.
- A hash, amount, sender or status is cropped, blurred, or covered by the face cam or captions.
- Any recorded/revisited scene appears without its **Recorded · date** label.
- A wallet popup, seed phrase, private key, env file or personal identifier enters frame.
- The cursor lands on a destructive control (revoke, withdraw, delete) not in the script.
- You narrate a recorded agent decision in the present tense.
- The faucet is attempted on camera and fails.

## Edit Map

- **Opening montage:** four hard cuts in the first 11 seconds — hackathon → repo → order book → product hero. No logo animation, no fade-in.
- **Hard-cut points:** every "→" in the tab order. Cut on the word, not after it.
- **Waits to remove:** wallet confirmation spinners, page loads, explorer indexing, typing dead air, the Duel queue countdown. Preserve action-to-result continuity — never cut between a click and its result.
- **Proof frames to hold (≥2s, uncovered):** the Ticket readout strip; "Never: withdraw…"; publication hash `0x7a18eff5…`; the losing settlement; the winning 1.661 settlement; the X receipt card; the 100 tUSDC season escrow.
- **Full-face punch-ins:** two only — "I left it in the video" (01:58) and "Make your call" (03:44).
- **Caption treatment:** burned-in, lower centre, one line where possible. Persistent corner label **Somnia Shannon testnet**. Add **Recorded · 7 September 2026** on the agent-read, agent-journal and Moonshot scenes.
- **Music or deliberate silence:** low bed under 00:00–00:38 and 02:35–03:04. **Drop to silence** for the three explorer proof holds and for the beat before the tagline.
- **Closing frame:** app hero with `masayume.app` · `docs.masayume.app` · `@masayume_app`.

## Timing Check

- **Spoken words:** 606
- **Estimated pace:** ~175 wpm → 208s of speech (197s at 185, 214s at 170)
- **Estimated runtime:** **03:52** (24s of deliberate holds and silence)
- **First product-name timestamp:** 00:07 ("Masayume")
- **First real action timestamp:** 00:38 (the Up call)
- **Hero-proof timestamp:** 01:47–02:12 (decisions → loss → win, with explorer)

### If you must hit the brief's 2–3 minutes (02:58 trim)

Cut in this order, which preserves the promise and the whole action-to-proof chain:

1. **Roadmap beat** 03:26–03:36 — remove entirely (−10s).
2. **Problem beat** 00:11–00:25 — trim to "Ask anybody: will Bitcoin be higher in an hour? Everybody has an answer. Then you show them this. It was never a hard question — it was a hard app." (−6s).
3. **Games montage** 02:35–03:04 — drop Lucky, Range and Line Rider from the spoken list; keep Duel, Moonshot, Practice and the season pool (−12s).
4. **Tap-trading** — keep the no-popup moment, cut the per-tap/per-day enumeration to "limits I set, and it can never withdraw" (−9s).
5. **Architecture** 03:04–03:26 — drop the test/contract counts, keep DreamDEX's role and llms.txt (−8s).

Do **not** trim: the opening promise, the Window explanation, the agent hold, or any explorer proof hold.
