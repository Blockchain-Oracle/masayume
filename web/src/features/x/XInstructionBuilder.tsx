"use client";

import { noEntryCutoffSec } from "@masayume/core/lifecycle";
import { ENTRY_BUFFER_SEC } from "@masayume/core/constants";
import { formatBaseUnits, formatUtc, parseDecimalToBaseUnits } from "@masayume/core/units";
import type { EventMarket } from "@masayume/core/types";
import { selectXWindow, X_CADENCES, xRefusalCopy, type XAsset } from "@masayume/core/x";
import { marketsProvider } from "@masayume/markets";
import { useLanes, useTick } from "@masayume/markets/react";
import { useState } from "react";
import { useVenue } from "@/features/markets/useVenue";
import { X_HANDLE } from "./copy";

interface BuilderProps {
  enabled: boolean;
  balanceBase: bigint | null;
  decimals: number;
  symbol: string;
}

export function XInstructionBuilder(props: BuilderProps) {
  const { venueId } = useVenue();
  const lanes = useLanes(venueId);
  useTick(1000);
  return <XInstructionBuilderView {...props} markets={lanes?.ok && !lanes.stale ? lanes.value.lanes.flatMap(l => l.markets) : null}
    unavailable={Boolean(lanes && (!lanes.ok || lanes.stale))} nowMs={marketsProvider.nowMs()} />;
}

/** Uses the relay's exact selection rule; copying never sends an order. */
export function XInstructionBuilderView({ enabled, balanceBase, decimals, symbol, markets, unavailable, nowMs }: BuilderProps & {
  markets: readonly EventMarket[] | null; unavailable: boolean; nowMs: number;
}) {
  const [asset, setAsset] = useState<XAsset>("BTC");
  const [side, setSide] = useState("up");
  const [amount, setAmount] = useState("5");
  const [cadence, setCadence] = useState<keyof typeof X_CADENCES>("5m");
  const [copied, setCopied] = useState("");
  const selection = markets ? selectXWindow(markets, { asset, intervalSec: X_CADENCES[cadence] }, nowMs) : null;
  const stake = parseDecimalToBaseUnits(amount, decimals);
  const amountError = !stake || stake <= 0n ? "Enter a positive amount." : balanceBase !== null && stake > balanceBase
    ? `Your X balance is ${formatBaseUnits(balanceBase, decimals)} ${symbol}. Use a smaller amount or add funds.` : "";
  const instruction = `${X_HANDLE} ${asset} ${side.toUpperCase()} ${amount} ${cadence}`;
  const canCopy = enabled && selection?.ok && !amountError;
  const status = selection?.ok ? `Entries close at ${formatUtc(noEntryCutoffSec(selection.market.expirySec, selection.market.intervalSec) * 1000, { withSeconds: true })}.`
    : selection ? xRefusalCopy({ refusalCode: selection.code, entryClosesAtSec: selection.market ? noEntryCutoffSec(selection.market.expirySec, selection.market.intervalSec) : null,
      nextWindowAtSec: selection.code === "window-not-started" ? selection.market?.tradingStartSec : null }).detail
    : unavailable ? "Live Windows could not be checked. Try again shortly." : "Checking live Windows…";
  const copy = async () => {
    if (!canCopy) return;
    try { await navigator.clipboard.writeText(instruction); setCopied(instruction); }
    catch { setCopied("Copy failed. Select the instruction text and copy it."); }
  };
  return <section id="x-instruction" className="xw xw-permission" aria-label="Build an X instruction">
    <h2 className="xw-slab-title">Build your X instruction</h2>
    <p className="xw-slab-body">Choose an asset, direction, amount and timeframe. UP and LONG mean the same thing; DOWN and SHORT also work.</p>
    <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
      <label className="xw-source">Asset<select value={asset} onChange={e => setAsset(e.target.value as XAsset)}><option>BTC</option><option>ETH</option></select></label>
      <label className="xw-source">Direction<select value={side} onChange={e => setSide(e.target.value)}><option value="up">UP / LONG</option><option value="down">DOWN / SHORT</option></select></label>
      <label className="xw-source">Amount ({symbol})<input className="xw-instruction-amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} /></label>
      <label className="xw-source">Timeframe<select value={cadence} onChange={e => setCadence(e.target.value as keyof typeof X_CADENCES)}>
        {Object.entries(X_CADENCES).map(([name, intervalSec]) => <option key={name} value={name}>{name}{markets ? selectXWindow(markets, { asset, intervalSec }, nowMs).ok ? " · entries open" : " · unavailable" : ""}</option>)}
      </select></label>
    </div>
    <p className="xw-slab-body" role="status">{status}</p>
    <p className="xw-slab-note">Entry closes {ENTRY_BUFFER_SEC} seconds before the Window ends. X delivery takes time, so send before the cutoff. Availability is checked again when your mention arrives.</p>
    <code className="xw-instruction-code">{instruction}</code>
    {amountError && <p className="xw-err">{amountError}</p>}
    {!enabled && <p className="xw-slab-note">Complete wallet, funding and X setup above before sending a trade.</p>}
    <button className="xw-btn-v" type="button" disabled={!canCopy} onClick={() => void copy()}>{copied === instruction ? "Copied" : "Copy instruction"}</button>
    {copied.startsWith("Copy failed") && <p className="xw-err">{copied}</p>}
  </section>;
}
