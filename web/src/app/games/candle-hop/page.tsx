import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";
import { pendingDependency } from "@/features/games/catalog";

export const metadata: Metadata = { title: "Candle Hop" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Arcade" title="Candle Hop" dependency={pendingDependency("candle-hop")}>
        <p>An arcade mode with an off-chain score and leaderboard. It shares your profile, achievements, and settings — but never implies an on-chain trade.</p>
      </CapabilityPending>
    </div>
  );
}
