import { formatCadence } from "@masayume/core/copy";
import { privateOpenMessage, privateOpenRequestSchema } from "@masayume/core/private";
import { toMarketId } from "@masayume/core/types";
import { formatBaseUnits } from "@masayume/core/units";
import { getCollateral, marketsProvider } from "@masayume/markets";
import { openPrivateBet } from "@masayume/markets/private";
import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { getDesk } from "@/features/private/desk.server";

/**
 * Open a private bet. Proof that the caller IS the owner comes first: the route rebuilds the exact message
 * the wallet showed — from the chain's own Window, not the caller's strings — and checks the signature
 * against `owner`. Without this the endpoint would be a faucet for whoever can send a POST.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const refuse = (status: number, error: string) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const parsed = privateOpenRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return refuse(400, "malformed private open request");
  const body = parsed.data;

  const desk = await getDesk().catch(() => null);
  if (!desk) return refuse(503, "no desk key is configured on this deployment (PRIVATE_DESK_PRIVATE_KEY)");
  const market = await marketsProvider.getMarket(toMarketId(body.marketId));
  if (!market.ok) return refuse(502, `could not read the Window: ${market.error.technical}`);
  if (!market.value) return refuse(404, "no such Window");
  const collateral = getCollateral();
  const stakeBase = BigInt(body.stakeBase);
  const message = privateOpenMessage({
    owner: body.owner,
    marketId: market.value.marketId,
    asset: market.value.asset,
    cadenceText: formatCadence(market.value.intervalSec),
    expirySec: market.value.expirySec,
    side: body.side,
    stakeText: formatBaseUnits(stakeBase, collateral.decimals),
    symbol: collateral.symbol,
    issuedAtMs: body.issuedAtMs,
  });
  const authorised = await verifyMessage({ address: body.owner, message, signature: body.signature as `0x${string}` }).catch(() => false);
  if (!authorised) return refuse(401, "authorisation was not signed by the owner");

  const result = await openPrivateBet(desk, {
    owner: body.owner,
    marketId: market.value.marketId,
    side: body.side,
    stakeBase,
    minQuantityRaw: BigInt(body.minQuantityRaw),
    authSignature: body.signature as `0x${string}`,
    issuedAtMs: body.issuedAtMs,
    asset: market.value.asset,
    intervalSec: market.value.intervalSec,
    expirySec: market.value.expirySec,
  });
  return NextResponse.json(result);
}
