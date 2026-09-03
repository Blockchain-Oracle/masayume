"use client";

import type { BlockerContext } from "@masayume/core/copy";
import type { Side } from "@masayume/core/types";
import { formatBaseUnits, priceRawToBps } from "@masayume/core/units";
import type { ReactNode } from "react";
import { Money, Odds } from "@/components/data";
import { BlockedButton, ErrorState, LoadingState } from "@/components/states";
import { SIDE_WORD } from "../markets/side-styles";
import { PRIVATE } from "./copy";
import type { PrivateTicketState } from "./usePrivateTicket";
import "./private-ticket.css";

interface PartProps {
  priv: PrivateTicketState;
  side: Side | null;
  stakeBase: bigint;
  decimals: number;
  symbol: string;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="contents">
      <dt className="type-caption text-ink-secondary">{label}</dt>
      <dd className="type-data text-ink text-right">{children}</dd>
    </div>
  );
}

/** Cost · payout if right · max loss · odds — the desk contract's own sizing off the live book, never a midpoint. */
export function PrivateQuoteRows({ priv, side, stakeBase, decimals, symbol }: PartProps) {
  if (side === null || stakeBase === 0n) return null;
  if (priv.quoteError) return <ErrorState diagnosis={priv.quoteError} retry={priv.retryQuote} />;
  if (!priv.quote) return priv.quoteLoading ? <LoadingState shape="row" /> : null;
  const q = priv.quote;
  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
        <Row label={PRIVATE.quote.cost}>
          <Money value={q.costBase} decimals={decimals} symbol={symbol} />
        </Row>
        <Row label={PRIVATE.quote.payoutIfRight(SIDE_WORD[side])}>
          <Money value={q.quantityRaw} decimals={decimals} symbol={symbol} />
        </Row>
        <Row label={PRIVATE.quote.maxLoss}>
          <Money value={q.costBase} decimals={decimals} symbol={symbol} />
        </Row>
        <Row label={PRIVATE.quote.odds}>
          <Odds bps={priceRawToBps(q.priceRaw, decimals)} />
        </Row>
      </dl>
      {q.costBase < stakeBase && <p className="type-caption text-ink-secondary">{PRIVATE.quote.sized(formatBaseUnits(q.costBase, decimals), symbol)}</p>}
    </div>
  );
}

/**
 * The reference's line under the control (`Ticket624Drawer.tsx` L1221–1247): the one case worth
 * interrupting for is Private chosen with nothing behind it, so the bet WILL refuse — said here, before a
 * signature. Otherwise one quiet line, and the honest one-liner under it.
 */
export function PrivateNote({ priv, stakeBase, decimals, symbol }: Omit<PartProps, "side">) {
  const spendable = priv.budget?.spendableBase ?? 0n;
  const short = priv.budget !== null && stakeBase > 0n && spendable < stakeBase;
  return (
    <div className="flex flex-col gap-1">
      {short ? (
        <div className="tk-priv-box">
          <span className="tk-priv-box-text">{spendable > 0n ? PRIVATE.note.balance(`${formatBaseUnits(spendable, decimals)} ${symbol}`) : PRIVATE.note.empty}</span>
          <button type="button" onClick={() => void priv.fund()} disabled={priv.busy !== null || priv.topUpBase === 0n} className="tk-priv-box-action" data-cursor="hover">
            {priv.busy === "fund" ? PRIVATE.note.adding : PRIVATE.note.addFunds}
          </button>
        </div>
      ) : (
        <p className="tk-priv-line">{PRIVATE.note.always}</p>
      )}
      <p className="tk-lev-note">{PRIVATE.note.honesty}</p>
      {short && <p className="tk-lev-note">{PRIVATE.note.signatures}</p>}
    </div>
  );
}

/** The 52px CTA: "Buy UP privately for X", or the top-up and the bet as one action; blocked, its label is the blocker. */
export function PrivateCta({ priv, side, decimals, symbol, ctx }: PartProps & { ctx: BlockerContext }) {
  const q = priv.quote;
  const label = (() => {
    if (priv.busy === "fund") return PRIVATE.cta.funding;
    if (priv.busy === "open") return PRIVATE.cta.placing;
    if (!side || !q) return null;
    if (priv.shortBase > 0n) return PRIVATE.cta.fundAndBuy(`${formatBaseUnits(priv.topUpBase, decimals)} ${symbol}`, SIDE_WORD[side]);
    return null;
  })();
  return (
    <BlockedButton blocker={priv.blocker} ctx={{ ...ctx, ...priv.ctx }} tone={side ?? "primary"} size="lg" className="w-full" onClick={() => void priv.place()}>
      {label ?? (side && q ? (
        <>
          {PRIVATE.cta.buy(SIDE_WORD[side])} <Money value={q.costBase} decimals={decimals} symbol={symbol} />
        </>
      ) : (
        PRIVATE.cta.buy("")
      ))}
    </BlockedButton>
  );
}
