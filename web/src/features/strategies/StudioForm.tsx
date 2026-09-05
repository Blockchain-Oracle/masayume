"use client";

import { describeSpec, LOOKBACK_MAX, LOOKBACK_MIN, PRESETS, type PresetKey } from "@masayume/core/strategies";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STRATEGIES } from "./copy";
import { draftSpec, type StudioDraft } from "./studio-draft";
import { StudioAgentFields } from "./StudioAgentFields";
import "./strategies.css";

export { draftSpec, type StudioDraft } from "./studio-draft";

const S = STRATEGIES.studio;

function Crosshairs() {
  return (
    <>
      <span className="strat-corner strat-corner--tl" />
      <span className="strat-corner strat-corner--tr" />
      <span className="strat-corner strat-corner--bl" />
      <span className="strat-corner strat-corner--br" />
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="desk-field-label">{label}</span>
      {children}
    </label>
  );
}

/** One numbered step of the creator studio — editorial index + rule. */
function StudioStep({ step, children }: { step: readonly [string, string, string?]; children: ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <span className="strat-mono-11 tabular-nums text-vermilion">{step[0]}</span>
        <h3 className="strat-choice-title text-ink">{step[1]}</h3>
        {step[2] ? <span className="strat-mono-10 hidden text-ink/30 sm:block">· {step[2]}</span> : null}
      </div>
      {children}
    </div>
  );
}

function HostingOption({ active, onClick, option }: { active: boolean; onClick: () => void; option: readonly [string, string, string] }) {
  return (
    <button type="button" onClick={onClick} className={cn("strat-choice group", active && "strat-choice--on")}>
      <Crosshairs />
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="strat-choice-title text-ink">{option[1]}</span>
        <span className={cn("strat-micro", active ? "text-vermilion" : "text-ink/30")}>{option[0]}</span>
      </div>
      <p className="strat-choice-body">{option[2]}</p>
    </button>
  );
}

/** The house model's two knobs (reference step 02). */
function TuneFields({ form, setForm, asset }: { form: StudioDraft; setForm: StudioFormProps["setForm"]; asset: string }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="desk-field-label mb-0">{S.lookback}</span>
            <span className="strat-mono-12 tabular-nums text-ink">
              {form.lookback}
              <span className="text-ink/40"> {S.rounds}</span>
            </span>
          </div>
          <input type="range" min={LOOKBACK_MIN} max={LOOKBACK_MAX} step={1} value={form.lookback} onChange={(e) => setForm((f) => ({ ...f, lookback: Number(e.target.value) }))} className="w-full accent-vermilion" aria-label={S.lookback} />
          <div className="strat-mono-10 mt-1 text-ink/30">{S.lookbackHint}</div>
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="desk-field-label mb-0">{S.threshold}</span>
            <span className="strat-mono-12 tabular-nums text-ink">{form.thresholdPct || "0"}%</span>
          </div>
          <div className="flex gap-1.5">
            {["0.1", "0.2", "0.5", "1"].map((v) => (
              <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, thresholdPct: v }))} className={cn("strat-chip", form.thresholdPct === v && "strat-chip--on")}>
                {v}%
              </button>
            ))}
          </div>
          <div className="strat-mono-10 mt-1.5 text-ink/30">{S.thresholdHint}</div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-hairline bg-ink/[0.02] px-4 py-3">
        <div className="strat-micro mb-1.5 text-vermilion">{S.plain}</div>
        <p className="text-sm leading-snug text-ink-secondary">{describeSpec(draftSpec(form), asset)}</p>
      </div>
    </>
  );
}

interface StudioFormProps {
  form: StudioDraft;
  setForm: (update: (f: StudioDraft) => StudioDraft) => void;
  symbol: string;
  asset: string;
  decimals: number;
  houseRunner: string | null;
}

/** The builder: pick a preset, tune it (two knobs, or a brief for an agent), set hard caps, choose who runs it (reference steps 01–04). */
export function StudioForm({ form, setForm, symbol, asset, decimals, houseRunner }: StudioFormProps) {
  const isAgent = form.preset === "agent";
  return (
    <div className="space-y-8">
      <StudioStep step={S.steps.strategy}>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(PRESETS) as PresetKey[]).map((k) => {
            const p = PRESETS[k];
            const active = form.preset === k;
            const comingSoon = k === "reversion";
            return (
              <button key={k} type="button" aria-disabled={comingSoon} onClick={() => !comingSoon && setForm((f) => ({ ...f, preset: k }))} className={cn("strat-choice group", comingSoon ? "strat-choice--off" : active && "strat-choice--on")}>
                <Crosshairs />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="strat-choice-title text-ink">{p.name}</span>
                  <span className={cn("strat-micro", active ? "text-vermilion" : "text-ink/30")}>{active ? S.selected : p.tagline}</span>
                </div>
                <p className="strat-choice-body">{p.how}</p>
                {comingSoon && <div className="strat-micro mt-2 text-ink/30">{S.soonMomentum}</div>}
              </button>
            );
          })}
        </div>
      </StudioStep>

      {isAgent ? (
        <StudioStep step={S.agent.step}>
          <StudioAgentFields form={form} setForm={setForm} asset={asset} decimals={decimals} />
        </StudioStep>
      ) : (
        <StudioStep step={S.steps.tune}>
          <TuneFields form={form} setForm={setForm} asset={asset} />
        </StudioStep>
      )}

      <StudioStep step={S.steps.caps}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={`${S.perTrade} (${symbol})`}>
            <input inputMode="decimal" value={form.maxPerTrade} onChange={(e) => setForm((f) => ({ ...f, maxPerTrade: e.target.value }))} className="strat-input text-ink" />
          </Field>
          <Field label={`${S.daily} (${symbol})`}>
            <input inputMode="decimal" value={form.maxDaily} onChange={(e) => setForm((f) => ({ ...f, maxDaily: e.target.value }))} className="strat-input text-ink" />
          </Field>
          <Field label={`${S.feeLabel} (${symbol})`}>
            <input inputMode="decimal" value={form.subFee} onChange={(e) => setForm((f) => ({ ...f, subFee: e.target.value }))} className="strat-input text-ink" />
          </Field>
        </div>
      </StudioStep>

      <StudioStep step={S.steps.who}>
        <div className="grid gap-3 sm:grid-cols-2">
          <HostingOption active={form.hosting === "house"} onClick={() => setForm((f) => ({ ...f, hosting: "house" }))} option={S.hosting.house} />
          <HostingOption active={form.hosting === "self"} onClick={() => setForm((f) => ({ ...f, hosting: "self" }))} option={S.hosting.self} />
        </div>
        {form.hosting === "house" && !houseRunner && <p className="strat-mono-10 mt-2 text-ink/40">{S.houseRunnerMissing}</p>}
        {form.hosting === "self" && (
          <div className="mt-3 max-w-sm">
            <Field label={S.agentWallet}>
              <input value={form.agent} onChange={(e) => setForm((f) => ({ ...f, agent: e.target.value }))} placeholder={S.agentPlaceholder} className="strat-input text-ink" />
            </Field>
            {isAgent && <p className="strat-mono-10 mt-2 leading-relaxed text-ink/40">{S.hostingSelfAgent}</p>}
          </div>
        )}
        <div className="mt-4 max-w-xl">
          <Field label={`${S.playbook} · ${S.playbookHint}`}>
            <textarea value={form.playbook} onChange={(e) => setForm((f) => ({ ...f, playbook: e.target.value }))} className="strat-input strat-textarea text-ink" maxLength={4000} />
          </Field>
        </div>
      </StudioStep>
    </div>
  );
}
