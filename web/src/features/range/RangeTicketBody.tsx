"use client";

import type { BlockerContext, BlockerKind } from "@masayume/core/copy";
import type { MarketPhase } from "@masayume/core/lifecycle";
import type { RangeReserveState } from "@masayume/core/range";
import { RANGE_STAKE_HEADROOM_BPS } from "@masayume/core/range";
import { belowMinStake, minStakeBase } from "@masayume/core/sizing";
import type { EventMarket, Hex } from "@masayume/core/types";
import { formatBaseUnits, mulBpsCeil } from "@masayume/core/units";
import { txUrl } from "@masayume/core/urls";
import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { Money } from "@/components/data";
import { BlockedButton, ErrorState } from "@/components/states";
import { diagnosisCopy } from "@/lib/copy";
import { notify } from "@/lib/toast";
import type { WalletSession } from "@/lib/wallet-session";
import { useOracleSpot } from "../markets/hero/useOracleSpot";
import { QuickChips } from "../markets/ticket/QuickChips";
import { StakeInput } from "../markets/ticket/StakeInput";
import { BandControl } from "./BandControl";
import { RANGE } from "./copy";
import { formatProbE6, usd0 } from "./format";
import { useRangeDraft } from "./useRangeDraft";
import { useRangeQuote } from "./useRangeQuote";
import { useRangeWrites } from "./useRangeWrites";
import "./range-band.css";

interface RangeTicketBodyProps {
  market: EventMarket;
  nowMs: number;
  phase: MarketPhase | null;
  decimals: number;
  symbol: string;
  reserve: RangeReserveState;
  stakeText: string;
  stakeBase: bigint;
  onStakeText: (text: string) => void;
  onStakeBase: (base: bigint) => void;
  /** Wallet spendable plus venue credit; null until the balance sheet has answered. */
  availableBase: bigint | null;
  session: WalletSession;
  hasSigner: boolean;
}

const PHASE_BLOCKERS: Partial<Record<MarketPhase, BlockerKind>> = {
  upcoming: "upcoming",
  pendingOpeningPrint: "pending-opening-print",
  noEntryBuffer: "no-entry-buffer",
  locked: "locked",
  settledUnclaimed: "locked",
  finalized: "locked",
  voided: "locked",
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="contents">
      <dt className="type-caption text-ink-secondary">{label}</dt>
      <dd className="type-data text-ink text-right">{children}</dd>
    </div>
  );
}

/**
 * The Ticket's range mode (`Ticket624Drawer.tsx` range branch): the band around the live price, the
 * stake, the reserve's own quote, and the vermilion "Place RANGE" control. Inside only, as the reference;
 * the game page offers outside too.
 */
export function RangeTicketBody(p: RangeTicketBodyProps) {
  const { market, nowMs, phase, decimals, symbol, reserve, stakeText, stakeBase, onStakeText, onStakeBase, availableBase, session, hasSigner } = p;
  const spot = useOracleSpot(market.asset);
  const draft = useRangeDraft(spot, market.intervalSec);
  const writes = useRangeWrites();
  const [placed, setPlaced] = useState<{ txHash: Hex; band: string } | null>(null);
  const band = draft.lowPrint !== null && draft.highPrint !== null ? { marketId: market.marketId, asset: market.asset, side: "inside" as const, lowPrint: draft.lowPrint, highPrint: draft.highPrint } : null;
  const quoteState = useRangeQuote({
    band,
    expirySec: market.expirySec,
    mode: { kind: "fixStake", stakeBase },
    params: reserve.params,
    enabled: hasSigner && phase === "trading" && !reserve.paused && !draft.dragging,
  });
  const { quote } = quoteState;

  const blocker = ((): BlockerKind | null => {
    if (!session.isConnected) return session.isConnecting ? "connecting" : "disconnected";
    if (!session.isRightChain) return "wrong-chain";
    if (!hasSigner) return "connecting";
    if (writes.busy === "open") return "placing";
    if (phase === null) return "syncing";
    const phaseBlocker = PHASE_BLOCKERS[phase];
    if (phaseBlocker) return phaseBlocker;
    if (availableBase === 0n) return "no-funds";
    if (band === null) return "quoting";
    if (stakeBase === 0n) return "no-stake";
    if (belowMinStake(stakeBase, decimals)) return "below-min-stake";
    if (availableBase !== null && stakeBase > availableBase) return "over-balance";
    if (quoteState.error) return "quote-refused";
    if (quoteState.loading || !quote) return "quoting";
    return null;
  })();
  const ctx: BlockerContext = { minStakeText: `${formatBaseUnits(minStakeBase(decimals), decimals, { minDp: 0 })} ${symbol}` };

  const place = useCallback(async () => {
    if (!band || !quote) return;
    const bandText = `${usd0(band.lowPrint)} – ${usd0(band.highPrint)}`;
    const outcome = await writes.open({ ...band, maxPayoutBase: quote.maxPayoutBase, maxStakeBase: mulBpsCeil(quote.stakeBase, 10_000 + RANGE_STAKE_HEADROOM_BPS) });
    if (!outcome) return;
    if (outcome.status === "confirmed") {
      setPlaced({ txHash: outcome.txHash, band: bandText });
      return;
    }
    if (outcome.status === "requote") {
      notify.warning(diagnosisCopy("requote").headline, RANGE.ticket.requote(formatBaseUnits(outcome.stakeBase, decimals), symbol));
      quoteState.retry();
      return;
    }
    const copy = diagnosisCopy(outcome.diagnosis.kind);
    notify.warning(copy.headline, outcome.diagnosis.technical || copy.body);
  }, [band, quote, writes, decimals, symbol, quoteState]);

  if (placed) {
    return (
      <div className="flex flex-col gap-3" role="status">
        <p className="type-body text-ink">{RANGE.cta.placed(placed.band)}</p>
        <a href={txUrl(placed.txHash)} target="_blank" rel="noopener noreferrer" className="type-caption text-ink-secondary underline">
          {RANGE.ticket.viewTx}
        </a>
        <div className="flex items-center justify-between gap-3">
          <Link href="/games/range" className="type-caption text-vermilion underline">
            {RANGE.cta.rounds}
          </Link>
          <button type="button" onClick={() => setPlaced(null)} className="type-caption text-ink-secondary underline" data-cursor="hover">
            {RANGE.cta.another}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <BandControl asset={market.asset} intervalSec={market.intervalSec} draft={draft} side="inside" />
      <StakeInput value={stakeText} onChange={onStakeText} decimals={decimals} symbol={symbol} costBase={quote?.stakeBase ?? null} />
      <QuickChips availableBase={availableBase} decimals={decimals} onPick={onStakeBase} />
      {quoteState.error ? (
        <ErrorState diagnosis={quoteState.error} retry={quoteState.retry} />
      ) : quote ? (
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          <Row label={RANGE.ticket.youPay}>
            <Money value={quote.stakeBase} decimals={decimals} symbol={symbol} />
          </Row>
          <Row label={RANGE.ticket.youWin}>
            <Money value={quote.maxPayoutBase} decimals={decimals} symbol={symbol} />
          </Row>
          <Row label={RANGE.ticket.pays}>{`${formatProbE6(quote.insideProbE6)}% inside`}</Row>
          <Row label="">
            <span className="type-caption text-ink-muted">{RANGE.ticket.upTo(formatBaseUnits(mulBpsCeil(quote.stakeBase, 10_000 + RANGE_STAKE_HEADROOM_BPS), decimals), symbol)}</span>
          </Row>
        </dl>
      ) : (
        <p className="type-caption text-ink-muted">{RANGE.ticket.needBand}</p>
      )}
      <BlockedButton blocker={blocker} ctx={ctx} tone="primary" size="lg" className="w-full" onClick={() => void place()}>
        {draft.lowUsd !== null && draft.highUsd !== null ? RANGE.cta.place(usd0(draft.lowPrint as bigint), usd0(draft.highPrint as bigint)) : RANGE.cta.placePlain}
      </BlockedButton>
      <p className="type-caption text-ink-muted">
        {RANGE.cta.footnote} {reserve.paused ? RANGE.ticket.reservePaused : null}
      </p>
      <span className="sr-only" aria-live="polite">
        {nowMs > 0 && quote ? `${formatBaseUnits(quote.stakeBase, decimals)} ${symbol}` : ""}
      </span>
    </>
  );
}
