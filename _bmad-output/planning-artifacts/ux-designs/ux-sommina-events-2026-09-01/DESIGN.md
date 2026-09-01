---
name: Masayume
description: Dark, mobile-first consumer prediction-market app on DreamDEX Event Contracts — Japanese editorial precision, one gold accent, honest states as law.
status: final
created: 2026-09-01
updated: 2026-09-01
colors:
  ground: '#0B0A08'
  surface-1: '#141210'
  surface-2: '#1C1915'
  surface-3: '#262119'
  hairline: '#2E2921'
  border-strong: '#3D362B'
  ink: '#F0EAE0'
  ink-secondary: '#A79E8D'
  ink-muted: '#6E6759'
  ink-disabled: '#48423A'
  gold: '#E8B54A'
  gold-hover: '#F2C666'
  gold-pressed: '#C79734'
  gold-dim: '#6E5A28'
  gold-wash: '#241D0E'
  profit: '#3ECF8E'
  profit-wash: '#0F241B'
  loss: '#F26D85'
  loss-wash: '#2A141B'
  warning: '#F2994A'
  info: '#5CA9FF'
  cream: '#F4EBD9'
  cream-ink: '#1C1710'
  cream-hairline: '#D9CBB0'
  scrim: '#040302B8'
typography:
  display:
    fontFamily: Archivo
    fontSize: 40px
    fontWeight: '750'
    lineHeight: '1.04'
    letterSpacing: '-0.03em'
  headline:
    fontFamily: Archivo
    fontSize: 26px
    fontWeight: '700'
    lineHeight: '1.15'
    letterSpacing: '-0.02em'
  title:
    fontFamily: Archivo
    fontSize: 18px
    fontWeight: '650'
    lineHeight: '1.3'
  body:
    fontFamily: Instrument Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.55'
  body-strong:
    fontFamily: Instrument Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1.55'
  caption:
    fontFamily: Instrument Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.45'
  label-micro:
    fontFamily: IBM Plex Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: '0.16em'
  data:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.3'
  data-lg:
    fontFamily: IBM Plex Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.2'
  data-hero:
    fontFamily: IBM Plex Mono
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.05'
    letterSpacing: '-0.01em'
  stamp:
    fontFamily: Noto Serif JP
    fontSize: 28px
    fontWeight: '800'
    lineHeight: '1.1'
  stamp-hero:
    fontFamily: Noto Serif JP
    fontSize: 64px
    fontWeight: '900'
    lineHeight: '1.0'
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 8px
  lg: 12px
  xl: 24px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  '10': 40px
  '12': 48px
  '16': 64px
  gutter: 16px
  gutter-desktop: 24px
  section: 64px
  section-desktop: 96px
  touch: 44px
components:
  ticket:
    surface: '{colors.surface-1}'
    border: '{colors.hairline}'
    radius: '{rounded.lg}'
    stake-type: '{typography.data-lg}'
    cta-height: 52px
  market-card:
    surface: '{colors.surface-1}'
    border: '{colors.hairline}'
    radius: '{rounded.lg}'
    odds-type: '{typography.data}'
  reel-card:
    radius: '{rounded.xl}'
    max-width: 460px
    surface: '{colors.surface-1}'
    live-hairline: '{colors.gold-dim}'
  balance-plate:
    surface: '{colors.surface-2}'
    hero-type: '{typography.data-hero}'
    radius: '{rounded.lg}'
  claim-plate:
    surface: '{colors.gold-wash}'
    border: '{colors.gold-dim}'
    amount-type: '{typography.data-lg}'
    radius: '{rounded.lg}'
  receipt:
    surface: '{colors.cream}'
    ink: '{colors.cream-ink}'
    hairline: '{colors.cream-hairline}'
    strip: '{colors.gold}'
    radius: '{rounded.md}'
  capability-receipt:
    surface: '{colors.surface-2}'
    border: '{colors.border-strong}'
    verb-type: '{typography.data}'
    radius: '{rounded.lg}'
  verdict-stamp:
    win-ink: '{colors.gold}'
    loss-ink: '{colors.ink-secondary}'
    void-ink: '{colors.ink-muted}'
    type: '{typography.stamp-hero}'
    rotation: '-4deg'
  button-primary:
    fill: '{colors.gold}'
    ink: '{colors.cream-ink}'
    hover: '{colors.gold-hover}'
    pressed: '{colors.gold-pressed}'
    radius: '{rounded.md}'
    height: 48px
  button-up:
    fill: '{colors.profit-wash}'
    ink: '{colors.profit}'
    border: '{colors.profit}'
  button-down:
    fill: '{colors.loss-wash}'
    ink: '{colors.loss}'
    border: '{colors.loss}'
  input:
    surface: '{colors.ground}'
    border: '{colors.hairline}'
    focus-ring: '{colors.gold}'
    radius: '{rounded.md}'
    height: 48px
  badge-backed-resting:
    border: '{colors.gold-dim}'
    ink: '{colors.gold}'
    fill: transparent
  badge-backed-filled:
    fill: '{colors.gold-wash}'
    ink: '{colors.gold}'
    border: '{colors.gold-dim}'
  badge-house:
    border: '{colors.border-strong}'
    ink: '{colors.ink-secondary}'
    fill: transparent
  countdown:
    type: '{typography.data}'
    ink: '{colors.ink}'
    urgent-ink: '{colors.gold}'
  banzuke-row:
    surface: '{colors.surface-1}'
    divider: '{colors.hairline}'
    rank-type: '{typography.data}'
    top-rank-ink: '{colors.gold}'
---

## Brand & Style

Masayume (正夢) is "the dream that came true." The whole visual system is built around that one moment: a call is made in the dark, the clock drains, the oracle answers — and if it lands, gold marks the seam. The register is kintsugi: gold is the material of a thing *becoming true*, never decoration. Everything before the Verdict is calm near-black ledger; the accent is spent sparingly enough that when the 正夢 stamp presses in gold, it feels earned.

The posture is Japanese editorial without pastiche: the stamp vocabulary (正夢 / 逆夢), the Banzuke, and a numbered section rhythm carry the framing. No torii motifs, no film grain, no decorative katakana, no cherry blossoms. [ASSUMPTION: the reference product's grain/crop-tick/torii texture kit is deliberately not carried over — Masayume's texture is typographic, not photographic.]

The voice of the surface matches the PRD's voice of the copy: calm, precise, honest. Think of a printed settlement ledger read at night by one lamp. Numbers are the protagonists; the UI is the paper they are printed on.

## Colors

One warm near-black ground, one accent, two reserved outcome colors, one cream island. [ASSUMPTION: all hex values below are UX-phase decisions, veto-able individually.]

- **Ground (`{colors.ground}`)** — sumi-ink near-black with a warm cast, so gold sits in it like lacquerware rather than floating on a cold void. Surfaces step up in three tonal levels (`{colors.surface-1}` cards, `{colors.surface-2}` plates, `{colors.surface-3}` sheets/overlays); hierarchy is tonal, never shadowed.
- **Ink ramp** — `{colors.ink}` (primary text, ~15:1 on ground), `{colors.ink-secondary}` (~7.4:1, the floor for any information a user must read), `{colors.ink-muted}` (~3.5:1 — decorative labels, ghost numerals, and disabled-adjacent text only; never load-bearing copy), `{colors.ink-disabled}` (disabled control ink — a disabled control must *look* disabled, and this is the ink that does it).
- **Kin gold (`{colors.gold}`)** — THE accent, and the only one. 10.9:1 on ground. It means exactly four things: *live/urgent* (countdown inside its urgency threshold, live dots), *conviction* (backed-Take badges), *primary action*, and *the 正夢 moment*. [CONFIRMED by Abu 2026-09-01: gold/amber; deliberately far from Yosuku's vermilion `#E04D26` in hue and temperature, and unconfusable with profit-green/loss-rose.] Variants: `{colors.gold-hover}`, `{colors.gold-pressed}`, `{colors.gold-dim}` (borders, resting badge outlines), `{colors.gold-wash}` (tinted panel grounds — the claim plate lives on it).
- **Profit (`{colors.profit}`) / Loss (`{colors.loss}`)** — reserved EXCLUSIVELY for P&L direction and Verdicts: UP/DOWN Side controls, signed PnL figures, win/loss row accents. Never for generic success/error, never for form validation, never for status dots unrelated to money direction. A "copied!" toast is neutral; a failed request is `{colors.warning}` or plain ink. Washes (`{colors.profit-wash}`, `{colors.loss-wash}`) tint Side-selection chips without shouting.
- **Warning (`{colors.warning}`)** — degraded truth: stale quotes, partial indexer scans, wrong-network banners, validation. Always paired with a text label; color alone never carries the warning (honest-state law). It is orange, not gold — if a composition makes the two ambiguous, the warning gets an icon + label and the gold element yields.
- **Info (`{colors.info}`)** — neutral informational accents (provenance notes, "how this is computed" links). Rare by design.
- **Cream island (`{colors.cream}` / `{colors.cream-ink}` / `{colors.cream-hairline}`)** — the claim Receipt's paper. It stays cream inside the dark UI in v1's dark-only theme — the one inverted surface, so the Receipt reads as a physical object you could tear off and keep (trust-moments contract, FR-11).
- **Gold never colors a number.** P&L figures are profit/loss/neutral ink; gold is the stamp, the seal, the button — the *moment*, not the ledger.

## Typography

Four faces, four jobs. [ASSUMPTION: face selection — all Google Fonts, loadable via `next/font`; deliberately not the reference's Sora/Inter/JetBrains pairing.]

- **Archivo** (`{typography.display}`, `{typography.headline}`, `{typography.title}`) — display and headings. Weights 650–800, tight tracking; its width axis gives the wordmark and section mastheads an editorial condensed register without a second family.
- **Instrument Sans** (`{typography.body}`, `{typography.caption}`) — body and UI copy. Quiet, never used for figures.
- **IBM Plex Mono** (`{typography.data}` family + `{typography.label-micro}`) — **the numbers law: every money figure, Odds, Stake, countdown, address, and tx hash renders in Plex Mono with `tabular-nums`, no exceptions.** Body faces never render money. Micro-labels (`{typography.label-micro}`) are uppercase, tracked 0.16em — the system's eyebrow voice ("01 · LIVE NOW", "SETTLES IN", "BACKED · RESTING").
- **Noto Serif JP** (`{typography.stamp}`, `{typography.stamp-hero}`) — the stamp vocabulary (正夢 / 逆夢 / 無効) and kanji brand moments only. It never sets running text. The kanji stamp always carries its romaji + translation subline in `{typography.label-micro}` so no user needs Japanese to read their Verdict.

Hero numbers (balance, settlement print) use `{typography.data-hero}` with `clamp()` scaling. Odds are always cents-per-$1 in `{typography.data}` ("62¢"), both Sides visible.

## Layout & Spacing

4px base scale (`{spacing.1}`–`{spacing.16}`). Mobile margins `{spacing.gutter}` (16px); desktop `{spacing.gutter-desktop}`. Major sections separated by `{spacing.section}` mobile / `{spacing.section-desktop}` desktop — the numbered-section rhythm needs air to read as editorial rather than dashboard.

- Single column on mobile, content max-width ~640px for reading surfaces, ~1200px for the `/markets` desktop grid (hero chart + docked Ticket rail).
- Reels: full-viewport snap cards, card max-width 460px centered — the feed is phone-proportioned even on desktop.
- The floating pill nav reserves `{spacing.16}` + `env(safe-area-inset-bottom)` of bottom clearance on every mobile surface; sheets and composers pad the safe area explicitly.
- Numbered section headers: `{typography.label-micro}` index ("02") + interpunct + title in `{typography.title}`, over a `{colors.hairline}` rule. No ornament.
- Touch targets ≥ `{spacing.touch}` (44px) always.

## Elevation & Depth

Dark UI depth is **borders and tonal steps, not shadows**. [ASSUMPTION]

- Level 0: `{colors.ground}`. Level 1: cards on `{colors.surface-1}` + `{colors.hairline}` border. Level 2: plates on `{colors.surface-2}`. Level 3: sheets/modals on `{colors.surface-3}` over `{colors.scrim}` backdrop.
- **Glow law:** a soft gold outer glow (`{colors.gold}` at ~16% alpha, 24px blur) is reserved for *live urgency* — the hero/active card's countdown ring inside its urgency threshold, the live dot, the just-landed Verdict. Never on hover, never decorative. One glowing element per composition, maximum.
- **The one real shadow:** the cream Receipt gets a soft neutral drop shadow — it is the app's single physical object and the shadow is what sells the physics. Nothing else casts one.
- Disabled surfaces drop their border to `{colors.hairline}` and their ink to `{colors.ink-disabled}` — flatter, dimmer, visibly inert.

## Shapes

- `{rounded.sm}` (4px): chips, badges, inline tags. `{rounded.md}` (8px): buttons, inputs. `{rounded.lg}` (12px): cards, plates, the Ticket. `{rounded.xl}` (24px): Reel cards and bottom sheets (sheet: top corners only). `{rounded.full}`: the pill nav, quick-amount chips, live dots.
- The Receipt uses `{rounded.md}` with a perforated tear edge (dotted border treatment) on its stub line — paper, not glass.
- Stamps press at `{components.verdict-stamp.rotation}` (−4°) with a slightly rough edge — a rubber stamp, not a sticker. [ASSUMPTION]
- Nothing is a perfect circle except avatars, dots, and the countdown ring.

## Components

- **Ticket** — the bet-entry surface. `{components.ticket}`: `{colors.surface-1}` card (docked rail on desktop, bottom sheet on mobile). Anatomy top-to-bottom: Market line + countdown; Side selector (two segments styled `{components.button-up}` / `{components.button-down}` — wash fill, colored ink, selected segment gains its full-strength border); Stake input in `{typography.data-lg}` (user-owned; **starts empty on the hero/markets Ticket, pre-filled on context-carrying entries** — Reels inline taps, take-the-other-side, and Baku act-on-Read cards arrive with a suggested Stake the user can overwrite; same rule in EXPERIENCE.md Ticket pattern) with quick-amount chips (¼ / ½ / ¾ / Max, scaled to live balance); quote strip — three mono rows: *Cost*, *Payout if right*, *Max loss = your stake* (plus a stop-headroom line — "14 tUSDC left today" — whenever a Daily Stop is set); then the CTA at `{components.ticket.cta-height}`. The CTA takes the chosen Side's solid fill with `{colors.cream-ink}` text when armed; when blocked it renders on `{colors.surface-2}` with `{colors.ink-disabled}` text and **the blocker as its label**. Stale quotes dim the quote strip and show a `{colors.warning}` "requoting" tick.
- **Market card** — `{components.market-card}`: asset glyph + Cadence word in `{typography.label-micro}`, countdown, the Window's question in `{typography.title}`, live volume + trade count in `{typography.data}` (the numbers the official app hides — always present), sparkline vs the frozen opening line, footer UP/DOWN chips showing live cents. Settled state overlays the small `{typography.stamp}` mark.
- **Hero market (chart-as-Ticket)** — full-width chart, opening-price line as a solid `{colors.ink-secondary}` rule labeled with the frozen print in `{typography.data}`; pending opening print renders the line dashed `{colors.ink-muted}` with an explicit "waiting for opening print" label — never a guessed level. Distance readout ("needs +$42 for UP") in `{typography.data}`; top-of-book depth for both Sides in a quiet mono strip; countdown turns `{colors.gold}` at min(60s, intervalSec × 0.4) remaining (interval-relative — a 60s Window is not born urgent).
- **Reel card** — `{components.reel-card}`: `{rounded.xl}` portrait card, 1px `{colors.gold-dim}` top hairline as the "live" signature, chart filling the middle, big countdown, UP/DOWN foot chips. Take variant: caption as `{typography.headline}` hero, call chip, backed badge, "take the other side" foot action. Verdict-in-place swaps the foot for the stamp + Receipt link.
- **Stat / balance plate** — `{components.balance-plate}`: ONE number heads it — spendable wallet balance in `{typography.data-hero}` — with labeled pool rows beneath (Vault · order escrow · venue payout credit — the last is UI copy for the PRD's "venue per-pool vault balance," renamed deliberately so "Vault" stays unambiguous), each a hairline row with its own amount and note; never summed into the headline. Stale reads keep the last-good figure at full ink with a `{colors.warning}` "as of 12:04" tick — never 0, never a spinner where a number was.
- **Claim-all plate** — `{components.claim-plate}`: `{colors.gold-wash}` ground, `{colors.gold-dim}` border, claimable total in `{typography.data-lg}`, "Claim all" as `{components.button-primary}`. Surfaces globally when nonzero; collapses to a pill badge on non-money surfaces. Voids listed as their own labeled rows ("void — both sides pay 0.5").
- **Receipt (the cream stub)** — `{components.receipt}`: cream paper card, gold top strip, mono ledger rows with dotted leaders (entry fill tx · settlement tx · Oracle Graph), the settlement print as the monument figure with its exact UTC second, stamp area, perforated stub edge, footer: *"Only you can cash out."* Every tx row is a live link with the standing caption *"Don't trust it. Click it."* Stays cream in dark mode — always.
- **Capability receipt** — `{components.capability-receipt}`: a framed plate in two ruled columns. **CAN**: plain mono rows (scope, Caps, expiry). **CANNOT**: mono verbs struck through in `{colors.ink-muted}` — `withdraw()` `transfer()` `sweep()` — closed by the kill-line in `{typography.data}` at full ink: *"No such function."* No red, no drama; the strike is the message.
- **Verdict stamp** — `{components.verdict-stamp}`: 正夢 in `{colors.gold}` for a win; 逆夢 in `{colors.ink-secondary}` for a loss (a loss is a fact, not a scare — no rose stamp); 無効 void in `{colors.ink-muted}` with its honest line. Romaji + translation subline in `{typography.label-micro}`. The P&L figure beside the stamp is where `{colors.profit}` / `{colors.loss}` do their only celebrating.
- **Buttons** — Primary `{components.button-primary}` (gold fill, near-black ink, 48px). Secondary: `{colors.surface-2}` + `{colors.border-strong}` + `{colors.ink}`. Ghost: ink text only. Side buttons per `{components.button-up}` / `{components.button-down}`. Destructive actions (revoke, withdraw-all) are Secondary with `{colors.warning}` ink — never loss-rose. Disabled: `{colors.surface-2}` fill, `{colors.ink-disabled}` label, no border emphasis, cursor default.
- **Inputs** — `{components.input}`: `{colors.ground}` well inside a card, `{colors.hairline}` border, 2px `{colors.gold}` focus ring, numeric inputs in `{typography.data-lg}`. Validation messages in `{colors.warning}` with text, below the field.
- **Badges** — `{components.badge-backed-resting}`: gold outline, hollow dot, "BACKED · RESTING" in `{typography.label-micro}` + verify link. `{components.badge-backed-filled}`: gold-wash fill, solid dot, "BACKED · FILLED" + verify link. Unbacked Takes carry no badge — absence is the distinction. `{components.badge-house}`: neutral outline "HOUSE" — house wallets are labeled, never dressed as users. Achievement badges: `{rounded.sm}` chips, `{colors.surface-2}` + `{colors.ink-secondary}`.
- **Countdown** — `{components.countdown}`: mono tabular digits, neutral ink; at min(60s, intervalSec × 0.4) remaining, digits and ring turn `{colors.gold}` (interval-relative urgency, per FR-7; the glow variant is hero/active-card only — list cards get gold digits, never the glow); at zero it reads "Settling…" — never negative, never frozen. Ring variant: SVG arc draining linearly.
- **Banzuke row** — `{components.banzuke-row}`: single-column ledger rows — rank numeral in `{typography.data}` (top 3 in `{colors.gold}`), deterministic address-glyph avatar, name/address, realized PnL in profit/loss ink, meta (settled rounds · win rate). Thin labeled tier rules divide the sheet. The signed-in user's row pins as "You" regardless of rank. [ASSUMPTION: single-column ledger, not the reference's mirrored East/West two-column sheet — same Banzuke framing, different composition.]
- **Ticker** — the persistent price strip: `{colors.ground}` with a bottom `{colors.hairline}`, asset glyph + price in `{typography.data}`, direction tick in profit/loss ink (the one chrome element allowed direction color — it IS money direction). Height 32px; pauses (visually freezes with a staleness tick) rather than scrolling stale numbers.
- **Toast** — `{colors.surface-3}` card, `{rounded.md}`, `{colors.ink}` text with `{typography.caption}`; neutral by default ("Copied"), `{colors.warning}` icon + label for degraded-truth notices. Never green, never rose (color law). Bottom-anchored above the pill nav; one at a time.
- **Share card (rendered image)** — 1200×630 and 1080×1920 crops: `{colors.ground}` field, the stamp (or the conditional "IF IT LANDS" eyebrow for open calls in `{typography.label-micro}`), the figure in `{typography.data-hero}`, absolute UTC settle time, Receipt link line, small wordmark. Open-call cards never use win language or relative countdowns.
- **Baku dock** — floating `{rounded.full}` button, `{colors.surface-3}` + `{colors.border-strong}`, the 獏 glyph in `{colors.ink-secondary}` (gold dot only when a Read is ready — the urgency law applies). Expands to a `{rounded.xl}` sheet on `{colors.surface-3}`; Reads render as `{colors.surface-1}` cards with the Side chip, the model's numbers in `{typography.data}`, and the act-on-it row; Brake talk-downs render with the `{colors.warning}` icon + label, never rose.
- **Parlay slip** — `{colors.surface-1}` card, `{rounded.lg}`: Legs as mono ledger rows (asset · Side · Window · leg price with dotted leaders), combined probability + Stake + max payout in `{typography.data-lg}`, and the escrow line in `{colors.gold}` ink on `{colors.gold-wash}`: "your payout is already locked in the contract" with its verify link. A killed slip strikes the losing Leg and stamps the slip footer 逆夢 in `{typography.stamp}`; surviving Legs stay full ink until then.
- **Strategy card** — `{colors.surface-2}` plate: name + decision envelope in `{typography.caption}`, record figures in mono with profit/loss ink, re-derived health dot (health is not money direction, so no green: alive = `{colors.info}` dot + "live · tick 12s ago", dead = `{colors.warning}` + "offline — your funds don't depend on it"), the why/why-not feed as a quiet mono log, Caps summary, and the worked-example sizing sentence in `{typography.body-strong}` above the subscribe CTA.
- **Wrong-network / blocked banner** — full-width strip on `{colors.surface-2}` with `{colors.warning}` icon + label and the fix as the action ("Switch to Somnia Shannon"); it sits above content, never a modal; every write control beneath renders disabled per the disabled law while it shows.

## Do's and Don'ts

| Do | Don't |
|---|---|
| One gold element earning attention per composition | Gold as decoration, hover tint, or panel wash outside `{colors.gold-wash}` contexts |
| Green/rose only for Side direction, P&L, and Verdicts | Green success toasts, rose error states, rose destructive buttons |
| Every number in Plex Mono, `tabular-nums` | Money or Odds set in Archivo or Instrument Sans |
| Disabled = dim ink + flat surface + the blocker as the label | A dead control that looks tappable, or a bare "disabled" with no reason |
| Empty states explain themselves and name the next action | Blank panels, lone spinners, "No data" |
| Stale data shown at full strength with a visible staleness tick | Rendering 0 for a failed read, or hiding the number behind a spinner |
| Cream Receipt stays cream; it is the one physical object | Theming the Receipt dark, adding shadows to anything else |
| Stamps carry romaji + translation sublines | Kanji as unexplained ornament, decorative Japanese flavor text |
| Borders and tonal steps for depth; gold glow only for live urgency | Drop shadows, elevation stacks, glow on hover |
| Countdown urgency = gold at min(60s, intervalSec × 0.4); glow on the hero/active card only | Red countdowns, negative time, a stalled clock, a 60s lane that is permanently "urgent" |
