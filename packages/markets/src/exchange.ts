import { SOMNIA_TESTNET_PRICE_FEED, SomniaMarkets } from "@somnia-chain/markets-sdk";
import type { WalletClient } from "viem";
import { resolveAddresses } from "./addresses";
import { SOMNIA_SHANNON } from "./chain";
import type { MarketsEnv } from "./env";

type ExchangeConfig = ConstructorParameters<typeof SomniaMarkets>[0];

let exchange: SomniaMarkets | null = null;
let version = 0;

/** Builds the module-level SDK singleton. Every consumer (web, ops, scripts) goes through this one instance. */
export function configureMarkets(env: MarketsEnv, options: { wsIndex?: number } = {}): SomniaMarkets {
  const wsRpcUrl = env.rpcWsUrls[options.wsIndex ?? 0] ?? env.rpcWsUrls[0];
  const config: ExchangeConfig = {
    indexerUrl: env.indexerUrl,
    chain: SOMNIA_SHANNON,
    wsRpcUrl,
    addresses: resolveAddresses(),
    priceFeed: env.priceFeedUrl ? { url: env.priceFeedUrl, quote: env.priceFeedQuote } : SOMNIA_TESTNET_PRICE_FEED,
  };
  exchange = new SomniaMarkets(config);
  version += 1;
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
}

/** Bumps whenever the singleton is rebuilt so React providers can re-key. */
export function exchangeVersion(): number {
  return version;
}
