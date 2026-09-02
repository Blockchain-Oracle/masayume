import { formatCadence } from "@masayume/core/copy";
import type { Hex, Side } from "@masayume/core/types";
import { formatBaseUnits, formatOracleRaw, formatUtc, secToMs } from "@masayume/core/units";
import { ORACLE_SCALE } from "@/features/markets/hero/units";
import { CARD_H, CARD_MARGIN, CARD_W, closeCard, drawFooter, drawMasthead, drawPerforation, drawProof, drawTracked, ensureFont, fitFontPx, font, openCard, resolveFonts, resolvePalette } from "./canvas";
import { SHARE } from "./copy";

/**
 * "Earned Heat" — the shareable card for one settled Window, ported from
 * `reference/yosuku/lib/shareCard.ts`.
 *
 * The realised P&L is the giant focal number: a win is living vermilion heat, a loss
 * is drained ash — never green, never red. ONE-SPARK rule: vermilion appears only
 * on a win, and only in the P&L.
 *
 * HONESTY (hard rules — do not relax):
 *  · The oracle's print is drawn ONLY when the closing print is on record, at the
 *    Window's real expiry second; otherwise the line says "SETTLED" and the claim
 *    time, never a guessed print.
 *  · A void says both sides paid 0.5. A close-out says it closed on the book before
 *    expiry and never claims an oracle settlement.
 *  · With no entry cost on record the hero is the payout, labelled PAID OUT, never
 *    a P&L computed from a guessed stake.
 */
export type TradeOutcome = "win" | "loss" | "void" | "closed";

export interface TradeCard {
  asset: string;
  intervalSec: number;
  sides: Side[];
  outcome: TradeOutcome;
  lineRaw: bigint | null;
  closeRaw: bigint | null;
  /** What stayed in; null when no entry cost is on record. */
  stakeBase: bigint | null;
  payoutBase: bigint;
  pnlBase: bigint;
  decimals: number;
  symbol: string;
  expirySec: number;
  settledAtMs: number;
  entryTxHash: Hex | null;
  settlementTxHash: Hex | null;
}

const fmt = (value: bigint, decimals: number) => formatBaseUnits(value, decimals);
const usd0 = (raw: bigint) => `$${formatOracleRaw(raw, ORACLE_SCALE, 0)}`;
const usd2 = (raw: bigint) => `$${formatOracleRaw(raw, ORACLE_SCALE, 2)}`;
const shortHash = (hash: string): string => (hash.length > 12 ? `${hash.slice(0, 12)}…` : hash);

/** "UP vs $64,316" / "UP + DOWN vs $64,316" / "UP vs the opening print". */
export function tradeBandLabel(card: TradeCard): string {
  const sides = card.sides.map((side) => side.toUpperCase()).join(" + ") || "—";
  return card.lineRaw === null ? `${sides} vs the opening print` : `${sides} vs ${usd0(card.lineRaw)}`;
}

/** Folio / filename id: first 6 hex of the entry tx when known, else of the settlement tx. */
export function shortTradeId(card: TradeCard): string {
  const hash = card.entryTxHash ?? card.settlementTxHash ?? "0x000000";
  return hash.replace(/^0x/i, "").slice(0, 6).toUpperCase();
}

interface TradeLook {
  won: boolean;
  recordType: string;
  kindLine: string;
  footerKind: string;
}

function tradeLook(card: TradeCard): TradeLook {
  const claimed = formatUtc(card.settledAtMs, { withDate: true });
  if (card.outcome === "void") return { won: false, recordType: SHARE.trade.voidRecord, kindLine: SHARE.trade.voided(claimed), footerKind: SHARE.trade.kind.voided };
  if (card.outcome === "closed") return { won: card.pnlBase > 0n, recordType: SHARE.trade.closeOut, kindLine: SHARE.trade.closedEarly(claimed), footerKind: SHARE.trade.kind.closed };
  const kindLine = card.closeRaw !== null ? SHARE.trade.oracleSettled(usd2(card.closeRaw), formatUtc(secToMs(card.expirySec), { withDate: true })) : SHARE.trade.settledAt(claimed);
  return { won: card.pnlBase > 0n, recordType: SHARE.trade.settlement, kindLine, footerKind: SHARE.trade.kind.settled };
}

/** Honest pre-filled post text from real fields only. */
export function buildTradeTweetText(card: TradeCard, host: string): string {
  const look = tradeLook(card);
  const pnl = card.stakeBase === null ? fmt(card.payoutBase, card.decimals) : formatBaseUnits(card.pnlBase, card.decimals, { signed: true });
  return SHARE.trade.tweet(pnl, card.symbol, card.asset, tradeBandLabel(card).toLowerCase(), look.kindLine.toLowerCase(), card.stakeBase === null ? "—" : fmt(card.stakeBase, card.decimals), fmt(card.payoutBase, card.decimals), host);
}

export async function renderTradeShareCard(card: TradeCard, host: string): Promise<Blob> {
  const fonts = resolveFonts();
  const { vermilion, verm, groundTrade, ash, ashDim } = resolvePalette();
  const look = tradeLook(card);
  const heroText = card.stakeBase === null ? fmt(card.payoutBase, card.decimals) : formatBaseUnits(card.pnlBase, card.decimals, { signed: true }).replace(/^-/, "−");
  const heroLabel = card.stakeBase === null ? SHARE.trade.paidOut(card.symbol) : SHARE.trade.realized(card.symbol);
  const subLine = `${card.asset} · ${tradeBandLabel(card)} · ${formatCadence(card.intervalSec)} · ${card.stakeBase === null ? "—" : fmt(card.stakeBase, card.decimals)} → ${fmt(card.payoutBase, card.decimals)} ${card.symbol}`;

  await Promise.all([
    ensureFont(font(800, 240, fonts.display), heroText),
    ensureFont(font(800, 34, fonts.display), SHARE.brand),
    ensureFont(font(600, 22, fonts.mono)),
    ensureFont(font(500, 26, fonts.mono), subLine),
    ensureFont(font(400, 21, fonts.mono)),
  ]);

  const { canvas, ctx } = openCard(groundTrade, 0.35, 0.42);

  // living heat behind the hero on a win, a faint lamp on a loss
  const heat = ctx.createRadialGradient(CARD_W / 2, 780, 60, CARD_W / 2, 780, 760);
  if (look.won) {
    heat.addColorStop(0, verm(0.14));
    heat.addColorStop(0.55, verm(0.05));
    heat.addColorStop(1, "rgba(0,0,0,0)");
  } else {
    heat.addColorStop(0, "rgba(255,250,240,0.045)");
    heat.addColorStop(1, "rgba(0,0,0,0)");
  }
  ctx.fillStyle = heat;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  drawMasthead(ctx, fonts, SHARE.brand, shortTradeId(card), look.recordType, 258);

  ctx.font = font(600, 19, fonts.mono);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  drawTracked(ctx, heroLabel, CARD_W / 2, 648, 5, "center");

  const pnlPx = fitFontPx(ctx, heroText, fonts.display, 800, 232, CARD_W - 2 * CARD_MARGIN);
  ctx.font = font(800, pnlPx, fonts.display);
  ctx.textAlign = "center";
  const pnlY = 872;
  if (look.won) {
    ctx.save();
    ctx.shadowColor = verm(0.55);
    ctx.shadowBlur = 180;
    ctx.fillStyle = verm(0.9);
    ctx.fillText(heroText, CARD_W / 2, pnlY);
    ctx.shadowBlur = 56;
    ctx.fillText(heroText, CARD_W / 2, pnlY);
    ctx.restore();
    ctx.fillStyle = vermilion;
    ctx.fillText(heroText, CARD_W / 2, pnlY);
  } else {
    ctx.fillStyle = card.outcome === "void" ? ashDim : ash;
    ctx.fillText(heroText, CARD_W / 2, pnlY);
  }

  const subPx = fitFontPx(ctx, subLine, fonts.mono, 500, 26, CARD_W - 2 * CARD_MARGIN);
  ctx.font = font(500, subPx, fonts.mono);
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.textAlign = "center";
  ctx.fillText(subLine, CARD_W / 2, 972);

  const klPx = fitFontPx(ctx, look.kindLine, fonts.mono, 400, 20, CARD_W - 2 * CARD_MARGIN);
  ctx.font = font(400, klPx, fonts.mono);
  ctx.fillStyle = card.outcome === "void" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.55)";
  ctx.fillText(look.kindLine, CARD_W / 2, 1026);

  drawPerforation(ctx, 1120);
  const proof = [card.entryTxHash && SHARE.trade.entry(shortHash(card.entryTxHash)), card.settlementTxHash && SHARE.trade.settlementTx(shortHash(card.settlementTxHash))].filter(Boolean).join(" · ") || SHARE.trade.noTx;
  drawProof(ctx, fonts, proof, SHARE.verifyOn);
  drawFooter(ctx, fonts, host, look.footerKind);
  return closeCard(canvas, ctx);
}
