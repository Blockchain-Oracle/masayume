import { describe, expect, it } from "vitest";
import { headroomSec, orderExpirySec } from "./headroom";

describe("headroomSec", () => {
  it("clamps max(30, min(300, interval × 0.4))", () => {
    expect(headroomSec(60)).toBe(30);
    expect(headroomSec(300)).toBe(120);
    expect(headroomSec(600)).toBe(240);
    expect(headroomSec(900)).toBe(300);
    expect(headroomSec(3600)).toBe(300);
  });
});

describe("orderExpirySec", () => {
  const expirySec = 10_000;

  it("is one headroom past now, never beyond the market", () => {
    expect(orderExpirySec(9_000, expirySec, 300)).toBe(9_120);
    expect(orderExpirySec(9_879, expirySec, 300)).toBe(9_999);
  });

  it("is null inside the no-entry buffer", () => {
    expect(orderExpirySec(9_880, expirySec, 300)).toBeNull();
    expect(orderExpirySec(expirySec, expirySec, 300)).toBeNull();
  });
});
