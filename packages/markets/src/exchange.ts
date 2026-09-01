import { SOMNIA_TESTNET_PRICE_FEED, SomniaMarkets } from "@somnia-chain/markets-sdk";
import type { WalletClient } from "viem";
import { resolveAddresses } from "./addresses";
import { SOMNIA_SHANNON } from "./chain";
import type { MarketsEnv } from "./env";

type ExchangeConfig = ConstructorParameters<typeof SomniaMarkets>[0];

const WS_PROBE_TIMEOUT_MS = 4_000;

/** Runtime rotation rebuilds the singleton and drops every live watch, so it stays opt-in (plan ruling #8). */
export const AUTO_ROTATE_RPC = false;

let exchange: SomniaMarkets | null = null;
let version = 0;
let wsIndex = 0;
const listeners = new Set<() => void>();

function buildConfig(env: MarketsEnv, wsRpcUrl: string | undefined): ExchangeConfig {
  return {
    indexerUrl: env.indexerUrl,
    chain: SOMNIA_SHANNON,
    wsRpcUrl,
    addresses: resolveAddresses(),
    priceFeed: env.priceFeedUrl ? { url: env.priceFeedUrl, quote: env.priceFeedQuote } : SOMNIA_TESTNET_PRICE_FEED,
  };
}

/** Builds the module-level SDK singleton. Every consumer (web, ops, scripts) goes through this one instance. */
export function configureMarkets(env: MarketsEnv, options: { wsIndex?: number } = {}): SomniaMarkets {
  wsIndex = options.wsIndex ?? wsIndex;
  const previous = exchange;
  exchange = new SomniaMarkets(buildConfig(env, env.rpcWsUrls[wsIndex] ?? env.rpcWsUrls[0]));
  version += 1;
  if (previous) void previous.close().catch(() => undefined);
  for (const listener of listeners) listener();
  return exchange;
}

/** Configures once per process; safe to call from every entry point. */
export function ensureMarkets(env: MarketsEnv): SomniaMarkets {
  return exchange ?? configureMarkets(env);
}

export function getExchange(): SomniaMarkets {
  if (!exchange) throw new Error("markets port not configured — call configureMarkets(env) first");
  return exchange;
}

export function getClient() {
  return getExchange().client;
}

export function requireTrader() {
  return getExchange().trader;
}

export function signerAddress() {
  return exchange?.walletAddress;
}

/** Hands the wallet-session client from wagmi to the SDK; passing nothing unbinds on disconnect. */
export function bindSigner(walletClient?: WalletClient): void {
  getExchange().setSigner(walletClient ? { walletClient } : {});
  for (const listener of listeners) listener();
}

/** Bumps whenever the singleton is rebuilt so React providers can re-key. */
export function exchangeVersion(): number {
  return version;
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
export function rotateRpc(env: MarketsEnv): SomniaMarkets {
  const next = (wsIndex + 1) % Math.max(1, env.rpcWsUrls.length);
  return configureMarkets(env, { wsIndex: next });
}
