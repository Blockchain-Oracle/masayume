"use client";

import type { MakerVaultState } from "@masayume/core/maker";
import { isOk } from "@masayume/core/schemas";
import { useBalanceSheet, useMakerHistory, useMakerShares, useMakerVault, useMakerWindows, useMarket } from "@masayume/markets/react";
import { useEffect, useState } from "react";
import { CapabilityPending, SectionHead } from "@/components/shell";
import { ReadingBoundary } from "@/components/states";
import { useWalletSession } from "@/lib/wallet-session";
import { useChainNowMs } from "../markets/useChainNow";
import { useVenue } from "../markets/useVenue";
import { EARN } from "./copy";
import { PositionCard, SupplyCard } from "./SupplyCards";
import { useEarnWrites } from "./useEarnWrites";
import { VaultPanel } from "./VaultPanel";
import { WindowsTable } from "./WindowsTable";
import "../parlay/parlay-page.css";
import "./earn-page.css";

/** True when any open Window is past its expiry — the contract refuses a withdrawal until it is settled. */
function useAnyExpired(marketIds: readonly string[], nowMs: number): boolean {
  const first = useMarket((marketIds[0] as never) ?? null);
  const second = useMarket((marketIds[1] as never) ?? null);
  const rows = [first, second].filter((r) => r && isOk(r)).map((r) => (r as { value: { expirySec: number } }).value);
  return nowMs > 0 && rows.some((m) => m.expirySec * 1000 <= nowMs);
}

/** `/earn` — `reference/yosuku/app/earn/page.tsx`: the hero with the live panel, §01 supply and your position; ours adds §02, where the capital is. */
export function EarnScreen() {
  const reading = useMakerVault();
  return (
    <div className="earn-page ea-page">
      <ReadingBoundary reading={reading} shape="plate">
        {(state) => (state ? <Page vault={state} /> : <NotDeployed />)}
      </ReadingBoundary>
    </div>
  );
}

function NotDeployed() {
  const { notDeployed } = EARN;
  return (
    <div className="container">
      <CapabilityPending eyebrow={notDeployed.eyebrow} title={notDeployed.title} dependency={notDeployed.dependency}>
        <p>{notDeployed.body}</p>
        <p>{notDeployed.why}</p>
      </CapabilityPending>
    </div>
  );
}

function Page({ vault }: { vault: MakerVaultState }) {
  const { boot } = useVenue();
  const symbol = boot && isOk(boot) ? boot.value.collateral.symbol : "tUSDC";
  const { address } = useWalletSession();
  const sheet = useBalanceSheet(address);
  const shares = useMakerShares(address);
  const open = useMakerWindows();
  const history = useMakerHistory(10);
  const nowMs = useChainNowMs();
  const writes = useEarnWrites();
  const [message, setMessage] = useState("");
  useEffect(() => setMessage(writes.msg), [writes.msg]);

  const walletBase = sheet && isOk(sheet) ? sheet.value.spendableBase : null;
  const held = shares && isOk(shares) ? shares.value : { shares: 0n, worthBase: 0n };
  const openViews = open && isOk(open) ? open.value : [];
  const historyViews = history && isOk(history) ? history.value : [];
  const unsettledExpired = useAnyExpired(openViews.map((v) => v.marketId), nowMs);
  const { sections } = EARN;

  return (
    <>
      <section className="page-hero">
        <span className="crop tl" />
        <span className="crop tr" />
        <span className="crop bl" />
        <span className="crop br" />
        <div className="container">
          <div className="hero-grid">
            <div className="hero-left">
              <h1 className="page-title">
                {EARN.title}
                <br />
                <span className="accent">{EARN.titleAccent}</span>.
              </h1>
            </div>
            <VaultPanel vault={vault} symbol={symbol} />
          </div>
        </div>
      </section>

      <main>
        <div className="container ea-main">
          <SectionHead number={sections.supply.number} title={sections.supply.title} meta={sections.supply.meta} />
          {vault.paused && (
            <div className="ea-paused">
              <p className="ea-paused-title">{EARN.paused.title}</p>
              <p className="ea-paused-body">{EARN.paused.body}</p>
            </div>
          )}
          <div className="ea-cards">
            <SupplyCard connected={address !== null} vault={vault} symbol={symbol} walletBase={walletBase} busy={writes.busy} onSupply={writes.supply} onMessage={setMessage} />
            <PositionCard connected={address !== null} vault={vault} symbol={symbol} shares={held.shares} worthBase={held.worthBase} unsettledExpired={unsettledExpired} busy={writes.busy} onWithdraw={writes.withdraw} />
          </div>

          <SectionHead number={sections.windows.number} title={sections.windows.title} meta={sections.windows.meta} />
          <WindowsTable open={openViews} history={historyViews} decimals={vault.decimals} symbol={symbol} nowMs={nowMs} busy={writes.busy} canSign={writes.canSign} onMerge={writes.merge} onSettle={writes.settle} />

          {message && <p className={message.includes("✓") ? "ea-msg" : "ea-msg ea-msg--err"}>{message}</p>}
        </div>
      </main>
    </>
  );
}
