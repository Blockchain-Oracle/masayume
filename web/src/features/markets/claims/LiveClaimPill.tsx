"use client";

import { netClaimableSum } from "@masayume/core/claims";
import { isOk } from "@masayume/core/schemas";
import { formatBaseUnits } from "@masayume/core/units";
import { collateralOrNull } from "@masayume/markets";
import { useClaimables } from "@masayume/markets/react";
import { usePathname } from "next/navigation";
import { ClaimPill } from "@/components/chrome";
import { CLAIMS_PATH } from "@/lib/routes";
import { useWalletSession } from "@/lib/wallet-session";
import { useVenue } from "../useVenue";

/** Surfaces only while something is claimable; a stale reading keeps the last-good sum rather than dropping the badge. */
export function LiveClaimPill() {
  const pathname = usePathname();
  const session = useWalletSession();
  const { venueId } = useVenue();
  const reading = useClaimables(session.address, venueId);

  if (pathname === CLAIMS_PATH || reading === null || !isOk(reading)) return null;
  const first = reading.value[0];
  const sum = netClaimableSum(reading.value);
  if (!first || sum === 0n) return null;

  const symbol = collateralOrNull()?.symbol;
  const amountText = symbol ? `${formatBaseUnits(sum, first.decimals)} ${symbol}` : formatBaseUnits(sum, first.decimals);
  return <ClaimPill amountText={amountText} href={CLAIMS_PATH} />;
}
