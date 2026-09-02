import { CLOCK_RESYNC_MS, MARKETS_POLL_MS, ONCHAIN_POLL_MS, OPENING_PRINT_POLL_MS } from "@masayume/core/constants";
import type { WalletHistory } from "@masayume/core/projection";
import { isOk, type Reading } from "@masayume/core/schemas";
import type { Address, BalanceSheet, Bytes32, ClaimableRow, ClockSync, EventMarket, LaneSet, MarketId, OnchainSnapshot, OpenPosition, PricePoint, Resolution } from "@masayume/core/types";
import type { ParlayReserveState, ParlayTicket } from "@masayume/core/parlay";
import type { RangeReserveState, RangeRound } from "@masayume/core/range";
import type { MakerVaultState, MakerWindowView } from "@masayume/core/maker";
import type { LeverageMark, LeveragePosition, LeverageReserveState } from "@masayume/core/leverage";
import type { VaultHoldings, VaultSnapshot } from "@masayume/core/vault";
import { getBalanceSheet } from "../provider/balances";
import { listWalletHistory } from "../provider/history";
import { listClaimables } from "../provider/claimables";
import { syncClock } from "../provider/clock-sync";
import { getMarket, listLiveLanes } from "../provider/markets";
import { nextWindow } from "../provider/next-window";
import { getOnchain } from "../provider/onchain";
import { listOpenPositions } from "../provider/positions";
import { getOpeningPrice, getPriceHistory } from "../provider/prices";
import { getResolution } from "../provider/resolution";
import { getParlayReserveState, listParlaysOf } from "../parlay/read";
import { getRangeReserveState, listRangesOf } from "../range/read";
import { getMakerSharesOf, getMakerVaultState, listMakerHistory, listMakerOpenWindows } from "../maker/read";
import { getLeverageMark, getLeverageReserveState, listLeveragePositionsOf } from "../leverage/read";
import { getVaultHoldings, getVaultSnapshot } from "../vault/read";
import { keys } from "./keys";
import { useReadingQuery } from "./useReadingQuery";

export function useLanes(venueId: Bytes32 | null): Reading<LaneSet> | null {
  return useReadingQuery(keys.lanes(venueId), () => listLiveLanes(venueId as Bytes32), { pollMs: MARKETS_POLL_MS, enabled: venueId !== null });
}

export function useMarket(marketId: MarketId | null): Reading<EventMarket | null> | null {
  return useReadingQuery(keys.market(marketId), () => getMarket(marketId as MarketId), { pollMs: MARKETS_POLL_MS, enabled: marketId !== null });
}

/** Polls only while the print is still pending; a print, once seen, never changes (FR-7). */
export function useOpeningPrice(marketId: MarketId | null): Reading<bigint | null> | null {
  return useReadingQuery(keys.openingPrice(marketId), () => getOpeningPrice(marketId as MarketId), {
    enabled: marketId !== null,
    pollMs: (reading) => (reading && isOk(reading) && reading.value !== null ? false : OPENING_PRINT_POLL_MS),
  });
}

export function usePriceHistory(asset: string | null, fromSec: number, toSec: number): Reading<PricePoint[]> | null {
  return useReadingQuery(keys.priceHistory(asset, fromSec, toSec), () => getPriceHistory(asset as string, fromSec, toSec), {
    enabled: asset !== null,
    staleTimeMs: Number.POSITIVE_INFINITY,
  });
}

export function useOnchain(marketId: MarketId | null, pollMs: number | false = ONCHAIN_POLL_MS): Reading<OnchainSnapshot> | null {
  return useReadingQuery(keys.onchain(marketId), () => getOnchain(marketId as MarketId), { enabled: marketId !== null, pollMs: pollMs || undefined });
}

export function useResolution(marketId: MarketId | null): Reading<Resolution> | null {
  return useReadingQuery(keys.resolution(marketId), () => getResolution(marketId as MarketId), { enabled: marketId !== null });
}

export function usePositions(wallet: Address | null): Reading<OpenPosition[]> | null {
  return useReadingQuery(keys.positions(wallet), () => listOpenPositions(wallet as Address), { pollMs: MARKETS_POLL_MS, enabled: wallet !== null });
}

export function useClaimables(wallet: Address | null, venueId: Bytes32 | null): Reading<ClaimableRow[]> | null {
  return useReadingQuery(keys.claimables(wallet, venueId), () => listClaimables(wallet as Address, venueId as Bytes32), {
    pollMs: MARKETS_POLL_MS,
    enabled: wallet !== null && venueId !== null,
  });
}

export function useBalanceSheet(wallet: Address | null): Reading<BalanceSheet> | null {
  return useReadingQuery(keys.balanceSheet(wallet), () => getBalanceSheet(wallet as Address), { pollMs: MARKETS_POLL_MS, enabled: wallet !== null });
}

/** Settled history for a wallet — one reading shared by the ledger rows, the equity curve, Trader Edge and the badges. */
export function useWalletHistory(wallet: Address | null): Reading<WalletHistory> | null {
  return useReadingQuery(keys.history(wallet), () => listWalletHistory(wallet as Address), { pollMs: MARKETS_POLL_MS, enabled: wallet !== null });
}

export function useNextWindow(market: EventMarket | null): Reading<EventMarket | null> | null {
  return useReadingQuery(keys.nextWindow(market?.marketId ?? null), () => nextWindow(market as EventMarket), { enabled: market !== null });
}

export function useClock(): Reading<ClockSync> | null {
  return useReadingQuery(keys.clock(), syncClock, { pollMs: CLOCK_RESYNC_MS });
}

/** The Trading Balance and the live grant per kind; `null` inside the reading where no vault is deployed. */
export function useVaultSnapshot(wallet: Address | null): Reading<VaultSnapshot | null> | null {
  return useReadingQuery(keys.vault(wallet), () => getVaultSnapshot(wallet as Address), { pollMs: MARKETS_POLL_MS, enabled: wallet !== null });
}

/** The reserve's sheet and tunables; `null` inside the reading where no reserve is deployed. */
export function useParlayReserve(): Reading<ParlayReserveState | null> | null {
  return useReadingQuery(keys.parlayReserve(), getParlayReserveState, { pollMs: MARKETS_POLL_MS });
}

/** One wallet's tickets, live first; empty (never an error) without a reserve. */
export function useMyParlays(wallet: Address | null): Reading<ParlayTicket[]> | null {
  return useReadingQuery(keys.parlays(wallet), () => listParlaysOf(wallet as Address), { pollMs: MARKETS_POLL_MS, enabled: wallet !== null });
}

/** The range reserve's sheet and tunables; `null` inside the reading where no reserve is deployed. */
export function useRangeReserve(): Reading<RangeReserveState | null> | null {
  return useReadingQuery(keys.rangeReserve(), getRangeReserveState, { pollMs: MARKETS_POLL_MS });
}

/** One wallet's range rounds, live first; empty (never an error) without a reserve. */
export function useMyRanges(wallet: Address | null): Reading<RangeRound[]> | null {
  return useReadingQuery(keys.ranges(wallet), () => listRangesOf(wallet as Address), { pollMs: MARKETS_POLL_MS, enabled: wallet !== null });
}

/** The maker vault's sheet and tunables; `null` inside the reading where no vault is deployed. */
export function useMakerVault(): Reading<MakerVaultState | null> | null {
  return useReadingQuery(keys.makerVault(), getMakerVaultState, { pollMs: MARKETS_POLL_MS });
}

/** The Windows the maker vault is quoting or holding; empty (never an error) without a vault. */
export function useMakerWindows(): Reading<MakerWindowView[]> | null {
  return useReadingQuery(keys.makerWindows(), listMakerOpenWindows, { pollMs: MARKETS_POLL_MS });
}

/** The maker vault's Windows, newest first, settled ones with their result. */
export function useMakerHistory(limit = 20): Reading<MakerWindowView[]> | null {
  return useReadingQuery(keys.makerHistory(limit), () => listMakerHistory(limit), { pollMs: MARKETS_POLL_MS });
}

/** One wallet's maker vault shares and their worth; zeros without a vault. */
export function useMakerShares(wallet: Address | null): Reading<{ shares: bigint; worthBase: bigint }> | null {
  return useReadingQuery(keys.makerShares(wallet), () => getMakerSharesOf(wallet as Address), { pollMs: MARKETS_POLL_MS, enabled: wallet !== null });
}

/** What the vault holds for the wallet on one Window; zeros without a vault. */
export function useVaultHoldings(wallet: Address | null, onchain: OnchainSnapshot | null): Reading<VaultHoldings> | null {
  return useReadingQuery(keys.vaultHoldings(wallet, onchain?.marketId ?? null), () => getVaultHoldings(wallet as Address, onchain as OnchainSnapshot), {
    pollMs: MARKETS_POLL_MS,
    enabled: wallet !== null && onchain !== null,
  });
}

/** The leverage reserve's sheet; null (never an error) where none is deployed. */
export function useLeverageReserve(): Reading<LeverageReserveState | null> | null {
  return useReadingQuery(keys.leverageReserve(), getLeverageReserveState, { pollMs: MARKETS_POLL_MS });
}

/** One wallet's boosts, live first; empty without a reserve. */
export function useMyLeveragePositions(wallet: Address | null): Reading<LeveragePosition[]> | null {
  return useReadingQuery(keys.leveragePositions(wallet), () => listLeveragePositionsOf(wallet as Address), { pollMs: MARKETS_POLL_MS, enabled: wallet !== null });
}

/** A live boost's mark off the book, against its knock-out line. */
export function useLeverageMark(positionId: bigint | null): Reading<LeverageMark> | null {
  return useReadingQuery(keys.leverageMark(positionId === null ? null : positionId.toString()), () => getLeverageMark(positionId as bigint), { pollMs: ONCHAIN_POLL_MS, enabled: positionId !== null });
}
