import { describe, expect, it } from "vitest";
import sharp from "sharp";
import type { XReceiptStatus } from "@masayume/core/x";
import { renderReplyCardPng, renderReplyCardSvg } from "./reply-card";

describe("receipt reply artwork", () => {
  it("escapes supplied copy and removes layout/control characters", () => {
    const svg = renderReplyCardSvg({ status: "refused", detail: '<script>alert("x")</script> & <image href="https://bad.test"/>\u0001\u202E', context: 'BTC\nUP & "test"' });
    expect(svg).not.toContain("<script>");
    expect(svg).not.toContain("<image ");
    expect(svg).not.toContain("\u0001");
    expect(svg).not.toContain("\u202E");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("BTC UP &amp; &quot;test&quot;");
  });

  it("does not invent missing market, amount or transaction information", () => {
    const svg = renderReplyCardSvg({ status: "submitted" });
    expect(svg).toContain("Instruction received");
    expect(svg).toContain("Open the receipt for details.");
    expect(svg).toContain("Somnia Shannon testnet");
    expect(svg).not.toMatch(/\bBTC\b|\btUSDC\b|0x[\da-f]+|paid out|profit|win/i);
  });

  it.each<XReceiptStatus>(["submitted", "unknown", "refused", "reverted", "nothing-filled"])("never renders a success headline or check for %s", (status) => {
    const svg = renderReplyCardSvg({ status, title: "Order filled", footer: "You won and were paid out!" });
    expect(svg).not.toContain("Order filled");
    expect(svg).not.toContain("You won");
    expect(svg).not.toContain('data-symbol="filled"');
    expect(svg).toContain(`data-status="${status}"`);
  });

  it("keeps a fill separate from a settled market result", () => {
    const svg = renderReplyCardSvg({ status: "filled", title: "You won", footer: "Payout received" });
    expect(svg).toContain("Order filled");
    expect(svg).toContain("The market result comes later.");
    expect(svg).not.toContain("You won");
    expect(svg).not.toContain("Payout received");
  });

  it("does not mislabel an unknown outcome as awaiting chain confirmation", () => {
    expect(renderReplyCardSvg({ status: "unknown" })).toContain("Status needs checking");
    const unknown = renderReplyCardSvg({ status: "unknown", title: "Confirmation pending", footer: "Check this transaction before trying again." });
    expect(unknown).toContain("Status needs checking");
    expect(unknown).toContain("Check this transaction before trying again.");
    expect(unknown).not.toContain("Confirmation pending");
    const invalid = renderReplyCardSvg({ status: "bad-status" as XReceiptStatus });
    expect(invalid).toContain('data-status="unknown"');
  });

  it("bounds long tokens and keeps demo fixtures visibly distinguishable", () => {
    const svg = renderReplyCardSvg({ status: "filled", detail: "W".repeat(20_000), context: "X".repeat(20_000) }, { demo: true });
    expect(svg).toContain("DEMO · NOT A REAL TRADE");
    expect(svg).toContain("…");
    expect(svg.length).toBeLessThan(200_000);
    expect(svg).not.toContain("W".repeat(200));
    expect(svg).not.toMatch(/<text\b|font-family|<image\b/);
  });

  it("exports a repeatable 1200×600 PNG under the image upload limit", async () => {
    const model = { status: "filled" as const, context: "BTC · UP · Testnet", detail: "Requested stake: 5 tUSDC. Booked amount is unavailable." };
    const first = await renderReplyCardPng(model, { demo: true });
    const second = await renderReplyCardPng(model, { demo: true });
    expect(first.equals(second)).toBe(true);
    expect(first.length).toBeLessThan(5_000_000);
    expect(await sharp(first).metadata()).toMatchObject({ format: "png", width: 1200, height: 600 });
  });
});
