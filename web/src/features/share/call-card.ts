import { estPayoutBase } from "@masayume/core/claims";
import { formatCadence } from "@masayume/core/copy";
import type { Hex, Side } from "@masayume/core/types";
import { formatBaseUnits, formatOracleRaw, formatUtc, secToMs } from "@masayume/core/units";
import { ORACLE_SCALE } from "@/features/markets/hero/units";
import { CARD_MARGIN, CARD_W, closeCard, drawFooter, drawMasthead, drawPerforation, drawProof, drawTracked, ensureFont, fitFontPx, font, openCard, resolveFonts, resolvePalette } from "./canvas";
import { SHARE } from "./copy";

/**
 * "The Call" — the shareable card for one just-placed bet, ported from
 * `reference/yosuku/lib/openBetShareCard.ts`.
 *
 * HONESTY (hard rules — do not relax):
 *  · This is an OPEN position with NO result. The return is framed conditionally
 *    ("IF IT LANDS"), never as realised.
 *  · The settle time is the Window's real expiry, as an absolute UTC second — never
 *    a "settles in ~Xm" that goes stale the moment it is shared.
 *  · Every number is what the wallet actually staked, and the return is net of the
 *    settlement fee when the fee is known.
 *  · Leverage does not exist here, so the reference's leverage caveat is gone rather
 *    than printed as "1×".
 */
export interface CallCard {
  asset: string;
  side: Side;
  intervalSec: number;
  /** The opening print on the oracle scale; null when the call was placed before it landed. */
  lineRaw: bigint | null;
  stakeBase: bigint;
  contractsRaw: bigint;
  decimals: number;
  symbol: string;
  /** Settlement fee in basis points; null when unread, in which case the return is gross and says so. */
  feeBps: number | null;
  expirySec: number;
  txHash: Hex;
  placedAtMs: number;
}

const fmt = (value: bigint, decimals: number) => formatBaseUnits(value, decimals);
const usd0 = (raw: bigint) => `$${formatOracleRaw(raw, ORACLE_SCALE, 0)}`;

/** What a win returns — one unit per contract less the settlement fee when it is known. */
export function callWinBase(card: CallCard): bigint {
  return card.feeBps === null ? card.contractsRaw : estPayoutBase(card.contractsRaw, "win", card.feeBps);
}

/** "BTC OVER $64,316" / "BTC UNDER $64,316" / "BTC VS THE OPENING PRINT". */
export function callBandLabel(card: CallCard): string {
  if (card.lineRaw === null) return SHARE.call.noLine(card.asset);
  return card.side === "up" ? SHARE.call.over(card.asset, usd0(card.lineRaw)) : SHARE.call.under(card.asset, usd0(card.lineRaw));
}

export function callDirLabel(card: CallCard): string {
  return card.side === "up" ? SHARE.call.up : SHARE.call.down;
}

/** Folio / filename id: first 6 hex of the entry tx, uppercased. */
export function shortCallId(card: CallCard): string {
  return card.txHash.replace(/^0x/i, "").slice(0, 6).toUpperCase();
}

const shortHash = (hash: string): string => (hash.length > 14 ? `${hash.slice(0, 14)}…` : hash);

/** Honest pre-filled post text — real staked numbers only, framed as a live call. */
export function buildCallTweetText(card: CallCard, host: string): string {
  return SHARE.call.tweet(callBandLabel(card).toLowerCase(), formatCadence(card.intervalSec), fmt(card.stakeBase, card.decimals), fmt(callWinBase(card), card.decimals), card.symbol, formatUtc(secToMs(card.expirySec)), host);
}

export async function renderCallShareCard(card: CallCard, host: string): Promise<Blob> {
  const fonts = resolveFonts();
  const { vermilion, verm, groundCall } = resolvePalette();
  const band = callBandLabel(card);
  const stakeText = fmt(card.stakeBase, card.decimals);
  const winText = fmt(callWinBase(card), card.decimals);

  await Promise.all([
    ensureFont(font(800, 150, fonts.display), band),
    ensureFont(font(800, 120, fonts.display), `${stakeText}→${winText}`),
    ensureFont(font(800, 27, fonts.display), SHARE.brand),
    ensureFont(font(600, 22, fonts.mono)),
    ensureFont(font(500, 26, fonts.mono)),
  ]);

  // Flat near-black; the heat lives only on the return number and the direction spark.
  const { canvas, ctx } = openCard(groundCall, 0.34, 0.46);
  drawMasthead(ctx, fonts, SHARE.brand, shortCallId(card), SHARE.call.recordType, 250);

  // a single vermilion spark under the record line
  ctx.strokeStyle = verm(0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2 - 26, 172);
  ctx.lineTo(CARD_W / 2 + 26, 172);
  ctx.stroke();

  // direction eyebrow
  ctx.font = font(600, 30, fonts.mono);
  ctx.fillStyle = vermilion;
  drawTracked(ctx, callDirLabel(card), CARD_W / 2, 360, 4, "center");

  // hero: the call
  const heroPx = fitFontPx(ctx, band, fonts.display, 800, 132, CARD_W - 2 * CARD_MARGIN, 60);
  ctx.font = font(800, heroPx, fonts.display);
  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.textAlign = "center";
  ctx.fillText(band, CARD_W / 2, 486);

  // wager: stake → return (the return carries the vermilion)
  ctx.font = font(600, 18, fonts.mono);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  drawTracked(ctx, SHARE.call.stakeLine, CARD_W / 2, 632, 4, "center");

  ctx.font = font(800, 108, fonts.display);
  const arrow = "  →  ";
  const wStake = ctx.measureText(stakeText).width;
  const wArrow = ctx.measureText(arrow).width;
  const wWin = ctx.measureText(winText).width;
  let wx = CARD_W / 2 - (wStake + wArrow + wWin) / 2;
  const wagerY = 772;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(stakeText, wx, wagerY);
  wx += wStake;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText(arrow, wx, wagerY);
  wx += wArrow;
  ctx.save();
  ctx.shadowColor = verm(0.5);
  ctx.shadowBlur = 68;
  ctx.fillStyle = vermilion;
  ctx.fillText(winText, wx, wagerY);
  ctx.restore();
  ctx.fillStyle = vermilion;
  ctx.fillText(winText, wx, wagerY);

  ctx.font = font(500, 22, fonts.mono);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  drawTracked(ctx, card.feeBps === null ? card.symbol : `${card.symbol} · ${SHARE.call.afterFee.toUpperCase()}`, CARD_W / 2, 824, 5, "center");

  // settle line (real expiry, absolute UTC)
  ctx.font = font(400, 21, fonts.mono);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "center";
  ctx.fillText(SHARE.call.settlesLine(formatUtc(secToMs(card.expirySec))), CARD_W / 2, 900);

  drawPerforation(ctx, 1120);
  drawProof(ctx, fonts, SHARE.call.tx(shortHash(card.txHash)), SHARE.verifyOn);
  drawFooter(ctx, fonts, host, SHARE.call.footerKind);
  return closeCard(canvas, ctx);
}
