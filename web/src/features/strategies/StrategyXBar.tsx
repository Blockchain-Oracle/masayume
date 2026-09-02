import { ArrowUpRightIcon, Link2Icon, XIcon } from "lucide-react";
import { STRATEGIES } from "./copy";
import "./strategies.css";

const DISCOVER_URL = `https://x.com/search?q=${encodeURIComponent("masayume strategy copy")}&src=typed_query&f=live`;

/**
 * Strategies on X (reference `StrategyXBar`): link your account, then discover strategies in your
 * feed. Linking is the X rail's flow at `/claim`; this bar only points there, so it never claims a
 * link it cannot read.
 */
export function StrategyXBar() {
  return (
    <div className="strat-xbar">
      <div className="flex min-w-0 items-center gap-3">
        <span className="strat-xbar-icon">
          <XIcon className="text-ink" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="strat-xbar-title text-ink">{STRATEGIES.x.title}</p>
          <p className="strat-mono-10 truncate text-ink/40">{STRATEGIES.x.sub}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a href="/claim" className="strat-xbar-btn text-ink">
          <Link2Icon aria-hidden="true" /> {STRATEGIES.x.connect}
        </a>
        <a href={DISCOVER_URL} target="_blank" rel="noreferrer" className="strat-xbar-btn strat-xbar-btn--v">
          {STRATEGIES.x.browse} <ArrowUpRightIcon aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
