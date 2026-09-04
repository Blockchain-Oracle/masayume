"use client";

import { ROOM_TOKEN_TTL_MS, roomAuthMessage } from "@masayume/core/games";
import type { Address } from "@masayume/core/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSignMessage } from "wagmi";
import { useWalletSession } from "@/lib/wallet-session";
import { DUEL } from "./copy";

/**
 * The duel room's credential: one wallet signature, then a token this browser renews on its own.
 *
 * **The token survives a reload, in `sessionStorage` and nowhere else.** It was held only in memory,
 * which cost a signature every time a page refreshed — and a duel is a screen people refresh, because
 * refreshing is what you do when something looks stuck. That was the wrong trade: a wallet prompt on
 * every reload is a real, constant cost paid against a threat `sessionStorage` barely changes.
 *
 * What this credential can and cannot do is worth being precise about. It is a bearer token for one
 * room, one wallet, one arena and one chain, for fifteen minutes: presenting it lets a holder queue,
 * reveal a seed and relay a "deciding" cue as that wallet. It signs nothing, moves nothing and
 * authorises no transaction — every economic act in a duel is its own wallet signature. And it does not
 * go near `localStorage`: the storage is per tab and dies with the tab, so a shared machine hands the
 * next page nothing, and any script that could read it could equally read the in-memory copy.
 *
 * **Renewal happens before the token dies, not after.** A duel outlives one fifteen-minute token, and
 * a wallet prompt arriving in the middle of a pick deadline is a lost card. The session behind the
 * signature lasts twelve hours; inside it, renewal needs no wallet at all.
 *
 * **What is configured is asked, never assumed.** The GET says whether this deployment has an arena
 * and a room before anything is signed, so "no duel here" costs no prompt — and it hands back the
 * chain and arena so the message this browser signs is built by core's own builder.
 */

const ENDPOINT = "/api/games/room-token";
/** Renew this long before expiry: enough for a slow round trip, short enough to stay one token. */
const RENEW_LEAD_MS = 90_000;
/** One key per wallet, so switching accounts in a tab cannot resume the previous one's seat. */
const STORE_KEY = (wallet: string) => `masayume.room.${wallet.toLowerCase()}`;
/** Below this a stored token is not worth resuming: it would expire mid-handshake. */
const RESUME_FLOOR_MS = 20_000;

interface RoomTarget {
  chainId: number;
  arena: Address;
  url: string;
}

export type RoomAuth =
  /** Asked and answered: this deployment has no arena, or no room to reach it through. */
  | { kind: "unavailable"; why: string }
  | { kind: "asking" }
  | { kind: "connect" }
  | { kind: "sign" }
  | { kind: "signing" }
  | { kind: "ready"; token: string; url: string; wallet: Address }
  /** The wallet declined, or the server refused. Carries what to say and leaves the door open. */
  | { kind: "refused"; why: string };

export interface RoomTokenSession {
  auth: RoomAuth;
  authorize: () => Promise<void>;
  target: RoomTarget | null;
}

interface Grant {
  token: string;
  expiresAtMs: number;
  sessionEndsAtMs: number;
  url: string | null;
}

function rejected(cause: unknown): boolean {
  return /reject|denied|user cancel/i.test(String((cause as Error)?.message ?? ""));
}

/** Storage that is simply absent in a private window or a server render, and must never throw here. */
function readGrant(wallet: Address): Grant | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(STORE_KEY(wallet));
    if (!raw) return null;
    const grant = JSON.parse(raw) as Grant;
    if (typeof grant?.token !== "string" || typeof grant.expiresAtMs !== "number") return null;
    return grant.expiresAtMs - Date.now() > RESUME_FLOOR_MS ? grant : null;
  } catch {
    return null;
  }
}

function writeGrant(wallet: Address, grant: Grant | null): void {
  try {
    if (grant) globalThis.sessionStorage?.setItem(STORE_KEY(wallet), JSON.stringify(grant));
    else globalThis.sessionStorage?.removeItem(STORE_KEY(wallet));
  } catch {
    // A browser refusing storage costs a signature per reload; it does not cost the duel.
  }
}

export function useRoomToken(): RoomTokenSession {
  const { address, isConnected } = useWalletSession();
  const { signMessageAsync } = useSignMessage();
  const [target, setTarget] = useState<RoomTarget | null | undefined>(undefined);
  const [auth, setAuth] = useState<RoomAuth>({ kind: "asking" });
  const grantRef = useRef<Grant | null>(null);
  const renewRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // One question, once: what this deployment actually has.
  useEffect(() => {
    let alive = true;
    void fetch(ENDPOINT)
      .then((response) => response.json() as Promise<{ chainId: number | null; arena: string | null; url: string | null }>)
      .then((body) => {
        if (!alive) return;
        setTarget(body.chainId && body.arena && body.url ? { chainId: body.chainId, arena: body.arena as Address, url: body.url } : null);
      })
      .catch(() => {
        if (alive) setTarget(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  /** A token belongs to one wallet. Changing wallets throws it away rather than reusing it. */
  useEffect(() => {
    grantRef.current = null;
    if (renewRef.current) clearTimeout(renewRef.current);
  }, [address]);


  const scheduleRenew = useCallback((grant: Grant, wallet: Address) => {
    if (renewRef.current) clearTimeout(renewRef.current);
    const inMs = Math.max(5_000, Math.min(grant.expiresAtMs - Date.now() - RENEW_LEAD_MS, ROOM_TOKEN_TTL_MS));
    renewRef.current = setTimeout(() => {
      void fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: grant.token }) })
        .then(async (response) => {
          if (!response.ok) {
            // The session behind the signature has ended; the only way on is another signature.
            grantRef.current = null;
            writeGrant(wallet, null);
            setAuth({ kind: "sign" });
            return;
          }
          const next = (await response.json()) as Grant;
          grantRef.current = next;
          writeGrant(wallet, next);
          if (next.url) setAuth({ kind: "ready", token: next.token, url: next.url, wallet });
          scheduleRenew(next, wallet);
        })
        .catch(() => {
          // A failed renewal is not a failed session: try again inside the token's remaining life.
          scheduleRenew({ ...grant, expiresAtMs: Date.now() + RENEW_LEAD_MS }, wallet);
        });
    }, inMs);
  }, []);

  useEffect(() => () => void (renewRef.current && clearTimeout(renewRef.current)), []);

  /**
   * The reload path: a token this tab already holds, resumed without a prompt.
   *
   * It waits for `target`, so a token is only ever resumed against the arena the server has just named —
   * and a stored token with less life left than a handshake is discarded rather than presented, because
   * an expired one reaches the room as a 401 and reads to the player as "the room is broken".
   */
  useEffect(() => {
    if (!address || !target) return;
    setAuth((held) => {
      if (held.kind === "ready" || held.kind === "signing") return held;
      const stored = readGrant(address);
      if (!stored) return held;
      grantRef.current = stored;
      scheduleRenew(stored, address);
      return { kind: "ready", token: stored.token, url: stored.url ?? target.url, wallet: address };
    });
  }, [address, target, scheduleRenew]);

  const authorize = useCallback(async () => {
    if (!address || !target) return;
    setAuth({ kind: "signing" });
    try {
      const issuedAtMs = Date.now();
      const signature = await signMessageAsync({
        message: roomAuthMessage({ wallet: address, chainId: target.chainId, arena: target.arena, issuedAtMs }),
      });
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: address, issuedAtMs, signature }),
      });
      const body = (await response.json()) as Grant & { error?: string };
      if (!response.ok || !body.token) {
        setAuth({ kind: "refused", why: body.error ?? DUEL.auth.refused });
        return;
      }
      grantRef.current = body;
      writeGrant(address, body);
      setAuth({ kind: "ready", token: body.token, url: body.url ?? target.url, wallet: address });
      scheduleRenew(body, address);
    } catch (cause) {
      // A declined prompt is a choice, not a failure: say nothing and leave the button where it was.
      setAuth(rejected(cause) ? { kind: "sign" } : { kind: "refused", why: String((cause as Error)?.message ?? "").slice(0, 200) });
    }
  }, [address, target, signMessageAsync, scheduleRenew]);

  // The resting state, derived. Only `signing`, `ready` and `refused` are states this hook holds.
  useEffect(() => {
    setAuth((held) => {
      if (held.kind === "signing" || held.kind === "refused") return held;
      if (target === undefined) return { kind: "asking" };
      if (target === null) return { kind: "unavailable", why: DUEL.auth.unavailable };
      if (!isConnected || !address) return { kind: "connect" };
      if (held.kind === "ready" && held.wallet === address) return held;
      return { kind: "sign" };
    });
  }, [target, isConnected, address]);

  return { auth, authorize, target: target ?? null };
}
