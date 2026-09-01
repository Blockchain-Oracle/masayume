import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Games" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Play" title="Games" dependency="the GameArena contract and matchmaker (Stage 6)">
        <p>Prediction, duel, and arcade modes in Masayume's own shell. Each mode states plainly whether it carries economic risk, because a game that hides that is not a game.</p>
      </CapabilityPending>
    </div>
  );
}
