import { NextResponse } from "next/server";
import { readBoard } from "@/features/leaderboard/board.server";
import { LEADERBOARD } from "@/features/leaderboard/copy";

/**
 * The board — ported from `reference/yosuku/app/api/leaderboard/route.ts` in shape: a server
 * route with a short cache, because ranking a venue is one scan per few minutes, not one per
 * visitor. No credential and no database: the indexer's fill tape is the only input.
 */
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await readBoard());
  } catch (error) {
    console.error("leaderboard:", error);
    return NextResponse.json({ error: LEADERBOARD.errors.compute }, { status: 503 });
  }
}
