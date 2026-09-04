"use client";

import { collateralOrNull } from "@masayume/markets";
import { useState } from "react";
import { ConnectButton } from "@/features/markets/wallet";
import { useWalletSession } from "@/lib/wallet-session";
import { FUNDING } from "./copy";
import { openFunds } from "./credited";
import "./funding.css";

/** The reference's presets, and its per-request cap. */
const PRESETS = [5, 10, 25] as const;
const CAP = 50;

/**
 * `/fund` — the reference's card on-ramp (`app/fund/page.tsx`): you say how much you want, the card is
 * charged the derived cost, and the funds land in your own wallet. Its two dependencies — a Paystack test
 * key and a treasury that credits the preview — are not on this deployment, so the page keeps the
 * reference's shape and says so on the button instead of simulating a payment. It is reachable only from
 * the Add-money modal, as in the reference, which removed its nav slot for exactly this reason.
 */
export function FundPage() {
  const { address } = useWalletSession();
  const symbol = collateralOrNull()?.symbol ?? "tUSDC";
  const [amount, setAmount] = useState("10");
  const want = Math.max(0, Number(amount) || 0);
  const shown = Math.min(want, CAP);

  return (
    <main className="fund-page">
      <div className="fund-page-eyebrow">{FUNDING.fund.eyebrow}</div>
      <h1 className="fund-page-title">
        {FUNDING.fund.title} <span className="text-vermilion">{FUNDING.fund.titleAccent}</span>
      </h1>
      <p className="fund-page-body">{FUNDING.fund.body(symbol)}</p>

      <div className="fund-card">
        <div className="fund-amt">
          <div className="fund-amt-label">{FUNDING.fund.youGet}</div>
          <div className="fund-amt-field">
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" className="fund-amt-input" aria-label={`Amount of ${symbol}`} />
            <span className="fund-amt-unit">{symbol}</span>
          </div>
          <div className="fund-presets">
            {PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => setAmount(String(p))} className="fund-preset" data-cursor="hover">
                {FUNDING.fund.preset(p, symbol)}
              </button>
            ))}
          </div>
        </div>

        <div className="fund-pay">
          <span className="fund-pay-label">{FUNDING.fund.youPay}</span>
          <span className="fund-pay-value">—</span>
        </div>
        {want > CAP && <div className="fund-cap">{FUNDING.fund.cap(CAP, symbol)}</div>}

        <div className="fund-gate">
          {!address ? (
            <div className="fund-gate-connect">
              <div className="fund-gate-line">{FUNDING.fund.connect}</div>
              <ConnectButton />
            </div>
          ) : (
            <button type="button" disabled title={FUNDING.fund.blocked} className="fund-cta-vermilion fund-cta-vermilion--big" aria-disabled>
              {FUNDING.fund.cta}
            </button>
          )}
          <p className="fund-blocked">{FUNDING.fund.blocked}.</p>
          <button type="button" onClick={openFunds} className="fund-free" data-cursor="hover">
            {FUNDING.fund.freeInstead}
          </button>
        </div>
      </div>

      <p className="fund-page-foot">{FUNDING.fund.footnote}</p>
    </main>
  );
}
