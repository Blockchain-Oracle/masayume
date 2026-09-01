import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Recover creator account" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Recovery" title="Recover creator account" dependency="signed identity recovery (Stage 4)">
        <p>Restore a creator identity and its wallet association through a signed challenge and provider re-link.</p>
      </CapabilityPending>
    </div>
  );
}
