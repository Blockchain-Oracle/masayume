"use client";

import { formatBaseUnits } from "@masayume/core/units";
import { SESSION } from "./copy";
import type { FundingSource } from "./useTicketRoute";

interface RouteControlProps {
  source: FundingSource;
  onChange: (source: FundingSource) => void;
  vaultAvailableBase: bigint | null;
  decimals: number;
  symbol: string;
  /** With a session armed, taps come from the Vault and the choice is shown, not offered. */
  armed: boolean;
  deployed: boolean;
}

/**
 * Where the escrow comes from — the reference's Public/Private two-option control
 * (`Ticket624Drawer.tsx` L1180–1205), in the `.tk-modes` grammar already ported for bet types,
 * carrying the one line that changes what happens to money.
 */
export function RouteControl({ source, onChange, vaultAvailableBase, decimals, symbol, armed, deployed }: RouteControlProps) {
  const vaultEmpty = (vaultAvailableBase ?? 0n) === 0n;
  const effective: FundingSource = armed ? "vault" : source;
  const vaultTitle = !deployed ? SESSION.notDeployed : vaultEmpty && !armed ? SESSION.route.vaultEmpty : `${formatBaseUnits(vaultAvailableBase ?? 0n, decimals)} ${symbol}`;
  return (
    <div className="tk-lev-row">
      <span className="tk-control-label">{SESSION.route.label}</span>
      <div className="tk-modes" role="group" aria-label={SESSION.route.label}>
        <button
          type="button"
          className="tk-mode"
          aria-pressed={effective === "wallet"}
          disabled={armed}
          title={armed ? SESSION.route.armedLocked : undefined}
          onClick={() => onChange("wallet")}
          data-cursor="hover"
        >
          {SESSION.route.wallet}
        </button>
        <button
          type="button"
          className="tk-mode"
          aria-pressed={effective === "vault"}
          disabled={armed || !deployed || vaultEmpty}
          title={vaultTitle}
          onClick={() => onChange("vault")}
          data-cursor="hover"
        >
          {SESSION.route.vault}
        </button>
      </div>
    </div>
  );
}
