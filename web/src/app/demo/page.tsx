import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Demo" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Walkthrough" title="Demo" dependency="the connected end-to-end flow (Stage 3)">
        <p>A guided path through the real product against real connected data. Recorded evidence can support it, but nothing here is a staged screenshot standing in for product state.</p>
      </CapabilityPending>
    </div>
  );
}
