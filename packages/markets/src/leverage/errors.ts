import type { Diagnosis, DiagnosisKind } from "@masayume/core/types";
import { diagnoseNamedRevert } from "../vault/errors";

/** The reserve's own reverts (`ILeverageReserve` errors), mapped into the one diagnosis vocabulary (AD-13). */
const LEVERAGE_REVERT_KINDS: Record<string, DiagnosisKind> = {
  NotAdmin: "contract-revert",
  ZeroAddress: "contract-revert",
  ZeroAmount: "below-min-quantity",
  BadParams: "contract-revert",
  IsPaused: "contract-revert",
  UnknownMarket: "market-not-trading",
  WrongCollateral: "contract-revert",
  BadOutcome: "contract-revert",
  MarketNotTrading: "market-not-trading",
  TooLate: "market-not-trading",
  BadLeverage: "outside-band",
  ThinBook: "no-liquidity",
  OutsideBand: "outside-band",
  BelowMinQuantity: "below-min-quantity",
  StakeAboveMax: "requote",
  Underpriced: "outside-band",
  OverPositionCap: "no-liquidity",
  OverWindowCap: "no-liquidity",
  OverExposure: "no-liquidity",
  TooManyOpen: "no-liquidity",
  InsufficientLiquidity: "no-liquidity",
  InsufficientShares: "insufficient-collateral",
  NothingFilled: "no-liquidity",
  NoSuchPosition: "contract-revert",
  NotOwner: "contract-revert",
  NotLive: "already-claimed",
  StillHealthy: "contract-revert",
  Slippage: "requote",
  MarketNotSettled: "not-settled",
  UnsettledPosition: "not-settled",
  ImmediateOrCancelNoFill: "no-liquidity",
  ERC20InsufficientAllowance: "insufficient-allowance",
  ERC20InsufficientBalance: "insufficient-collateral",
};

export function diagnoseLeverage(error: unknown): Diagnosis {
  return diagnoseNamedRevert(error, LEVERAGE_REVERT_KINDS);
}
