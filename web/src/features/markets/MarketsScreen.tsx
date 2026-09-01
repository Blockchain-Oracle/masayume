"use client";

import type { ReactNode } from "react";
import { SectionHeader } from "@/components/chrome";
import { SECTIONS } from "@/lib/copy";
import { CadenceLanes, useLanesState } from "./lanes";
import { MarketsHero } from "./MarketsHero";
import { PlainWordsToggle, usePlainWords } from "./plain-words";
import { useChainNowMs } from "./useChainNow";
import { useMarketsSelection, type MarketsSelection } from "./useMarketsSelection";
import { useVenue } from "./useVenue";

export interface MarketsScreenProps {
  /** The rail beside the hero chart above 900px; its own drawer below that. */
  renderTicket: (selection: MarketsSelection) => ReactNode;
  /** The result of the Window in the hero, once it has one. */
  renderVerdict: (selection: MarketsSelection) => ReactNode;
}

/**
 * The market you are betting on is the page.
 *
 * The hero carries the question, the chart and the ticket together; the lanes
 * below are how you change it. This inverts the previous arrangement (01 lanes →
 * 02 the window → 03 your call), where reading a market and acting on it were
 * three scroll positions apart.
 */
export function MarketsScreen({ renderTicket, renderVerdict }: MarketsScreenProps) {
  const venue = useVenue();
  const nowMs = useChainNowMs();
  const lanes = useLanesState(venue.venueId);
  const [plainWords, setPlainWords] = usePlainWords();
  const { selection, setSelection } = useMarketsSelection(lanes.laneSet, lanes.activeLane, nowMs);

  return (
    <>
      <MarketsHero selection={selection} lanes={lanes} onSelect={setSelection} renderTicket={renderTicket} />

      <div className="markets-main">
        <div className="container">
          {renderVerdict(selection)}

          <section className="markets-section flex flex-col gap-4" aria-labelledby="section-lanes">
            <SectionHeader
              index={SECTIONS.lanes.index}
              title={SECTIONS.lanes.title}
              aside={<PlainWordsToggle on={plainWords} onChange={setPlainWords} />}
            />
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
        </div>
      </div>
    </>
  );
}
