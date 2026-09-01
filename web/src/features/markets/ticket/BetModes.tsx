"use client";

import { TICKET_PENDING } from "@/lib/copy";

/**
 * Call a side, or call a band.
 *
 * Range is Yosuku parity and is kept in place, but it settles against a
 * `RangeReserve` contract that is not deployed — so the control is disabled and
 * names what is missing. Pointing it at an ordinary Up/Down order would be a
 * different bet wearing this one's label.
 */
export function BetModes() {
  return (
    <div className="tk-modes" role="group" aria-label={TICKET_PENDING.modeLabel}>
      <button type="button" className="tk-mode" aria-pressed data-cursor="hover">
        {TICKET_PENDING.modeDirection}
      </button>
      <button type="button" className="tk-mode" aria-pressed={false} disabled title={TICKET_PENDING.rangePending}>
        {TICKET_PENDING.modeRange}
      </button>
    </div>
  );
}
