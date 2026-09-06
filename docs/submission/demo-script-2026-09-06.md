# Masayume: Demo Video Script

Prepared 6 September 2026 using the `direct-demo-video` style constitution and delivery template. **Script and capture plan only: no new capture, transaction, video render, upload or publication was performed by this task.** Target source revision: `e3c298e`; reconcile any subsequent release changes before recording. Current acceptance authority is [the live ledger](../implementation/acceptance-2026-09-06.md), supplemented by the coordinator's confirmed copy transactions below.

## Cut Summary

- Audience: Somnia × DreamDEX Event Contracts Hackathon judges and builders.
- Target runtime: **02:40 / 160 seconds**, within the required 2–3 minutes.
- Spoken-word target: approximately 400–430 words, with deliberate silent proof holds.
- Viewer: a judge assessing whether Event Contracts became a usable product.
- Pain: making a price call means understanding market timing, limits, wallet permission and what actually happened afterward.
- One-line promise: Masayume makes that progression visible in one place: build the idea, bound its permission, inspect the receipt.
- Hero proof: **Shannon Momentum, strategy #1**, moves from the four-step builder to confirmed registry publication, then independently confirmed Vault permission and registry subscription. **A trade fill is not yet part of this proof.**
- Closing tagline: **Make your call. See it through.**
- Proof environment: Somnia Shannon testnet, chain 50312, tUSDC test collateral and STT gas. Existing authorized rehearsal evidence is reused. The current source is committed; actual hosting revision must be recorded before the final cut.

## Project Truth

### Verified now

- The creator flow exposes Identity & approach, Behavior & limits, Test read and Publish. Draft identity persists through review and publication. Source: [CreatorStudio](../../web/src/features/strategies/CreatorStudio.tsx), [StudioForm](../../web/src/features/strategies/StudioForm.tsx); current browser evidence in the acceptance ledger.
- **Shannon Momentum #1 published successfully** with threshold **0.1%**, creator cap **1 tUSDC per trade / 5 per day**, and **zero subscription fee**. Publication: [Shannon receipt](https://shannon-explorer.somnia.network/tx/0x11c193f9547e1a52e370cebe0edb6396104636af26197c5ba9727215005a2d9f). This establishes publication, not an order or profit.
- The coordinator confirmed both copy-setup transactions for #1: [Vault permission](https://shannon-explorer.somnia.network/tx/0x96250651c1706a9de51d4aa5ec29b34e6e6414be4069ef6ae243bbbc84f1f9a0) and [registry subscription](https://shannon-explorer.somnia.network/tx/0xa2f6547b0e6631aee769650dc5920a694105b777d562a90cd0bd11b06aa6f202). Capture the current drawer to establish its displayed budget and active state; do not infer the follower's budget from the creator's daily cap.
- A **1 tUSDC Moonshot purchase** was confirmed: [Shannon receipt](https://shannon-explorer.somnia.network/tx/0xefc7fe4c652ea288230f01485706cbc72e725bf2520e25d87e96c58a0fa1c8ef). The recorded BTC 1h/long 2x round was **In play**, with a **2 tUSDC payout only if winning**, and scheduled close **21:00 UTC on 6 September**. That capture is historical; do not say the round is currently in play after its close without a fresh read. No payout is proven here.
- Candle Hop accepted two real runs. The captured best score is **0**, rank **2**, and a separate board request confirmed it. It is a server-checked arcade score, **not an on-chain win or payout**.
- Local reliability checks cover durable decision/execution reservations, stale-input refusal, exact execution recovery and reply ambiguity. The acceptance ledger records the actual test gates; these do not prove live model inference, a Momentum fill or X media delivery.

### Implemented but not yet verified

- Momentum's autonomous fill and settlement after copy setup: **pending coordinator evidence**.
- AI Test read and AI runner decision/fill/settlement: **pending actual provider result and corresponding receipt where applicable**. Credentials and model configuration are not inference evidence.
- X's newly shipped dynamic sender/full-hash image and public media reply: **locally tested, live media acceptance pending**. Earlier X text/trade success does not prove the new media path.
- Unknown execution recovery and paused settlement have focused local tests; a staged live failure/restart acceptance is separate.

### Roadmap only

- Paid Memory Market, selectable Reversion, achievements and broader game-profile statistics remain outside this cut. Do not turn their UI placeholders into delivered feature claims.
- The close asks viewers to try and inspect the current testnet app. It does not promise a launch date, mainnet funds, returns or future release scope.

## Claim-to-Screen Ledger

| Claim | Status | Evidence | Exact screen or action | Script treatment |
| --- | --- | --- | --- | --- |
| Masayume brings price markets, games and agents into one app | verified local and live entry surfaces | README; acceptance ledger; app routes | `/markets`, then `/strategies` | Speak; promise appears immediately. |
| Momentum compares fresh EMA against each Window opening print | verified local | `services/ops/src/actors/strategy-runner/decide.ts`; `StudioForm.tsx` | Builder Behavior & limits; Rule preview | Speak about the configured rule, not an executed order. |
| Strategy #1 is published with the shown identity and limits | verified live, coordinator receipt | Publication hash above; captured Published on Somnia screen | `/strategies` → Your strategies → Shannon Momentum; matching explorer receipt | Speak in past tense over the recorded rehearsal; never republish solely for this shot. |
| Publication and copy permission are distinct actions | verified live + source | Publication, permission and subscription hashes; `useDeskWrites.ts` | Publication next steps → copy drawer → two independent receipts | Speak; keep all three hashes distinct. |
| The follower's copy is currently active | transactions verified live; fresh UI capture pending | Confirmed permission/subscription; current drawer and grant/consent read required | Copy drawer current state | Narration only calls the two transactions confirmed; use the active-state label only if fresh capture confirms it. |
| Momentum has filled or made a profit | implemented-unverified | Observer acceptance pending | Actual decision → fill receipt → position/settlement | Omit from baseline cut; reserved replacement scene below. |
| AI produced a real answer | implemented-unverified | Actual Test read response pending | AI Test read panel with verdict/reason | Omit until captured; credentials alone are not a shot. |
| Moonshot purchase was accepted | verified live, coordinator receipt | Purchase hash above; recorded Your rounds / In play | `/games/moonshot` → Your rounds → purchase explorer | Speak in past tense; no outcome/payout claim. |
| Candle Hop score reached the board | verified live | Captured 0/rank 2 and independent board read | `/games/candle-hop` → Top runs | Brief caption “Recorded score: 0 · rank 2”; do not call it a win. |
| X renders a dynamic receipt image for each sender/hash | verified local; public media unverified | `reply-card.ts`, `reply-format.ts`, focused tests | Local DEMO card pair or later real post | Omit from baseline narration; only a labelled local preview if replacing the breadth shot. |
| DreamDEX SDK is used for discovery, reads, quote sizing and trading | verified local | `packages/markets/src/runtime/read-runtime.ts`, `provider/quotes.ts`, `sessions/submitter-session.ts` | `/architecture/overview` on docs, then relevant source | Speak as implementation evidence. |
| GitHub source is anonymously accessible | unverified / currently private in release audit | `public-release-audit-2026-09-06.md` | Anonymous repository page after release | Do not say “open source”; closing CTA uses app and docs. |

## Final Timeline Script

This is the complete **baseline narration** that is supportable now. It deliberately keeps the hero at confirmed publication and copy setup. The capture operator must use existing authorized action footage or clearly labelled recorded evidence; if the original signature footage is unavailable, show the existing receipt and say “published” rather than staging a new signature.

| Time | Spoken script | Screen and demo direction | Proof or capture note |
| --- | --- | --- | --- |
| 00:00–00:08 | Howdy, Somnia and DreamDEX. I'm Blockchain Oracle, and this is Masayume. Make your call. See it through. | One-second official event flash; hard cut to app hero with name visible by second three. Face camera lower right. | Keep testnet badge readable. No logo animation. |
| 00:08–00:20 | A price call starts with a simple idea. Then you need a market, clear limits, wallet permission, and a way to check what happened. Masayume brings that journey together. Let’s build one and follow its receipts. | Three fast app-native shots: Window ticket, permission review, receipt. Land on Strategies; do not use unrelated competing apps. | These are different stages, not a fabricated one-click trade. |
| 00:20–00:35 | Let's open Strategies. Here's Shannon Momentum, the strategy I published on Somnia testnet. I'll show you the rule, the limits, and the transactions behind its setup, so you can check the same evidence yourself. The name and portrait stay consistent across these screens. | Read-only action: Your strategies → Shannon Momentum. Hold name/portrait, then prepare the four-step builder recording. | First real app action at 00:20. Existing strategy #1, no new publication. |
| 00:35–00:52 | The builder takes four steps. Give it a name, choose its approach, set the behavior and limits, then review publication. For this strategy, Momentum compares the current EMA with each Window's opening price. You can change the portrait before you publish. | Recorded builder walkthrough: Identity & approach → Behavior & limits. Show actual threshold 0.1%, per-trade 1, daily 5. | On-screen label “Recorded setup · Shannon testnet” when using historical footage. |
| 00:52–01:10 | I chose a zero-point-one percent threshold, one test dollar per trade, and five per day. The preview makes the rule readable: enough movement can call Up or Down; a smaller move holds. This preview doesn't place an order. Followers can set their own tighter limits. | Test read panel for Momentum: Rule preview · no live market read. Move cursor across Up/Down/Hold once, then Publish review. | Preserve “tUSDC” label. This is a deterministic rule preview, not an AI answer or live signal. |
| 01:10–01:27 | Here is the published strategy, with the same name and portrait. Let's confirm it. This is the matching Somnia transaction. Publication records the strategy; funding a copy and granting permission happen separately. The subscription fee here is zero. | Published on Somnia → View publication transaction → explorer success/details. Small inset of strategy name. | Hold full publication receipt at least five seconds; hash must end `5005a2d9f`. Do not use the earlier reverted attempt as success footage. |
| 01:27–01:50 | Now look at the copy setup. You can review the budget, individual limit, current fee, and the extra deposit before signing. This rehearsal confirmed both steps: the Vault permission and the registry subscription. Those are the two receipts here. A funded copy still needs a qualifying signal and a confirmed fill. This keeps the next step clear. | Current copy drawer → permission receipt → subscription receipt → back to drawer's actual state. Hide face camera during receipt identifiers. | Capture fresh grant/consent state. Receipt endings `84f1f9a0` and `6aa6f202`. No autonomous-trade claim. |
| 01:50–02:04 | The same app has other ways to make a call. This one-test-dollar Moonshot purchase was accepted, and here is its transaction. The recorded round was in play; its final result and any payout are separate. You can open that evidence from the app. | Moonshot recorded Your rounds card → purchase explorer. Use a labelled recorded capture if the round has closed. | Receipt ending `a1c8ef`. Never display potential 2 tUSDC as a received payout. |
| 02:04–02:12 | And here's Candle Hop: a real run, a recorded score, and the board that confirms it. | One eight-second breadth beat: gameplay excerpt → score 0 / rank 2 / Top runs. | Caption “Arcade score · server-checked · not on-chain.” Existing screenshot is fallback, not simulated gameplay. |
| 02:12–02:28 | Underneath, DreamDEX provides Event Contracts and the market SDK. Masayume adds the product screens, bounded Vault permissions, and a runner that records its work. The docs show these boundaries, and the receipts let you inspect the chain independently. The source also includes restart and stale-data regression tests. | One architecture map → brief source view of SDK quote adapter and EventVault boundary → docs. | Source is implementation evidence. Keep claims inside inspected code; avoid unreadable terminal logs or invented metrics. |
| 02:28–02:40 | That's Masayume on Somnia testnet. Open the app, explore the docs, and follow the receipts. I'm Blockchain Oracle. Make your call. See it through. | Return to app hero with `masayume.app` and `docs.masayume.app`. Slight face-camera punch-in, then hold closing frame. | No GitHub/open-source CTA until anonymous source access is confirmed. No “submitted” badge before actual submission. |

## Capture Runbook

### Preflight

- Canvas and recording resolution: 16:9, capture at 1920×1080 or higher; export 1920×1080. Use viewport recordings, not full-page screenshot scroll composites.
- Browser zoom: choose one zoom that makes 14–16px UI legible after framing; prefer 100%. Do not resize mid-receipt.
- Face-camera position: lower right, roughly 20% width, move/shrink for proof or lower-right controls. Use the established violet matte around Masayume's own orange/cream/dark design.
- Caption safe area: lower-center band, above app action bars. Maximum two short lines. Keep hashes, receipt status, amounts and permission text uncovered.
- Accounts or fixtures: existing authorized demo owner and actual strategy #1. Use the current browser session controlled by the coordinator. The script worker does not operate that browser or any signer.
- Secrets and personal data to hide: notifications, cookies, key/provider tools, localhost bridge internals, wallet recovery screens and private claims. Public transaction hashes and the approved demo address are evidence.
- Network or environment: display Somnia Shannon / chain 50312 and test collateral once early. Record app origin, deployed source revision, capture time in UTC and raw file name in the shot manifest.
- Notifications disabled: before recording; close unrelated tabs and developer overlays without changing product state.
- Source/receipt checks: verify each full hash against the saved manifest before editing. Do not choose an explorer page by a visually similar ending alone.
- Current-state checks: Moonshot was scheduled to close at 21:00 UTC; refresh before narrating any present-tense state. Retain original capture time if showing In play afterward.
- Capture quality: existing full-page images establish states but are too tall and unevenly framed for the main video. Request clean viewport-only replacements. Do not stretch screenshots to hide that problem.

### Tab order

1. Official event: `https://dorahacks.io/hackathon/event-contracts/detail`.
2. App hero/markets: `https://masayume.app/markets`.
3. Strategies: `https://masayume.app/strategies`, with Your strategies → Shannon Momentum ready.
4. Publication explorer using the full hash in Project Truth.
5. Permission explorer and subscription explorer using their distinct full hashes.
6. Moonshot and its purchase explorer.
7. Candle Hop with the accepted run/Top runs evidence.
8. `https://docs.masayume.app/architecture/overview`; inspected source checkout or accessible committed source.
9. App hero for closing. Do not route through the X profile in the baseline cut while its cleanup/media proof remains pending.

### Exact demo inputs

| Step | Input or click | Expected result | Fallback evidence | Safety boundary |
| --- | --- | --- | --- | --- |
| Establish context | Strategies → Your strategies → Shannon Momentum | Existing #1, stable name/portrait and current state | Saved publication capture below | Read-only; never create a duplicate to restore the publication screen. |
| Show configured rule | Existing recorded builder inputs: name Shannon Momentum; Momentum; threshold 0.1%; 1 per trade; 5 per day; fee 0 | Rule preview and limits match published metadata | Read current strategy metadata plus a labelled UI walkthrough | Inputs may be entered into an unsent preview. Do not label an unsent preview as original footage or sign it for a retake. |
| Verify publication | View publication transaction / open full receipt URL | Confirmed publication to the configured StrategyRegistry | Original receipt capture after fresh public read | Never reuse the first out-of-gas failure as a success screen. |
| Review copy | Open copy drawer; point to actual budget, cap, fee and state | Current grant and consent establish exact state | The two confirmed public receipts | No new grant, deposit, pause, withdrawal or subscription for filming. Owner-authorized live acceptance remains a separate coordinator operation. |
| Verify copy transactions | Open permission, then subscription receipt | Two distinct confirmed actions | Saved explorer captures with full hashes | If grant/consent no longer active, narrate historical setup and show that current state honestly. |
| Show Moonshot | Your rounds → existing BTC round; open purchase receipt | Existing accepted purchase and freshly read status | Recorded In play image labelled with capture date | Do not buy another ticket or assert winnings without settlement evidence. |
| Show Candle Hop | Existing accepted run/Top runs | Score 0, rank 2 in recorded evidence | Board screenshot below | No on-chain or payout claim; rank is time-dependent, so label historic evidence if it changes. |
| Explain integration | Docs architecture → source quote adapter | DreamDEX reads/quotes, separate Masayume permission boundary | Committed source at reviewed revision | No local server keys, logs with credentials or private-repository access assumptions. |

Existing evidence files, kept ignored and separate from a public video package:

- `.masayume/acceptance-2026-09-06/captures/momentum-published-1280-dark.png`
- `.masayume/acceptance-2026-09-06/captures/momentum-copy-1280-dark.png` — recheck whether this precedes the newly confirmed copy transactions.
- `.masayume/acceptance-2026-09-06/captures/moonshot-open-390-light.png`
- `.masayume/acceptance-2026-09-06/captures/candle-hop-posted-390-light.png`
- `.masayume/acceptance-2026-09-06/captures/builder-disconnected-publish-1280-dark.png`

These are existing state captures, not a completed recording. The script does not invent a filename for original signature footage that has not been located.

### Pending replacement scenes: evidence required before use

These are editor placeholders, **not narration claims**. Keep the 160-second baseline until one is supported, then replace a same-duration beat rather than extending past three minutes.

| Placeholder | Candidate slot | Required evidence before a replacement script is approved | Baseline if missing |
| --- | --- | --- | --- |
| P1 — Momentum autonomous fill | Replace part of 01:27–01:50, maximum 23 seconds | Same strategy/subscriber/Window; recorded runner decision; valid matching fill receipt; actual cost/quantity; owner position. Settlement needs a separate result and payout record. | Confirmed copy setup only. |
| P2 — AI real read | Replace 00:52–01:10, maximum 18 seconds | Actual Test read input and response, model identity, real verdict/reason and gate status. A Hold is valid. If the hero changes from Momentum to AI, capture its own identity and publication; do not splice AI output into Shannon Momentum. | Momentum rule preview, no AI claim. |
| P3 — X dynamic media receipt | Replace 01:50–02:12, maximum 22 seconds | Original supported mention, sender identity, persisted receipt, matching transaction and acknowledged reply id with media; inspect sender/hash/spend in both card and clickable text. | Moonshot and Candle Hop. |

No pending scene may be promoted by a renderer test, local DEMO card, configured API key, healthy poll, or transaction receipt from a different operation.

### Retake triggers

- Wrong wallet, chain, strategy, receipt hash or operation pairing.
- Stale/disconnected status represented as a current active copy.
- Current Moonshot result unknown but narration/caption says “won,” “paid,” or “still in play.”
- A user identity, cookie, signing bridge or private recovery material becomes visible.
- Full-page capture leaves critical labels unreadable, duplicate layout regions appear, or a face camera/caption hides the evidence.
- The wallet rejects, transaction reverts, provider fails or state is unknown: retain that evidence, stop the affected action shot, and use the supported baseline. Editing must not fabricate the missing success.

## Edit Map

- Opening montage: event 1 second → name/hero → three app-native detail cuts. Product visible by 00:03. Use hard cuts rather than stock footage.
- Hard-cut points: 00:08, 00:20, 00:35, 00:52, 01:10, 01:27, 01:50, 02:04, 02:12, 02:28. Preserve the sequence of publication, permission and subscription.
- Waits to remove: navigation loading, repeated typing, wallet/RPC waits and duplicate clicks. Keep an explicit “Recorded setup” label when compressing an earlier authorized rehearsal; do not imply it is being submitted in the voiceover take.
- Proof frames to hold: publication at least 5 seconds; each copy receipt at least 4 seconds; Moonshot purchase at least 4 seconds; Candle Hop score/board at least 3 seconds. Keep a full-hash reference in the shot manifest even when the visible URL is shortened by the browser.
- Full-face punch-ins: optional one-second opening and closing emphasis only; no punch-in across receipt proof.
- Caption treatment: transcribe the complete spoken script, correct Masayume/Somnia/DreamDEX/EMA/tUSDC, and use compact high-contrast captions. Additional factual labels: testnet, recorded setup, no live market read, and arcade score. Do not caption pending outcomes as achievements.
- Music or deliberate silence: restrained licensed background at low level; reduce under receipts. No dramatic success sound for a merely submitted or unknown transaction.
- Closing frame: app hero plus app/docs URLs for the final 3 seconds; no unpublished YouTube link or submission-complete badge.

## Timing Check

The count below is calculated from only the Spoken script column, excluding directions, labels and pending scene descriptions. Recalculate after any narration edit.

- Spoken words: **407**.
- Estimated active narration pace: **170–185 words/minute**.
- Estimated active narration runtime: **132.0–143.6 seconds**.
- Proof holds and visual breathing room: **16.4–28.0 seconds within the 160-second cut**.
- Locked editorial runtime: **160 seconds / 02:40**. The eleven segments form one continuous 00:00–02:40 timeline with no gaps.
- First product-name timestamp: approximately **00:04**, no later than 00:08.
- First real action timestamp: **00:20**, opening the existing strategy.
- Hero-proof timestamp: publication proof **01:10–01:27**, copy permission/subscription proof **01:27–01:50**.
- Action and proof allocation: **112 seconds** from 00:20–02:12, with the eight-second arcade montage included; the main strategy walkthrough alone runs 90 seconds.
- Export gate: verify the actual media duration with `ffprobe` after rendering; spoken-word estimates do not prove final file duration. Rendering is outside this task.
