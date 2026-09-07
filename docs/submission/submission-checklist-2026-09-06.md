# Event Contracts Hackathon submission checklist

Updated **7 September 2026**. This current checklist supersedes its 6 September preparation snapshot; the earlier revision remains in Git. The owner completes the actual DoraHacks submission. A public-facts draft has been started in the owner's signed-in Zen session, but **no BUIDL has been submitted and no submission acknowledgement exists**.

## Deadline and official requirements

The [official event page](https://dorahacks.io/hackathon/event-contracts/detail), rechecked in authenticated Zen on 7 September, requires a **working testnet prototype**, **GitHub repository** and **2–3-minute demo video**. A presentation deck and SDK/documentation feedback report are optional.

Zen displays **8 September 2026, 19:00**. The previous independent browser clock check established UTC+1 / West Africa Time, making this **19:00 WAT / 18:00 UTC**. The event page itself does not print a timezone label; the UTC value is a conversion from its observed local rendering. Recheck the event page immediately before submission.

## Actual authenticated form

The signed-in owner is already registered for the event. **Submit BUIDL** opens a choice between a new BUIDL and an existing one. The new-BUIDL wizard has five steps: **Profile → Details → Team → Contact → Submission**. Opening this wizard is separate from the final submission action.

| Field | Exact visible requirement | Prepared value / evidence |
| --- | --- | --- |
| BUIDL name | Required | Masayume |
| BUIDL logo | Required; JPEG or PNG, less than 2 MB; 480 × 480 px recommended | Existing Masayume icon; owner advanced this step after native picker control failed |
| Vision | Required; no character counter shown in the inspected state | Public project summary entered in Zen |
| Category | Required | Crypto / Web3 selected; AI / Robotics is also offered |
| Crypto/Web3 subcategories and infrastructure | Optional; innovation domains, L1s, L2s, appchains and other ecosystems | Do not invent a required tag or unsupported deployment |
| GitHub/Gitlab/Bitbucket | Required; repository or organization profile accepted by the field label | https://github.com/Blockchain-Oracle/masayume — source access remains a release gate |
| Project website | Optional | https://masayume.app |
| Demo video | Required; YouTube recommended for an embedded player | https://masayume.app/demo — verify the deployed 2:46 player before submission |
| Social links | At least one required, up to three | https://x.com/masayume_app |
| Details | Required rich-text/Markdown description; links, tables, images and YouTube supported; no length counter shown in inspected state | [Prepared BUIDL description](buidl-description-2026-09-07.md) |
| Team / Contact / final Submission | Sections confirmed in the actual wizard; exact fields and final consent not yet read | Owner says the remaining flow is README and contact information. Preserve that distinction from independent inspection; do not invent contact values or accept terms. |

The Profile fields were entered using public project facts. The owner manually completed the logo step. The Details editor was visibly inspected in Zen; subsequent native clicks returned `noWindowsAvailable`. The owner then explicitly stopped further form work. No successful README paste, contact-field update, final agreement or submission is claimed; further authenticated inspection is no longer a task prerequisite. Raw form observations are retained locally under `.masayume/acceptance-2026-09-06/`; private account/contact details must not be committed.

## Required package

| Requirement | Current state | Completion check |
| --- | --- | --- |
| Working testnet prototype | [App](https://masayume.app); genuine AI execution/loss settlement, corrected Momentum fill/settlement/new-Window fill, X image receipt and complete Moonshot payout recorded | Final deployed revisions verified. Use the current [acceptance ledger](../implementation/acceptance-2026-09-06.md), including failed and superseded evidence. Momentum settled successfully at 04:00:13 UTC and filled a new BTC Window at 04:07:51; that last faucet-funded position remains open until 05:00 UTC. |
| Repository | App and docs repositories are private | Complete the [source-release review](public-release-audit-2026-09-06.md), record redistribution terms, then verify judge access. Do not describe inaccessible repositories as open source. |
| Demo | A measured 166-second / 2:46 video is publicly deployed with captions, poster and transcript | Verify the final `/demo` player, direct MP4, poster, captions and transcript anonymously. Public playback and exact uploaded bytes passed; technical audio checks passed, and auditory listening review remains useful. |

The demo retains a real AI Hold, authentic publication/copy screens, matching X receipt, paid Moonshot and arcade recording. It does not present the invalid pre-fix Momentum signal as acceptance or claim profitable AI performance.

## Optional package

- [SDK and documentation feedback](sdk-feedback-2026-09-06.md): prepared, with code pointers and a distinction between upstream suggestions and Masayume integration defects.
- Presentation deck: optional; no deck is required merely to complete this checklist.

## Final owner runbook

1. Complete the remaining draft fields in the existing Zen session using the [prepared description](buidl-description-2026-09-07.md) and the owner's actual contact details.
2. Check the final project name, app, docs, source and video links from an anonymous session. Review X's retained testnet demonstration and its transaction link.
3. Compare the preview against the acceptance ledger. Preserve testnet labeling, AI Hold/loss evidence, upstream availability limitations and documented backlog.
4. Review any final consent or agreement yourself. The owner performs the actual submission.
5. Save the submitted project URL/id, acknowledgement time with timezone and final artifact revisions. Until that acknowledgement exists, the status is **prepared**, not **submitted**.

## Release record

| Field | Value |
| --- | --- |
| Actual form inspected | 7 September 2026, authenticated Zen; Profile and Details verified |
| Displayed cutoff | 8 September 2026 19:00 in UTC+1 browser; 18:00 UTC by conversion |
| Final app deployment/source revision | `9bb7238` web; `c364fd7` operators; docs `7bfd240` pinned to `9bb7238` |
| Judge-accessible source | Pending redistribution terms and access verification |
| Video | [Public demo](https://masayume.app/demo), 166 seconds; playback, captions, transcript and exact uploaded bytes verified |
| X cleanup | Exact nine-post batch inventoried; action-time deletion confirmation pending |
| Submitted project URL/id | Not submitted |
| Submission acknowledgement | Not submitted |
