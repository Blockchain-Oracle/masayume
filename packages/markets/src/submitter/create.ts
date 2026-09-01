import type { GasLane } from "@masayume/core/constants";
import type { AttributionHook, IntentJournal, StopGate, Submitter } from "@masayume/core/ports";
import { diagnosis } from "@masayume/core/types";
import { signerAddress } from "../exchange";
import { nowMs as chainNowMs } from "../provider/clock";
import { noopAttribution } from "./attribution";
import { checkGas, requiredGasWei, type GasCheck } from "./gas";
import { createMemoryJournal } from "./journal-memory";
import { allowAllStopGate } from "./stop-gate";
import { submitTx } from "./tx-lane";

export interface SubmitterDeps {
  stopGate?: StopGate;
  journal?: IntentJournal;
  attribution?: AttributionHook;
  nowMs?: () => number;
}

/** The core Submitter plus the pre-send checks a surface needs before it opens a wallet popup. */
export interface MarketsSubmitter extends Submitter {
  readonly journal: IntentJournal;
  readonly stopGate: StopGate;
  readonly attribution: AttributionHook;
  checkGas(lane: GasLane): Promise<GasCheck>;
}

export function createSubmitter(deps: SubmitterDeps = {}): MarketsSubmitter {
  const nowMs = deps.nowMs ?? chainNowMs;
  const journal = deps.journal ?? createMemoryJournal(nowMs);
  const stopGate = deps.stopGate ?? allowAllStopGate;
  const attribution = deps.attribution ?? noopAttribution;

  return {
    journal,
    stopGate,
    attribution,
    hasSigner: () => signerAddress() !== undefined,
    submitTx: (intent, onPhase) => submitTx({ journal }, intent, onPhase),
    async submitOrder() {
      throw new Error("submitOrder lands in Story 1.8 (the order lane)");
    },
    async checkGas(lane) {
      const wallet = signerAddress();
      if (wallet) return checkGas(wallet, lane);
      return {
        ok: false,
        lane,
        balanceWei: null,
        requiredWei: requiredGasWei(lane),
        diagnosis: diagnosis("signer-required", "connect a wallet before checking gas"),
      };
    },
  };
}
