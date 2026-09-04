import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";
import { pendingDependency } from "@/features/games/catalog";

export const metadata: Metadata = { title: "Line Rider" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Arcade" title="Line Rider" dependency={pendingDependency("line-rider")}>
        <p>An arcade mode with an off-chain score and leaderboard. It shares your profile, achievements, and settings — but never implies an on-chain trade.</p>
      </CapabilityPending>
    </div>
  );
}
