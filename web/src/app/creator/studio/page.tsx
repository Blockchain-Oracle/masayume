import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Create" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Studio" title="Create" dependency="creator identity services and registry attribution (Stage 4)">
        <p>Mint a code, build a card, share it, and have every call placed through it attributed to you on chain. It is called Create rather than Earn until the builder-fee rail actually pays.</p>
      </CapabilityPending>
    </div>
  );
}
