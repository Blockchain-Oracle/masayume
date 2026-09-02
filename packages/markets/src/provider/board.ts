import { buildLedgers, ledgerHasActivity, rankTraders, settleRound, type LedgerFill, type LedgerSetAction, type MarketLedger, type SettledRound, type TraderRanking } from "@masayume/core/projection";
import type { Reading } from "@masayume/core/schemas";
import { toMarketId, type Address, type Bytes32, type MarketId } from "@masayume/core/types";
import type { BinaryMarket, FillRow } from "@somnia-chain/markets-sdk";
import { loadCollateral } from "../collateral";
import { toLedgerFill, toSetAction } from "../mappers/fill";
import { getClient } from "../runtime/read-runtime";
import { settlementFeeBps } from "./fees";
import { mapPool, toRoundMarket } from "./history";
import { SETTLED_STATUSES } from "./markets";
import { withReading, type Unwrap } from "./reading";

/**
 * The venue-wide board: every wallet's rounds that closed inside a window, ranked by realised
 * result — the same replay `/portfolio` uses, run over the fill tape of every pool.
 *
 * Fills are fetched from a day further back than the window so every Window that EXPIRED in the
 * window has its whole trading life in hand (no cadence here is longer than a day); a Window that
 * started earlier than that is left out rather than scored on a partial ledger.
 */
export interface VenueBoard {
  rankings: TraderRanking[];
  windowStartMs: number;
  windowEndMs: number;
  rankedTraders: number;
  totalWallets: number;
  closedCalls: number;
  /** False when a paging cap cut a scan short — the board then covers a prefix of the day and says so. */
  complete: boolean;
  decimals: number;
  symbol: string;
}

export interface BoardScope {
  venueId: Bytes32;
  windowStartMs: number;
  windowEndMs: number;
  /** Fetch fills and actions from here; must precede the window by the longest cadence. */
  lookbackSec: number;
  top: number;
}

const FILL_PAGE = 1_000;
const FILL_MAX_PAGES = 5;
const PAST_PAGE = 100;
const PAST_MAX_PAGES = 20;
const ROUTER_PAGE = 1_000;
const ROUTER_MAX_PAGES = 3;
const CONCURRENCY = 8;

const feeByMarket = new Map<MarketId, number>();

/** Past markets newest-first, paged until the tail predates the lookback. */
async function marketsInScope(scope: BoardScope): Promise<{ markets: BinaryMarket[]; pools: Set<string>; complete: boolean }> {
  const client = getClient();
  const nowSec = Math.floor(scope.windowEndMs / 1000);
  const markets: BinaryMarket[] = [];
  const pools = new Set<string>();
  let complete = false;
  for (let page = 0; page < PAST_MAX_PAGES; page += 1) {
    const rows = await client.listPastBinaryMarkets({ venueId: scope.venueId, limit: PAST_PAGE, offset: page * PAST_PAGE, nowSec });
    for (const row of rows) pools.add(row.poolAddress.toLowerCase());
    markets.push(...rows.filter((row) => Number(row.expiry) * 1000 >= scope.windowStartMs && Number(row.tradingStart ?? row.expiry) >= scope.lookbackSec));
    const oldest = rows.at(-1);
    if (rows.length < PAST_PAGE || (oldest && Number(oldest.expiry) < scope.lookbackSec)) {
      complete = true;
      break;
    }
  }
  for (const row of await client.listLiveBinaryMarkets({ venueId: scope.venueId, limit: PAST_PAGE, nowSec })) pools.add(row.poolAddress.toLowerCase());
  return { markets, pools, complete };
}

async function fillsSince(pool: string, sinceSec: number): Promise<{ rows: FillRow[]; complete: boolean }> {
  const rows: FillRow[] = [];
  for (let page = 0; page < FILL_MAX_PAGES; page += 1) {
    const batch = await getClient().getFills(pool, { since: sinceSec, limit: FILL_PAGE, offset: page * FILL_PAGE });
    rows.push(...batch);
    if (batch.length < FILL_PAGE) return { rows, complete: true };
  }
  return { rows, complete: false };
}

/** Router actions are per account; page newest-first until the tail predates the lookback. */
async function setActionsFor(wallet: Address, sinceSec: number, inScope: Set<MarketId>): Promise<{ actions: LedgerSetAction[]; complete: boolean }> {
  const actions: LedgerSetAction[] = [];
  for (let page = 0; page < ROUTER_MAX_PAGES; page += 1) {
    const batch = await getClient().getRouterActions(wallet, { limit: ROUTER_PAGE, offset: page * ROUTER_PAGE });
    for (const record of batch) {
      const action = toSetAction(record);
      if (action && inScope.has(action.marketId)) actions.push(action);
    }
    const oldest = batch.at(-1);
    if (batch.length < ROUTER_PAGE || (oldest && Number(oldest.timestamp) < sinceSec)) return { actions, complete: true };
  }
  return { actions, complete: false };
}

async function feeFor(inner: Unwrap, marketId: MarketId): Promise<number> {
  const cached = feeByMarket.get(marketId);
  if (cached !== undefined) return cached;
  const bps = inner(await settlementFeeBps(marketId));
  feeByMarket.set(marketId, bps);
  return bps;
}

function participants(fills: readonly FillRow[]): Address[] {
  const wallets = new Set<string>();
  for (const fill of fills) {
    if (fill.maker) wallets.add(fill.maker.toLowerCase());
    const taker = fill.takerOrder?.owner ?? fill.taker;
    if (taker) wallets.add(taker.toLowerCase());
  }
  return [...wallets] as Address[];
}

export async function readVenueBoard(scope: BoardScope): Promise<Reading<VenueBoard>> {
  return withReading(`board:${scope.venueId}:${scope.windowEndMs}`, async (inner) => {
    const collateral = inner(await loadCollateral());
    const { markets, pools, complete: marketsComplete } = await marketsInScope(scope);
    const rowById = new Map<MarketId, BinaryMarket>(markets.map((row) => [toMarketId(row.marketId), row]));
    const inScope = new Set(rowById.keys());

    const tapes = await mapPool([...pools], CONCURRENCY, (pool) => fillsSince(pool, scope.lookbackSec));
    const fills = tapes.flatMap((tape) => tape.rows).filter((fill) => inScope.has(toMarketId(fill.market)));
    let complete = marketsComplete && tapes.every((tape) => tape.complete);

    const settledIds = [...rowById.values()].filter((row) => SETTLED_STATUSES.has(row.status)).map((row) => toMarketId(row.marketId));
    const fees = new Map(await mapPool(settledIds, CONCURRENCY, async (id) => [id, await feeFor(inner, id)] as const));

    const byWallet = new Map<Address, SettledRound[]>();
    await mapPool(participants(fills), CONCURRENCY, async (wallet) => {
      const own = fills.map((fill) => toLedgerFill(wallet, fill)).filter((fill): fill is LedgerFill => fill !== null);
      const { actions, complete: actionsComplete } = await setActionsFor(wallet, scope.lookbackSec, inScope);
      complete &&= actionsComplete;
      const rounds: SettledRound[] = [];
      for (const [id, ledger] of buildLedgers(own, actions, collateral.decimals)) {
        const row = rowById.get(id);
        const feeBps = fees.get(id);
        if (!row || feeBps === undefined || !ledgerHasActivity(ledger as MarketLedger)) continue;
        // No live balance on a venue-wide scan: the board ranks results, it never claims a payout was collected.
        const round = settleRound({ ledger, market: toRoundMarket(row), feeBps, liveHoldings: null });
        if (round) rounds.push(round);
      }
      if (rounds.length > 0) byWallet.set(wallet, rounds);
    });

    const { rankings, closedCalls, totalWallets } = rankTraders(byWallet, scope);
    return {
      rankings: rankings.slice(0, scope.top),
      windowStartMs: scope.windowStartMs,
      windowEndMs: scope.windowEndMs,
      rankedTraders: rankings.length,
      totalWallets,
      closedCalls,
      complete,
      decimals: collateral.decimals,
      symbol: collateral.symbol,
    };
  });
}
