import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "How it works" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Explainer" title="How it works" dependency="the explainer pass over shipped mechanics (Stage 3)">
        <p>The mechanism end to end: how a window opens, how a price becomes a position, who settles it, and who can move your money.</p>
      </CapabilityPending>
    </div>
  );
}
