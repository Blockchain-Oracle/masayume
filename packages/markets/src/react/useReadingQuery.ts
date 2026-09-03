import { err, type Reading } from "@masayume/core/schemas";
import { skipToken, useQuery, type QueryKey } from "@tanstack/react-query";
import { diagnose } from "../errors/error-map";
import type { MarketsBoot } from "../provider/boot";
import { keys } from "./keys";

const DEFAULT_STALE_MS = 5_000;
const BOOT_KEY = keys.boot();

export type PollInterval<T> = number | ((reading: Reading<T> | null) => number | false);

export interface ReadingQueryOptions<T> {
  pollMs?: PollInterval<T>;
  enabled?: boolean;
  staleTimeMs?: number;
}

const isBootKey = (key: QueryKey): boolean => key.length === BOOT_KEY.length && key.every((part, i) => part === BOOT_KEY[i]);

/**
 * Every other read waits for the boot (chain clock, collateral decimals, venue id) to land: the port reads take
 * the collateral synchronously, so a wallet-scoped read that fires before the boot resolves — a reconnecting
 * wallet is known within a tick of hydration — fails with "collateral not loaded" and stays failed until its
 * next poll. Observing the boot's cache entry (never fetching it here) makes that order a fact, not a race.
 */
function useBooted(queryKey: QueryKey): boolean {
  const boot = useQuery<Reading<MarketsBoot>>({ queryKey: BOOT_KEY, queryFn: skipToken });
  return isBootKey(queryKey) || boot.data?.ok === true;
}

/**
 * TanStack Query over a port read. Polling is visibility-gated (never in the background) and the
 * read itself never rejects: an unexpected throw still lands as the error arm of a `Reading` (AD-6).
 * Returns null only before the first result exists.
 */
export function useReadingQuery<T>(queryKey: QueryKey, read: () => Promise<Reading<T>>, options: ReadingQueryOptions<T> = {}): Reading<T> | null {
  const { pollMs, enabled = true, staleTimeMs } = options;
  const booted = useBooted(queryKey);
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await read();
      } catch (error) {
        return err(diagnose(error));
      }
    },
    enabled: enabled && booted,
    refetchInterval: typeof pollMs === "function" ? (q) => pollMs(q.state.data ?? null) : (pollMs ?? false),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: staleTimeMs ?? (typeof pollMs === "number" ? pollMs : DEFAULT_STALE_MS),
  });
  return query.data ?? null;
}
