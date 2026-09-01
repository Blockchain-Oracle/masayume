import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Trade from X" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Social rail" title="Trade from X" dependency="EventVault X_EXECUTOR grants and the relay service (Stage 4)">
        <p>Link X to your wallet, create a bounded executor grant, then place a call by mentioning Masayume. Every execution returns a receipt linking the instruction, the grant, the market, and the transaction.</p>
      </CapabilityPending>
    </div>
  );
}
