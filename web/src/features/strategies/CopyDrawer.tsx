"use client";

import type { StrategySubscription } from "@masayume/core/strategies";
import { parseStrategyMetadata } from "@masayume/core/strategies";
import { addressUrl } from "@masayume/core/urls";
import { Share2Icon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConnectButton } from "@/features/markets/wallet";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { AgentMemory } from "./AgentMemory";
import { AgentPortrait } from "./AgentPortrait";
import { STRATEGIES } from "./copy";
import { capsFor, money, parseAmount } from "./format";
import { ago, codenameFromAddress } from "./names";
import type { StrategyWire } from "./protocol";
import { tierOf } from "./StrategyCard";
import type { useDeskWrites } from "./useDeskWrites";
import "./strategies.css";

const D = STRATEGIES.drawer;

interface CopyDrawerProps {
  card: StrategyWire;
  sub: StrategySubscription | null;
  writes: ReturnType<typeof useDeskWrites>;
  availableBase: bigint;
  decimals: number;
  symbol: string;
  asset: string;
  nowMs: number;
  /** Whether the decision store answered — "no memory yet" and "no store" are different sentences. */
  decisionsStore: boolean;
  onClose: () => void;
}

function CapStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <span className="strat-capstat-label">{label}</span>
      <span className="strat-capstat-value">
        {value}
        {unit && <span className="strat-capstat-unit">{unit}</span>}
      </span>
    </div>
  );
}

/** The focused subscribe flow (reference `CopyDrawer`): review → size → worked example → confirm; or manage / pause. */
export function CopyDrawer({ card, sub, writes, availableBase, decimals, symbol, asset, nowMs, decisionsStore, onClose }: CopyDrawerProps) {
  const [budget, setBudget] = useState("");
  const name = codenameFromAddress(card.strategyId + card.runner);
  const tier = tierOf(card);
  const meta = parseStrategyMetadata(card.metadata);
  const agent = meta?.spec.preset === "agent" ? card.agent : null;
  const maxPerTrade = BigInt(card.envelope.maxStakePerTradeBase);
  const fee = BigInt(card.feeBase);
  const targetBase = parseAmount(budget, decimals);
  const valid = targetBase > 0n;
  const topUp = valid && targetBase > availableBase ? targetBase - availableBase : 0n;
  const cap = valid ? (targetBase < maxPerTrade ? targetBase : maxPerTrade) : 0n;
  const add = (n: number) => setBudget(String(Math.max(0, (parseFloat(budget || "0") || 0) + n)));

  const close = useCallback(() => onClose(), [onClose]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [close]);

  const confirm = async () => {
    if (!valid) return;
    const envelope = { maxStakePerTradeBase: maxPerTrade, maxDailySpendBase: BigInt(card.envelope.maxDailySpendBase), maxOpenPositions: card.envelope.maxOpenPositions, maxPriceRaw: BigInt(card.envelope.maxPriceRaw) };
    const result = await writes.join({ strategyId: BigInt(card.strategyId), runner: card.runner as `0x${string}`, depositBase: topUp, budgetBase: targetBase, caps: capsFor("balanced", cap, targetBase, decimals, envelope), feeBase: fee });
    if (result.ok) {
      notify.neutral(`Now copying ${name}`);
      close();
    } else notify.warning(result.reason ?? "Could not start copying.");
  };
  const pause = async () => {
    if (!sub) return;
    const result = await writes.pause(BigInt(card.strategyId), sub.grantId);
    if (result.ok) notify.neutral(`Paused future copies for ${name}`);
    else notify.warning(result.reason ?? "Pause failed.");
  };
  const share = () => {
    const text = [`Masayume strategy: agent ${name}`, "", card.record.fills > 0 ? `${card.record.fills} copy-trades · ${money(BigInt(card.record.stakedBase), decimals, symbol)} copied` : "listed with hard on-chain risk caps", `${card.subscribers} subscribers · max ${money(maxPerTrade, decimals)} per trade`, "", "Verified by Somnia txs, not screenshots.", "Copy it on Masayume."].join("\n");
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://masayume.app/strategies")}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="strat-drawer-root" onClick={close}>
      <div className="strat-drawer-scrim" />
      <div className="strat-drawer" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={close} aria-label={D.close} className="strat-drawer-close">
          <XIcon aria-hidden="true" />
        </button>

        <div className="mb-5 flex items-center gap-3 pr-8">
          <AgentPortrait seed={card.strategyId + card.runner} name={name} />
          <div className="min-w-0">
            <h2 className="strat-drawer-name">{name}</h2>
            <a href={addressUrl(card.runner as `0x${string}`)} target="_blank" rel="noreferrer" className="strat-meta uppercase tracking-[0.12em] text-gray-500 hover:text-gray-300">
              {D.record}
            </a>
          </div>
          <span className="strat-meta ml-auto shrink-0 tracking-[0.2em]">
            {tier.key === "settled" ? (
              <span className="text-white">
                <span className="text-vermilion">⊙</span> Settled
              </span>
            ) : tier.key === "active" ? (
              <span className="text-white/70">
                <span className="text-vermilion">●</span> Active
              </span>
            ) : (
              <span className="text-white/40">New</span>
            )}
          </span>
        </div>

        <div className="strat-drawer-rule">
          <span className="strat-meta mb-1.5 block font-bold tracking-[0.2em] text-vermilion">{D.guarantee.eyebrow}</span>
          <p className="strat-drawer-body">
            {D.guarantee.body} <strong>{D.guarantee.strong}</strong>
          </p>
        </div>

        <div className="strat-drawer-rule strat-drawer-rule--quiet">
          <p className="strat-meta mb-1 tracking-[0.2em] text-white/40">{D.how.eyebrow}</p>
          {agent ? (
            <>
              <p className="strat-drawer-body">
                {D.agentHow.body(asset)} <strong>{D.agentHow.own}</strong>
                {D.agentHow.tail(money(maxPerTrade, decimals, symbol))}
              </p>
              <p className="strat-mono-10 mt-1.5 truncate text-white/40">{agent.model ? D.agentHow.model(agent.model) : D.agentHow.noModel}</p>
              <ul className="strat-mono-10 mt-1.5 space-y-0.5 text-white/40">
                {STRATEGIES.studio.agent.honesty.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="strat-drawer-body">
              {D.how.body(money(maxPerTrade, decimals), asset)} <strong>{D.how.own}</strong>
              {D.how.tail(money(maxPerTrade, decimals, symbol))}
            </p>
          )}
        </div>

        <div className="mb-2 grid grid-cols-3 gap-3">
          <CapStat label={D.caps.perTrade} value={money(maxPerTrade, decimals)} unit={symbol} />
          <CapStat label={D.caps.daily} value={money(BigInt(card.envelope.maxDailySpendBase), decimals)} unit={symbol} />
          <CapStat label={D.caps.fee} value={fee === 0n ? D.caps.free : money(fee, decimals)} unit={fee === 0n ? undefined : symbol} />
        </div>
        <div className="mb-4 grid grid-cols-3 gap-3 border-b border-white/[0.06] pb-4">
          <CapStat label={D.caps.copiers} value={card.subscribers > 0 ? String(card.subscribers) : "—"} />
          <CapStat label={D.caps.trades} value={String(card.record.fills)} />
          <CapStat label={D.caps.last} value={card.record.lastActiveSec ? ago(card.record.lastActiveSec * 1000, nowMs) : D.caps.none} />
        </div>

        {agent && <AgentMemory agent={agent} storeConnected={decisionsStore} asset={asset} nowMs={nowMs} />}
        {(card.playbook || meta?.playbook) && (
          <div className="mb-4 border border-vermilion/30 px-4 py-3">
            <p className="strat-meta mb-1.5 tracking-[0.18em] text-vermilion">{D.playbook.eyebrow}</p>
            <p className="strat-drawer-body">{D.playbook.body}</p>
            <pre className="strat-mono-11 mt-2 whitespace-pre-wrap break-words rounded border border-white/10 bg-black/30 p-3 leading-relaxed text-gray-300">{card.playbook ?? meta?.playbook}</pre>
          </div>
        )}
        {tier.key === "new" && <p className="strat-mono-11 mb-4 text-gray-500">{D.young}</p>}

        {sub ? (
          <div>
            <div className="strat-drawer-rule mb-4">
              <p className="strat-meta mb-1 tracking-[0.2em] text-vermilion">
                <span className="strat-live-dot mr-1.5 inline-block align-middle" />
                {D.copying.eyebrow}
              </p>
              <p className="strat-drawer-body leading-relaxed">{D.copying.body(money(maxPerTrade, decimals, symbol))}</p>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-gray-500">{D.copying.pauseNote}</p>
            <button type="button" onClick={pause} disabled={writes.busy === "pause"} className="strat-pause">
              {writes.busy === "pause" ? D.copying.pausing : D.copying.pause}
            </button>
          </div>
        ) : !writes.address ? (
          <div className="pt-1">
            <ConnectButton />
          </div>
        ) : (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="strat-meta font-bold tracking-[0.2em] text-gray-400">{D.budget.label}</span>
              <span className="strat-mono-10 text-gray-600">{D.budget.inVault(money(availableBase, decimals, symbol))}</span>
            </div>
            <p className="strat-mono-10 mb-2 leading-relaxed text-gray-600">{D.budget.note}</p>
            <div className="strat-budget">
              <div className="flex items-center justify-between">
                <input autoFocus inputMode="decimal" placeholder="0.00" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ""))} className="strat-budget-input" aria-label={D.budget.label} />
                <span className="strat-mono-12 shrink-0 font-semibold text-gray-300">{symbol}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="strat-mono-10 text-gray-500">{D.budget.limit}</span>
                <div className="flex gap-1.5">
                  {[1, 5, 25].map((n) => (
                    <button key={n} type="button" onClick={() => add(n)} className="strat-budget-chip">
                      +{n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-400">
              {valid ? (
                <>
                  You set a <strong className="font-semibold text-white">{money(targetBase, decimals, symbol)}</strong> {D.example.valid} <strong className="font-semibold text-white">{money(cap, decimals, symbol)}</strong> {D.example.validTail}
                </>
              ) : (
                D.example.invalid(money(maxPerTrade, decimals, symbol))
              )}
            </p>
            {valid && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <CapStat label={D.example.addNow} value={money(topUp, decimals)} unit={symbol} />
                <CapStat label={D.example.walletNeeded} value={money(topUp + fee, decimals)} unit={symbol} />
              </div>
            )}
            <p className="strat-mono-11 mt-4 leading-relaxed text-gray-500">{D.risk}</p>
            <button type="button" onClick={confirm} disabled={writes.busy === "join" || !valid} className={cn("strat-confirm", writes.busy === "join" || !valid ? "strat-confirm--dead" : "strat-confirm--live")}>
              {writes.busy === "join" ? D.cta.starting : !valid ? D.cta.enter : topUp > 0n ? D.cta.add(money(topUp, decimals, symbol)) : D.cta.current}
            </button>
          </div>
        )}

        <button type="button" onClick={share} className="strat-mono-11 mt-5 inline-flex items-center gap-1.5 text-gray-600 transition-colors hover:text-vermilion">
          <Share2Icon className="size-3.5" aria-hidden="true" /> {D.share}
        </button>
      </div>
    </div>
  );
}
