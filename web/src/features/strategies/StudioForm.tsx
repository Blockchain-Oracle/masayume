"use client";

import { describeSpec, LOOKBACK_MAX, LOOKBACK_MIN, PRESETS, type AgentPosture, type PresetKey, type StrategySpec } from "@masayume/core/strategies";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STRATEGIES } from "./copy";
import "./strategies.css";

const S = STRATEGIES.studio;

export interface StudioDraft {
  preset: PresetKey;
  lookback: number;
  thresholdPct: string;
  persona: string;
  posture: AgentPosture;
  cadences: number[];
  hosting: "house" | "self";
  agent: string;
  name: string;
  maxPerTrade: string;
  maxDaily: string;
  subFee: string;
  playbook: string;
}

export function draftSpec(form: StudioDraft): StrategySpec {
  if (form.preset === "agent") return { preset: "agent", persona: form.persona.trim(), posture: form.posture, cadences: [...form.cadences].sort((a, b) => a - b) };
  return { preset: form.preset, lookback: form.lookback, thresholdBps: Math.round((parseFloat(form.thresholdPct) || 0) * 100) };
}

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
        <h3 className="strat-choice-title text-white">{step[1]}</h3>
        {step[2] ? <span className="strat-mono-10 hidden text-white/30 sm:block">· {step[2]}</span> : null}
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
        <span className="strat-choice-title text-white">{option[1]}</span>
        <span className={cn("strat-micro", active ? "text-vermilion" : "text-white/30")}>{option[0]}</span>
      </div>
      <p className="strat-choice-body">{option[2]}</p>
    </button>
  );
}

interface StudioFormProps {
  form: StudioDraft;
  setForm: (update: (f: StudioDraft) => StudioDraft) => void;
  symbol: string;
  asset: string;
  houseRunner: string | null;
}

/** The builder: pick a preset, turn two knobs, set hard caps, choose who runs it (reference steps 01–04). */
export function StudioForm({ form, setForm, symbol, asset, houseRunner }: StudioFormProps) {
  return (
    <div className="space-y-8">
      <StudioStep step={S.steps.strategy}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(PRESETS) as PresetKey[]).map((k) => {
            const p = PRESETS[k];
            const active = form.preset === k;
            const comingSoon = k === "reversion";
            return (
              <button key={k} type="button" aria-disabled={comingSoon} onClick={() => !comingSoon && setForm((f) => ({ ...f, preset: k }))} className={cn("strat-choice group", comingSoon ? "strat-choice--off" : active && "strat-choice--on")}>
                <Crosshairs />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="strat-choice-title text-white">{p.name}</span>
                  <span className={cn("strat-micro", active ? "text-vermilion" : "text-white/30")}>{active ? S.selected : p.tagline}</span>
                </div>
                <p className="strat-choice-body">{p.how}</p>
                {comingSoon && <div className="strat-micro mt-2 text-white/30">{S.soonMomentum}</div>}
              </button>
            );
          })}
        </div>
      </StudioStep>

      <StudioStep step={S.steps.tune}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="desk-field-label mb-0">{S.lookback}</span>
              <span className="strat-mono-12 tabular-nums text-white">
                {form.lookback}
                <span className="text-white/40"> {S.rounds}</span>
              </span>
            </div>
            <input type="range" min={LOOKBACK_MIN} max={LOOKBACK_MAX} step={1} value={form.lookback} onChange={(e) => setForm((f) => ({ ...f, lookback: Number(e.target.value) }))} className="w-full accent-vermilion" aria-label={S.lookback} />
            <div className="strat-mono-10 mt-1 text-white/30">{S.lookbackHint}</div>
          </div>
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="desk-field-label mb-0">{S.threshold}</span>
              <span className="strat-mono-12 tabular-nums text-white">{form.thresholdPct || "0"}%</span>
            </div>
            <div className="flex gap-1.5">
              {["0.1", "0.2", "0.5", "1"].map((v) => (
                <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, thresholdPct: v }))} className={cn("strat-chip", form.thresholdPct === v && "strat-chip--on")}>
                  {v}%
                </button>
              ))}
            </div>
            <div className="strat-mono-10 mt-1.5 text-white/30">{S.thresholdHint}</div>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3">
          <div className="strat-micro mb-1.5 text-vermilion">{S.plain}</div>
          <p className="text-sm leading-snug text-gray-200">{describeSpec(draftSpec(form), asset)}</p>
        </div>
      </StudioStep>

      <StudioStep step={S.steps.caps}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={`${S.perTrade} (${symbol})`}>
            <input inputMode="decimal" value={form.maxPerTrade} onChange={(e) => setForm((f) => ({ ...f, maxPerTrade: e.target.value }))} className="strat-input text-white" />
          </Field>
          <Field label={`${S.daily} (${symbol})`}>
            <input inputMode="decimal" value={form.maxDaily} onChange={(e) => setForm((f) => ({ ...f, maxDaily: e.target.value }))} className="strat-input text-white" />
          </Field>
          <Field label={`${S.feeLabel} (${symbol})`}>
            <input inputMode="decimal" value={form.subFee} onChange={(e) => setForm((f) => ({ ...f, subFee: e.target.value }))} className="strat-input text-white" />
          </Field>
        </div>
      </StudioStep>

      <StudioStep step={S.steps.who}>
        <div className="grid gap-3 sm:grid-cols-2">
          <HostingOption active={form.hosting === "house"} onClick={() => setForm((f) => ({ ...f, hosting: "house" }))} option={S.hosting.house} />
          <HostingOption active={form.hosting === "self"} onClick={() => setForm((f) => ({ ...f, hosting: "self" }))} option={S.hosting.self} />
        </div>
        {form.hosting === "house" && !houseRunner && <p className="strat-mono-10 mt-2 text-white/40">{S.houseRunnerMissing}</p>}
        {form.hosting === "self" && (
          <div className="mt-3 max-w-sm">
            <Field label={S.agentWallet}>
              <input value={form.agent} onChange={(e) => setForm((f) => ({ ...f, agent: e.target.value }))} placeholder={S.agentPlaceholder} className="strat-input text-white" />
            </Field>
          </div>
        )}
        <div className="mt-4 max-w-xl">
          <Field label={`${S.playbook} · ${S.playbookHint}`}>
            <textarea value={form.playbook} onChange={(e) => setForm((f) => ({ ...f, playbook: e.target.value }))} className="strat-input strat-textarea text-white" maxLength={4000} />
          </Field>
        </div>
      </StudioStep>
    </div>
  );
}
