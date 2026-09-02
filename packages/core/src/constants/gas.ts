/** The SDK never estimates gas: every write carries this ceiling at this max fee, and the mempool admits it only when the whole envelope is funded. */
export const SDK_GAS_LIMIT = 10_000_000n;
export const SDK_MAX_FEE_PER_GAS_WEI = 60_000_000_000n;
export const SDK_GAS_ENVELOPE_WEI = SDK_GAS_LIMIT * SDK_MAX_FEE_PER_GAS_WEI;

/** Native balance must cover the envelope times this factor before we let a wallet sign. */
export const GAS_SAFETY_BPS = 12_000;

export type GasLane = "order" | "faucet" | "redeem" | "approve" | "vault" | "vault-order" | "parlay" | "range" | "maker" | "leverage";

/** Gas ceiling per write lane, passed to the SDK per call. measured: pending Story 1.5b — every lane uses the SDK default until real usage is recorded on Shannon. */
export const GAS_CEILING: Record<GasLane, bigint> = {
  order: SDK_GAS_LIMIT,
  faucet: SDK_GAS_LIMIT,
  redeem: SDK_GAS_LIMIT,
  approve: SDK_GAS_LIMIT,
  // Measured on Shannon 2026-09-02 (EventVault 0x84Ec…CD7A): first deposit 688,494; a vault IOC order 2,562,772;
  // faucet 253,138; approve 259,745; a grant ran past 2,000,000. Somnia's schedule runs ~10× the standard EVM.
  vault: 4_000_000n,
  "vault-order": 6_000_000n,
  // Measured on Shannon 2026-09-02 (ParlayReserve 0x50Ce…C151): a two-leg open 3,919,971 (two book walks over
  // 20 contracts each, the module read twice, the ticket written); resolveLeg on a lost leg 125,421; supply
  // 898,941; approve 259,745. A three-leg open adds one more book walk, so the ceiling stays at the vault order's.
  parlay: 6_000_000n,
  // Measured on Shannon 2026-09-02 (RangeReserve 0x1F8d…8386): a first open on a Window 4,527,445 — the two question
  // definitions rebuilt for the hub's key (context/43) on top of the book read; settle 290,312; claim 94,078.
  range: 8_000_000n,
  // Measured on Shannon 2026-09-02 (MarketMakerVault 0xc904…9e79): quote 526,880, pull 325,500, merge 1,018,744;
  // a settle is the cancels plus two redeems. The envelope stays at the range lane's.
  maker: 8_000_000n,
  // Measured on Shannon 2026-09-02 (LeverageReserve 0x5484…2D23): a 2x open on the 15m BTC lane 5,071,986 (the book
  // walk, the module read, one IOC across a live maker's levels, the credit sweep); the keeper's knock-out 1,367,150.
  leverage: 8_000_000n,
};
