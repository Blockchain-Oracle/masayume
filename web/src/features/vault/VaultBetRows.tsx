"use client";

import { isOk } from "@masayume/core/schemas";
import { useWalletSession } from "@/lib/wallet-session";
import { useChainNowMs } from "../markets/useChainNow";
import { useVaultOpenBets } from "./useVaultOpenBets";
import { VaultBetRow } from "./VaultBetRow";

/** Open Windows the vault holds for the connected wallet, listed under the wallet's own open bets. Renders nothing without a vault or without positions — the wallet's panel already carries the empty state. */
export function VaultBetRows({ symbol }: { symbol: string | undefined }) {
  const { address } = useWalletSession();
  const nowMs = useChainNowMs();
  const reading = useVaultOpenBets(address);
  if (!reading || !isOk(reading) || reading.value.length === 0) return null;
  return (
    <ul className="flex flex-col">
      {reading.value.map((bet) => (
        <VaultBetRow key={bet.marketId} bet={bet} symbol={symbol} nowMs={nowMs} />
      ))}
    </ul>
  );
}
