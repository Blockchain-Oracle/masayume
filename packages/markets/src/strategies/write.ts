import type { IntentJournal, PhaseListener, TxOutcome } from "@masayume/core/ports";
import { encodeSpec, REGISTRY_NOT_DEPLOYED, type StrategyIntent } from "@masayume/core/strategies";
import { diagnosis, type Address, type Hex } from "@masayume/core/types";
import { formatBaseUnits } from "@masayume/core/units";
import { erc20Abi, keccak256, maxUint256, toBytes, type ContractFunctionArgs, type ContractFunctionName } from "viem";
import { SOMNIA_SHANNON } from "../chain";
import { getCollateral } from "../collateral";
import { strategyRegistryAbi } from "../contracts/strategy-registry.abi";
import { checkGas, gasLimitFor } from "../submitter/gas";
import { awaitReceipt, settleVaultFailure, type Sent, type VaultContracts } from "../vault/write";
import { resolveRegistryDeployment } from "./deployment";

type RegistryFn = ContractFunctionName<typeof strategyRegistryAbi, "nonpayable">;
type Args<F extends RegistryFn> = ContractFunctionArgs<typeof strategyRegistryAbi, "nonpayable", F>;

export interface StrategyTxContext {
  journal: IntentJournal;
  wallet: Address;
  contracts: VaultContracts | undefined;
}

/** `keccak256` over the canonical spec encoding — what the registry pins as `specHash`. */
export function specHashOf(spec: Parameters<typeof encodeSpec>[0]): Hex {
  return keccak256(toBytes(encodeSpec(spec)));
}

function capsTuple(caps: { maxStakePerTradeBase: bigint; maxDailySpendBase: bigint; maxOpenPositions: number; maxPriceRaw: bigint }) {
  return { maxStakePerTrade: caps.maxStakePerTradeBase, maxDailySpend: caps.maxDailySpendBase, maxOpenPositions: caps.maxOpenPositions, maxPriceRaw: caps.maxPriceRaw };
}

/** Simulate first — where viem decodes the registry's custom errors — then sign, then wait. */
export async function writeRegistry<F extends RegistryFn>(contracts: VaultContracts, functionName: F, args: Args<F>, label: string): Promise<Sent> {
  const deployment = resolveRegistryDeployment();
  if (!deployment) throw new Error(REGISTRY_NOT_DEPLOYED);
  const { request } = await contracts.publicClient.simulateContract({
    address: deployment.strategyRegistry,
    abi: strategyRegistryAbi,
    functionName,
    args,
    account: contracts.walletClient.account,
    chain: SOMNIA_SHANNON,
  } as never);
  const hash = await contracts.walletClient.writeContract({ ...(request as object), gas: gasLimitFor("vault") } as never);
  const receipt = await awaitReceipt(contracts.publicClient, hash, label);
  return { hash, receipt };
}

/** The creator's fee is pulled by the registry; its allowance is absorbed into the subscribe (Approvals convention). */
async function ensureFeeAllowance(contracts: VaultContracts, feeBase: bigint): Promise<void> {
  if (feeBase === 0n) return;
  const deployment = resolveRegistryDeployment();
  const owner = contracts.walletClient.account?.address as Address | undefined;
  if (!deployment || !owner) throw new Error(REGISTRY_NOT_DEPLOYED);
  const token = getCollateral().address;
  const allowance = await contracts.publicClient.readContract({ address: token, abi: erc20Abi, functionName: "allowance", args: [owner, deployment.strategyRegistry] });
  if (allowance >= feeBase) return;
  const hash = await contracts.walletClient.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [deployment.strategyRegistry, maxUint256],
    account: contracts.walletClient.account ?? owner,
    chain: SOMNIA_SHANNON,
    gas: gasLimitFor("approve"),
  });
  await awaitReceipt(contracts.publicClient, hash, "approve");
}

export async function sendStrategyIntent(contracts: VaultContracts, intent: StrategyIntent): Promise<Sent> {
  switch (intent.kind) {
    case "strategy-publish":
      return writeRegistry(contracts, "publish", [intent.runner, specHashOf(intent.spec), JSON.stringify(intent.metadata), capsTuple(intent.envelope), intent.feeBase], intent.kind);
    case "strategy-update":
      return writeRegistry(contracts, "update", [intent.strategyId, specHashOf(intent.spec), JSON.stringify(intent.metadata), intent.feeBase], intent.kind);
    case "strategy-subscribe":
      await ensureFeeAllowance(contracts, intent.feeBase);
      return writeRegistry(contracts, "subscribe", [intent.strategyId, intent.grantId], intent.kind);
    case "strategy-unsubscribe":
      return writeRegistry(contracts, "unsubscribe", [intent.strategyId], intent.kind);
    case "strategy-deactivate":
      return writeRegistry(contracts, "deactivate", [intent.strategyId], intent.kind);
  }
}

export function summarizeStrategy(intent: StrategyIntent, decimals: number): string {
  switch (intent.kind) {
    case "strategy-publish":
      return `publish strategy "${intent.metadata.name}" run by ${intent.runner}`;
    case "strategy-update":
      return `update strategy #${intent.strategyId}`;
    case "strategy-subscribe":
      return `subscribe to strategy #${intent.strategyId} with grant #${intent.grantId}${intent.feeBase > 0n ? ` (fee ${formatBaseUnits(intent.feeBase, decimals)})` : ""}`;
    case "strategy-unsubscribe":
      return `unsubscribe from strategy #${intent.strategyId}`;
    case "strategy-deactivate":
      return `deactivate strategy #${intent.strategyId}`;
  }
}

/**
 * The second lane for the registry: journal → gas → (fee allowance) → simulate → send → receipt.
 * Journaled under its own kinds; the intent union in `@masayume/core/ports` grows to include them
 * when the parent wires `StrategyIntent` in — until then the record is cast, never faked.
 */
export async function submitStrategyTx(ctx: StrategyTxContext, intent: StrategyIntent, onPhase?: PhaseListener): Promise<TxOutcome> {
  const { wallet, contracts } = ctx;
  if (!contracts || !resolveRegistryDeployment()) return { status: "refused", diagnosis: diagnosis("not-deployed", REGISTRY_NOT_DEPLOYED) };
  const record = await ctx.journal.record({ kind: intent.kind, wallet, summary: summarizeStrategy(intent, getCollateral().decimals) });
  const gas = await checkGas(wallet, "vault");
  if (!gas.ok) {
    await ctx.journal.markFailed(record.id, gas.diagnosis.technical);
    return { status: "refused", diagnosis: gas.diagnosis };
  }
  onPhase?.("submitted");
  try {
    const { hash } = await sendStrategyIntent(contracts, intent);
    await ctx.journal.markSent(record.id, hash);
    await ctx.journal.markConfirmed(record.id);
    onPhase?.("confirmed", { txHash: hash });
    return { status: "confirmed", txHash: hash };
  } catch (error) {
    return settleVaultFailure(ctx.journal, record.id, error, onPhase);
  }
}
