"use client";

import { describeSpec, encodeStrategyMetadata } from "@masayume/core/strategies";
import { parseDecimalToBaseUnits } from "@masayume/core/units";
import { useEffect, useState } from "react";
import { notify } from "@/lib/toast";
import { AgentPortrait } from "./AgentPortrait";
import { STRATEGIES } from "./copy";
import { codenameFromAddress } from "./names";
import { draftSpec, StudioForm, type StudioDraft } from "./StudioForm";
import type { useDeskWrites } from "./useDeskWrites";
import "./strategies.css";

const S = STRATEGIES.studio;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

interface CreatorStudioProps {
  writes: ReturnType<typeof useDeskWrites>;
  decimals: number;
  symbol: string;
  asset: string;
  /** The house runner's key on this deployment, or null when none is configured. */
  houseRunner: string | null;
}

/**
 * Creator studio (reference section "Launch an agent"). The reference wears a "Coming soon" badge
 * and never opens its builder; here the same builder opens and publishes to the registry, because
 * the house runner honours the momentum spec today. Recorded for the user's review in the ledger.
 */
export function CreatorStudio({ writes, decimals, symbol, asset, houseRunner }: CreatorStudioProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StudioDraft>({ preset: "momentum", lookback: 6, thresholdPct: "0.2", hosting: houseRunner ? "house" : "self", agent: "", name: "", maxPerTrade: "5", maxDaily: "50", subFee: "0", playbook: "" });
  useEffect(() => {
    if (writes.address && !form.agent) setForm((f) => ({ ...f, agent: writes.address as string }));
  }, [writes.address, form.agent]);

  const runner = form.hosting === "house" ? houseRunner : form.agent.trim();
  const validRunner = Boolean(runner && ADDRESS.test(runner));
  const previewSeed = `${runner ?? ""}:${form.preset}:${form.lookback}:${form.thresholdPct}`;
  const previewName = validRunner ? codenameFromAddress(previewSeed) : S.yourAgent;

  const publish = async () => {
    const perTrade = parseDecimalToBaseUnits(form.maxPerTrade || "0", decimals) ?? 0n;
    const daily = parseDecimalToBaseUnits(form.maxDaily || "0", decimals) ?? 0n;
    const fee = parseDecimalToBaseUnits(form.subFee || "0", decimals) ?? 0n;
    if (!runner || !validRunner) return notify.warning("Agent wallet must be a 0x… address");
    if (perTrade <= 0n) return notify.warning("Most per trade must be greater than 0");
    if (daily < perTrade) return notify.warning("Most per day must be at least the per-trade cap");
    const spec = draftSpec(form);
    const metadata = { name: form.name.trim() || codenameFromAddress(previewSeed), description: describeSpec(spec, asset), spec, ...(form.playbook.trim() ? { playbook: form.playbook.trim() } : {}) };
    const result = await writes.publish({ kind: "strategy-publish", runner: runner as `0x${string}`, spec, metadata, envelope: { maxStakePerTradeBase: perTrade, maxDailySpendBase: daily, maxOpenPositions: 2, maxPriceRaw: 0n }, feeBase: fee });
    if (result.ok) {
      notify.neutral(form.hosting === "house" ? "Agent listed on Somnia. It starts trading once the runner picks it up." : "Strategy published. Users can now copy it.");
      setOpen(false);
    } else notify.warning(result.reason ?? "Publish failed.");
    void encodeStrategyMetadata;
  };

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="min-w-0">
          <div className="strat-meta mb-1.5 tracking-[0.2em] text-vermilion">{S.eyebrow}</div>
          <div className="flex items-center gap-2.5">
            <h2 className="strat-h2">{S.title}</h2>
            {!writes.address ? <span className="strat-pill-v">{S.soon}</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {writes.address && !open && (
            <button type="button" onClick={() => setOpen(true)} className="strat-sensei">
              {S.launch}
            </button>
          )}
          <a href="/markets?sensei=1" className="strat-sensei">
            {S.sensei}
          </a>
        </div>
      </div>

      {writes.address && open && (
        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[1fr_20rem]">
          <StudioForm form={form} setForm={(update) => setForm(update)} symbol={symbol} asset={asset} houseRunner={houseRunner} />
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="strat-preview group">
              <div className="flex items-center justify-between">
                <div className="strat-micro text-white/40">{S.preview}</div>
                {form.hosting === "house" && <span className="strat-pill-v">{STRATEGIES.desk.autopilot}</span>}
              </div>
              <div className="mt-3 flex items-center gap-3">
                {validRunner ? <AgentPortrait seed={previewSeed} name={previewName} size="small" /> : <span className="text-2xl leading-none">—</span>}
                <div className="min-w-0">
                  <div className="strat-choice-title truncate text-white">{previewName}</div>
                  <div className="strat-mono-10 text-white/40">
                    {form.preset === "momentum" ? "Momentum" : "Mean-reversion"} · {S.cap(`${form.maxPerTrade || "0"} ${symbol}`)}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 border-t border-white/[0.08]">
                <div className="strat-ledger-stat">
                  <div className="strat-micro mb-1 text-white/40">{S.perTrade}</div>
                  <div className="strat-ledger-value text-white">{form.maxPerTrade || "0"}</div>
                </div>
                <div className="strat-ledger-stat">
                  <div className="strat-micro mb-1 text-white/40">{S.subFee}</div>
                  <div className="strat-ledger-value text-white">{form.subFee || "0"}</div>
                </div>
              </div>
              <p className="strat-choice-body mt-4">{describeSpec(draftSpec(form), asset)}</p>
            </div>
            <button type="button" onClick={publish} disabled={writes.busy === "publish" || !writes.canSign} className="strat-publish">
              {writes.busy === "publish" ? S.launching : form.hosting === "house" ? S.launch : S.publish}
            </button>
            <p className="strat-mono-10 leading-relaxed text-gray-600">{S.note}</p>
          </aside>
        </div>
      )}
    </section>
  );
}
