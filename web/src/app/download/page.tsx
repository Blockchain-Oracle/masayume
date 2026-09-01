import type { Metadata } from "next";
import { CapabilityPending } from "@/components/shell";

export const metadata: Metadata = { title: "Get Masayume" };

export default function Page() {
  return (
    <div className="container">
      <CapabilityPending eyebrow="Install" title="Get Masayume" dependency="the PWA install surface (Stage 3); native remains blocked pending source">
        <p>Masayume installs from the browser as a web app on phone and desktop. There is no native build: the referenced native source does not exist, so no native store button is shown rather than one that cannot work.</p>
      </CapabilityPending>
    </div>
  );
}
