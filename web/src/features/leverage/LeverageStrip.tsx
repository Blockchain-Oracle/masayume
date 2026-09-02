"use client";

import type { LeverageQuote } from "@masayume/core/leverage";
import type { Diagnosis, Side } from "@masayume/core/types";
import { formatBaseUnits, priceRawToBps } from "@masayume/core/units";
import type { ReactNode } from "react";
import { Money, Odds } from "@/components/data";
import { ErrorState, LoadingState } from "@/components/states";
import { TICKET } from "@/lib/copy";
import { SIDE_WORD } from "../markets/side-styles";
import { LEVERAGE } from "./copy";

interface LeverageStripProps {
  quote: LeverageQuote | null;
  loading: boolean;
  error: Diagnosis | null;
  retry: () => void;
  stakeBase: bigint;
  side: Side | null;
  multiple: number;
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

/**
 * The quote strip for a boost — the plain strip's rows (`QuoteStrip`) on the reserve's own numbers, then
 * the reference's one sentence ("L× can knock out before expiry.") and, under it, what the reference never
 * showed: what the reserve fronts, its fee and the line it knocks out at. Every figure is the chain's
 * `sizeForStake` for this stake right now, never an estimate.
 */
export function LeverageStrip({ quote, loading, error, retry, stakeBase, side, multiple, decimals, symbol }: LeverageStripProps) {
  if (side === null || stakeBase === 0n) return <p className="type-caption text-ink-muted">{TICKET.enterStake}</p>;
  if (error) return <ErrorState diagnosis={error} retry={retry} />;
  if (!quote) return loading ? <LoadingState shape="row" /> : <p className="type-caption text-ink-secondary">{TICKET.noLiquidity}</p>;
  const money = (base: bigint) => formatBaseUnits(base, decimals);

  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
        <Row label={TICKET.cost}>
          <Money value={quote.stakeBase} decimals={decimals} symbol={symbol} />
        </Row>
        <Row label={LEVERAGE.strip.exposure}>
          <Money value={quote.stakeBase + quote.frontedBase} decimals={decimals} symbol={symbol} />
        </Row>
        <Row label={TICKET.payoutIfRight(SIDE_WORD[side])}>
          <Money value={quote.winIfRightBase} decimals={decimals} symbol={symbol} />
        </Row>
        <Row label={TICKET.maxLoss}>
          <Money value={quote.stakeBase} decimals={decimals} symbol={symbol} />
        </Row>
        <Row label={TICKET.odds}>
          <Odds bps={priceRawToBps(quote.priceRaw, decimals)} />
        </Row>
      </dl>
      <p className="tk-lev-note">{LEVERAGE.strip.knockout(multiple)}</p>
      <p className="type-caption text-ink-secondary">
        {LEVERAGE.strip.terms(money(quote.frontedBase), money(quote.premiumBase), symbol)} {LEVERAGE.strip.line(money(quote.lineBase), symbol)}
      </p>
      {quote.stakeBase < stakeBase && <p className="type-caption text-warning">{LEVERAGE.strip.sized(money(quote.stakeBase), symbol)}</p>}
    </div>
  );
}
