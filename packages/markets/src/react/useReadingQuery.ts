import { err, type Reading } from "@masayume/core/schemas";
import { useQuery, type QueryKey } from "@tanstack/react-query";
import { diagnose } from "../errors/error-map";

const DEFAULT_STALE_MS = 5_000;

export type PollInterval<T> = number | ((reading: Reading<T> | null) => number | false);

export interface ReadingQueryOptions<T> {
  pollMs?: PollInterval<T>;
  enabled?: boolean;
  staleTimeMs?: number;
}

/**
 * TanStack Query over a port read. Polling is visibility-gated (never in the background) and the
 * read itself never rejects: an unexpected throw still lands as the error arm of a `Reading` (AD-6).
 * Returns null only before the first result exists.
 */
export function useReadingQuery<T>(queryKey: QueryKey, read: () => Promise<Reading<T>>, options: ReadingQueryOptions<T> = {}): Reading<T> | null {
  const { pollMs, enabled = true, staleTimeMs } = options;
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await read();
      } catch (error) {
        return err(diagnose(error));
      }
    },
    enabled,
    refetchInterval: typeof pollMs === "function" ? (q) => pollMs(q.state.data ?? null) : (pollMs ?? false),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: staleTimeMs ?? (typeof pollMs === "number" ? pollMs : DEFAULT_STALE_MS),
  });
  return query.data ?? null;
}
