"use client";

import type { ArenaAgentGrant } from "@masayume/core/games";
import type { Address, Hex } from "@masayume/core/types";
import { createLocalStorageJournal, createSessionKeySession, generateSessionKey, keyGasBalance, nowMs, requiredGasWei, type SubmitterSession } from "@masayume/markets";
import { del, get, set } from "idb-keyval";
import { useCallback, useEffect, useState } from "react";
import { webEnv } from "@/lib/env";
import { useWalletSession } from "@/lib/wallet-session";

/**
 * The key that swipes.
 *
 * Flicky asks a player for no signature per card because every one of its transactions is sponsored.
 * There is no sponsor here, so the same promise is kept another way: the entry transaction names a key
 * this browser holds as the seat's agent and sends it gas in the same call, and from then on every pick
 * is `placePickFor`, signed by the key and paid for by the player under the allowance the entry took.
 * The key can place picks for one seat of one match, within the deck's own ceiling, until the grant
 * runs out — and nothing else. Losing it loses a duel's convenience, never money.
 *
 * One key per wallet, in IndexedDB beside the tap-trade key's and under its own prefix: a duel's key is
 * not a vault grant, and revoking one must never touch the other. It signs under the `game-session`
 * authority, so the journal names which actor sent what.
 */
const KEY_PREFIX = "masayume.gameKey.";
/** The grant's life: a full pick window, a slow reveal before it and every crank after it. */
export const MATCH_AGENT_TTL_SEC = 6 * 3_600;
/** Gas the key is sent at entry: the arena lane's envelope for every card, twice — a pick and a retry. */
const PICK_ATTEMPTS_FUNDED = 2;

interface StoredGameKey {
  address: Address;
  privateKey: Hex;
  createdAtMs: number;
}

const idFor = (owner: Address) => `${KEY_PREFIX}${owner.toLowerCase()}`;

/** Storage that is simply absent in a private window, and must never throw here. */
async function loadOrCreate(owner: Address): Promise<StoredGameKey | null> {
  try {
    const held = await get<StoredGameKey>(idFor(owner));
    if (held?.privateKey) return held;
    const fresh = generateSessionKey(owner);
    const record: StoredGameKey = { address: fresh.address, privateKey: fresh.privateKey, createdAtMs: fresh.createdAtMs };
    await set(idFor(owner), record);
    return record;
  } catch {
    return null;
  }
}

export interface GameSession {
  /** The key's address, once this browser holds one for the connected wallet. */
  key: Address | null;
  /** The key's own signing session; the picks go through it. Null until the key exists. */
  session: SubmitterSession | null;
  /** What an entry names: this key, for the match's life, the deck's ceiling, and the gas it still lacks. */
  grant: (deckSize: number, perCardCapBase: bigint) => Promise<ArenaAgentGrant | null>;
  /** Throws the key away; the next duel makes another. */
  forget: () => Promise<void>;
}

export function useGameSession(): GameSession {
  const { address } = useWalletSession();
  const [stored, setStored] = useState<StoredGameKey | null>(null);
  const [session, setSession] = useState<SubmitterSession | null>(null);

  useEffect(() => {
    setStored(null);
    if (!address) return;
    let alive = true;
    void loadOrCreate(address).then((record) => {
      if (alive) setStored(record);
    });
    return () => {
      alive = false;
    };
  }, [address]);

  // The key's own session, alive only while this browser holds the key for this wallet; rebound never, disposed always.
  useEffect(() => {
    if (!stored) {
      setSession(null);
      return;
    }
    let cancelled = false;
    let created: SubmitterSession | null = null;
    void createSessionKeySession({ env: webEnv.markets, privateKey: stored.privateKey, journal: createLocalStorageJournal(nowMs), nowMs, authority: "game-session" })
      .then((next) => {
        created = next;
        if (cancelled) return next.dispose();
        setSession(next);
        return undefined;
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
      setSession(null);
      void created?.dispose();
    };
  }, [stored]);

  const grant = useCallback(
    async (deckSize: number, perCardCapBase: bigint): Promise<ArenaAgentGrant | null> => {
      if (!stored) return null;
      const needed = requiredGasWei("arena") * BigInt(deckSize * PICK_ATTEMPTS_FUNDED);
      let held = 0n;
      try {
        held = await keyGasBalance(stored.address);
      } catch {
        // An unreadable balance funds the whole envelope: over-sending stays the player's own STT, under-sending loses a card.
      }
      return { agent: stored.address, ttlSec: MATCH_AGENT_TTL_SEC, budgetBase: perCardCapBase * BigInt(deckSize), gasWei: held >= needed ? 0n : needed - held };
    },
    [stored],
  );

  const forget = useCallback(async () => {
    if (!address) return;
    try {
      await del(idFor(address));
    } catch {
      // nothing to forget where storage never worked
    }
    setStored(null);
  }, [address]);

  return { key: stored?.address ?? null, session, grant, forget };
}
