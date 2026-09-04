"use client";

import { gameEntry, gameIdFromPath } from "./catalog";

/**
 * Pips remembers the last game a player opened (`lib/storage.ts` `lastGame`) and the hub offers it first.
 * The rail writes it as a route is visited; the hub reads it once. Absent where storage is refused.
 */
const KEY = "masayume.games.last";

export function rememberGame(pathname: string | null): void {
  const id = gameIdFromPath(pathname);
  if (!id) return;
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    // storage refused — nothing to remember
  }
}

export function lastGamePlayed(): { href: string; name: string } | null {
  try {
    const id = gameIdFromPath(`/games/${window.localStorage.getItem(KEY) ?? ""}`);
    if (!id) return null;
    const entry = gameEntry(id);
    return entry.readiness.kind === "built" ? { href: entry.nav.href, name: entry.nav.name } : null;
  } catch {
    return null;
  }
}
