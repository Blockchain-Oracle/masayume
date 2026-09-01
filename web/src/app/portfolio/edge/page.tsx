import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Trader Edge" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Analysis" title="Trader Edge" dependency="the fill/outcome projection (Stage 3)">
        <p>An honest read of how you actually trade: realised results including losses and voids, not a highlight reel. Built from real fills, never a flattering subset.</p>
      </CapabilityPending>
    </div>
  );
}
