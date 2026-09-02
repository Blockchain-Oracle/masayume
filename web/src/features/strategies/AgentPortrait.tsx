import { cn } from "@/lib/utils";
import { accentIndex, glyphFromAddress } from "./names";
import "./strategies.css";

interface AgentPortraitProps {
  seed: string;
  name: string;
  size?: "small" | "card";
}

/**
 * Per-agent sigil, identical everywhere the agent appears. The reference draws a DiceBear persona
 * on a paper tile with the seeded glyph as its fallback; the drawing needs an external image host
 * the artifact's CSP does not allow, so the fallback IS the mark: a paper tile, an accent, a letter.
 */
export function AgentPortrait({ seed, name, size = "card" }: AgentPortraitProps) {
  return (
    <div aria-label={`${name}, agent mark`} className={cn("strat-sigil shrink-0", size === "small" ? "strat-sigil--small" : "strat-sigil--card", `strat-accent-${accentIndex(seed)}`)}>
      <span className="strat-sigil-paper">{glyphFromAddress(seed)}</span>
    </div>
  );
}
