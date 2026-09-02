"use client";

import type { RangeMode, RangeReserveState, RangeSide } from "@masayume/core/range";
import { isOk } from "@masayume/core/schemas";
import type { EventMarket, Hex, MarketId } from "@masayume/core/types";
import { formatBaseUnits, parseDecimalToBaseUnits } from "@masayume/core/units";
import { formatCadence } from "@masayume/core/market";
import { useBalanceSheet } from "@masayume/markets/react";
import { Target, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Countdown } from "@/components/data";
import { diagnosisCopy } from "@/lib/copy";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useWalletSession } from "@/lib/wallet-session";
import { useOracleSpot } from "../markets/hero/useOracleSpot";
import { useChainNowMs } from "../markets/useChainNow";
import { ConnectButton } from "../markets/wallet";
import type { PlaceStep } from "../parlay/TicketParts";
import { BandControl } from "./BandControl";
import { RANGE } from "./copy";
import { usd0 } from "./format";
import { RangeTicket, type SolveMode } from "./RangeTicket";
import { useRangeDraft } from "./useRangeDraft";
import { useRangeQuote } from "./useRangeQuote";
import { useRangeWindows } from "./useRangeWindows";
import { useRangeWrites } from "./useRangeWrites";

const SUCCESS_RESET_MS = 3_500;

interface RangeBuilderProps {
  reserve: RangeReserveState;
  symbol: string;
}

function WindowRow({ market, on, nowMs, onPick }: { market: EventMarket; on: boolean; nowMs: number; onPick: (id: MarketId) => void }) {
  const { builder } = RANGE;
  return (
    <button type="button" onClick={() => onPick(market.marketId)} className={cn("pl-menu-item", on && "pl-menu-item--on")} aria-pressed={on} data-cursor="hover">
      <span>
        {market.asset} {formatCadence(market.intervalSec)} · {market.openingPriceRaw !== null ? `${builder.opening} ${usd0(market.openingPriceRaw)}` : builder.openingPending}
      </span>
      <span className="pl-menu-when">
        <Countdown expirySec={market.expirySec} intervalSec={market.intervalSec} nowMs={nowMs} />
      </span>
    </button>
  );
}

/** The Window plate on the left, the band and the ticket on the right; the quote is the reserve's own. */
export function RangeBuilder({ reserve, symbol }: RangeBuilderProps) {
  const { address } = useWalletSession();
  const nowMs = useChainNowMs();
  const { windows, byId, loading: windowsLoading } = useRangeWindows(nowMs, reserve.params.minTimeLeftSec);
  const sheet = useBalanceSheet(address);
  const writes = useRangeWrites();
  const { decimals, params } = reserve;

  const [marketId, setMarketId] = useState<MarketId | null>(null);
  const [side, setSide] = useState<RangeSide>("inside");
  const [solveMode, setSolveMode] = useState<SolveMode>("fixStake");
  const [stakeInput, setStakeInput] = useState("5");
  const [payoutInput, setPayoutInput] = useState("20");
  const [step, setStep] = useState<PlaceStep>("idle");
  const [errorTitle, setErrorTitle] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [txHash, setTxHash] = useState<Hex | null>(null);

  // The soonest Window is the default; a Window that leaves the list hands over to the next.
  const picked = (marketId && byId.get(marketId)) || windows[0] || null;
  useEffect(() => {
    if (picked && picked.marketId !== marketId) setMarketId(picked.marketId);
  }, [picked, marketId]);

  const spot = useOracleSpot(picked?.asset ?? null);
  const draft = useRangeDraft(spot, picked?.intervalSec ?? 300);
  const band = picked && draft.lowPrint !== null && draft.highPrint !== null ? { marketId: picked.marketId, asset: picked.asset, side, lowPrint: draft.lowPrint, highPrint: draft.highPrint } : null;

  const stakeBase = parseDecimalToBaseUnits(stakeInput || "0", decimals) ?? 0n;
  const payoutBase = parseDecimalToBaseUnits(payoutInput || "0", decimals) ?? 0n;
  const mode: RangeMode = solveMode === "fixStake" ? { kind: "fixStake", stakeBase } : { kind: "fixPayout", maxPayoutBase: payoutBase };
  const quoteState = useRangeQuote({ band, expirySec: picked?.expirySec ?? null, mode, params, enabled: band !== null && !reserve.paused && !draft.dragging });
  const { quote } = quoteState;
  const walletSpendableBase = sheet && isOk(sheet) ? sheet.value.spendableBase : null;

  const reset = useCallback(() => {
    setStep("idle");
    setErrorTitle("");
    setErrorDetail("");
  }, []);

  const handlePlace = useCallback(async () => {
    if (!address || !quote || !band) return;
    setErrorTitle("");
    setErrorDetail("");
    setTxHash(null);
    setStep("placing");
    const outcome = await writes.open({ ...band, maxPayoutBase: quote.maxPayoutBase, maxStakeBase: quote.stakeBase });
    if (!outcome) {
      setStep("idle");
      return;
    }
    if (outcome.status === "confirmed") {
      setTxHash(outcome.txHash);
      setStep("success");
      notify.neutral(RANGE.ticket.toast(`${band.side} ${usd0(band.lowPrint)} – ${usd0(band.highPrint)}`, formatBaseUnits(outcome.stakeBase, decimals), formatBaseUnits(quote.maxPayoutBase, decimals, { maxDp: 0, minDp: 0 }), symbol));
      setTimeout(() => setStep("idle"), SUCCESS_RESET_MS);
      return;
    }
    setStep("error");
    if (outcome.status === "requote") {
      setErrorTitle(diagnosisCopy("requote").headline);
      setErrorDetail(RANGE.ticket.requote(formatBaseUnits(outcome.stakeBase, decimals), symbol));
      quoteState.retry();
      return;
    }
    const copy = diagnosisCopy(outcome.diagnosis.kind);
    setErrorTitle(copy.headline);
    setErrorDetail(outcome.diagnosis.technical);
    if ("txHash" in outcome && outcome.txHash) setTxHash(outcome.txHash);
  }, [address, quote, band, writes, decimals, symbol, quoteState]);

  if (!address) {
    return (
      <div className="pl-connect">
        <Wallet className="pl-connect-icon" />
        <p className="pl-connect-title">{RANGE.connect.title}</p>
        <p className="pl-connect-sub">{RANGE.connect.sub}</p>
        <div className="pl-connect-cta">
          <ConnectButton />
        </div>
      </div>
    );
  }

  const { builder } = RANGE;
  return (
    <div className="pl-grid">
      <div className="pl-plate">
        <div className="pl-plate-head">
          <div className="pl-plate-title">
            <Target />
            <span className="pl-plate-name">{builder.yourWindow}</span>
          </div>
        </div>
        <div className="pl-plate-body">
          {windowsLoading && windows.length === 0 ? (
            <div className="pl-loading">{builder.loading}</div>
          ) : windows.length === 0 ? (
            <div className="pl-empty">
              <p className="pl-empty-title">{builder.noWindows}</p>
              <p className="pl-empty-body">{builder.noWindowsBody}</p>
            </div>
          ) : (
            <div className="rg-windows" role="radiogroup" aria-label={builder.pickWindow}>
              {windows.map((w) => (
                <WindowRow key={w.marketId} market={w} on={picked?.marketId === w.marketId} nowMs={nowMs} onPick={setMarketId} />
              ))}
            </div>
          )}
          {picked && <BandControl asset={picked.asset} intervalSec={picked.intervalSec} draft={draft} side={side} onSide={setSide} />}
        </div>
      </div>

      <RangeTicket
        window={picked}
        side={side}
        lowUsd={draft.lowUsd}
        highUsd={draft.highUsd}
        reserve={reserve}
        symbol={symbol}
        nowMs={nowMs}
        quote={quote}
        quoteLoading={quoteState.loading}
        quoteError={quoteState.error}
        onRetryQuote={quoteState.retry}
        solveMode={solveMode}
        onSolveMode={setSolveMode}
        stakeInput={stakeInput}
        onStakeInput={setStakeInput}
        payoutInput={payoutInput}
        onPayoutInput={setPayoutInput}
        walletSpendableBase={walletSpendableBase}
        step={step}
        errorTitle={errorTitle}
        errorDetail={errorDetail}
        txHash={txHash}
        onPlace={handlePlace}
        onReset={reset}
      />
    </div>
  );
}
