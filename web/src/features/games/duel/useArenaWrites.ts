"use client";

import {
  PICK_ATTEMPT_GUARD_SEC,
  PICK_ATTEMPT_MAX,
  pickFloorRaw,
  stakeTierIndex,
  type ArenaIntent,
  type Pick,
  type StakeTierId,
} from "@masayume/core/games";
import { isOk } from "@masayume/core/schemas";
import { diagnosis, type Address, type Bytes32, type MarketId } from "@masayume/core/types";
import { quoteArenaPick, submitArenaPick, type ArenaPickOutcome } from "@masayume/markets/games";
import { invalidateAfterWrite, useSubmitter } from "@masayume/markets/react";
import { getClient } from "@masayume/markets/runtime";
import { resolveVaultDeployment, type VaultContracts } from "@masayume/markets/vault";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { PublicClient } from "viem";
import { webEnv } from "@/lib/env";
import { useWalletSession } from "@/lib/wallet-session";
import { useOwnerWalletClient } from "@/providers/UserSessionProvider";

/**
 * Every transaction a duel asks of a player: opening the match, joining it, and each pick.
 *
 * **A pick retries, and that is not defensive padding.** On a binary pool, buying UP and buying DOWN
 * draw on the same resting liquidity, so two seats swiping the same card in the same second contend
 * — the loser's fill comes back under the floor it was quoted against and the arena refuses it, as it
 * should. That is the normal case in a live duel, and it is what cost the first drive its eighth pick
 * (`context/54` §3). The stake never changes on a retry, only the floor loosens, because the arena
 * refunds whatever the walk does not spend.
 *
 * **Nothing here quotes a size the chain did not.** Every attempt re-reads `sizeForStake` immediately
 * before it sends, so a floor is always a fraction of a live quote rather than of a stale one.
 */

export type ArenaBusy = "create" | "join" | `pick:${number}` | null;

export interface PickProgress {
  cardIndex: number;
  attempt: number;
  /** The last refusal, when there was one. A lost race is reported as a retry, never as a failure. */
  why?: string;
}

export function useArenaWrites() {
  const submitter = useSubmitter();
  const walletClient = useOwnerWalletClient();
  const { address } = useWalletSession();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<ArenaBusy>(null);
  const [progress, setProgress] = useState<PickProgress | null>(null);

  const contracts = useCallback((): VaultContracts | null => {
    if (!walletClient) return null;
    return { walletClient, publicClient: getClient().getViemClient() as PublicClient, deployment: resolveVaultDeployment(webEnv.markets) };
  }, [walletClient]);

  const refresh = useCallback(async () => {
    if (address) await invalidateAfterWrite(queryClient, { wallet: address });
  }, [address, queryClient]);

  const send = useCallback(
    async (intent: ArenaIntent, key: Exclude<ArenaBusy, null>) => {
      if (!submitter || !address) return null;
      setBusy(key);
      try {
        return await submitter.submitTx(intent);
      } finally {
        setBusy(null);
        await refresh();
      }
    },
    [submitter, address, refresh],
  );

  /** The creator's transaction: the pot goes in and the sealed deck's hash goes on chain with it. */
  const create = useCallback(
    (input: { matchId: Bytes32; challenger: Address; tier: StakeTierId; deckHash: Bytes32; deckSize: number; policyVersion: number; potBase: bigint }) =>
      send(
        {
          kind: "arena-create",
          matchId: input.matchId,
          challenger: input.challenger,
          tier: stakeTierIndex(input.tier),
          deckHash: input.deckHash,
          deckSize: input.deckSize,
          policyVersion: input.policyVersion,
          potBase: input.potBase,
        },
        "create",
      ),
    [send],
  );

  const join = useCallback(
    (matchId: Bytes32, potBase: bigint) => send({ kind: "arena-join", matchId, potBase }, "join"),
    [send],
  );

  /**
   * One card, one side, retried while the deadline allows.
   *
   * The deadline guard stops attempts a few seconds early rather than at the line: a send already in
   * flight still has to be mined, and a pick that lands after the lock is gas spent on a revert.
   */
  const pick = useCallback(
    async (input: { matchId: Bytes32; cardIndex: number; marketId: MarketId; side: Pick; stakeBase: bigint; deadlineSec: number }): Promise<ArenaPickOutcome> => {
      const c = contracts();
      if (!submitter || !address || !c) {
        return { status: "refused", diagnosis: diagnosis("signer-required", "this browser has no signing session bound") };
      }

      const ctx = { journal: submitter.journal, wallet: address, contracts: c };
      setBusy(`pick:${input.cardIndex}`);
      let last: ArenaPickOutcome = { status: "refused", diagnosis: diagnosis("order-expired", "the pick deadline passed before a fill landed") };

      try {
        for (let attempt = 1; attempt <= PICK_ATTEMPT_MAX; attempt += 1) {
          if (Math.floor(Date.now() / 1_000) >= input.deadlineSec - PICK_ATTEMPT_GUARD_SEC) break;
          setProgress({ cardIndex: input.cardIndex, attempt, why: attempt > 1 ? last.status : undefined });

          const quote = await quoteArenaPick(input.marketId, input.side, input.stakeBase);
          if (!isOk(quote) || !quote.value) continue;

          last = await submitArenaPick(ctx, {
            kind: "arena-pick",
            matchId: input.matchId,
            cardIndex: input.cardIndex,
            pick: input.side,
            stakeBase: input.stakeBase,
            minQuantityRaw: pickFloorRaw(quote.value.quantityRaw, attempt),
          });
          if (last.status === "confirmed" || last.status === "unknown") return last;
        }
        return last;
      } finally {
        setBusy(null);
        setProgress(null);
        await refresh();
      }
    },
    [submitter, address, contracts, refresh],
  );

  return { create, join, pick, busy, progress, canSign: Boolean(submitter && walletClient) };
}
