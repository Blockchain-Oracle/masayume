"use client";

import type { SettledRound, WalletHistory } from "@masayume/core/projection";
import { useState } from "react";
import { ReadingBoundary } from "@/components/states";
import { useChainNowMs } from "../useChainNow";
import { HISTORY } from "./copy";
import { HistoryReceipt } from "./HistoryReceipt";
import { HistoryRow } from "./HistoryRow";
import type { HistoryReading } from "./useHistoryReading";

/** The reference shows eight settled rows before asking (`HISTORY_ROWS`). */
const FIRST_PAGE = 8;

interface HistoryRowsProps {
  history: HistoryReading;
  symbol: string | undefined;
}

const isEmpty = (value: WalletHistory) => value.rounds.length === 0;

/**
 * Settled Windows under the open bets, as the reference lists them in one panel. Every row is a
 * derived round, so the list can only be as complete as the reading says it is — a capped
 * history says so above the rows rather than trimming quietly.
 */
export function HistoryRows({ history, symbol }: HistoryRowsProps) {
  const nowMs = useChainNowMs();
  const [expanded, setExpanded] = useState(false);
  const [receiptFor, setReceiptFor] = useState<SettledRound | null>(null);

  return (
    <ReadingBoundary reading={history.reading} shape="row" retry={history.retry} isEmpty={isEmpty} empty={HISTORY.empty}>
      {(value) => {
        const rows = expanded ? value.rounds : value.rounds.slice(0, FIRST_PAGE);
        return (
          <div className="flex flex-col gap-2">
            {!value.complete && <p className="type-caption text-warning">{HISTORY.partial}</p>}
            <ul className="flex flex-col">
              {rows.map((round) => (
                <HistoryRow key={round.marketId} round={round} symbol={symbol} nowMs={nowMs} onReceipt={setReceiptFor} />
              ))}
            </ul>
            {value.rounds.length > FIRST_PAGE && (
              <button type="button" onClick={() => setExpanded((v) => !v)} data-cursor="hover" className="self-start type-caption text-accent">
                {expanded ? HISTORY.showFewer : HISTORY.showAll(value.rounds.length)}
              </button>
            )}
            <HistoryReceipt round={receiptFor} symbol={symbol ?? ""} onClose={() => setReceiptFor(null)} />
          </div>
        );
      }}
    </ReadingBoundary>
  );
}
