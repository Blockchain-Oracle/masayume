"use client";

import { PRIVATE_BACKUP_KIND, PRIVATE_BACKUP_VERSION, type PrivateTicket } from "@masayume/core/private";
import { useCallback, useEffect, useState } from "react";

/** The reference kept its tickets under `yosuku_private_bet_tickets`; ours live under this key, newest first. */
const KEY = "masayume.private.claims";
const CAP = 60;
const REFRESH_MS = 4_000;

export function loadPrivateTickets(owner?: string | null): PrivateTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrivateTicket[];
    if (!Array.isArray(parsed)) return [];
    return owner ? parsed.filter((t) => t.claim.owner.toLowerCase() === owner.toLowerCase()) : parsed;
  } catch {
    return [];
  }
}

export function savePrivateTickets(tickets: PrivateTicket[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(tickets.slice(0, CAP)));
  } catch {
    // storage unavailable — the ticket still exists on the desk's reply, and the caller shows it
  }
}

/** One claim per slot: a cash-out replaces the row it updates, an open adds a new one at the top. */
export function upsertPrivateTicket(ticket: PrivateTicket): void {
  const all = loadPrivateTickets();
  const rest = all.filter((t) => t.claim.slotId.toLowerCase() !== ticket.claim.slotId.toLowerCase());
  savePrivateTickets([ticket, ...rest]);
}

/** A portable copy of every claim this browser holds. Plain JSON on purpose: it has to survive a lost laptop and this app going away. */
export function exportPrivateClaims(owner?: string | null): string {
  return JSON.stringify({ kind: PRIVATE_BACKUP_KIND, version: PRIVATE_BACKUP_VERSION, exportedAt: Date.now(), claims: loadPrivateTickets(owner) }, null, 2);
}

/** Merge a backup back in. Existing claims win, so restoring an old file cannot roll a cashed-out position back to "open". Returns how many were added. */
export function importPrivateClaims(raw: string): number {
  const parsed = JSON.parse(raw) as { kind?: string; claims?: PrivateTicket[] };
  if (parsed?.kind !== PRIVATE_BACKUP_KIND) throw new Error("not a Masayume claims file");
  const incoming = Array.isArray(parsed.claims) ? parsed.claims : [];
  if (incoming.length === 0) return 0;
  const existing = loadPrivateTickets();
  const seen = new Set(existing.map((t) => t.claim.slotId.toLowerCase()));
  const added = incoming.filter((t) => t?.claim?.slotId && t.signature && !seen.has(t.claim.slotId.toLowerCase()));
  if (added.length > 0) savePrivateTickets([...added, ...existing]);
  return added.length;
}

/** The owner's claims, re-read on a storage event and every few seconds — the reference's own cadence (`portfolio/page.tsx` L164–170). */
export function usePrivateTickets(owner: string | null): { tickets: PrivateTicket[]; refresh: () => void } {
  const [tickets, setTickets] = useState<PrivateTicket[]>([]);
  const refresh = useCallback(() => setTickets(owner ? loadPrivateTickets(owner) : []), [owner]);
  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);
  return { tickets, refresh };
}
