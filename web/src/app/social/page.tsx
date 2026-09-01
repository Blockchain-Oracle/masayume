import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Social" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Board" title="Social" dependency="the social record store and realtime rooms (Stage 3)">
        <p>Takes, rooms, and the conversation attached to a market — with identity and moderation state, and no claim that a comment lives on chain when it does not.</p>
      </CapabilityPending>
    </div>
  );
}
