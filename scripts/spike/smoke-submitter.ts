import { randomBytes } from "node:crypto";
import { FAUCET_UNITS } from "@masayume/core/constants";
import { oneUnit } from "@masayume/core/units";
import { createMemoryJournal, createSubmitter, loadCollateral } from "@masayume/markets";
import { runSpike } from "./lib/boot";

const json = (value: unknown) => JSON.stringify(value, (_k, v: unknown) => (typeof v === "bigint" ? v.toString() : v), 2);

/** Proves the tx lane refuses before any popup: an unfunded random key must get a clean out-of-gas diagnosis and send nothing. */
await runSpike(async ({ exchange }) => {
  exchange.setSigner({ privateKey: `0x${randomBytes(32).toString("hex")}` });
  const wallet = exchange.walletAddress;
  if (!wallet) throw new Error("signer did not bind");

  const collateral = await loadCollateral();
  if (!collateral.ok) throw new Error(collateral.error.technical);

  const submitter = createSubmitter({ journal: createMemoryJournal() });
  console.log("signer", wallet, "hasSigner", submitter.hasSigner());
  console.log("checkGas", json(await submitter.checkGas("faucet")));

  const amountBase = FAUCET_UNITS * oneUnit(collateral.value.decimals);
  const outcome = await submitter.submitTx({ kind: "faucet", amountBase }, (phase) => console.log("phase", phase));
  console.log("submitTx", json(outcome));
  console.log("unresolved", json(await submitter.journal.listUnresolved(wallet)));
});
