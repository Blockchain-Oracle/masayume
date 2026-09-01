/**
 * The disc that names the asset in the hero head.
 *
 * Yosuku's venue only ever lists BTC, so it hardcodes "₿" on Bitcoin orange. Lanes
 * here come from whatever the venue actually lists, so an asset it has no mark for
 * gets its initial on a neutral disc — never another asset's symbol or colour.
 */
export interface AssetMark {
  glyph: string;
  /** Class that carries the asset's own colour; absent for the neutral fallback. */
  variant: string | undefined;
}

const MARKS: Record<string, AssetMark> = {
  BTC: { glyph: "₿", variant: "btc" },
};

export function assetMark(asset: string): AssetMark {
  return MARKS[asset.toUpperCase()] ?? { glyph: asset.slice(0, 1).toUpperCase(), variant: undefined };
}
