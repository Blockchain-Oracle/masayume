import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Agents" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Agents" title="Agents" dependency="the StrategyRegistry and fill projection (Stage 4)">
        <p>Create and compare agents on actual performance and risk — including losses, costs, and inactive periods, which is the only comparison worth making.</p>
      </CapabilityPending>
    </div>
  );
}
