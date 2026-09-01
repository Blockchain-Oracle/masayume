"use client";

import { isOk } from "@masayume/core/schemas";
import type { OpenPosition } from "@masayume/core/types";
import { keys, usePositions } from "@masayume/markets/react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { SectionHeader } from "@/components/chrome";
import { ReadingBoundary } from "@/components/states";
import { PORTFOLIO } from "@/lib/copy";
import { useWalletSession } from "@/lib/wallet-session";
import { useChainNowMs } from "../useChainNow";
import { BetRow } from "./BetRow";

interface BetsPanelProps {
  symbol: string | undefined;
  index: string;
}

const isEmpty = (rows: OpenPosition[]) => rows.length === 0;

/**
 * Your open bets, straight off `getOpenPositionsWithPnL` — the venue's own cost
 * basis, mark value and unrealised PnL, not a figure recomputed here.
 *
 * The reference lists settled history in the same panel. That needs the fill
 * projection (Stage 3), so this panel is open bets only and says as much rather
 * than showing an empty "history" heading that will never fill on its own.
 */
export function BetsPanel({ symbol, index }: BetsPanelProps) {
  const { address } = useWalletSession();
  const nowMs = useChainNowMs();
  const reading = usePositions(address);
  const queryClient = useQueryClient();
  const retry = () => {
    if (address) void queryClient.invalidateQueries({ queryKey: keys.positions(address) });
  };
  const count = reading && isOk(reading) ? reading.value.length : null;

  return (
    <section className="flex flex-col gap-4" aria-label={PORTFOLIO.betsTitle}>
      <SectionHeader
        index={index}
        title={PORTFOLIO.betsTitle}
        aside={count === null ? undefined : <span className="type-label-micro text-ink-muted">{PORTFOLIO.openBets(count)}</span>}
      />
      <ReadingBoundary
        reading={reading}
        shape="row"
        retry={retry}
        isEmpty={isEmpty}
        empty={{ why: PORTFOLIO.noBets, nextAction: { label: PORTFOLIO.firstCall, href: "/markets" } }}
      >
        {(positions) => (
          <ul className="flex flex-col">
            {positions.map((position) => (
              <BetRow key={position.marketId} position={position} symbol={symbol} nowMs={nowMs} />
            ))}
          </ul>
        )}
      </ReadingBoundary>
      <p className="type-caption text-ink-muted">{PORTFOLIO.historyPending}</p>
      <Link href="/markets" data-cursor="hover" className="type-caption text-accent">
        {PORTFOLIO.toMarkets} →
      </Link>
    </section>
  );
}
