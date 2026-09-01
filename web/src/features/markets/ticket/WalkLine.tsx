"use client";

import { Button } from "@/components/ui/button";
import { TICKET, WALK_LINE } from "@/lib/copy";
import { booleanCodec, usePersistedState } from "@/lib/persisted";

const STORAGE_KEY = "masayume.walkLine";

/** The one-time Ticket walk-line — no tutorial modal, one sentence, dismissed once (EXPERIENCE first run). */
export function WalkLine() {
  const [dismissed, setDismissed, hydrated] = usePersistedState(STORAGE_KEY, false, booleanCodec);
  if (!hydrated || dismissed) return null;
  return (
    <p className="flex items-center justify-between gap-3 rounded-md bg-gold-wash px-3 py-2 type-caption text-ink">
      <span>{WALK_LINE}</span>
      <Button variant="ghost" size="xs" onClick={() => setDismissed(true)}>
        {TICKET.gotIt}
      </Button>
    </p>
  );
}
