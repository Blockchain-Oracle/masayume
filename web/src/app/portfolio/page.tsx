import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Portfolio" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Positions" title="Portfolio" dependency="the reconciled position and fill projection (Stage 3)">
        <p>One headline number with every economically different pool named beneath it — wallet, escrow in open orders, claimable credit — plus open positions, settled history, and the receipt behind each one.</p>
      </CapabilityPending>
    </div>
  );
}
