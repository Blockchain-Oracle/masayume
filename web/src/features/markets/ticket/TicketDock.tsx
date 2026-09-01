"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TICKET } from "@/lib/copy";
import { SIDE_WORD } from "../side-styles";
import { Ticket } from "./Ticket";
import type { TicketSelection } from "./types";

/** Tailwind's `lg` breakpoint; below it the Ticket lives in a bottom sheet, above it in the docked rail. */
const DESKTOP_QUERY = "(min-width: 64rem)";

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return desktop;
}

/** Docked at `lg`; a bottom sheet below it that opens whenever a side is chosen (tap-is-the-choice). */
export function TicketDock({ selection }: { selection: TicketSelection }) {
  const desktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const { side, market } = selection;

  useEffect(() => {
    if (!desktop && side) setOpen(true);
  }, [desktop, side, market.marketId]);

  if (desktop) return <Ticket selection={selection} />;

  return (
    <>
      <Button variant="outline" size="lg" className="w-full" onClick={() => setOpen(true)}>
        {side ? TICKET.sheetCta(SIDE_WORD[side]) : TICKET.sheetCtaPlain}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-dvh overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{TICKET.title}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">{open && <Ticket selection={selection} />}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
