import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Reels" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Feed" title="Reels" dependency="the shared market stream and the ported feed surface (Stage 2)">
        <p>A vertical feed of live windows — one full-height card per market, swipe to move, call a direction without leaving the card. It reads from the same DreamDEX market stream as Markets, so a price never disagrees between the two.</p>
      </CapabilityPending>
    </div>
  );
}
