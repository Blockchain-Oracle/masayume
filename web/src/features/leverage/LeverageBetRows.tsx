"use client";

import type { LeveragePosition } from "@masayume/core/leverage";
import { isOk } from "@masayume/core/schemas";
import { useLeverageMark, useLeverageReserve, useMarket, useMyLeveragePositions } from "@masayume/markets/react";
import { useWalletSession } from "@/lib/wallet-session";
import { useChainNowMs } from "../markets/useChainNow";
import { LEVERAGE } from "./copy";
import { LeverageBetRow } from "./LeverageBetRow";
import { useLeverageWrites } from "./useLeverageWrites";

const SETTLED_SHOWN = 5;

interface RowProps {
  position: LeveragePosition;
  symbol: string | undefined;
  decimals: number;
  nowMs: number;
  writes: ReturnType<typeof useLeverageWrites>;
}

function Row({ position, symbol, decimals, nowMs, writes }: RowProps) {
  const market = useMarket(position.marketId);
  const mark = useLeverageMark(position.status === "live" ? position.positionId : null);
  const info = market && isOk(market) && market.value ? { asset: market.value.asset, intervalSec: market.value.intervalSec } : null;
  return (
    <LeverageBetRow
      position={position}
      market={info}
      mark={mark && isOk(mark) ? mark.value : null}
      symbol={symbol}
      decimals={decimals}
      nowMs={nowMs}
      busy={writes.busy}
      canSign={writes.canSign}
      isOwner={writes.address?.toLowerCase() === position.owner}
      onCashOut={(p, min) => void writes.close(p.positionId, p.marketId, min, decimals, symbol ?? "")}
      onSettle={(p) => void writes.settle(p.positionId, p.marketId)}
    />
  );
}

/**
 * The wallet's boosts, listed under its own open bets: live ones with their mark, then the last few that
 * settled, knocked out or cashed out. Renders nothing without a reserve or without positions — the
 * wallet's panel already carries the empty state.
 */
export function LeverageBetRows({ symbol }: { symbol: string | undefined }) {
  const { address } = useWalletSession();
  const reserve = useLeverageReserve();
  const decimals = reserve && isOk(reserve) && reserve.value ? reserve.value.decimals : 6;
  const nowMs = useChainNowMs();
  const reading = useMyLeveragePositions(address);
  const writes = useLeverageWrites();
  if (!reading || !isOk(reading) || reading.value.length === 0) return null;
  const live = reading.value.filter((p) => p.status === "live");
  const done = reading.value.filter((p) => p.status !== "live").slice(0, SETTLED_SHOWN);
  return (
    <>
      {live.length > 0 && (
        <ul className="flex flex-col">
          {live.map((p) => (
            <Row key={p.positionId.toString()} position={p} symbol={symbol} decimals={decimals} nowMs={nowMs} writes={writes} />
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="type-label-micro text-ink-muted">{LEVERAGE.bets.history}</span>
          <ul className="flex flex-col">
            {done.map((p) => (
              <Row key={p.positionId.toString()} position={p} symbol={symbol} decimals={decimals} nowMs={nowMs} writes={writes} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
