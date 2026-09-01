import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Moonshot" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Arcade" title="Moonshot" dependency="the mode's economic boundary and GameArena (Stage 6)">
        <p>A PIPS-derived mode. Whether a run creates a real position or is arcade-only is stated on the mode itself, before you play.</p>
      </CapabilityPending>
    </div>
  );
}
