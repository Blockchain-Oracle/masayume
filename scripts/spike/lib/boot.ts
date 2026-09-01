import { ensureMarkets, parseMarketsEnv, type MarketsEnv } from "@masayume/markets";

export type Exchange = ReturnType<typeof ensureMarkets>;
export type Client = Exchange["client"];

export interface Spike {
  env: MarketsEnv;
  exchange: Exchange;
  client: Client;
}

const EXIT_GRACE_MS = 3_000;

/** Opens the port for a read-only spike and guarantees the process exits even if the SDK socket lingers after close(). */
export async function runSpike(body: (spike: Spike) => Promise<void>): Promise<void> {
  const env = parseMarketsEnv({ venueId: process.env.VENUE_ID });
  const exchange = ensureMarkets(env);
  try {
    await body({ env, exchange, client: exchange.client });
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await exchange.close();
    setTimeout(() => process.exit(process.exitCode ?? 0), EXIT_GRACE_MS).unref();
  }
}

export function short(hex: string): string {
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`;
}
