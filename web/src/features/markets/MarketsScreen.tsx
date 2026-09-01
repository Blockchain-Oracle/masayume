"use client";

import type { ReactNode } from "react";
import { SectionHeader } from "@/components/chrome";
import { EmptyState } from "@/components/states";
import { MARKETS, SECTIONS } from "@/lib/copy";
import { CadenceLanes, useLanesState } from "./lanes";
import { PlainWordsToggle, usePlainWords } from "./plain-words";
import { useChainNowMs } from "./useChainNow";
import { useMarketsSelection, type MarketsSelection } from "./useMarketsSelection";
import { useVenue } from "./useVenue";

export interface MarketsScreenProps {
  /** Story 1.7 plugs the hero chart in here. */
  renderHero?: (selection: MarketsSelection) => ReactNode;
  /** Story 1.8 plugs the Ticket in here; below `lg` it owns its own bottom sheet. */
  renderTicket?: (selection: MarketsSelection) => ReactNode;
}

/** 01 cadence lanes · 02 the window · 03 your call — one column on a phone, hero + docked ticket rail from `lg`. */
export function MarketsScreen({ renderHero, renderTicket }: MarketsScreenProps) {
  const venue = useVenue();
  const nowMs = useChainNowMs();
  const lanes = useLanesState(venue.venueId);
  const [plainWords, setPlainWords] = usePlainWords();
  const { selection, setSelection } = useMarketsSelection(lanes.laneSet, lanes.activeLane, nowMs);

  return (
    <div className="mx-auto flex w-full max-w-(--content-wide) flex-col gap-10 px-gutter py-6 lg:px-gutter-desktop">
      <section className="flex flex-col gap-4" aria-labelledby="section-lanes">
        <SectionHeader index={SECTIONS.lanes.index} title={SECTIONS.lanes.title} aside={<PlainWordsToggle on={plainWords} onChange={setPlainWords} />} />
        <CadenceLanes
          state={lanes}
          boot={venue.boot}
          venueId={venue.venueId}
          nowMs={nowMs}
          plainWords={plainWords}
          selectedMarketId={selection.marketId}
          selectedSide={selection.side}
          onSelect={setSelection}
        />
      </section>

      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-8">
        <section className="flex flex-col gap-4" aria-labelledby="section-hero">
          <SectionHeader index={SECTIONS.hero.index} title={SECTIONS.hero.title} />
          {renderHero ? renderHero(selection) : <EmptyState why={MARKETS.heroPlaceholder.why} />}
        </section>
        <section className="flex flex-col gap-4 lg:sticky lg:top-6" aria-labelledby="section-ticket">
          <SectionHeader index={SECTIONS.ticket.index} title={SECTIONS.ticket.title} />
          {renderTicket ? renderTicket(selection) : <EmptyState why={MARKETS.ticketPlaceholder.why} />}
        </section>
      </div>
    </div>
  );
}
