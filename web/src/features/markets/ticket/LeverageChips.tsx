"use client";

import { LEVERAGE_MULTIPLES } from "@masayume/core/leverage";
import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
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

const SLIDE = { type: "spring" as const, stiffness: 400, damping: 32 };

/**
 * The reference's 1×/2×/3× chips (`Ticket624Drawer.tsx` L1074–1090), live, with the 21st segmented control's
 * sliding highlight under the chosen one. 1× is a plain order. A higher multiple is a boost the reserve buys;
 * where it cannot be placed — no reserve, a route that is not the wallet, a paused reserve — the chip stays,
 * disabled, and its title says why, exactly as the reference disables them for a private bet.
 */
export function LeverageChips({ value, onChange, available, maxMultiple, lockedReason }: LeverageChipsProps) {
  const reduced = useReducedMotion();
  const layoutId = `${useId()}-lev`;
  return (
    <div className="tk-lev-row">
      {/* the reference names the group only for assistive tech (aria-label="Leverage"); no painted label */}
      <div className="tk-levs" role="group" aria-label={LEVERAGE.label}>
        {LEVERAGE_MULTIPLES.map((multiple) => {
          const label = LEVERAGE.multiple(multiple);
          const reason = multiple === 1 ? null : !available ? TICKET_PENDING.leveragePending(label) : (lockedReason ?? (multiple > maxMultiple ? TICKET_PENDING.leverageCapped(label, LEVERAGE.multiple(maxMultiple)) : null));
          const on = value === multiple;
          return (
            <button
              key={multiple}
              type="button"
              className="tk-lev"
              aria-pressed={on}
              disabled={reason !== null}
              title={reason ?? undefined}
              onClick={() => onChange(multiple)}
              data-cursor="hover"
            >
              {on && <motion.span layoutId={layoutId} className="tk-lev-hl" transition={reduced ? { duration: 0 } : SLIDE} aria-hidden />}
              <span className="tk-lev-label">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
