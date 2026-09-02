"use client";

import { isOk } from "@masayume/core/schemas";
import { useVaultSnapshot } from "@masayume/markets/react";
import { useState } from "react";
import { CapabilityPending } from "@/components/shell";
import { ReadingBoundary } from "@/components/states";
import { useChainNowMs } from "@/features/markets/useChainNow";
import { useWalletSession } from "@/lib/wallet-session";
import { CopyDrawer } from "./CopyDrawer";
import { STRATEGIES } from "./copy";
import { CreatorStudio } from "./CreatorStudio";
import { LiveDesk } from "./LiveDesk";
import { MemoryMarket } from "./MemoryMarket";
import type { StrategiesPayload, StrategyWire } from "./protocol";
import { RecentCopyTrades } from "./RecentCopyTrades";
import { StrategyGrid } from "./StrategyGrid";
import { StrategyXBar } from "./StrategyXBar";
import { useDesk } from "./useDesk";
import { useDeskWrites } from "./useDeskWrites";
import { useRefreshStrategies, useStrategies } from "./useStrategies";
import "./strategies.css";

interface StrategiesScreenProps {
  /** The house runner's key, from the server's environment; null when none is configured. */
  houseRunner: string | null;
}

/** `/strategies` — ported from `reference/yosuku/app/strategies/page.tsx`: the desk, the memory market, the archive, recent copy-trades, the studio. */
export function StrategiesScreen({ houseRunner }: StrategiesScreenProps) {
  const reading = useStrategies();
  const refresh = useRefreshStrategies();
  return (
    <div className="container pt-7 pb-12">
      <ReadingBoundary reading={reading} shape="plate" retry={refresh}>
        {(payload) => (payload.deployed ? <Catalogue payload={payload} houseRunner={houseRunner} /> : <NotDeployed />)}
      </ReadingBoundary>
    </div>
  );
}

function NotDeployed() {
  const { notDeployed } = STRATEGIES;
  return (
    <CapabilityPending eyebrow={notDeployed.eyebrow} title={notDeployed.title} dependency={notDeployed.dependency}>
      <p>{notDeployed.body}</p>
    </CapabilityPending>
  );
}

function Catalogue({ payload, houseRunner }: { payload: StrategiesPayload; houseRunner: string | null }) {
  const { address } = useWalletSession();
  const snapshot = useVaultSnapshot(address);
  const desk = useDesk(payload, address, snapshot);
  const writes = useDeskWrites();
  const nowMs = useChainNowMs();
  const [drawer, setDrawer] = useState<StrategyWire | null>(null);
  const { strategies, fills, decimals, symbol, asset } = payload;
  const totalCopiers = strategies.reduce((s, c) => s + c.subscribers, 0);
  const available = snapshot && isOk(snapshot) && snapshot.value ? snapshot.value.account.availableBase : 0n;

  return (
    <>
      <div className="strat-counts">
        <span className="text-ink">{strategies.length}</span> {STRATEGIES.counts.listed}
        <span className="text-ink/20">·</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="strat-live-dot" />
          <span className="text-ink">{totalCopiers}</span> {STRATEGIES.counts.copying}
        </span>
      </div>

      <div className="strat-nameplate">
        <h1 className="strat-h1">{STRATEGIES.headline}</h1>
        <StrategyXBar />
      </div>

      <div className="pb-24 sm:pb-0">
        <LiveDesk payload={payload} desk={desk} />
      </div>

      <MemoryMarket />

      <StrategyGrid strategies={strategies} subscriptionOf={desk.subscriptionOf} decimals={decimals} symbol={symbol} asset={asset} loadError={false} onOpen={setDrawer} />

      <RecentCopyTrades fills={fills} strategies={strategies} storeConnected={payload.stores.fills} decimals={decimals} symbol={symbol} nowMs={nowMs} />

      <CreatorStudio writes={writes} decimals={decimals} symbol={symbol} asset={asset} houseRunner={houseRunner} />

      <p className="strat-mono-10 mt-10 max-w-2xl leading-relaxed text-gray-600">{STRATEGIES.disclosure(asset)}</p>

      {drawer && <CopyDrawer card={drawer} sub={desk.subscriptionOf(drawer.strategyId)} writes={writes} availableBase={available} decimals={decimals} symbol={symbol} asset={asset} nowMs={nowMs} onClose={() => setDrawer(null)} />}
    </>
  );
}
