import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Range" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Range" title="Range" dependency="the RangeReserve contract (Stage 5)">
        <p>Predict that settlement lands inside or outside a real band. This is never mapped onto an ordinary up/down position — it needs its own funded outcome.</p>
      </CapabilityPending>
    </div>
  );
}
