"use client";

import type { Diagnosis } from "@masayume/core/types";
import { sessionGasTopUpWei } from "@masayume/markets";
import { useBalanceSheet } from "@masayume/markets/react";
import { useState } from "react";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { notify } from "@/lib/toast";
import { CapabilityReceipt } from "./CapabilityReceipt";
import { CapsEditor } from "./CapsEditor";
import { CAPS_DEFAULTS, termsFromForm, workedExample, type CapsForm } from "./caps";
import { SESSION } from "./copy";
import { useSessionKey } from "./SessionKeyProvider";

interface SessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
}

/**
 * The enable flow, one action (Story 6.3): caps, the worked example at the chosen size, the
 * capability receipt, then one owner signature for deposit + grant together. No Yosuku source
 * exists for this sheet (its one-tap was Enoki-sponsored), so it is built in the Ticket's own
 * grammar — Adapted, recorded in the ledger.
 */
export function SessionSheet({ open, onOpenChange, symbol }: SessionSheetProps) {
  const { view, actions, busy } = useSessionKey();
  const [form, setForm] = useState<CapsForm>(CAPS_DEFAULTS);
  const [refusal, setRefusal] = useState<Diagnosis | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const sheet = useBalanceSheet(view.owner);
  const walletBase = sheet?.ok ? sheet.value.spendableBase : null;
  const decimals = view.decimals;
  const terms = view.key ? termsFromForm(form, decimals, view.key.address, view.nowSec) : null;
  const example = workedExample(form, decimals, symbol);
  const enabling = busy === "enabling" || busy === "topping-up";
  const depositShort = terms?.ok && walletBase !== null && walletBase < terms.amountBase;

  const submit = async () => {
    setRefusal(null);
    setFieldError(null);
    const { outcome, topUpError } = await actions.enable(form);
    if (outcome.status === "confirmed") {
      notify.neutral(SESSION.sheet.armed, topUpError ? topUpError : SESSION.sheet.armedBody);
      onOpenChange(false);
      return;
    }
    if (outcome.status === "refused" && outcome.diagnosis.kind === "unknown") setFieldError(outcome.diagnosis.technical);
    else if (outcome.status !== "unknown") setRefusal(outcome.diagnosis);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-dvh overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{SESSION.sheet.title}</SheetTitle>
          <SheetDescription>{SESSION.sheet.intro}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <CapsEditor form={form} onChange={setForm} symbol={symbol} disabled={enabling} />
          {example && <p className="type-caption text-ink-secondary">{example}</p>}
          <p className="type-caption text-ink-muted">{SESSION.sheet.resets}</p>
          <CapabilityReceipt
            keyAddress={view.key?.address ?? null}
            expiresAtSec={view.nowSec + form.expiryHours * 3600}
            sponsorConfigured={view.sponsor?.configured ?? false}
            topUpWei={sessionGasTopUpWei()}
            firstTime={view.grant === null}
          />
          {fieldError && <p className="type-caption text-warning">{fieldError}</p>}
          {depositShort && walletBase !== null && (
            <p className="type-caption text-warning">{SESSION.sheet.errors.walletShort(`${formatMoney(walletBase, decimals)} ${symbol}`)}</p>
          )}
          {refusal && <ErrorState diagnosis={refusal} retry={() => setRefusal(null)} />}
          <Button size="lg" className="w-full" disabled={enabling || view.status === "loading" || !view.owner} onClick={() => void submit()}>
            {busy === "topping-up" ? SESSION.sheet.ctaTopUp : enabling ? SESSION.sheet.ctaBusy : SESSION.sheet.cta}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatMoney(base: bigint, decimals: number): string {
  const whole = base / 10n ** BigInt(decimals);
  const frac = ((base % 10n ** BigInt(decimals)) * 100n) / 10n ** BigInt(decimals);
  return `${whole}.${frac.toString().padStart(2, "0")}`;
}
