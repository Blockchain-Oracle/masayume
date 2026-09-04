import type { AgentPosture, PresetKey, StrategySpec } from "@masayume/core/strategies";

/** What the studio holds while a creator builds: every preset's knobs at once, so switching presets loses nothing. */
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

/** The spec the draft would publish — the only thing hashed on-chain. */
export function draftSpec(form: StudioDraft): StrategySpec {
  if (form.preset === "agent") return { preset: "agent", persona: form.persona.trim(), posture: form.posture, cadences: [...form.cadences].sort((a, b) => a - b) };
  return { preset: form.preset, lookback: form.lookback, thresholdBps: Math.round((parseFloat(form.thresholdPct) || 0) * 100) };
}
