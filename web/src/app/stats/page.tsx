import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Traction" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Proof" title="Traction" dependency="chain-derived metric aggregation (Stage 3)">
        <p>Publicly verifiable usage: chain-derived metrics with any off-chain or social number labelled separately, so the two can never be quietly added together.</p>
      </CapabilityPending>
    </div>
  );
}
