import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Parlay" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Multi-leg" title="Parlay" dependency="the ParlayReserve contract (Stage 5)">
        <p>A multi-leg ticket whose legs become immutable when opened, with the maximum payout funded before the ticket is accepted and void rules shown before you confirm.</p>
      </CapabilityPending>
    </div>
  );
}
