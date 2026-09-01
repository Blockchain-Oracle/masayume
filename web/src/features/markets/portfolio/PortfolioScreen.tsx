"use client";

import { isOk } from "@masayume/core/schemas";
import { SectionHeader } from "@/components/chrome";
import { EmptyState } from "@/components/states";
import { BALANCE, CLAIM, PORTFOLIO } from "@/lib/copy";
import { useWalletSession } from "@/lib/wallet-session";
import { BalancePlate } from "../balance";
import { LiveClaimPlate } from "../claims";
import { useVenue } from "../useVenue";
import { BetsPanel } from "./BetsPanel";

/**
 * Portfolio — the money, the open bets, and what is waiting to be collected.
 *
 * Ported from `reference/yosuku/app/portfolio/page.tsx`. Its structural claim is
 * that the page has no headline: "the nav already says where you are, and the
 * thing people open this page for is the number", so the balance plate opens the
 * page and everything else sits under it.
 *
 * The plate itself is the one already live on `/markets` rather than the
 * reference's `.ledger-plate`. That frame is a fixed cream slab with its own ink,
 * and the panel inside it is theme-aware — nesting them would have produced, in
 * reverse, exactly the "one card, two backgrounds" defect the reference's own
 * `.plate-rows` remap exists to fix.
 *
 * Everything the reference shows that needs a capability we have not built — the
 * settled history and equity curve, reputation and badges, Trader Edge, creator
 * earnings, the X wallet, the Trading Balance vault — keeps a named dependency
 * state instead of a plausible-looking panel.
 */
export function PortfolioScreen() {
  const { address } = useWalletSession();
  const { boot } = useVenue();
  const symbol = boot && isOk(boot) ? boot.value.collateral.symbol : undefined;

  if (!address) {
    return (
      <div className="mx-auto flex w-full max-w-(--content-reading) flex-col gap-6 px-gutter py-8">
        <EmptyState why={BALANCE.connect.why} />
        <p className="type-caption text-ink-muted">{PORTFOLIO.vaultPending}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-(--content-reading) flex-col gap-8 px-gutter py-8">
      {/* No page headline: the balance is the header (reference L266). */}
      <BalancePlate />

      <BetsPanel symbol={symbol} index="01" />

      <section className="flex flex-col gap-4" aria-label={PORTFOLIO.collectTitle}>
        <SectionHeader index="02" title={PORTFOLIO.collectTitle} />
        <p className="type-body text-ink-secondary">{CLAIM.pageIntro}</p>
        <LiveClaimPlate />
      </section>

      <section className="flex flex-col gap-2 border-t border-hairline pt-4">
        <p className="type-caption text-ink-muted">{PORTFOLIO.edgePending}</p>
        <p className="type-caption text-ink-muted">{PORTFOLIO.vaultPending}</p>
      </section>
    </div>
  );
}
