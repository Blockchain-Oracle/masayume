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
 * **The token is held in memory and nowhere else.** It is a bearer credential for a room — anything
 * that can present it can speak as this wallet — so it does not go near `localStorage`, and a reload
 * costs one signature. That is the same choice the Stage 3 comment Room made, and the reason the
 * signed message says plainly that it is not a transaction and moves no funds.
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
            setAuth({ kind: "sign" });
            return;
          }
          const next = (await response.json()) as Grant;
          grantRef.current = next;
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
