import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Strategies" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Desk" title="Strategies" dependency="the StrategyRegistry contract and runner (Stage 4)">
        <p>Discover, inspect, and subscribe to strategies, with the verified trade history behind each one. A strategy executes only inside limits you set and can revoke.</p>
      </CapabilityPending>
    </div>
  );
}
