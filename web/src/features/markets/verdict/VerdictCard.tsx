"use client";

import { OUTCOME_TO_SIDE, type EventMarket, type Resolution, type Verdict } from "@masayume/core/types";
import { formatBaseUnits, secToMs, shortHex } from "@masayume/core/units";
import { oracleGraphUrl, txUrl } from "@masayume/core/urls";
import { Money } from "@/components/data";
import { Receipt, ReceiptRow } from "@/components/receipt";
import { oraclePriceText } from "@/features/markets/hero";
import { MARKETS, VERDICT_UI, formatCadence, verdictAnnouncement, verdictStrings } from "@/lib/copy";
import { PnlFigure } from "./PnlFigure";
import { ShareButton } from "./ShareButton";
import { useAnnounceOnce } from "./useAnnounceOnce";
import { VerdictLegs } from "./VerdictLegs";
import { VerdictStamp } from "./VerdictStamp";

export type VerdictMarket = Pick<EventMarket, "marketId" | "asset" | "intervalSec" | "expirySec" | "openingPriceRaw">;

export interface VerdictCardProps {
  verdict: Verdict;
  market: VerdictMarket;
  /** null while the settlement record is still landing; the receipt then shows its proof rows as pending. */
  resolution: Resolution | null;
  symbol: string;
}

const SIDE_WORD = { up: MARKETS.up, down: MARKETS.down } as const;

function windowLine(market: VerdictMarket, verdict: Verdict): string {
  const sides = verdict.legs.map((leg) => SIDE_WORD[OUTCOME_TO_SIDE[leg.outcomeIdx]]).join(" + ");
  return `${market.asset} · ${formatCadence(market.intervalSec)} · ${sides}`;
}

/** Settlement as an unambiguous stamped verdict: 正夢 in gold, 逆夢 as a fact, 無効 with its reason — and the receipt to audit it (FR-10). */
export function VerdictCard({ verdict, market, resolution, symbol }: VerdictCardProps) {
  const strings = verdictStrings(verdict.outcome);
  const announced = useAnnounceOnce(verdictAnnouncement(verdict.outcome, `${formatBaseUnits(verdict.pnlBase, verdict.decimals, { signed: true })} ${symbol}`));
  const settledAtMs = verdict.settledAtMs ?? resolution?.settledAtMs ?? secToMs(market.expirySec);
  const settlementTx = resolution?.settlementTxHash ?? null;
  const questionId = resolution?.oracleQuestionId ?? null;

  return (
    <article
      aria-label={`${VERDICT_UI.title}: ${strings.line}`}
      className="flex flex-col gap-5 rounded-(--market-card-radius) border border-(--market-card-border) bg-(--market-card-surface) p-4"
    >
      <span role="status" aria-live="polite" className="sr-only">
        {announced}
      </span>
      <header className="flex items-start justify-between gap-4">
        <VerdictStamp outcome={verdict.outcome} />
        <PnlFigure verdict={verdict} symbol={symbol} />
      </header>
      {verdict.outcome === "void" && <p className="type-body text-ink-secondary">{strings.line}</p>}
      <VerdictLegs legs={verdict.legs} decimals={verdict.decimals} symbol={symbol} />
      <Receipt
        title={VERDICT_UI.receiptTitle}
        figure={<Money value={verdict.payoutBase} decimals={verdict.decimals} symbol={symbol} className="text-cream-ink" />}
        figureLabel={VERDICT_UI.paidOut}
        settledAtMs={settledAtMs}
        stamp={<VerdictStamp outcome={verdict.outcome} size="compact" />}
      >
        <ReceiptRow label={VERDICT_UI.window}>{windowLine(market, verdict)}</ReceiptRow>
        <ReceiptRow label={VERDICT_UI.openingPrint}>{oraclePriceText(resolution?.openingRaw ?? market.openingPriceRaw)}</ReceiptRow>
        <ReceiptRow label={VERDICT_UI.closingPrint}>{oraclePriceText(resolution?.closingRaw ?? null)}</ReceiptRow>
        <ReceiptRow label={VERDICT_UI.settlementTx} href={settlementTx ? txUrl(settlementTx) : null} degradedLabel={VERDICT_UI.pendingTx}>
          {settlementTx ? shortHex(settlementTx, 10, 4) : "—"}
        </ReceiptRow>
        <ReceiptRow label={VERDICT_UI.oracleGraph} href={questionId ? oracleGraphUrl(questionId) : null} degradedLabel={VERDICT_UI.noQuestion}>
          {questionId ? VERDICT_UI.question(questionId) : "—"}
        </ReceiptRow>
      </Receipt>
      <div className="flex justify-end">
        <ShareButton marketId={verdict.marketId} />
      </div>
    </article>
  );
}
