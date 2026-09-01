import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Studio" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Playbooks" title="Studio" dependency="the playbook content store (Stage 4)">
        <p>Compose, save, and reuse strategy and agent context, with signed provenance where a playbook claims a record.</p>
      </CapabilityPending>
    </div>
  );
}
