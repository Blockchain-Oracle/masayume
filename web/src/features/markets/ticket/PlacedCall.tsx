"use client";

import type { BookedOrder } from "@masayume/core/ports";
import type { EventMarket } from "@masayume/core/types";
import { useOpeningPrice } from "@masayume/markets/react";
import Link from "next/link";
import { useState } from "react";
import { CallPlacedCard, SHARE, type CallCard } from "@/features/share";
import { useSettlementFee } from "../verdict/useVerdict";

interface PlacedCallProps {
  booked: BookedOrder;
  market: EventMarket;
  nowMs: number;
  decimals: number;
  symbol: string;
  onAnother: () => void;
}

/**
 * The instant a bet lands, the ticket becomes The Call — the reference's
 * `Ticket624Drawer` L807–836: the shareable card with Portfolio / Place another
 * under it. Every field on it is the booked order and the Window as the chain has
 * them; the return is net of the settlement fee once that read lands.
 */
export function PlacedCall({ booked, market, nowMs, decimals, symbol, onAnother }: PlacedCallProps) {
  // The moment the confirmation arrived, held for the life of the card so the
  // draining bar measures the holding window rather than resetting every render.
  const [placedAtMs] = useState(() => (nowMs > 0 ? nowMs : Date.now()));
  const opening = useOpeningPrice(market.marketId);
  const fee = useSettlementFee(market.marketId, true);

  const card: CallCard = {
    asset: market.asset,
    side: booked.side,
    intervalSec: market.intervalSec,
    lineRaw: opening?.ok ? opening.value : market.openingPriceRaw,
    stakeBase: booked.costBase,
    contractsRaw: booked.contractsRaw,
    decimals,
    symbol,
    feeBps: fee?.ok ? fee.value : null,
    expirySec: market.expirySec,
    txHash: booked.txHash,
    placedAtMs,
  };

  return (
    <CallPlacedCard
      card={card}
      nowMs={nowMs}
      actions={
        <div className="call-actions">
          <Link href="/portfolio" data-cursor="hover">
            {SHARE.call.portfolio}
          </Link>
          <button type="button" onClick={onAnother} data-cursor="hover">
            {SHARE.call.another}
          </button>
        </div>
      }
    />
  );
}
