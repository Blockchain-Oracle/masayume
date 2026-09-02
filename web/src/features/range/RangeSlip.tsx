"use client";

import { useCallback } from "react";
import { ReadingBoundary } from "@/components/states";
import { useWalletSession } from "@/lib/wallet-session";
import { useChainNowMs } from "../markets/useChainNow";
import { RANGE } from "./copy";
import { RangeCard } from "./RangeCard";
import { useRangeRounds, type RangeRoundView } from "./useRangeRounds";
import { useRangeWrites } from "./useRangeWrites";

interface RangeSlipProps {
  symbol: string;
  decimals: number;
  staleAfterSec: number;
}

/** The connected wallet's rounds, live first; the crank, the stale void and the claim are on the row. */
export function RangeSlip({ symbol, decimals, staleAfterSec }: RangeSlipProps) {
  const { address } = useWalletSession();
  const reading = useRangeRounds(address);
  const nowMs = useChainNowMs();
  const writes = useRangeWrites();

  const onClaim = useCallback((round: RangeRoundView) => void writes.claim(round.roundId, round.maxPayoutBase, decimals, symbol), [writes, decimals, symbol]);
  const onSettle = useCallback((round: RangeRoundView) => void writes.settle(round.roundId, round.marketId), [writes]);
  const onVoidStale = useCallback((round: RangeRoundView) => void writes.voidStale(round.roundId), [writes]);

  if (!address) return <div className="pl-slip-empty">{RANGE.slip.emptyDisconnected}</div>;

  return (
    <ReadingBoundary reading={reading} shape="row">
      {(rounds) =>
        rounds.length === 0 ? (
          <div className="pl-slip-empty">{RANGE.slip.emptyConnected}</div>
        ) : (
          <div className="pl-slip">
            {rounds.map((round) => (
              <RangeCard
                key={round.roundId.toString()}
                round={round}
                nowMs={nowMs}
                symbol={symbol}
                decimals={decimals}
                staleAfterSec={staleAfterSec}
                busy={writes.busy}
                onClaim={onClaim}
                onSettle={onSettle}
                onVoidStale={onVoidStale}
              />
            ))}
          </div>
        )
      }
    </ReadingBoundary>
  );
}
