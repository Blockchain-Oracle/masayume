import { beforeEach, describe, expect, it, vi } from "vitest";
import { toMarketId } from "@masayume/core/types";
import { executeMention, type ExecutorContext } from "./execute";
import { replyText } from "./reply-format";

const dependencies = vi.hoisted(() => ({
  link: vi.fn(), snapshot: vi.fn(), lanes: vi.fn(), quote: vi.fn(), submit: vi.fn(),
}));
vi.mock("@masayume/db", () => ({ xLinkByAuthor: dependencies.link, xReceiptUpsert: vi.fn() }));
vi.mock("@masayume/markets", () => ({
  getCollateral: () => ({ decimals: 6 }), getVaultSnapshot: dependencies.snapshot,
  resolveVenueId: vi.fn(), marketsProvider: { listLiveLanes: dependencies.lanes, freshQuoteStake: dependencies.quote, nowMs: () => 100_000 },
}));

const HASH = `0x${"ab".repeat(32)}`;
const ADDRESS = `0x${"11".repeat(20)}`;
const MARKET_ID = toMarketId(`0x${"22".repeat(32)}`);
const mention = { id: "1", authorId: "2", handle: "example", text: "BTC UP 100 5m", createdAtMs: 1 };
// Dependencies are stubbed at the database/chain boundary: these tests never create a signer or make a request.
const context = { session: { address: ADDRESS, submitter: { submitOrder: dependencies.submit } }, venueId: MARKET_ID, log: vi.fn() } as unknown as ExecutorContext;
const market = {
  marketId: MARKET_ID, asset: "BTC", intervalSec: 300, expirySec: 400, isUpDown: true,
  tradingStartSec: 100, openingPriceRaw: 1n, status: "Trading", voided: false, finalized: false,
  poolAddress: ADDRESS, decimals: 6,
};

beforeEach(() => {
  vi.resetAllMocks();
  dependencies.link.mockResolvedValue({ wallet: ADDRESS });
  dependencies.snapshot.mockResolvedValue({ ok: true, value: { grants: { executor: { grantId: 7n, actor: ADDRESS, expiresAtSec: Math.floor(Date.now() / 1000) + 3600 } } } });
  dependencies.lanes.mockResolvedValue({ ok: true, value: { lanes: [{ markets: [market] }] } });
  dependencies.quote.mockResolvedValue({ ok: true, value: { maxCostBase: 100_000_000n } });
  dependencies.submit.mockResolvedValue({ status: "confirmed", booked: { txHash: HASH, costBase: 1_234_567n, contractsRaw: 2_469_134n, avgPriceBps: 5000 } });
});

describe("mention execution receipt integration", () => {
  it("passes the requested budget to the grant and records independently booked amounts plus the resolved Window", async () => {
    const result = await executeMention(context, mention);
    expect(dependencies.submit).toHaveBeenCalledWith(expect.objectContaining({ stakeBase: 100_000_000n, route: { kind: "vault-grant", grantId: 7n } }));
    expect(result).toMatchObject({ stakeBase: "100000000", bookedCostBase: "1234567", bookedContractsRaw: "2469134", avgPriceBps: 5000, marketId: MARKET_ID, asset: "BTC", intervalSec: 300, expirySec: 400, grantId: "7", status: "filled", txHash: HASH });
    expect(replyText(result, 6)).toContain("Spent 1.234567 tUSDC.");
  });

  it("does not submit an unlinked account and returns the stable public category", async () => {
    dependencies.link.mockResolvedValue(null);
    const result = await executeMention(context, mention);
    expect(result).toMatchObject({ status: "refused", refusalCode: "account-not-linked", txHash: null });
    expect(dependencies.snapshot).not.toHaveBeenCalled();
    expect(dependencies.submit).not.toHaveBeenCalled();
  });

  it("does not echo invalid mention tokens into the public refusal", async () => {
    const result = await executeMention(context, { ...mention, text: "BTC UP 100 5m secret123" });
    expect(result).toMatchObject({ status: "refused", refusalCode: "instruction-invalid" });
    expect(result.reason).not.toContain("secret123");
    expect(replyText(result, 6)).not.toContain("secret123");
    expect(dependencies.submit).not.toHaveBeenCalled();
  });

  it("does not leak provider errors while retaining the resolved Window for a failed quote", async () => {
    dependencies.quote.mockResolvedValue({ ok: false, error: { technical: "https://private-rpc.example?key=secret" } });
    const result = await executeMention(context, mention);
    expect(result).toMatchObject({ status: "refused", refusalCode: "quote-unavailable", marketId: MARKET_ID, expirySec: 400 });
    expect(result.reason).not.toMatch(/private-rpc|secret/);
    expect(dependencies.submit).not.toHaveBeenCalled();
  });

  it("records uncertainty without inventing a broadcast or booked amount", async () => {
    dependencies.submit.mockResolvedValue({ status: "unknown", diagnosis: { kind: "send-unknown", technical: "private provider detail" } });
    const result = await executeMention(context, mention);
    expect(result).toMatchObject({ status: "unknown", txHash: null, stakeBase: "100000000" });
    expect(result.bookedCostBase).toBeUndefined();
    expect(replyText(result, 6)).toContain("Status needs checking");
    expect(replyText(result, 6)).not.toContain("private provider");
  });

  it("keeps a tiny requested stake exact even when no quote is fillable", async () => {
    dependencies.quote.mockResolvedValue({ ok: true, value: null });
    const result = await executeMention(context, { ...mention, text: "BTC UP 0.000001 5m" });
    expect(result).toMatchObject({ stakeBase: "1", status: "refused", refusalCode: "no-liquidity" });
    expect(result.reason).not.toContain("0.00");
    expect(dependencies.submit).not.toHaveBeenCalled();
  });
});
