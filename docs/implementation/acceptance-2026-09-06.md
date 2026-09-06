# Masayume acceptance ledger — 6 September 2026

This is the current implementation and rehearsal record. Earlier `RESUME.md`, parity-ledger and context entries remain historical evidence; their open lists are not the current status.

## Authorized outcome

Implement the focused agent workflow and reliability rebuild, dynamic X identity/hash receipts, private restore and status fixes; rehearse on Shannon faucet assets; clean the existing @masayume_app timeline and retain one new testnet demonstration; prepare public app/docs repositories and a submission package. Actual hackathon submission remains the owner's action.

Baseline: app `16b4b7b`, docs `ebdeddb`, both clean at implementation start. No contract redeployment is planned. One wallet can have one STRATEGY grant and a separate X EXECUTOR grant; Momentum and AI acceptance therefore run sequentially.

## Acceptance matrix

| Scenario | Status | Evidence / next gate |
| --- | --- | --- |
| Agent builder and copy lifecycle | Implementing | Approved four-step builder, durable identity, accurate operational states and interrupted-copy recovery |
| Runner decisions, attempts and settlement | Implementing | Durable reservation, reconciliation, required risk memory and permissionless settlement |
| X identity/hash cards and reliable delivery | Implementing | Dynamic sender/hash input, durable execution recovery, pagination and health |
| Private restore from empty browser | Passed locally | Empty-wallet Restore visible; invalid JSON refused, signed fixture restored, duplicate ignored, another owner's claim excluded from current owner's list; 390px light capture |
| Bounded status diagnostics | Passed locally | Three regression tests; named operation and elapsed time, total budget and in-flight deduplication; live status recovered |
| Market dependency readiness | Recovered, monitored | Fresh `/api/status` at approximately 19:52 UTC: healthy indexer 1769ms, three lanes/six live Windows, RPC block 481511932, prices and database available |
| Momentum publish/copy/fill/settlement | Published; copy acceptance next | Dynamic calldata gas estimate fixed the first failure. Shannon Momentum published with a stable identity, threshold 0.1%, 1 tUSDC per trade / 5 per day, zero subscription fee. No copy permission yet |
| AI real read/publish/copy/fill/settlement | Not run | Configured model is not live inference evidence |
| X live media receipt | Not run | Earlier basic X trade/text reply was proven; newly shipped media was not |
| X cleanup inventory and deletion | Inventoried; confirmation pending | Verified @masayume_app ID 1971264227093643264. Nine unique authored posts match profile count; Posts/Replies/Media and continuation pages checked. No reposts found. Exact batch saved in ignored `.masayume/acceptance-2026-09-06/x-cleanup-manifest.md`; action-time deletion confirmation requested |
| Responsive/theme and recovery QA | Pending implementation | Desktop, 320px and 390px; real UI controls and visible states |
| Arcade score and Moonshot | Score persisted; Moonshot awaiting close | Two real Candle Hop runs replayed and accepted; best score 0, rank 2 confirmed by a separate board request. New one-tUSDC Moonshot confirmed, payout two tUSDC if winning; closes 21:00 UTC |
| Public-release source/history review | In progress | Both repositories currently private; secrets and provenance checks precede visibility |
| Demo and submission package | Not run | 2–3-minute video, real Masayume receipts, README/demo link, SDK feedback and current form checks |

## Verification log

- Planning audit: 98 focused X tests, 30 focused strategy tests, 10 StrategyRegistry Foundry tests passed. Docs content check passed (52 guides). These are local checks, not live acceptance.
- Current app CI at the baseline succeeded: https://github.com/Blockchain-Oracle/masayume/actions/runs/33965661205.
- Implementation checks before live gas/fee fixes: all seven workspace typechecks; 14 invariants; 1,003 Vitest tests across 75 files; 226 contract tests across 24 suites passed. These are superseded by the final release gate when recorded below.
- Disposable PostgreSQL checks: 32 concurrent model reservations and 32 concurrent subscriber reservations each produce one owner; historical decisions survive repeated migration; interrupted calls become a durable hold; order and settlement attempts remain independent. X delivery/recovery PostgreSQL checks also passed (15).
- Independent review caught and corrected acceptance of `ok: true, stale: true` fallback data in trading preflight and risk reads. A stale reading must hold trading. Restart model-call budget must include pending/interrupted reads.
- Saved OpenAI credential passed a non-billed model authentication probe (HTTP 200, `gpt-5.4`). Local rehearsal uses `openai/gpt-5.4`; this is not yet successful model-decision evidence.
- Reliable connected browser QA established in Codex in-app browser using the existing demo wallet `0xd357019E2c55375477802A047dB7bC1A77819358`. The temporary local signer keeps the key outside the page and permits only Shannon and pinned Masayume/venue contracts. Zen native automation remains unreliable.
- Live configured actors verified distinct: strategy runner `0xfE22Db9A0EA0b9E6AeBA9F5A05Ac6aA564b8AA52`; X executor `0xFf3e12Ec3d555CF3b4B715586403AB4199Ad02E5`.
- Gas/fee release gate: 1,016 tests across 77 files, affected markets/ops/web typechecks and all 14 invariants passed. No contracts changed after the 226-test contract gate. Registry fee allowance now equals the reviewed fee so a concurrent fee increase cannot silently charge more.
- Disconnected builder: all four steps usable without a wallet; publication step offers Connect. Connected the existing demo account there without losing its name, portrait or rule settings. Desktop 1280px dark screenshot saved.
- Responsive checks found the account control clipped at 320px; narrow header now uses its labeled avatar button. Arcade personal-best wording corrected to show actual rank. Both fixes await the built-revision UI recheck.

## Current transaction evidence

All transactions are Somnia Shannon testnet. Failed transactions remain in the record.

| Scenario | Transaction | Result |
| --- | --- | --- |
| Moonshot collateral approval | `0xd392633c569b6488b53b9d221d632bde87162ea5283e84c0b8686b78ee5f803d` | Confirmed |
| Moonshot BTC 1h, long 2x, stake 1 tUSDC | `0xefc7fe4c652ea288230f01485706cbc72e725bf2520e25d87e96c58a0fa1c8ef` | Confirmed; round visible as In play |
| Momentum publication, first attempt | `0x00dd839e37a0a4eeae44810c52950422cf936e9048f75b7bca25abd888bbe222` | Reverted out of gas; draft and failed receipt preserved in builder |
| Shannon Momentum publication after gas fix | `0x11c193f9547e1a52e370cebe0edb6396104636af26197c5ba9727215005a2d9f` | Confirmed; stable name and explicit funding/permission next steps visible |

## Remaining product backlog

Paid Memory Market, Reversion, achievements, unrecorded game-profile statistics and broader performance work remain separately tracked. They are not silently reported as delivered by this release.
