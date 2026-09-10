# Masayume: profile research and two-week promotion plan

Prepared **5 September 2026**. This is a research and publishing plan, not a record of posts sent or automations enabled. The banner direction has been approved by the owner. No account changes, purchases, scheduled jobs or runtime changes are part of this document.

The first two weeks should help people understand one feature and try it. Lead with Practice, the real controls recordings and clear documentation. Save claims about completed X trades or publicly launched agents for evidence that actually shows those outcomes.

## Profile handoff

During this session, the root agent viewed the owner profile at [@masayume_app](https://x.com/masayume_app) in Zen. **Edit profile** was visible; the header appeared blank gray, no bio was visible, the website was `masayume.app`, and the pinned 27 July post concerned Reclaim and disk usage. This is a reported live profile observation, not a review of the account's reply history. The Replies tab could not be inspected because native window control became unavailable.

The owner subsequently reported completing the X profile work. The original handoff is retained below as a reference; it is not an instruction to repeat those changes:

1. Apply the [approved Masayume banner](assets/x-profile-banner.png), review the crop and add the bio below. The approved source is 2172 × 724, exactly 3:1; keep that source and export 1500 × 500 if a platform-sized upload is needed.
2. Publish the reviewed Masayume introduction below and make it the pinned post.
3. Unpin the unrelated Reclaim post when the new introduction is ready. Keep the existing post and other account history; no deletion is proposed.

The [reply-card concept](assets/x-reply-filled-concept.png) is separate design work with a visible **DEMO** label. It is not evidence of a real filled trade. The implemented renderer has separate, deterministic receipt cards. Do not post it as a customer's execution receipt.

## Positioning and profile copy

Use this plain-language description:

> Masayume brings price markets, games and agents to Somnia. Its market routes use dreamDEX Event Contracts. Currently on Shannon testnet.

The official brand uses **dreamDEX**. Its own documentation describes a fully on-chain central limit order book powered by Somnia and welcomes third-party frontends and agent applications. Its Event Contracts product covers directional calls over fixed windows. This supports describing Masayume as an independent application using that infrastructure; it does not establish a partnership or endorsement. [dreamDEX introduction](https://app.dreamdex.io/docs), [official product page](https://www.dreamdex.io/).

The official site's X link points to [@DreamDEXSomnia](https://x.com/DreamDEXSomnia). Mention the account when a post explains a concrete integration and the attribution helps its readers. Do not import dreamDEX's mainnet volumes, USDso settlement, performance claims or zero-fee marketing into claims about Masayume's current testnet deployment. Masayume's configured network and test collateral are separate facts.

**Recommended bio now — 95 characters:**

```text
Price markets, games and trading agents. Powered by dreamDEX. Built on Somnia. Live on testnet.
```

Use `https://masayume.app` in the website field. The pinned introduction should link to `https://docs.masayume.app/start/quickstart`. Keep the bio focused on the product; put setup steps and feature limitations in the linked guide.

For a dedicated automated account, use a bio that identifies the automation, its human owner and the setup/stop controls **after the operating requirements below are resolved**. Do not call the current receipt formatter an AI assistant: it produces fixed receipt text. The app's configured handle can override the `@masayume_app` source fallback, so verify the real account before putting an executable mention in public copy. Evidence: [`web/src/features/share/copy.ts`](../../web/src/features/share/copy.ts), [`execute.ts`](../../services/ops/src/actors/x-relay/execute.ts).

### Verified X profile specifications

| Item | Current official guidance | Design implication |
| --- | --- | --- |
| Header | Recommended **1500 × 500 px** | Export a dedicated 3:1 raster banner. |
| Profile photo | Recommended **400 × 400 px**; maximum **2 MB** | Place the real mark centrally with enough room for the circular profile display. |
| Bio | Maximum **160 characters** | The proposed bio leaves room for a small revision. |
| Profile image formats | JPEG, GIF and PNG are listed | Use PNG or JPEG for the upload. The approved banner is a generated PNG; retain its raster master. |
| Header crop | X says about **60 px at the top and bottom could be cropped** | Keep essential wording away from those edges and inspect the actual crop. |

Sources: [customize a profile](https://help.x.com/articles/166743), [profile image upload guidance](https://help.x.com/en/managing-your-account/common-issues-when-uploading-profile-photo).

Design recommendation, not an official safe-area specification: keep the main text inside the central 380px of the header, leave the lower-left area quiet for the profile photo, and inspect both a phone and desktop preview. X does not provide an automatically switching light/dark `<picture>` header; choose one uploaded raster composition with its own readable background. Theme variants remain separate creative exports.

## Reply artwork and upload requirements

The implemented reply card uses a **1200 × 600 PNG** as our compact 2:1 working canvas, with legible status text and a small Masayume mark. That size is a design choice, not a platform requirement. Export comfortably below **5 MB**. X's current media guidance lists JPG, PNG, GIF and WEBP; a Post can carry up to four photos, one GIF or one video. SVG is not a listed upload format. [X media best practices](https://docs.x.com/x-api/media/quickstart/best-practices).

An uploaded image and a link preview are different mechanisms. A branded receipt card needs an actual media upload followed by a Post that references its media ID. The official API flow is:

1. Authenticate as the posting account using the approved app's user access credentials.
2. Upload the image using `POST /2/media/upload`, with `media_category: "tweet_image"`; retain the returned string ID and expiry.
3. Create the reply with `POST /2/tweets`, providing `reply.in_reply_to_tweet_id` and `media.media_ids` together with concise receipt text.
4. Check the Post-create result. A successful upload alone does not prove that a reply exists.

Sources: [upload media](https://docs.x.com/x-api/media/upload-media), [create a Post](https://docs.x.com/x-api/posts/create-or-edit-post), [posting quickstart](https://docs.x.com/x-api/posts/manage-tweets/quickstart).

Self-serve API replies currently require the original author to have explicitly summoned the account through an @mention or by quoting one of its posts. A generic keyword match is not that invitation. [Manage Posts](https://docs.x.com/x-api/posts/manage-tweets/introduction).

For videos, the v2 API uses dedicated **initialize → append → finalize → status** endpoints. Wait for processing when requested, then attach the media ID; do not reuse the older command-style INIT/APPEND protocol on the simple upload endpoint. [Chunked media upload](https://docs.x.com/x-api/media/quickstart/media-upload-chunked).

**The official video limits currently disagree across surfaces.** X Help lists non-Premium web uploads at 140 seconds/512 MB, while the API best-practices table lists default Post video at 20 minutes/8 GB. Do not assume either account entitlement without testing the actual upload path. Our 8–43 second recordings are far below both duration and size limits. Use H.264, 30 fps and a 1280 × 720 export for a conservative social version; retain the original recordings. [Web video help](https://help.x.com/en/using-x/x-videos), [API media guidance](https://docs.x.com/x-api/media/quickstart/best-practices).

Reply-card design should preserve the distinction between **submitted**, **filled**, **nothing filled**, **refused**, **reverted** and **unknown**. A filled trade is not a settled win. Display testnet and test-collateral units, use only recorded amounts, and include a real receipt destination only when one exists. Avoid public wallet-identifying detail beyond what the owner has chosen to disclose. Do not print a hypothetical payout as money already received.

**Implementation update:** the approved receipt release adds deterministic images, readable text, transaction links and a separate durable delivery queue. See [release evidence](receipt-release-2026-09-05.md). This source implementation and the visibly marked DEMO artwork are not proof of a live X trade or media reply.

## Automation rules and the current code gap

X's Automation Rules, updated April 2026, require expected, opted-in interactions and an easy opt-out. They limit automatic responses to one per interaction, prohibit unsolicited keyword-based replies and non-API website automation, and forbid automated likes. Following an account or completing OAuth is not blanket consent. Repetitive cross-account promotion is prohibited. Brands using auto-response campaigns must seek X approval; AI-generated reply bots require prior explicit written approval. [X Automation Rules](https://help.x.com/en/rules-and-policies/x-automation).

X also says automated accounts must display an automation label and connect to a human-run managing account. The help page still mentions test-group availability, so verify the account's actual controls and disclose its operator clearly. [Automated account labels](https://help.x.com/en/using-x/automated-account-labels).

The source still has a concrete transport gap:

- [`rettiwt.ts`](../../services/ops/src/actors/x-relay/rettiwt.ts) uses cookie-backed account sessions for mention reads and receipt posts. It is not the official media/Post API path described above.
- The existing posting switch disables replies, while the financial loop can still execute eligible mentions. Turning replies off is not the same as stopping trades.
- The new delivery queue permits one posting attempt per claimed mention and retains ambiguous outcomes for inspection. It does not add a per-author reply opt-out control.

The earlier source audit used application commit `5b1d6ff`; the receipt release updates its formatting and delivery findings, while the platform-policy gap remains. The code does not establish that X has approved this account's automation. Before campaigning around automated X execution, the operator should resolve transport, consent/opt-out, disclosure and applicable approval requirements, then verify a permitted end-to-end call. This marketing plan does not enable runtime automation.

Keep the two-week promotion work **human-written and manually reviewed**. Helpful public replies can answer a real question without enabling the trading relay. Do not advertise “tag us and a trade is guaranteed” or manufacture successful bot receipts for the campaign.

## What the campaign can prove today

The deployment targets **Somnia Shannon testnet, chain 50312**, using **tUSDC** for trading collateral and **STT** for gas. The docs explicitly distinguish implemented routes from configured, available services. Public Creator studio was captured as Coming soon; a successful public launch was not verified. The ticket recording shows a pending quote and no submitted order. [Availability](https://docs.masayume.app/help/availability), [first-trade guide](https://docs.masayume.app/trading/first-trade), [launch guide](https://docs.masayume.app/agents/launch).

| Existing recording | Verified local media | What it actually shows |
| --- | --- | --- |
| [Practice](https://docs.masayume.app/videos/practice.mp4) | 42.97s; H.264, 1920 × 1080, 30 fps; 2,624,648 bytes | Four calls, full 30-second live-feed wait, score compared with a random bot. No stake, position or payout. |
| [Ticket controls](https://docs.masayume.app/videos/ticket.mp4) | 20.93s; H.264, 1920 × 1080, 30 fps; 677,779 bytes | UP and amount, 2× warning, back to 1×, Range and Wide. Quote remains pending; no order submitted. |
| [Candle Hop](https://docs.masayume.app/videos/candle-hop.mp4) | 8.00s; H.264, 1920 × 1080, 30 fps; 902,817 bytes | Start, attempt, collision, zero-point result and Play again. No connected wallet or score submission. |

All three public media URLs returned HTTP 200 with `video/mp4` during this review. Dimensions/durations were checked with `ffprobe`; the descriptions match the docs walkthrough manifest. This research did not upload them to X or verify X transcoding. Keep the original dates and state captions when reusing them. **10 September update:** the owner supplied the [official YouTube demo](https://youtu.be/tJ__aXds1dE), embedded at [masayume.app/demo](https://masayume.app/demo); the three instructional clips above remain available separately.

## Two-week calendar: 7–20 September 2026

Four original posts each week. Dates are a proposed sequence, not scheduled jobs. Start with **12:30 WAT** for Monday/Friday and **18:30 WAT** for Wednesday/Sunday; these are manageable test slots, not claimed “best times.” If the owner begins later, shift the whole sequence. Attach the native clip where listed and use one main destination per post.

| Date | Post and purpose | Media | Main destination |
| --- | --- | --- | --- |
| Mon 7 Sep | Introduce Masayume and pin the starting point | Approved banner or app hero | `/start/quickstart` |
| Wed 9 Sep | Show a complete Practice round | Original 43s Practice clip | `/games/practice` |
| Fri 11 Sep | Explain ticket controls before confirmation | Original 21s ticket clip | `/trading/first-trade` |
| Sun 13 Sep | Explain what Masayume adds around dreamDEX | One readable overview map, linked to expansion | `/architecture/overview` |
| Mon 14 Sep | Invite a low-friction game attempt | Original 8s Candle Hop clip, including failure | `/games/candle-hop` |
| Wed 16 Sep | Explain the difference between sign-in and spending permission | A simple permission illustration, explicitly an explainer | `/trading/tap-trading` |
| Fri 18 Sep | Teach the agent lifecycle and its current public limits | Short text post; no staged launch screenshot | `/agents/launch` |
| Sun 20 Sep | Ask which guide still needs a clearer example | Docs homepage artwork | `/start/quickstart` |

On Tuesday, Thursday and Saturday, spend 15–20 minutes reading relevant Somnia builder or product discussions. Write up to three useful replies only when there is a concrete question you can answer. Respond to inbound questions on posting days as well. Use the saved time on quiet days to improve a confusing guide; do not fill a reply quota with generic praise or repeated links.

### Ready-to-edit original post copy

**1 · Introduction**

```text
Masayume brings price markets, games and agents to Somnia Shannon testnet. New here? Start with Practice, then learn the trading controls at your own pace. The guide has real screens and walkthroughs: https://docs.masayume.app/start/quickstart
```

**2 · Practice**

```text
Four calls. A 30-second live-feed round. Then the result. Practice lets you learn Masayume without connecting a wallet or staking funds. This is the full recorded round, including the wait: https://docs.masayume.app/games/practice
```

**3 · Ticket controls**

```text
Before you confirm a trade, know what the ticket changes. This real Masayume preview explores UP, 2x and Range. The quote stays pending; no order is sent. Shannon testnet walkthrough: https://docs.masayume.app/trading/first-trade
```

**4 · Architecture**

```text
dreamDEX supplies the Event Contracts. Masayume adds trading balances, bounded permissions, games and agent workflows around them. This map explains the boundaries of our Shannon testnet app: https://docs.masayume.app/architecture/overview
```

**5 · Candle Hop**

```text
This Candle Hop attempt: zero points. The retry button is doing its job. Tap or press Space to hop through the gaps; you can play without a wallet. Here's the real eight-second attempt: https://docs.masayume.app/games/candle-hop
```

**6 · Permission**

```text
Connecting a wallet and granting spending permission are different steps. Masayume's guide explains the budget, expiry and stop controls before you use tap-trading on Shannon testnet: https://docs.masayume.app/trading/tap-trading
```

**7 · Agents**

```text
A published strategy is not proof that an agent is running. Masayume's guide separates creation, funding, permissions and execution. Public creator access was marked Coming soon in our capture: https://docs.masayume.app/agents/launch
```

Refresh that final sentence if public access is later verified. Do not turn the post into an invitation to launch while the public gate remains closed.

**8 · Feedback**

```text
What still feels unclear in Masayume: Practice, trading balances, Range or agents? Pick one and tell us the step where you got stuck. The docs include real captures and short walkthroughs: https://docs.masayume.app/start/quickstart
```

If X-trade passes its operating checks during the fortnight, it may replace one educational post with a **new, real recorded run**. State the linked-wallet/grant prerequisites, show the actual receipt state and call it testnet. If those checks are unresolved, keep the permission post above. No launch date or future result needs to be promised.

### Helpful reply examples

Use these as context-dependent starting points, not repeated campaign messages:

- **“Do I need a wallet to try it?”** — “You can play Practice without one. It watches the live feed and scores your calls, without staking funds. Wallet-based trading is a separate testnet flow.” Add the Practice guide only if it would help.
- **“Does 2× just increase the payout?”** — “It changes the position's risk too: a boosted position can knock out before the Window ends. Our controls clip shows the warning; it doesn't place an order.”
- **“Is this mainnet?”** — “Masayume currently targets Somnia Shannon testnet, chain 50312, with tUSDC collateral. dreamDEX's own mainnet offering is separate.”
- **“Can I just mention the bot?”** — “The designed flow needs an X-to-wallet link and a funded executor grant. A mention is not a fill. Check the setup and current availability first.” While the transport gap remains unresolved, add that automated operation still needs review rather than encouraging a command.
- **Builder asking about architecture** — Answer the specific boundary first, such as who signs or where receipt history lives, then offer the matching diagram. Avoid dropping a whole product pitch into an unrelated thread.

## Short clip scripts and storyboards

The plan reuses real product footage. Add clear captions, a restrained detail zoom and one ending link. Keep failures, waits and pending states. A shorter excerpt must say that it is an excerpt; avoid editing separate states together to imply an execution that did not happen.

| Clip | Sequence and caption beats | End state and CTA |
| --- | --- | --- |
| **Practice, full round · 43s** | 0–1s: “Practice: no wallet or stake.” 1–9s: four UP/DOWN choices, zoom on the controls. 9–38.5s: retain the full live-feed wait. 38.5–43s: show the captured score. | “Compare your calls with a random bot. Try Practice.” Do not call the score profit or a payout. |
| **Ticket controls · 21s** | 0–5s: read Window, choose UP, enter the recorded amount. 5–12.5s: inspect 2× and its knockout warning. 12.5–17s: return to 1×, select Range. 17–21s: choose Wide. | Keep “Controls preview · quote pending · no order sent” visible. Link to the first-trade guide. |
| **Range excerpt · about 8s** | Use the original ticket clip from 12.5s to its end. Caption “Range controls excerpt.” Point to the lower and upper edges and the Wide choice. | “Read both band edges before trading.” Retain the pending-quote/no-submission context in the post. |
| **Candle Hop · 8s** | 0–1s: Play. 1–4.2s: tap/Space attempt. 4.2–8s: Run over, zero points, Play again. | “A real attempt. Try again.” No manufactured high score or scoreboard claim. |
| **Architecture explainer · 15–20s, new recording needed** | Open the docs map; select the wallet, checked order lane and venue nodes in sequence; expand the map once. Use plain labels for who authorizes and what executes. | “Explore the full map.” This is a documentation walkthrough, not a transaction demo. |

Recommended social exports: 1280 × 720 for the existing wide recordings, 30 fps, readable captions within the frame and one full-width UI detail at a time. Do not squeeze the whole desktop screen into a narrow phone crop. Keep a full original available in the guide. Captions can work silently; if narration is added, it should describe only the visible actions and result.

## Metrics and the review loop

No analytics capability or baseline is assumed. Where the account exposes X analytics, record impressions, profile visits, link clicks and available video completion measures at **24 hours and seven days**. If a field is unavailable, record “not available,” not zero. Where existing site analytics supports it, distinguish the campaign with `utm_source=x&utm_medium=organic&utm_campaign=masayume_learn_202609&utm_content=practice_full` or the corresponding post identifier. Do not add new tracking as part of this plan.

| Measure | How to read it | What to change |
| --- | --- | --- |
| Qualified questions | Count distinct people asking about a real step, permission or result | Turn repeated questions into a clearer guide or next post. |
| Guide visits / link clicks | Keep X-reported clicks and site-reported sessions separate | High views with few visits may need a clearer next step. |
| Practice attempts/completions | Use existing instrumentation only, or voluntary user reports labeled as such | Separate actual observed completion from clicks and impressions. |
| Video retention | Use the metric actually exposed by the account | Weak early retention suggests a faster opening; do not hide material waits or failed states. |
| Support outcome | Record issue, guide sent, and whether the user confirmed resolution | Repeated unresolved issues should pause that feature's promotion. |
| Follow-on interest | Count useful return questions or volunteered second attempts | Prefer demonstrated understanding to follower totals alone. |

Operational targets for this small test: publish the eight reviewed posts if the owner proceeds, hold two brief review sessions, and try to collect **five specific usability reports**. These are work targets, not predictions of reach or conversion. Never count test-trading volume, generated accounts or repeated self-visits as organic adoption.

On **13 September**, compare the first four posts and choose one change for week two: a clearer hook, larger control detail or a more specific guide destination. On **20 September**, record which feature produced the clearest user understanding and which step still blocks people. A two-week sample is directional evidence, not a statistically reliable growth forecast.

## Publication checklist

- Verify the linked guide, app status and exact deployment handle shortly before publishing.
- Keep Shannon testnet/test-collateral context visible when discussing trades or returns.
- Match every screenshot/clip caption to its real connected, signed-out, pending or failed state.
- Link official demo artwork to [masayume.app/demo](https://masayume.app/demo), where readers can watch the YouTube video.
- Use the approved banner as the profile asset after reviewing its actual crop; this plan does not upload it.
- Check draft copy against the current X composer. No posting, scheduling or bot activation has been performed by this research.
