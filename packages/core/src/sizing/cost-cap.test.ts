import { describe, expect, it } from "vitest";
import { bufferToSlippageBps, capCostBase, costCapBufferBps } from "./cost-cap";

describe("costCapBufferBps", () => {
  it("interpolates 1.6× at 60s to 1.1× at 3600s and clamps outside", () => {
    expect(costCapBufferBps(30)).toBe(16_000);
    expect(costCapBufferBps(60)).toBe(16_000);
    expect(costCapBufferBps(1830)).toBe(13_500);
    expect(costCapBufferBps(3600)).toBe(11_000);
    expect(costCapBufferBps(86_400)).toBe(11_000);
  });

  it("converts to the SDK's slippage vocabulary and caps cost rounding up", () => {
    expect(bufferToSlippageBps(16_000)).toBe(6_000);
    expect(capCostBase(1_000_000n, 60)).toBe(1_600_000n);
    expect(capCostBase(1_000_001n, 3600)).toBe(1_100_002n);
  });
});
