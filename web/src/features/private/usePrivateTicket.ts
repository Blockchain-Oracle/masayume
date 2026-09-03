"use client";

import type { BlockerContext, BlockerKind } from "@masayume/core/copy";
import type { BookedOrder } from "@masayume/core/ports";
import type { PrivateBudget, PrivateQuote } from "@masayume/core/private";
import { isOk } from "@masayume/core/schemas";
import type { Diagnosis, EventMarket, Side } from "@masayume/core/types";
import { formatBaseUnits, oneUnit, priceRawToBps } from "@masayume/core/units";
import { usePrivateBudget, usePrivateDesk } from "@masayume/markets/react";
import { useCallback, useEffect, useState } from "react";
import { notify } from "@/lib/toast";
import { useWalletSession } from "@/lib/wallet-session";
import { SIDE_WORD } from "../markets/side-styles";
import type { TicketBlockerInput } from "../markets/ticket/ticket-guards";
import { PRIVATE } from "./copy";
import { derivePrivateBlocker } from "./private-blocker";
import { usePrivateOpen } from "./usePrivateOpen";
import { usePrivateQuote } from "./usePrivateQuote";
import { usePrivateStatus } from "./usePrivateStatus";
import { usePrivateWrites } from "./usePrivateWrites";

/** The reference tops up "a few bets' worth" — four stakes — and never more than the wallet holds. */
const TOP_UP_STAKES = 4n;
/** The open refuses a fill more than 5% under the quoted size; the stake never changes. */
const FILL_FLOOR_BPS = 9_500n;

export interface PrivateTicketInput {
  market: EventMarket;
  side: Side | null;
  stakeBase: bigint;
  enabled: boolean;
  symbol: string;
  walletSpendableBase: bigint | null;
  base: TicketBlockerInput;
}

export type PrivateBusy = "fund" | "open" | null;

export interface PrivateTicketState {
  deployed: boolean;
  probing: boolean;
  ready: boolean;
  reason: string | null;
  retryStatus: () => void;
  budget: PrivateBudget | null;
  budgetReadable: boolean;
  quote: PrivateQuote | null;
  quoteLoading: boolean;
  quoteError: Diagnosis | null;
  retryQuote: () => void;
  shortBase: bigint;
  topUpBase: bigint;
  overCap: boolean;
  blocker: BlockerKind | null;
  ctx: Partial<BlockerContext>;
  busy: PrivateBusy;
  place: () => Promise<void>;
  fund: () => Promise<void>;
  placed: BookedOrder | null;
  reset: () => void;
}

/** Everything the Ticket's private route needs, derived once: the desk's readiness, the owner's budget, the desk's quote, the ladder, and the one-action place. */
export function usePrivateTicket({ market, side, stakeBase, enabled, symbol, walletSpendableBase, base }: PrivateTicketInput): PrivateTicketState {
  const { address } = useWalletSession();
  const deskReading = usePrivateDesk();
  const desk = deskReading && isOk(deskReading) ? deskReading.value : null;
  const deployed = desk !== null;
  const status = usePrivateStatus(deployed);
  const budgetReading = usePrivateBudget(enabled ? address : null);
  const budget = budgetReading && isOk(budgetReading) ? budgetReading.value : null;
  const budgetReadable = budgetReading === null ? true : isOk(budgetReading);
  const quote = usePrivateQuote({ market, side, stakeBase, enabled: enabled && status.status?.ready === true && base.phase === "trading" });
  const writes = usePrivateWrites();
  const opener = usePrivateOpen();
  const [busy, setBusy] = useState<PrivateBusy>(null);
  const [placed, setPlaced] = useState<BookedOrder | null>(null);
  const decimals = market.decimals;

  const spendable = budget?.spendableBase ?? 0n;
  const shortBase = stakeBase > spendable ? stakeBase - spendable : 0n;
  const wanted = stakeBase * TOP_UP_STAKES;
  const wallet = walletSpendableBase ?? 0n;
  const topUpBase = shortBase === 0n ? 0n : wanted < wallet ? wanted : wallet;
  const walletCanCover = walletSpendableBase !== null && walletSpendableBase >= shortBase;
  const minStakeBase = status.status?.minStakeBase ? BigInt(status.status.minStakeBase) : (desk?.params.minStakeBase ?? null);
  const maxStakeBase = status.status?.maxStakeBase ? BigInt(status.status.maxStakeBase) : (desk?.params.maxStakeBase ?? null);
  const overCap = maxStakeBase !== null && stakeBase > maxStakeBase;

  const blocker = enabled
    ? derivePrivateBlocker(
        { ...base, placing: base.placing || busy !== null },
        { deployed, probing: status.probing, ready: status.status?.ready === true, minStakeBase, maxStakeBase, budgetReadable, shortBase, walletCanCover, quote: quote.quote, quoteLoading: quote.loading, quoteError: quote.error },
      )
    : null;
  const ctx: Partial<BlockerContext> = {
    privateMinText: minStakeBase !== null ? `${formatBaseUnits(minStakeBase, decimals, { minDp: 0 })} ${symbol}` : undefined,
    privateCapText: maxStakeBase !== null ? `${formatBaseUnits(maxStakeBase, decimals, { minDp: 0 })} ${symbol}` : undefined,
    spendableText: walletSpendableBase !== null ? `${formatBaseUnits(walletSpendableBase, decimals)} ${symbol}` : undefined,
  };

  useEffect(() => setPlaced(null), [stakeBase, side]);

  /** Top up and authorise in one transaction (the reference's `submitPrivateTopUp`): the new balance is what the desk may spend. */
  const fund = useCallback(async () => {
    if (!budget || topUpBase === 0n) return;
    setBusy("fund");
    try {
      await writes.run({ kind: "private-deposit-and-allow", amountBase: topUpBase, allowanceBase: budget.balanceBase + topUpBase }, PRIVATE.toasts.toppedUp);
    } finally {
      setBusy(null);
    }
  }, [budget, topUpBase, writes]);

  /** One action even the first time: the top-up first when the balance will not cover it, then the signature and the desk. */
  const place = useCallback(async () => {
    if (!side || !quote.quote || blocker) return;
    if (shortBase > 0n) {
      if (!budget || topUpBase < shortBase) return;
      setBusy("fund");
      const funded = await writes.run({ kind: "private-deposit-and-allow", amountBase: topUpBase, allowanceBase: budget.balanceBase + topUpBase }, null);
      if (funded?.status !== "confirmed") {
        setBusy(null);
        return;
      }
    }
    setBusy("open");
    try {
      const q = quote.quote;
      const result = await opener.open({ market, side, stakeBase, minQuantityRaw: (q.quantityRaw * FILL_FLOOR_BPS) / 10_000n, symbol });
      if (!result) return;
      if (result.status === "opened") {
        const t = result.ticket;
        const contractsRaw = BigInt(t.quantityRaw);
        const costBase = BigInt(t.costBase);
        const avgRaw = contractsRaw === 0n ? 0n : (costBase * oneUnit(decimals) + contractsRaw - 1n) / contractsRaw;
        setPlaced({ marketId: market.marketId, side, contractsRaw, costBase, avgPriceBps: priceRawToBps(avgRaw, decimals), txHash: t.txs.mint, fillCount: 1 });
        notify.neutral(PRIVATE.toasts.placed(SIDE_WORD[side], `${market.asset} ${t.intervalSec ? "" : ""}`.trim()));
      } else if (result.status === "refused") {
        notify.warning(result.reason, result.technical);
        quote.retry();
      } else {
        notify.warning(PRIVATE.toasts.unknown, result.reason);
      }
    } catch (error) {
      notify.warning(PRIVATE.cta.placing, error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }, [side, quote, blocker, shortBase, budget, topUpBase, writes, opener, market, stakeBase, symbol, decimals]);

  return {
    deployed,
    probing: status.probing,
    ready: status.status?.ready === true,
    reason: status.reason,
    retryStatus: status.retry,
    budget,
    budgetReadable,
    quote: quote.quote,
    quoteLoading: quote.loading,
    quoteError: quote.error,
    retryQuote: quote.retry,
    shortBase,
    topUpBase,
    overCap,
    blocker,
    ctx,
    busy,
    place,
    fund,
    placed,
    reset: () => setPlaced(null),
  };
}
