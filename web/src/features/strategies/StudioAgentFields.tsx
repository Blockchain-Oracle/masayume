"use client";

import { formatCadence } from "@masayume/core/copy";
import { AGENT_CADENCES_SEC, AGENT_PERSONA_MAX_CHARS, AGENT_POSTURES, describeSpec, POSTURES, type AgentPosture } from "@masayume/core/strategies";
import { parseDecimalToBaseUnits } from "@masayume/core/units";
import { cn } from "@/lib/utils";
import { STRATEGIES } from "./copy";
import { DryReadPanel } from "./DryReadPanel";
import { draftSpec, type StudioDraft } from "./studio-draft";
import { useDryRead } from "./useDryRead";
import "./desk.css";
import "./strategies.css";

const S = STRATEGIES.studio;
const A = STRATEGIES.studio.agent;
const RISK = STRATEGIES.desk.risk;

interface StudioAgentFieldsProps {
  form: StudioDraft;
  setForm: (update: (f: StudioDraft) => StudioDraft) => void;
  asset: string;
  decimals: number;
}

function toggleCadence(list: number[], cadence: number): number[] {
  const next = list.includes(cadence) ? list.filter((c) => c !== cadence) : [...list, cadence];
  return next.length === 0 ? list : next.sort((a, b) => a - b);
}

/**
 * Step 02 for an agent: the brief it reads with, the posture the gate enforces, the Windows it may
 * read — and a dry read, one real model call on a live Window with this brief, nothing sent.
 */
export function StudioAgentFields({ form, setForm, asset, decimals }: StudioAgentFieldsProps) {
  const dry = useDryRead();
  const persona = form.persona;
  const ready = persona.trim().length > 0 && form.cadences.length > 0;
  const stakeBase = parseDecimalToBaseUnits(form.maxPerTrade || "0", decimals) ?? 0n;
  const runDryRead = () => {
    if (!ready || dry.state.status === "reading") return;
    void dry.read({ persona: persona.trim(), posture: form.posture, cadences: [...form.cadences].sort((a, b) => a - b), stakeBase: (stakeBase > 0n ? stakeBase : 1n).toString() });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="desk-field-label mb-0">{A.persona}</span>
          <span className={cn("strat-mono-10 tabular-nums", persona.length >= AGENT_PERSONA_MAX_CHARS ? "text-vermilion" : "text-white/40")}>{A.personaCount(persona.length, AGENT_PERSONA_MAX_CHARS)}</span>
        </div>
        <textarea
          value={persona}
          onChange={(e) => setForm((f) => ({ ...f, persona: e.target.value.slice(0, AGENT_PERSONA_MAX_CHARS) }))}
          placeholder={A.personaPlaceholder}
          maxLength={AGENT_PERSONA_MAX_CHARS}
          className="strat-input strat-textarea text-white"
          aria-label={A.persona}
        />
        <div className="strat-mono-10 mt-1.5 text-white/30">{A.personaHint}</div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="desk-field-label">{A.posture}</div>
          <div className="desk-modes" role="radiogroup" aria-label={A.posture}>
            {AGENT_POSTURES.map((p: AgentPosture) => {
              const rules = POSTURES[p];
              const on = form.posture === p;
              return (
                <button key={p} type="button" role="radio" aria-checked={on} onClick={() => setForm((f) => ({ ...f, posture: p }))} className={cn("desk-mode", on && "desk-mode--on")}>
                  <span className={cn("desk-mode-label", on ? "text-white" : "text-white/60")}>{RISK[p][0]}</span>
                  <span className="desk-mode-detail">{A.postureDetail(Math.round(rules.minConfidence * 100), rules.maxPriceCents, rules.breakerLosses)}</span>
                </button>
              );
            })}
          </div>
          <div className="strat-mono-10 mt-1.5 text-white/30">{A.postureHint}</div>
        </div>
        <div>
          <div className="desk-field-label">{A.cadences}</div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={A.cadences}>
            {AGENT_CADENCES_SEC.map((c) => (
              <button key={c} type="button" aria-pressed={form.cadences.includes(c)} onClick={() => setForm((f) => ({ ...f, cadences: toggleCadence(f.cadences, c) }))} className={cn("strat-chip", form.cadences.includes(c) && "strat-chip--on")}>
                {formatCadence(c)}
              </button>
            ))}
          </div>
          <div className="strat-mono-10 mt-1.5 text-white/30">{A.cadencesHint}</div>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3">
        <div className="strat-micro mb-1.5 text-vermilion">{S.plain}</div>
        <p className="text-sm leading-snug text-gray-200">{describeSpec(draftSpec(form), asset)}</p>
        <ul className="strat-mono-10 mt-2 space-y-0.5 text-white/40">
          {A.honesty.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={runDryRead} disabled={!ready || dry.state.status === "reading"} className="strat-sensei disabled:cursor-not-allowed disabled:opacity-50">
            {dry.state.status === "reading" ? A.dry.reading : A.dry.cta}
          </button>
          <span className="strat-mono-10 text-white/30">{A.dry.note}</span>
        </div>
        <DryReadPanel state={dry.state} />
      </div>
    </div>
  );
}
