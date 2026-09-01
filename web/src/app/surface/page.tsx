import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Market surface" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Structure" title="Market surface" dependency="the term-structure read model (Stage 5)">
        <p>Probability and spread by asset, cadence, and window; depth and available size; slippage across stake sizes; and term structure across live expiries — real DreamDEX structure, not a borrowed volatility model.</p>
      </CapabilityPending>
    </div>
  );
}
