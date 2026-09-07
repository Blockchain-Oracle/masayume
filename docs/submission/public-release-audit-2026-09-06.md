# Public source release audit — 6 September 2026

Status: **prepared for owner review; repository visibility and project-wide license remain unchanged**.

This audit covers source access, provenance, shipped assets, the supplied redacted history scans and README public links. It does not certify hackathon submission, live trading, X delivery, or legal ownership. Live acceptance evidence is maintained separately in [acceptance-2026-09-06.md](../implementation/acceptance-2026-09-06.md).

## Repository and authority snapshot

| Item | Verified state |
| --- | --- |
| `Blockchain-Oracle/masayume` | Private; GitHub `licenseInfo: null`; no root `LICENSE`, `COPYING` or `NOTICE` before this attribution notice was added |
| `Blockchain-Oracle/masayume-docs` | Private; GitHub `licenseInfo: null`; no root license document |
| App audit base | `16b4b7ba7138e91ac05a198f61e5ebc8421f76a8`, with the current authorized implementation changes in the working tree |
| Docs audit base | `ebdeddbdc54793e73ea759b3e5798ba84469cb44`, with current documentation changes in its separate working tree |
| Reference clones | `reference/` is ignored and has zero tracked files in the app repository; copied/adapted material elsewhere remains part of the app |
| Public app and docs | Their deployed websites are publicly accessible. Public deployment and public GitHub source access are separate facts. |

The locally retained direction authority requires source-led Yosuku fidelity and identifies missing license documents. The local parity ledger, in its 1 September 2026 provenance row, records **“User approved (owns/has permission)”** for Yosuku source, CSS, tokens and assets. That approval already authorizes the implementation work; this audit preserves it after the AI authoring notes were untracked on 7 September. The missing record is the scope and notice for **public source redistribution and any project-wide license**.

## Material reference dependencies

| Reference | Source and pinned basis | Current evidence and release implication |
| --- | --- | --- |
| Yosuku | `Cybire1/yosuku` at `3c56ef52b78dae28cc198495f753480292f6a5ad` | Substantial direct presentation port. `web/src/styles/yosuku` contains 19 CSS files / 5,888 lines. Comparing its 18 part files to pinned `app/globals.css` found 5,554 matching ordered non-empty lines out of 5,577 non-empty port lines, approximately 99.6%, after trimming whitespace. Root README's MIT badge links to an absent license file. Preserve recorded owner authorization; document public redistribution scope and required notices. |
| PIPS | `Blockchain-Oracle/pips` at `fe8f6963972ca18fc9db0fd9ee4db389e6293ee8` | Public repository; GitHub detects no license; pinned tree has no general root license grant. Architecture and source comments describe independently implemented selection, settings, Lucky/Moonshot and arcade mechanics. Five tracked PIPS research screenshots remain in `context/screens/pips`. Their inclusion in a public research archive requires an explicit release decision. |
| Flicky | `Blockchain-Oracle/flicky` at `56054baeb0c7f8ef6e039ebb0eed2b04e4f59388`, fork of `nikola0x0/flicky` | Public fork; GitHub detects no license; README says `TBD`. `apps/contracts/sources/duel.move` alone carries an Apache-2.0 header. Architecture requires independent game UI, engine and server implementations. The shipped font and ten sound files are byte-identical to Flicky copies, but their original authors publish separate terms verified below. |

Fresh unauthenticated GETs to Yosuku's GitHub page and repository API both returned **404** on 6 September. A web-search cache still showed an older public page, so cached availability is not treated as current access or a license grant. The local pinned source was available for this audit.

### Measurement scope and limits

The text inventory examined 1,364 tracked `.ts`, `.tsx`, `.css` and `.sol` files under `web`, `packages`, `services` and `contracts`, using their current working-tree contents. Of those, 161 mentioned Yosuku, 46 PIPS and 52 Flicky. These are reference-mention counts, not a count of copied files, independent components, or a copyright assessment. New untracked files from the current implementation were outside this tracked-file denominator.

A SHA-256 whole-file comparison of tracked source and common image/font/audio formats against all three pinned reference trees found:

- No byte-identical whole files against Yosuku or PIPS. This does **not** negate the substantial split/adapted Yosuku CSS and source ports.
- Eleven identical Flicky asset files: `m6x11plus.ttf` corresponds to Flicky's `pixel.ttf`, and all ten shipped game MP3 files match.
- One identical six-line utility: `web/src/lib/utils.ts` matches Flicky's `packages/ui/src/lib/utils.ts`. It is the common `clsx` / `tailwind-merge` `cn` helper shape; equality alone does not establish which project supplied it.

This was a provenance inventory and whole-file comparison, not a comprehensive fragment-similarity or rights audit. The independent-implementation rule is preserved in [third-party notices](../../THIRD_PARTY_NOTICES.md#game-references). The original architecture and research notes remain local, ignored authoring material.

## Shipped asset terms

| Asset | Evidence | Classification |
| --- | --- | --- |
| Sora SemiBold and Inter Regular receipt TTFs | Font files ship beside full `Sora-OFL.txt` and `Inter-OFL.txt` in `services/ops/src/actors/x-relay/reply-card-assets` | SIL Open Font License 1.1; attribution and license texts present |
| m6x11plus | [Daniel Linssen's own page](https://managore.itch.io/m6x11) explicitly offers use with attribution and identifies both m6x11 and m6x11plus | Attribution terms verified. `web/public/fonts/SOURCES.md` and game settings already credit Daniel Linssen. Do not relabel this font MIT or CC0. |
| Ten game sound effects | [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds), [Digital Audio](https://kenney.nl/assets/digital-audio) and [Music Jingles](https://kenney.nl/assets/music-jingles) each display CC0; local `SOURCES.md` maps original filenames | Original-author CC0 terms verified independently of Flicky's missing root license |
| Agent portraits | Installed DiceBear Notionists `LICENSE` separates CC0 design by Zoish from MIT code; [official style page](https://www.dicebear.com/styles/notionists/) corroborates design terms | Include design attribution and preserve package notices |
| Pixel game art and music bed | `PixelArt.tsx` defines pixel grids; `bed.ts` sequences the app's own music, with reference patterns acknowledged in comments | Recorded as independent implementations; no Flicky/PIPS PNG sprite or Uppbeat music file appears in the shipped public asset list |
| Research and marketing media | Five PIPS research screenshots, app screenshots, Masayume illustrations and branded docs/receipt assets are tracked | Attribution notice does not automatically grant source-project screenshot or brand redistribution rights; include their scope in the public release decision |

The web also loads Sora, Inter, JetBrains Mono and Noto Serif JP through `next/font/google` in `web/src/lib/fonts.ts`. The [JetBrains Mono](https://github.com/google/fonts/blob/main/ofl/jetbrainsmono/OFL.txt) and [Noto Serif JP](https://github.com/google/fonts/blob/main/ofl/notoserifjp/OFL.txt) upstream notices are OFL 1.1. Preserve font notices/metadata when distributing generated font bundles; a font's terms are separate from the project's license.

The new root [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) records these sources without assigning an unverified umbrella license. Installed package licenses are also separate: for example, the Somnia SDK, React, Next.js and Motion report MIT; Lucide and Rettiwt-API report ISC. Masayume Solidity files carry MIT SPDX identifiers, but there is no corresponding repository-wide license declaration for the other material.

## Redacted secret-scan review

The parent task supplied full-history Gitleaks reports at `/tmp/masayume-app-secrets-audit.json` and `/tmp/masayume-docs-secrets-audit.json`. This pass reviewed **all 15 reported entries** against their historical source locations, without printing credential values or copying the reports into the repository. It did not rerun or widen the scanner itself.

| Repository / group | Count | Verified classification |
| --- | ---: | --- |
| App: deleted `services/ops/src/actors/x-relay/oauth1.test.ts` fixture | 5 | Four credential-shaped strings match the public examples on X's [creating-a-signature guide](https://docs.x.com/fundamentals/authentication/oauth-1-0a/creating-a-signature). The fifth is a deterministic expected HMAC signature, independently recomputed from those example inputs using the historical `api.twitter.com` URL. Current X documentation uses an `api.x.com` URL in places, so its displayed signature need not be byte-identical. These entries are historical public test data, not configured account credentials. |
| App: Solidity deployment scripts and fork test | 6 | Twenty-byte public outcome-token address constants; six occurrences of one historical address. The address has on-chain code on Shannon. It differs from the current pinned SDK address set and is not a private signing key. |
| App: `journal-local-storage.ts` | 1 | Application local-storage key name for the intent journal, not an API credential |
| App: `context/04-dreamdex-platform-spot-http-ws.md` | 1 | Documented native-token sentinel, not a wallet private key |
| App: `_bmad/_config/files-manifest.csv` | 1 | File-manifest content hash, not an authentication credential |
| Docs: `content/docs/trading/tap-trading.mdx` | 1 | Ordinary prose describing wallet prompts and funding a key's gas; no credential value |
| **Total** | **15** | **All supplied findings classified as false positives for secrets** |

Report fingerprints:

- App redacted report SHA-256: `1b4f55058d25069698efe56e5ca588c9a2589321d37afd1a5454dfe6784fa8ba`.
- Docs redacted report SHA-256: `379daf7167d080c74b91a56bfdad15e5f97ae3533008f4aaed0b2b762f41f215`.

This means no live credential was identified among the supplied findings. It is not a guarantee that every secret class, ignored local file, deployed environment, untracked change or future commit is clear. No history rewrite, credential rotation or suppression of scanner rules was performed for these false positives.

## README link checks

- All **47 unique checked README URLs**, covering docs pages, published artwork and the Somnia testnet hub, returned HTTP 200 via bounded GET requests.
- Every linked public documentation route resolved to an existing MDX page in the separate docs checkout. Public artwork URLs also answered successfully.
- App/docs GitHub links still require access because the repositories are private. The README already states this accurately; those links were not disguised or replaced with unverified mirrors.
- No broken public README link was found in this checked set, so no URL repair was necessary. The unpublished full demo remains honestly labeled.

## Concrete remaining public-release decisions

1. **Record the public redistribution scope for the already approved Yosuku reuse.** Identify the rights holder / permission record, the applicable copyright notice, whether permission covers public distribution of modified code, CSS, assets and documentation/screenshots, and any required attribution or exclusions. The current ledger records ownership/permission but not those terms.
2. **Select a project-level source license, if one is intended.** Specify which first-party app/docs material it covers and preserve third-party exceptions. A root MIT file must not silently purport to relicense Yosuku-derived portions, the attribution-only pixel font, or unrelated upstream material.
3. **Research cleanup settled on 7 September.** The owner requested exclusion of AI build context, including the five PIPS research screenshots. They are now local and ignored, alongside reference clones; older Git history is unchanged.
4. **Make the intended app/docs repositories accessible to judges after those terms are recorded.** Neither repository visibility nor hackathon submission was changed by this audit. If private judge access is supported by the actual submission process, record that choice explicitly; do not describe private source as publicly open source.

The owner-facing question is: **For the Yosuku material whose reuse you already approved, what rights-holder notice and public redistribution terms should accompany Masayume, and which license should cover our own app and documentation while preserving the listed third-party terms?**

No answer has been inferred from a GitHub badge, a fork relationship, public website availability, or a general permission to continue implementation. This question concerns the concrete public release package, not a request to redo approved design or development work.

## 7 September release follow-up

New app commits through `9bb7238` and docs commits through `7bfd240` were scanned with gitleaks; no new findings were detected. The original full-history findings and their prior dispositions remain preserved above. The app branch is pushed with draft PR #1, docs main is pushed, and both deployed sites are verified. This does not change repository visibility or grant a blanket license.

The 166-second demo, captions and poster are published under the app's `/video/` path and their public bytes match the reviewed files. Demo provenance identifies actual dated captures and the stock Daniel voice. Local `.claude` worktrees and `.review` material are excluded from both deployment uploads. Existing reference-code redistribution terms remain unresolved; both GitHub repositories remain private pending that decision.

### Owner-requested authoring cleanup

On 7 September, 112 application files and six documentation design/review files were removed from Git tracking while preserving their local bytes. This includes 21st design context, Claude memory, BMAD output, research and reference screenshots, prompts, handoffs, design previews and ten previously ignored Foundry broadcast logs. The dated inventory tables above describe the earlier audit tree; the PIPS screenshots are no longer in the current tracked tree. Git, Vercel and Docker exclusions cover the relevant local authoring material.

Runtime code, tests, deployment address manifests, build dependencies, published documentation and third-party notices remain tracked. Public-facing links now use the maintained docs and retained acceptance records. This cleanup changes the current tree, not older Git history or repository visibility.
