# Masayume acceptance ledger — 6 September 2026

Updated through **21:42 UTC**. This is the current implementation and rehearsal record. Earlier `RESUME.md`, parity-ledger and context entries are historical. Source, local checks, deployment and live outcomes are separate gates. **The latest X guard deployment is in progress; success is not yet claimed.**

## Authorized outcome

Implement the focused agent workflow and reliability rebuild, dynamic X identity/hash receipts, private restore and status fixes; rehearse on Shannon faucet assets; clean the existing @masayume_app timeline and retain one new testnet demonstration; prepare public app/docs repositories and a submission package. Actual hackathon submission remains the owner's action.

Baseline: app `16b4b7b`, docs `ebdeddb`, both clean at implementation start. No contract redeployment is planned. One wallet can have one STRATEGY grant and a separate X EXECUTOR grant; Momentum and AI acceptance therefore run sequentially.

## Acceptance matrix

| Scenario | Status | Evidence / next gate |
| --- | --- | --- |
| Agent builder and copy lifecycle | Implemented and exercised | Four-step builder, durable identity, bounded grant/consent/pause and recovery implemented. Latest copy-progress wording passed the production build; final deployed UI recheck remains. |
| Runner decisions, attempts and settlement | Local checks and live guards passed | Durable reservation/recovery, stale-input refusal and risk memory tested. Corrected Momentum guards and real AI Holds observed; restart comparison and eventual paused-position settlement remain. |
| X identity/hash cards and reliable delivery | Live card passed; loop fix awaiting deployment | Persisted sender/full hash, execution recovery, pagination and health implemented. Actual uploaded card inspected; recursive reply defect contained with posting OFF. |
| Private restore from empty browser | Passed locally | Empty-wallet Restore visible; invalid JSON refused, signed fixture restored, duplicate ignored, another owner's claim excluded from current owner's list; 390px light capture |
| Bounded status diagnostics | Passed locally | Three regression tests; named operation and elapsed time, total budget and in-flight deduplication; live status recovered |
| Market dependency readiness | Recovered, monitored | Fresh `/api/status` at approximately 19:52 UTC: healthy indexer 1769ms, three lanes/six live Windows, RPC block 481511932, prices and database available |
| Momentum publish/copy/fill/settlement | Corrected #3 had no fills; now paused | #1's historical fill remains invalid signal evidence. Corrected 1 bps strategy #3 was published/copied; at 21:20 UTC four terminal refusals, no fills, grant 7 full 2 tUSDC/spent 0/open 0, runner nonce 1/1. Quote/cap guards held. Root paused #3 at 21:40 UTC and recovered its full budget. No corrected fill/settlement is claimed. |
| AI real read/publish/copy/fill/settlement | Corrected real Hold, publication, copy and runner Holds verified | Shannon Sensei #2's corrected Test read showed $79,830.70 opening, +11 bps and Hold (0.80). Publication and grant 8/consent confirmed. At 21:42 UTC two persisted real OpenAI gpt-5.4 decisions were Hold: BTC 0.51, ETH 0.54; no attempts/fills, grant budget 2 tUSDC intact, spent/open 0, runner nonce 1/1. Restart and any fill/settlement remain unproved. |
| X live media receipt | Exact fill and delivered card verified; overall flow still open | Command 2096704007112696288 executed once; valid reply 2096704198461084030 has the matching image ID, sender, full hash and URL. The old relay consumed its own receipt and posted one spurious refusal; its next POST is ambiguous. Posting is OFF pending live guard verification. |
| X cleanup inventory and deletion | Inventoried; confirmation pending | Verified @masayume_app ID 1971264227093643264. Nine unique authored posts match profile count; Posts/Replies/Media and continuation pages checked. No reposts found. Exact batch saved in ignored `.masayume/acceptance-2026-09-06/x-cleanup-manifest.md`; action-time deletion confirmation requested |
| Responsive/theme and recovery QA | Captured; final deployed check pending | Real 1280px dark, 320px dark and 390px light captures; narrow-header and rank wording fixes included in source. These do not certify every viewport/theme combination. |
| Arcade score and Moonshot | Score persisted; Moonshot complete | Candle Hop best score 0/rank 2 confirmed separately (server score, not on-chain). Moonshot round 3: actual stake 1.000354 tUSDC, winning settlement, claimed payout 2.000132 tUSDC; all three receipts independently decoded. |
| Public-release source/history review | In progress | Both repositories currently private; secrets and provenance checks precede visibility |
| Demo and submission package | Prepared; release pending | 160-second source-grounded script, current checklist, SDK feedback draft and immutable demo receipts prepared. Rendered video, public repositories/docs release, final links and actual submission remain pending. |

## Latest verification

- Latest full gate: **1,042 tests across 80 files**, workspace typechecks, **14 invariants** and `pnpm build` passed, including the copy-progress wording change. The small demo-proof data addition followed that build and belongs in the coordinator's final build check. No contracts changed after the **226-test/24-suite** contract gate.
- X now has **18** disposable PostgreSQL checks and **114** focused unit cases. Stable account identity and reply-parent metadata prevent own replies from becoming commands. Persisted receipt IDs independently fence acquisition and the final POST gate; startup holds old recursive pending/unknown deliveries. Sent evidence remains intact. Live suppression still needs verification after deployment; no blind repost is permitted.
- AI #2 copy grant **8** has 2 tUSDC budget, 1 per trade, 2 per day, 1 open position and an 85¢ cap; subscription fee is zero. Persisted model decision IDs 1/2 at approximately 21:41 UTC both Hold on real `gpt-5.4-2026-03-05` Responses calls. The BTC explanation finds little edge in a near-flat market; ETH's 98¢ UP price leaves little value. Hold is valid acceptance of inference and guard behavior, not a fill or profit.
- At 21:20 UTC, #3 grant 7 still had 2 tUSDC/spent 0/open 0. Its four refused attempts were a quote moving beyond cap, ETH 1h 99.9¢ > 85¢, BTC daily 94¢ > 85¢, and ETH daily 99.9¢ > 85¢. Existing positions under older grants excluded both 4h Windows. **This is a dated snapshot:** #3 was later paused and its full budget returned.
- X's original transaction has exactly one matching `Executed` event: expected owner/executor, grant 4, BTC market `0x…15529`, UP buy, cash 908520 and tokens 1340000. Public media **2096704190013640708** matches the stored delivery. CUA inspection and its saved capture verified the actual card's sender, full hash, 0.90852 tUSDC spend and 7 September 00:00 UTC expiry. The loop's two refused rows have no transaction hash.
- Public-only local evidence under `.masayume/acceptance-2026-09-06/`: `acceptance-receipts-2142.json` (independent RPC decode), `strategy-1788729601463.json` (#3 baseline), `strategy-1788730968254.json` (AI Holds), `x-live-mention-evidence.json`, `x-live-chain-evidence.json`, `x-test-clutter-manifest.json`, and captures `ai-corrected-read-1280-dark.png` / `x-delivered-receipt-1280.png`. Original nine-post cleanup and new spurious refusal are separate inventories; deletion remains pending confirmation.

## Historical verification and failure record

- **Invalidated Momentum #1 signal:** the first fill spent 0.928284 tUSDC for 1.204000 ETH 4h UP contracts within its cap, but compared a two-decimal oracle opening to an eighteen-decimal EMA. It proves bounded execution only. It must not be sold as a correct strategy decision or profitable performance. The original AI preview saw a zero opening from the same defect and was held by price limits.
- Future #1 copies were paused at 20:40 UTC. Its historical grant-5 position remains open until **7 September 00:00 UTC**; pausing does not remove exposure or fabricate settlement. A brief subsequent grant-6 rehearsal produced no new fill and was paused before #3.
- The correction normalizes oracle cents to the feed's declared scale and rejects invalid units. Regression coverage includes 6/8/18-decimal feeds, both directions, sub-threshold holds and correct AI prompt prices. Independent review also fixed stale fallback acceptance and restart model-budget accounting.
- The first StrategyRegistry publication exhausted its old fixed gas limit. Estimation/headroom fixed publication; exact fee allowance prevents an intervening fee increase from silently charging more. The failed receipt remains below.
- The connected demo wallet was exercised in Codex's in-app browser through a Shannon/pinned-contract signer bridge with no key in the page. Native Zen automation remained unreliable. Strategy runner `0xfE22Db9A0EA0b9E6AeBA9F5A05Ac6aA564b8AA52` and X executor `0xFf3e12Ec3d555CF3b4B715586403AB4199Ad02E5` are distinct.
- Market dependencies recovered to three lanes/six Windows. The maker resumed quoting and settlement after faucet-STT replenishment. Historical deployment `e3c298e` reached Vercel `dpl_3ZTu71LG9LJHB1e857QYDZg3xTHD` and Fly machine `48e0633a010238`, version 14; this is not proof that the later guard/proof edits are deployed.

## Current transaction evidence

All transactions are Somnia Shannon testnet. Failed transactions remain in the record.

| Scenario | Transaction | Result |
| --- | --- | --- |
| Moonshot collateral approval | [0xd392633c569b6488b53b9d221d632bde87162ea5283e84c0b8686b78ee5f803d](https://shannon-explorer.somnia.network/tx/0xd392633c569b6488b53b9d221d632bde87162ea5283e84c0b8686b78ee5f803d) | Confirmed |
| Moonshot BTC 1h, long 2x | [0xefc7fe4c652ea288230f01485706cbc72e725bf2520e25d87e96c58a0fa1c8ef](https://shannon-explorer.somnia.network/tx/0xefc7fe4c652ea288230f01485706cbc72e725bf2520e25d87e96c58a0fa1c8ef) | Confirmed; actual stake 1.000354 tUSDC, round 3 |
| Momentum publication, first attempt | [0x00dd839e37a0a4eeae44810c52950422cf936e9048f75b7bca25abd888bbe222](https://shannon-explorer.somnia.network/tx/0x00dd839e37a0a4eeae44810c52950422cf936e9048f75b7bca25abd888bbe222) | Reverted out of gas; draft and failed receipt preserved in builder |
| Shannon Momentum publication after gas fix | [0x11c193f9547e1a52e370cebe0edb6396104636af26197c5ba9727215005a2d9f](https://shannon-explorer.somnia.network/tx/0x11c193f9547e1a52e370cebe0edb6396104636af26197c5ba9727215005a2d9f) | Confirmed; stable name and explicit funding/permission next steps visible |
| Momentum bounded grant | [0x96250651c1706a9de51d4aa5ec29b34e6e6414be4069ef6ae243bbbc84f1f9a0](https://shannon-explorer.somnia.network/tx/0x96250651c1706a9de51d4aa5ec29b34e6e6414be4069ef6ae243bbbc84f1f9a0) | Confirmed; 2 tUSDC total, 1 per trade, one open position |
| Momentum subscription consent | [0xa2f6547b0e6631aee769650dc5920a694105b777d562a90cd0bd11b06aa6f202](https://shannon-explorer.somnia.network/tx/0xa2f6547b0e6631aee769650dc5920a694105b777d562a90cd0bd11b06aa6f202) | Confirmed; zero subscription fee |
| Momentum ETH 4h UP fill | [0xba9edb3f18ba00addc319bb03e038d4b045532c75636232c99db912b95cd8298](https://shannon-explorer.somnia.network/tx/0xba9edb3f18ba00addc319bb03e038d4b045532c75636232c99db912b95cd8298) | Confirmed, 0.928284 tUSDC spent; signal invalidated by scale defect, settlement pending |
| Pause Momentum grant | [0xa195ce4dccc44b2d2e491df23486a9fb182d464111d832100101f41371624db0](https://shannon-explorer.somnia.network/tx/0xa195ce4dccc44b2d2e491df23486a9fb182d464111d832100101f41371624db0) | Confirmed; future delegated entries stopped |
| Pause Momentum consent | [0x164846cf8ebad2ab0cd4fb0c2ae1b88a70af4712610edeef54c5657052746220](https://shannon-explorer.somnia.network/tx/0x164846cf8ebad2ab0cd4fb0c2ae1b88a70af4712610edeef54c5657052746220) | Confirmed; UI displays Copying paused |
| Replenish market-maker testnet gas | [0x1ac6fdcfdea36c1f0226acb62514916b95f21a054a9650a7278ede82a91c75b8](https://shannon-explorer.somnia.network/tx/0x1ac6fdcfdea36c1f0226acb62514916b95f21a054a9650a7278ede82a91c75b8) | Confirmed; 2 Shannon STT |
| Moonshot winning settlement | [0x2411021930e8d592baff1192273cc4d9c9a18522ba1aea9bc4cf292a007e5320](https://shannon-explorer.somnia.network/tx/0x2411021930e8d592baff1192273cc4d9c9a18522ba1aea9bc4cf292a007e5320) | Round 3 won; closing print $79,922.31 |
| Moonshot claim | [0x5e99e6496c2a4ece6ba33226c8e5dacd5ddef0f8b3247b462d5f3484ace9ee7f](https://shannon-explorer.somnia.network/tx/0x5e99e6496c2a4ece6ba33226c8e5dacd5ddef0f8b3247b462d5f3484ace9ee7f) | Paid 2.000132 tUSDC to the demo owner |
| AI #2 publication | [0x7a18eff5353ac5ee423c0c331a56ec0a8b450acbae01cb07c4a79c6c743f4619](https://shannon-explorer.somnia.network/tx/0x7a18eff5353ac5ee423c0c331a56ec0a8b450acbae01cb07c4a79c6c743f4619) | Shannon Sensei published; zero fee |
| Momentum #3 publication | [0xfe88149040b8f0d57e37255aa62021f0a875feea2ab9f509fc6bdb0686694bf2](https://shannon-explorer.somnia.network/tx/0xfe88149040b8f0d57e37255aa62021f0a875feea2ab9f509fc6bdb0686694bf2) | Shannon 1bp Rehearsal published |
| #3 grant 7 | [0x823c983c02826a23c70cbd70aecdabaac9780f214839617346068bdadf9153c4](https://shannon-explorer.somnia.network/tx/0x823c983c02826a23c70cbd70aecdabaac9780f214839617346068bdadf9153c4) | 2 tUSDC budget; 1 per trade; 1 open; 85¢ cap |
| #3 consent | [0x4fa4d52d158bdda169d0fc073296bd5905fe904db0de57147cbfb0dd0c246419](https://shannon-explorer.somnia.network/tx/0x4fa4d52d158bdda169d0fc073296bd5905fe904db0de57147cbfb0dd0c246419) | Zero-fee subscription; no later fill observed |
| #3 permission revoked | [0x2800f90fe42c6c7a4037390d5ba2a507676cce3badd5d20201bb929c747ed51a](https://shannon-explorer.somnia.network/tx/0x2800f90fe42c6c7a4037390d5ba2a507676cce3badd5d20201bb929c747ed51a) | Full 2 tUSDC returned at 21:40 UTC |
| #3 consent paused | [0xcbe4b040aad4b4f36343812e8abc12c365f5504fc1c00081bd498126609ada55](https://shannon-explorer.somnia.network/tx/0xcbe4b040aad4b4f36343812e8abc12c365f5504fc1c00081bd498126609ada55) | Subscription removed |
| AI #2 grant 8 | [0x3e8b134b16596c09b97e57b96afd32fefb25e858eacc049abc75ba11a6da83a4](https://shannon-explorer.somnia.network/tx/0x3e8b134b16596c09b97e57b96afd32fefb25e858eacc049abc75ba11a6da83a4) | 2 tUSDC budget; 1 per trade; 2 per day; 1 open; 85¢ cap |
| AI #2 consent | [0x3aeb28e957e6e0fa3358f293a01ba765a64684b3f81a2faf5b3471d4b8702274](https://shannon-explorer.somnia.network/tx/0x3aeb28e957e6e0fa3358f293a01ba765a64684b3f81a2faf5b3471d4b8702274) | Zero-fee subscription confirmed at 21:41 UTC |
| X BTC 4h UP fill | [0x072a0259bd75c22697d960da29c513ff9a0d3b0f24ba5eefbe626810093fa26b](https://shannon-explorer.somnia.network/tx/0x072a0259bd75c22697d960da29c513ff9a0d3b0f24ba5eefbe626810093fa26b) | One matching execution; grant 4 spent 0.90852 tUSDC for 1.34 contracts |

X public evidence: [original command](https://x.com/masayume_app/status/2096704007112696288), [valid image receipt](https://x.com/masayume_app/status/2096704198461084030), and [spurious refusal](https://x.com/masayume_app/status/2096704320867541006). The original nine-post cleanup list excludes all three. The next delivery has no acknowledged post ID; no retry is authorized by uncertainty.

## Remaining product backlog

Paid Memory Market, Reversion, achievements, unrecorded game-profile statistics and broader performance work remain separately tracked. They are not silently reported as delivered by this release.
