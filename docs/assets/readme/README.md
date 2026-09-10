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

The root README's clickable [official demo cover](../../../web/public/demo/official-demo-cover.jpg) opens [masayume.app/demo](https://masayume.app/demo). That page embeds the owner's [official YouTube video](https://youtu.be/tJ__aXds1dE), published on 10 September 2026 and lasting **3:23**, with a direct Watch on YouTube link. The same cover supplies the page's Open Graph and X previews. It is served by the app at `https://masayume.app/demo/official-demo-cover.jpg`, independently of the shared themed exports above.

The cover was generated with image generation using Masayume's existing branded cover and real market capture. The [NoxVote README](https://github.com/Blockchain-Oracle/noxvote) inspired its headline, screenshot, and prominent play-button treatment. This is promotional artwork; the dated original market capture remains at `web/public/demo/markets.png`.

The earlier themed video-cover SVGs/PNGs and their manifest remain historical artwork; their coming-soon text is no longer used by the root README. The former MP4, captions and transcript are retained as dated source evidence, but are no longer presented as the official demo. See the [earlier demo source and review record](../../submission/demo-script-2026-09-06.md). The separate instructional videos in the documentation remain in use.

GitHub raw URLs follow `https://raw.githubusercontent.com/Blockchain-Oracle/masayume/main/docs/assets/readme/hero-light.svg`. That form is suitable for a public repository. These repositories are currently private, so the live README uses the public docs host instead of assuming anonymous raw-file access.
