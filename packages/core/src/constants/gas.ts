/** The SDK never estimates gas: every write carries this ceiling at this max fee, and the mempool admits it only when the whole envelope is funded. */
export const SDK_GAS_LIMIT = 10_000_000n;
export const SDK_MAX_FEE_PER_GAS_WEI = 60_000_000_000n;
export const SDK_GAS_ENVELOPE_WEI = SDK_GAS_LIMIT * SDK_MAX_FEE_PER_GAS_WEI;

/** Native balance must cover the envelope times this factor before we let a wallet sign. */
export const GAS_SAFETY_BPS = 12_000;
