"use client";

import { cardPnl, everyCardSettled, picksComplete, type CardReceipt, type MatchState } from "@masayume/core/games";
import { isOk } from "@masayume/core/schemas";
import type { Address, Bytes32, MarketId } from "@masayume/core/types";
import { formatBaseUnits } from "@masayume/core/units";
import { useArenaCredit, useMarketsLite } from "@masayume/markets/react";
import { useVenue } from "@/features/markets";
import { cadenceLabel } from "../stage/SwipeDeck";
import { DUEL } from "./copy";
import { useArenaWrites } from "./useArenaWrites";

/**
 * Everything after the last swipe: the lock, the settlement as it arrives card by card, and the
 * result with whatever the arena is holding for this wallet.
 *
 * The one number this screen is about is **real PnL** — payout minus the cost the contract measured
 * around the fill — and it is never called a score. Both players' positions are their own either
 * way; the side-pot follows the comparison, and on a free duel there is no pot at all, which the
 * copy says rather than leaving a zero to be misread.
 *
 * The claim is a pull, and the arena pays the player named on it rather than the caller — so it is
 * safe to leave, and the credit does not expire while a player is away.
 */
export function DuelResult({ state, wallet }: { state: Extract<MatchState, { phase: "locked" | "settling" | "finalized" | "forfeited" }>; wallet: string | null }) {
  const { boot } = useVenue();
  const credit = useArenaCredit((wallet as Address | null) ?? null);
  const { claim, settleCard, finalize, busy, canSign } = useArenaWrites();

  const decimals = boot && isOk(boot) ? boot.value.collateral.decimals : null;
  const symbol = boot && isOk(boot) ? boot.value.collateral.symbol : "";
  const money = (base: bigint | null) => (base === null || decimals === null ? DUEL.result.unsettled : formatBaseUnits(base, decimals, { maxDp: 4, minDp: 2 }));

  const you = wallet?.toLowerCase() ?? null;
  const receipts = "receipts" in state ? state.receipts : [];
  const cards = "cards" in state ? state.cards : [];
  const settled = receipts.filter((r) => r.payoutBase !== null).length;
  const total = cards.length * 2;

  const owed = credit && isOk(credit) ? credit.value : null;

  const mine = receipts.filter((r) => r.player.toLowerCase() === you);
  const theirs = receipts.filter((r) => r.player.toLowerCase() !== you);

  /**
   * Which cards the venue has already decided — one read for the whole deck, and the exact
   * precondition `settleCard` checks on chain. Offering the crank before this is true would be
   * offering a transaction that reverts and costs its gas anyway.
   */
  const lite = useMarketsLite(cards.map((c) => c.marketId as MarketId));
  const decided = (marketId: string) => {
    if (!lite || !isOk(lite)) return false;
    const market = lite.value.get(marketId as MarketId);
    return market !== undefined && (market.status === "Resolved" || market.voided);
  };
  const outstanding = cards.filter((card) => decided(card.marketId) && receipts.some((r) => r.cardIndex === card.index && r.payoutBase === null));
  const canFinalize = state.phase !== "finalized" && receipts.length > 0 && receipts.every((r) => r.payoutBase !== null);

  const outcome = state.phase === "finalized" ? state.outcome : null;
  const yourPnl = outcome && you ? (Object.entries(outcome.pnlBase).find(([addr]) => addr.toLowerCase() === you)?.[1] ?? null) : null;
  const theirPnl = outcome && you ? (Object.entries(outcome.pnlBase).find(([addr]) => addr.toLowerCase() !== you)?.[1] ?? null) : null;
  const verdict =
    outcome === null
      ? null
      : outcome.winner === null
        ? DUEL.result.tied
        : outcome.winner.toLowerCase() === you
          ? DUEL.result.won
          : DUEL.result.lost;

  return (
    <section className="dl-result" aria-label={DUEL.result.title}>
      {state.phase === "locked" && (
        <div className="dl-plate">
          <h2 className="dl-queue-title">{DUEL.settling.lockedTitle}</h2>
          <p className="dl-body">{DUEL.settling.lockedBody}</p>
        </div>
      )}

      {state.phase === "settling" && (
        <div className="dl-plate">
          <div className="dl-queue-head">
            <span className="dl-spinner" aria-hidden />
            <h2 className="dl-queue-title">{DUEL.settling.title}</h2>
          </div>
          <p className="dl-v">{DUEL.settling.progress(settled, total)}</p>
          <p className="dl-body">{DUEL.settling.body}</p>
        </div>
      )}

      {state.phase === "forfeited" && (
        <div className="dl-plate">
          <h2 className="dl-queue-title">{DUEL.result.forfeitTitle}</h2>
          <p className="dl-body">{DUEL.result.forfeitBody}</p>
        </div>
      )}

      {verdict && (
        <div className={`dl-verdict${outcome?.winner === null ? "" : outcome?.winner?.toLowerCase() === you ? " dl-verdict--won" : " dl-verdict--lost"}`}>
          <p className="dl-verdict-line">{verdict}</p>
          <div className="dl-facts">
            <div className="dl-fact">
              <span className="dl-k">
                {DUEL.result.you} · {DUEL.result.pnl}
              </span>
              <span className={`dl-v ${sign(yourPnl)}`}>{signed(yourPnl, money)} {symbol}</span>
            </div>
            <div className="dl-fact">
              <span className="dl-k">
                {DUEL.result.opponent} · {DUEL.result.pnl}
              </span>
              <span className={`dl-v ${sign(theirPnl)}`}>{signed(theirPnl, money)} {symbol}</span>
            </div>
          </div>
          <p className="dl-foot">{DUEL.result.pnlNote}</p>
          <p className="dl-foot">{state.tier === "free" ? DUEL.result.freePotNote : DUEL.result.potNote}</p>
        </div>
      )}

      {receipts.length > 0 && (
        <div className="dl-plate">
          <span className="dl-k">{DUEL.result.cards}</span>
          <ul className="dl-picked-list">
            {[...mine, ...theirs]
              .sort((a, b) => a.cardIndex - b.cardIndex || (a.player.toLowerCase() === you ? -1 : 1))
              .map((receipt) => (
                <Row key={receipt.pickKey} receipt={receipt} cards={cards} you={you} money={money} symbol={symbol} />
              ))}
          </ul>
        </div>
      )}

      {canSign && (outstanding.length > 0 || canFinalize) && "matchId" in state && (
        <div className="dl-plate">
          <span className="dl-k">{DUEL.settling.crankTitle}</span>
          <p className="dl-body">{DUEL.settling.crankBody}</p>
          <div className="dl-cranks">
            {outstanding.map((card) => (
              <button
                key={card.index}
                type="button"
                className="dl-quiet"
                disabled={busy !== null}
                onClick={() => void settleCard(state.matchId as Bytes32, card.index)}
              >
                {busy === `settle:${card.index}` ? DUEL.settling.settling : DUEL.settling.settleCard(card.asset)}
              </button>
            ))}
            {canFinalize && (
              <button type="button" className="dl-quiet" disabled={busy !== null} onClick={() => void finalize(state.matchId as Bytes32)}>
                {busy === "finalize" ? DUEL.settling.finalizing : DUEL.settling.finalize}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="dl-plate">
        <span className="dl-k">{DUEL.result.credit}</span>
        <p className="dl-v">{owed === null ? DUEL.result.unsettled : `${money(owed)} ${symbol}`}</p>
        {owed !== null && owed > 0n && canSign && wallet && (
          <button type="button" className="dl-cta" disabled={busy !== null} onClick={() => void claim(wallet as Address)}>
            {busy === "claim" ? DUEL.result.claiming : DUEL.result.claim}
          </button>
        )}
        {owed === 0n && <p className="dl-body">{DUEL.result.nothingToClaim}</p>}
        <p className="dl-foot">{DUEL.result.claimNote}</p>
      </div>

      {/* A deck that is complete but unsettled is the normal case: the Windows have not closed yet. */}
      {picksComplete(cards, receipts) && !everyCardSettled(cards, receipts) && state.phase !== "finalized" && (
        <p className="dl-foot">{DUEL.settling.waitingCard}</p>
      )}
    </section>
  );
}

function sign(base: bigint | null): string {
  if (base === null || base === 0n) return "";
  return base > 0n ? "dl-up" : "dl-down";
}

function signed(base: bigint | null, money: (b: bigint | null) => string): string {
  if (base === null) return DUEL.result.unsettled;
  return `${base > 0n ? "+" : base < 0n ? "−" : ""}${money(base < 0n ? -base : base)}`;
}

function Row({
  receipt,
  cards,
  you,
  money,
  symbol,
}: {
  receipt: CardReceipt;
  cards: readonly { index: number; asset: string; intervalSec: number }[];
  you: string | null;
  money: (b: bigint | null) => string;
  symbol: string;
}) {
  const card = cards.find((c) => c.index === receipt.cardIndex);
  const pnl = cardPnl(receipt);
  return (
    <li className="dl-picked-row">
      <span className={`dl-dot dl-dot--${receipt.pick}`} aria-hidden />
      <span className="dl-v">{card?.asset ?? "—"}</span>
      <span className="dl-k">{card ? cadenceLabel(card.intervalSec) : ""}</span>
      <span className="dl-k">{receipt.player.toLowerCase() === you ? DUEL.result.you : DUEL.result.opponent}</span>
      <span className="dl-foot">
        {DUEL.result.cost} {money(receipt.costBase)} · {DUEL.result.payout} {receipt.payoutBase === null ? DUEL.result.unsettled : money(receipt.payoutBase)} {symbol}
      </span>
      <span className={`dl-foot ${sign(pnl)}`}>{pnl === null ? "" : signed(pnl, money)}</span>
    </li>
  );
}
