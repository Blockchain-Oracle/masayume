"use client";

import { isOk } from "@masayume/core/schemas";
import { formatBaseUnits } from "@masayume/core/units";
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useRef, useState, type RefObject } from "react";
import { useBalancePlate } from "@/features/markets/balance";
import { BANNER, CONNECT } from "@/lib/copy";
import { useWalletSession } from "@/lib/wallet-session";
import { useFloatingMenus } from "./useFloatingMenus";

const AMOUNT_DP = 2;

/**
 * The header's money + identity control.
 *
 * The pill shows SPENDABLE only. Order escrow and claimable credit are economically
 * different money, so they are listed and labelled in the menu rather than summed into one
 * flattering number. A balance that has not been read yet shows an em dash, never a zero.
 */
export function HeaderAccount({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { isRightChain, switching, switchToShannon } = useWalletSession();
  const balance = useBalancePlate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const refs = useRef<ReadonlyArray<RefObject<HTMLElement | null>>>([menuRef]);
  useFloatingMenus(refs.current, () => setOpen(false));

  const symbol = balance.symbol;
  const reading = balance.kind === "connected" ? balance.reading : null;
  const sheet = reading && isOk(reading) ? reading.value : null;
  const amount = (value: bigint | null) =>
    sheet && value !== null ? formatBaseUnits(value, sheet.decimals, { maxDp: AMOUNT_DP, minDp: AMOUNT_DP }) : "—";

  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal }) => {
        // Before hydration server and client must agree, so the control is present but inert.
        if (!mounted) {
          return (
            <button type="button" className="btn btn-primary invisible" aria-hidden="true" tabIndex={-1}>
              {CONNECT.connect}
            </button>
          );
        }

        if (!account || !chain) {
          return (
            <button type="button" className="btn btn-primary" onClick={openConnectModal} data-cursor="hover">
              {CONNECT.connect}
            </button>
          );
        }

        if (!isRightChain) {
          return (
            <button type="button" className="btn btn-outline" onClick={switchToShannon} disabled={switching} data-cursor="hover">
              {switching ? BANNER.switching : CONNECT.wrongChain}
            </button>
          );
        }

        return (
          <div className="relative" ref={menuRef} data-cursor="hover">
            <button
              type="button"
              className="wallet-pill"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => {
                setOpen((prev) => !prev);
                onOpenMenu?.();
              }}
            >
              <span className="addr-dot" />
              <span>{account.displayName}</span>
            </button>

            {open && (
              <div className="header-account-menu" role="menu">
                <div className="header-account-pools">
                  <div className="header-account-row">
                    <span>Spendable{symbol ? ` · ${symbol}` : ""}</span>
                    <span className="val">{amount(sheet?.spendableBase ?? null)}</span>
                  </div>
                  <div className="header-account-row">
                    <span>In open orders</span>
                    <span className="val">{amount(sheet?.orderEscrowBase ?? null)}</span>
                  </div>
                  <div className="header-account-row">
                    <span>Claimable</span>
                    <span className="val">{amount(sheet?.venueCreditBase ?? null)}</span>
                  </div>
                </div>
                <Link href="/portfolio" className="header-account-link" role="menuitem" onClick={() => setOpen(false)}>
                  Portfolio
                </Link>
                <Link href="/claims" className="header-account-link" role="menuitem" onClick={() => setOpen(false)}>
                  Claims
                </Link>
                <Link href="/fund" className="header-account-link" role="menuitem" onClick={() => setOpen(false)}>
                  Add funds
                </Link>
                <Link href="/claim" className="header-account-link" role="menuitem" onClick={() => setOpen(false)}>
                  X recovery
                </Link>
              </div>
            )}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
