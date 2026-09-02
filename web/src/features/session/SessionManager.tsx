"use client";

import { formatBaseUnits } from "@masayume/core/units";
import { capResetsAtSec, dailyHeadroomBase } from "@masayume/core/vault";
import { requiredGasWei, sessionGasTopUpWei } from "@masayume/markets";
import { Hash, UtcTime } from "@/components/data";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { notify } from "@/lib/toast";
import { priceCapText } from "./caps";
import { SESSION } from "./copy";
import { useSessionKey } from "./SessionKeyProvider";
import type { SessionKeyActions, SessionBusy, SessionKeyView } from "./view";

interface SessionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArmNew: () => void;
  symbol: string;
}

const NATIVE_DECIMALS = 18;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

function gasLine(view: SessionKeyView): string {
  const m = SESSION.manager;
  if (view.sponsor?.configured && view.sponsor.sponsor) {
    return view.sponsorRefusal ? m.gasSponsorDeclined(view.sponsorRefusal) : m.gasSponsor(view.sponsor.sponsor.slice(0, 10));
  }
  if (view.keyGasWei === null || view.keyGasWei === 0n) return m.gasKeyEmpty;
  const perTap = requiredGasWei("vault-order");
  return m.gasKey(formatBaseUnits(view.keyGasWei, NATIVE_DECIMALS, { maxDp: 3, minDp: 0 }), Number(view.keyGasWei / perTap));
}

/** The manager body, separated so the fixture page can render every state without a provider. */
export function SessionManagerBody({ view, actions, busy, symbol, onArmNew }: { view: SessionKeyView; actions: SessionKeyActions; busy: SessionBusy; symbol: string; onArmNew: () => void }) {
  const m = SESSION.manager;
  const { grant, decimals } = view;
  const money = (base: bigint) => `${formatBaseUnits(base, decimals)} ${symbol}`;
  const revoke = async () => {
    const outcome = await actions.revoke();
    if (outcome.status === "confirmed") notify.neutral(m.revoke, m.revokeNote);
  };
  const rekey = async () => {
    const { outcome, topUpError } = await actions.rekey();
    if (outcome.status === "confirmed") notify.neutral(m.rekey, topUpError ?? SESSION.sheet.armedBody);
  };

  if (view.status === "expired" || view.status === "disarmed" || !grant) {
    return (
      <div className="flex flex-col gap-3">
        {view.status === "expired" && (
          <>
            <p className="type-body-strong text-ink">{m.expiredTitle}</p>
            <p className="type-caption text-ink-secondary">{m.expiredBody}</p>
          </>
        )}
        <Button size="lg" className="w-full" onClick={onArmNew} disabled={view.status === "not-deployed" || view.status === "no-wallet"}>
          {m.armNew}
        </Button>
        {view.key && (
          <Button variant="ghost" size="sm" onClick={() => void actions.forget()}>
            {m.forget}
          </Button>
        )}
      </div>
    );
  }

  const spentToday = grant.spentDay === Math.floor(view.nowSec / 86_400) ? grant.spentTodayBase : 0n;
  const needsKey = view.status === "grant-without-key";
  const keyPays = !(view.sponsor?.configured ?? false);
  const lowGas = keyPays && (view.keyGasWei ?? 0n) < requiredGasWei("vault-order");

  return (
    <div className="flex flex-col gap-4">
      {needsKey && (
        <div className="flex flex-col gap-1 rounded-md border border-hairline bg-surface-2 p-3">
          <p className="type-body-strong text-ink">{m.needsKeyTitle}</p>
          <p className="type-caption text-ink-secondary">{m.needsKeyBody}</p>
        </div>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 type-caption">
        <Row label={m.key}>
          <Hash value={grant.actor} lead={8} tail={6} />
        </Row>
        <Row label={m.scope}>{SESSION.sheet.receipt.scopeValue}</Row>
        <Row label={m.caps}>{m.capsValue(money(grant.caps.maxStakePerTradeBase), money(grant.caps.maxDailySpendBase), grant.caps.maxOpenPositions, priceCapText(grant, decimals))}</Row>
        <Row label={m.spentToday}>{money(spentToday)}</Row>
        <Row label={m.headroom}>
          {money(dailyHeadroomBase(grant, view.nowSec))} · {m.resets} (<UtcTime ms={capResetsAtSec(view.nowSec) * 1000} withSeconds={false} />)
        </Row>
        <Row label={m.budget}>{money(grant.budgetBase)}</Row>
        <Row label={m.expires}>
          <UtcTime ms={grant.expiresAtSec * 1000} withDate withSeconds={false} />
        </Row>
        <Row label={m.gas}>{gasLine(view)}</Row>
      </dl>
      {lowGas && !needsKey && (
        <Button variant="secondary" size="sm" disabled={busy !== null} onClick={() => void actions.topUp()}>
          {m.topUp(formatBaseUnits(sessionGasTopUpWei(), NATIVE_DECIMALS, { maxDp: 3, minDp: 0 }))}
        </Button>
      )}
      <div className="flex flex-col gap-2">
        {needsKey && (
          <Button size="lg" className="w-full" disabled={busy !== null} onClick={() => void rekey()}>
            {busy === "rekeying" ? m.rekeying : m.rekey}
          </Button>
        )}
        <Button variant="secondary" size="lg" className="w-full" disabled={busy !== null} onClick={() => void revoke()}>
          {busy === "revoking" ? m.revoking : m.revoke}
        </Button>
        <p className="type-caption text-ink-muted">{m.revokeNote}</p>
        {view.key && (
          <Button variant="ghost" size="sm" onClick={() => void actions.forget()} title={m.forgetNote}>
            {m.forget}
          </Button>
        )}
      </div>
    </div>
  );
}

export function SessionManager({ open, onOpenChange, onArmNew, symbol }: SessionManagerProps) {
  const { view, actions, busy } = useSessionKey();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-dvh overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{SESSION.manager.title}</SheetTitle>
          <SheetDescription>{SESSION.chip.titleOn}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <SessionManagerBody view={view} actions={actions} busy={busy} symbol={symbol} onArmNew={onArmNew} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
