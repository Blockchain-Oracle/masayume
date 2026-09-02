import type { PresetKey, StrategyMetadata, StrategySpec } from "./types";

/** The presets, in the reference's words (`lib/sui/strategyClient.ts` PRESETS). */
export const PRESETS: Record<PresetKey, { name: string; tagline: string; how: string }> = {
  momentum: {
    name: "Momentum",
    tagline: "Follow the trend",
    how: "Reads the last few prices. If the market moved up past the threshold it bets UP, and DOWN if it fell. It rides whichever way price is already going.",
  },
  reversion: {
    name: "Mean-reversion",
    tagline: "Fade the move",
    how: "The opposite instinct. If the market ran up past the threshold it bets DOWN, expecting a pullback. After a sharp drop it bets UP. It bets against the last move.",
  },
};

export const LOOKBACK_MIN = 2;
export const LOOKBACK_MAX = 12;

/** Plain-language description of exactly what the runner will do with this spec (reference `describeSpec`). */
export function describeSpec(s: StrategySpec, asset = "BTC"): string {
  const dir = s.preset === "momentum" ? "with" : "against";
  const pct = (s.thresholdBps / 100).toFixed(2).replace(/\.?0+$/, "");
  return `Every round it reads the last ${s.lookback} prices. If ${asset} moved at least ${pct}%, it bets ${dir} that move. Otherwise it sits out.`;
}

/** Compact, deterministic serialization — what `specHash` is taken over (reference `encodeSpec`). */
export function encodeSpec(s: StrategySpec): string {
  return JSON.stringify({ p: s.preset, lb: s.lookback, th: s.thresholdBps });
}

export function isSpec(value: unknown): value is StrategySpec {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    (v.preset === "momentum" || v.preset === "reversion") &&
    typeof v.lookback === "number" &&
    Number.isInteger(v.lookback) &&
    v.lookback >= LOOKBACK_MIN &&
    v.lookback <= LOOKBACK_MAX &&
    typeof v.thresholdBps === "number" &&
    Number.isInteger(v.thresholdBps) &&
    v.thresholdBps >= 0
  );
}

export function encodeStrategyMetadata(meta: StrategyMetadata): string {
  return JSON.stringify(meta);
}

/** Reads the creator's metadata string; a malformed one yields null rather than a guessed strategy. */
export function parseStrategyMetadata(raw: string): StrategyMetadata | null {
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    if (typeof v.name !== "string" || !isSpec(v.spec)) return null;
    return {
      name: v.name,
      description: typeof v.description === "string" ? v.description : "",
      spec: v.spec,
      ...(typeof v.playbook === "string" && v.playbook ? { playbook: v.playbook } : {}),
    };
  } catch {
    return null;
  }
}
