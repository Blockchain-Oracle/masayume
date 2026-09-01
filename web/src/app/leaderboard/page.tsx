import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Leaderboard" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Reputation" title="Leaderboard" dependency="the verified outcome projection (Stage 3)">
        <p>A banzuke-style ranking built from complete verified outcome history. Losses cannot disappear from it — a ranking you can only climb is not a ranking.</p>
      </CapabilityPending>
    </div>
  );
}
