"use client";

import { EmptyState } from "@/components/states";
import { BALANCE } from "@/lib/copy";
import { BalancePlateView } from "./BalancePlateView";
import { useBalancePlate } from "./useBalancePlate";

interface BalancePlateProps {
  className?: string;
}

/** The live plate for the connected wallet; disconnected says so instead of showing zeros. */
export function BalancePlate({ className }: BalancePlateProps) {
  const state = useBalancePlate();
  if (state.kind === "disconnected") return <EmptyState why={BALANCE.connect.why} className={className} />;
  return <BalancePlateView reading={state.reading} symbol={state.symbol} retry={state.retry} className={className} />;
}
