"use client";

import type { Address } from "@masayume/core/types";
import { formatBaseUnits } from "@masayume/core/units";
import { Hash, UtcTime } from "@/components/data";
import { SESSION } from "./copy";

interface CapabilityReceiptProps {
  keyAddress: Address | null;
  expiresAtSec: number;
  sponsorConfigured: boolean;
  /** STT the enable flow will move to the key when the key pays, in wei. */
  topUpWei: bigint;
  /** True when the vault holds no tUSDC allowance yet: the first deposit costs an extra signature. */
  firstTime: boolean;
}

const NATIVE_DECIMALS = 18;

/** The capability receipt (UX-DR7): what the signature grants, what it can never do, who pays, and how many taps it takes. */
export function CapabilityReceipt({ keyAddress, expiresAtSec, sponsorConfigured, topUpWei, firstTime }: CapabilityReceiptProps) {
  const r = SESSION.sheet.receipt;
  const base = firstTime ? r.sigsTwo : r.sigsOne;
  const gasText = sponsorConfigured ? r.gasSponsor : r.gasKey(formatBaseUnits(topUpWei, NATIVE_DECIMALS, { maxDp: 3, minDp: 0 }));
  return (
    <div className="flex flex-col gap-2 rounded-md border border-hairline bg-surface-2 p-3">
      <span className="tk-control-label">{SESSION.sheet.receiptTitle}</span>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 type-caption">
        <dt className="text-ink-secondary">{r.scope}</dt>
        <dd className="text-ink">{r.scopeValue}</dd>
        <dt className="text-ink-secondary">{r.cannot}</dt>
        <dd className="text-ink">{r.cannotValue}</dd>
        <dt className="text-ink-secondary">{r.key}</dt>
        <dd className="text-ink">{keyAddress ? <Hash value={keyAddress} lead={8} tail={6} /> : "—"}</dd>
        <dt className="text-ink-secondary">{r.expiresAt}</dt>
        <dd className="text-ink">
          <UtcTime ms={expiresAtSec * 1000} withDate withSeconds={false} />
        </dd>
        <dt className="text-ink-secondary">{r.gas}</dt>
        <dd className="text-ink">{gasText}</dd>
        <dt className="text-ink-secondary">{r.signatures}</dt>
        <dd className="text-ink">{sponsorConfigured ? base : r.sigsTopUp(base)}</dd>
      </dl>
    </div>
  );
}
