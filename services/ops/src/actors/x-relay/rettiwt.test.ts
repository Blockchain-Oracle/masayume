import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ configs: [] as { maxRetries: number }[], post: vi.fn(), upload: vi.fn(), search: vi.fn() }));
vi.mock("rettiwt-api", () => ({
  Rettiwt: class {
    tweet = { post: mocks.post, upload: mocks.upload, search: mocks.search };
    constructor(options: { maxRetries: number }) { mocks.configs.push(options); }
  },
}));
import { rettiwtTransport } from "./rettiwt";

describe("X media transport", () => {
  beforeEach(() => { mocks.configs.length = 0; vi.clearAllMocks(); });

  it("uploads image bytes and attaches its id while retaining the reply target", async () => {
    mocks.upload.mockResolvedValue("456");
    mocks.post.mockResolvedValue("789");
    const transport = rettiwtTransport("fixture-key", "@masayume_app");
    const media = await transport.uploadImage!(new Uint8Array([1, 2, 3]));
    await expect(transport.reply!("123", "Order filled\nSpent 3 tUSDC.", media)).resolves.toBe("789");
    expect(mocks.upload.mock.calls[0]![0]).toBeInstanceOf(ArrayBuffer);
    expect(mocks.post).toHaveBeenCalledWith({ text: "Order filled\nSpent 3 tUSDC.", replyTo: "123", media: [{ id: "456" }] });
    expect(mocks.configs.map(c => c.maxRetries)).toEqual([2, 0]);
  });

  it("keeps text-only replies free of media fields", async () => {
    mocks.post.mockResolvedValue("789");
    await rettiwtTransport("fixture-key", "masayume_app").reply!("123", "Status needs checking");
    expect(mocks.post).toHaveBeenCalledWith({ text: "Status needs checking", replyTo: "123" });
  });

  it.each(["a".repeat(281), "Unbudgeted emoji 🚀"])("rejects text outside the formatter contract", async text => {
    await expect(rettiwtTransport("fixture-key", "masayume_app").reply!("123", text)).rejects.toThrow("ASCII budget");
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("does not turn a missing media id into an attached image", async () => {
    mocks.upload.mockResolvedValue("");
    await expect(rettiwtTransport("fixture-key", "masayume_app").uploadImage!(new Uint8Array([1]))).rejects.toThrow("media id");
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
