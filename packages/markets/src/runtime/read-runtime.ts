/**
 * The shared read-only DreamDEX runtime.
 *
 * One instance per browser tab or server process: public/indexer clients, market metadata,
 * subscriptions and caches. It has NO mutable account and NO signer, and it never exposes
 * `.trader` — so an endpoint rotation can never change any actor's signing authority, and
 * two actors can never end up sharing one mutable signer.
 *
 * Everything that signs uses its own SubmitterSession (see ../sessions).
 */
import { SOMNIA_TESTNET_PRICE_FEED, SomniaMarkets } from "@somnia-chain/markets-sdk";
import { resolveAddresses } from "../addresses";
import { SOMNIA_SHANNON } from "../chain";
import type { MarketsEnv } from "../env";
import { resolveParlayDeployment } from "../parlay/deployment";
import { resolveVaultDeployment } from "../vault/deployment";
import type { ParlayDeployment } from "@masayume/core/parlay";
import type { VaultDeployment } from "@masayume/core/vault";

type ExchangeConfig = ConstructorParameters<typeof SomniaMarkets>[0];

const WS_PROBE_TIMEOUT_MS = 4_000;

/** Runtime rotation rebuilds the singleton and drops every live watch, so it stays opt-in (plan ruling #8). */
export const AUTO_ROTATE_RPC = false;

let exchange: SomniaMarkets | null = null;
let vaultDeployment: VaultDeployment | null = null;
let parlayDeployment: ParlayDeployment | null = null;
let version = 0;
let wsIndex = 0;
const listeners = new Set<() => void>();
const teardowns = new Set<() => void>();

function buildConfig(env: MarketsEnv, wsRpcUrl: string | undefined): ExchangeConfig {
  return {
    indexerUrl: env.indexerUrl,
    chain: SOMNIA_SHANNON,
    wsRpcUrl,
    addresses: resolveAddresses(),
    priceFeed: env.priceFeedUrl ? { url: env.priceFeedUrl, quote: env.priceFeedQuote } : SOMNIA_TESTNET_PRICE_FEED,
  };
}

/**
 * Builds the module-level read runtime. Every consumer (web, ops, scripts) shares this one
 * instance. It returns nothing on purpose: handing the SomniaMarkets object back would hand
 * out `.trader` and `.setSigner` with it, which is exactly the coupling this split removes.
 */
export function configureMarkets(env: MarketsEnv, options: { wsIndex?: number } = {}): void {
  wsIndex = options.wsIndex ?? wsIndex;
  const previous = exchange;
  exchange = new SomniaMarkets(buildConfig(env, env.rpcWsUrls[wsIndex] ?? env.rpcWsUrls[0]));
  vaultDeployment = resolveVaultDeployment(env);
  parlayDeployment = resolveParlayDeployment(env);
  version += 1;
  if (previous) void previous.close().catch(() => undefined);
  for (const listener of listeners) listener();
}

/** Configures once per process; safe to call from every entry point. */
export function ensureMarkets(env: MarketsEnv): void {
  if (!exchange) configureMarkets(env);
}

function getExchange(): SomniaMarkets {
  if (!exchange) throw new Error("markets port not configured — call configureMarkets(env) first");
  return exchange;
}

export function getClient() {
  return getExchange().client;
}

/** The EventVault for the configured chain, or null where none is deployed — every vault read branches on this. */
export function getVaultDeployment(): VaultDeployment | null {
  return vaultDeployment;
}

/** The ParlayReserve for the configured chain, or null where none is deployed — every parlay read branches on this. */
export function getParlayDeployment(): ParlayDeployment | null {
  return parlayDeployment;
}

/** Bumps whenever the singleton is rebuilt so React providers can re-key. */
export function exchangeVersion(): number {
  return version;
}

/**
 * Registers work that must run before the shared client is closed — releasing the watch handles
 * held on it, above all. Kept as a registry rather than a direct call so nothing downstream of the
 * runtime has to be imported back into it.
 */
export function onRuntimeClose(teardown: () => void): () => void {
  teardowns.add(teardown);
  return () => teardowns.delete(teardown);
}

/** Releases the shared runtime and its watches. */
export async function closeRuntime(): Promise<void> {
  const previous = exchange;
  exchange = null;
  for (const teardown of [...teardowns]) teardown();
  await previous?.close().catch(() => undefined);
}

export function activeWsIndex(): number {
  return wsIndex;
}

export function subscribeExchange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function probeWsUrl(url: string, timeoutMs: number): Promise<boolean> {
  if (typeof WebSocket === "undefined") return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    let socket: WebSocket | null = null;
    const finish = (healthy: boolean) => {
      if (settled) return;
      settled = true;
      try {
        socket?.close();
      } catch {
        // a socket that never opened may throw on close; the probe result stands
      }
      resolve(healthy);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    try {
      socket = new WebSocket(url);
      socket.onopen = () => {
        clearTimeout(timer);
        finish(true);
      };
      socket.onerror = () => {
        clearTimeout(timer);
        finish(false);
      };
    } catch {
      clearTimeout(timer);
      finish(false);
    }
  });
}

/** Index of the first WebSocket endpoint that answers within the timeout; 0 when none do (the SDK then reports its own failure). */
export async function probeWsUrls(urls: readonly string[], timeoutMs = WS_PROBE_TIMEOUT_MS): Promise<number> {
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    if (url && (await probeWsUrl(url, timeoutMs))) return i;
  }
  return 0;
}

/** Rebuilds the singleton on the next endpoint in the list (both testnet RPCs are configured, NFR-10). */
export function rotateRpc(env: MarketsEnv): void {
  const next = (wsIndex + 1) % Math.max(1, env.rpcWsUrls.length);
  configureMarkets(env, { wsIndex: next });
}
