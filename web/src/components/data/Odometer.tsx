"use client";

import { formatBaseUnits } from "@masayume/core/units";
import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OdometerProps {
  value: bigint;
  decimals: number;
  symbol?: string;
  maxDp?: number;
  className?: string;
}

/**
 * A figure that rolls to its new value — the 21st count-up's spring on a base-unit integer, formatted by the
 * same formatter as every other figure. It settles on the exact reading the chain gave, never a rounded
 * neighbour, and with reduced motion it simply shows it.
 */
export function Odometer({ value, decimals, symbol, maxDp, className }: OdometerProps) {
  const reduced = useReducedMotion();
  const target = Number(value);
  const spring = useSpring(target, { stiffness: 140, damping: 22, mass: 0.6 });
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (reduced) {
      spring.jump(target);
      setShown(value);
      return;
    }
    spring.set(target);
  }, [target, value, reduced, spring]);
  useMotionValueEvent(spring, "change", (v) => setShown(BigInt(Math.round(v))));
  useMotionValueEvent(spring, "animationComplete", () => setShown(value));

  return (
    <span className={cn("numbers", className)}>
      {formatBaseUnits(shown, decimals, { maxDp })}
      {symbol && <span className="text-ink-secondary"> {symbol}</span>}
    </span>
  );
}
