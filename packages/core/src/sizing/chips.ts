import { CHIP_FRACTIONS } from "../constants/sizing";
import { oneUnit } from "../units/decimals";
import { floorToLot, fractionOf } from "../units/money";
import { minStakeBase } from "./min-stake";

export interface QuickChip {
  label: string;
  stakeBase: bigint;
  enabled: boolean;
}

const CENTS_PER_UNIT = 100n;

/** Quick-amount chips scale to the actual spendable balance, floored to whole cents; a chip below the floor is disabled, never dead (FR-8). */
export function quickChips(spendableBase: bigint, decimals: number): QuickChip[] {
  const cent = oneUnit(decimals) / CENTS_PER_UNIT;
  const floor = minStakeBase(decimals);
  return CHIP_FRACTIONS.map(({ label, numerator, denominator }) => {
    const stakeBase = floorToLot(fractionOf(spendableBase, numerator, denominator), cent);
    return { label, stakeBase, enabled: stakeBase >= floor };
  });
}
