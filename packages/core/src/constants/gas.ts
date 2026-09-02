/** The SDK never estimates gas: every write carries this ceiling at this max fee, and the mempool admits it only when the whole envelope is funded. */
export const SDK_GAS_LIMIT = 10_000_000n;
export const SDK_MAX_FEE_PER_GAS_WEI = 60_000_000_000n;
export const SDK_GAS_ENVELOPE_WEI = SDK_GAS_LIMIT * SDK_MAX_FEE_PER_GAS_WEI;

/** Native balance must cover the envelope times this factor before we let a wallet sign. */
export const GAS_SAFETY_BPS = 12_000;

export type GasLane = "order" | "faucet" | "redeem" | "approve" | "vault" | "vault-order";

/** Gas ceiling per write lane, passed to the SDK per call. measured: pending Story 1.5b — every lane uses the SDK default until real usage is recorded on Shannon. */
export const GAS_CEILING: Record<GasLane, bigint> = {
  order: SDK_GAS_LIMIT,
  faucet: SDK_GAS_LIMIT,
  redeem: SDK_GAS_LIMIT,
  approve: SDK_GAS_LIMIT,
  // measured: pending — EventVault writes carry the SDK ceiling until Shannon usage is recorded.
  vault: SDK_GAS_LIMIT,
  "vault-order": SDK_GAS_LIMIT,
};
