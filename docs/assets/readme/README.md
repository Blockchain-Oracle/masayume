# Masayume README artwork

This folder keeps the SVG sources and matching PNG exports used by the root README. The public copies are served from `https://docs.masayume.app/repo-assets/`, so images also work for readers without GitHub repository access.

| Artwork | Light SVG / PNG | Dark SVG / PNG |
| --- | --- | --- |
| App banner | [SVG](hero-light.svg) · [PNG](hero-light.png) | [SVG](hero-dark.svg) · [PNG](hero-dark.png) |
| Docs banner | [SVG](docs-banner-light.svg) · [PNG](docs-banner-light.png) | [SVG](docs-banner-dark.svg) · [PNG](docs-banner-dark.png) |
| Video cover | [SVG](video-cover-light.svg) · [PNG](video-cover-light.png) | [SVG](video-cover-dark.svg) · [PNG](video-cover-dark.png) |
| Architecture | [SVG](architecture-light.svg) · [PNG](architecture-light.png) | [SVG](architecture-dark.svg) · [PNG](architecture-dark.png) |
| Transparent mark | [SVG](mark-light.svg) | [SVG](mark-dark.svg) |

The README uses `<picture>` with light/dark SVG sources and a PNG fallback. All marks come from Masayume’s actual logo. Promotional lettering is outlined Sora 600 and Inter 400; the architecture preserves the source-backed diagram’s geometry and text. File dimensions and SHA-256 hashes are in [manifest.json](manifest.json).

The source generator and licensed font files live in the [documentation repository](https://github.com/Blockchain-Oracle/masayume-docs/tree/main/scripts). To refresh the artwork, run `node scripts/generate-repo-assets.mjs` there, review both themes, then copy the resulting SVGs, PNGs and manifest from `public/repo-assets` into this folder. Keep both repositories’ exports identical. Full [artwork instructions](https://docs.masayume.app/repo-assets/usage.md) are also published with the assets.

## Demo video

The root README now links to the native [Masayume demo player](https://masayume.app/demo), with its [direct MP4](https://masayume.app/video/masayume-demo-2026-09-07.mp4), [English captions](https://masayume.app/video/masayume-demo-2026-09-07.vtt) and a genuine poster frame. The prepared cut lasts **2:46**. The player includes native controls and a full transcript.

The earlier themed video-cover SVGs/PNGs in this folder remain historical artwork; their coming-soon text is no longer used by the root README. Rendering and wiring the player do not by themselves establish production playback or hackathon submission. See the [demo source and review record](../../submission/demo-script-2026-09-06.md).

GitHub raw URLs follow `https://raw.githubusercontent.com/Blockchain-Oracle/masayume/main/docs/assets/readme/hero-light.svg`. That form is suitable for a public repository. These repositories are currently private, so the live README uses the public docs host instead of assuming anonymous raw-file access.
