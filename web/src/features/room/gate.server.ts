import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Address } from "@masayume/core/types";
import { ensureMarkets, marketsProvider, parseMarketsEnv } from "@masayume/markets";
import { verifyMessage } from "viem";
import { ROOM_TOKEN_TTL_MS, roomJoinMessage } from "./protocol";

/**
 * The Room's authority — server only. Nothing here may be imported by a component.
 *
 * Two facts have to be true before a wallet may read or post, and both are checked
 * here rather than in the browser: it owns the address it claims (a signature), and
 * it holds a position on this market (a chain read). A gate that lives only in the
 * UI is not a gate — the sheet says "bettors only", so the server has to mean it.
 */

/**
 * The key that signs session tokens.
 *
 * `ROOM_TOKEN_SECRET` keeps sessions valid across restarts and across instances; a
 * per-process random key is the fallback, which is correct but means a redeploy or
 * a dev reload asks the wallet to sign again. That is a nuisance, never a hole.
 */
const SECRET = process.env.ROOM_TOKEN_SECRET ?? randomBytes(32).toString("hex");

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** `<address>.<marketId>.<expiry>.<mac>` — the claim travels with its own signature. */
export function mintToken(address: string, marketId: string, nowMs: number): string {
  const payload = `${address.toLowerCase()}.${marketId}.${nowMs + ROOM_TOKEN_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

/** The address this token proves, or null. Constant-time compare, so a MAC cannot be probed byte by byte. */
export function readToken(token: string, marketId: string, nowMs: number): string | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [address, tokenMarketId, expiry, mac] = parts as [string, string, string, string];
  if (tokenMarketId !== marketId) return null;
  if (!/^\d+$/.test(expiry) || Number(expiry) <= nowMs) return null;

  const expected = Buffer.from(sign(`${address}.${tokenMarketId}.${expiry}`));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return address;
}

/** Whether the signature really is this address's, over the message we would have asked for. */
export async function verifyJoinSignature(marketId: string, address: string, issuedAtMs: number, signature: string): Promise<boolean> {
  try {
    return await verifyMessage({
      address: address as `0x${string}`,
      message: roomJoinMessage(marketId, address, issuedAtMs),
      signature: signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}

/**
 * Does this wallet hold a position on this market?
 *
 * The reference's on-chain rule is `bet_registry::has_bet` — ever bet. The closest
 * honest read here is holding the outcome tokens, which a bettor keeps from the
 * fill until they redeem, so it covers the Window's life and the settled-unclaimed
 * period after it. A wallet that has already redeemed a settled Window loses access
 * to that Room, which the reference's rule would not do. Recorded rather than
 * papered over: inventing a wider gate than the chain can prove is the wrong way
 * round.
 */
export async function holdsPosition(address: string, marketId: string): Promise<boolean> {
  ensureMarkets(parseMarketsEnv());
  const reading = await marketsProvider.listOpenPositions(address as Address);
  if (!reading.ok) throw new Error(reading.error.kind);
  return reading.value.some((position) => position.marketId === marketId);
}
