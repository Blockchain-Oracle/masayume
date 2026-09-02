import { formatCadence } from "@masayume/core/copy";
import type { Address, Hex } from "@masayume/core/types";
import { formatUtc, secToMs } from "@masayume/core/units";
import { addressUrl, txUrl } from "@masayume/core/urls";
import { PINNED_TESTNET } from "@masayume/markets";

/**
 * The proofs on `/demo` — real transactions and real contracts, nothing else.
 *
 * The fills below were read from the venue's indexer through the fill projection
 * (`listWalletHistory`) on `PROOFS_READ_ON`, for a public wallet that trades this
 * venue. They are its own settled Windows, wins and losses alike: a proof list that
 * showed only wins would be a claim, not a proof. The demo wallet this repo carries
 * (`0xd357…9358`) had no fills on that date, so it is not the source.
 *
 * The contract addresses come from the pinned file the whole app is verified
 * against — never retyped here, so a drift check catches a stale demo too.
 */
export const PROOF_WALLET = "0xe11825b13c96ccbe49cff978932375ce13daaeb4" as Address;
export const PROOFS_READ_ON = "2026-09-02";

export interface TxProof {
  hash: Hex;
  asset: string;
  intervalSec: number;
  expirySec: number;
  outcome: "win" | "loss";
  /** The wallet sold beyond its inventory and was handed the other side — booked as a short. */
  short?: boolean;
}

export const TX_PROOFS: readonly TxProof[] = [
  { hash: "0x93bff06526a7c765a1b8401439ed70c3a82c585bcc9a71fc44379c295529351d", asset: "BTC", intervalSec: 300, expirySec: 1788262200, outcome: "win" },
  { hash: "0xd4fd5efdb8a66ffbdf07838488c82a8288274439ed3e74a8d146cb88de959066", asset: "BTC", intervalSec: 300, expirySec: 1788274500, outcome: "loss" },
  { hash: "0x83a8b018a7d39f7c68b833c963bccf39e1c83fe83b9796f7d6277020f792dc87", asset: "ETH", intervalSec: 900, expirySec: 1788259500, outcome: "loss", short: true },
  { hash: "0xa5bf44b69a748b1e8dd71ae36ec960036bc3513ed4815607aeb6ad101c4033ce", asset: "BTC", intervalSec: 86400, expirySec: 1788307200, outcome: "loss" },
  { hash: "0x004a661b5049c0285c950713661431dcf2c53990a42132e83c7335bdf09da656", asset: "ETH", intervalSec: 86400, expirySec: 1788307200, outcome: "loss" },
  { hash: "0x896b9b23ad44d9f7bab01f83e68f29fbf5308ba5ddc67a98a597318628df014f", asset: "BTC", intervalSec: 60, expirySec: 1788259200, outcome: "loss", short: true },
];

const OUTCOME_WORD = { win: "settled won", loss: "settled lost" } as const;

/** "BTC · 5m Window · settled won · closed 2026-09-01 11:30 UTC" — from the round's own fields. */
export function txProofLabel(proof: TxProof): string {
  const parts = [proof.asset, `${formatCadence(proof.intervalSec)} Window`, OUTCOME_WORD[proof.outcome]];
  if (proof.short) parts.push("sold short");
  parts.push(`closed ${formatUtc(secToMs(proof.expirySec), { withSeconds: false, withDate: true })}`);
  return parts.join(" · ");
}

export function txProofHref(proof: TxProof): string {
  return txUrl(proof.hash);
}

export type ContractKey = "marketsCore" | "binaryModule" | "binarySettlement" | "oracleHub";

export interface ContractProof {
  key: ContractKey;
  label: string;
  address: Address;
}

const CONTRACT_LABELS: Record<ContractKey, string> = {
  marketsCore: "Markets core (the CLOB)",
  binaryModule: "Binary module (the Windows)",
  binarySettlement: "Binary settlement (payouts)",
  oracleHub: "Oracle hub (the prints)",
};

export const CONTRACT_PROOFS: readonly ContractProof[] = (Object.keys(CONTRACT_LABELS) as ContractKey[]).map((key) => ({
  key,
  label: CONTRACT_LABELS[key],
  address: PINNED_TESTNET.addresses[key] as Address,
}));

export function contractProofHref(proof: ContractProof): string {
  return addressUrl(proof.address);
}

export function contractProof(key: ContractKey): ContractProof {
  return CONTRACT_PROOFS.find((proof) => proof.key === key)!;
}
