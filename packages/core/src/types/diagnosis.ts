import { z } from "zod";
import { hexSchema } from "./primitives";

export const DIAGNOSIS_KINDS = [
  "signer-required",
  "wrong-chain",
  "user-rejected",
  "out-of-gas",
  "insufficient-collateral",
  "insufficient-allowance",
  "market-not-trading",
  "order-expired",
  "post-only-would-cross",
  "no-liquidity",
  "below-min-quantity",
  "invalid-price",
  "not-settled",
  "already-claimed",
  "faucet-refused",
  "indexer-down",
  "rpc-down",
  "contract-revert",
  "send-unknown",
  "unknown",
] as const;

export type DiagnosisKind = (typeof DIAGNOSIS_KINDS)[number];

export const diagnosisSchema = z.object({
  kind: z.enum(DIAGNOSIS_KINDS),
  retryable: z.boolean(),
  technical: z.string(),
  errorName: z.string().optional(),
  txHash: hexSchema.optional(),
});

export type Diagnosis = z.infer<typeof diagnosisSchema>;

const RETRYABLE_KINDS: ReadonlySet<DiagnosisKind> = new Set<DiagnosisKind>([
  "indexer-down",
  "rpc-down",
  "send-unknown",
  "user-rejected",
  "post-only-would-cross",
  "unknown",
]);

export function diagnosis(
  kind: DiagnosisKind,
  technical: string,
  extra: Pick<Diagnosis, "errorName" | "txHash"> = {},
): Diagnosis {
  return { kind, retryable: RETRYABLE_KINDS.has(kind), technical, ...extra };
}
