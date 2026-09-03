"use client";

import { cumulativeDepth, depthBounds, type DepthStep } from "@masayume/core/surface";
import type { BookDepth } from "@masayume/core/types";
import { bpsToOddsCents } from "@masayume/core/units";
import { SURFACE } from "./copy";
import { contractsText } from "./format";

interface DepthChartProps {
  depth: BookDepth | null;
  hydrating: boolean;
}

const W = 1000;
const H = 100;

interface Scale {
  x: (bps: number) => number;
  y: (raw: bigint) => number;
}

/** A step area from the top of the book outward: bids walk left toward `edgeBps`, asks walk right. */
function stepArea(steps: readonly DepthStep[], edgeBps: number, { x, y }: Scale): string {
  if (steps.length === 0) return "";
  const first = steps[0]!;
  const parts = [`M${x(first.priceBps).toFixed(1)},${H}`];
  let level = 0n;
  for (const step of steps) {
    parts.push(`L${x(step.priceBps).toFixed(1)},${y(level).toFixed(1)}`);
    level = step.cumulativeRaw;
    parts.push(`L${x(step.priceBps).toFixed(1)},${y(level).toFixed(1)}`);
  }
  parts.push(`L${x(edgeBps).toFixed(1)},${y(level).toFixed(1)}`, `L${x(edgeBps).toFixed(1)},${H}`, "Z");
  return parts.join(" ");
}

/**
 * §02 — the reference draws its smile on a canvas (`drawIvLine`); the honest picture on a real
 * order book is depth: cumulative size at each price, both sides on the UP axis. Drawn as SVG so
 * the paths scale with the box and every stroke stays one device pixel (`vector-effect`); the
 * labels are HTML so they never stretch with the plot.
 */
export function DepthChart({ depth, hydrating }: DepthChartProps) {
  const copy = SURFACE.depth;
  const bids = depth ? cumulativeDepth(depth.upBids) : [];
  const asks = depth ? cumulativeDepth(depth.upAsks) : [];
  const bounds = depthBounds(bids, asks);

  if (!depth || !bounds) {
    return (
      <div className="sf-box sf-box--chart">
        <div className="sf-box-empty">{hydrating || !depth ? copy.hydrating : copy.empty}</div>
      </div>
    );
  }

  const span = Math.max(1, bounds.maxBps - bounds.minBps);
  const tall = bounds.maxCumulativeRaw;
  const scale: Scale = {
    x: (bps) => ((bps - bounds.minBps) / span) * W,
    y: (raw) => (tall === 0n ? H : H - Number((raw * 1000n) / tall) / 10),
  };
  const bestBid = bids[0] ?? null;
  const bestAsk = asks[0] ?? null;
  const crossed = bestBid !== null && bestAsk !== null && bestBid.priceBps >= bestAsk.priceBps;
  const midBps = bestBid && bestAsk && !crossed ? (bestBid.priceBps + bestAsk.priceBps) / 2 : null;
  const totalBids = bids.at(-1)?.cumulativeRaw ?? 0n;
  const totalAsks = asks.at(-1)?.cumulativeRaw ?? 0n;

  return (
    <div className="sf-box sf-box--chart sf-depth" role="img" aria-label={`${copy.bids} ${contractsText(totalBids, depth.decimals)}, ${copy.asks} ${contractsText(totalAsks, depth.decimals)}`}>
      <div className="sf-depth-plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden focusable="false">
          <path className="sf-depth-area sf-depth-area--bids" d={stepArea(bids, bounds.minBps, scale)} />
          <path className="sf-depth-area sf-depth-area--asks" d={stepArea(asks, bounds.maxBps, scale)} />
        </svg>
        {midBps !== null && (
          <span className="sf-depth-mid" style={{ left: `${(scale.x(midBps) / W) * 100}%` }} aria-hidden>
            <span className="sf-depth-mid-label">{copy.mid(`${bpsToOddsCents(midBps)}¢`)}</span>
          </span>
        )}
        {crossed && <span className="sf-depth-crossed">{copy.crossed}</span>}
      </div>
      <div className="sf-depth-foot">
        <span className="sf-depth-side sf-depth-side--bids">
          <span className="sf-depth-side-k">{copy.bids}</span>
          {bestBid ? <span className="sf-depth-side-v">{bpsToOddsCents(bestBid.priceBps)}¢</span> : <span className="sf-depth-side-v">—</span>}
          <span className="sf-depth-side-n">{copy.contracts(contractsText(totalBids, depth.decimals))}</span>
        </span>
        <span className="sf-depth-side sf-depth-side--asks">
          <span className="sf-depth-side-k">{copy.asks}</span>
          {bestAsk ? <span className="sf-depth-side-v">{bpsToOddsCents(bestAsk.priceBps)}¢</span> : <span className="sf-depth-side-v">—</span>}
          <span className="sf-depth-side-n">{copy.contracts(contractsText(totalAsks, depth.decimals))}</span>
        </span>
      </div>
    </div>
  );
}
