import type { Metadata } from "next";
import { SectionHeader } from "@/components/chrome";
import { LiveClaimPlate } from "@/features/markets/claims";
import { CLAIM } from "@/lib/copy";

export const metadata: Metadata = { title: CLAIM.title };

/** The global Claim-all plate's home: the pill in the app shell links here whenever something is claimable. */
export default function ClaimsRoute() {
  return (
    <div className="mx-auto flex w-full max-w-(--content-reading) flex-col gap-6 px-gutter py-8">
      <SectionHeader index="01" title={CLAIM.title} />
      <p className="type-body text-ink-secondary">{CLAIM.pageIntro}</p>
      <LiveClaimPlate />
    </div>
  );
}
