"use client";

import { SomniaMarketsProvider } from "@somnia-chain/markets-sdk/react";
import { useEffect, useState, type ReactNode } from "react";
import type { MarketsEnv } from "../env";
import { activeWsIndex, configureMarkets, ensureMarkets, exchangeVersion, getClient, probeWsUrls, subscribeExchange } from "../runtime/read-runtime";

/** Mounts the SDK's client provider over our singleton; re-keys whenever the singleton is rebuilt (RPC rotation). */
export function MarketsProvider({ env, children }: { env: MarketsEnv; children: ReactNode }) {
  const [version, setVersion] = useState(() => {
    ensureMarkets(env);
    return exchangeVersion();
  });

  useEffect(() => subscribeExchange(() => setVersion(exchangeVersion())), []);

  useEffect(() => {
    let cancelled = false;
    void probeWsUrls(env.rpcWsUrls).then((healthy) => {
      if (!cancelled && healthy !== activeWsIndex()) configureMarkets(env, { wsIndex: healthy });
    });
    return () => {
      cancelled = true;
    };
  }, [env]);

  return (
    <SomniaMarketsProvider key={version} client={getClient()}>
      {children}
    </SomniaMarketsProvider>
  );
}
