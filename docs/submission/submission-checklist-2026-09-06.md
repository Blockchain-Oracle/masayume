# Event Contracts Hackathon submission checklist

Prepared **6 September 2026**. This is a preparation checklist, **not a submitted application**. The owner completes the actual DoraHacks submission. No form was filled, no submission button was pressed, and no repository visibility was changed by this task.

## Official requirements and what is still unknown

The event's [official DoraHacks page](https://dorahacks.io/hackathon/event-contracts/detail) lists a **working testnet prototype**, a **GitHub repository** and a **2–3 minute demo video**. A presentation deck and SDK/documentation feedback report are optional. The release coordinator checked that public page in the browser on 6 September; the [earlier organizer brief retained in this repository](../../context/00-hackathon-brief.md) provides historical corroboration.

The public deadline date is **8 September 2026**. The coordinator observed an initial **18:00** server-rendered value and a hydrated **2026/09/08 19:00** value in the Lagos browser. **The authoritative timezone and exact cutoff are not yet confirmed.** Do not convert either observation into a promised local deadline or countdown until the event explicitly identifies its timezone.

The submission flow currently requires login. The authenticated form's exact fields, character limits, required attachments, video-host restrictions, consent wording and confirmation flow have **not** been inspected. Public requirements are not a field-by-field reconstruction of that form. Do not invent a category, required social link, minimum team size, deck requirement, SDK-feedback requirement, license field or submission-id value.

This worker's independent text-only fetch of the official event page returned an access/error page and no event text. A search result from a third-party aggregator incorrectly presented SDK feedback as required; it is excluded. The checklist relies on the coordinator's current official-page inspection, not that aggregator. Preserve the official public-page capture when available, then recheck inside the actual owner session before submission.

## Required package

| Requirement | Current state | Concrete completion check |
| --- | --- | --- |
| Working prototype on testnet | App is at [masayume.app](https://masayume.app). Current rehearsal includes confirmed strategy #1 publication/copy setup, Moonshot purchase and a recorded Candle Hop board entry. Autonomous Momentum fill/settlement, AI inference and the new X-media receipt still need their own evidence. | Open the final deployed app anonymously and with the authorized test wallet; record deployment SHA and prove the exact journey used in the video. Link the current [acceptance ledger](../implementation/acceptance-2026-09-06.md); do not replace partial acceptance with a blanket “everything works.” |
| GitHub repository | [Masayume app](https://github.com/Blockchain-Oracle/masayume) and [docs](https://github.com/Blockchain-Oracle/masayume-docs) were private in the [public-release audit](public-release-audit-2026-09-06.md). Code is present, but anonymous source access is a separate unfinished release step. | Complete the existing source-release/provenance decision, then verify the chosen repository access works for judges. If private judge access is supported by the actual process, record that route explicitly. The public page's “GitHub repository” wording alone does not establish a particular license or substitute for accessible source. |
| 2–3 minute demo video | [160-second script and runbook](demo-script-2026-09-06.md) prepared. No finished recording, rendered video or public video URL exists from this task. | Capture the verified journey, edit without fabricated continuity, measure final duration, inspect audio/captions, and open the real video link without the creator's account. Include the actual URL only after it exists. |

## Optional package

| Optional artifact | Current state | Completion check if included |
| --- | --- | --- |
| SDK and documentation feedback | [Draft prepared](sdk-feedback-2026-09-06.md), with code pointers and a clear distinction between upstream suggestions and Masayume integration defects. | Attach the final reviewed revision and any new live receipt evidence. Keep “optional” explicit. |
| Presentation deck | No deck produced by this task. | Include only if it helps explain product, implementation and adoption; do not delay the required video merely to manufacture a deck. |

## Claim and evidence check before recording

- [x] Strategy #1 publication receipt recorded: `0x11c193f9547e1a52e370cebe0edb6396104636af26197c5ba9727215005a2d9f`.
- [x] Copy permission receipt confirmed by the coordinator: `0x96250651c1706a9de51d4aa5ec29b34e6e6414be4069ef6ae243bbbc84f1f9a0`.
- [x] Registry subscription receipt confirmed by the coordinator: `0xa2f6547b0e6631aee769650dc5920a694105b777d562a90cd0bd11b06aa6f202`.
- [x] Moonshot purchase receipt recorded: `0xefc7fe4c652ea288230f01485706cbc72e725bf2520e25d87e96c58a0fa1c8ef`; recorded In play state is historical and not a payout.
- [x] Candle Hop best score 0/rank 2 confirmed in the recorded state and a separate board request; it is a server-checked arcade result.
- [ ] Fresh viewport captures of the publication, copy state and independent explorer receipts are usable at 1080p. Existing tall/full-page images are fallback evidence, not the final video shots.
- [ ] Final app and docs deployment revisions are identified. Source checks and deployed behavior are recorded separately.
- [ ] If shown: actual Momentum decision/fill/settlement evidence belongs to the same strategy, owner and Window.
- [ ] If shown: AI Test read or runner output is a real model response, with Hold retained as a valid result.
- [ ] If shown: X-media proof includes the original mention, saved sender, matching transaction and acknowledged reply containing the inspected card. A local PNG or healthy polling check is insufficient.
- [ ] Current source access is honestly described; no “open source” statement or anonymous GitHub screenshot until that access is verified.

Unneeded pending scenes can be omitted from the video. Their omission does not mark their product acceptance complete; the live ledger retains that remaining work.

## Owner-session submission runbook

1. Open the official event page and log in through the owner-controlled DoraHacks session.
2. Inspect the actual submission form. Record its required fields and limits exactly as shown, plus the explicit deadline timezone if available. Do not prefill invented field names from this checklist.
3. Prepare responses using the final project name, actual app/docs/repository links, truthful implementation description and finished video URL. Only map these into fields that the form actually presents.
4. Check every link as a judge would see it. Confirm source access and video playback outside the owner session. Ensure no link points to localhost, an ignored evidence path or an unpublished draft.
5. Preview the completed submission and compare each claim against its screen/receipt. Keep required testnet/GitHub/video artifacts distinct from optional deck/feedback.
6. The owner performs the final submission action. Save the confirmation page, submitted project URL/id, submission time with timezone and the final artifact revisions. Until that acknowledgement exists, status remains **prepared**, not **submitted**.

## Final status record to complete after submission

| Field | Value |
| --- | --- |
| Actual form inspected at | Pending |
| Confirmed deadline and timezone | Pending |
| Final app deployment/source revision | Pending final release verification |
| Judge-accessible repository URL and access check | Pending |
| Finished video URL and measured duration | Pending |
| Optional artifacts included | Pending owner selection |
| Submitted project URL/id | Not submitted |
| Submission acknowledgement time and timezone | Not submitted |

The checklist is current only to its recorded preparation and coordinator evidence. Reconcile it with the final [acceptance ledger](../implementation/acceptance-2026-09-06.md) after the ongoing live rehearsal.
