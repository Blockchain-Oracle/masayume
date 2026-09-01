import { formatBaseUnits, formatOracleRaw, isOk, phase, type EventMarket, type Reading } from "@masayume/core";
import { ensureMarkets, loadCollateral, marketsProvider, resolveVenueId, syncClock } from "@masayume/markets";
import { ORACLE_PRICE_SCALE } from "@masayume/markets/identity";
import { webEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

function describe<T>(reading: Reading<T>): string {
  if (!reading.ok) return `error: ${reading.error.kind} — ${reading.error.technical}`;
  const age = reading.stale ? ` · STALE (${reading.staleReason})` : "";
  return `ok · asOf ${new Date(reading.asOfMs).toISOString()}${age}`;
}

function MarketRow({ market, nowMs }: { market: EventMarket; nowMs: number }) {
  const opening = market.openingPriceRaw === null ? "waiting for opening print" : formatOracleRaw(market.openingPriceRaw, ORACLE_PRICE_SCALE);
  return (
    <li>
      {market.asset} · {phase(market, nowMs)} · expires {new Date(market.expirySec * 1000).toISOString()} · open {opening} · vol{" "}
      {formatBaseUnits(market.volumeQuoteRaw, market.decimals)} · {market.tradeCount} trades · {market.marketId.slice(-6)}
    </li>
  );
}

export default async function PortPage() {
  ensureMarkets(webEnv.markets);
  const [clock, collateral, venue] = await Promise.all([syncClock(), loadCollateral(), resolveVenueId(webEnv.markets.venueId)]);
  const venueId = isOk(venue) ? venue.value.venueId : null;
  const lanes = venueId ? await marketsProvider.listLiveLanes(venueId) : null;
  const nowMs = marketsProvider.nowMs();

  return (
    <main className="flex flex-1 flex-col gap-6 p-8 font-mono text-sm">
      <h1 className="text-xl font-semibold">Chain port — live lanes as Reading&lt;LaneSet&gt;</h1>
      <section>
        <h2 className="font-semibold">Boot</h2>
        <ul>
          <li>clock: {describe(clock)}{isOk(clock) ? ` · offset ${clock.value.offsetMs} ms · rtt ${clock.value.rttMs} ms · block ${clock.value.blockNumber}` : ""}</li>
          <li>collateral: {describe(collateral)}{isOk(collateral) ? ` · ${collateral.value.symbol} (${collateral.value.decimals} dp) ${collateral.value.address}` : ""}</li>
          <li>venue: {describe(venue)}{isOk(venue) ? ` · source=${venue.value.source} · ${venue.value.venueId ?? "none"} · ${venue.value.liveCount} live` : ""}</li>
          <li>now (chain-corrected): {new Date(nowMs).toISOString()}</li>
        </ul>
      </section>
      {lanes ? (
        <section>
          <h2 className="font-semibold">Lanes: {describe(lanes)}</h2>
          {isOk(lanes) ? (
            <div className="flex flex-col gap-4">
              <p>{lanes.value.lanes.length} lanes · {lanes.value.excludedFixedStrike} fixed-strike markets hidden</p>
              {lanes.value.lanes.map((lane) => (
                <div key={lane.intervalSec}>
                  <h3 className="font-semibold">{lane.label} ({lane.intervalSec}s) — {lane.markets.length} live</h3>
                  <ul>
                    {lane.markets.map((market) => (
                      <MarketRow key={market.marketId} market={market} nowMs={nowMs} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : (
        <p>No venue resolved — lanes not read.</p>
      )}
    </main>
  );
}
