import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Claim your account" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Recovery" title="Claim your account" dependency="X OAuth linking and signed wallet binding (Stage 4)">
        <p>Restore the link between a wallet, an X identity, and the balance held for you — using signed challenges, so a claim proves ownership rather than asserting it.</p>
      </CapabilityPending>
    </div>
  );
}
