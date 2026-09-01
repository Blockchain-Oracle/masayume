import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Add funds" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Money in" title="Add funds" dependency="the EventVault deposit path (Stage 4); the faucet already works from Markets">
        <p>Get testnet collateral and understand exactly which pool it lands in, with the approval and deposit steps handled in the product rather than sent to raw tooling.</p>
      </CapabilityPending>
    </div>
  );
}
