"use client";

import { HeroMarket } from "./hero";
import { MarketsScreen } from "./MarketsScreen";
import type { MarketsSelection } from "./useMarketsSelection";

function renderHero(selection: MarketsSelection) {
  if (!selection.marketId) return null;
  return <HeroMarket marketId={selection.marketId} side={selection.side ?? undefined} />;
}

/** Client composition of the /markets island: the screen plus the surfaces that plug into its slots. */
export function MarketsPage() {
  return <MarketsScreen renderHero={renderHero} />;
}
