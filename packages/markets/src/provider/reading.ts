import { err, ok, stale, type Reading, type ReadingOk } from "@masayume/core/schemas";
import { diagnose } from "../errors/error-map";
import { nowMs } from "./clock";

const lastGood = new Map<string, ReadingOk<unknown>>();

/**
 * The one place staleness is decided (AD-6): a first-ever failure is the error arm;
 * a failed refresh keeps the last-good value at full value and flips `stale`.
 */
export async function withReading<T>(key: string, read: () => Promise<T>): Promise<Reading<T>> {
  try {
    const reading = ok(await read(), nowMs());
    lastGood.set(key, reading);
    return reading;
  } catch (error) {
    const previous = lastGood.get(key) as ReadingOk<T> | undefined;
    return previous ? stale(previous, "refresh-failed") : err(diagnose(error));
  }
}

export function forgetReading(key: string): void {
  lastGood.delete(key);
}
