import { addressSchema } from "@masayume/core/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { mintFromSignature, renewFromToken, roomArena } from "@/features/games/room-token.server";

/**
 * `POST /api/games/room-token` — the wallet's one signature, turned into a room credential.
 *
 * Two shapes, because a duel outlives one token. A `signature` mints a fresh session; a `token` renews
 * inside the session it already proved, so a match that runs past fifteen minutes does not interrupt a
 * swipe deadline to ask the wallet to sign again. Both return the same grant, and the ops room server
 * checks it without ever calling back here.
 *
 * The route never says which claim it disliked beyond the shape a client can act on — sign again, or
 * stop — and it holds no session of its own: there is nothing here to invalidate, and nothing to leak.
 */
export const runtime = "nodejs";

/**
 * `GET` — what a browser needs to know BEFORE it asks a wallet to sign.
 *
 * The arena, the chain and where the room listens: three public facts, no secret among them. Without
 * this the entry screen would have to prompt for a signature to discover that this deployment has no
 * room at all, which is a wallet prompt spent on a question the server could have answered for free.
 * The chain and arena also let the client build the exact message the mint will verify, from core's
 * own builder, so the two copies of that text cannot drift.
 */
export function GET() {
  const target = roomArena();
  return NextResponse.json({
    chainId: target?.chainId ?? null,
    arena: target?.arena ?? null,
    url: process.env.GAME_ROOM_PUBLIC_URL ?? null,
  });
}

const requestSchema = z.union([
  z.object({
    wallet: addressSchema,
    issuedAtMs: z.number().int().positive(),
    signature: z.string().regex(/^0x[0-9a-fA-F]+$/).max(2_000),
  }),
  z.object({ token: z.string().min(16).max(400) }),
]);

export async function POST(req: Request) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That is not a room token request." }, { status: 400 });

  const now = Date.now();
  const outcome =
    "token" in parsed.data
      ? renewFromToken(parsed.data.token, now)
      : await mintFromSignature(parsed.data.wallet, parsed.data.issuedAtMs, parsed.data.signature, now);

  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  return NextResponse.json(outcome.grant);
}
