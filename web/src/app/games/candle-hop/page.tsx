import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Candle Hop" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Arcade" title="Candle Hop" dependency="the arcade score store (Stage 6)">
        <p>An arcade mode with an off-chain score and leaderboard. It shares your profile, achievements, and settings — but never implies an on-chain trade.</p>
      </CapabilityPending>
    </div>
  );
}
