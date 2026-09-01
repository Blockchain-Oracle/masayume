export function oneUnit(decimals: number): bigint {
  return 10n ** BigInt(decimals);
}
