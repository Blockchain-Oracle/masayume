"use client";

import { formatCadence, type BlockerContext } from "@masayume/core/copy";
import { minStakeBase } from "@masayume/core/sizing";
import { formatBaseUnits } from "@masayume/core/units";
import { collateralOrNull } from "@masayume/markets";
import { useBalanceSheet, useOnchain, useSigner } from "@masayume/markets/react";
import { useEffect } from "react";
import { TICKET } from "@/lib/copy";
import { useWalletSession } from "@/lib/wallet-session";
import { FaucetCard } from "../faucet";
import { AutoAdvanceNote } from "./AutoAdvanceNote";
import { BetModes } from "./BetModes";
import { FundingNote } from "./FundingNote";
import { LeverageChips } from "./LeverageChips";
import { OutcomeNote } from "./OutcomeNote";
import { PlacedCall } from "./PlacedCall";
import { QuickChips } from "./QuickChips";
import { QuoteStrip } from "./QuoteStrip";
import { SideSegments } from "./SideSegments";
import { StakeInput } from "./StakeInput";
import { deriveBlocker } from "./ticket-guards";
import { TicketCta } from "./TicketCta";
import { TicketHeader } from "./TicketHeader";
import type { TicketSelection } from "./types";
import { useFundingCheck } from "./useFunding";
import { usePlaceBet } from "./usePlaceBet";
import { useQuote } from "./useQuote";
import { useTicket } from "./useTicket";
import { WalkLine } from "./WalkLine";

const FALLBACK_SYMBOL = "tUSDC";

/** The stake-first Ticket: exactly the deal shown, or a named refusal (FR-8, FR-9, UX-DR4). */
export function Ticket({ selection }: { selection: TicketSelection }) {
  const t = useTicket(selection);
  const { market, side, stakeBase, phase } = t;
  const decimals = market.decimals;
  const symbol = collateralOrNull()?.symbol ?? FALLBACK_SYMBOL;

  const session = useWalletSession();
  const { address, hasSigner } = useSigner();
  const sheet = useBalanceSheet(address);
  const balances = sheet?.ok ? sheet.value : null;
  const availableBase = balances ? balances.spendableBase + balances.venueCreditBase : null;
  const onchain = useOnchain(market.marketId);

  const bet = usePlaceBet();
  const quoteState = useQuote({ market, side, stakeBase, nowMs: t.nowMs, enabled: hasSigner && phase === "trading" });
  const displayed = bet.requoted ?? quoteState.quote;
  const funding = useFundingCheck(address, onchain?.ok ? onchain.value : null, displayed);

  // A new stake or side starts a new composition; the previous outcome no longer describes it.
  useEffect(() => bet.reset(), [stakeBase, side, bet.reset]);

  const blocker = deriveBlocker({
    session,
    hasSigner,
    phase,
    placing: bet.placing,
    side,
    availableBase,
    stakeBase,
    decimals,
    quote: quoteState.reading,
    quoting: quoteState.pending,
    quoteStale: quoteState.stale,
    funding,
  });
  const ctx: BlockerContext = {
    cadence: formatCadence(market.intervalSec),
    minStakeText: `${formatBaseUnits(minStakeBase(decimals), decimals, { minDp: 0 })} ${symbol}`,
    spendableText: availableBase !== null ? `${formatBaseUnits(availableBase, decimals)} ${symbol}` : undefined,
    quotedCents: displayed?.oddsCents,
    fillableStakeText: displayed?.partial ? `${formatBaseUnits(displayed.fillableStakeBase, decimals)} ${symbol}` : undefined,
  };
  const showFaucet = session.isRightChain && hasSigner && balances?.spendableBase === 0n;

  const place = () => {
    if (!side || !displayed) return;
    void bet.place({ market, side, stakeBase, displayedQuote: displayed });
  };

  // The Call: once the fill is confirmed the ticket body is the shareable card, with
  // "Place another" bringing the composer back (reference Ticket624Drawer L807–836).
  const booked = bet.state.outcome?.status === "confirmed" ? bet.state.outcome.booked : null;

  return (
    <section
      aria-label={TICKET.title}
      className="flex flex-col gap-4 rounded-(--ticket-radius) border border-(--ticket-border) bg-(--ticket-surface) p-4"
    >
      <TicketHeader market={market} phase={phase} nowMs={t.nowMs} />
      {booked ? (
        <PlacedCall
          booked={booked}
          market={market}
          nowMs={t.nowMs}
          decimals={decimals}
          symbol={symbol}
          onAnother={() => {
            bet.reset();
            t.setStakeText("");
          }}
        />
      ) : (
        <>
      <WalkLine />
      <BetModes />
      <SideSegments side={side} onSelect={t.selectSide} />
      <StakeInput value={t.stakeText} onChange={t.setStakeText} decimals={decimals} symbol={symbol} costBase={displayed?.expectedCostBase ?? null} />
      <QuickChips availableBase={availableBase} decimals={decimals} onPick={t.setStakeBase} />
      <LeverageChips />
      <QuoteStrip
        reading={quoteState.reading}
        quote={displayed}
        stale={quoteState.stale}
        pending={quoteState.pending}
        stakeBase={stakeBase}
        side={side}
        decimals={decimals}
        symbol={symbol}
      />
      {funding?.ok && <FundingNote funding={funding} decimals={decimals} symbol={symbol} />}
      {t.advancedFrom && <AutoAdvanceNote from={t.advancedFrom} to={market} />}
      <OutcomeNote state={bet.state} decimals={decimals} symbol={symbol} onDismiss={bet.reset} />
      {showFaucet ? (
        <FaucetCard />
      ) : (
        <TicketCta blocker={blocker} ctx={ctx} side={side} costBase={displayed?.maxCostBase ?? null} decimals={decimals} symbol={symbol} onClick={place} />
      )}
        </>
      )}
    </section>
  );
}
