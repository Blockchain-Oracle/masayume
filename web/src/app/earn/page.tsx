import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Earn" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Liquidity" title="Earn" dependency="the MarketMakerVault contract (Stage 5)">
        <p>Commit capital to market making, then inspect the real inventory, exposure, and exit accounting behind your share — not an advertised yield.</p>
      </CapabilityPending>
    </div>
  );
}
