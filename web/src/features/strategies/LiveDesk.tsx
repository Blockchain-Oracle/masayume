"use client";

import { parseStrategyMetadata } from "@masayume/core/strategies";
import { Share2Icon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/states";
import { ConnectButton } from "@/features/markets/wallet";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { STRATEGIES } from "./copy";
import { DeskJoin } from "./DeskJoin";
import { AddPanel, CapsPanel, DeskNotice, DeskPulse, ManageChip, WithdrawPanel } from "./DeskStates";
import { capsFor, joinFloorBase, money, parseAmount, type RiskMode } from "./format";
import { codenameFromAddress } from "./names";
import { AgentPortrait } from "./AgentPortrait";
import type { StrategiesPayload } from "./protocol";
import { RecordCard } from "./RecordCard";
import type { DeskModel } from "./useDesk";
import { useDeskWrites } from "./useDeskWrites";
import "./desk.css";
import "./strategies.css";

const D = STRATEGIES.desk;
type Manage = "add" | "withdraw" | "caps" | null;

interface LiveDeskProps {
  payload: StrategiesPayload;
  desk: DeskModel;
}

/**
 * The Live Desk (reference `components/LiveDesk.tsx`): one house strategy, one decision after
 * "join?" (the amount), the moment after as a living "copying · watching" state, and wins AND
 * losses beside the button. The desk's status is the runner's own heartbeat, never assumed.
 */
export function LiveDesk({ payload, desk }: LiveDeskProps) {
  const { featured, grant, copying, paused, staleRunner, ledgerBase, availableBase } = desk;
  const writes = useDeskWrites();
  const [manage, setManage] = useState<Manage>(null);
  const [depositStr, setDepositStr] = useState("");
  const [withdrawStr, setWithdrawStr] = useState("");
  const [capStr, setCapStr] = useState("");
  const [mode, setMode] = useState<RiskMode>("balanced");
  const [joinedTx, setJoinedTx] = useState<`0x${string}` | null>(null);
  const { decimals, symbol, asset } = payload;

  if (!featured) return <EmptyState why={STRATEGIES.archive.noneBody} />;

  const name = codenameFromAddress(featured.runner);
  const health = desk.health && desk.health.ok ? desk.health.value.strategies[featured.strategyId] ?? null : null;
  const reachable = desk.health && desk.health.ok ? desk.health.value.reachable : null;
  const kind = health?.kind ?? featured.health.kind;
  const deskLive = !staleRunner && kind === "alive";
  const why = health?.why ?? featured.health.why ?? "";
  const lastSide = /bets (up|down)/.exec(why)?.[1] ?? null;
  const brainOff = why.startsWith("agent brain not configured");
  const isAgent = parseStrategyMetadata(featured.metadata)?.spec.preset === "agent";
  const status = staleRunner
    ? D.status.stale
    : reachable === null && desk.health === null
      ? D.status.checking
      : reachable === false
        ? D.status.unknown
        : kind === "never-started"
          ? D.status.neverStarted
          : kind !== "alive"
            ? D.status.offline
            : brainOff
              ? D.status.brainOff
              : lastSide
                ? D.status.signal(lastSide)
                : D.status.watching(asset);

  const typicalCost = BigInt(featured.record.typicalCostBase);
  const perTrade = grant?.caps.maxStakePerTradeBase ?? 0n;
  const frozen = copying && !staleRunner && typicalCost > 0n && (ledgerBase < typicalCost || perTrade < typicalCost);
  const underfundedBalance = frozen && ledgerBase < typicalCost;
  const topUpTo = joinFloorBase(typicalCost, perTrade);

  const report = (result: { ok: boolean; reason?: string }, done: string) => {
    if (result.ok) notify.neutral(done);
    else notify.warning(result.reason ?? "The desk did not answer.");
  };

  const add = async () => {
    const amount = parseAmount(depositStr, decimals);
    if (amount <= 0n || !grant) return;
    report(await writes.addMoney(grant.grantId, amount), `Added ${money(amount, decimals, symbol)} to your desk balance`);
    setDepositStr("");
    setManage(null);
  };
  const withdraw = async () => {
    const amount = parseAmount(withdrawStr, decimals);
    if (amount <= 0n) return;
    report(await writes.withdraw(grant?.grantId ?? null, amount), `${money(amount, decimals, symbol)} is back in your wallet`);
    setWithdrawStr("");
    setManage(null);
  };
  const updateCaps = async () => {
    const cap = parseAmount(capStr, decimals) || perTrade;
    const envelope = {
      maxStakePerTradeBase: BigInt(featured.envelope.maxStakePerTradeBase),
      maxDailySpendBase: BigInt(featured.envelope.maxDailySpendBase),
      maxOpenPositions: featured.envelope.maxOpenPositions,
      maxPriceRaw: BigInt(featured.envelope.maxPriceRaw),
    };
    const result = await writes.join({ strategyId: BigInt(featured.strategyId), runner: featured.runner as `0x${string}`, depositBase: 0n, budgetBase: ledgerBase + availableBase, caps: capsFor(mode, cap, ledgerBase + availableBase, decimals, envelope), feeBase: 0n });
    report(result, `Limits updated: at most ${money(cap, decimals, symbol)} per trade`);
    setCapStr("");
    setManage(null);
  };
  const pause = async () => {
    const sub = desk.subscriptionOf(featured.strategyId);
    if (!sub) return;
    report(await writes.pause(BigInt(featured.strategyId), sub.grantId), "Paused. No new trades. Your balance stays yours; withdraw anytime.");
  };

  const walletText = writes.snapshot && writes.snapshot.ok && writes.snapshot.value ? money(writes.snapshot.value.account.availableBase, decimals, symbol) : "—";

  return (
    <section className="live-desk mt-2 mb-4" id="live-desk">
      <div className="desk">
        <div className="desk-body">
          <div className="flex items-start gap-4">
            <AgentPortrait seed={featured.runner} name={name} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h3 className="desk-name text-ink">{name}</h3>
                <span className="desk-chip-autopilot">{D.autopilot}</span>
              </div>
              <p className="desk-what text-ink/70">{isAgent ? D.whatAgent(asset) : D.what(asset)}</p>
            </div>
            <button type="button" aria-label={D.share} title={D.share} className="desk-share" onClick={() => window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(`Copy ${name} on Masayume.\n\nAutomated ${asset} strategy with risk limits enforced on-chain.\nYour balance stays yours. Review the limits before signing.`)}&url=${encodeURIComponent("https://masayume.app/strategies")}`, "_blank", "noopener,noreferrer")}>
              <Share2Icon aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6">
            <RecordCard record={featured.record} decimals={decimals} symbol={symbol} />
          </div>

          {!writes.address ? (
            <div className="mt-5">
              <ConnectButton />
              <p className="desk-note mt-3 text-ink/30">{D.disconnectedNote}</p>
            </div>
          ) : copying ? (
            <div className="space-y-4 pt-5">
              {joinedTx && (
                <div className="desk-notice">
                  <button type="button" onClick={() => setJoinedTx(null)} aria-label="Dismiss" className="strat-mono-11 absolute top-2 right-2 px-1.5 text-ink/40 hover:text-ink">
                    ×
                  </button>
                  <p className="desk-status mb-1 text-vermilion">{D.joined.eyebrow}</p>
                  <p className="desk-copy desk-copy--lg pr-6 text-ink/80">{D.joined.body(name)}</p>
                </div>
              )}
              <DeskPulse live={deskLive} label={status} />
              <div className="desk-numbers">
                <div>
                  <div className="desk-eyebrow mb-1 text-ink/40">{D.yourBalance}</div>
                  <div className="desk-figure text-ink">{money(ledgerBase, decimals)}</div>
                  <div className="desk-fine mt-1 text-ink/30">{D.onlyYou}</div>
                </div>
                <div>
                  <div className="desk-eyebrow mb-1 text-ink/40">{D.yourLimits}</div>
                  <div className="desk-limits text-ink">≤ {money(perTrade, decimals)} {D.perTrade}</div>
                  <div className="desk-fine mt-1 text-ink/30">{grant ? D.open(grant.openPositions, grant.caps.maxOpenPositions) : "—"} · {D.enforced}</div>
                </div>
              </div>
              {grant && (
                <div className="desk-fine flex max-w-md flex-wrap gap-x-4 gap-y-1 uppercase tracking-[0.12em] text-ink/35">
                  <span>{D.usedToday(money(grant.spentTodayBase, decimals), money(grant.caps.maxDailySpendBase, decimals))}</span>
                  <span>{D.resets}</span>
                  <span>{D.enforced}</span>
                </div>
              )}
              {staleRunner && <DeskNotice eyebrow={D.stale.eyebrow} body={D.stale.body(money(ledgerBase, decimals, symbol))} cta={D.stale.cta} onCta={() => setManage("caps")} />}
              {underfundedBalance && (
                <DeskNotice eyebrow={D.underfunded.eyebrow} body={D.underfunded.body(money(ledgerBase, decimals, symbol), money(typicalCost, decimals), money(topUpTo, decimals))} cta={D.underfunded.cta} onCta={() => setManage("add")} />
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <ManageChip on={manage === "add"} label={D.manage.add} onClick={() => setManage(manage === "add" ? null : "add")} />
                <ManageChip on={manage === "withdraw"} label={D.manage.withdraw} onClick={() => setManage(manage === "withdraw" ? null : "withdraw")} />
                <ManageChip on={manage === "caps"} label={D.manage.caps} onClick={() => setManage(manage === "caps" ? null : "caps")} />
                <button type="button" onClick={pause} disabled={writes.busy === "pause"} className="desk-pill">
                  {writes.busy === "pause" ? D.manage.pausing : D.manage.pause}
                </button>
              </div>
              {manage === "add" && <AddPanel symbol={symbol} busy={writes.busy} value={depositStr} onChange={setDepositStr} walletText={walletText} faucet={null} onSubmit={add} />}
              {manage === "withdraw" && <WithdrawPanel symbol={symbol} busy={writes.busy} value={withdrawStr} onChange={setWithdrawStr} maxText={ledgerBase > 0n ? money(ledgerBase, decimals) : null} onSubmit={withdraw} />}
              {manage === "caps" && <CapsPanel symbol={symbol} busy={writes.busy} mode={mode} setMode={setMode} capStr={capStr} setCapStr={setCapStr} suggested={money(perTrade, decimals)} onSubmit={updateCaps} />}
            </div>
          ) : paused ? (
            <div className="space-y-4 pt-5">
              <div className="desk-pulse border-ink/20">
                <span className="desk-status text-ink/60">{D.paused.title}</span>
                <p className="desk-note mt-1 leading-relaxed text-ink/40">{D.paused.body(money(availableBase, decimals, symbol))}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setManage("caps")} className={cn("desk-btn-primary")}>
                  {D.paused.resume(money(perTrade > 0n ? perTrade : availableBase, decimals))}
                </button>
                <ManageChip on={manage === "withdraw"} label={D.manage.withdraw} onClick={() => setManage(manage === "withdraw" ? null : "withdraw")} />
              </div>
              {manage === "caps" && <CapsPanel symbol={symbol} busy={writes.busy} mode={mode} setMode={setMode} capStr={capStr} setCapStr={setCapStr} suggested={money(perTrade, decimals)} onSubmit={updateCaps} />}
              {manage === "withdraw" && <WithdrawPanel symbol={symbol} busy={writes.busy} value={withdrawStr} onChange={setWithdrawStr} maxText={availableBase > 0n ? money(availableBase, decimals) : null} onSubmit={withdraw} />}
            </div>
          ) : (
            <DeskJoin featured={featured} payload={payload} desk={desk} writes={writes} onJoined={setJoinedTx} />
          )}
        </div>
      </div>
    </section>
  );
}
