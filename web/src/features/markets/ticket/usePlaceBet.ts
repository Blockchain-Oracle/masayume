"use client";

import type { OrderOutcome, OrderRequest, WritePhase } from "@masayume/core/ports";
import type { Hex, Quote } from "@masayume/core/types";
import { formatBaseUnits } from "@masayume/core/units";
import { invalidateAfterWrite, useSigner, useSubmitter } from "@masayume/markets/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { TICKET } from "@/lib/copy";
import { notify } from "@/lib/toast";
import { SIDE_WORD } from "../side-styles";

export interface PlaceBetState {
  phase: WritePhase;
  outcome: OrderOutcome | null;
  txHash: Hex | null;
}

const IDLE: PlaceBetState = { phase: "composing", outcome: null, txHash: null };

function phaseOf(outcome: OrderOutcome): WritePhase {
  switch (outcome.status) {
    case "confirmed":
    case "nothingFilled":
      return "confirmed";
    case "reverted":
      return "reverted";
    case "unknown":
      return "unknown";
    default:
      return "composing";
  }
}

function txHashOf(outcome: OrderOutcome): Hex | null {
  if (outcome.status === "confirmed") return outcome.booked.txHash;
  if ("txHash" in outcome) return outcome.txHash ?? null;
  return null;
}

/** The write-path state machine for one bet; a second tap while one is in flight is absorbed, never doubled. */
export function usePlaceBet() {
  const submitter = useSubmitter();
  const queryClient = useQueryClient();
  const { address } = useSigner();
  const [state, setState] = useState<PlaceBetState>(IDLE);
  const inFlight = useRef(false);

  const place = useCallback(
    async (request: Omit<OrderRequest, "wallet">) => {
      if (inFlight.current || !address) return;
      inFlight.current = true;
      setState({ phase: "submitted", outcome: null, txHash: null });
      try {
        const outcome = await submitter.submitOrder({ ...request, wallet: address }, (phase, detail) =>
          setState((s) => ({ ...s, phase, txHash: detail?.txHash ?? s.txHash })),
        );
        if (outcome.status === "confirmed" || outcome.status === "nothingFilled") {
          await invalidateAfterWrite(queryClient, { wallet: address, marketId: request.market.marketId });
        }
        setState({ phase: phaseOf(outcome), outcome, txHash: txHashOf(outcome) });
        if (outcome.status === "confirmed") {
          const { booked } = outcome;
          notify.neutral(TICKET.booked(formatBaseUnits(booked.contractsRaw, request.market.decimals, { minDp: 0 }), SIDE_WORD[booked.side], booked.avgPriceBps));
        }
      } finally {
        inFlight.current = false;
      }
    },
    [address, queryClient, submitter],
  );

  const reset = useCallback(() => setState(IDLE), []);
  const requoted: Quote | null = state.outcome?.status === "requote" ? state.outcome.quote : null;

  return { state, place, reset, requoted, placing: state.phase === "submitted" };
}
