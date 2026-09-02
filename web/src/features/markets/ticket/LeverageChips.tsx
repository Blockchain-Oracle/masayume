"use client";

import { LEVERAGE_MULTIPLES } from "@masayume/core/leverage";
import { LEVERAGE } from "@/features/leverage";
import { TICKET_PENDING } from "@/lib/copy";

interface LeverageChipsProps {
  value: number;
  onChange: (multiple: number) => void;
  /** The LeverageReserve is deployed on this network; without it the higher chips stay and say what is missing. */
  available: boolean;
  /** The reserve's own ceiling, in multiples. */
  maxMultiple: number;
  /** Why the higher multiples cannot be chosen right now (the route, a pause); null when they can. */
  lockedReason: string | null;
}

/**
 * The reference's 1×/2×/3× chips (`Ticket624Drawer.tsx` L1074–1090), live. 1× is a plain order. A
 * higher multiple is a boost the reserve buys; where it cannot be placed — no reserve, a route that is
 * not the wallet, a paused reserve — the chip stays, disabled, and its title says why, exactly as the
 * reference disables them for a private bet ("Private bets are placed at 1x.").
 */
export function LeverageChips({ value, onChange, available, maxMultiple, lockedReason }: LeverageChipsProps) {
  return (
    <div className="tk-lev-row">
      <span className="tk-control-label">{LEVERAGE.label}</span>
      <div className="tk-levs" role="group" aria-label={LEVERAGE.label}>
        {LEVERAGE_MULTIPLES.map((multiple) => {
          const label = LEVERAGE.multiple(multiple);
          const reason = multiple === 1 ? null : !available ? TICKET_PENDING.leveragePending(label) : (lockedReason ?? (multiple > maxMultiple ? TICKET_PENDING.leveragePending(label) : null));
          return (
            <button
              key={multiple}
              type="button"
              className="tk-lev"
              aria-pressed={value === multiple}
              disabled={reason !== null}
              title={reason ?? undefined}
              onClick={() => onChange(multiple)}
              data-cursor="hover"
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
