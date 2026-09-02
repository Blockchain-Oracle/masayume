"use client";

import { diagnosis } from "@masayume/core/types";
import Link from "next/link";
import { Fixture, FixtureGrid } from "@/app/dev/states/_sections/Fixture";
import { SectionHeader } from "@/components/chrome";
import { LEVERAGE, LeverageBetRow, LeverageStrip } from "@/features/leverage";
import { LeverageChips } from "@/features/markets/ticket";
import { CLOSED, FIXTURE_NOW_MS, FIXTURE_SYMBOL, KNOCKED, LIVE, LIVE_3X, LOST, MARK_AT_LINE, MARK_HEALTHY, MARK_UNPRICED, MARKET, QUOTE, SETTLING, WON } from "./fixtures";

const noop = () => undefined;
const ROW = { market: MARKET, symbol: FIXTURE_SYMBOL, decimals: 6, nowMs: FIXTURE_NOW_MS, busy: null, canSign: true, isOwner: true, onCashOut: noop, onSettle: noop } as const;
const STRIP = { retry: noop, stakeBase: 10_000_000n, side: "up" as const, multiple: 2, decimals: 6, symbol: FIXTURE_SYMBOL };

/** `/dev/leverage` — the chips, the boost's quote strip and the portfolio rows on canned readings. Scaffolding: never linked from the app. */
export function LeverageFixtures() {
  return (
    <div className="container pl-page">
      <SectionHeader index="00" eyebrow="Fixtures" title={LEVERAGE.devTitle} />
      <p className="type-caption text-ink-muted">
        Canned readings only. The live chips are on <Link href="/markets">/markets</Link>, the rows on <Link href="/portfolio">/portfolio</Link>.
      </p>
      <FixtureGrid>
        <Fixture label="Chips — reserve deployed, 2× chosen">
          <LeverageChips value={2} onChange={noop} available maxMultiple={3} lockedReason={null} />
        </Fixture>
        <Fixture label="Chips — no reserve on this network">
          <LeverageChips value={1} onChange={noop} available={false} maxMultiple={1} lockedReason={null} />
        </Fixture>
        <Fixture label="Chips — locked off the wallet route">
          <LeverageChips value={1} onChange={noop} available maxMultiple={3} lockedReason={LEVERAGE.lockedForRoute} />
        </Fixture>
        <Fixture label="Chips — reserve capped at 2×">
          <LeverageChips value={2} onChange={noop} available maxMultiple={2} lockedReason={null} />
        </Fixture>
      </FixtureGrid>
      <FixtureGrid>
        <Fixture label="Strip — 10 at 2× on a 0.60 book">
          <LeverageStrip {...STRIP} quote={QUOTE} loading={false} error={null} />
        </Fixture>
        <Fixture label="Strip — sized to the lot (9.999 charged)">
          <LeverageStrip {...STRIP} quote={{ ...QUOTE, stakeBase: 9_999_295n }} loading={false} error={null} />
        </Fixture>
        <Fixture label="Strip — quoting">
          <LeverageStrip {...STRIP} quote={null} loading error={null} />
        </Fixture>
        <Fixture label="Strip — the reserve refused (thin book)">
          <LeverageStrip {...STRIP} quote={null} loading={false} error={diagnosis("no-liquidity", "ThinBook(0x…, 12000000, 32000000)", { errorName: "ThinBook" })} />
        </Fixture>
      </FixtureGrid>
      <FixtureGrid>
        <Fixture label="Rows — live: healthy, at the line, unpriced; settling">
          <ul className="flex flex-col">
            <LeverageBetRow {...ROW} position={LIVE} mark={MARK_HEALTHY} />
            <LeverageBetRow {...ROW} position={LIVE_3X} mark={MARK_AT_LINE} />
            <LeverageBetRow {...ROW} position={LIVE} mark={MARK_UNPRICED} />
            <LeverageBetRow {...ROW} position={SETTLING} mark={MARK_HEALTHY} />
          </ul>
        </Fixture>
        <Fixture label="Rows — won, lost, knocked out, cashed out">
          <ul className="flex flex-col">
            <LeverageBetRow {...ROW} position={WON} mark={null} />
            <LeverageBetRow {...ROW} position={LOST} mark={null} />
            <LeverageBetRow {...ROW} position={KNOCKED} mark={null} />
            <LeverageBetRow {...ROW} position={CLOSED} mark={null} />
          </ul>
        </Fixture>
      </FixtureGrid>
    </div>
  );
}
