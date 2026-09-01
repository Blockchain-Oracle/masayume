"use client";

import { TICKET_PENDING } from "@/lib/copy";

/** The multiples the reference offers; everything above 1× waits on Stage 5's prefunded reserve. */
const MULTIPLES = ["1×", "2×", "3×"] as const;

/**
 * Leverage, shown at the size every bet here actually is.
 *
 * 1× is selected and real. The higher multiples stay visible — they are part of
 * the product — but they are disabled and say why, because a chip that changes
 * nothing about the order would be a claim about payout that the venue would not
 * honour.
 */
export function LeverageChips() {
  return (
    <div className="tk-lev-row">
      <span className="tk-control-label">{TICKET_PENDING.leverageLabel}</span>
      <div className="tk-levs" role="group" aria-label={TICKET_PENDING.leverageLabel}>
        {MULTIPLES.map((multiple) => {
          const live = multiple === TICKET_PENDING.leverageOne;
          return (
            <button
              key={multiple}
              type="button"
              className="tk-lev"
              aria-pressed={live}
              disabled={!live}
              title={live ? undefined : TICKET_PENDING.leveragePending(multiple)}
              data-cursor="hover"
            >
              {multiple}
            </button>
          );
        })}
      </div>
    </div>
  );
}
