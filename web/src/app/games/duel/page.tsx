import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Prediction duel" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Duel" title="Prediction duel" dependency="GameArena, the deckmaster, and matchmaking (Stage 6)">
        <p>Head to head over a committed deck of real live markets. Ranked play puts real positions and a capped match stake behind every pick; scoring comes from receipts, never from speed bonuses.</p>
      </CapabilityPending>
    </div>
  );
}
