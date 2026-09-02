"use client";

import type { LeverageQuote } from "@masayume/core/leverage";
import type { Diagnosis, Side } from "@masayume/core/types";
import { formatBaseUnits, priceRawToBps } from "@masayume/core/units";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { Money, Odds, Odometer } from "@/components/data";
import { ErrorState, LoadingState } from "@/components/states";
import { TICKET } from "@/lib/copy";
import { SIDE_WORD } from "../markets/side-styles";
import { LEVERAGE } from "./copy";
import { KnockoutMeter } from "./KnockoutMeter";
import "./boost-card.css";

interface BoostCardProps {
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

const RISE = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };
const SPRING = { type: "spring" as const, stiffness: 120, damping: 24 };

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="boost-fact">
      <dt className="boost-k">{label}</dt>
      <dd className="boost-v">{children}</dd>
    </div>
  );
}

/**
 * The boost as a breakdown card — the user's 2026-09-02 redesign call over the reference's flat strip
 * (`Ticket624Drawer.tsx` L1093–1121): the multiple up top with the line it knocks out at, a bar showing
 * whose money is in the position, the payout if right as the one big figure (it rolls to the chain's
 * reading), the facts beneath, the knock-out meter, and the reference's sentence. Every number is the
 * chain's `sizeForStake` for this stake right now, never an estimate. Motion honours reduced-motion.
 */
export function BoostCard({ quote, loading, error, retry, stakeBase, side, multiple, decimals, symbol }: BoostCardProps) {
  const reduced = useReducedMotion();
  if (side === null || stakeBase === 0n) return <p className="type-caption text-ink-muted">{TICKET.enterStake}</p>;
  if (error) return <ErrorState diagnosis={error} retry={retry} />;
  if (!quote) return loading ? <LoadingState shape="row" /> : <p className="type-caption text-ink-secondary">{TICKET.noLiquidity}</p>;

  const money = (base: bigint) => formatBaseUnits(base, decimals);
  const exposure = quote.stakeBase + quote.frontedBase;
  const yoursPct = exposure === 0n ? 100 : Number((quote.stakeBase * 10_000n) / exposure) / 100;
  const { card } = LEVERAGE;

  return (
    <motion.section className="boost" aria-label={card.boost} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={RISE}>
      <header className="boost-head">
        <span className="boost-x">
          <span className="boost-x-num">{multiple}</span>×
        </span>
        <span className="boost-k">{card.boost}</span>
        <span className="boost-line">{card.knocksOutAt(money(quote.lineBase), symbol)}</span>
      </header>

      <div className="boost-bar" aria-hidden>
        <motion.span className="boost-bar-you" initial={reduced ? false : { width: 0 }} animate={{ width: `${yoursPct}%` }} transition={SPRING} />
        <motion.span className="boost-bar-reserve" initial={reduced ? false : { width: 0 }} animate={{ width: `${100 - yoursPct}%` }} transition={SPRING} />
      </div>
      <div className="boost-bar-legend">
        <span>
          {card.you} <Money value={quote.stakeBase} decimals={decimals} symbol={symbol} />
        </span>
        <span>
          {card.reserve} <Money value={quote.frontedBase} decimals={decimals} /> · {card.fee} <Money value={quote.premiumBase} decimals={decimals} />
        </span>
      </div>

      <div className="boost-hero">
        <span className="boost-k">{TICKET.payoutIfRight(SIDE_WORD[side])}</span>
        <div className="boost-figure">
          <Odometer value={quote.winIfRightBase} decimals={decimals} className="boost-figure-num" />
          <span className="boost-figure-unit">{symbol}</span>
        </div>
      </div>
      <dl className="boost-facts">
        <Fact label={TICKET.maxLoss}>
          <Money value={quote.stakeBase} decimals={decimals} />
        </Fact>
        <Fact label={LEVERAGE.strip.exposure}>
          <Money value={exposure} decimals={decimals} />
        </Fact>
        <Fact label={TICKET.odds}>
          <Odds bps={priceRawToBps(quote.priceRaw, decimals)} />
        </Fact>
      </dl>

      <KnockoutMeter entryBase={quote.costBase} lineBase={quote.lineBase} markBase={null} knockable={false} decimals={decimals} symbol={symbol} />
      <p className="tk-lev-note">
        {LEVERAGE.strip.knockout(multiple)} {card.how}
      </p>
      {quote.stakeBase < stakeBase && <p className="type-caption text-warning">{LEVERAGE.strip.sized(money(quote.stakeBase), symbol)}</p>}
    </motion.section>
  );
}
