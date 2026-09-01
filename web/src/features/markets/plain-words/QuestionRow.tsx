"use client";

import type { EventMarket } from "@masayume/core/types";
import { marketDeepLink } from "@masayume/core/urls";
import { ORACLE_PRICE_SCALE } from "@masayume/markets/identity";
import Link from "next/link";
import { Countdown } from "@/components/data";
import { Button } from "@/components/ui/button";
import { PLAIN_WORDS, plainQuestion } from "@/lib/copy";
import { cn } from "@/lib/utils";

interface QuestionRowProps {
  market: EventMarket;
  nowMs: number;
  selected: boolean;
}

/** The Window as a yes/no question; Yes/No are deep links into the Ticket, so a share link says exactly what was asked. */
export function QuestionRow({ market, nowMs, selected }: QuestionRowProps) {
  const question = plainQuestion(market, ORACLE_PRICE_SCALE);
  return (
    <li
      aria-current={selected ? "true" : undefined}
      className={cn("flex flex-col gap-3 rounded-(--market-card-radius) border bg-(--market-card-surface) p-4", selected ? "border-accent-dim" : "border-(--market-card-border)")}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn("type-body", question.pending ? "text-ink-secondary" : "text-ink")}>{question.text}</p>
        <Countdown expirySec={market.expirySec} intervalSec={market.intervalSec} nowMs={nowMs} />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="border-(--button-up-border) text-(--button-up-ink)" render={<Link href={marketDeepLink({ marketId: market.marketId, dir: "up" })} scroll={false} />}>
          {PLAIN_WORDS.yes}
        </Button>
        <Button variant="outline" size="sm" className="border-(--button-down-border) text-(--button-down-ink)" render={<Link href={marketDeepLink({ marketId: market.marketId, dir: "down" })} scroll={false} />}>
          {PLAIN_WORDS.no}
        </Button>
      </div>
    </li>
  );
}
