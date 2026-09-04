"use client";

import { FAUCET_UNITS, STT_FAUCETS } from "@masayume/core/constants";
import { collateralOrNull } from "@masayume/markets";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFaucet } from "@/features/markets/faucet";
import { diagnosisCopy } from "@/lib/copy";
import { useWalletSession } from "@/lib/wallet-session";
import { FUNDING } from "./copy";
import "./funding.css";

const short = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

/**
 * The reference's `AddFunds` (`components/AddFunds.tsx`): a centred dialog over a blurred scrim, opened from
 * the header's money pill or from anywhere via `masayume:open-funds`. One tap mints test funds. The reference's
 * card and bridge rows are gone by the owner's ruling (2026-09-04): this testnet has exactly one money rail, the
 * venue's faucet, and a row that leads nowhere is the dead end Yosuku's own header comment refused to ship.
 *
 * The one factual difference from the reference: its faucet is a treasury drip with no signature, ours is the
 * venue's `faucet(uint)` that the wallet signs — so the mint needs STT, and an empty tank routes to the STT
 * faucets here instead of failing later.
 */
export function AddFunds({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { address } = useWalletSession();
  const faucet = useFaucet();
  const [copied, setCopied] = useState(false);
  const symbol = collateralOrNull()?.symbol ?? "tUSDC";
  const amountText = String(FAUCET_UNITS);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open) return null;
  const minting = faucet.state.phase === "submitted";
  const done = faucet.state.phase === "confirmed";
  const diagnosis = faucet.state.diagnosis;

  return (
    <div className="fund-modal-root" onClick={onClose}>
      <div className="fund-modal-scrim" />
      <div className="fund-modal" role="dialog" aria-modal="true" aria-labelledby="add-funds-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label={FUNDING.modal.close} className="fund-modal-close" data-cursor="hover">
          <X className="h-4 w-4" />
        </button>

        <div className="fund-eyebrow-row">
          <span className="fund-eyebrow-dot" />
          <span className="fund-eyebrow">{FUNDING.modal.eyebrow}</span>
        </div>
        <h2 id="add-funds-title" className="fund-title">
          {FUNDING.modal.title}
        </h2>
        <p className="fund-body">{FUNDING.modal.body}</p>

        {!address ? (
          <div className="fund-connect-first">{FUNDING.modal.connectFirst}</div>
        ) : (
          <>
            <div className="fund-account">
              <span className="fund-account-label">{FUNDING.modal.account}</span>
              <button
                type="button"
                className="fund-account-addr"
                aria-label="Copy account address"
                onClick={() => {
                  void navigator.clipboard.writeText(address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                data-cursor="hover"
              >
                {copied ? FUNDING.modal.copied : `${short(address)} ⧉`}
              </button>
            </div>

            {done ? (
              <Link href="/markets" onClick={onClose} className="fund-cta-vermilion" data-cursor="hover">
                {FUNDING.modal.trade}
              </Link>
            ) : (
              <div className="fund-rows">
                <button type="button" onClick={() => void faucet.mint()} disabled={minting || !faucet.hasSigner} className="fund-cta-white" data-cursor="hover">
                  {minting ? FUNDING.modal.requesting : FUNDING.modal.request(amountText, symbol)}
                </button>
              </div>
            )}

            {done && <p className="fund-msg fund-msg--ok">{FUNDING.modal.done(amountText, symbol)}</p>}
            {diagnosis && !done && <p className="fund-msg fund-msg--err">{diagnosisCopy(diagnosis.kind).headline}</p>}

            <div className="fund-foot">
              {faucet.state.gasShort && <p className="fund-foot-line">{FUNDING.modal.gasFirst}</p>}
              {STT_FAUCETS.map((f) => (
                <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="fund-foot-link" data-cursor="hover">
                  {faucet.state.gasShort ? `${f.name} ↗` : FUNDING.modal.needMore}
                </a>
              )).slice(0, faucet.state.gasShort ? STT_FAUCETS.length : 1)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
