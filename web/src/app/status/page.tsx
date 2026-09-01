import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Status" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Health" title="Status" dependency="the read-time dependency probe (Stage 3)">
        <p>Live dependency health, derived when you load the page. A status page that caches a healthy answer is worse than none.</p>
      </CapabilityPending>
    </div>
  );
}
