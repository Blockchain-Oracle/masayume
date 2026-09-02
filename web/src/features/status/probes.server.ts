import type { Reading } from "@masayume/core/schemas";
import { formatBaseUnits, formatUtc, secToMs } from "@masayume/core/units";
import { getDb, isDbConfigured } from "@masayume/db";
import { marketsProvider, resolveVenueId, syncClock, type MarketsEnv } from "@masayume/markets";
import { missingCredentialHint, resolveModel } from "@/features/sensei/model.server";
import { STATUS } from "./copy";
import type { StatusPipeline } from "./protocol";

/**
 * The probes behind `/api/status` — server only.
 *
 * Each one is a real read made when the page asks, bounded by its own timeout so one
 * dead dependency cannot hang the others, and each reports what it actually saw.
 * The port's reads keep a last-good value and flip `stale` when a refresh fails;
 * on a status page that is exactly the wrong thing to show as green, so a stale
 * reading counts as a failed probe here and says which reading it is holding.
 */
const PROBE_TIMEOUT_MS = 10_000;
const PRICE_ASSETS_CAP = 4;

async function withTimeout<T>(work: Promise<T>, ms = PROBE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(STATUS.detail.timedOut(ms / 1000))), ms);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

type Fresh<T> = { value: T } | { failure: string };

function fresh<T>(reading: Reading<T>): Fresh<T> {
  if (!reading.ok) return { failure: reading.error.technical || reading.error.kind };
  if (reading.stale) return { failure: STATUS.detail.stale(formatUtc(reading.asOfMs)) };
  return { value: reading.value };
}

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error)).slice(0, 200);

function down(id: string, label: string, detail: string, optional = false, configured = true): StatusPipeline {
  return { id, label, ok: false, lagSec: null, latencyMs: null, detail, optional, configured };
}

export async function probeRpc(): Promise<{ pipeline: StatusPipeline; blockNumber: number | null }> {
  const label = STATUS.pipelines.rpc;
  try {
    const clock = fresh(await withTimeout(syncClock()));
    if ("failure" in clock) return { pipeline: down("rpc", label, clock.failure), blockNumber: null };
    const { blockNumber, rttMs, offsetMs } = clock.value;
    // Block timestamps are whole seconds, so a head a second "behind" is normal; one minutes
    // behind is a chain that stopped, not a slow socket.
    const lagSec = Math.max(0, Math.round(-offsetMs / 1000));
    const offsetText = `${offsetMs >= 0 ? "+" : "−"}${(Math.abs(offsetMs) / 1000).toFixed(1)}`;
    return {
      pipeline: { id: "rpc", label, ok: true, lagSec, latencyMs: rttMs, detail: STATUS.detail.rpc(blockNumber.toLocaleString("en-US"), offsetText), optional: false, configured: true },
      blockNumber,
    };
  } catch (error) {
    return { pipeline: down("rpc", label, message(error)), blockNumber: null };
  }
}

export async function probeIndexer(env: MarketsEnv): Promise<{ pipeline: StatusPipeline; assets: string[] }> {
  const label = STATUS.pipelines.indexer;
  const startedMs = Date.now();
  try {
    const venue = fresh(await withTimeout(resolveVenueId(env.venueId)));
    if ("failure" in venue) return { pipeline: down("indexer", label, venue.failure), assets: [] };
    if (venue.value.venueId === null) return { pipeline: down("indexer", label, STATUS.detail.noVenue), assets: [] };

    const lanes = fresh(await withTimeout(marketsProvider.listLiveLanes(venue.value.venueId)));
    if ("failure" in lanes) return { pipeline: down("indexer", label, lanes.failure), assets: [] };

    const windows = lanes.value.lanes.reduce((n, lane) => n + lane.markets.length, 0);
    const assets = [...new Set(lanes.value.lanes.flatMap((lane) => lane.markets.map((market) => market.asset)))].sort().slice(0, PRICE_ASSETS_CAP);
    const source = STATUS.detail.venueSource[venue.value.source];
    return {
      pipeline: { id: "indexer", label, ok: true, lagSec: null, latencyMs: Date.now() - startedMs, detail: STATUS.detail.indexer(lanes.value.lanes.length, windows, source), optional: false, configured: true },
      assets,
    };
  } catch (error) {
    return { pipeline: down("indexer", label, message(error)), assets: [] };
  }
}

/** The one real "time lag" here: how old the feed's latest print is against the wall clock. */
export async function probePrice(asset: string, nowMs: number): Promise<StatusPipeline> {
  const id = `price:${asset}`;
  const label = STATUS.pipelines.price(asset);
  const startedMs = Date.now();
  try {
    const price = fresh(await withTimeout(marketsProvider.getAssetPrice(asset)));
    if ("failure" in price) return down(id, label, price.failure);
    if (price.value === null) return down(id, label, STATUS.detail.noPrint);
    const printedMs = secToMs(price.value.blockTimestampSec);
    const lagSec = Math.max(0, Math.round((nowMs - printedMs) / 1000));
    const priceText = `$${formatBaseUnits(price.value.priceRaw, price.value.decimals)}`;
    return { id, label, ok: true, lagSec, latencyMs: Date.now() - startedMs, detail: STATUS.detail.price(priceText, formatUtc(printedMs)), optional: false, configured: true };
  } catch (error) {
    return down(id, label, message(error));
  }
}

export async function probeStore(): Promise<StatusPipeline> {
  const label = STATUS.pipelines.store;
  if (!isDbConfigured()) return down("store", label, STATUS.detail.storeOff, true, false);
  const startedMs = Date.now();
  try {
    const db = getDb();
    if (!db) return down("store", label, STATUS.detail.storeOff, true, false);
    await withTimeout(db`select 1`);
    return { id: "store", label, ok: true, lagSec: null, latencyMs: Date.now() - startedMs, detail: STATUS.detail.storeOk, optional: true, configured: true };
  } catch (error) {
    return down("store", label, STATUS.detail.storeDown(message(error)), true, true);
  }
}

/** Which model would answer — never a key, only the route it would take. */
export function probeSensei(): StatusPipeline {
  const label = STATUS.pipelines.sensei;
  try {
    const model = resolveModel();
    if (!model) return down("sensei", label, STATUS.detail.senseiOff(missingCredentialHint()), true, false);
    return { id: "sensei", label, ok: true, lagSec: null, latencyMs: null, detail: STATUS.detail.senseiOk(model.providerName, model.modelId, model.via), optional: true, configured: true };
  } catch (error) {
    return down("sensei", label, message(error), true, true);
  }
}
