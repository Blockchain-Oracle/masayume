import type { Address } from "@masayume/core/types";
import { addressUrl } from "@masayume/core/urls";
import { PINNED_TESTNET } from "@masayume/markets";

/**
 * The verify table — `packages/markets/src/addresses.pinned.json`, the addresses this app was
 * verified against and that the `address-drift` invariant checks against the installed SDK on
 * every run. Read through the pin, never retyped, so the docs cannot drift from the code.
 */
export interface ContractRow {
  label: string;
  address: Address;
  href: string;
}

type PinnedKey = keyof typeof PINNED_TESTNET.addresses;

const LABELS: ReadonlyArray<readonly [PinnedKey, string]> = [
  ["marketsCore", "MarketsCore"],
  ["binaryModule", "BinaryModule (Event Contracts)"],
  ["binarySettlement", "BinarySettlement"],
  ["oracleHub", "OracleHub"],
  ["collateral", "tUSDC (collateral)"],
  ["collateralRouter", "CollateralRouter (complete sets)"],
  ["clobFactory", "CLOB factory"],
  ["marketCreator", "MarketCreator"],
];

export const CONTRACTS: ContractRow[] = LABELS.map(([key, label]) => {
  const address = PINNED_TESTNET.addresses[key] as Address;
  return { label, address, href: addressUrl(address) };
});

export const SDK_VERSION: string = PINNED_TESTNET.sdkVersion;
export const CHAIN_ID: number = PINNED_TESTNET.chainId;
