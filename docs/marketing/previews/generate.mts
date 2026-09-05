/** Local review fixtures only. This imports no actor startup or delivery code. */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createReplyPresentation } from "../../../services/ops/src/actors/x-relay/reply-format.ts";
import { renderReplyCardPng } from "../../../services/ops/src/actors/x-relay/reply-card.ts";

const output = dirname(fileURLToPath(import.meta.url));
// A valid-format synthetic hash exercises the formatter's confirmed-status gate.
// It is not evidence of a transaction and is never printed or linked by the card.
const syntheticHash = `0x${"1".repeat(64)}`;
const base = {
  mentionId: "DEMO", authorId: "DEMO", handle: null, wallet: null, grantId: null, marketId: null,
  side: "up" as const, stakeBase: "5000000", reason: null, txHash: null,
  instruction: "DEMO FIXTURE ONLY", atMs: 0, asset: "BTC", intervalSec: 300,
  expirySec: Math.floor(Date.parse("2026-09-05T12:00:00Z") / 1000),
};

await mkdir(output, { recursive: true });
for (const status of ["filled", "submitted", "unknown", "refused", "reverted", "nothing-filled"] as const) {
  const receipt: Parameters<typeof createReplyPresentation>[0] = {
    ...base, status,
    txHash: ["filled", "reverted", "nothing-filled"].includes(status) ? syntheticHash : null,
    ...(status === "filled" ? { bookedCostBase: "4950000" } : {}),
    ...(status === "refused" ? { refusalCode: "grant-missing" as const } : {}),
  };
  const presentation = createReplyPresentation(receipt, 6);
  await writeFile(join(output, `reply-${status}-demo.png`), await renderReplyCardPng(presentation, { demo: true }));
}
