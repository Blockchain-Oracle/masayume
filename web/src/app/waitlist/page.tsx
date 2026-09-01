import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Waitlist" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Access" title="Waitlist" dependency="the Waitlist membership record (Stage 3)">
        <p>Your founder position, your referral link, and your real rank — stored membership, not a number that only goes up.</p>
      </CapabilityPending>
    </div>
  );
}
