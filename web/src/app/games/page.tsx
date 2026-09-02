import type { Metadata } from "next";
import Link from "next/link";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Games" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Play" title="Games" dependency="the GameArena contract and matchmaker (Stage 6)">
        <p>Prediction, duel, and arcade modes in Masayume's own shell. Each mode states plainly whether it carries economic risk, because a game that hides that is not a game.</p>
        <p>
          <Link href="/games/range">Range</Link> is the first mode with its own funded outcome: a band on a Window's closing print, settled on the oracle's own answer.
        </p>
      </CapabilityPending>
    </div>
  );
}
