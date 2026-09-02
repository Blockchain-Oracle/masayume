import type { PrivateClaim } from "@masayume/core/private";
import { toMarketId, type Address } from "@masayume/core/types";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { SOMNIA_SHANNON } from "../chain";
import { claimDomain, signPrivateClaim, verifyPrivateClaim } from "./claim";
import { deriveSlotKeys } from "./keys";

const DESK_KEY = `0x${"11".repeat(32)}` as const;
const OTHER_KEY = `0x${"22".repeat(32)}` as const;
const CONTRACT = "0x00000000000000000000000000000000000000d5" as Address;

describe("deriveSlotKeys", () => {
  it("gives three distinct keys, stable for one signature and different for another", () => {
    const a = deriveSlotKeys("0xabcdef");
    const b = deriveSlotKeys("0xabcdef");
    const c = deriveSlotKeys("0xabcdee");
    expect(a).toEqual(b);
    expect(new Set([a.slotId, a.chargeKey, a.creditKey]).size).toBe(3);
    expect(c.slotId).not.toBe(a.slotId);
    expect(a.slotId).toMatch(/^0x[0-9a-f]{64}$/);
  });
});

describe("the claim", () => {
  const desk = privateKeyToAccount(DESK_KEY);
  const wallet = createWalletClient({ account: desk, chain: SOMNIA_SHANNON, transport: http("http://127.0.0.1:1") });
  const domain = claimDomain(SOMNIA_SHANNON.id, CONTRACT);
  const keys = deriveSlotKeys("0xabcdef");
  const claim: PrivateClaim = {
    owner: "0xD357A1b7F6E1C2d3E4F5061728394A5B6C7D9358" as Address,
    slotId: keys.slotId,
    creditKey: keys.creditKey,
    marketId: toMarketId(`0x${"11".repeat(32)}`),
    outcomeIdx: 0,
    stakeBase: "10000000",
    issuedAtMs: 1_788_400_000_000,
  };

  it("verifies against the desk that signed it and nobody else", async () => {
    const signature = await signPrivateClaim(wallet, domain, claim);
    expect(await verifyPrivateClaim(domain, claim, signature, desk.address as Address)).toBe(true);
    expect(await verifyPrivateClaim(domain, claim, signature, privateKeyToAccount(OTHER_KEY).address as Address)).toBe(false);
  });

  it("stops verifying when a field, the contract or the chain changes", async () => {
    const signature = await signPrivateClaim(wallet, domain, claim);
    expect(await verifyPrivateClaim(domain, { ...claim, stakeBase: "10000001" }, signature, desk.address as Address)).toBe(false);
    expect(await verifyPrivateClaim(domain, { ...claim, outcomeIdx: 1 }, signature, desk.address as Address)).toBe(false);
    expect(await verifyPrivateClaim(claimDomain(SOMNIA_SHANNON.id, "0x00000000000000000000000000000000000000d6" as Address), claim, signature, desk.address as Address)).toBe(false);
    expect(await verifyPrivateClaim(claimDomain(1, CONTRACT), claim, signature, desk.address as Address)).toBe(false);
  });
});
