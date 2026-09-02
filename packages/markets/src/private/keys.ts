import type { Bytes32, Hex } from "@masayume/core/types";
import { concatHex, keccak256, stringToHex } from "viem";

/** The three keys one private bet uses on chain, derived from one secret the owner and the desk alone hold. */
export interface SlotKeys {
  /** The slot's id — on every SLOT-side call, never beside the owner. */
  slotId: Bytes32;
  /** On the charge, beside the owner — never beside the slot. */
  chargeKey: Bytes32;
  /** On the credit, beside the owner — carried in the claim so the desk can find it without the secret. */
  creditKey: Bytes32;
}

/**
 * The secret is the owner's own authorisation signature: it never touches the chain, so the three hashes
 * cannot be joined without it — and a desk that lost its way mid-open re-derives them from the same
 * signature and reads what already landed off the contract. No record, no owner on any slot.
 */
export function deriveSlotKeys(authSignature: Hex): SlotKeys {
  const seed = keccak256(authSignature);
  const derive = (label: string) => keccak256(concatHex([seed, stringToHex(label)])) as Bytes32;
  return { slotId: derive("slot"), chargeKey: derive("charge"), creditKey: derive("credit") };
}
