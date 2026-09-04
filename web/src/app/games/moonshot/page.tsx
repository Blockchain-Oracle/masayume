import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";
import { pendingDependency } from "@/features/games/catalog";

export const metadata: Metadata = { title: "Moonshot" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Prediction" title="Moonshot" dependency={pendingDependency("moonshot")}>
        <p>A PIPS-derived mode. Whether a run creates a real position or is arcade-only is stated on the mode itself, before you play.</p>
      </CapabilityPending>
    </div>
  );
}
