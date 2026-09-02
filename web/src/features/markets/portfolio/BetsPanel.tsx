"use client";

import { isOk } from "@masayume/core/schemas";
import type { OpenPosition } from "@masayume/core/types";
import { keys, useMyLeveragePositions, usePositions } from "@masayume/markets/react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { SectionHeader } from "@/components/chrome";
import { ReadingBoundary } from "@/components/states";
import { LeverageBetRows } from "@/features/leverage";
import { useVaultOpenBets, VaultBetRows } from "@/features/vault";
import { PORTFOLIO } from "@/lib/copy";
import { useWalletSession } from "@/lib/wallet-session";
import { HISTORY, HistoryRows, type HistoryReading } from "../history";
import { useChainNowMs } from "../useChainNow";
import { BetRow } from "./BetRow";

interface BetsPanelProps {
  symbol: string | undefined;
  index: string;
  history: HistoryReading;
}

const isEmpty = (rows: OpenPosition[]) => rows.length === 0;

/**
 * Your bets: the open ones straight off `getOpenPositionsWithPnL` — the venue's own cost basis,
 * mark value and unrealised PnL — then, as the reference lists them in the same panel, every
 * settled Window from the fill projection.
 *
 * Two sources on purpose. The venue's engine clamps a sell beyond inventory to zero and drops
 * the complement, so an open short would read as no position; the projection books it as the
 * other side (verified against chain balances). A settled row therefore never depends on the
 * open-position engine, and the two cannot disagree about a Window that has closed.
 */
export function BetsPanel({ symbol, index, history }: BetsPanelProps) {
  const { address } = useWalletSession();
  const nowMs = useChainNowMs();
  const reading = usePositions(address);
  const vaultBets = useVaultOpenBets(address);
  const vaultOpen = vaultBets && isOk(vaultBets) ? vaultBets.value.length : 0;
  const boosts = useMyLeveragePositions(address);
  const boostsOpen = boosts && isOk(boosts) ? boosts.value.filter((p) => p.status === "live").length : 0;
  const queryClient = useQueryClient();
  const retry = () => {
    if (address) void queryClient.invalidateQueries({ queryKey: keys.positions(address) });
  };
  const openCount = reading && isOk(reading) ? reading.value.length + vaultOpen + boostsOpen : null;
  const settledCount = history.reading?.ok ? history.reading.value.rounds.length : null;

  return (
    <section className="flex flex-col gap-4" aria-label={PORTFOLIO.betsTitle}>
      <SectionHeader
        index={index}
        title={PORTFOLIO.betsTitle}
        aside={
          openCount === null && settledCount === null ? undefined : (
            <span className="type-label-micro text-ink-muted">
              {openCount !== null && PORTFOLIO.openBets(openCount)}
              {openCount !== null && settledCount !== null && " · "}
              {settledCount !== null && HISTORY.settledCount(settledCount)}
            </span>
          )
        }
      />
      <ReadingBoundary
        reading={reading}
        shape="row"
        retry={retry}
        isEmpty={(rows) => isEmpty(rows) && vaultOpen === 0 && boostsOpen === 0 && (history.reading?.ok ? history.reading.value.rounds.length === 0 : false)}
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
      <VaultBetRows symbol={symbol} />
      <LeverageBetRows symbol={symbol} />
      <HistoryRows history={history} symbol={symbol} />
      <Link href="/markets" data-cursor="hover" className="type-caption text-accent">
        {PORTFOLIO.toMarkets} →
      </Link>
    </section>
  );
}
