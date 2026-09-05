# Deterministic reply card previews

These six 1200 × 600 PNGs are local review fixtures, each visibly marked **DEMO · NOT A REAL TRADE**. The real receipt formatter supplies their text; the deterministic renderer uses the included licensed brand fonts and its own SVG receipt illustration. No generative model, actor startup, network request, media upload, post, or trade runs here.

Regenerate from the repository root:

```sh
pnpm --filter @masayume/ops exec tsx ../../docs/marketing/previews/generate.mts
```

| Preview | Fixture being demonstrated |
| --- | --- |
| `reply-filled-demo.png` | A booked cost of 4.95 tUSDC; requested stake is independently 5 tUSDC. A fill does not mean a winning market result. |
| `reply-submitted-demo.png` | Instruction received; execution unconfirmed. |
| `reply-unknown-demo.png` | No validated transaction hash; status needs checking. |
| `reply-refused-demo.png` | Trading permission missing. |
| `reply-reverted-demo.png` | Reverted order; gas may still have been spent. |
| `reply-nothing-filled-demo.png` | No position booked, even though the transaction may have succeeded. |

The generator uses a synthetic valid-format hash for three chain-result fixtures so their intended state passes the formatter's validation. This is not a real transaction claim. It is not printed as a hash or advertised as a receipt link in these images. Do not upload these fixtures as real user receipts.

Actual replies use the stored receipt through `createReplyPresentation` and the renderer's default options. The current X transport dependency does not attach image alt text, so every meaningful card fact must also remain in the plain-text reply.

## Responsive receipt list

`receipt-layout-{320,390,1280}.png` show the actual `XReceiptsList` rendered to static HTML with the current `x.css` and JetBrains Mono 400 from the local Next build cache. They are clearly labeled synthetic fixtures. No app or server was started. The existing Chromium headless shell rendered the local file at 320 × 1600, 390 × 1600, and 1280 × 1050.

All three widths were visually checked. `receipt-layout-review.json` records the actual computed dimensions: page width equals viewport width, all fonts loaded, and no visible content extends outside its row or viewport. Desktop instruction ellipsis is intentional; mobile instructions wrap completely. The seven cases include a one-base-unit fill, historical requested stake, unknown status, long unbroken instruction/reason, a maximum-length amount, reverted order, and no fill.

Regenerate the standalone HTML after a local Next build has cached the app fonts:

```sh
pnpm --filter @masayume/ops exec tsx --tsconfig ../../web/tsconfig.json ../../docs/marketing/previews/generate-receipt-layout.mts
```

`receipt-layout-source.json` pins the stylesheet hash used for this check. These fixture images verify component layout, not a production wallet flow or real transaction.
