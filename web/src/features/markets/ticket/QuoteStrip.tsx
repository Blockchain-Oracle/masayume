"use client";

import type { Reading } from "@masayume/core/schemas";
import type { Quote, Side } from "@masayume/core/types";
import { formatBaseUnits } from "@masayume/core/units";
import type { ReactNode } from "react";
import { Money, Odds } from "@/components/data";
import { ErrorState, LoadingState } from "@/components/states";
import { TICKET } from "@/lib/copy";
import { SIDE_WORD } from "../side-styles";

interface QuoteStripProps {
  reading: Reading<Quote | null> | null;
  quote: Quote | null;
  stale: boolean;
  pending: boolean;
  stakeBase: bigint;
  side: Side | null;
  decimals: number;
  symbol: string;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="contents">
      <dt className="type-caption text-ink-secondary">{label}</dt>
      <dd className="type-data text-ink text-right">{children}</dd>
    </div>
  );
}

/** Cost · payout if right · max loss, all from a real book quote for the actual size — never a midpoint (FR-8). */
export function QuoteStrip({ reading, quote, stale, pending, stakeBase, side, decimals, symbol }: QuoteStripProps) {
  if (side === null || stakeBase === 0n) return <p className="type-caption text-ink-muted">{TICKET.enterStake}</p>;
  if (reading && !reading.ok) return <ErrorState diagnosis={reading.error} />;
  if (!quote) return pending || reading === null ? <LoadingState shape="row" /> : <p className="type-caption text-ink-secondary">{TICKET.noLiquidity}</p>;

  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
        <Row label={TICKET.cost}>
          <Money value={quote.expectedCostBase} decimals={decimals} symbol={symbol} />
        </Row>
        <Row label={TICKET.payoutIfRight(SIDE_WORD[side])}>
          <Money value={quote.payoutIfRightBase} decimals={decimals} symbol={symbol} />
        </Row>
        <Row label={TICKET.maxLoss}>
          <Money value={quote.maxCostBase} decimals={decimals} symbol={symbol} />
        </Row>
        <Row label={TICKET.odds}>
          <Odds bps={quote.avgPriceBps} />
        </Row>
      </dl>
      {quote.partial && <p className="type-caption text-warning">{TICKET.partial(`${formatBaseUnits(quote.fillableStakeBase, decimals)} ${symbol}`)}</p>}
      {(stale || pending) && (
        <p className="type-caption text-warning" role="status">
          {TICKET.requoting}
        </p>
      )}
    </div>
  );
}
