import { BPS_DENOMINATOR } from "../constants/sizing";
import { mulBps } from "../units/money";

/** A winning contract redeems for one collateral unit less the settlement fee; a void pays both sides half (canon #11). */
export function estPayoutBase(amountRaw: bigint, kind: "win" | "void", feeBps: number): bigint {
  const gross = kind === "void" ? amountRaw / 2n : amountRaw;
  return mulBps(gross, BPS_DENOMINATOR - feeBps);
}
