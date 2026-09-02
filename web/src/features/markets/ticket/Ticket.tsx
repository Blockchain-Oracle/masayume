"use client";

import { formatCadence, type BlockerContext } from "@masayume/core/copy";
import { BPS_PER_X, leverageBpsOf } from "@masayume/core/leverage";
import type { BookedOrder } from "@masayume/core/ports";
import { minStakeBase } from "@masayume/core/sizing";
import { formatBaseUnits, priceRawToBps } from "@masayume/core/units";
import { collateralOrNull } from "@masayume/markets";
import { useBalanceSheet, useLeverageReserve, useOnchain, useRangeReserve, useSigner } from "@masayume/markets/react";
import { useCallback, useEffect, useState } from "react";
import { Money } from "@/components/data";
import { BlockedButton } from "@/components/states";
import { BoostCard, LEVERAGE, useLeverageQuote, useLeverageWrites } from "@/features/leverage";
import { RangeTicketBody } from "@/features/range";
import { RouteControl, SESSION, SessionControl, useTicketRoute, type FundingSource } from "@/features/session";
import { diagnosisCopy, TICKET } from "@/lib/copy";
import { notify } from "@/lib/toast";
import { useWalletSession } from "@/lib/wallet-session";
import { FaucetCard } from "../faucet";
import { SIDE_WORD } from "../side-styles";
import { AutoAdvanceNote } from "./AutoAdvanceNote";
import { BetModes, type BetMode } from "./BetModes";
import { FundingNote } from "./FundingNote";
import { LeverageChips } from "./LeverageChips";
import { OutcomeNote } from "./OutcomeNote";
import { PlacedCall } from "./PlacedCall";
import { QuickChips } from "./QuickChips";
import { QuoteStrip } from "./QuoteStrip";
import { SideSegments } from "./SideSegments";
import { StakeInput } from "./StakeInput";
import { deriveBlocker, deriveBoostBlocker, type TicketBlockerInput } from "./ticket-guards";
import { TicketCta } from "./TicketCta";
import { TicketHeader } from "./TicketHeader";
import type { TicketSelection } from "./types";
import { useFundingCheck } from "./useFunding";
import { usePlaceBet } from "./usePlaceBet";
import { useQuote } from "./useQuote";
import { useTicket } from "./useTicket";
import { WalkLine } from "./WalkLine";

const FALLBACK_SYMBOL = "tUSDC";
/** The reference sizes with an 8% cushion for a quote that drifts before it lands; a boost accepts up to 5% fewer contracts. */
const BOOST_FILL_FLOOR_BPS = 9_500n;

interface PlacedBoost {
  booked: BookedOrder;
  leverage: { leverageBps: number; frontedBase: bigint };
}

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
  const walletAvailableBase = balances ? balances.spendableBase + balances.venueCreditBase : null;
  const onchain = useOnchain(market.marketId);

  // Where the escrow comes from: the wallet, the Trading Balance, or — armed — the session key inside its caps.
  const [source, setSource] = useState<FundingSource>("wallet");
  // Call a side, or call a band; the band needs the RangeReserve (Stage 5) and takes the wallet route only.
  const [mode, setMode] = useState<BetMode>("dir");
  const rangeReading = useRangeReserve();
  const rangeReserve = rangeReading?.ok ? rangeReading.value : null;
  // 1× is a plain order; above it the LeverageReserve buys the boost, from the wallet only (Stage 5).
  const [multiple, setMultiple] = useState(1);
  const leverageReading = useLeverageReserve();
  const leverageReserve = leverageReading?.ok ? leverageReading.value : null;
  const boosted = multiple > 1 && leverageReserve !== null;
  const leverageBps = leverageBpsOf(multiple);

  const quoteState = useQuote({ market, side, stakeBase, nowMs: t.nowMs, enabled: hasSigner && phase === "trading" && !boosted });
  const routing = useTicketRoute({ market, side, stakeBase, quote: quoteState.quote, onchain: onchain?.ok ? onchain.value : null, source, walletAvailableBase, symbol });
  const availableBase = routing.availableBase;
  // The reference locks the higher chips for a private bet ("placed at 1x"); ours lock off the wallet route and under a pause.
  const leverageLock = leverageReserve?.paused ? LEVERAGE.paused : source !== "wallet" || routing.armed ? LEVERAGE.lockedForRoute : null;
  useEffect(() => {
    if (leverageLock && multiple !== 1) setMultiple(1);
  }, [leverageLock, multiple]);
  const boost = useLeverageQuote({ market, side, stakeBase, leverageBps, params: leverageReserve?.params ?? null, enabled: boosted && hasSigner && phase === "trading" && leverageLock === null });
  const leverageWrites = useLeverageWrites();
  const [placedBoost, setPlacedBoost] = useState<PlacedBoost | null>(null);

  const bet = usePlaceBet({ submitter: routing.submitter, wallet: routing.wallet });
  const displayed = bet.requoted ?? quoteState.quote;
  const walletRoute = routing.route.kind === "wallet";
  const funding = useFundingCheck(walletRoute ? address : null, onchain?.ok ? onchain.value : null, displayed);

  // A new stake or side starts a new composition; the previous outcome no longer describes it.
  useEffect(() => {
    bet.reset();
    setPlacedBoost(null);
  }, [stakeBase, side, bet.reset]);

  const base: TicketBlockerInput = {
    session,
    hasSigner,
    phase,
    placing: bet.placing || leverageWrites.busy === "open",
    side,
    availableBase,
    stakeBase,
    decimals,
    quote: quoteState.reading,
    quoting: quoteState.pending,
    quoteStale: quoteState.stale,
    funding: walletRoute ? funding : null,
  };
  const blocker = boosted ? deriveBoostBlocker({ ...base, funding: null }, boost) : deriveBlocker(base);
  const ctx: BlockerContext = {
    cadence: formatCadence(market.intervalSec),
    minStakeText: `${formatBaseUnits(minStakeBase(decimals), decimals, { minDp: 0 })} ${symbol}`,
    spendableText: availableBase !== null ? `${formatBaseUnits(availableBase, decimals)} ${symbol}` : undefined,
    quotedCents: displayed?.oddsCents,
    fillableStakeText: displayed?.partial ? `${formatBaseUnits(displayed.fillableStakeBase, decimals)} ${symbol}` : undefined,
  };
  const showFaucet = session.isRightChain && hasSigner && walletRoute && balances?.spendableBase === 0n;
  const showRoute = routing.deployed && ((routing.vaultAvailableBase ?? 0n) > 0n || routing.armed);

  const place = () => {
    if (!side || !displayed) return;
    void bet.place({ market, side, stakeBase, displayedQuote: displayed, route: routing.route });
  };

  /** The boost's open: the typed stake, guarded at 95% of the size the reserve quoted; a moved book comes back as a requote, never a popup. */
  const placeBoost = useCallback(async () => {
    if (!side || !boost.quote || !leverageReserve) return;
    const q = boost.quote;
    const outcome = await leverageWrites.open({ marketId: market.marketId, side, stakeBase, leverageBps, minQuantityRaw: (q.quantityRaw * BOOST_FILL_FLOOR_BPS) / 10_000n, maintenanceBps: leverageReserve.params.maintenanceBps });
    if (!outcome) return;
    if (outcome.status === "confirmed") {
      const avgPriceBps = priceRawToBps(q.priceRaw, decimals);
      setPlacedBoost({
        booked: { marketId: market.marketId, side, contractsRaw: outcome.quantityRaw, costBase: outcome.stakeBase, avgPriceBps, txHash: outcome.txHash, fillCount: 1 },
        leverage: { leverageBps, frontedBase: outcome.frontedBase },
      });
      notify.neutral(TICKET.booked(formatBaseUnits(outcome.quantityRaw, decimals, { minDp: 0 }), SIDE_WORD[side], avgPriceBps));
      return;
    }
    if (outcome.status === "requote") {
      notify.warning(diagnosisCopy("requote").headline, LEVERAGE.strip.requote(formatBaseUnits(outcome.quantityRaw, decimals, { minDp: 0 })));
      boost.retry();
      return;
    }
    const copy = diagnosisCopy(outcome.diagnosis.kind);
    notify.warning(copy.headline, outcome.diagnosis.technical || copy.body);
  }, [side, boost, leverageReserve, leverageWrites, market.marketId, stakeBase, leverageBps, decimals]);

  // The Call: once the fill is confirmed the ticket body is the shareable card, with
  // "Place another" bringing the composer back (reference Ticket624Drawer L807–836).
  const booked = placedBoost?.booked ?? (bet.state.outcome?.status === "confirmed" ? bet.state.outcome.booked : null);

  return (
    <section
      aria-label={TICKET.title}
      className="flex flex-col gap-4 rounded-(--ticket-radius) border border-(--ticket-border) bg-(--ticket-surface) p-4"
    >
      <TicketHeader market={market} phase={phase} nowMs={t.nowMs} />
      {/* The "tap-trading on" chip (UX-DR17): arm from here, manage from here; disabled, it says what is missing. */}
      <div className="flex items-center justify-end">
        <SessionControl symbol={symbol} />
      </div>
      {booked ? (
        <PlacedCall
          booked={booked}
          market={market}
          nowMs={t.nowMs}
          decimals={decimals}
          symbol={symbol}
          boost={placedBoost?.leverage ?? null}
          onAnother={() => {
            bet.reset();
            setPlacedBoost(null);
            t.setStakeText("");
          }}
        />
      ) : (
        <>
      <WalkLine />
      <BetModes mode={mode} onChange={setMode} rangeAvailable={rangeReserve !== null} />
      {mode === "range" && rangeReserve ? (
        <RangeTicketBody
          market={market}
          nowMs={t.nowMs}
          phase={phase}
          decimals={decimals}
          symbol={symbol}
          reserve={rangeReserve}
          stakeText={t.stakeText}
          stakeBase={stakeBase}
          onStakeText={t.setStakeText}
          onStakeBase={t.setStakeBase}
          availableBase={walletAvailableBase}
          session={session}
          hasSigner={hasSigner}
        />
      ) : (
        <>
      {showRoute && (
        <RouteControl
          source={source}
          onChange={setSource}
          vaultAvailableBase={routing.vaultAvailableBase}
          decimals={decimals}
          symbol={symbol}
          armed={routing.armed}
          deployed={routing.deployed}
        />
      )}
      <SideSegments side={side} onSelect={t.selectSide} />
      <StakeInput value={t.stakeText} onChange={t.setStakeText} decimals={decimals} symbol={symbol} costBase={boosted ? (boost.quote?.stakeBase ?? null) : (displayed?.expectedCostBase ?? null)} />
      {routing.sourceLabel && <p className="tk-control-label">{routing.sourceLabel}</p>}
      {routing.fallbackReason && (
        <p role="status" className="type-caption text-warning">
          {routing.fallbackReason}
        </p>
      )}
      <QuickChips availableBase={availableBase} decimals={decimals} onPick={t.setStakeBase} />
      <LeverageChips
        value={multiple}
        onChange={setMultiple}
        available={leverageReserve !== null}
        maxMultiple={leverageReserve ? leverageReserve.params.maxLeverageBps / BPS_PER_X : 1}
        lockedReason={leverageLock}
      />
      {boosted ? (
        <BoostCard quote={boost.quote} loading={boost.loading} error={boost.error} retry={boost.retry} stakeBase={stakeBase} side={side} multiple={multiple} decimals={decimals} symbol={symbol} />
      ) : (
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
      )}
      {!boosted && walletRoute && funding?.ok && <FundingNote funding={funding} decimals={decimals} symbol={symbol} />}
      {routing.route.kind === "vault" && routing.vaultAvailableBase !== null && (
        <p className="type-caption text-ink-secondary">{SESSION.route.vaultNote(`${formatBaseUnits(routing.vaultAvailableBase, decimals)} ${symbol}`)}</p>
      )}
      {t.advancedFrom && <AutoAdvanceNote from={t.advancedFrom} to={market} />}
      <OutcomeNote state={bet.state} decimals={decimals} symbol={symbol} onDismiss={bet.reset} />
      {showFaucet ? (
        <FaucetCard />
      ) : boosted ? (
        <BlockedButton blocker={blocker} ctx={ctx} tone={side ?? "primary"} size="lg" className="w-full" onClick={() => void placeBoost()}>
          {side && boost.quote ? (
            <>
              {LEVERAGE.cta.buy(SIDE_WORD[side], multiple)} <Money value={boost.quote.stakeBase} decimals={decimals} symbol={symbol} />
            </>
          ) : (
            TICKET.buyPlain
          )}
        </BlockedButton>
      ) : (
        <TicketCta blocker={blocker} ctx={ctx} side={side} costBase={displayed?.maxCostBase ?? null} decimals={decimals} symbol={symbol} onClick={place} />
      )}
        </>
      )}
        </>
      )}
    </section>
  );
}
