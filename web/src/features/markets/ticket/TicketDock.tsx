"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TICKET } from "@/lib/copy";
import { Ticket } from "./Ticket";
import type { TicketSelection } from "./types";

/**
 * The width at which the hero grid keeps its second column (part-04.css,
 * `@media (max-width: 900px)`). Above it the ticket is docked in the rail beside
 * the chart; below it the rail is gone and the ticket is a drawer.
 */
const RAIL_QUERY = "(min-width: 56.3125rem)";

function useHasRail(): boolean {
  const [hasRail, setHasRail] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(RAIL_QUERY);
    const sync = () => setHasRail(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return hasRail;
}

/**
 * Docked beside the chart where there is room for it; a drawer where there is not.
 *
 * The drawer has no trigger of its own — the hero's UP/DOWN buttons are the
 * trigger, exactly as in the reference. Choosing a side *is* opening the ticket,
 * so there is never a second tap between the call and the deal.
 */
export function TicketDock({ selection }: { selection: TicketSelection }) {
  const hasRail = useHasRail();
  const [open, setOpen] = useState(false);
  const { side, market } = selection;

  useEffect(() => {
    if (!hasRail && side) setOpen(true);
  }, [hasRail, side, market.marketId]);

  if (hasRail) {
    return (
      <div className="mh-rail">
        <Ticket selection={selection} />
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="max-h-dvh overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{TICKET.title}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">{open && <Ticket selection={selection} />}</div>
      </SheetContent>
    </Sheet>
  );
}
