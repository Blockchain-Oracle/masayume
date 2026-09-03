"use client";

import { isOk } from "@masayume/core/schemas";
import { usePositions } from "@masayume/markets/react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/chrome";
import { PrivateBalancePanel } from "@/features/private";
import { TradingBalancePanel, useVaultOpenBets } from "@/features/vault";
import { XWalletCard } from "@/features/x";
import "@/features/x/x-card.css";
import { CLAIM, PORTFOLIO } from "@/lib/copy";
import { useWalletSession } from "@/lib/wallet-session";
import { LiveClaimPlate } from "../claims";
import { RecordSection, TraderEdgeLink, useHistoryReading } from "../history";
import { useVenue } from "../useVenue";
import { BetsPanel } from "./BetsPanel";
import { ConnectCard } from "./ConnectCard";
import { LedgerPlate, PLATE, PlateDisclosure, PoolRows, useMoney } from "./plate";

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
 * The settled history, the equity curve, reputation and badges read the fill
 * projection (`useWalletHistory`), and the Trader Edge link opens the report built
 * from the same reading. The Trading Balance is the vault's pool row inside the plate,
 * with its controls folded into the row the way the reference folds the X wallet's
 * (`PoolRows` panels). What still needs a capability we have not built — creator
 * earnings, the X wallet — keeps a named dependency state instead of a plausible-looking panel.
 */
export function PortfolioScreen() {
  const router = useRouter();
  const { address } = useWalletSession();
  const { boot } = useVenue();
  const symbol = boot && isOk(boot) ? boot.value.collateral.symbol : "tUSDC";
  const history = useHistoryReading();
  const money = useMoney();
  const positions = usePositions(address);
  const vaultBets = useVaultOpenBets(address);
  const openBets = (positions && isOk(positions) ? positions.value.length : 0) + (vaultBets && isOk(vaultBets) ? vaultBets.value.length : 0);
  const settled = history.reading && isOk(history.reading) ? history.reading.value.rounds.length : 0;

  if (!address) {
    // Kept in the reference's order: the connect card first, the X wallet card below it (page L277–294).
    return (
      <div className="mx-auto flex w-full max-w-(--content-reading) flex-col gap-4 px-gutter py-8">
        <ConnectCard />
        <XWalletCard />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-(--content-reading) flex-col gap-8 px-gutter py-8">
      {/* ONE number first (reference L295–329): the plate answers "how much can I bet right now" once; every
          pool that is not spendable here is a row inside the same plate, never merged into the figure. */}
      <LedgerPlate money={money} symbol={symbol} openBets={openBets} settled={settled} onPrimary={() => router.push("/markets")}>
        <PoolRows pools={money.pools} decimals={money.decimals} symbol={symbol} panels={{ x: <XWalletCard compact />, private: <PrivateBalancePanel inline /> }} />
        {/* The reference's disclosure row carries creator earnings; ours carries the Trading Balance's own controls. */}
        <PlateDisclosure title={PLATE.vaultDisclosure}>
          <TradingBalancePanel inline />
        </PlateDisclosure>
      </LedgerPlate>

      <TraderEdgeLink />

      <BetsPanel symbol={symbol} index="01" history={history} />

      <section className="flex flex-col gap-4" aria-label={PORTFOLIO.collectTitle}>
        <SectionHeader index="02" title={PORTFOLIO.collectTitle} />
        <p className="type-body text-ink-secondary">{CLAIM.pageIntro}</p>
        <LiveClaimPlate />
      </section>

      <RecordSection history={history} symbol={symbol} index="03" />
    </div>
  );
}
