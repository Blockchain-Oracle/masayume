"use client";

import { HeroMarket } from "./hero";
import { MarketsScreen } from "./MarketsScreen";
import { TicketDock } from "./ticket";
import type { MarketsSelection } from "./useMarketsSelection";

function renderHero(selection: MarketsSelection) {
  if (!selection.marketId) return null;
  return <HeroMarket marketId={selection.marketId} side={selection.side ?? undefined} />;
}

function renderTicket(selection: MarketsSelection) {
  if (!selection.market) return null;
  return <TicketDock selection={{ ...selection, market: selection.market }} />;
}

/** Client composition of the /markets island: the screen plus the surfaces that plug into its slots. */
export function MarketsPage() {
  return <MarketsScreen renderHero={renderHero} renderTicket={renderTicket} />;
}
