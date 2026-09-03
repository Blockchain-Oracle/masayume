"use client";

import { diagnosis, err, ok, type Reading } from "@masayume/core";
import { useReadingQuery } from "@masayume/markets/react";
import { leaderboardPayloadSchema, toBoardData, type BoardData } from "./protocol";

const POLL_MS = 120_000;
export const LEADERBOARD_KEY = ["masayume", "leaderboard"] as const;

async function readLeaderboard(): Promise<Reading<BoardData>> {
  const response = await fetch("/api/leaderboard", { cache: "no-store" });
  if (!response.ok) return err(diagnosis("indexer-down", `leaderboard route answered ${response.status}`));
  const parsed = leaderboardPayloadSchema.safeParse(await response.json());
  if (!parsed.success) return err(diagnosis("indexer-down", "leaderboard payload did not parse"));
  return ok(toBoardData(parsed.data), Date.now());
}

/** The reference's `useLeaderboard`: fetch the route, refresh every two minutes while visible. */
export function useLeaderboard(): Reading<BoardData> | null {
  return useReadingQuery(LEADERBOARD_KEY, readLeaderboard, { pollMs: POLL_MS, needs: [] });
}
