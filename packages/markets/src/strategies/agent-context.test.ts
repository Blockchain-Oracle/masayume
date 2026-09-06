import type { EventMarket } from "@masayume/core/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ opening: vi.fn(), price: vi.fn(), history: vi.fn(), quote: vi.fn() }));
vi.mock("../provider", () => ({ marketsProvider: { getOpeningPrice: mocks.opening, getAssetPrice: mocks.price, getPriceHistory: mocks.history, freshQuoteStake: mocks.quote } }));
import { readAgentContext } from "./agent-context";

const ok = <T>(value: T) => ({ ok: true as const, value, stale: false, asOfMs: 1_300_000 });
const market = { marketId: `0x${"11".repeat(32)}`, asset: "BTC", intervalSec: 900, tradingStartSec: 1_000, expirySec: 1_900, decimals: 6 } as EventMarket;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.opening.mockResolvedValue(ok(10_000n));
  mocks.price.mockResolvedValue(ok({ emaRaw: 10_020n, priceRaw: 10_020n, decimals: 2 }));
  mocks.history.mockResolvedValue(ok([]));
  mocks.quote.mockResolvedValue(ok({ oddsCents: 50 }));
});

describe("fresh agent context", () => {
  it("does not re-label a stale opening, price or history as fresh model context", async () => {
    for (const [read, value] of [[mocks.opening, 10_000n], [mocks.price, { emaRaw: 10_020n, priceRaw: 10_020n, decimals: 2 }], [mocks.history, []]] as const) {
      read.mockResolvedValueOnce({ ...ok(value), stale: true });
      expect((await readAgentContext(market, 100n, 1_300_000)).ok).toBe(false);
    }
  });
  it("leaves stale side quotes unavailable to the gate", async () => {
    mocks.quote.mockResolvedValue({ ...ok({ oddsCents: 50 }), stale: true });
    const reading = await readAgentContext(market, 100n, 1_300_000);
    expect(reading).toMatchObject({ ok: true, stale: false, value: { upCents: null, downCents: null } });
  });
});
