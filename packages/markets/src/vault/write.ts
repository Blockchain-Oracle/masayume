import type { IntentJournal, PhaseListener, TxOutcome, VaultIntent } from "@masayume/core/ports";
import { diagnosis, type Address, type Diagnosis, type Hex } from "@masayume/core/types";
import { GRANT_KIND_INDEX, VAULT_NOT_DEPLOYED, type VaultDeployment } from "@masayume/core/vault";
import { formatBaseUnits } from "@masayume/core/units";
import { erc20Abi, maxUint256, type ContractFunctionArgs, type ContractFunctionName, type PublicClient, type TransactionReceipt, type WalletClient } from "viem";
import { SOMNIA_SHANNON } from "../chain";
import { getCollateral } from "../collateral";
import { eventVaultAbi } from "../contracts/event-vault.abi";
import { isTimeoutError } from "../submitter/failure";
import { checkGas, gasLimitFor } from "../submitter/gas";
import { TxRevertedError } from "../submitter/steps/assert-tx-ok";
import { diagnoseVault } from "./errors";

/** The session's own viem clients for Masayume's contracts — bound once, beside the SDK trader. */
export interface VaultContracts {
  walletClient: WalletClient;
  publicClient: PublicClient;
  deployment: VaultDeployment | null;
}

export interface VaultTxContext {
  journal: IntentJournal;
  wallet: Address;
  contracts: VaultContracts | undefined;
}

const RECEIPT_TIMEOUT_MS = 90_000;
type VaultFn = ContractFunctionName<typeof eventVaultAbi, "nonpayable">;
type Args<F extends VaultFn> = ContractFunctionArgs<typeof eventVaultAbi, "nonpayable", F>;

export interface Sent {
  hash: Hex;
  receipt: TransactionReceipt;
}

function account(contracts: VaultContracts): Address {
  const acct = contracts.walletClient.account;
  if (!acct) throw new Error("the session's wallet client has no account bound");
  return acct.address as Address;
}

/** Simulate first — that is where viem decodes the vault's custom errors — then sign, then wait for the receipt. */
export async function writeVault<F extends VaultFn>(contracts: VaultContracts, functionName: F, args: Args<F>, label: string): Promise<Sent> {
  const deployment = contracts.deployment;
  if (!deployment) throw new Error(VAULT_NOT_DEPLOYED);
  const { request } = await contracts.publicClient.simulateContract({
    address: deployment.eventVault,
    abi: eventVaultAbi,
    functionName,
    args,
    account: contracts.walletClient.account,
    chain: SOMNIA_SHANNON,
  } as never);
  const hash = await contracts.walletClient.writeContract({ ...(request as object), gas: gasLimitFor("vault") } as never);
  const receipt = await contracts.publicClient.waitForTransactionReceipt({ hash, timeout: RECEIPT_TIMEOUT_MS });
  if (receipt.status !== "success") throw new TxRevertedError(label, hash);
  return { hash, receipt };
}

/** The vault's first ERC-20 allowance is absorbed into the deposit that needs it (Approvals convention). */
export async function ensureVaultAllowance(contracts: VaultContracts, amountBase: bigint): Promise<Hex | null> {
  const deployment = contracts.deployment;
  if (!deployment) throw new Error(VAULT_NOT_DEPLOYED);
  const owner = account(contracts);
  const token = getCollateral().address;
  const allowance = await contracts.publicClient.readContract({ address: token, abi: erc20Abi, functionName: "allowance", args: [owner, deployment.eventVault] });
  if (allowance >= amountBase) return null;
  const hash = await contracts.walletClient.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [deployment.eventVault, maxUint256],
    account: contracts.walletClient.account ?? owner,
    chain: SOMNIA_SHANNON,
    gas: gasLimitFor("approve"),
  });
  const receipt = await contracts.publicClient.waitForTransactionReceipt({ hash, timeout: RECEIPT_TIMEOUT_MS });
  if (receipt.status !== "success") throw new TxRevertedError("approve", hash);
  return hash;
}

function capsTuple(terms: { caps: { maxStakePerTradeBase: bigint; maxDailySpendBase: bigint; maxOpenPositions: number; maxPriceRaw: bigint } }) {
  const { caps } = terms;
  return { maxStakePerTrade: caps.maxStakePerTradeBase, maxDailySpend: caps.maxDailySpendBase, maxOpenPositions: caps.maxOpenPositions, maxPriceRaw: caps.maxPriceRaw };
}

/** One intent, one contract call. Deposits absorb their allowance first. */
export async function sendVaultIntent(contracts: VaultContracts, intent: VaultIntent): Promise<Sent> {
  switch (intent.kind) {
    case "vault-deposit":
      await ensureVaultAllowance(contracts, intent.amountBase);
      return writeVault(contracts, "deposit", [intent.amountBase], intent.kind);
    case "vault-withdraw":
      return writeVault(contracts, "withdraw", [intent.amountBase], intent.kind);
    case "vault-move-private":
      return writeVault(contracts, "moveToPrivate", [intent.amountBase], intent.kind);
    case "vault-withdraw-private":
      return writeVault(contracts, "withdrawPrivate", [intent.amountBase], intent.kind);
    case "vault-grant": {
      const t = intent.terms;
      return writeVault(contracts, "grant", [GRANT_KIND_INDEX[t.kind], t.actor, capsTuple(t), BigInt(t.expiresAtSec), t.budgetBase], intent.kind);
    }
    case "vault-deposit-and-grant": {
      const t = intent.terms;
      await ensureVaultAllowance(contracts, intent.amountBase);
      return writeVault(contracts, "depositAndGrant", [intent.amountBase, GRANT_KIND_INDEX[t.kind], t.actor, capsTuple(t), BigInt(t.expiresAtSec), t.budgetBase], intent.kind);
    }
    case "vault-fund-grant":
      return writeVault(contracts, "fundGrant", [intent.grantId, intent.amountBase], intent.kind);
    case "vault-revoke":
      return writeVault(contracts, "revoke", [intent.grantId], intent.kind);
    case "vault-crank-settle":
      return writeVault(contracts, "crankSettle", [intent.owner, intent.marketId], intent.kind);
    case "vault-sweep":
      return writeVault(contracts, "sweep", [intent.pool], intent.kind);
  }
}

/** The journal's one line, written for the person who reads it back after a timeout. */
export function summarizeVault(intent: VaultIntent, decimals: number): string {
  const amount = (base: bigint) => formatBaseUnits(base, decimals);
  switch (intent.kind) {
    case "vault-deposit":
      return `deposit ${amount(intent.amountBase)} into the Trading Balance`;
    case "vault-withdraw":
      return `withdraw ${amount(intent.amountBase)} from the Trading Balance`;
    case "vault-move-private":
      return `move ${amount(intent.amountBase)} to the private balance`;
    case "vault-withdraw-private":
      return `withdraw ${amount(intent.amountBase)} from the private balance`;
    case "vault-grant":
      return `grant ${intent.terms.kind} to ${intent.terms.actor} with ${amount(intent.terms.budgetBase)}`;
    case "vault-deposit-and-grant":
      return `deposit ${amount(intent.amountBase)} and grant ${intent.terms.kind} to ${intent.terms.actor}`;
    case "vault-fund-grant":
      return `add ${amount(intent.amountBase)} to grant #${intent.grantId}`;
    case "vault-revoke":
      return `revoke grant #${intent.grantId}`;
    case "vault-crank-settle":
      return `settle ${intent.marketId} into ${intent.owner}'s Trading Balance`;
    case "vault-sweep":
      return `sweep the vault's pool credit`;
  }
}

function refused(diag: Diagnosis): TxOutcome {
  return { status: "refused", diagnosis: diag };
}

export async function settleVaultFailure(journal: IntentJournal, id: string, error: unknown, onPhase?: PhaseListener): Promise<TxOutcome> {
  const diag = diagnoseVault(error);
  if (error instanceof TxRevertedError) {
    await journal.markSent(id, error.txHash);
    await journal.markFailed(id, diag.technical);
    onPhase?.("reverted", { txHash: error.txHash });
    return { status: "reverted", diagnosis: diag, txHash: error.txHash };
  }
  if (isTimeoutError(error)) {
    await journal.markUnknown(id);
    onPhase?.("unknown");
    return { status: "unknown", diagnosis: diagnosis("send-unknown", diag.technical) };
  }
  await journal.markFailed(id, diag.technical);
  onPhase?.("composing");
  return refused(diag);
}

/** AD-3's second lane for the vault: journal → gas → (allowance) → simulate → send → receipt → book. */
export async function submitVaultTx(ctx: VaultTxContext, intent: VaultIntent, onPhase?: PhaseListener): Promise<TxOutcome> {
  const { wallet, contracts } = ctx;
  if (!contracts?.deployment) return refused(diagnosis("not-deployed", VAULT_NOT_DEPLOYED));
  const record = await ctx.journal.record({ kind: intent.kind, wallet, summary: summarizeVault(intent, getCollateral().decimals) });
  const gas = await checkGas(wallet, "vault");
  if (!gas.ok) {
    await ctx.journal.markFailed(record.id, gas.diagnosis.technical);
    return refused(gas.diagnosis);
  }
  onPhase?.("submitted");
  try {
    const { hash } = await sendVaultIntent(contracts, intent);
    await ctx.journal.markSent(record.id, hash);
    await ctx.journal.markConfirmed(record.id);
    onPhase?.("confirmed", { txHash: hash });
    return { status: "confirmed", txHash: hash };
  } catch (error) {
    return settleVaultFailure(ctx.journal, record.id, error, onPhase);
  }
}
