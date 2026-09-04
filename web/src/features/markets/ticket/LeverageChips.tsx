"use client";

import { LEVERAGE_MULTIPLES } from "@masayume/core/leverage";
import { LEVERAGE } from "@/features/leverage";
import { TICKET_PENDING } from "@/lib/copy";

export interface LeverageChipsProps {
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
 * The reference's 1×/2×/3× chips, verbatim (`Ticket624Drawer.tsx` L1074–1090): three small mono buttons on
 * the amount block's right, the chosen one in vermilion, the others disabled with a title where a boost
 * cannot be placed — exactly as the reference disables them for a private bet. 1× is a plain order; a
 * higher multiple is a boost the reserve buys. The 2026-09-02 sliding highlight was reverted with the rest
 * of the leverage redesign on 2026-09-04.
 */
export function LeverageChips({ value, onChange, available, maxMultiple, lockedReason }: LeverageChipsProps) {
  return (
    <div className="tk-levs" role="group" aria-label={LEVERAGE.label}>
      {LEVERAGE_MULTIPLES.map((multiple) => {
        const label = LEVERAGE.multiple(multiple);
        const reason = multiple === 1 ? null : !available ? TICKET_PENDING.leveragePending(label) : (lockedReason ?? (multiple > maxMultiple ? TICKET_PENDING.leverageCapped(label, LEVERAGE.multiple(maxMultiple)) : null));
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
  );
}
