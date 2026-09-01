"use client";

import { FAUCET_UNITS } from "@masayume/core/constants";
import type { WritePhase } from "@masayume/core/ports";
import type { Diagnosis, Hex } from "@masayume/core/types";
import { oneUnit } from "@masayume/core/units";
import { collateralOrNull } from "@masayume/markets";
import { invalidateAfterWrite, useSigner, useSubmitter } from "@masayume/markets/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { FAUCET } from "@/lib/copy";
import { notify } from "@/lib/toast";

export interface FaucetState {
  phase: WritePhase;
  diagnosis: Diagnosis | null;
  txHash: Hex | null;
  gasShort: boolean;
  checkingGas: boolean;
}

const IDLE: FaucetState = { phase: "composing", diagnosis: null, txHash: null, gasShort: false, checkingGas: false };

export function useFaucet() {
  const submitter = useSubmitter();
  const { address, hasSigner } = useSigner();
  const queryClient = useQueryClient();
  const [state, setState] = useState<FaucetState>(IDLE);

  const recheckGas = useCallback(async (): Promise<boolean> => {
    if (!submitter) return false;
    setState((s) => ({ ...s, checkingGas: true }));
    const gas = await submitter.checkGas("faucet");
    setState((s) => ({
      ...s,
      checkingGas: false,
      diagnosis: gas.ok ? null : gas.diagnosis,
      gasShort: !gas.ok && gas.diagnosis.kind === "out-of-gas",
    }));
    return gas.ok;
  }, [submitter]);

  const mint = useCallback(async () => {
    const collateral = collateralOrNull();
    if (!submitter || !address || !collateral) return;
    // Gas is checked before any popup so an empty STT tank routes to the faucets instead of a raw revert (FR-2).
    if (!(await recheckGas())) return;

    const outcome = await submitter.submitTx(
      { kind: "faucet", amountBase: FAUCET_UNITS * oneUnit(collateral.decimals) },
      (phase, detail) => setState((s) => ({ ...s, phase, txHash: detail?.txHash ?? s.txHash })),
    );

    if (outcome.status === "confirmed") {
      await invalidateAfterWrite(queryClient, { wallet: address });
      setState({ ...IDLE, phase: "confirmed", txHash: outcome.txHash });
      notify.neutral(FAUCET.minted);
      return;
    }
    setState({
      ...IDLE,
      phase: outcome.status === "unknown" ? "unknown" : "composing",
      diagnosis: outcome.diagnosis,
      txHash: "txHash" in outcome ? (outcome.txHash ?? null) : null,
      gasShort: outcome.diagnosis.kind === "out-of-gas",
    });
  }, [address, queryClient, recheckGas, submitter]);

  return { state, mint, recheckGas, hasSigner };
}
