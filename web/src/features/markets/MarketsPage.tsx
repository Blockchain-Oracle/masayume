"use client";

import { BalancePlate } from "./balance";
import { HeroMarket } from "./hero";
import { MarketsScreen } from "./MarketsScreen";
import { TicketDock } from "./ticket";
import type { MarketsSelection } from "./useMarketsSelection";
import { LiveVerdict } from "./verdict";

function renderHero(selection: MarketsSelection) {
  if (!selection.marketId) return null;
  return (
    <>
      <HeroMarket marketId={selection.marketId} side={selection.side ?? undefined} />
      <LiveVerdict marketId={selection.marketId} />
    </>
  );
}

function renderTicket(selection: MarketsSelection) {
  return (
    <>
      <BalancePlate />
      {selection.market ? <TicketDock selection={{ ...selection, market: selection.market }} /> : null}
    </>
  );
}

/** Client composition of the /markets island: the screen plus the surfaces that plug into its slots. */
export function MarketsPage() {
  return <MarketsScreen renderHero={renderHero} renderTicket={renderTicket} />;
}
