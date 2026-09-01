import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Docs" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Reference" title="Docs" dependency="the documentation pass over shipped capabilities (Stage 3)">
        <p>What Masayume actually does today, how the money is held, and where the boundaries are. Documentation describes implemented behaviour — planned work is marked as planned.</p>
      </CapabilityPending>
    </div>
  );
}
