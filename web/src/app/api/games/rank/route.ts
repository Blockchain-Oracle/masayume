import { gamesStoreConfigured, listTopRatings, readRatings } from "@masayume/db";
import { NextResponse } from "next/server";

/**
 * `GET /api/games/rank?address=0x…` — the ladder (Flicky's `/leaderboard`), and the asking wallet's own
 * row even when it sits below the cut. Rating-only: there is no season programme here, so nothing
 * about prizes or eligibility is invented alongside it.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 50;

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!gamesStoreConfigured()) return NextResponse.json({ configured: false, rows: [], me: null });
  const rows = await listTopRatings(LIMIT);
  const me = address && /^0x[0-9a-fA-F]{40}$/.test(address) ? ((await readRatings([address])).get(address.toLowerCase()) ?? null) : null;
  return NextResponse.json({ configured: true, rows, me });
}
