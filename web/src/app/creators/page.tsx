import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Creators" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Discovery" title="Creators" dependency="the creator profile and content layer (Stage 3)">
        <p>Find creators, read the evidence behind their record, and see the playbooks and attributed activity they actually produced.</p>
      </CapabilityPending>
    </div>
  );
}
