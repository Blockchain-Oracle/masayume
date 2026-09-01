import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Lucky" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Lucky" title="Lucky" dependency="auditable selection over the shared market runtime (Stage 6)">
        <p>A randomly selected eligible live market and side, with the selection seed and the real quote shown before anything is submitted.</p>
      </CapabilityPending>
    </div>
  );
}
