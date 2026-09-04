import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";
import { pendingDependency } from "@/features/games/catalog";

export const metadata: Metadata = { title: "Lucky" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Lucky" title="Lucky" dependency={pendingDependency("lucky")}>
        <p>A randomly selected eligible live market and side, with the selection seed and the real quote shown before anything is submitted.</p>
      </CapabilityPending>
    </div>
  );
}
